from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from app.models.refresh_token import RefreshToken


async def create_refresh_token(
    db: AsyncSession,
    user_id: str,
    token_hash: str,
    expires_at,
    device_info: str = None,
    ip_address: str = None,
    user_agent: str = None
):
    token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(token)
    return token


async def get_token(db: AsyncSession, token_hash: str):
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def revoke_token(db: AsyncSession, token_hash: str):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .values(revoked=True)
    )


async def revoke_token_by_id(db: AsyncSession, session_id: str, user_id: str):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == session_id, RefreshToken.user_id == user_id)
        .values(revoked=True)
    )


async def revoke_all_user_tokens(db: AsyncSession, user_id: str):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .values(revoked=True)
    )


async def get_user_sessions(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        .order_by(RefreshToken.created_at.desc())
    )
    return result.scalars().all()


async def count_user_sessions(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(func.count(RefreshToken.id))
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
    )
    return result.scalar()


async def revoke_oldest_session(db: AsyncSession, user_id: str):
    oldest = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        .order_by(RefreshToken.created_at.asc())
        .limit(1)
    )
    token = oldest.scalar_one_or_none()
    if token:
        token.revoked = True
