from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.response import error_response
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  # 🌟 UPGRADE
from prometheus_fastapi_instrumentator import Instrumentator  # 🌟 UPGRADE

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

app = FastAPI(title="InvestKode Gateway", lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standardizes error responses across the gateway."""
    return error_response(
        code=f"HTTP_{exc.status_code}",
        message=exc.detail,
        status_code=exc.status_code,
        meta={"request_id": getattr(request.state, "request_id", "unknown")}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    return error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred. Please try again later.",
        status_code=500,
        meta={"request_id": getattr(request.state, "request_id", "unknown")}
    )


@app.middleware("http")
async def security_headers(request, call_next):
    """🛡️ PRODUCTION HARDENING: Inject standard security headers."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# 🔒 Restricted CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://investkode.net"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 🌟 UPGRADE: Compress responses > 1000 bytes (Saves Bandwidth)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Core Infra Middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestSizeMiddleware)

# Protection Middlewares
app.add_middleware(AuthMiddleware)
app.add_middleware(RateLimitMiddleware)
# Routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(proxy_router)  # Catch-all proxy

# 🌟 UPGRADE: Expose /metrics for Prometheus/Grafana (Must be at the end)
Instrumentator().instrument(app).expose(app)
