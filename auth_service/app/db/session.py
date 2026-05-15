from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # --- Production Resilience Settings ---
    # Silently test + heal connections dropped by firewalls/cloud networking
    pool_pre_ping=True,
    # Max simultaneous connections kept in pool
    pool_size=20,
    # Extra connections allowed during traffic burst (total max = pool_size + max_overflow)
    max_overflow=10,
    # Time (seconds) to wait for a pool connection before raising an error
    pool_timeout=30.0,
    # Recycle connections older than 30 minutes to prevent stale TCP state
    pool_recycle=1800,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)
