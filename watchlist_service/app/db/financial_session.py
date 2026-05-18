from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings


financial_engine = create_async_engine(
    settings.FINANCIAL_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30.0,
    pool_recycle=290,
)

FinancialSessionLocal = async_sessionmaker(
    bind=financial_engine,
    expire_on_commit=False,
)