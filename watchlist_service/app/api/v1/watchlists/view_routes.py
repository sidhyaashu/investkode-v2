from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_from_gateway, get_db, get_financial_db
from app.views.registry import build_view_response


router = APIRouter(
    prefix="/watchlists",
    tags=["Watchlist Dynamic View"],
)


@router.get("/view")
async def get_watchlist_dynamic_view(
    request: Request,
    view_id: str = Query("watchlist.default"),
    mode: Literal["client", "server"] = Query("client"),
    watchlist_id: Optional[str] = Query(None),

    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_key: str = Query("position"),
    sort_dir: Literal["asc", "desc"] = Query("asc"),
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    exchange: Optional[str] = Query(None),

    current=Depends(get_current_user_from_gateway),
    db: AsyncSession = Depends(get_db),
    financial_db: AsyncSession = Depends(get_financial_db),
):
    return await build_view_response(
        view_id=view_id,
        user=current,
        db=db,
        financial_db=financial_db,
        request_id=current.get("request_id"),
        query={
            "mode": mode,
            "watchlist_id": watchlist_id,
            "page": page,
            "page_size": page_size,
            "sort_key": sort_key,
            "sort_dir": sort_dir,
            "search": search,
            "sector": sector,
            "exchange": exchange,
        },
    )