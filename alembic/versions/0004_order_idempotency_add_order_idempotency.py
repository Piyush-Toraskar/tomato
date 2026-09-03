"""add order idempotency

Revision ID: 0004_order_idempotency
Revises: 0003_data_hardening

"""

from typing import (
    Sequence,
    Union
)

from alembic import op
import sqlalchemy as sa


revision: str = "0004_order_idempotency"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "0003_data_hardening"

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

    op.create_table(
        "order_idempotency_records",

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
            "idempotency_key",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "request_hash",
            sa.String(length=64),
            nullable=False
        ),

        sa.Column(
            "order_id",
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
            ["user_id"],
            ["users.id"]
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"]
        ),

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_order_idempotency_user_key"
        ),

        sa.UniqueConstraint(
            "order_id",
            name="uq_order_idempotency_order_id"
        )
    )


def downgrade() -> None:

    op.drop_table(
        "order_idempotency_records"
    )