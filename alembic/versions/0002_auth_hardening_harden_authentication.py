"""harden authentication

Revision ID: 0002_auth_hardening
Revises: e738b2ddcfb4

"""

from typing import (
    Sequence,
    Union
)

from alembic import op
import sqlalchemy as sa


revision: str = "0002_auth_hardening"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "e738b2ddcfb4"

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
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    # Users that existed before this feature are treated
    # as already verified so we don't unexpectedly lock
    # existing development accounts.
    op.execute(
        """
        UPDATE users
        SET email_verified = TRUE
        """
    )

    op.alter_column(
        "users",
        "email_verified",
        server_default=None
    )

    op.add_column(
        "auth_sessions",
        sa.Column(
            "refresh_token_hash",
            sa.String(length=64),
            nullable=True
        )
    )

    op.add_column(
        "auth_sessions",
        sa.Column(
            "refresh_expires_at",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.add_column(
        "auth_sessions",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now()
        )
    )

    op.add_column(
        "auth_sessions",
        sa.Column(
            "last_used_at",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.add_column(
        "auth_sessions",
        sa.Column(
            "revoked_at",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.create_table(
        "email_verification_tokens",

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
            "token_hash",
            sa.String(length=64),
            nullable=False
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),

        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
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

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "token_hash"
        )
    )

    op.create_index(
        op.f(
            "ix_email_verification_tokens_id"
        ),
        "email_verification_tokens",
        ["id"],
        unique=False
    )

    op.create_table(
        "password_reset_tokens",

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
            "token_hash",
            sa.String(length=64),
            nullable=False
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),

        sa.Column(
            "used_at",
            sa.DateTime(timezone=True),
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

        sa.PrimaryKeyConstraint(
            "id"
        ),

        sa.UniqueConstraint(
            "token_hash"
        )
    )

    op.create_index(
        op.f(
            "ix_password_reset_tokens_id"
        ),
        "password_reset_tokens",
        ["id"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        op.f(
            "ix_password_reset_tokens_id"
        ),
        table_name="password_reset_tokens"
    )

    op.drop_table(
        "password_reset_tokens"
    )

    op.drop_index(
        op.f(
            "ix_email_verification_tokens_id"
        ),
        table_name="email_verification_tokens"
    )

    op.drop_table(
        "email_verification_tokens"
    )

    op.drop_column(
        "auth_sessions",
        "revoked_at"
    )

    op.drop_column(
        "auth_sessions",
        "last_used_at"
    )

    op.drop_column(
        "auth_sessions",
        "created_at"
    )

    op.drop_column(
        "auth_sessions",
        "refresh_expires_at"
    )

    op.drop_column(
        "auth_sessions",
        "refresh_token_hash"
    )

    op.drop_column(
        "users",
        "email_verified"
    )