import hashlib
import json

from datetime import (
    datetime,
    timezone,
)

from decimal import Decimal

from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy.exc import (
    IntegrityError,
    SQLAlchemyError,
)

from sqlalchemy.orm import Session

from app import models, schemas

from app.helpers import (
    calculate_distance,
    get_driver_for_account,
    get_restaurant_for_account,
)

from app.metrics import (
    DRIVER_MATCHING_TOTAL,
)

from app.services.db_transaction import (
    database_transaction,
)


ORDER_STATUS_TRANSITIONS = {
    "PLACED": "CONFIRMED",
    "CONFIRMED": "PREPARING",
    "PREPARING": "READY",
    "READY": "PICKED_UP",
    "PICKED_UP": "DELIVERED",
}


RESTAURANT_CANCELLABLE_STATUSES = {
    "PLACED",
    "CONFIRMED",
    "PREPARING",
    "READY",
}


def utc_now():
    return datetime.now(
        timezone.utc
    )


# =========================================================
# IDEMPOTENCY
# =========================================================


def build_order_request_hash(
    order: schemas.OrderCreate
):
    payload = order.model_dump(
        mode="json"
    )

    canonical_json = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":")
    )

    return hashlib.sha256(
        canonical_json.encode(
            "utf-8"
        )
    ).hexdigest()


def resolve_existing_idempotency_record(
    db: Session,
    user_id: int,
    idempotency_key: str,
    request_hash: str
):
    record = (
        db.query(
            models.OrderIdempotencyRecord
        )
        .filter(
            models.OrderIdempotencyRecord.user_id
            == user_id,

            models.OrderIdempotencyRecord.idempotency_key
            == idempotency_key
        )
        .first()
    )

    if record is None:
        return None

    if record.request_hash != request_hash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Idempotency-Key has already "
                "been used with a different "
                "order request"
            )
        )

    if record.order_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A request with this "
                "Idempotency-Key is still "
                "being processed"
            )
        )

    existing_order = (
        db.query(
            models.Order
        )
        .filter(
            models.Order.id
            == record.order_id
        )
        .first()
    )

    if existing_order is None:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Idempotency record references "
                "a missing order"
            )
        )

    return existing_order


# =========================================================
# STATUS HISTORY
# =========================================================


def add_status_history(
    db: Session,
    order_id: int,
    from_status: str | None,
    to_status: str,
    changed_by_user_id: int | None
):
    history = models.OrderStatusHistory(
        order_id=order_id,
        from_status=from_status,
        to_status=to_status,
        changed_by_user_id=changed_by_user_id
    )

    db.add(
        history
    )


# =========================================================
# DRIVER RELEASE
# =========================================================


def release_driver_for_assignment(
    db: Session,
    assignment: models.DriverAssignment
):
    driver = (
        db.query(
            models.Driver
        )
        .filter(
            models.Driver.id
            == assignment.driver_id
        )
        .with_for_update()
        .first()
    )

    if driver is not None:
        driver.is_available = True

    assignment.completed_at = (
        utc_now()
    )


# =========================================================
# CREATE ORDER
# =========================================================


