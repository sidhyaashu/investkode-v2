from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import JSONResponse

from app.repository.rate_limit_repo import increment, get_ttl
from app.repository.rate_limit_fallback import local_limiter
from app.core.redis import redis_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


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

        # 🌟 UPGRADE: Fail2Ban Check. Drop request instantly if IP is blacklisted.
        try:
            if await redis_client.exists(f"blacklist:ip:{ip}"):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Your IP has been temporarily banned for spamming."}
                )
        except Exception as e:
            logger.warning("Fail2Ban check failed: %s", e)

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

                # 🌟 UPGRADE: Record a violation. If > FAIL2BAN_VIOLATIONS_MAX, ban IP.
                violation_key = f"violations:ip:{ip}"
                violations = await redis_client.incr(violation_key)
                if int(violations) == 1:
                    await redis_client.expire(violation_key, 60)  # Count violations per minute

                if int(violations) > settings.FAIL2BAN_VIOLATIONS_MAX:
                    await redis_client.set(f"blacklist:ip:{ip}", "banned", ex=settings.FAIL2BAN_BAN_DURATION)

                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests", "limit": limit},
                    headers={"Retry-After": str(ttl)}
                )

        except Exception as e:
            logger.warning("Redis rate limit failed, using local fallback. Error: %s", e)
            # 🔥 fallback to local limiter
            allowed = local_limiter.allow(key, limit=limit)

            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too Many Requests (fallback)", "limit": limit}
                )

        return await call_next(request)
