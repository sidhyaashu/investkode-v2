from fastapi import APIRouter
from app.api.v1 import health
from app.api.v1.auth import routes as auth_routes
from app.api.v1.api_keys import routes as api_key_routes
from app.api.v1.internal import routes as internal_routes
from app.api.v1.user import routes as user_routes

router = APIRouter()

router.include_router(health.router)
router.include_router(auth_routes.router)
router.include_router(api_key_routes.router)
router.include_router(internal_routes.router)
router.include_router(user_routes.router)
