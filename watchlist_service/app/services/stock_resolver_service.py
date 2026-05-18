from fastapi import HTTPException
from sqlalchemy import or_, select, text
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

    # Try to get price from equity relation if it was joined
    last_price = None
    if hasattr(company, "equity") and company.equity:
        # equity is a list because of uselist=True
        # Sort by year_end descending to get latest
        latest_equity = sorted(company.equity, key=lambda x: x.year_end, reverse=True)[0]
        last_price = float(latest_equity.price) if latest_equity.price else None

    return {
        "id": str(company.fincode),
        "instrument_id": str(company.fincode),
        "fincode": company.fincode,
        "symbol": display_symbol,
        "name": company_name,
        "exchange": exchange,
        "sector": _clean(company.industry),
        "last_price": last_price,
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

    from sqlalchemy.orm import joinedload
    from app.models.financial import CompanyEquity, NSEMonthPrice
    
    # Subquery for latest price stats to get change
    # We'll just join the latest record for each fincode
    
    stmt = (
        select(CompanyMaster)
        .outerjoin(CompanyEquity, CompanyEquity.fincode == CompanyMaster.fincode)
        .options(joinedload(CompanyMaster.equity))
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
    companies = result.scalars().unique().all()
    
    # Fetch price change data for these companies
    fincodes = [c.fincode for c in companies]
    change_data = {}
    
    if fincodes:
        price_stmt = text("""
            SELECT DISTINCT ON (fincode)
                fincode, "open", "close"
            FROM public.nse_monthprice
            WHERE fincode = ANY(:fincodes)
            ORDER BY fincode, "year" DESC, "month" DESC
        """)
        prices = await financial_db.execute(price_stmt, {"fincodes": fincodes})
        for row in prices:
            open_p = float(row[1]) if row[1] else 0
            close_p = float(row[2]) if row[2] else 0
            if open_p > 0:
                change_data[row[0]] = ((close_p - open_p) / open_p) * 100

    return [
        {**_instrument_payload(company), "change": change_data.get(company.fincode)} 
        for company in companies
    ]


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

    from sqlalchemy.orm import joinedload
    from app.models.financial import CompanyEquity
    
    stmt = (
        select(CompanyMaster)
        .outerjoin(CompanyEquity, CompanyEquity.fincode == CompanyMaster.fincode)
        .options(joinedload(CompanyMaster.equity))
        .where(CompanyMaster.symbol.in_(symbols))
        .limit(limit)
    )

    result = await financial_db.execute(stmt)
    companies = result.scalars().unique().all()

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