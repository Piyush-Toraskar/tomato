from fastapi import (
    APIRouter,
    Depends,
    Header,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import get_current_account
from app.services import order_service
from app.kafka_client import kafka_producer


router = APIRouter(
    tags=["Orders"]
)


@router.post(
    "/orders",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_order(
    order: schemas.OrderCreate,

    idempotency_key: str = Header(
        ...,
        alias="Idempotency-Key",
        min_length=1,
        max_length=255
    ),

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    created = order_service.create_order(
        db, current_account, order, idempotency_key
    )
    await kafka_producer.send_order_event(
        "order_created", created.id,
        restaurant_id=created.restaurant_id,
        customer_id=created.user_id,
        status=created.status,
        total_amount=str(created.total_amount),
    )
    return created


@router.get(
    "/orders",
    response_model=list[
        schemas.OrderResponse
    ]
)
def get_my_orders(
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
    return order_service.get_customer_orders(
        db,
        current_account,
        limit=limit,
        offset=offset
    )


@router.get(
    "/orders/{order_id}/history",
    response_model=list[
        schemas.OrderStatusHistoryResponse
    ]
)
def get_order_history(
    order_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return order_service.get_order_history(
        db,
        current_account,
        order_id
    )


@router.get(
    "/orders/{order_id}",
    response_model=schemas.OrderResponse
)
def get_order(
    order_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return order_service.get_order_by_id(
        db,
        current_account,
        order_id
    )


@router.patch(
    "/orders/{order_id}/status",
    response_model=schemas.OrderResponse
)
async def update_order_status(
    order_id: int,

    status_update: schemas.OrderStatusUpdate,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    updated = order_service.update_order_status(
        db, current_account, order_id, status_update
    )
    await kafka_producer.send_order_event(
        "order_status_changed", updated.id, status=updated.status
    )
    return updated


@router.post(
    "/orders/{order_id}/assign-driver",
    response_model=schemas.DriverAssignmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def assign_driver(
    order_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    assignment = order_service.assign_driver_to_order(
        db, current_account, order_id
    )
    await kafka_producer.send_order_event(
        "driver_assigned", order_id, driver_id=assignment["driver_id"]
    )
    return assignment


@router.get(
    "/orders/{order_id}/driver",
    response_model=schemas.DriverResponse
)
def get_order_driver(
    order_id: int,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    return order_service.get_order_driver(
        db,
        current_account,
        order_id
    )