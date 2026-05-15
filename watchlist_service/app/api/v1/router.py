from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.watchlists.routes import router as watchlist_router
from app.api.v1.watchlists.items_routes import router as watchlist_items_router


router = APIRouter()

router.include_router(health_router)
router.include_router(watchlist_router)
router.include_router(watchlist_items_router)