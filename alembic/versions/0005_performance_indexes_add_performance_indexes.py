"""add performance indexes

Revision ID: 0005_performance_indexes
Revises: 0004_order_idempotency
Create Date: 2026-09-03
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.

revision: str = "0005_performance_indexes"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "0004_order_idempotency"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:

    # Menu lookup:
    #
    # WHERE restaurant_id = ?
    # ORDER BY id
    op.create_index(
        "ix_menu_items_restaurant_id_id",
        "menu_items",
        [
            "restaurant_id",
            "id",
        ],
        unique=False,
    )

    # Customer order history:
    #
    # WHERE user_id = ?
    # ORDER BY created_at DESC, id DESC
    op.create_index(
        "ix_orders_user_created_id",
        "orders",
        [
            "user_id",
            "created_at",
            "id",
        ],
        unique=False,
    )

    # Restaurant order history:
    #
    # WHERE restaurant_id = ?
    # ORDER BY created_at DESC, id DESC
    op.create_index(
        "ix_orders_restaurant_created_id",
        "orders",
        [
            "restaurant_id",
            "created_at",
            "id",
        ],
        unique=False,
    )

    # Restaurant workflow queries:
    #
    # WHERE restaurant_id = ?
    # AND status = ?
    op.create_index(
        "ix_orders_restaurant_status",
        "orders",
        [
            "restaurant_id",
            "status",
        ],
        unique=False,
    )

    # Load items belonging to an order.
    op.create_index(
        "ix_order_items_order_id",
        "order_items",
        [
            "order_id",
        ],
        unique=False,
    )

    # Driver's order / assignment lookup.
    op.create_index(
        "ix_driver_assignments_driver_order",
        "driver_assignments",
        [
            "driver_id",
            "order_id",
        ],
        unique=False,
    )


def downgrade() -> None:

    op.drop_index(
        "ix_driver_assignments_driver_order",
        table_name="driver_assignments",
    )

    op.drop_index(
        "ix_order_items_order_id",
        table_name="order_items",
    )

    op.drop_index(
        "ix_orders_restaurant_status",
        table_name="orders",
    )

    op.drop_index(
        "ix_orders_restaurant_created_id",
        table_name="orders",
    )

    op.drop_index(
        "ix_orders_user_created_id",
        table_name="orders",
    )

    op.drop_index(
        "ix_menu_items_restaurant_id_id",
        table_name="menu_items",
    )