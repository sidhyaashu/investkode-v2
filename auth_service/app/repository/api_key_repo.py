from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate
from datetime import datetime


async def create_api_key(db: AsyncSession, payload: APIKeyCreate):
    key = APIKey(
        user_id=payload.user_id,
        key_hash=payload.key_hash,
        scope=payload.scope,
        tier=payload.tier
    )
    db.add(key)
    return key


async def get_api_key(db: AsyncSession, key_hash: str):
    result = await db.execute(
        select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)
    )
    return result.scalar_one_or_none()


async def update_key_usage(db: AsyncSession, key_id: str):
    await db.execute(
        update(APIKey)
        .where(APIKey.id == key_id)
        .values(
            request_count=APIKey.request_count + 1,
            last_used_at=datetime.now()
        )
    )


async def get_user_api_keys(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == user_id, APIKey.is_active == True)
    )
    return result.scalars().all()


async def deactivate_api_key(db: AsyncSession, key_id: str, user_id: str):
    await db.execute(
        update(APIKey)
        .where(APIKey.id == key_id, APIKey.user_id == user_id)
        .values(is_active=False)
    )
