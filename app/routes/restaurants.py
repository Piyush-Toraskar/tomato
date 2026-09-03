from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.helpers import get_restaurant_for_account
from app.security import get_current_account
from app.services import restaurant_service


router = APIRouter(
    tags=["Restaurants"]
)


# =========================================================
# PUBLIC ENDPOINTS
# =========================================================


@router.get(
    "/restaurants",
    response_model=list[
        schemas.RestaurantResponse
    ]
)
def get_restaurants(
    limit: int = Query(
        20,
        ge=1,
        le=100
    ),

    offset: int = Query(
        0,
        ge=0
    ),

    db: Session = Depends(get_db)
):
    return (
        restaurant_service
        .get_public_restaurants(
            db,
            limit=limit,
            offset=offset
        )
    )


@router.get(
    "/restaurants/{restaurant_id}",
    response_model=schemas.RestaurantResponse
)
def get_restaurant(
    restaurant_id: int,

    db: Session = Depends(get_db)
):
    return (
        restaurant_service
        .get_public_restaurant(
            db,
            restaurant_id
        )
    )


@router.get(
    "/restaurants/{restaurant_id}/menu",
    response_model=list[
        schemas.MenuItemResponse
    ]
)
def get_restaurant_menu(
    restaurant_id: int,

    limit: int = Query(
        20,
        ge=1,
        le=100
    ),

    offset: int = Query(
        0,
        ge=0
    ),

    db: Session = Depends(get_db)
):
    return (
        restaurant_service
        .get_public_menu(
            db,
            restaurant_id,
            limit=limit,
            offset=offset
        )
    )


# =========================================================
# RESTAURANT ACCOUNT ENDPOINTS
# =========================================================


@router.post(
    "/restaurant/profile",
    response_model=schemas.RestaurantResponse,
    status_code=status.HTTP_201_CREATED
)
def create_restaurant_profile(
    data: schemas.RestaurantCreate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return restaurant_service.create_profile(
        db,
        current_account,
        data
    )


@router.post(
    "/restaurant/link/{restaurant_id}",
    response_model=schemas.RestaurantResponse
)
def link_existing_restaurant(
    restaurant_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return restaurant_service.link_existing(
        db,
        current_account,
        restaurant_id
    )


@router.get(
    "/restaurant/profile",
    response_model=schemas.RestaurantResponse
)
def get_my_restaurant(
    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    restaurant_service.require_restaurant_role(
        current_account
    )

    return get_restaurant_for_account(
        db,
        current_account
    )


@router.put(
    "/restaurant/location",
    response_model=schemas.RestaurantLocationResponse
)
def update_restaurant_location(
    location: schemas.LocationUpdate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return restaurant_service.update_location(
        db,
        current_account,
        location
    )


@router.post(
    "/restaurant/menu",
    response_model=schemas.MenuItemResponse,
    status_code=status.HTTP_201_CREATED
)
def create_menu_item(
    menu_item: schemas.MenuItemCreate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return restaurant_service.create_menu_item(
        db,
        current_account,
        menu_item
    )


@router.get(
    "/restaurant/orders",
    response_model=list[
        schemas.OrderResponse
    ]
)
def get_restaurant_orders(
    limit: int = Query(
        20,
        ge=1,
        le=100
    ),

    offset: int = Query(
        0,
        ge=0
    ),

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return (
        restaurant_service
        .get_restaurant_orders(
            db,
            current_account,
            limit=limit,
            offset=offset
        )
    )