import secrets
import hashlib
from sqlalchemy.ext.asyncio import AsyncSession
from app.repository.api_key_repo import (
    create_api_key,
    get_api_key,
    update_key_usage,
    get_user_api_keys,
    deactivate_api_key
)


from app.core.config import settings
from app.schemas.api_key import APIKeyCreate, APIKeyData

def _hash_key(key: str):
    """
    🛡️ Salted Hashing: Protects against rainbow table attacks.
    Uses INTERNAL_SECRET as the salt.
    """
    salted = key + settings.INTERNAL_SECRET
    return hashlib.sha256(salted.encode()).hexdigest()


async def create_user_api_key(db: AsyncSession, user_id: str, scope: str = "read", tier: str = "free"):
    raw_key = f"sk_{secrets.token_urlsafe(32)}"
    key_hash = _hash_key(raw_key)

    payload = APIKeyCreate(user_id=user_id, key_hash=key_hash, scope=scope, tier=tier)
    await create_api_key(db, payload)

    return raw_key


async def validate_api_key(db: AsyncSession, raw_key: str):
    key_hash = _hash_key(raw_key)
    key_record = await get_api_key(db, key_hash)

    if not key_record:
        return None

    # Update usage stats
    await update_key_usage(db, key_record.id)

    data = APIKeyData(
        user_id=key_record.user_id,
        scope=key_record.scope,
        tier=key_record.tier
    )
    return data.model_dump()


async def list_api_keys(db: AsyncSession, user_id: str):
    return await get_user_api_keys(db, user_id)


async def revoke_api_key(db: AsyncSession, key_id: str, user_id: str):
    await deactivate_api_key(db, key_id, user_id)
