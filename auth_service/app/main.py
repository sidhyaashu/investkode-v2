from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from typing import cast, Awaitable

from app.api.v1.router import router as v1_router
from app.api.v1.health import router as health_v1_router
from app.core.redis import redis_client
from app.db.session import engine
from app.core.config import settings
from app.core.response import success_response
from app.core.http_client import http_client
from fastapi import Request, HTTPException
from fastapi.exceptions import RequestValidationError
from app.core.response import error_response

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Validate config
    if (
        not settings.SECRET_KEY
        or settings.SECRET_KEY == "super-secret-key-change-this"
    ):
        logger.warning("SECRET_KEY is not set securely!")

    if not settings.INTERNAL_SECRET:
        raise RuntimeError("INTERNAL_SECRET must be set!")

    # Redis health check
    try:
        await cast(Awaitable[bool], redis_client.ping())
        logger.info("Redis connected")
    except Exception as e:
        logger.exception("Redis connection failed")
        raise RuntimeError("Redis startup check failed") from e

    # Database health check
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connected")
    except Exception as e:
        logger.exception("Database connection failed")
        raise RuntimeError("Database startup check failed") from e

    # Start global HTTP client connection pool
    http_client.start()
    logger.info("HTTP client started")

    yield

    # Cleanup resources
    try:
        await redis_client.aclose()
        logger.info("Redis connection closed")
    except Exception:
        logger.exception("Failed to close Redis connection")

    try:
        await engine.dispose()
        logger.info("Database engine disposed")
    except Exception:
        logger.exception("Failed to dispose database engine")

    # Stop global HTTP client and drain all pooled connections
    try:
        await http_client.stop()
        logger.info("HTTP client stopped")
    except Exception:
        logger.exception("Failed to stop HTTP client")


app = FastAPI(
    title="Auth Service",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost",
        "http://localhost:8000",
        "https://investkode.net",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root Health Endpoint
@app.get("/health")
async def root_health():
    
    return success_response({"service": "auth", "status": "ok"})





@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = f"HTTP_{exc.status_code}"
    return error_response(code=code, message=exc.detail, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(code="VALIDATION_ERROR", message=str(exc.errors()), status_code=422)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return error_response(code="INTERNAL_SERVER_ERROR", message="An unexpected error occurred", status_code=500)


# API Routers
app.include_router(v1_router, prefix="/api/v1")
app.include_router(health_v1_router, prefix="/api/v1")
