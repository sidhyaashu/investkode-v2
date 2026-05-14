from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import JSONResponse

from app.repository.rate_limit_repo import increment, get_ttl
from app.repository.rate_limit_fallback import local_limiter


TIER_LIMITS = {
    "free": 100,
    "pro": 1000,
    "enterprise": 5000,
    "none": 50  # Unauthenticated
}

AI_TIER_LIMITS = {
    "free": 10,
    "pro": 100,
    "enterprise": 500,
    "none": 5
}


class RateLimitMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        # get IP (proxy-safe)
        forwarded = request.headers.get("x-forwarded-for")
        ip = forwarded.split(",")[0] if forwarded else request.client.host

        user_id = getattr(request.state, "user_id", None)
        tier = getattr(request.state, "tier", "none")

        # choose key + limit
        if path.startswith("/api/v1/ai"):
            key = f"rate_limit:ai:{user_id or ip}"
            limit = AI_TIER_LIMITS.get(tier, 5)

        elif user_id:
            key = f"rate_limit:user:{user_id}"
            limit = TIER_LIMITS.get(tier, 100)

        else:
            key = f"rate_limit:ip:{ip}"
            limit = TIER_LIMITS.get("none", 50)

        try:
            count = await increment(key)

            if count > limit:
                ttl = await get_ttl(key)

                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests", "limit": limit},
                    headers={"Retry-After": str(ttl)}
                )

        except Exception:
            # 🔥 fallback to local limiter
            allowed = local_limiter.allow(key, limit=limit)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests (fallback)", "limit": limit}
                )

        return await call_next(request)
