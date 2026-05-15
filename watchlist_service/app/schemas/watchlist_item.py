from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WatchlistItemCreateRequest(BaseModel):
    fincode: int = Field(..., gt=0)


class WatchlistItemResolvedCreate(BaseModel):
    fincode: int
    company_name: str

    exchange: str
    symbol: Optional[str] = None
    series: Optional[str] = None
    bse_scripcode: Optional[str] = None
    display_symbol: Optional[str] = None

    position: Optional[int] = None


class WatchlistItemResponse(BaseModel):
    id: str
    watchlist_id: str
    fincode: int
    company_name: str

    exchange: str
    symbol: Optional[str] = None
    series: Optional[str] = None
    bse_scripcode: Optional[str] = None
    display_symbol: Optional[str] = None

    position: Optional[int] = None

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }