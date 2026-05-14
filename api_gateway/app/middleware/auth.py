from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from starlette.responses import JSONResponse

from app.core.constants import PUBLIC_ROUTES
from app.core.routing import resolve_route
from app.services.auth_validator import validate_jwt
from app.services.api_key_validator import validate_api_key


class AuthMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        request_id = getattr(request.state, "request_id", "unknown")

        # 🔓 Public routes bypass
        if request.method == "OPTIONS" or any(path.startswith(p) for p in PUBLIC_ROUTES):
            return await call_next(request)

        route_config, _ = resolve_route(path)

        if not route_config:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": {
                        "code": "HTTP_404",
                        "message": "Route not found",
                        "request_id": request_id
                    }
                }
            )

        auth_required = route_config.get("auth_required", True)

        if not auth_required:
            return await call_next(request)

        try:
            # 🔑 Try API key first
            api_payload = await validate_api_key(request)

            if api_payload:
                request.state.user_id = api_payload.get("user_id") # Consistent naming
                request.state.tier = api_payload.get("tier", "free")
                request.state.auth_type = "API_KEY"
            else:
                # 🔐 Fallback to JWT (cookie)
                jwt_payload = await validate_jwt(request)
                request.state.user_id = jwt_payload.get("sub")
                request.state.tier = jwt_payload.get("scope", "free")
                request.state.auth_type = "JWT"

        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": f"HTTP_{e.status_code}",
                        "message": e.detail,
                        "request_id": request_id
                    }
                }
            )

        return await call_next(request)
