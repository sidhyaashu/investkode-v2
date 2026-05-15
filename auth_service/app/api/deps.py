import jwt
from fastapi import Request, HTTPException, Depends
from app.core.config import settings
from app.db.session import AsyncSessionLocal


async def get_db():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session


def decode_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience="investKode",
            issuer="auth_service"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)

    return {
        "user_id": payload["sub"],
        "scope": payload.get("scope", "user")
    }


def verify_internal(request: Request):
    secret = request.headers.get("x-internal-secret")

    if secret != settings.INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: Internal Only")
