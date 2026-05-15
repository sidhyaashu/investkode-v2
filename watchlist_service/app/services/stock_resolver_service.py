from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial import CompanyMaster
from app.schemas.watchlist_item import WatchlistItemResolvedCreate


def _clean(value):
    if value is None:
        return None

    value = str(value).strip()

    if not value:
        return None

    return value


async def resolve_stock_for_watchlist(
    financial_db: AsyncSession,
    fincode: int,
) -> WatchlistItemResolvedCreate:
    stmt = (
        select(CompanyMaster)
        .where(CompanyMaster.fincode == fincode)
        .limit(1)
    )

    result = await financial_db.execute(stmt)
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Stock not found in financial database",
        )

    company_name = (
        _clean(company.compname)
        or _clean(company.s_name)
        or f"Company {fincode}"
    )

    symbol = _clean(company.symbol)
    series = _clean(company.series)

    # NSE-first rule
    if symbol:
        return WatchlistItemResolvedCreate(
            fincode=company.fincode,
            company_name=company_name,
            exchange="NSE",
            symbol=symbol,
            series=series or "EQ",
            bse_scripcode=str(company.scripcode) if company.scripcode else None,
            display_symbol=symbol,
        )

    # BSE fallback
    if company.scripcode:
        return WatchlistItemResolvedCreate(
            fincode=company.fincode,
            company_name=company_name,
            exchange="BSE",
            symbol=None,
            series=None,
            bse_scripcode=str(company.scripcode),
            display_symbol=f"BSE:{company.scripcode}",
        )

    raise HTTPException(
        status_code=404,
        detail="Stock exists but has neither NSE symbol nor BSE scripcode",
    )