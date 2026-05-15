import httpx
import json
from fastapi import Request, HTTPException, Response
from app.proxy.circuit_breaker import DistributedCircuitBreaker
from app.proxy.retry import retry
from app.core.http_client import http_client
from app.core.redis import redis_client
import logging

logger = logging.getLogger(__name__)


_breakers = {}


def get_breaker(service_name: str):
    """🛡️ Distributed Circuit Breaker factory."""
    if service_name not in _breakers:
        _breakers[service_name] = DistributedCircuitBreaker(service_name)
    return _breakers[service_name]


ALLOWED_HEADERS = {
    "content-type",
    "authorization",
    "x-api-key",
    "x-request-id",
    "user-agent",
    "accept",
}

SAFE_RESPONSE_HEADERS = {
    "content-type",
    "content-length",
    "set-cookie",
    "x-request-id",
    "location",
}


def build_headers(request: Request):
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() in ALLOWED_HEADERS
    }

    access_token = request.cookies.get("access_token")
    if access_token:
        headers["cookie"] = f"access_token={access_token}"

    # Inject identity and tracing headers
    for attr in ["user_id", "tier", "auth_type", "request_id"]:
        val = getattr(request.state, attr, None)
        if val:
            header_name = f"X-{attr.replace('_', '-').title()}"
            headers[header_name] = str(val)

    return headers


async def proxy_request(request: Request, route_config: dict, path: str):
    """
    🚀 ENTERPRISE PROXY ENGINE.
    Handles caching, retries, and distributed circuit breaking.
    """
    target_url = route_config["target"]
    service_name = route_config.get("service_name", "default")
    timeout = route_config.get("timeout", 10.0)
    cache_ttl = route_config.get("cache_ttl", 0)

    # 🌟 UPGRADE: EDGE CACHING
    # Generate a unique cache key based on path, query, and user_id (privacy-safe)
    user_id = getattr(request.state, "user_id", "anon")
    cache_key = f"gw_cache:{path}:{request.url.query}:{user_id}"

    if request.method == "GET" and cache_ttl > 0:
        try:
            cached_resp = await redis_client.get(cache_key)
            if cached_resp:
                data = json.loads(cached_resp)
                return Response(
                    content=data["body"].encode(),
                    status_code=data["status"],
                    headers=data["headers"]
                )
        except Exception as e:
            logger.debug("Edge cache read failed: %s", e)

    body = await request.body()

    async def _do_proxy():
        headers = build_headers(request)
        url = f"{target_url}{path}"

        resp = await http_client.client.request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.query_params,
            content=body,
            timeout=timeout
        )
        return resp

    breaker = get_breaker(service_name)

    if not await breaker.allow():
        raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable (Circuit Open)")

    try:
        # 🛡️ Pass request method to retry logic
        upstream_resp = await retry(_do_proxy, method=request.method)
        await breaker.success()

        # 🛡️ Normalize Upstream Errors
        if upstream_resp.status_code >= 400:
            raise HTTPException(
                status_code=upstream_resp.status_code,
                detail=upstream_resp.text
            )

        # 🌟 UPGRADE: Save to Edge Cache if successful and TTL > 0
        if request.method == "GET" and cache_ttl > 0 and upstream_resp.status_code == 200:
            try:
                cache_data = {
                    "body": upstream_resp.text,
                    "status": upstream_resp.status_code,
                    "headers": {k: v for k, v in upstream_resp.headers.items() if k.lower() in SAFE_RESPONSE_HEADERS}
                }
                await redis_client.set(cache_key, json.dumps(cache_data), ex=cache_ttl)
            except Exception as e:
                logger.debug("Edge cache write failed: %s", e)

        response = Response(
            content=upstream_resp.content,
            status_code=upstream_resp.status_code,
            media_type=upstream_resp.headers.get("content-type")
        )

        for k, v in upstream_resp.headers.items():
            k_lower = k.lower()
            if k_lower in SAFE_RESPONSE_HEADERS and k_lower not in ["content-type", "content-length"]:
                response.headers.append(k, v)

        return response

    except httpx.TimeoutException:
        await breaker.failure()
        raise HTTPException(status_code=504, detail=f"Upstream service {service_name} timeout")
    except HTTPException:
        raise
    except Exception as e:
        await breaker.failure()
        raise HTTPException(status_code=502, detail=f"Upstream service {service_name} error or unreachable")
