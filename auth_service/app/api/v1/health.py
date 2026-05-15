from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.deps import get_db
from app.core.redis import redis_client
from app.core.response import success_response

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    # 1. Check Database
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    # 2. Check Redis
    redis_status = "ok"
    try:
        await redis_client.ping()
    except Exception as e:
        redis_status = f"error: {str(e)}"

    overall_status = "ok" if db_status == "ok" and redis_status == "ok" else "degraded"

    return success_response({
        "status": overall_status,
        "dependencies": {
            "database": db_status,
            "redis": redis_status
        }
    })
