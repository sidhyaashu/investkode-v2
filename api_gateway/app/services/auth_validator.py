from fastapi import Request, HTTPException
from app.core.security import decode_jwt


async def validate_jwt(request: Request):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication cookie")

    payload = decode_jwt(token)

    return payload
