from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import WatchlistSessionLocal
from app.db.financial_session import FinancialSessionLocal


async def get_db():
    """
    Main application DB.
    Used for watchlists and watchlist_items CRUD.
    """
    async with WatchlistSessionLocal() as session:
        async with session.begin():
            yield session


async def get_financial_db():
    """
    Financial read-only DB.
    Used only for resolving/searching stock metadata.
    """
    async with FinancialSessionLocal() as session:
        yield session


def verify_internal_request(request: Request):
    internal_secret = request.headers.get("x-internal-secret")

    if internal_secret != settings.INTERNAL_SECRET:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: internal gateway access only",
        )


def get_current_user_from_gateway(
    request: Request,
    _: None = Depends(verify_internal_request),
):
    user_id = request.headers.get("x-user-id")
    tier = request.headers.get("x-tier", "free")
    auth_type = request.headers.get("x-auth-type", "unknown")
    request_id = request.headers.get("x-request-id", "unknown")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Missing user identity from gateway",
        )

    return {
        "user_id": user_id,
        "tier": tier,
        "auth_type": auth_type,
        "request_id": request_id,
    }