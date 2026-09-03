from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas

from app.helpers import (
    get_restaurant_for_account,
)

from app.services.db_transaction import (
    database_transaction,
)


def require_restaurant_role(
    account: models.Account
):
    if account.role != "RESTAURANT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only restaurant accounts "
                "can access this operation"
            )
        )


def create_profile(
    db: Session,
    account: models.Account,
    data: schemas.RestaurantCreate
):
    require_restaurant_role(
        account
    )

    existing_link = (
        db.query(
            models.RestaurantAccount
        )
        .filter(
            models.RestaurantAccount.account_id
            == account.id
        )
        .first()
    )

    if existing_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Restaurant account already "
                "has a restaurant profile"
            )
        )

    restaurant = models.Restaurant(
        name=data.name,
        cuisine=data.cuisine,
        address=data.address
    )

    try:
        db.add(
            restaurant
        )

        db.flush()

        link = models.RestaurantAccount(
            account_id=account.id,
            restaurant_id=restaurant.id
        )

        db.add(
            link
        )

        db.commit()

        db.refresh(
            restaurant
        )

        return restaurant

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Restaurant profile could "
                "not be created"
            )
        ) from exc

    except Exception:
        db.rollback()
        raise


def link_existing(
    db: Session,
    account: models.Account,
    restaurant_id: int
):
    require_restaurant_role(
        account
    )

    existing_account_link = (
        db.query(
            models.RestaurantAccount
        )
        .filter(
            models.RestaurantAccount.account_id
            == account.id
        )
        .first()
    )

    if existing_account_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This account already has "
                "a restaurant profile"
            )
        )

    restaurant = (
        db.query(
            models.Restaurant
        )
        .filter(
            models.Restaurant.id
            == restaurant_id
        )
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    existing_restaurant_link = (
        db.query(
            models.RestaurantAccount
        )
        .filter(
            models.RestaurantAccount.restaurant_id
            == restaurant_id
        )
        .first()
    )

    if existing_restaurant_link is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Restaurant is already linked "
                "to another account"
            )
        )

    try:
        link = models.RestaurantAccount(
            account_id=account.id,
            restaurant_id=restaurant.id
        )

        db.add(
            link
        )

        db.commit()

        return restaurant

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Restaurant is already linked"
            )
        ) from exc

    except Exception:
        db.rollback()
        raise


def update_location(
    db: Session,
    account: models.Account,
    location: schemas.LocationUpdate
):
    require_restaurant_role(
        account
    )

    restaurant = (
        get_restaurant_for_account(
            db,
            account
        )
    )

    with database_transaction(
        db,
        conflict_detail=(
            "Restaurant location changed "
            "concurrently. Please retry."
        )
    ):
        row = (
            db.query(
                models.RestaurantLocation
            )
            .filter(
                models.RestaurantLocation.restaurant_id
                == restaurant.id
            )
            .with_for_update()
            .first()
        )

        if row is None:
            row = models.RestaurantLocation(
                restaurant_id=restaurant.id,
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


def create_menu_item(
    db: Session,
    account: models.Account,
    menu_item: schemas.MenuItemCreate
):
    require_restaurant_role(
        account
    )

    restaurant = (
        get_restaurant_for_account(
            db,
            account
        )
    )

    row = models.MenuItem(
        name=menu_item.name,
        price=menu_item.price,
        is_available=menu_item.is_available,
        restaurant_id=restaurant.id
    )

    try:
        db.add(
            row
        )

        db.commit()

        db.refresh(
            row
        )

        return row

    except Exception:
        db.rollback()
        raise


# =========================================================
# PUBLIC LISTING
# =========================================================


def get_public_restaurants(
    db: Session,
    *,
    limit: int,
    offset: int
):
    return (
        db.query(
            models.Restaurant
        )
        .order_by(
            models.Restaurant.id
        )
        .offset(
            offset
        )
        .limit(
            limit
        )
        .all()
    )


def get_public_restaurant(
    db: Session,
    restaurant_id: int
):
    restaurant = (
        db.query(
            models.Restaurant
        )
        .filter(
            models.Restaurant.id
            == restaurant_id
        )
        .first()
    )

    if restaurant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    return restaurant


def get_public_menu(
    db: Session,
    restaurant_id: int,
    *,
    limit: int,
    offset: int
):
    get_public_restaurant(
        db,
        restaurant_id
    )

    return (
        db.query(
            models.MenuItem
        )
        .filter(
            models.MenuItem.restaurant_id
            == restaurant_id
        )
        .order_by(
            models.MenuItem.id
        )
        .offset(
            offset
        )
        .limit(
            limit
        )
        .all()
    )


def get_restaurant_orders(
    db: Session,
    account: models.Account,
    *,
    limit: int,
    offset: int
):
    require_restaurant_role(
        account
    )

    restaurant = (
        get_restaurant_for_account(
            db,
            account
        )
    )

    return (
        db.query(
            models.Order
        )
        .filter(
            models.Order.restaurant_id
            == restaurant.id
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