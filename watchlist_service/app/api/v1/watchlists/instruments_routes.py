from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_from_gateway, get_financial_db
from app.core.response import success_response
from app.services.stock_resolver_service import (
    search_instruments,
    get_popular_instruments,
)


router = APIRouter(
    prefix="/watchlists/instruments",
    tags=["Watchlist Instruments"],
)


@router.get("/search")
async def search_watchlist_instruments(
    q: str = Query(..., min_length=2, max_length=80),
    current=Depends(get_current_user_from_gateway),
    financial_db: AsyncSession = Depends(get_financial_db),
):
    data = await search_instruments(financial_db=financial_db, query=q)

    return success_response(
        data=data,
        message="Instruments fetched successfully",
    )


@router.get("/popular")
async def popular_watchlist_instruments(
    current=Depends(get_current_user_from_gateway),
    financial_db: AsyncSession = Depends(get_financial_db),
):
    data = await get_popular_instruments(financial_db=financial_db)

    return success_response(
        data=data,
        message="Popular instruments fetched successfully",
    )