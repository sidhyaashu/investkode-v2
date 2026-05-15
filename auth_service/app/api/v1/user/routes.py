from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import success_response
from app.repository.user_repo import get_user_by_id

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/me")
async def get_me(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_id(db, current["user_id"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return success_response({
        "id": user.id,
        "email": user.email,
        "verified": user.is_verified,
        "active": user.is_active
    })
