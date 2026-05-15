from pydantic import BaseModel


class APIKeyCreate(BaseModel):
    user_id: str
    key_hash: str
    scope: str
    tier: str


class APIKeyData(BaseModel):
    user_id: str
    scope: str
    tier: str
