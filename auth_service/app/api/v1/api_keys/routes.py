from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.response import success_response
from app.services.api_key_service import create_user_api_key, list_api_keys, revoke_api_key

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


@router.post("/create")
async def create_key(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current["user_id"]

    key = await create_user_api_key(db, user_id)

    return success_response(
        data={"api_key": key},
        message="Store this key securely"
    )


@router.get("/")
async def list_keys(
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current["user_id"]
    keys = await list_api_keys(db, user_id)
    return success_response([
        {
            "id": k.id,
            "scope": k.scope,
            "tier": k.tier,
            "request_count": k.request_count,
            "last_used_at": k.last_used_at,
            "created_at": k.created_at
        }
        for k in keys
    ])


@router.delete("/{key_id}")
async def delete_key(
    key_id: str,
    current=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = current["user_id"]
    await revoke_api_key(db, key_id, user_id)
    return success_response(message="API Key revoked")
