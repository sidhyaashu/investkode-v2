from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.response import success_response, error_response
from app.db.session import watchlist_engine
from app.db.financial_session import financial_engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.INTERNAL_SECRET:
        raise RuntimeError("INTERNAL_SECRET must be set")

    try:
        async with watchlist_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Watchlist database connected")
    except Exception as e:
        logger.exception("Watchlist database connection failed")
        raise RuntimeError("Watchlist database startup check failed") from e

    # try:
    #     async with financial_engine.begin() as conn:
    #         await conn.execute(text("SELECT 1"))
    #     logger.info("Financial database connected")
    # except Exception as e:
    #     import traceback
    #     traceback.print_exc()
    #     logger.exception("Financial database connection failed")
    #     raise RuntimeError("Financial database startup check failed") from e

    yield

    await watchlist_engine.dispose()
    await financial_engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)


@app.get("/health")
async def root_health():
    return success_response(
        data={
            "service": "watchlist_service",
            "status": "ok",
        },
        message="Watchlist service root health",
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(
        code=f"HTTP_{exc.status_code}",
        message=exc.detail,
        status_code=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        code="VALIDATION_ERROR",
        message=str(exc.errors()),
        status_code=422,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception in watchlist_service")
    return error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=500,
    )


app.include_router(v1_router, prefix="/api/v1")