def create_order(
    db: Session,
    current_account: models.Account,
    order: schemas.OrderCreate,
    idempotency_key: str
):
    if (
        current_account.role
        != "CUSTOMER"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only customers can "
                "place orders"
            )
        )

    idempotency_key = (
        idempotency_key.strip()
    )

    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Idempotency-Key "
                "cannot be empty"
            )
        )

    request_hash = (
        build_order_request_hash(
            order
        )
    )

    existing_order = (
        resolve_existing_idempotency_record(
            db=db,
            user_id=current_account.user_id,
            idempotency_key=idempotency_key,
            request_hash=request_hash
        )
    )

    if existing_order is not None:
        return existing_order

    try:

        idempotency_record = (
            models.OrderIdempotencyRecord(
                user_id=current_account.user_id,
                idempotency_key=idempotency_key,
                request_hash=request_hash,
                order_id=None
            )
        )

        db.add(
            idempotency_record
        )

        # Force the UNIQUE constraint check now.
        db.flush()

        restaurant = (
            db.query(
                models.Restaurant
            )
            .filter(
                models.Restaurant.id
                == order.restaurant_id
            )
            .first()
        )

        if restaurant is None:
            raise HTTPException(
                status_code=(
                    status.HTTP_404_NOT_FOUND
                ),
                detail="Restaurant not found"
            )

        if len(order.items) == 0:
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Order must contain "
                    "at least one item"
                )
            )

        total_amount = Decimal(
            "0.00"
        )

        validated_items = []

        for item in order.items:

            menu_item = (
                db.query(
                    models.MenuItem
                )
                .filter(
                    models.MenuItem.id
                    == item.menu_item_id,

                    models.MenuItem.restaurant_id
                    == order.restaurant_id
                )
                .first()
            )

            if menu_item is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_404_NOT_FOUND
                    ),
                    detail=(
                        f"Menu item "
                        f"{item.menu_item_id} "
                        f"not found"
                    )
                )

            if not menu_item.is_available:
                raise HTTPException(
                    status_code=(
                        status.HTTP_400_BAD_REQUEST
                    ),
                    detail=(
                        f"{menu_item.name} "
                        f"is not available"
                    )
                )

            total_amount += (
                menu_item.price
                * item.quantity
            )

            validated_items.append(
                (
                    menu_item,
                    item.quantity
                )
            )

        new_order = models.Order(
            user_id=current_account.user_id,
            restaurant_id=order.restaurant_id,
            total_amount=total_amount,
            status="PLACED"
        )

        db.add(
            new_order
        )

        db.flush()

        for (
            menu_item,
            quantity
        ) in validated_items:

            new_order_item = (
                models.OrderItem(
                    order_id=new_order.id,
                    menu_item_id=menu_item.id,
                    quantity=quantity,
                    price=menu_item.price
                )
            )

            db.add(
                new_order_item
            )

        add_status_history(
            db=db,
            order_id=new_order.id,
            from_status=None,
            to_status="PLACED",
            changed_by_user_id=(
                current_account.user_id
            )
        )

        idempotency_record.order_id = (
            new_order.id
        )

        db.commit()

        db.refresh(
            new_order
        )

        return new_order

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as exc:
        db.rollback()

        existing_order = (
            resolve_existing_idempotency_record(
                db=db,
                user_id=current_account.user_id,
                idempotency_key=idempotency_key,
                request_hash=request_hash
            )
        )

        if existing_order is not None:
            return existing_order

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Order could not be created "
                "because of a database conflict"
            )
        ) from exc

    except SQLAlchemyError as exc:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Database operation failed"
            )
        ) from exc


# =========================================================
# CUSTOMER ORDER LIST
# =========================================================


def get_customer_orders(
    db: Session,
    current_account: models.Account,
    *,
    limit: int = 20,
    offset: int = 0
):
    if (
        current_account.role
        != "CUSTOMER"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only customers can "
                "access this endpoint"
            )
        )

    return (
        db.query(
            models.Order
        )
        .filter(
            models.Order.user_id
            == current_account.user_id
        )
        .order_by(
            models.Order.created_at.desc(),
            models.Order.id.desc()
        )
        .offset(
            offset
        )
        .limit(
            limit
        )
        .all()
    )


# =========================================================
# SINGLE ORDER
# =========================================================


def get_order_by_id(
    db: Session,
    current_account: models.Account,
    order_id: int
):
    order = (
        db.query(
            models.Order
        )
        .filter(
            models.Order.id
            == order_id
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    if (
        current_account.role
        == "CUSTOMER"
    ):

        if (
            order.user_id
            != current_account.user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You cannot access another "
                    "customer's order"
                )
            )

    elif (
        current_account.role
        == "RESTAURANT"
    ):

        restaurant = (
            get_restaurant_for_account(
                db,
                current_account
            )
        )

        if (
            order.restaurant_id
            != restaurant.id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This order does not belong "
                    "to your restaurant"
                )
            )

    elif (
        current_account.role
        == "DRIVER"
    ):

        driver = (
            get_driver_for_account(
                db,
                current_account
            )
        )

        assignment = (
            db.query(
                models.DriverAssignment
            )
            .filter(
                models.DriverAssignment.order_id
                == order.id,

                models.DriverAssignment.driver_id
                == driver.id
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This order is not "
                    "assigned to you"
                )
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access "
                "this order"
            )
        )

    return order


