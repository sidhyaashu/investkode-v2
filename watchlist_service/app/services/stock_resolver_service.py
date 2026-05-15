from sqlalchemy import or_
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




def _instrument_payload(company: CompanyMaster) -> dict:
    company_name = (
        _clean(company.compname)
        or _clean(company.s_name)
        or f"Company {company.fincode}"
    )

    symbol = _clean(company.symbol)
    series = _clean(company.series)

    if symbol:
        exchange = "NSE"
        display_symbol = symbol
    elif company.scripcode:
        exchange = "BSE"
        display_symbol = f"BSE:{company.scripcode}"
    else:
        exchange = "UNKNOWN"
        display_symbol = str(company.fincode)

    return {
        "id": str(company.fincode),
        "instrument_id": str(company.fincode),
        "fincode": company.fincode,
        "symbol": display_symbol,
        "name": company_name,
        "exchange": exchange,
        "sector": _clean(company.industry),
        "last_price": None,
        "change": None,
        "meta": {
            "logo": {
                "type": "initials",
                "label": (symbol or company_name or "ST")[:2].upper(),
                "variant": "default",
            }
        },
    }


async def search_instruments(
    financial_db: AsyncSession,
    query: str,
    limit: int = 20,
) -> list[dict]:
    q = query.strip()

    if len(q) < 2:
        return []

    like = f"%{q}%"

    stmt = (
        select(CompanyMaster)
        .where(
            or_(
                CompanyMaster.symbol.ilike(like),
                CompanyMaster.compname.ilike(like),
                CompanyMaster.s_name.ilike(like),
                CompanyMaster.bse_scrip_id.ilike(like),
            )
        )
        .where(CompanyMaster.status.ilike("%active%"))
        .order_by(
            CompanyMaster.symbol.asc().nullslast(),
            CompanyMaster.compname.asc().nullslast(),
        )
        .limit(limit)
    )

    result = await financial_db.execute(stmt)
    companies = result.scalars().all()

    return [_instrument_payload(company) for company in companies]


async def get_popular_instruments(
    financial_db: AsyncSession,
    limit: int = 12,
) -> list[dict]:
    symbols = [
        "RELIANCE",
        "TCS",
        "HDFCBANK",
        "ICICIBANK",
        "INFY",
        "SBIN",
        "LT",
        "AXISBANK",
        "KOTAKBANK",
        "BAJFINANCE",
        "WIPRO",
        "ITC",
    ]

    stmt = (
        select(CompanyMaster)
        .where(CompanyMaster.symbol.in_(symbols))
        .limit(limit)
    )

    result = await financial_db.execute(stmt)
    companies = result.scalars().all()

    by_symbol = {
        _clean(company.symbol): company
        for company in companies
        if _clean(company.symbol)
    }

    ordered = [
        by_symbol[symbol]
        for symbol in symbols
        if symbol in by_symbol
    ]

    return [_instrument_payload(company) for company in ordered]