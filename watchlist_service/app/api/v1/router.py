from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.watchlists.view_routes import router as watchlist_view_router
from app.api.v1.watchlists.instruments_routes import router as instruments_router
from app.api.v1.watchlists.routes import router as watchlist_router
from app.api.v1.watchlists.items_routes import router as watchlist_items_router


router = APIRouter()

router.include_router(health_router)

# Static/specific routes first.
router.include_router(watchlist_view_router)
router.include_router(instruments_router)

# Dynamic routes after static routes.
router.include_router(watchlist_router)
router.include_router(watchlist_items_router)