def get_order_history(
    db: Session,
    current_account: models.Account,
    order_id: int
):
    get_order_by_id(
        db,
        current_account,
        order_id
    )

    return (
        db.query(
            models.OrderStatusHistory
        )
        .filter(
            models.OrderStatusHistory.order_id
            == order_id
        )
        .order_by(
            models.OrderStatusHistory.id
        )
        .all()
    )


# =========================================================
# STATUS UPDATE / CANCELLATION
# =========================================================


def update_order_status(
    db: Session,
    current_account: models.Account,
    order_id: int,
    status_update: schemas.OrderStatusUpdate
):
    with database_transaction(
        db,
        conflict_detail=(
            "Order changed concurrently. "
            "Please retry."
        )
    ):
        order = (
            db.query(
                models.Order
            )
            .filter(
                models.Order.id
                == order_id
            )
            .with_for_update()
            .first()
        )

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        old_status = order.status

        requested_status = (
            status_update.status
        )

        if old_status == "DELIVERED":
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Order has already "
                    "been delivered"
                )
            )

        if old_status == "CANCELLED":
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Order has already "
                    "been cancelled"
                )
            )

        # -------------------------------------------------
        # CANCELLATION
        # -------------------------------------------------

        if requested_status == "CANCELLED":

            if (
                current_account.role
                == "CUSTOMER"
            ):

                if (
                    order.user_id
                    != current_account.user_id
                ):
                    raise HTTPException(
                        status_code=(
                            status.HTTP_403_FORBIDDEN
                        ),
                        detail=(
                            "You cannot cancel another "
                            "customer's order"
                        )
                    )

                if old_status != "PLACED":
                    raise HTTPException(
                        status_code=(
                            status.HTTP_400_BAD_REQUEST
                        ),
                        detail=(
                            "Customer can only cancel "
                            "an order while it is PLACED"
                        )
                    )

            elif (
                current_account.role
                == "RESTAURANT"
            ):

                restaurant = (
                    get_restaurant_for_account(
                        db,
                        current_account
                    )
                )

                if (
                    order.restaurant_id
                    != restaurant.id
                ):
                    raise HTTPException(
                        status_code=(
                            status.HTTP_403_FORBIDDEN
                        ),
                        detail=(
                            "This order does not belong "
                            "to your restaurant"
                        )
                    )

                if (
                    old_status
                    not in
                    RESTAURANT_CANCELLABLE_STATUSES
                ):
                    raise HTTPException(
                        status_code=(
                            status.HTTP_400_BAD_REQUEST
                        ),
                        detail=(
                            "Restaurant cannot cancel "
                            "this order at its "
                            "current status"
                        )
                    )

            else:
                raise HTTPException(
                    status_code=(
                        status.HTTP_403_FORBIDDEN
                    ),
                    detail=(
                        "Drivers cannot "
                        "cancel orders"
                    )
                )

            assignment = (
                db.query(
                    models.DriverAssignment
                )
                .filter(
                    models.DriverAssignment.order_id
                    == order.id
                )
                .first()
            )

            if assignment is not None:
                release_driver_for_assignment(
                    db,
                    assignment
                )

            order.status = (
                "CANCELLED"
            )

            add_status_history(
                db=db,
                order_id=order.id,
                from_status=old_status,
                to_status="CANCELLED",
                changed_by_user_id=(
                    current_account.user_id
                )
            )

            return order

        # -------------------------------------------------
        # NORMAL TRANSITION
        # -------------------------------------------------

        next_status = (
            ORDER_STATUS_TRANSITIONS.get(
                old_status
            )
        )

        if (
            requested_status
            != next_status
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    f"Order can only move from "
                    f"{old_status} "
                    f"to {next_status}"
                )
            )

        if (
            current_account.role
            == "RESTAURANT"
        ):

            restaurant = (
                get_restaurant_for_account(
                    db,
                    current_account
                )
            )

            if (
                order.restaurant_id
                != restaurant.id
            ):
                raise HTTPException(
                    status_code=(
                        status.HTTP_403_FORBIDDEN
                    ),
                    detail=(
                        "This order does not belong "
                        "to your restaurant"
                    )
                )

            allowed_restaurant_statuses = {
                "CONFIRMED",
                "PREPARING",
                "READY",
            }

            if (
                requested_status
                not in allowed_restaurant_statuses
            ):
                raise HTTPException(
                    status_code=(
                        status.HTTP_403_FORBIDDEN
                    ),
                    detail=(
                        "Restaurant can only move "
                        "orders through CONFIRMED, "
                        "PREPARING and READY"
                    )
                )

        elif (
            current_account.role
            == "DRIVER"
        ):

            driver = (
                get_driver_for_account(
                    db,
                    current_account
                )
            )

            assignment = (
                db.query(
                    models.DriverAssignment
                )
                .filter(
                    models.DriverAssignment.order_id
                    == order.id,

                    models.DriverAssignment.driver_id
                    == driver.id
                )
                .first()
            )

            if assignment is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_403_FORBIDDEN
                    ),
                    detail=(
                        "This order is not "
                        "assigned to you"
                    )
                )

            allowed_driver_statuses = {
                "PICKED_UP",
                "DELIVERED",
            }

            if (
                requested_status
                not in allowed_driver_statuses
            ):
                raise HTTPException(
                    status_code=(
                        status.HTTP_403_FORBIDDEN
                    ),
                    detail=(
                        "Driver can only move "
                        "orders through PICKED_UP "
                        "and DELIVERED"
                    )
                )

        else:
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "Customers cannot "
                    "update order status"
                )
            )

        order.status = (
            requested_status
        )

        if (
            requested_status
            == "DELIVERED"
        ):

            assignment = (
                db.query(
                    models.DriverAssignment
                )
                .filter(
                    models.DriverAssignment.order_id
                    == order.id
                )
                .first()
            )

            if assignment is not None:
                release_driver_for_assignment(
                    db,
                    assignment
                )

        add_status_history(
            db=db,
            order_id=order.id,
            from_status=old_status,
            to_status=requested_status,
            changed_by_user_id=(
                current_account.user_id
            )
        )

    db.refresh(
        order
    )

    return order


