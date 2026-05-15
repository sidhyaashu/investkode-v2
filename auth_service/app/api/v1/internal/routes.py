from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, decode_token, verify_internal
from app.core.response import success_response
from app.services.api_key_service import validate_api_key

router = APIRouter(prefix="/internal", tags=["Internal"], dependencies=[Depends(verify_internal)])


@router.post("/api-key/validate")
async def validate_key(payload: dict, db: AsyncSession = Depends(get_db)):
    raw_key = payload.get("api_key")

    data = await validate_api_key(db, raw_key)

    return success_response(data)


@router.post("/token/introspect")
async def introspect(payload: dict):
    token = payload.get("token")

    data = decode_token(token)

    return success_response({
        "active": True,
        "sub": data["sub"],
        "scope": data.get("scope"),
        "exp": data.get("exp")
    })
