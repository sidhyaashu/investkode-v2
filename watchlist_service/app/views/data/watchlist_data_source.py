from typing import Any, Literal
import logging

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.financial import CompanyEquity, CompanyMaster
from app.services.watchlist_service import initialize_default_watchlist_for_new_user

logger = logging.getLogger(__name__)

SortDirection = Literal["asc", "desc"]


class WatchlistDataSource:
    def __init__(self, db: AsyncSession, financial_db: AsyncSession):
        self.db = db
        self.financial_db = financial_db

    async def fetch_watchlists(self, user_id: str) -> list[dict[str, Any]]:
        stmt = text(
            """
            SELECT
                w.id,
                w.name,
                w.is_default,
                w.sort_order,
                w.created_at,
                COUNT(wi.id) AS items_count
            FROM app.watchlists w
            LEFT JOIN app.watchlist_items wi ON wi.watchlist_id = w.id AND wi.deleted_at IS NULL
            WHERE w.user_id = :user_id
              AND w.deleted_at IS NULL
            GROUP BY w.id
            ORDER BY w.is_default DESC, w.sort_order ASC, w.created_at ASC
            """
        )

        result = await self.db.execute(stmt, {"user_id": user_id})
        rows = [dict(row) for row in result.mappings().all()]

        if not rows and self.financial_db:
            # Trigger initialization
            await initialize_default_watchlist_for_new_user(self.db, self.financial_db, user_id)
            # Re-fetch
            result = await self.db.execute(stmt, {"user_id": user_id})
            rows = [dict(row) for row in result.mappings().all()]

        return rows

    async def fetch_rows(
        self,
        user_id: str,
        watchlist_id: str | None,
        mode: Literal["client", "server"],
        page: int,
        page_size: int,
        sort_key: str,
        sort_dir: SortDirection,
        search: str | None,
        exchange: str | None,
        sector: str | None,
        allowed_sort_keys: dict[str, str],
    ) -> tuple[list[dict[str, Any]], int]:
        # 1. Base where clause for auth_db
        where = [
            "w.user_id = :user_id",
            "w.deleted_at IS NULL",
            "wi.deleted_at IS NULL",
        ]

        params: dict[str, Any] = {
            "user_id": user_id,
        }

        # Resolve sector cross-database if filtering server-side
        matching_fincodes = None
        if mode == "server" and sector:
            try:
                sector_stmt = select(CompanyMaster.fincode).where(
                    CompanyMaster.industry.ilike(f"%{sector}%")
                )
                sector_result = await self.financial_db.execute(sector_stmt)
                matching_fincodes = [r[0] for r in sector_result.all()]
            except Exception as e:
                logger.error(f"Error fetching matching fincodes for sector: {e}")
                matching_fincodes = []

        if watchlist_id and watchlist_id != "all":
            where.append("w.id = :watchlist_id")
            params["watchlist_id"] = watchlist_id

        # Server-side filtering
        if mode == "server":
            if search:
                where.append(
                    """
                    (
                        LOWER(wi.symbol) LIKE LOWER(:search)
                        OR LOWER(wi.company_name) LIKE LOWER(:search)
                        OR LOWER(wi.exchange) LIKE LOWER(:search)
                    )
                    """
                )
                params["search"] = f"%{search}%"

            if exchange:
                where.append("wi.exchange = :exchange")
                params["exchange"] = exchange

            if sector:
                if matching_fincodes:
                    where.append("wi.fincode = ANY(:matching_fincodes)")
                    params["matching_fincodes"] = matching_fincodes
                else:
                    where.append("1 = 0")

        where_sql = " AND ".join(where)

        # 2. Get total count
        count_stmt = text(
            f"""
            SELECT COUNT(*) AS total
            FROM app.watchlist_items wi
            JOIN app.watchlists w ON w.id = wi.watchlist_id
            WHERE {where_sql}
            """
        )

        count_result = await self.db.execute(count_stmt, params)
        total_rows = int(count_result.scalar() or 0)

        if total_rows == 0:
            return [], 0

        # 3. Fetch rows from auth_db
        # If we are sorting by a financial metric (not in wi.*), we fetch all fincodes first
        # For simplicity in this step, we'll fetch the requested page from auth_db
        # and then enrichment. 
        # TODO: Handle server-side sorting by financial metrics properly by joining or fetching all IDs.

        # Dynamic mode override: if total_rows is small, force client mode to fetch all rows
        if mode == "server" and total_rows <= 100:
            mode = "client"

        # If we are in client mode, the frontend will handle sorting by market_cap etc.
        # We just return them in default position order to prevent SQL column errors.
        if mode == "client":
            order_column = "wi.position"
            order_direction = "ASC"
        else:
            order_column = allowed_sort_keys.get(sort_key, "wi.position")
            order_direction = "DESC" if sort_dir == "desc" else "ASC"

        limit_sql = ""
        if mode == "server":
            offset = (page - 1) * page_size
            params["limit"] = page_size
            params["offset"] = offset
            limit_sql = "LIMIT :limit OFFSET :offset"

        rows_stmt = text(
            f"""
            SELECT
                wi.id,
                wi.watchlist_id,
                wi.fincode,
                wi.symbol,
                wi.display_symbol,
                wi.exchange,
                wi.company_name,
                wi.position,
                wi.created_at
            FROM app.watchlist_items wi
            JOIN app.watchlists w ON w.id = wi.watchlist_id
            WHERE {where_sql}
            ORDER BY {order_column} {order_direction}, wi.created_at DESC
            {limit_sql}
            """
        )

        rows_result = await self.db.execute(rows_stmt, params)
        auth_rows = [dict(row) for row in rows_result.mappings().all()]

        if not auth_rows:
            return [], total_rows

        # 4. Enrich with financial data
        fincodes = [row["fincode"] for row in auth_rows if row.get("fincode")]
        equity_data = {}
        
        if fincodes:
            try:
                # Separate fincodes by exchange
                nse_fincodes = [row["fincode"] for row in auth_rows if row.get("fincode") and row.get("exchange") == "NSE"]
                bse_fincodes = [row["fincode"] for row in auth_rows if row.get("fincode") and row.get("exchange") == "BSE"]
                
                price_map = {}
                stats_map = {}
                
                # Fetch NSE latest prices and stats
                if nse_fincodes:
                    latest_nse_stmt = text("""
                        SELECT DISTINCT ON (fincode)
                            fincode, "open", "close"
                        FROM public.nse_monthprice
                        WHERE fincode = ANY(:fincodes)
                        ORDER BY fincode, "year" DESC, "month" DESC
                    """)
                    stats_nse_stmt = text("""
                        SELECT 
                            fincode,
                            MIN(low) as low_52w,
                            MAX(high) as high_52w
                        FROM public.nse_monthprice
                        WHERE fincode = ANY(:fincodes)
                          AND (year * 100 + month) >= 202505
                        GROUP BY fincode
                    """)
                    
                    nse_prices = await self.financial_db.execute(latest_nse_stmt, {"fincodes": nse_fincodes})
                    for row in nse_prices:
                        price_map[row[0]] = {
                            "open": float(row[1]) if row[1] is not None else None,
                            "close": float(row[2]) if row[2] is not None else None
                        }
                        
                    nse_stats = await self.financial_db.execute(stats_nse_stmt, {"fincodes": nse_fincodes})
                    for row in nse_stats:
                        stats_map[row[0]] = {
                            "low_52w": float(row[1]) if row[1] is not None else None,
                            "high_52w": float(row[2]) if row[2] is not None else None
                        }
                
                # Fetch BSE latest prices and stats
                if bse_fincodes:
                    latest_bse_stmt = text("""
                        SELECT DISTINCT ON (fincode)
                            fincode, "open", "close"
                        FROM public.monthlyprice
                        WHERE fincode = ANY(:fincodes)
                        ORDER BY fincode, "year" DESC, "month" DESC
                    """)
                    stats_bse_stmt = text("""
                        SELECT 
                            fincode,
                            MIN(low) as low_52w,
                            MAX(high) as high_52w
                        FROM public.monthlyprice
                        WHERE fincode = ANY(:fincodes)
                          AND (year * 100 + month) >= 202505
                        GROUP BY fincode
                    """)
                    
                    bse_prices = await self.financial_db.execute(latest_bse_stmt, {"fincodes": bse_fincodes})
                    for row in bse_prices:
                        price_map[row[0]] = {
                            "open": float(row[1]) if row[1] is not None else None,
                            "close": float(row[2]) if row[2] is not None else None
                        }
                        
                    bse_stats = await self.financial_db.execute(stats_bse_stmt, {"fincodes": bse_fincodes})
                    for row in bse_stats:
                        stats_map[row[0]] = {
                            "low_52w": float(row[1]) if row[1] is not None else None,
                            "high_52w": float(row[2]) if row[2] is not None else None
                        }

                # 3. Query financial_db for equity metrics and sector
                equity_stmt = (
                    select(CompanyEquity, CompanyMaster.industry)
                    .join(CompanyMaster, CompanyMaster.fincode == CompanyEquity.fincode)
                    .where(CompanyEquity.fincode.in_(fincodes))
                )
                equity_result = await self.financial_db.execute(equity_stmt)
                
                for eq, industry in equity_result.all():
                    price_info = price_map.get(eq.fincode, {})
                    stats_info = stats_map.get(eq.fincode, {})
                    
                    open_price = price_info.get("open")
                    close_price = price_info.get("close")
                    
                    change_pct = None
                    if open_price and close_price and open_price != 0:
                        change_pct = ((close_price - open_price) / open_price) * 100

                    equity_data[eq.fincode] = {
                        "last_price": eq.price,
                        "market_cap": float(eq.mcap) if eq.mcap else None,
                        "pe": float(eq.ttmpe) if eq.ttmpe else None,
                        "yield": eq.yield_,
                        "book_value": eq.booknavpershare,
                        "sector": industry or "—",
                        "change_percent": change_pct,
                        "low_52w": stats_info.get("low_52w") or (eq.price * 0.8 if eq.price else 0),
                        "high_52w": stats_info.get("high_52w") or (eq.price * 1.2 if eq.price else 0),
                    }
            except Exception as e:
                logger.error(f"Error fetching financial data: {e}")
                # Don't fail the whole request if financial DB is down

        # 5. Merge data
        for row in auth_rows:
            fincode = row.get("fincode")
            if fincode in equity_data:
                row.update(equity_data[fincode])
            else:
                # Defaults
                row["last_price"] = None
                row["market_cap"] = None
                row["pe"] = None

        return auth_rows, total_rows