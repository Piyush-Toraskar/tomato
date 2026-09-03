"""baseline existing schema

Revision ID: e738b2ddcfb4
Revises:

This migration represents the application's schema before
authentication hardening was introduced.

The original development database already contained this
schema and was stamped at this revision.

Fresh databases can now run this migration to construct
the original schema before applying later migrations.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e738b2ddcfb4"

down_revision: Union[
    str,
    Sequence[str],
    None
] = None

branch_labels: Union[
    str,
    Sequence[str],
    None
] = None

depends_on: Union[
    str,
    Sequence[str],
    None
] = None


def upgrade() -> None:

    # -------------------------------------------------
    # USERS
    # -------------------------------------------------

    op.create_table(
        "users",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "email",
            sa.String(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "email"
        )
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=False
    )

    # -------------------------------------------------
    # ACCOUNTS
    # -------------------------------------------------

    op.create_table(
        "accounts",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "password_hash",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "role",
            sa.String(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "user_id"
        )
    )

    # -------------------------------------------------
    # AUTH SESSIONS - ORIGINAL VERSION
    # -------------------------------------------------

    op.create_table(
        "auth_sessions",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "device_id",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "active_jti",
            sa.String(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "user_id",
            "device_id",
            name="unique_user_device"
        )
    )

    # -------------------------------------------------
    # RESTAURANTS
    # -------------------------------------------------

    op.create_table(
        "restaurants",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "cuisine",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "address",
            sa.String(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    # -------------------------------------------------
    # RESTAURANT ACCOUNT OWNERSHIP
    # -------------------------------------------------

    op.create_table(
        "restaurant_accounts",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "account_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["account_id"],
            ["accounts.id"]
        ),

        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "account_id"
        ),

        sa.UniqueConstraint(
            "restaurant_id"
        )
    )

    # -------------------------------------------------
    # RESTAURANT LOCATIONS
    # -------------------------------------------------

    op.create_table(
        "restaurant_locations",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "restaurant_id"
        )
    )

    # -------------------------------------------------
    # MENU ITEMS - ORIGINAL FLOAT VERSION
    # -------------------------------------------------

    op.create_table(
        "menu_items",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "price",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "is_available",
            sa.Boolean(),
            nullable=False
        ),

        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    # -------------------------------------------------
    # ORDERS - ORIGINAL FLOAT VERSION
    # -------------------------------------------------

    op.create_table(
        "orders",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "restaurant_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "total_amount",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "status",
            sa.String(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"]
        ),

        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    # -------------------------------------------------
    # ORDER ITEMS
    # -------------------------------------------------

    op.create_table(
        "order_items",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "order_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "menu_item_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "quantity",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "price",
            sa.Float(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"]
        ),

        sa.ForeignKeyConstraint(
            ["menu_item_id"],
            ["menu_items.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    # -------------------------------------------------
    # DRIVERS
    # -------------------------------------------------

    op.create_table(
        "drivers",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "is_available",
            sa.Boolean(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    # -------------------------------------------------
    # DRIVER ACCOUNT OWNERSHIP
    # -------------------------------------------------

    op.create_table(
        "driver_accounts",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "account_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "driver_id",
            sa.Integer(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["account_id"],
            ["accounts.id"]
        ),

        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "account_id"
        ),

        sa.UniqueConstraint(
            "driver_id"
        )
    )

    # -------------------------------------------------
    # DRIVER LOCATIONS
    # -------------------------------------------------

    op.create_table(
        "driver_locations",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "driver_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False
        ),

        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "driver_id"
        )
    )

    # -------------------------------------------------
    # DRIVER ASSIGNMENTS - ORIGINAL VERSION
    # -------------------------------------------------

    op.create_table(
        "driver_assignments",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "order_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "driver_id",
            sa.Integer(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"]
        ),

        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "order_id"
        )
    )


def downgrade() -> None:

    op.drop_table(
        "driver_assignments"
    )

    op.drop_table(
        "driver_locations"
    )

    op.drop_table(
        "driver_accounts"
    )

    op.drop_table(
        "drivers"
    )

    op.drop_table(
        "order_items"
    )

    op.drop_table(
        "orders"
    )

    op.drop_table(
        "menu_items"
    )

    op.drop_table(
        "restaurant_locations"
    )

    op.drop_table(
        "restaurant_accounts"
    )

    op.drop_table(
        "restaurants"
    )

    op.drop_table(
        "auth_sessions"
    )

    op.drop_table(
        "accounts"
    )

    op.drop_index(
        "ix_users_email",
        table_name="users"
    )

    op.drop_table(
        "users"
    )