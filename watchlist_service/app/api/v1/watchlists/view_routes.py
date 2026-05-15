from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_from_gateway, get_db
from app.services.watchlist_view_service import build_watchlist_view


router = APIRouter(
    prefix="/watchlists",
    tags=["Watchlist Dynamic View"],
)


@router.get("/view")
async def get_watchlist_dynamic_view(
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
):
    return await build_watchlist_view(
        db=db,
        user_id=current["user_id"],
        view_id=view_id,
        mode=mode,
        watchlist_id=watchlist_id,
        page=page,
        page_size=page_size,
        sort_key=sort_key,
        sort_dir=sort_dir,
        search=search,
        filters={
            "sector": sector,
            "exchange": exchange,
        },
    )