from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field
)


class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

    email: str = Field(
        min_length=3,
        max_length=255
    )

    password: str = Field(
        min_length=8,
        max_length=128
    )

    model_config = ConfigDict(
        extra="forbid"
    )


class RegisterResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    email_verified: bool

    debug_verification_token: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str

    device_id: str = Field(
        min_length=1,
        max_length=255
    )

    model_config = ConfigDict(
        extra="forbid"
    )


class RefreshRequest(BaseModel):
    refresh_token: str

    model_config = ConfigDict(
        extra="forbid"
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class AuthMeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    email_verified: bool


class ForgotPasswordRequest(BaseModel):
    email: str

    model_config = ConfigDict(
        extra="forbid"
    )


class ResetPasswordRequest(BaseModel):
    token: str

    new_password: str = Field(
        min_length=8,
        max_length=128
    )

    model_config = ConfigDict(
        extra="forbid"
    )


class VerifyEmailRequest(BaseModel):
    token: str

    model_config = ConfigDict(
        extra="forbid"
    )


class MessageResponse(BaseModel):
    message: str
    debug_token: str | None = None


class RestaurantCreate(BaseModel):
    name: str
    cuisine: str
    address: str


class RestaurantResponse(BaseModel):
    id: int
    name: str
    cuisine: str
    address: str

    model_config = ConfigDict(
        from_attributes=True
    )


class LocationUpdate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ge=-180,
        le=180
    )


class RestaurantLocationResponse(BaseModel):
    id: int
    restaurant_id: int
    latitude: float
    longitude: float

    model_config = ConfigDict(
        from_attributes=True
    )


class MenuItemCreate(BaseModel):
    name: str

    price: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    is_available: bool = True


class MenuItemResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    is_available: bool
    restaurant_id: int

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderItemCreate(BaseModel):
    menu_item_id: int

    quantity: int = Field(
        gt=0
    )


class OrderCreate(BaseModel):
    restaurant_id: int
    items: list[OrderItemCreate]

    model_config = ConfigDict(
        extra="forbid"
    )


class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    quantity: int
    price: Decimal

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    items: list[
        OrderItemResponse
    ]

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderStatusUpdate(BaseModel):
    status: Literal[
        "CONFIRMED",
        "PREPARING",
        "READY",
        "PICKED_UP",
        "DELIVERED",
        "CANCELLED"
    ]


class OrderStatusHistoryResponse(BaseModel):
    id: int
    order_id: int
    from_status: str | None
    to_status: str
    changed_by_user_id: int | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class DriverCreate(BaseModel):
    name: str


class DriverResponse(BaseModel):
    id: int
    name: str
    is_available: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class DriverAvailabilityUpdate(BaseModel):
    is_available: bool


class DriverLocationResponse(BaseModel):
    id: int
    driver_id: int
    latitude: float
    longitude: float

    model_config = ConfigDict(
        from_attributes=True
    )


class DriverAssignmentResponse(BaseModel):
    id: int
    order_id: int
    driver_id: int
    distance_km: float