# =========================================================
# DRIVER ASSIGNMENT
# =========================================================


def assign_driver_to_order(
    db: Session,
    current_account: models.Account,
    order_id: int
):
    if (
        current_account.role
        != "RESTAURANT"
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Only restaurants "
                "can assign drivers"
            )
        )

    assignment = None
    selected_distance = None

    with database_transaction(
        db,
        conflict_detail=(
            "Driver assignment changed "
            "concurrently. Please retry."
        )
    ):
        restaurant = (
            get_restaurant_for_account(
                db,
                current_account
            )
        )

        order = (
            db.query(
                models.Order
            )
            .filter(
                models.Order.id
                == order_id
            )
            .with_for_update()
            .first()
        )

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if (
            order.restaurant_id
            != restaurant.id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "This order does not belong "
                    "to your restaurant"
                )
            )

        if order.status != "READY":
            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Driver can only be "
                    "assigned to a READY order"
                )
            )

        existing_assignment = (
            db.query(
                models.DriverAssignment
            )
            .filter(
                models.DriverAssignment.order_id
                == order_id
            )
            .first()
        )

        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Driver already assigned"
                )
            )

        restaurant_location = (
            db.query(
                models.RestaurantLocation
            )
            .filter(
                models.RestaurantLocation.restaurant_id
                == restaurant.id
            )
            .first()
        )

        if restaurant_location is None:

            DRIVER_MATCHING_TOTAL.labels(
                result=(
                    "restaurant_location_missing"
                )
            ).inc()

            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    "Restaurant location "
                    "is not set"
                )
            )

        candidate_rows = (
            db.query(
                models.Driver.id.label(
                    "driver_id"
                ),

                models.DriverLocation.latitude,

                models.DriverLocation.longitude
            )
            .join(
                models.DriverAccount,
                models.DriverAccount.driver_id
                == models.Driver.id
            )
            .join(
                models.DriverLocation,
                models.DriverLocation.driver_id
                == models.Driver.id
            )
            .filter(
                models.Driver.is_available.is_(
                    True
                )
            )
            .all()
        )

        candidate_distances = []

        for candidate in candidate_rows:

            distance = (
                calculate_distance(
                    restaurant_location.latitude,
                    restaurant_location.longitude,
                    candidate.latitude,
                    candidate.longitude
                )
            )

            candidate_distances.append(
                (
                    candidate.driver_id,
                    distance
                )
            )

        candidate_distances.sort(
            key=lambda candidate: candidate[1]
        )

        selected_driver = None

        for (
            candidate_driver_id,
            candidate_distance
        ) in candidate_distances:

            locked_driver = (
                db.query(
                    models.Driver
                )
                .filter(
                    models.Driver.id
                    == candidate_driver_id,

                    models.Driver.is_available.is_(
                        True
                    )
                )
                .with_for_update(
                    skip_locked=True
                )
                .populate_existing()
                .first()
            )

            if locked_driver is None:
                continue

            selected_driver = (
                locked_driver
            )

            selected_distance = (
                candidate_distance
            )

            break

        if selected_driver is None:

            DRIVER_MATCHING_TOTAL.labels(
                result="no_available_driver"
            ).inc()

            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "No available driver could "
                    "be claimed at this time"
                )
            )

        selected_driver.is_available = (
            False
        )

        assignment = (
            models.DriverAssignment(
                order_id=order_id,
                driver_id=selected_driver.id,

                distance_km=Decimal(
                    str(
                        round(
                            selected_distance,
                            3
                        )
                    )
                )
            )
        )

        db.add(
            assignment
        )

        db.flush()

    db.refresh(
        assignment
    )

    DRIVER_MATCHING_TOTAL.labels(
        result="success"
    ).inc()

    return {
        "id": assignment.id,
        "order_id": (
            assignment.order_id
        ),
        "driver_id": (
            assignment.driver_id
        ),
        "distance_km": float(
            assignment.distance_km
        ),
    }


