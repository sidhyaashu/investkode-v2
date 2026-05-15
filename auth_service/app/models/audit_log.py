import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True)

    action = Column(String)
    status = Column(String)  # success / fail

    ip = Column(String)
    user_agent = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
