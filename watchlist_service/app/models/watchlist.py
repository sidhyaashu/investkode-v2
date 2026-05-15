import uuid

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    Text,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String, nullable=False, index=True)

    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    is_default = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    items = relationship(
        "WatchlistItem",
        back_populates="watchlist",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_watchlists_user_id_name"),
        Index("ix_watchlists_user_id_deleted_at", "user_id", "deleted_at"),
    )


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    watchlist_id = Column(
        String,
        ForeignKey("watchlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(String, nullable=False, index=True)

    # Company identity from provider.
    fincode = Column(Integer, nullable=False)

    # Snapshot fields for UI/search/display.
    company_name = Column(String(255), nullable=False)

    # Selected listing after NSE-first/BSE-fallback logic.
    exchange = Column(String(10), nullable=False)       # NSE / BSE
    symbol = Column(String(50), nullable=True)          # NSE symbol; nullable for BSE-only
    series = Column(String(10), nullable=True)          # NSE series; nullable for BSE-only
    bse_scripcode = Column(String(20), nullable=True)   # useful when only BSE exists
    display_symbol = Column(String(80), nullable=True)  # ICICIBANK or BSE:532174

    position = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    watchlist = relationship("Watchlist", back_populates="items")

    __table_args__ = (
        # One company only once in one watchlist.
        UniqueConstraint(
            "watchlist_id",
            "fincode",
            name="uq_watchlist_items_watchlist_id_fincode",
        ),
        Index("ix_watchlist_items_user_watchlist", "user_id", "watchlist_id"),
        Index("ix_watchlist_items_fincode", "fincode"),
        Index("ix_watchlist_items_exchange_symbol_series", "exchange", "symbol", "series"),
    )