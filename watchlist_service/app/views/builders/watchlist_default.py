from typing import Any, Literal

from app.views.base import (
    build_empty_state,
    build_features,
    build_layout,
    build_pagination,
    build_permissions,
    build_row_expansion,
    build_sorting,
    build_success_response,
    build_user_layout,
    build_view_meta,
    make_column,
    make_filter,
)
from app.views.builders.base import BaseViewBuilder, ViewBuildContext
from app.views.data.watchlist_data_source import WatchlistDataSource
from app.views.schemas import (
    DynamicView,
    ViewContext,
    WatchlistKpiCard,
    WatchlistPreset,
    WatchlistTab,
    WatchlistViewConfig,
)


SortDirection = Literal["asc", "desc"]


class WatchlistDefaultViewBuilder(BaseViewBuilder):
    view_id = "watchlist.default"
    client_processing_limit = 100

    allowed_sort_keys: dict[str, str] = {
        "position": "wi.position",
        "stock": "wi.company_name",
        "company_name": "wi.company_name",
        "symbol": "wi.symbol",
        "exchange": "wi.exchange",
        "last_price": "wi.last_price",
        "change_percent": "wi.change_percent",
        "market_cap": "wi.market_cap",
        "pe": "wi.pe",
        "sector": "wi.sector",
    }

    def __init__(self, context: ViewBuildContext):
        super().__init__(context)
        self.data_source = WatchlistDataSource(context.db, context.financial_db)

    async def build_view(self) -> DynamicView:
        sort_key = self._safe_sort_key(self.context.sort_key)
        sort_dir = self.context.sort_dir

        watchlist_id = self.context.query.get("watchlist_id")
        search = self.context.query.get("search")
        exchange = self.context.query.get("exchange")
        sector = self.context.query.get("sector")

        watchlists = await self.data_source.fetch_watchlists(
            user_id=self.context.user_id,
        )

        rows_raw, total_rows = await self.data_source.fetch_rows(
            user_id=self.context.user_id,
            watchlist_id=watchlist_id,
            mode=self.context.mode,
            page=self.context.page,
            page_size=self.context.page_size,
            sort_key=sort_key,
            sort_dir=sort_dir,
            search=search,
            exchange=exchange,
            sector=sector,
            allowed_sort_keys=self.allowed_sort_keys,
        )

        rows = [self._map_row(row) for row in rows_raw]

        return DynamicView(
            view_id=self.view_id,
            view_type="data_grid",
            title="Watchlist",
            description="Stocks tracked by the user",

            context=ViewContext(
                entity_type="watchlist",
                entity_id=str(watchlist_id) if watchlist_id else None,
            ),

            permissions=build_permissions(
                plan=self.context.plan,
                required_plan="free",
                can_export=self.context.plan in {"pro", "enterprise"},
                can_expand_rows=True,
            ),

            features=build_features(
                mode=self.context.mode,
                exportable=self.context.plan in {"pro", "enterprise"},
                expandable_rows=True,
                lazy_expansion=True,
                nested_views=True,
            ),

            layout=build_layout(
                page_size=self.context.page_size,
                pinned_columns=["stock"],
                density="compact",
            ),

            user_layout=build_user_layout(
                sort_key=sort_key,
                sort_dir=sort_dir,
                pinned_columns=["stock"],
                density="compact",
            ),

            actions=self._build_actions(),

            columns=self._build_columns(),

            data={
                "rows": rows,
            },

            pagination=build_pagination(
                page=self.context.page if self.context.mode == "server" else 1,
                page_size=self.context.page_size,
                total_rows=total_rows,
                mode=self.context.mode,
            ),

            sorting=build_sorting(
                sort_key=sort_key,
                sort_dir=sort_dir,
                allowed_keys=list(self.allowed_sort_keys.keys()),
                mode=self.context.mode,
            ),

            filters=self._build_filters(),

            row_expansion=build_row_expansion(
                enabled=True,
                mode="nested_view",
                endpoint="/api/v1/views/watchlist.default/rows/{row_id}/expand",
                allowed_expansion_keys=["company_snapshot"],
            ),

            meta=build_view_meta(
                freshness="monthly",
                data_quality="partial",
                warnings=[
                    "Price data is based on the latest available monthly feed, not real-time market data."
                ],
                client_processing_limit=self.client_processing_limit,
            ),

            empty_state=build_empty_state(
                title="No stocks in watchlist",
                description="Add stocks to start tracking them.",
                action_key="add_stock",
                action_label="Add Stock",
            ),

            watchlist=WatchlistViewConfig(
                active_list_id=str(watchlist_id or "all"),
                allow_new_list=True,
                allow_add_stock=True,
                allow_drag_reorder=True,
                allow_export=self.context.plan in {"pro", "enterprise"},
                tabs=self._build_tabs(watchlists=watchlists, total_rows=total_rows),
                presets=self._build_presets(),
                kpis=self._build_kpis(total_rows=total_rows, total_lists=len(watchlists), rows_raw=rows_raw),
            ),
        )

    def serialize(self, view: DynamicView) -> dict[str, Any]:
        return build_success_response(
            view=view,
            request_id=self.context.request_id,
            schema_version="1.0",
        )

    def _safe_sort_key(self, sort_key: str) -> str:
        if sort_key not in self.allowed_sort_keys:
            return "position"

        return sort_key

    def _build_columns(self):
        return [
            make_column(
                key="stock",
                label="Stock",
                column_type="company",
                renderer="company",
                sortable=True,
                filterable=True,
                hideable=False,
                default_visible=True,
                width=260,
                min_width=240,
                align="left",
            ),
            make_column(
                key="last_price",
                label="Last Price",
                column_type="currency",
                formatter="currency_inr",
                sortable=True,
                filterable=True,
                width=130,
                align="right",
            ),
            make_column(
                key="change_percent",
                label="Change %",
                column_type="percent",
                renderer="change_badge",
                formatter="percent",
                tone_rule="positive_green_negative_red",
                sortable=True,
                filterable=True,
                width=120,
                align="right",
            ),
            make_column(
                key="range_52w",
                label="52W Range",
                column_type="range",
                renderer="price_range_band",
                sortable=False,
                filterable=False,
                width=190,
                align="left",
            ),
            make_column(
                key="market_cap",
                label="Market Cap",
                column_type="number",
                formatter="market_cap_inr",
                sortable=True,
                filterable=True,
                width=140,
                align="right",
            ),
            make_column(
                key="pe",
                label="P/E",
                column_type="number",
                formatter="ratio",
                sortable=True,
                filterable=True,
                width=100,
                align="right",
            ),
            make_column(
                key="sector",
                label="Sector",
                column_type="badge",
                renderer="badge",
                sortable=True,
                filterable=True,
                width=150,
                align="left",
            ),
            make_column(
                key="actions",
                label="",
                column_type="actions",
                renderer="actions",
                sortable=False,
                filterable=False,
                hideable=False,
                width=60,
                align="right",
            ),
        ]

    def _build_filters(self):
        return [
            make_filter(
                key="exchange",
                label="Exchange",
                filter_type="select",
                options=["NSE", "BSE"],
            ),
            make_filter(
                key="sector",
                label="Sector",
                filter_type="text",
            ),
        ]

    def _build_presets(self) -> list[WatchlistPreset]:
        return [
            WatchlistPreset(
                id="preset_core",
                label="Core holdings",
                description="Your long-term foundation stocks",
                type="core",
            ),
            WatchlistPreset(
                id="preset_it",
                label="IT Services",
                description="Technology and software companies",
                type="it",
            ),
            WatchlistPreset(
                id="preset_banks",
                label="Banks & NBFC",
                description="Banking and financial services",
                type="banks",
            ),
            WatchlistPreset(
                id="preset_speculative",
                label="Speculative",
                description="High-risk, high-reward bets",
                type="speculative",
            ),
            WatchlistPreset(
                id="preset_growth",
                label="Growth",
                description="Mid-cap and high-growth opportunities",
                type="growth",
            ),
        ]

    def _build_tabs(
        self,
        watchlists: list[dict[str, Any]],
        total_rows: int,
    ) -> list[WatchlistTab]:
        tabs = [
            WatchlistTab(
                id="all",
                label="All",
                count=total_rows,
                type="all",
                source="default",
                is_default=True,
            )
        ]

        for item in watchlists:
            name = str(item.get("name") or "Watchlist")
            is_default = bool(item.get("is_default"))

            tabs.append(
                WatchlistTab(
                    id=str(item["id"]),
                    label=name,
                    count=int(item.get("items_count") or 0),
                    type=self._guess_watchlist_type(name, is_default),
                    source="default" if is_default else "user",
                    is_default=is_default,
                )
            )

        return tabs

    def _build_kpis(
        self,
        total_rows: int,
        total_lists: int,
        rows_raw: list[dict[str, Any]] = None,
    ) -> list[WatchlistKpiCard]:
        # Default placeholders
        avg_move = "—"
        avg_sub = "Market data pending"
        best_stock = "—"
        best_val = None
        worst_stock = "—"
        worst_val = None
        
        if rows_raw:
            valid_rows = [r for r in rows_raw if r.get("change_percent") is not None]
            if valid_rows:
                changes = [r["change_percent"] for r in valid_rows]
                avg = sum(changes) / len(changes)
                avg_move = f"{avg:+.2f}"
                
                advancing = sum(1 for c in changes if c > 0)
                total = len(changes)
                avg_sub = f"↑ {advancing} of {total} advancing"
            
                best = max(valid_rows, key=lambda x: x["change_percent"])
                worst = min(valid_rows, key=lambda x: x["change_percent"])
                
                def _get_name(r):
                    name = r.get("company_name") or r.get("symbol") or str(r.get("fincode"))
                    if len(name) > 16:
                        name = name[:14].strip() + "…"
                    return name

                def _get_sym(r):
                    return r.get("display_symbol") or r.get("symbol")
                    
                def _format_val(r):
                    chg = f"{r['change_percent']:+.1f}%"
                    price = f"₹{int(r['last_price']):,}" if r.get("last_price") else "—"
                    return f"{chg} · {price}"

                best_name = _get_name(best)
                best_sym = _get_sym(best)
                best_val = _format_val(best)
                
                worst_name = _get_name(worst)
                worst_sym = _get_sym(worst)
                worst_val = _format_val(worst)

        return [
            WatchlistKpiCard(
                key="tracked",
                label="Tracked",
                value=total_rows,
                helper=f"across {total_lists} lists",
                sparkline=[18, 14, 16, 10, 12, 6, 9, 4, 7],
                tone="accent",
            ),
            WatchlistKpiCard(
                key="avg_move",
                label="Day's avg move",
                value=avg_move,
                suffix="%" if avg_move != "—" else "",
                sub_value=avg_sub,
                sub_tone="positive" if avg_move != "—" and float(avg_move) >= 0 else "negative" if avg_move != "—" else "neutral",
                tone="positive" if avg_move != "—" and float(avg_move) >= 0 else "negative" if avg_move != "—" else "neutral",
            ),
            WatchlistKpiCard(
                key="best_today",
                label="Best today",
                value=best_name,
                suffix=best_sym,
                sub_value=best_val or "No price movement yet",
                sub_tone="positive" if best_val else "neutral",
            ),
            WatchlistKpiCard(
                key="worst_today",
                label="Worst today",
                value=worst_name,
                suffix=worst_sym,
                sub_value=worst_val or "No price movement yet",
                sub_tone="negative" if worst_val else "neutral",
            ),
        ]

    def _build_actions(self) -> list[dict[str, Any]]:
        return [
            {
                "id": "add_stock",
                "label": "Add stock",
                "scope": "view",
                "type": "modal",
            },
            {
                "id": "create_list",
                "label": "New list",
                "scope": "view",
                "type": "modal",
            },
            {
                "id": "open_detail",
                "label": "Open detail",
                "scope": "row",
                "type": "navigation",
                "target": "/stocks/{symbol}",
            },
            {
                "id": "remove_from_watchlist",
                "label": "Remove from watchlist",
                "scope": "row",
                "type": "mutation",
            },
        ]

    def _map_row(self, row: dict[str, Any]) -> dict[str, Any]:
        symbol = row.get("display_symbol") or row.get("symbol") or str(row.get("fincode"))
        company_name = row.get("company_name") or symbol

        return {
            "id": str(row["id"]),
            "values": {
                "stock": {
                    "company_name": company_name,
                    "symbol": symbol,
                    "exchange": row.get("exchange"),
                },
                "company_name": company_name,
                "symbol": symbol,
                "exchange": row.get("exchange"),
                "last_price": row.get("last_price"),
                "change_percent": row.get("change_percent"),
                "low_52w": row.get("low_52w"),
                "high_52w": row.get("high_52w"),
                "market_cap": row.get("market_cap") or "—",
                "pe": row.get("pe"),
                "sector": row.get("sector") or "—",
                "actions": None,
            },
            "meta": {
                "list_ids": [str(row.get("watchlist_id"))],
                "watchlist_id": str(row.get("watchlist_id")),
                "draggable": True,
                "logo": {
                    "type": "initials",
                    "label": str(symbol or "ST")[:2].upper(),
                    "variant": self._guess_logo_variant(row.get("sector")),
                },
            },
            "_row": {
                "expandable": True,
                "expansion_key": "company_snapshot",
                "expansion_label": "Company snapshot",
                "expansion_mode": "nested_view",
            },
        }

    def _guess_watchlist_type(self, name: str, is_default: bool) -> str:
        cleaned = name.strip().lower()

        mapping = {
            "core holdings": "core",
            "core": "core",
            "it services": "it",
            "it": "it",
            "banks & nbfc": "banks",
            "banks": "banks",
            "speculative": "speculative",
            "growth": "growth",
        }

        if is_default:
            return mapping.get(cleaned, "custom")

        return "custom"

    def _guess_logo_variant(self, sector: str | None) -> str:
        text = str(sector or "").lower()

        if "bank" in text or "finance" in text or "nbfc" in text:
            return "banks"

        if "it" in text or "software" in text or "technology" in text:
            return "it"

        return "default"