from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.watchlist_item_service import (
    add_item_to_watchlist,
    get_items_for_watchlist,
    remove_item_from_watchlist,
)



from app.api.deps import get_current_user_from_gateway, get_db, get_financial_db
from app.core.response import success_response
from app.schemas.watchlist_item import WatchlistItemCreateRequest, WatchlistItemResponse

router = APIRouter(
    prefix="/watchlists/{watchlist_id}/items",
    tags=["Watchlist Items"],
)


@router.post("/")
async def add_item(
    watchlist_id: str,
    payload: WatchlistItemCreateRequest,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
    financial_db: AsyncSession = Depends(get_financial_db),
):
    item = await add_item_to_watchlist(
        db=db,
        financial_db=financial_db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
        payload=payload,
    )

    return success_response(
        data=WatchlistItemResponse.model_validate(item).model_dump(mode="json"),
        message="Stock added to watchlist successfully",
    )


@router.get("/")
async def list_items(
    watchlist_id: str,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    items = await get_items_for_watchlist(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
    )

    return success_response(
        data=[
            WatchlistItemResponse.model_validate(item).model_dump(mode="json")
            for item in items
        ],
        message="Watchlist items fetched successfully",
    )


@router.delete("/{item_id}")
async def delete_item(
    watchlist_id: str,
    item_id: str,
    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
):
    item = await remove_item_from_watchlist(
        db=db,
        user_id=current["user_id"],
        watchlist_id=watchlist_id,
        item_id=item_id,
    )

    return success_response(
        data=WatchlistItemResponse.model_validate(item).model_dump(mode="json"),
        message="Stock removed from watchlist successfully",
    )