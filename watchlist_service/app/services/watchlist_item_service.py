from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.watchlist_item_repo import (
    create_watchlist_item,
    get_existing_item_by_fincode,
    get_user_watchlist,
    get_watchlist_item,
    list_watchlist_items,
    soft_delete_watchlist_item,
)
from app.schemas.watchlist_item import WatchlistItemCreateRequest
from app.services.stock_resolver_service import resolve_stock_for_watchlist


async def add_item_to_watchlist(
    db: AsyncSession,
    financial_db: AsyncSession,
    user_id: str,
    watchlist_id: str,
    payload: WatchlistItemCreateRequest,
):
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    existing = await get_existing_item_by_fincode(
        db=db,
        watchlist_id=watchlist_id,
        fincode=payload.fincode,
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This company is already present in this watchlist",
        )

    resolved = await resolve_stock_for_watchlist(
        financial_db=financial_db,
        fincode=payload.fincode,
    )

    try:
        return await create_watchlist_item(
            db=db,
            user_id=user_id,
            watchlist_id=watchlist_id,
            resolved=resolved,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This company is already present in this watchlist",
        )

async def get_items_for_watchlist(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
):
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    return await list_watchlist_items(
        db=db,
        user_id=user_id,
        watchlist_id=watchlist_id,
    )


async def remove_item_from_watchlist(
    db: AsyncSession,
    user_id: str,
    watchlist_id: str,
    item_id: str,
):
    watchlist = await get_user_watchlist(db, user_id, watchlist_id)

    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    item = await get_watchlist_item(
        db=db,
        user_id=user_id,
        watchlist_id=watchlist_id,
        item_id=item_id,
    )

    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    return await soft_delete_watchlist_item(db, item)