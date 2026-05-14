from fastapi import APIRouter, Request, HTTPException
from app.core.routing import resolve_route
from app.proxy.engine import proxy_request
from app.proxy.streaming import stream_request

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(request: Request, path: str):

    full_path = f"/{path}"

    route, _ = resolve_route(full_path)

    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    target = route["target"]
    service_name = route.get("service_name", "unknown")
    timeout = route.get("timeout", 10.0)

    # streaming support
    if route.get("stream"):
        return await stream_request(request, target, full_path, service_name, timeout)

    return await proxy_request(request, target, full_path, service_name, timeout)
