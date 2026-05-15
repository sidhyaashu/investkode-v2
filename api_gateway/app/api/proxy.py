from fastapi import APIRouter, Request, HTTPException
from app.core.routing import resolve_route
from app.proxy.engine import proxy_request
from app.proxy.streaming import stream_request

router = APIRouter()


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(request: Request, path: str):
    full_path = f"/{path}"
    route_config, _ = resolve_route(full_path)

    if not route_config:
        raise HTTPException(status_code=404, detail="Route not found")

    if route_config.get("stream"):
        return await stream_request(request, route_config, full_path)

    return await proxy_request(request, route_config, full_path)
