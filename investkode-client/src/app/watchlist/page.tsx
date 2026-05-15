import { InvestKodeShell } from "@/components/app-shell/investkode-shell";
import { DynamicViewRenderer } from "@/components/dynamic-view/dynamic-view-renderer";
import type { DynamicViewResponse } from "@/components/dynamic-view/types";

const watchlistView: DynamicViewResponse = {
  success: true,
  status: "ok",
  request_id: "local-watchlist-preview",
  schema_version: "1.0",
  view: {
    view_id: "watchlist.default",
    view_type: "data_grid",
    title: "Watchlist",
    description:
      "Track your selected NSE/BSE companies with server-driven financial metadata.",

    permissions: {
      can_view: true,
      can_sort: true,
      can_filter: true,
      can_export: false,
      can_expand_rows: true,
    },

    features: {
      searchable: true,
      sortable: true,
      filterable: true,
      pagination: true,
      mobile_card_view: true,
      expandable_rows: true,
      lazy_expansion: true,
      nested_views: true,

      // add this
      row_reorder: true,
    },

    layout: {
      density: "compact",
      variant: "glass",
      default_page_size: 25,
    },

    // ✅ ADD THIS HERE
    watchlist: {
      active_list_id: "all",
      allow_new_list: true,
      allow_add_stock: true,
      allow_drag_reorder: true,
      allow_export: false,

      tabs: [
        {
          id: "all",
          label: "All",
          count: 3,
          tone: "blue",
          is_default: true,
        },
        {
          id: "core",
          label: "Core holdings",
          count: 2,
          tone: "blue",
        },
        {
          id: "it",
          label: "IT services",
          count: 0,
          tone: "green",
        },
        {
          id: "banks",
          label: "Banks & NBFC",
          count: 2,
          tone: "yellow",
        },
        {
          id: "spec",
          label: "Speculative",
          count: 0,
          tone: "red",
        },
      ],

      kpis: [
        {
          key: "tracked",
          label: "Tracked",
          value: 3,
          helper: "across 4 lists",
          sparkline: [18, 14, 16, 10, 12, 6, 9, 4, 7],
          tone: "accent",
        },
        {
          key: "avg_move",
          label: "Day's avg move",
          value: "+0.66",
          suffix: "%",
          sub_value: "↑ 3 of 3 advancing",
          sub_tone: "positive",
          sparkline: [16, 15, 12, 13, 9, 11, 8, 6, 4],
          tone: "positive",
        },
        {
          key: "best_today",
          label: "Best today",
          value: "HDFC Bank",
          suffix: "HDFCBANK",
          sub_value: "+0.94% · ₹1,482.55",
          sub_tone: "positive",
        },
        {
          key: "worst_today",
          label: "Worst today",
          value: "Reliance",
          suffix: "RELIANCE",
          sub_value: "+0.42% · ₹2,986.20",
          sub_tone: "positive",
        },
      ],
    },

    meta: {
      source: {
        type: "internal_db",
        name: "InvestKaro DB",
        vendor: "Accord Fintech",
      },
      freshness: "monthly",
      data_quality: "partial",
      last_updated: "2026-05-12T10:30:00Z",
    },

    empty_state: {
      title: "This list is empty",
      description: "Add stocks to your watchlist from the search above.",
    },

    columns: [
      {
        key: "company_name",
        label: "Stock",
        renderer: "company",
        min_width: 240,
        sortable: true,
      },
      {
        key: "last_price",
        label: "Last Price",
        renderer: "number",
        formatter: "currency_inr",
        align: "right",
        sortable: true,
      },
      {
        key: "change_percent",
        label: "Change",
        renderer: "change_badge",
        formatter: "percentage",
        align: "right",
        sortable: true,
      },
      {
        key: "range_52w",
        label: "52W Range",
        renderer: "price_range_band",
        min_width: 170,
      },
      {
        key: "market_cap",
        label: "Market Cap",
        renderer: "number",
        formatter: "market_cap",
        align: "right",
        sortable: true,
      },
      {
        key: "pe",
        label: "P / E",
        renderer: "number",
        formatter: "pe",
        align: "right",
        sortable: true,
      },
      {
        key: "sector",
        label: "Sector",
        renderer: "badge",
        sortable: true,
      },
      {
        key: "actions",
        label: "Actions",
        renderer: "actions",
        align: "right",
      },
    ],

    data: {
      rows: [
        {
          id: "hdfcbank",
          values: {
            company_name: "HDFC Bank",
            symbol: "HDFCBANK",
            exchange: "NSE",
            last_price: 1482.55,
            change_percent: 0.94,
            low_52w: 1363,
            high_52w: 1791,
            market_cap: "11.2L Cr",
            pe: 19.8,
            sector: "Banks & NBFC",
          },
          meta: {
            list_ids: ["core", "banks"],
            draggable: true,
            logo: {
              type: "initials",
              label: "HB",
              variant: "bank",
            },
          },
          _row: {
            expandable: true,
            expansion_key: "company_snapshot",
          },
        },
        {
          id: "icicibank",
          values: {
            company_name: "ICICI Bank",
            symbol: "ICICIBANK",
            exchange: "NSE",
            last_price: 1118.4,
            change_percent: 0.62,
            low_52w: 946,
            high_52w: 1257,
            market_cap: "7.9L Cr",
            pe: 18.4,
            sector: "Banks & NBFC",
          },
          meta: {
            list_ids: ["core", "banks"],
            draggable: true,
            logo: {
              type: "initials",
              label: "IB",
              variant: "bank",
            },
          },
          _row: {
            expandable: true,
            expansion_key: "company_snapshot",
          },
        },
        {
          id: "reliance",
          values: {
            company_name: "Reliance Industries",
            symbol: "RELIANCE",
            exchange: "NSE",
            last_price: 2986.2,
            change_percent: 0.42,
            low_52w: 2580,
            high_52w: 3200,
            market_cap: "20.2L Cr",
            pe: 26.8,
            sector: "Energy",
          },
          meta: {
            list_ids: ["core"],
            draggable: true,
            logo: {
              type: "initials",
              label: "RI",
              variant: "energy",
            },
          },
          _row: {
            expandable: true,
            expansion_key: "company_snapshot",
          },
        },
      ],
    },
    pagination: {
      page: 1,
      page_size: 25,
      total_items: 3,
      total_pages: 1,
    },
  },
};

export default function WatchlistPage() {
  return (
    <InvestKodeShell>
      <div className="flex-1 overflow-auto px-6 py-[22px]">
        <DynamicViewRenderer response={watchlistView} />
      </div>
    </InvestKodeShell>
  );
}