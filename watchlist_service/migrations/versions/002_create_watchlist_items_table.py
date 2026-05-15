"""create watchlist items table

Revision ID: 002_create_watchlist_items_table
Revises: 001_create_watchlists_table
Create Date: 2026-05-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002_create_watchlist_items_table"
down_revision: Union[str, None] = "001_create_watchlists_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.String(), nullable=False),

        sa.Column("watchlist_id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),

        sa.Column("fincode", sa.Integer(), nullable=False),

        sa.Column("company_name", sa.String(length=255), nullable=False),

        sa.Column("exchange", sa.String(length=10), nullable=False),
        sa.Column("symbol", sa.String(length=50), nullable=True),
        sa.Column("series", sa.String(length=10), nullable=True),
        sa.Column("bse_scripcode", sa.String(length=20), nullable=True),
        sa.Column("display_symbol", sa.String(length=80), nullable=True),

        sa.Column("position", sa.Integer(), nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),

        sa.PrimaryKeyConstraint("id"),

        sa.ForeignKeyConstraint(
            ["watchlist_id"],
            ["app.watchlists.id"],
            ondelete="CASCADE",
        ),

        sa.UniqueConstraint(
            "watchlist_id",
            "fincode",
            name="uq_watchlist_items_watchlist_id_fincode",
        ),
        schema="app",
    )

    op.create_index(
        "ix_watchlist_items_watchlist_id",
        "watchlist_items",
        ["watchlist_id"],
        unique=False,
        schema="app",
    )

    op.create_index(
        "ix_watchlist_items_user_id",
        "watchlist_items",
        ["user_id"],
        unique=False,
        schema="app",
    )

    op.create_index(
        "ix_watchlist_items_user_watchlist",
        "watchlist_items",
        ["user_id", "watchlist_id"],
        unique=False,
        schema="app",
    )

    op.create_index(
        "ix_watchlist_items_fincode",
        "watchlist_items",
        ["fincode"],
        unique=False,
        schema="app",
    )

    op.create_index(
        "ix_watchlist_items_exchange_symbol_series",
        "watchlist_items",
        ["exchange", "symbol", "series"],
        unique=False,
        schema="app",
    )


def downgrade() -> None:
    op.drop_index("ix_watchlist_items_exchange_symbol_series", table_name="watchlist_items", schema="app")
    op.drop_index("ix_watchlist_items_fincode", table_name="watchlist_items", schema="app")
    op.drop_index("ix_watchlist_items_user_watchlist", table_name="watchlist_items", schema="app")
    op.drop_index("ix_watchlist_items_user_id", table_name="watchlist_items", schema="app")
    op.drop_index("ix_watchlist_items_watchlist_id", table_name="watchlist_items", schema="app")
    op.drop_table("watchlist_items", schema="app")