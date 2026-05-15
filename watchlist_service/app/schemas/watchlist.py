from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class WatchlistCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class WatchlistUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class WatchlistReorderItem(BaseModel):
    id: str
    sort_order: int = Field(..., ge=0)


class WatchlistReorderRequest(BaseModel):
    items: List[WatchlistReorderItem]


class WatchlistResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    is_default: bool
    sort_order: int
    items_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }