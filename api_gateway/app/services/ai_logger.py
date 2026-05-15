import time
import json
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request


class AILoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        if not request.url.path.startswith("/api/v1/ai"):
            return await call_next(request)

        start = time.time()

        response = await call_next(request)

        duration = (time.time() - start) * 1000

        log = {
            "type": "AI_REQUEST",
            "user_id": getattr(request.state, "user_id", None),
            "path": request.url.path,
            "latency_ms": round(duration, 2)
        }

        print(json.dumps(log))

        return response
