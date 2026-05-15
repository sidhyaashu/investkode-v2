from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.response import success_response


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "ok"

    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    overall_status = "ok" if db_status == "ok" else "degraded"

    return success_response(
        data={
            "service": "watchlist_service",
            "status": overall_status,
            "dependencies": {
                "database": db_status
            }
        },
        message="Watchlist service health"
    )