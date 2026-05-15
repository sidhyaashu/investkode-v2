from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.watchlist_repo import (
    count_user_watchlists,
    create_watchlist,
    get_next_sort_order,
    get_user_watchlist,
    get_user_watchlist_with_count,
    get_watchlist_by_name,
    list_user_watchlists,
    set_watchlist_default,
    soft_delete_watchlist,
    update_watchlist_record,
    update_watchlist_sort_order,
)
from app.schemas.watchlist import (
    WatchlistCreateRequest,
    WatchlistReorderRequest,
    WatchlistUpdateRequest,
)


MAX_WATCHLISTS_PER_USER = 20


def _clean_name(name: str) -> str:
    return name.strip()


def _serialize_watchlist(watchlist, items_count: int = 0) -> dict:
    return {
        "id": watchlist.id,
        "user_id": watchlist.user_id,
        "name": watchlist.name,
        "description": watchlist.description,
        "is_default": watchlist.is_default,
        "sort_order": watchlist.sort_order,
        "items_count": items_count,
        "created_at": watchlist.created_at,
        "updated_at": watchlist.updated_at,
    }


async def create_user_watchlist(
    db: AsyncSession,
    user_id: str,
    payload: WatchlistCreateRequest,
) -> dict:
    name = _clean_name(payload.name)

    if not name:
        raise HTTPException(status_code=400, detail="Watchlist name is required")

    total = await count_user_watchlists(db, user_id)

    if total >= MAX_WATCHLISTS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"You can create a maximum of {MAX_WATCHLISTS_PER_USER} watchlists",
        )

    existing = await get_watchlist_by_name(db, user_id, name)

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A watchlist with this name already exists",
        )

    is_default = total == 0
    sort_order = await get_next_sort_order(db, user_id)

    try:
        watchlist = await create_watchlist(
            db=db,
            user_id=user_id,
            name=name,
            description=payload.description,
            is_default=is_default,
            sort_order=sort_order,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="A watchlist with this name already exists",
        )

    return _serialize_watchlist(watchlist, items_count=0)


async def list_watchlists_for_user(
    db: AsyncSession,
    user_id: str,
) -> list[dict]:
    rows = await list_user_watchlists(db, user_id)

    return [
        _serialize_watchlist(watchlist, items_count=items_count)
        for watchlist, items_count in rows
    ]


async def get_watchlist_for_user(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> dict:
    row = await get_user_watchlist_with_count(db, user_id, watchlist_id)

    if not row:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    watchlist, items_count = row

    return _serialize_watchlist(watchlist, items_count=items_count)


async def update_user_watchlist(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
    payload: WatchlistUpdateRequest,
) -> dict:
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    name = None

    if payload.name is not None:
        name = _clean_name(payload.name)

        if not name:
            raise HTTPException(status_code=400, detail="Watchlist name is required")

        existing = await get_watchlist_by_name(db, user_id, name)

        if existing and existing.id != watchlist.id:
            raise HTTPException(
                status_code=409,
                detail="A watchlist with this name already exists",
            )

    updated = await update_watchlist_record(
        db=db,
        watchlist=watchlist,
        name=name,
        description=payload.description,
    )

    row = await get_user_watchlist_with_count(db, user_id, updated.id)
    updated_watchlist, items_count = row

    return _serialize_watchlist(updated_watchlist, items_count=items_count)


async def delete_user_watchlist(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> dict:
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    if watchlist.is_default:
        raise HTTPException(
            status_code=400,
            detail="Default watchlist cannot be deleted. Set another watchlist as default first.",
        )

    deleted = await soft_delete_watchlist(db, watchlist)

    return _serialize_watchlist(deleted, items_count=0)


async def mark_watchlist_as_default(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
) -> dict:
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    updated = await set_watchlist_default(db, watchlist)

    row = await get_user_watchlist_with_count(db, user_id, updated.id)
    updated_watchlist, items_count = row

    return _serialize_watchlist(updated_watchlist, items_count=items_count)


async def reorder_user_watchlists(
    db: AsyncSession,
    user_id: str,
    payload: WatchlistReorderRequest,
) -> list[dict]:
    for item in payload.items:
        watchlist = await get_user_watchlist(db, user_id, item.id)

        if not watchlist:
            raise HTTPException(
                status_code=404,
                detail=f"Watchlist not found: {item.id}",
            )

        await update_watchlist_sort_order(db, watchlist, item.sort_order)

    return await list_watchlists_for_user(db, user_id)