"""harden order data model

Revision ID: 0003_data_hardening
Revises: 0002_auth_hardening

"""

from typing import (
    Sequence,
    Union
)

from alembic import op
import sqlalchemy as sa


revision: str = "0003_data_hardening"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "0002_auth_hardening"

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

    # ----------------------------------
    # MONEY: FLOAT -> NUMERIC
    # ----------------------------------

    op.alter_column(
        "menu_items",
        "price",
        existing_type=sa.Float(),
        type_=sa.Numeric(
            precision=12,
            scale=2
        ),
        existing_nullable=False,
        postgresql_using=(
            "ROUND(price::numeric, 2)"
        )
    )

    op.alter_column(
        "orders",
        "total_amount",
        existing_type=sa.Float(),
        type_=sa.Numeric(
            precision=12,
            scale=2
        ),
        existing_nullable=False,
        postgresql_using=(
            "ROUND(total_amount::numeric, 2)"
        )
    )

    op.alter_column(
        "order_items",
        "price",
        existing_type=sa.Float(),
        type_=sa.Numeric(
            precision=12,
            scale=2
        ),
        existing_nullable=False,
        postgresql_using=(
            "ROUND(price::numeric, 2)"
        )
    )

    # ----------------------------------
    # TIMESTAMPS
    # ----------------------------------

    op.add_column(
        "menu_items",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "menu_items",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "orders",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "orders",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "order_items",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    # ----------------------------------
    # DRIVER ASSIGNMENT METADATA
    # ----------------------------------

    op.add_column(
        "driver_assignments",
        sa.Column(
            "distance_km",
            sa.Numeric(
                precision=10,
                scale=3
            ),
            nullable=True
        )
    )

    op.add_column(
        "driver_assignments",
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "driver_assignments",
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    # ----------------------------------
    # ORDER STATUS AUDIT HISTORY
    # ----------------------------------

    op.create_table(
        "order_status_history",

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
            "from_status",
            sa.String(),
            nullable=True
        ),

        sa.Column(
            "to_status",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "changed_by_user_id",
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"]
        ),

        sa.ForeignKeyConstraint(
            ["changed_by_user_id"],
            ["users.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        )
    )

    op.create_index(
        "ix_order_status_history_id",
        "order_status_history",
        ["id"],
        unique=False
    )

    op.create_index(
        "ix_order_status_history_order_id",
        "order_status_history",
        ["order_id"],
        unique=False
    )

    # Existing orders existed before audit history.
    # Rather than inventing who made their previous
    # status transitions, create one baseline record
    # showing the status we inherited.
    op.execute(
        """
        INSERT INTO order_status_history
        (
            order_id,
            from_status,
            to_status,
            changed_by_user_id,
            created_at
        )
        SELECT
            id,
            NULL,
            status,
            NULL,
            created_at
        FROM orders
        """
    )


def downgrade() -> None:

    op.drop_index(
        "ix_order_status_history_order_id",
        table_name="order_status_history"
    )

    op.drop_index(
        "ix_order_status_history_id",
        table_name="order_status_history"
    )

    op.drop_table(
        "order_status_history"
    )

    op.drop_column(
        "driver_assignments",
        "completed_at"
    )

    op.drop_column(
        "driver_assignments",
        "assigned_at"
    )

    op.drop_column(
        "driver_assignments",
        "distance_km"
    )

    op.drop_column(
        "order_items",
        "created_at"
    )

    op.drop_column(
        "orders",
        "updated_at"
    )

    op.drop_column(
        "orders",
        "created_at"
    )

    op.drop_column(
        "menu_items",
        "updated_at"
    )

    op.drop_column(
        "menu_items",
        "created_at"
    )

    op.alter_column(
        "order_items",
        "price",
        existing_type=sa.Numeric(
            precision=12,
            scale=2
        ),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using=(
            "price::double precision"
        )
    )

    op.alter_column(
        "orders",
        "total_amount",
        existing_type=sa.Numeric(
            precision=12,
            scale=2
        ),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using=(
            "total_amount::double precision"
        )
    )

    op.alter_column(
        "menu_items",
        "price",
        existing_type=sa.Numeric(
            precision=12,
            scale=2
        ),
        type_=sa.Float(),
        existing_nullable=False,
        postgresql_using=(
            "price::double precision"
        )
    )