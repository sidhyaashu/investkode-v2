from math import ceil
from typing import Literal, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.watchlist_service import list_watchlists_for_user
from app.services.watchlist_item_service import get_items_for_watchlist


CLIENT_PROCESSING_LIMIT = 100


DEFAULT_PRESETS = [
    {
        "id": "preset_core",
        "label": "Core holdings",
        "description": "Your long-term foundation stocks",
        "type": "core",
    },
    {
        "id": "preset_it",
        "label": "IT Services",
        "description": "Technology and software companies",
        "type": "it",
    },
    {
        "id": "preset_banks",
        "label": "Banks & NBFC",
        "description": "Banking and financial services",
        "type": "banks",
    },
    {
        "id": "preset_speculative",
        "label": "Speculative",
        "description": "High-risk, high-reward bets",
        "type": "speculative",
    },
    {
        "id": "preset_growth",
        "label": "Growth",
        "description": "Mid-cap and high-growth opportunities",
        "type": "growth",
    },
]


WATCHLIST_TYPE_BY_NAME = {
    "core holdings": "core",
    "core": "core",
    "it services": "it",
    "it": "it",
    "banks & nbfc": "banks",
    "banks": "banks",
    "speculative": "speculative",
    "growth": "growth",
}


def _guess_watchlist_type(name: str, is_default: bool = False) -> str:
    cleaned = (name or "").strip().lower()

    if is_default and cleaned in WATCHLIST_TYPE_BY_NAME:
        return WATCHLIST_TYPE_BY_NAME[cleaned]

    return WATCHLIST_TYPE_BY_NAME.get(cleaned, "custom")


def _normalize_watchlist(watchlist: dict) -> dict:
    name = watchlist.get("name") or "Watchlist"

    return {
        "id": str(watchlist.get("id")),
        "label": name,
        "count": int(watchlist.get("items_count") or 0),
        "type": _guess_watchlist_type(
            name=name,
            is_default=bool(watchlist.get("is_default")),
        ),
        "source": "default" if bool(watchlist.get("is_default")) else "user",
        "is_default": bool(watchlist.get("is_default")),
    }


def _row_from_item(item) -> dict:
    symbol = item.display_symbol or item.symbol or item.bse_scripcode or str(item.fincode)
    company_name = item.company_name or symbol

    return {
        "id": str(item.id),
        "values": {
            "company_name": company_name,
            "symbol": symbol,
            "exchange": item.exchange,
            "last_price": None,
            "change_percent": None,
            "low_52w": None,
            "high_52w": None,
            "market_cap": "—",
            "pe": None,
            "sector": "—",
            "actions": None,
        },
        "meta": {
            "list_ids": [str(item.watchlist_id)],
            "draggable": True,
            "logo": {
                "type": "initials",
                "label": symbol[:2].upper() if symbol else "ST",
                "variant": "default",
            },
        },
        "_row": {
            "expandable": True,
            "expansion_key": "company_snapshot",
        },
    }


def _apply_local_server_filters(
    rows: list[dict],
    search: Optional[str],
    filters: dict,
) -> list[dict]:
    output = rows

    q = (search or "").strip().lower()

    if q:
        output = [
            row
            for row in output
            if any(
                q in str(value or "").lower()
                for value in row.get("values", {}).values()
            )
        ]

    sector = filters.get("sector")
    if sector:
        output = [
            row
            for row in output
            if str(row["values"].get("sector") or "") == sector
        ]

    exchange = filters.get("exchange")
    if exchange:
        output = [
            row
            for row in output
            if str(row["values"].get("exchange") or "") == exchange
        ]

    return output


def _apply_server_sort(
    rows: list[dict],
    sort_key: str,
    sort_dir: Literal["asc", "desc"],
) -> list[dict]:
    allowed_sort_keys = {
        "position",
        "company_name",
        "symbol",
        "exchange",
        "last_price",
        "change_percent",
        "market_cap",
        "pe",
        "sector",
    }

    if sort_key not in allowed_sort_keys:
        sort_key = "company_name"

    reverse = sort_dir == "desc"

    def key_fn(row: dict):
        if sort_key == "position":
            return row.get("id") or ""

        value = row.get("values", {}).get(sort_key)

        if value is None:
            return ""

        return value

    return sorted(rows, key=key_fn, reverse=reverse)


def _paginate(rows: list[dict], page: int, page_size: int) -> tuple[list[dict], dict]:
    total_items = len(rows)
    total_pages = max(1, ceil(total_items / page_size))

    safe_page = min(max(page, 1), total_pages)
    start = (safe_page - 1) * page_size
    end = start + page_size

    return rows[start:end], {
        "mode": "server",
        "page": safe_page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
    }


def _build_columns() -> list[dict]:
    return [
        {
            "key": "company_name",
            "label": "Stock",
            "renderer": "company",
            "min_width": 240,
            "sortable": True,
        },
        {
            "key": "last_price",
            "label": "Last Price",
            "renderer": "number",
            "formatter": "currency_inr",
            "align": "right",
            "sortable": True,
        },
        {
            "key": "change_percent",
            "label": "Change",
            "renderer": "change_badge",
            "formatter": "percentage",
            "align": "right",
            "sortable": True,
        },
        {
            "key": "range_52w",
            "label": "52W Range",
            "renderer": "price_range_band",
            "min_width": 170,
        },
        {
            "key": "market_cap",
            "label": "Market Cap",
            "renderer": "number",
            "formatter": "market_cap",
            "align": "right",
            "sortable": True,
        },
        {
            "key": "pe",
            "label": "P / E",
            "renderer": "number",
            "formatter": "pe",
            "align": "right",
            "sortable": True,
        },
        {
            "key": "sector",
            "label": "Sector",
            "renderer": "badge",
            "sortable": True,
        },
        {
            "key": "actions",
            "label": "Actions",
            "renderer": "actions",
            "align": "right",
        },
    ]


