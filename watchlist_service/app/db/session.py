from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings


watchlist_engine = create_async_engine(
    settings.WATCHLIST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30.0,
    pool_recycle=1800,
)

WatchlistSessionLocal = async_sessionmaker(
    bind=watchlist_engine,
    expire_on_commit=False,
)