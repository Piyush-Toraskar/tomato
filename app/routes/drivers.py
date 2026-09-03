from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.helpers import get_driver_for_account
from app.security import get_current_account
from app.services import driver_service


router = APIRouter(
    tags=["Drivers"]
)


@router.post(
    "/driver/profile",
    response_model=schemas.DriverResponse,
    status_code=status.HTTP_201_CREATED
)
def create_driver_profile(
    data: schemas.DriverCreate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return driver_service.create_profile(
        db,
        current_account,
        data
    )


@router.post(
    "/driver/link/{driver_id}",
    response_model=schemas.DriverResponse
)
def link_existing_driver(
    driver_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return driver_service.link_existing(
        db,
        current_account,
        driver_id
    )


@router.get(
    "/driver/profile",
    response_model=schemas.DriverResponse
)
def get_my_driver_profile(
    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    driver_service.require_driver_role(
        current_account
    )

    return get_driver_for_account(
        db,
        current_account
    )


@router.put(
    "/driver/location",
    response_model=schemas.DriverLocationResponse
)
def update_driver_location(
    location: schemas.LocationUpdate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return driver_service.update_location(
        db,
        current_account,
        location
    )


@router.patch(
    "/driver/availability",
    response_model=schemas.DriverResponse
)
def update_driver_availability(
    availability: schemas.DriverAvailabilityUpdate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return driver_service.update_availability(
        db,
        current_account,
        availability.is_available
    )


@router.get(
    "/driver/orders",
    response_model=list[
        schemas.OrderResponse
    ]
)
def get_driver_orders(
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
    return driver_service.get_driver_orders(
        db,
        current_account,
        limit=limit,
        offset=offset
    )