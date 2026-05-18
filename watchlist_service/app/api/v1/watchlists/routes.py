from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_from_gateway, get_db, get_financial_db
from app.core.response import success_response
from app.schemas.watchlist import (
    WatchlistCreateRequest,
    WatchlistReorderRequest,
    WatchlistUpdateRequest,
)
from app.services.watchlist_service import (
    create_user_watchlist,
    delete_user_watchlist,
    get_watchlist_for_user,
    list_watchlists_for_user,
    mark_watchlist_as_default,
    reorder_user_watchlists,
    update_user_watchlist,
)


router = APIRouter(
    prefix="/watchlists",
    tags=["Watchlists"],
)


@router.post("")
async def create_watchlist(
    payload: WatchlistCreateRequest,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await create_user_watchlist(
        db=db,
        user_id=current["user_id"],
        payload=payload,
    )

    return success_response(
        data=data,
        message="Watchlist created successfully",
    )


@router.get("")
async def list_watchlists(
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
    financial_db: AsyncSession = Depends(get_financial_db),
):
    data = await list_watchlists_for_user(
        db=db,
        user_id=current["user_id"],
        financial_db=financial_db,
    )

    return success_response(
        data=data,
        message="Watchlists fetched successfully",
    )


@router.get("/{watchlist_id}")
async def get_watchlist(
    watchlist_id: str,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await get_watchlist_for_user(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
    )

    return success_response(
        data=data,
        message="Watchlist fetched successfully",
    )


@router.patch("/{watchlist_id}")
async def update_watchlist(
    watchlist_id: str,
    payload: WatchlistUpdateRequest,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await update_user_watchlist(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
        payload=payload,
    )

    return success_response(
        data=data,
        message="Watchlist updated successfully",
    )


@router.delete("/{watchlist_id}")
async def delete_watchlist(
    watchlist_id: str,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await delete_user_watchlist(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
    )

    return success_response(
        data=data,
        message="Watchlist deleted successfully",
    )


@router.patch("/{watchlist_id}/default")
async def set_default_watchlist(
    watchlist_id: str,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await mark_watchlist_as_default(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
    )

    return success_response(
        data=data,
        message="Default watchlist updated successfully",
    )


@router.patch("/reorder")
async def reorder_watchlists(
    payload: WatchlistReorderRequest,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    data = await reorder_user_watchlists(
        db=db,
        user_id=current["user_id"],
        payload=payload,
    )

    return success_response(
        data=data,
        message="Watchlists reordered successfully",
    )