# =========================================================
# GET ASSIGNED DRIVER
# =========================================================


def get_order_driver(
    db: Session,
    current_account: models.Account,
    order_id: int
):
    order = (
        db.query(
            models.Order
        )
        .filter(
            models.Order.id
            == order_id
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    assignment = (
        db.query(
            models.DriverAssignment
        )
        .filter(
            models.DriverAssignment.order_id
            == order_id
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No driver assigned"
        )

    if (
        current_account.role
        == "CUSTOMER"
    ):

        if (
            order.user_id
            != current_account.user_id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail="This is not your order"
            )

    elif (
        current_account.role
        == "RESTAURANT"
    ):

        restaurant = (
            get_restaurant_for_account(
                db,
                current_account
            )
        )

        if (
            order.restaurant_id
            != restaurant.id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "This order does not belong "
                    "to your restaurant"
                )
            )

    elif (
        current_account.role
        == "DRIVER"
    ):

        driver = (
            get_driver_for_account(
                db,
                current_account
            )
        )

        if (
            assignment.driver_id
            != driver.id
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_403_FORBIDDEN
                ),
                detail=(
                    "This order is not "
                    "assigned to you"
                )
            )

    else:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail="Access denied"
        )

    driver = (
        db.query(
            models.Driver
        )
        .filter(
            models.Driver.id
            == assignment.driver_id
        )
        .first()
    )

    return driver