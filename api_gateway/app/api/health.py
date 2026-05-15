import httpx
import asyncio
import time
from fastapi import APIRouter
from app.core.config import settings
from app.core.http_client import http_client
from app.core.response import success_response

router = APIRouter()

# 🛡️ Health Cache State
_health_cache = {
    "data": None,
    "last_updated": 0
}
CACHE_TTL_SECONDS = 10


async def check_service(name: str, url: str):
    try:
        # Use the global http_client for efficiency
        resp = await http_client.client.get(f"{url}/health", timeout=2.0)
        if resp.status_code == 200:
            return name, "ok"
        return name, "degraded"
    except Exception:
        return name, "down"


@router.get("/health")
async def health():
    """
    🛡️ Aggregated Health Check with Caching.
    Pings downstream services but caches results for 10 seconds.
    """
    now = time.time()
    
    if _health_cache["data"] and (now - _health_cache["last_updated"]) < CACHE_TTL_SECONDS:
        return _health_cache["data"]

    # Ping downstream services in parallel with strict timeout
    try:
        results = await asyncio.wait_for(
            asyncio.gather(
                check_service("auth_service", settings.AUTH_SERVICE_URL),
                check_service("watchlist_service", settings.WATCHLIST_SERVICE_URL)
            ),
            timeout=3.0 # Strict total timeout
        )
        services_health = {name: status for name, status in results}
    except asyncio.TimeoutError:
        services_health = {"auth_service": "unknown", "watchlist_service": "unknown"}

    health_data = {
        "status": "ok",
        "service": "api_gateway",
        "downstream": services_health,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(now))
    }

    _health_cache["data"] = health_data
    _health_cache["last_updated"] = now

    return success_response(data=health_data, message="API Gateway Health")
