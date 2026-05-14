from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.proxy import router as proxy_router
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_size import RequestSizeMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.auth import AuthMiddleware
from app.core.http_client import http_client



@asynccontextmanager
async def lifespan(app: FastAPI):
    http_client.start()
    yield
    await http_client.stop()

app = FastAPI(title="InvestCode Gateway",lifespan=lifespan)



@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Standardizes error responses across the gateway.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions to prevent leaking stack traces.
    """
    # In production, log the full exception: logger.exception(exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        },
    )


@app.middleware("http")
async def security_headers(request, call_next):
    """
    🛡️ PRODUCTION HARDENING: Inject standard security headers.
    """
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"

    return response


# 🔒 Restricted CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://investkode.net",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Core Infra Middlewares (Order: ID -> Logging -> Size)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestSizeMiddleware)

# Protection Middlewares
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)

# Routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(proxy_router)  # Catch-all proxy