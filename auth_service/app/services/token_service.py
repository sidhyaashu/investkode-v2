import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repository.token_repo import (
    create_refresh_token,
    get_token,
    revoke_token,
    count_user_sessions,
    revoke_oldest_session
)
from app.services.jwt_service import create_access_token
from app.core.redis import redis_client



def hash_token(token: str):
    return hashlib.sha256(token.encode()).hexdigest()


async def blacklist_token(token_hash: str, ttl: int = None):
    if ttl is None:
        ttl = settings.TOKEN_BLACKLIST_TTL
    key = f"blacklist:{token_hash}"
    await redis_client.set(key, "1", ex=ttl)


async def is_blacklisted(token_hash: str):
    return await redis_client.exists(f"blacklist:{token_hash}")


async def create_session(db: AsyncSession, user_id: str, raw_refresh: str, request: Request = None):
    # 📏 1. Enforce Max Sessions
    count = await count_user_sessions(db, user_id)
    if count >= settings.MAX_SESSIONS_PER_USER:
        await revoke_oldest_session(db, user_id)

    token_hash = hash_token(raw_refresh)

    expires = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    # 📱 2. Capture Device Info
    user_agent = request.headers.get("user-agent") if request else None
    ip_address = request.client.host if request and request.client else None

    await create_refresh_token(
        db,
        user_id,
        token_hash,
        expires,
        user_agent=user_agent,
        ip_address=ip_address,
        device_info=user_agent  # Simplified
    )


async def refresh_session(db: AsyncSession, raw_refresh: str, request: Request = None):
    token_hash = hash_token(raw_refresh)

    # 🔥 check blacklist (Replay Protection)
    if await is_blacklisted(token_hash):
        raise HTTPException(status_code=401, detail="Token reuse detected")

    token = await get_token(db, token_hash)

    if not token or token.revoked:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    # 🔥 blacklist old token
    await blacklist_token(token_hash)

    # 🔁 ROTATION
    await revoke_token(db, token_hash)

    new_refresh = create_new_refresh()
    await create_session(db, token.user_id, new_refresh, request)

    new_access = create_access_token(token.user_id)

    return new_access, new_refresh, token.user_id


def create_new_refresh():
    return secrets.token_urlsafe(64)
