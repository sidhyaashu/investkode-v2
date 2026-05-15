import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    key_hash = Column(String, unique=True, nullable=False, index=True)

    scope = Column(String, default="read")  # read, write, admin
    tier = Column(String, default="free")    # free, pro, enterprise

    is_active = Column(Boolean, default=True)

    # Usage tracking
    request_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
