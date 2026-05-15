from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.user_repo import get_user_by_email, create_user
from app.core.security import hash_password, verify_password
from app.services.jwt_service import create_access_token
from app.services.token_service import create_session, create_new_refresh


def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not any(char.isdigit() for char in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not any(char.isupper() for char in password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")


async def register_user(db: AsyncSession, email: str, password: str):
    # 🔍 1. Validate password strength
    validate_password_strength(password)

    # 🔍 2. Check if user exists
    existing = await get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🧱 3. Create user
    hashed = hash_password(password)
    user = await create_user(db, email, hashed)
    await db.flush()

    return user


async def login_user(db: AsyncSession, email: str, password: str):
    # 🔍 1. Find user
    user = await get_user_by_email(db, email)

    # 🔐 2. Verify password
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 🚫 3. Check status
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # 📧 4. Enforce Email Verification
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    # 🔑 5. Issue tokens
    access_token = create_access_token(user.id)
    refresh_token = create_new_refresh()

    # 🔁 6. Store session
    await create_session(db, user.id, refresh_token)

    return user, access_token, refresh_token
