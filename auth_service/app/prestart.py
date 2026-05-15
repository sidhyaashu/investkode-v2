import asyncio
import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.api_key import APIKey
from app.models.audit_log import AuditLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    try:
        async with engine.begin() as conn:
            # Create tables
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())