def _build_kpis(total_items: int, total_lists: int) -> list[dict]:
    return [
        {
            "key": "tracked",
            "label": "Tracked",
            "value": total_items,
            "helper": f"across {total_lists} lists",
            "sparkline": [18, 14, 16, 10, 12, 6, 9, 4, 7],
            "tone": "accent",
        },
        {
            "key": "avg_move",
            "label": "Day's avg move",
            "value": "—",
            "suffix": "%",
            "sub_value": "Market data pending",
            "sub_tone": "neutral",
            "tone": "neutral",
        },
        {
            "key": "best_today",
            "label": "Best today",
            "value": "—",
            "sub_value": "No price movement yet",
            "sub_tone": "neutral",
        },
        {
            "key": "worst_today",
            "label": "Worst today",
            "value": "—",
            "sub_value": "No price movement yet",
            "sub_tone": "neutral",
        },
    ]


async def build_watchlist_view(
    db: AsyncSession,
    financial_db: AsyncSession,
    user_id: str,
    view_id: str,
    mode: Literal["client", "server"],
    watchlist_id: Optional[str],
    page: int,
    page_size: int,
    sort_key: str,
    sort_dir: Literal["asc", "desc"],
    search: Optional[str],
    filters: dict,
) -> dict:
    watchlists = await list_watchlists_for_user(db=db, user_id=user_id, financial_db=financial_db)

    tabs = [
        {
            "id": "all",
            "label": "All",
            "count": 0,
            "type": "all",
            "source": "default",
            "is_default": True,
        }
    ]

    tabs.extend([_normalize_watchlist(watchlist) for watchlist in watchlists])

    all_items = []

    if watchlist_id:
        items = await get_items_for_watchlist(
            db=db,
            user_id=user_id,
            watchlist_id=watchlist_id,
        )
        all_items.extend(items)
    else:
        for watchlist in watchlists:
            items = await get_items_for_watchlist(
                db=db,
                user_id=user_id,
                watchlist_id=str(watchlist["id"]),
            )
            all_items.extend(items)

    rows = [_row_from_item(item) for item in all_items]

    tabs[0]["count"] = sum(int(w.get("items_count") or 0) for w in watchlists)

    use_client_features = mode == "client"

    if mode == "server":
        rows = _apply_local_server_filters(
            rows=rows,
            search=search,
            filters=filters,
        )
        rows = _apply_server_sort(
            rows=rows,
            sort_key=sort_key,
            sort_dir=sort_dir,
        )
        rows, pagination = _paginate(
            rows=rows,
            page=page,
            page_size=page_size,
        )
    else:
        pagination = {
            "mode": "client",
            "page": 1,
            "page_size": page_size,
            "total_items": total_before_processing,
            "total_pages": max(1, ceil(total_before_processing / page_size)),
        }

    return {
        "success": True,
        "status": "ok",
        "schema_version": "1.0",
        "request_id": None,
        "view": {
            "view_id": view_id,
            "view_type": "data_grid",
            "title": "Watchlist",
            "description": "Track your selected NSE/BSE companies with server-driven financial metadata.",
            "permissions": {
                "can_view": True,
                "can_sort": True,
                "can_filter": True,
                "can_export": False,
                "can_expand_rows": True,
            },
            "features": {
                "searchable": True,
                "sortable": True,
                "filterable": True,
                "pagination": True,
                "mobile_card_view": True,
                "expandable_rows": True,
                "lazy_expansion": True,
                "nested_views": True,
                "row_reorder": True,

                "client_sorting": use_client_features,
                "client_filtering": use_client_features,
                "client_pagination": use_client_features,
                "server_sorting": not use_client_features,
                "server_filtering": not use_client_features,
                "server_pagination": not use_client_features,
            },
            "layout": {
                "density": "compact",
                "variant": "glass",
                "default_page_size": page_size,
            },
            "meta": {
                "client_processing_limit": CLIENT_PROCESSING_LIMIT,
                "source": {
                    "type": "internal_db",
                    "name": "InvestKaro DB",
                    "vendor": "Accord Fintech",
                },
                "freshness": "mixed",
                "data_quality": "partial",
            },
            "watchlist": {
                "active_list_id": watchlist_id or "all",
                "allow_new_list": True,
                "allow_add_stock": True,
                "allow_drag_reorder": True,
                "allow_export": False,
                "tabs": tabs,
                "presets": DEFAULT_PRESETS,
                "kpis": _build_kpis(
                    total_items=total_before_processing,
                    total_lists=max(0, len(tabs) - 1),
                ),
            },
            "columns": _build_columns(),
            "data": {
                "rows": rows,
            },
            "pagination": pagination,
            "empty_state": {
                "title": "This list is empty",
                "description": "Add stocks to your watchlist from the search above.",
            },
        },
    }