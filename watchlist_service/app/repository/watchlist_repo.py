from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.watchlist import Watchlist, WatchlistItem


async def count_user_watchlists(db: AsyncSession, user_id: str) -> int:
    stmt = (
        select(func.count(Watchlist.id))
        .where(
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar_one())


async def get_next_sort_order(db: AsyncSession, user_id: str) -> int:
    stmt = (
        select(func.coalesce(func.max(Watchlist.sort_order), 0))
        .where(
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    return int(result.scalar_one()) + 1


async def get_watchlist_by_name(
    db: AsyncSession,
    user_id: str,
    name: str,
) -> Optional[Watchlist]:
    stmt = (
        select(Watchlist)
        .where(
            Watchlist.user_id == user_id,
            func.lower(Watchlist.name) == name.lower(),
            Watchlist.deleted_at.is_(None),
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_watchlist(
    db: AsyncSession,
    user_id: str,
    name: str,
    description: str | None,
    is_default: bool,
    sort_order: int,
) -> Watchlist:
    watchlist = Watchlist(
        user_id=user_id,
        name=name,
        description=description,
        is_default=is_default,
        sort_order=sort_order,
    )

    db.add(watchlist)
    await db.flush()
    await db.refresh(watchlist)
    return watchlist


async def list_user_watchlists(db: AsyncSession, user_id: str) -> List[tuple[Watchlist, int]]:
    stmt = (
        select(
            Watchlist,
            func.count(WatchlistItem.id).label("items_count"),
        )
        .outerjoin(
            WatchlistItem,
            (WatchlistItem.watchlist_id == Watchlist.id)
            & (WatchlistItem.deleted_at.is_(None)),
        )
        .where(
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
        .group_by(Watchlist.id)
        .order_by(Watchlist.sort_order.asc(), Watchlist.created_at.asc())
    )

    result = await db.execute(stmt)
    return list(result.all())


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


async def get_user_watchlist_with_count(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> Optional[tuple[Watchlist, int]]:
    stmt = (
        select(
            Watchlist,
            func.count(WatchlistItem.id).label("items_count"),
        )
        .outerjoin(
            WatchlistItem,
            (WatchlistItem.watchlist_id == Watchlist.id)
            & (WatchlistItem.deleted_at.is_(None)),
        )
        .where(
            Watchlist.id == watchlist_id,
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
        .group_by(Watchlist.id)
    )

    result = await db.execute(stmt)
    return result.first()


async def clear_default_watchlist(db: AsyncSession, user_id: str) -> None:
    stmt = (
        update(Watchlist)
        .where(
            Watchlist.user_id == user_id,
            Watchlist.deleted_at.is_(None),
        )
        .values(is_default=False)
    )
    await db.execute(stmt)


async def soft_delete_watchlist(db: AsyncSession, watchlist: Watchlist) -> Watchlist:
    watchlist.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(watchlist)
    return watchlist


async def update_watchlist_record(
    db: AsyncSession,
    watchlist: Watchlist,
    name: str | None = None,
    description: str | None = None,
) -> Watchlist:
    if name is not None:
        watchlist.name = name

    if description is not None:
        watchlist.description = description

    await db.flush()
    await db.refresh(watchlist)
    return watchlist


async def set_watchlist_default(db: AsyncSession, watchlist: Watchlist) -> Watchlist:
    await clear_default_watchlist(db, watchlist.user_id)

    watchlist.is_default = True
    await db.flush()
    await db.refresh(watchlist)
    return watchlist


async def update_watchlist_sort_order(
    db: AsyncSession,
    watchlist: Watchlist,
    sort_order: int,
) -> None:
    watchlist.sort_order = sort_order
    await db.flush()