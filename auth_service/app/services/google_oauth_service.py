import logging
from fastapi import HTTPException
from app.core.config import settings
from app.core.http_client import http_client

logger = logging.getLogger(__name__)


async def verify_google_token(id_token: str):
    try:
        resp = await http_client.client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
            timeout=5.0,
        )
    except Exception as e:
        logger.error("Google OAuth network error: %s", e)
        raise HTTPException(status_code=503, detail="Unable to reach Google authentication service. Please try again.")

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Google sign-in failed. The token provided is invalid or has expired.")

    data = resp.json()

    if data.get("aud") != settings.GOOGLE_CLIENT_ID:
        logger.warning("Google token audience mismatch: expected %s, got %s", settings.GOOGLE_CLIENT_ID, data.get("aud"))
        raise HTTPException(status_code=400, detail="Google sign-in failed. Token audience mismatch.")

    return data
