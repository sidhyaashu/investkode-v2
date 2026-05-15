from fastapi import APIRouter, Depends, Response, Request, HTTPException
from app.core.response import success_response
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, login_user
from app.api.deps import get_db, get_current_user
from app.services.token_service import refresh_session, hash_token, create_session, create_new_refresh
from app.services.jwt_service import create_access_token
from app.repository.token_repo import (
    revoke_token,
    revoke_token_by_id,
    revoke_all_user_tokens,
    get_user_sessions
)
from app.services.otp_service import generate_otp, store_otp, verify_otp, check_otp_rate_limit, check_login_rate_limit
from app.services.email_service import send_email_otp
from app.repository.user_repo import get_user_by_email
from app.core.security import hash_password
from app.services.oauth_service import google_login
from app.services.audit_service import log_event
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def get_me(current=Depends(get_current_user)):
    return success_response({
        "id": current["user_id"],
        "scope": current["scope"],
        "status": "authenticated"
    })


@router.post("/register")
async def register(payload: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, payload.email, payload.password)
        
        # 📧 Auto-send verification OTP
        otp = generate_otp()
        await store_otp(payload.email, otp, "verify")
        await send_email_otp(payload.email, otp)
        
        await log_event(db, "register", "success", user.id, request)
        return success_response(
            data={"id": user.id, "email": user.email},
            message="User registered successfully. Verification OTP sent."
        )
    except HTTPException as e:
        await log_event(db, "register", "fail", None, request)
        raise e


@router.post("/login")
async def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        # 🚦 Login Rate Limit
        if not await check_login_rate_limit(payload.email):
            await log_event(db, "login", "rate_limited", None, request)
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 5 mins.")

        user, access_token, refresh_token = await login_user(
            db, payload.email, payload.password
        )

        # 🍪 Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=1800,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=7 * 24 * 3600,
        )

        await log_event(db, "login", "success", user.id, request)

        return success_response(
            data={"id": user.id, "email": user.email},
            message="Login successful"
        )
    except HTTPException as e:
        await log_event(db, "login", "fail", None, request)
        raise e


@router.post("/refresh")
async def refresh(response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    raw_refresh = request.cookies.get("refresh_token")

    if not raw_refresh:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        access, new_refresh, user_id = await refresh_session(db, raw_refresh, request)

        # 🍪 update cookies
        response.set_cookie(
            key="access_token",
            value=access,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=1800,
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=7 * 24 * 3600,
        )

        await log_event(db, "refresh", "success", user_id, request)
        return success_response(message="Session refreshed")
    except HTTPException as e:
        await log_event(db, "refresh", "fail", None, request)
        raise e


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    raw_refresh = request.cookies.get("refresh_token")

    if raw_refresh:
        await revoke_token(db, hash_token(raw_refresh))

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    await log_event(db, "logout", "success", None, request)
    return success_response(message="Logged out")


@router.post("/logout-all")
async def logout_all(
    request: Request,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current["user_id"]

    await revoke_all_user_tokens(db, user_id)
    await log_event(db, "logout_all", "success", user_id, request)

    return success_response(message="All sessions revoked")


@router.get("/sessions")
async def list_sessions(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current["user_id"]
    sessions = await get_user_sessions(db, user_id)
    return success_response([
        {
            "id": s.id,
            "device": s.device_info,
            "ip": s.ip_address,
            "created_at": s.created_at,
            "expires_at": s.expires_at
        }
        for s in sessions
    ])


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Enforce ownership: only revoke tokens belonging to the current user
    await revoke_token_by_id(db, session_id, current["user_id"])
    return success_response(message="Session revoked")


@router.post("/send-verification-otp")
async def send_verification_otp(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # 🚦 Rate limiting
    allowed = await check_otp_rate_limit(email)
    if not allowed:
        await log_event(db, "send_otp", "rate_limited", None, request)
        raise HTTPException(status_code=429, detail="Too many OTP requests")

    otp = generate_otp()
    await store_otp(email, otp, "verify")

    await send_email_otp(email, otp)
    await log_event(db, "send_otp", "success", None, request)

    return success_response(message="OTP sent")


@router.post("/verify-otp")
async def verify_otp_route(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    otp = payload.get("otp")

    valid = await verify_otp(email, otp, "verify")

    if not valid:
        await log_event(db, "verify_email", "fail", None, request)
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = await get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    
    # 🔑 Issue tokens for automatic login
    access_token = create_access_token(user.id)
    refresh_token = create_new_refresh()
    await create_session(db, user.id, refresh_token, request)

    await log_event(db, "verify_email", "success", user.id, request)
    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token
        },
        message="Email verified successfully"
    )


@router.post("/send-reset-otp")
async def send_reset_otp(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    # 🚦 Rate limiting
    allowed = await check_otp_rate_limit(email)
    if not allowed:
        await log_event(db, "send_reset_otp", "rate_limited", None, request)
        raise HTTPException(status_code=429, detail="Too many OTP requests")

    otp = generate_otp()
    await store_otp(email, otp, "reset")

    await send_email_otp(email, otp)
    await log_event(db, "send_reset_otp", "success", None, request)

    return success_response(message="Reset OTP sent")


@router.post("/reset-password")
async def reset_password(payload: dict, request: Request, db: AsyncSession = Depends(get_db)):
    email = payload.get("email")
    otp = payload.get("otp")
    new_password = payload.get("new_password")

    if not all([email, otp, new_password]):
        raise HTTPException(status_code=400, detail="All fields are required")

    valid = await verify_otp(email, otp, "reset")

    if not valid:
        await log_event(db, "reset_password", "fail", None, request)
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = await get_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(new_password)

    await log_event(db, "reset_password", "success", user.id, request)
    return success_response(message="Password reset successful")


from fastapi.responses import RedirectResponse
import urllib.parse

@router.get("/google/login")
async def google_login_init():
    """
    🔗 Step 1: Redirect to Google OAuth2 consent screen.
    """
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(
    code: str, 
    response: Response, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """
    🔗 Step 2: Receive code from Google, exchange for token, and create session.
    """
    # 1. Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code")
        
        token_data = token_resp.json()
        id_token = token_data.get("id_token")

    # 2. Login user with ID Token
    user, access_token, refresh_token = await google_login(db, id_token, request)

    # 4. Redirect to Dashboard with cookies
    redirect_res = RedirectResponse(url=f"{settings.CLIENT_URL}/dashboard")
    
    redirect_res.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=1800,
    )

    redirect_res.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=7 * 24 * 3600,
    )

    await log_event(db, "google_login", "success", user.id, request)
    return redirect_res


@router.post("/google")
async def google_auth(payload: dict, response: Response, request: Request, db: AsyncSession = Depends(get_db)):
    id_token = payload.get("id_token")

    try:
        user, access_token, refresh_token = await google_login(db, id_token, request)

        # 🔁 Store session with device info
        # google_login already calls create_session but without request context.
        # I'll update oauth_service or just re-call here if needed.
        # For now, I'll update oauth_service to accept request.

        # 🍪 set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=1800,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite="lax",
            max_age=7 * 24 * 3600,
        )

        await log_event(db, "google_login", "success", user.id, request)

        return success_response(
            data={"id": user.id, "email": user.email},
            message="Google login successful"
        )
    except Exception as e:
        await log_event(db, "google_login", "fail", None, request)
        raise e
