from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)

from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    email_verified = Column(
        Boolean,
        nullable=False,
        default=False
    )

    account = relationship(
        "Account",
        back_populates="user",
        uselist=False
    )

    auth_sessions = relationship(
        "AuthSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    orders = relationship(
        "Order",
        back_populates="user"
    )

    email_verification_tokens = relationship(
        "EmailVerificationToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    order_idempotency_records = relationship(
        "OrderIdempotencyRecord",
        back_populates="user"
    )


class Account(Base):
    __tablename__ = "accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="account"
    )

    restaurant_account = relationship(
        "RestaurantAccount",
        back_populates="account",
        uselist=False
    )

    driver_account = relationship(
        "DriverAccount",
        back_populates="account",
        uselist=False
    )


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "device_id",
            name="unique_user_device"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    device_id = Column(
        String,
        nullable=False
    )

    active_jti = Column(
        String,
        nullable=False
    )

    refresh_token_hash = Column(
        String(64),
        nullable=True
    )

    refresh_expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    last_used_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    revoked_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="auth_sessions"
    )


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    token_hash = Column(
        String(64),
        unique=True,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    used_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="email_verification_tokens"
    )


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    token_hash = Column(
        String(64),
        unique=True,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    used_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="password_reset_tokens"
    )


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    cuisine = Column(
        String,
        nullable=False
    )

    address = Column(
        String,
        nullable=False
    )

    menu_items = relationship(
        "MenuItem",
        back_populates="restaurant"
    )

    orders = relationship(
        "Order",
        back_populates="restaurant"
    )

    location = relationship(
        "RestaurantLocation",
        back_populates="restaurant",
        uselist=False
    )

    account_link = relationship(
        "RestaurantAccount",
        back_populates="restaurant",
        uselist=False
    )


class RestaurantAccount(Base):
    __tablename__ = "restaurant_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.id"),
        unique=True,
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        unique=True,
        nullable=False
    )

    account = relationship(
        "Account",
        back_populates="restaurant_account"
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="account_link"
    )


class RestaurantLocation(Base):
    __tablename__ = "restaurant_locations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        unique=True,
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="location"
    )


class MenuItem(Base):
    __tablename__ = "menu_items"

    __table_args__ = (
        Index(
            "ix_menu_items_restaurant_id_id",
            "restaurant_id",
            "id"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    price = Column(
        Numeric(12, 2),
        nullable=False
    )

    is_available = Column(
        Boolean,
        default=True,
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="menu_items"
    )

    order_items = relationship(
        "OrderItem",
        back_populates="menu_item"
    )


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        Index(
            "ix_orders_user_created_id",
            "user_id",
            "created_at",
            "id"
        ),

        Index(
            "ix_orders_restaurant_created_id",
            "restaurant_id",
            "created_at",
            "id"
        ),

        Index(
            "ix_orders_restaurant_status",
            "restaurant_id",
            "status"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("restaurants.id"),
        nullable=False
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    status = Column(
        String,
        nullable=False,
        default="PLACED"
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    user = relationship(
        "User",
        back_populates="orders"
    )

    restaurant = relationship(
        "Restaurant",
        back_populates="orders"
    )

    items = relationship(
        "OrderItem",
        back_populates="order"
    )

    driver_assignment = relationship(
        "DriverAssignment",
        back_populates="order",
        uselist=False
    )

    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.id"
    )

    idempotency_record = relationship(
        "OrderIdempotencyRecord",
        back_populates="order",
        uselist=False
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    __table_args__ = (
        Index(
            "ix_order_items_order_id",
            "order_id"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False
    )

    menu_item_id = Column(
        Integer,
        ForeignKey("menu_items.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    price = Column(
        Numeric(12, 2),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    order = relationship(
        "Order",
        back_populates="items"
    )

    menu_item = relationship(
        "MenuItem",
        back_populates="order_items"
    )


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )

    from_status = Column(
        String,
        nullable=True
    )

    to_status = Column(
        String,
        nullable=False
    )

    changed_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    order = relationship(
        "Order",
        back_populates="status_history"
    )

    changed_by_user = relationship(
        "User"
    )


class OrderIdempotencyRecord(Base):
    __tablename__ = "order_idempotency_records"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_order_idempotency_user_key"
        ),

        UniqueConstraint(
            "order_id",
            name="uq_order_idempotency_order_id"
        ),
    )

    id = Column(
        Integer,
        primary_key=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    idempotency_key = Column(
        String(255),
        nullable=False
    )

    request_hash = Column(
        String(64),
        nullable=False
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="order_idempotency_records"
    )

    order = relationship(
        "Order",
        back_populates="idempotency_record"
    )


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    is_available = Column(
        Boolean,
        nullable=False,
        default=True
    )

    assignments = relationship(
        "DriverAssignment",
        back_populates="driver"
    )

    location = relationship(
        "DriverLocation",
        back_populates="driver",
        uselist=False
    )

    account_link = relationship(
        "DriverAccount",
        back_populates="driver",
        uselist=False
    )


class DriverAccount(Base):
    __tablename__ = "driver_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    account_id = Column(
        Integer,
        ForeignKey("accounts.id"),
        unique=True,
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        unique=True,
        nullable=False
    )

    account = relationship(
        "Account",
        back_populates="driver_account"
    )

    driver = relationship(
        "Driver",
        back_populates="account_link"
    )


class DriverLocation(Base):
    __tablename__ = "driver_locations"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        unique=True,
        nullable=False
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    driver = relationship(
        "Driver",
        back_populates="location"
    )


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    __table_args__ = (
        Index(
            "ix_driver_assignments_driver_order",
            "driver_id",
            "order_id"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        unique=True,
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    distance_km = Column(
        Numeric(10, 3),
        nullable=True
    )

    assigned_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    order = relationship(
        "Order",
        back_populates="driver_assignment"
    )

    driver = relationship(
        "Driver",
        back_populates="assignments"
    )