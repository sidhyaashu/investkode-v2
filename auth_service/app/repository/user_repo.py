from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User


async def create_user(db: AsyncSession, email: str, password_hash: str = None):
    user = User(email=email, password_hash=password_hash)
    db.add(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_google_id(db: AsyncSession, google_id: str):
    result = await db.execute(
        select(User).where(User.google_id == google_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
