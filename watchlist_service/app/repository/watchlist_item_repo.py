from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.watchlist import Watchlist, WatchlistItem
from app.schemas.watchlist_item import WatchlistItemResolvedCreate


async def get_user_watchlist(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> Optional[Watchlist]:
    stmt = (
        select(Watchlist)
        .where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
    )

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_existing_item_by_fincode(
    db: AsyncSession,
    watchlist_id: str,
    fincode: int,
) -> Optional[WatchlistItem]:
    stmt = (
        select(WatchlistItem)
        .where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.fincode == fincode,
            WatchlistItem.deleted_at.is_(None),
        )
    )

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_next_position(
    db: AsyncSession,
    watchlist_id: str,
) -> int:
    stmt = (
        select(func.coalesce(func.max(WatchlistItem.position), 0))
        .where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.deleted_at.is_(None),
        )
    )

    result = await db.execute(stmt)
    max_position = result.scalar_one()
    return int(max_position) + 1


async def create_watchlist_item(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
    resolved: WatchlistItemResolvedCreate,
) -> WatchlistItem:
    position = resolved.position

    if position is None:
        position = await get_next_position(db, watchlist_id)

    item = WatchlistItem(
        watchlist_id=watchlist_id,
        user_id=user_id,
        fincode=resolved.fincode,
        company_name=resolved.company_name,
        exchange=resolved.exchange,
        symbol=resolved.symbol,
        series=resolved.series,
        bse_scripcode=resolved.bse_scripcode,
        display_symbol=resolved.display_symbol,
        position=position,
    )

    db.add(item)
    await db.flush()
    await db.refresh(item)

    return item


async def list_watchlist_items(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> List[WatchlistItem]:
    stmt = (
        select(WatchlistItem)
        .where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.deleted_at.is_(None),
        )
        .order_by(WatchlistItem.position.asc(), WatchlistItem.created_at.asc())
    )

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_watchlist_item(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
    item_id: str,
) -> Optional[WatchlistItem]:
    stmt = (
        select(WatchlistItem)
        .where(
            WatchlistItem.id == item_id,
            WatchlistItem.user_id == user_id,
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.deleted_at.is_(None),
        )
    )

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def soft_delete_watchlist_item(
    db: AsyncSession,
    item: WatchlistItem,
) -> WatchlistItem:
    item.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(item)
    return item