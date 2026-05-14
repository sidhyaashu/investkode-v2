from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from app.core.config import settings


class RequestSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")

        if content_length and int(content_length) > settings.MAX_REQUEST_SIZE:
            raise HTTPException(status_code=413, detail="Payload too large")

        return await call_next(request)
