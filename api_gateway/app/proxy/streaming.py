import httpx
from fastapi import Request
from starlette.responses import StreamingResponse
from app.proxy.engine import build_headers
from app.core.http_client import http_client

async def stream_request(request: Request, route_config: dict, path: str):
    # Extract config details just like in proxy_request
    target_url = route_config["target"]
    
    # For streaming, we use a custom timeout to prevent infinite hangs
    stream_timeout = httpx.Timeout(timeout=None, read=60.0)
    
    url = f"{target_url}{path}"
    headers = build_headers(request)

    async def generator():
        async with http_client.client.stream(
            method=request.method,
            url=url,
            headers=headers,
            params=request.query_params,
            content=request.stream(),
            timeout=stream_timeout
        ) as resp:
            async for chunk in resp.aiter_bytes():
                # 🛡️ Disconnect Handling: Stop streaming if the client closes the connection
                if await request.is_disconnected():
                    break
                yield chunk

    return StreamingResponse(generator(), media_type="text/event-stream")
