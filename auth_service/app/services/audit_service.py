from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog


async def log_event(db: AsyncSession, action: str, status: str, user_id: str = None, request = None):
    log = AuditLog(
        user_id=user_id,
        action=action,
        status=status,
        ip=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
