from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas

from app.helpers import (
    get_driver_for_account,
)

from app.services.db_transaction import (
    database_transaction,
)


def require_driver_role(
    account: models.Account
):
    if account.role != "DRIVER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only driver accounts "
                "can access this operation"
            )
        )


def create_profile(
    db: Session,
    account: models.Account,
    data: schemas.DriverCreate
):
    require_driver_role(
        account
    )

    existing_link = (
        db.query(
            models.DriverAccount
        )
        .filter(
            models.DriverAccount.account_id
            == account.id
        )
        .first()
    )

    if existing_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Driver account already "
                "has a driver profile"
            )
        )

    driver = models.Driver(
        name=data.name,
        is_available=True
    )

    try:
        db.add(
            driver
        )

        db.flush()

        link = models.DriverAccount(
            account_id=account.id,
            driver_id=driver.id
        )

        db.add(
            link
        )

        db.commit()

        db.refresh(
            driver
        )

        return driver

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Driver profile could "
                "not be created"
            )
        ) from exc

    except Exception:
        db.rollback()
        raise


def link_existing(
    db: Session,
    account: models.Account,
    driver_id: int
):
    require_driver_role(
        account
    )

    account_link = (
        db.query(
            models.DriverAccount
        )
        .filter(
            models.DriverAccount.account_id
            == account.id
        )
        .first()
    )

    if account_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This account already "
                "has a driver profile"
            )
        )

    driver = (
        db.query(
            models.Driver
        )
        .filter(
            models.Driver.id
            == driver_id
        )
        .first()
    )

    if driver is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    driver_link = (
        db.query(
            models.DriverAccount
        )
        .filter(
            models.DriverAccount.driver_id
            == driver_id
        )
        .first()
    )

    if driver_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Driver is already linked "
                "to another account"
            )
        )

    try:
        db.add(
            models.DriverAccount(
                account_id=account.id,
                driver_id=driver.id
            )
        )

        db.commit()

        return driver

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Driver is already linked"
        ) from exc

    except Exception:
        db.rollback()
        raise


def update_location(
    db: Session,
    account: models.Account,
    location: schemas.LocationUpdate
):
    require_driver_role(
        account
    )

    driver = get_driver_for_account(
        db,
        account
    )

    with database_transaction(
        db,
        conflict_detail=(
            "Driver location changed "
            "concurrently. Please retry."
        )
    ):
        locked_driver = (
            db.query(
                models.Driver
            )
            .filter(
                models.Driver.id
                == driver.id
            )
            .with_for_update()
            .first()
        )

        if locked_driver is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found"
            )

        row = (
            db.query(
                models.DriverLocation
            )
            .filter(
                models.DriverLocation.driver_id
                == driver.id
            )
            .first()
        )

        if row is None:
            row = models.DriverLocation(
                driver_id=driver.id,
                latitude=location.latitude,
                longitude=location.longitude
            )

            db.add(
                row
            )

            db.flush()

        else:
            row.latitude = (
                location.latitude
            )

            row.longitude = (
                location.longitude
            )

    db.refresh(
        row
    )

    return row


def update_availability(
    db: Session,
    account: models.Account,
    is_available: bool
):
    require_driver_role(
        account
    )

    driver = get_driver_for_account(
        db,
        account
    )

    with database_transaction(
        db,
        conflict_detail=(
            "Driver availability changed "
            "concurrently. Please retry."
        )
    ):
        locked_driver = (
            db.query(
                models.Driver
            )
            .filter(
                models.Driver.id
                == driver.id
            )
            .with_for_update()
            .first()
        )

        if locked_driver is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found"
            )

        if is_available:

            active_assignment = (
                db.query(
                    models.DriverAssignment
                )
                .join(
                    models.Order,
                    models.Order.id
                    == models.DriverAssignment.order_id
                )
                .filter(
                    models.DriverAssignment.driver_id
                    == locked_driver.id,

                    models.DriverAssignment.completed_at.is_(
                        None
                    ),

                    models.Order.status.notin_(
                        [
                            "DELIVERED",
                            "CANCELLED",
                        ]
                    )
                )
                .first()
            )

            if active_assignment is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Driver cannot become "
                        "available while an active "
                        "order is assigned"
                    )
                )

        locked_driver.is_available = (
            is_available
        )

    db.refresh(
        locked_driver
    )

    return locked_driver


def get_driver_orders(
    db: Session,
    account: models.Account,
    *,
    limit: int,
    offset: int
):
    require_driver_role(
        account
    )

    driver = get_driver_for_account(
        db,
        account
    )

    return (
        db.query(
            models.Order
        )
        .join(
            models.DriverAssignment,
            models.DriverAssignment.order_id
            == models.Order.id
        )
        .filter(
            models.DriverAssignment.driver_id
            == driver.id
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