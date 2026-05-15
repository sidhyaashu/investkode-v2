from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, Request

from app.services.google_oauth_service import verify_google_token
from app.repository.user_repo import (
    get_user_by_email,
    get_user_by_google_id,
    create_user
)
from app.services.jwt_service import create_access_token
from app.services.token_service import create_session, create_new_refresh


async def google_login(db: AsyncSession, id_token: str, request: Request = None):
    data = await verify_google_token(id_token)

    email = data.get("email")
    google_id = data.get("sub")

    if not email:
        raise HTTPException(status_code=400, detail="Email not provided")

    # 🔍 1. Check existing Google user
    user = await get_user_by_google_id(db, google_id)

    # 🔍 2. Check existing email user (linking)
    if not user:
        user = await get_user_by_email(db, email)

        if user:
            # 🔗 Link Google account
            user.google_id = google_id
            user.auth_provider = "google"
        else:
            # 🆕 Create new user
            user = await create_user(db, email, password_hash=None)
            user.google_id = google_id
            user.auth_provider = "google"
            user.is_verified = True

    # 🚀 Ensure user.id is populated before generating tokens/sessions
    await db.flush()

    # 🔐 Issue tokens
    access_token = create_access_token(user.id)
    refresh_token = create_new_refresh()

    # 🔁 3. Create session with device info
    await create_session(db, user.id, refresh_token, request)

    return user, access_token, refresh_token
