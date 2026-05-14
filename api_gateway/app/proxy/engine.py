import httpx
from fastapi import Request, HTTPException, Response
from app.proxy.circuit_breaker import CircuitBreaker
from app.proxy.retry import retry
from app.core.http_client import http_client

# Global state for breakers
_breakers = {}


def get_breaker(service_name: str):
    """
    🛡️ PER-SERVICE Circuit Breaker.
    Prevents a single failing service from cascading and killing the whole gateway.
    """
    if service_name not in _breakers:
        _breakers[service_name] = CircuitBreaker(service_name)
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


async def proxy_request(request: Request, target_url: str, path: str, service_name: str = "default", timeout: float = 10.0):
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

    try:
        if not breaker.allow():
            raise HTTPException(status_code=503, detail=f"Service {service_name} unavailable (Circuit Open)")

        # 🛡️ Pass request method to retry logic
        upstream_resp = await retry(_do_proxy, method=request.method)
        breaker.success()

        # 🛡️ Normalize Upstream Errors
        # Don't leak raw service internal errors; map them to standard gateway errors
        if upstream_resp.status_code >= 400:
            raise HTTPException(
                status_code=upstream_resp.status_code,
                detail=upstream_resp.text
            )

        response = Response(
            content=upstream_resp.content,
            status_code=upstream_resp.status_code,
            media_type=upstream_resp.headers.get("content-type")
        )

        for k, v in upstream_resp.headers.items():
            k_lower = k.lower()
            # Only append headers that aren't already handled by the Response constructor
            if k_lower in SAFE_RESPONSE_HEADERS and k_lower not in ["content-type", "content-length"]:
                response.headers.append(k, v)

        return response

    except httpx.TimeoutException:
        breaker.failure()
        raise HTTPException(status_code=504, detail=f"Upstream service {service_name} timeout")
    except HTTPException:
        raise
    except Exception as e:
        breaker.failure()
        raise HTTPException(status_code=502, detail=f"Upstream service {service_name} error or unreachable")
