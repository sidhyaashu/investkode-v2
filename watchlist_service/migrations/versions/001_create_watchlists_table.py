"""create watchlists table

Revision ID: 001_create_watchlists_table
Revises:
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001_create_watchlists_table"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS app")

    op.create_table(
        "watchlists",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_watchlists_user_id_name"),
        schema="app",
    )

    op.create_index(
        "ix_watchlists_user_id",
        "watchlists",
        ["user_id"],
        unique=False,
        schema="app",
    )

    op.create_index(
        "ix_watchlists_user_id_deleted_at",
        "watchlists",
        ["user_id", "deleted_at"],
        unique=False,
        schema="app",
    )


def downgrade() -> None:
    op.drop_index("ix_watchlists_user_id_deleted_at", table_name="watchlists", schema="app")
    op.drop_index("ix_watchlists_user_id", table_name="watchlists", schema="app")
    op.drop_table("watchlists", schema="app")