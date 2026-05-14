import hashlib
import httpx
from fastapi import Request, HTTPException
from app.repository.redis import redis_client
from app.core.config import settings
from app.core.http_client import http_client


def _hash_key(raw_key: str):
    """
    🛡️ Salted Hashing: Protects against rainbow table attacks.
    Uses INTERNAL_SECRET as the salt. Must match Auth Service logic.
    """
    salted = raw_key + settings.INTERNAL_SECRET
    return hashlib.sha256(salted.encode()).hexdigest()


async def fetch_from_auth_service(raw_key: str):
    try:
        resp = await http_client.client.post(
            f"{settings.AUTH_SERVICE_URL}/api/v1/internal/api-key/validate",
            json={"api_key": raw_key},
            headers={"x-internal-secret": settings.INTERNAL_SECRET},
            timeout=5.0
        )

        if resp.status_code != 200:
            return None

        return resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Auth service timeout during key validation")
    except Exception:
        return None


async def validate_api_key(request: Request):
    raw_key = request.headers.get("x-api-key")

    if not raw_key:
        return None

    key_hash = _hash_key(raw_key)
    cache_key = f"api_key:{key_hash}"

    # 1. Check Redis
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            import json
            return json.loads(cached)
    except Exception:
        pass

    # 2. Fallback to Auth Service
    data = await fetch_from_auth_service(raw_key)

    if not data:
        return None

    # 3. Cache result for 5 mins
    try:
        import json
        await redis_client.set(cache_key, json.dumps(data), ex=300)
    except Exception:
        pass

    return data
