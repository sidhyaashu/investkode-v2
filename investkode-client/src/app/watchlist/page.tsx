import { InvestKodeShell } from "@/components/app-shell/investkode-shell";
import { DynamicViewRenderer } from "@/components/dynamic-view/dynamic-view-renderer";
import type { DynamicViewResponse } from "@/components/dynamic-view/types";

const watchlistView: DynamicViewResponse = {
  success: true,
  status: "ok",
  schema_version: "1.0",
  view: {
    view_id: "watchlist.default",
    view_type: "data_grid",
    title: "Watchlist",
    description: "Track your selected NSE/BSE companies with server-driven financial metadata.",

    permissions: {
      can_view: true,
      can_sort: true,
      can_filter: true,
      can_export: true,
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
      row_reorder: true,
    },

    layout: {
      density: "compact",
      variant: "glass",
      default_page_size: 25,
    },

    watchlist: {
      active_list_id: "all",
      allow_new_list: true,
      allow_add_stock: true,
      allow_drag_reorder: true,
      allow_export: true,
      tabs: [
        {
          id: "all",
          label: "All",
          count: 15,
          type: "all",
          source: "default",
          is_default: true,
        },
        {
          id: "core",
          label: "Core holdings",
          count: 5,
          type: "core",
          source: "default",
        },
        {
          id: "banks",
          label: "Banks & NBFC",
          count: 3,
          type: "banks",
          source: "default",
        },
        {
          id: "wl_user_123",
          label: "My PSU Bank Picks",
          count: 4,
          type: "custom",
          source: "user",
        },
      ],
      presets: [
        {
          id: "preset_core",
          label: "Core holdings",
          description: "Your long-term foundation stocks",
          type: "core",
        },
        {
          id: "preset_it",
          label: "IT Services",
          description: "Technology and software companies",
          type: "it",
        },
        {
          id: "preset_banks",
          label: "Banks & NBFC",
          description: "Banking and financial services",
          type: "banks",
        },
        {
          id: "preset_speculative",
          label: "Speculative",
          description: "High-risk, high-reward bets",
          type: "speculative",
        },
      ],
      kpis: [
        {
          key: "tracked",
          label: "Tracked",
          value: 15,
          helper: "across 4 lists",
          sparkline: [18, 14, 16, 10, 12, 6, 9, 4, 7],
          tone: "accent",
        },
        {
          key: "avg_move",
          label: "Day's avg move",
          value: "+0.78",
          suffix: "%",
          sub_value: "↑ 8 of 12 advancing",
          sub_tone: "positive",
          sparkline: [16, 15, 12, 13, 9, 11, 8, 6, 4],
          tone: "positive",
        },
        {
          key: "best_today",
          label: "Best today",
          name: "Bajaj Fin",
          symbol: "BAJFINANCE",
          value: "+3.1",
          suffix: "%",
          price: "₹7,420",
          tone: "positive",
        },
        {
          key: "worst_today",
          label: "Worst today",
          name: "Wipro",
          symbol: "WIPRO",
          value: "−1.8",
          suffix: "%",
          price: "₹284",
          tone: "negative",
        },
      ],
    },

    columns: [
      {
        key: "company_name",
        label: "STOCK",
        renderer: "company",
        min_width: 240,
        sortable: true,
      },
      {
        key: "last_price",
        label: "PRICE",
        renderer: "number",
        formatter: "currency_inr",
        align: "right",
        sortable: true,
      },
      {
        key: "change_percent",
        label: "DAY",
        renderer: "change_badge",
        formatter: "percentage",
        align: "right",
        sortable: true,
      },
      {
        key: "range_52w",
        label: "52W RANGE",
        renderer: "price_range_band",
        align: "center",
        min_width: 180,
      },
      {
        key: "market_cap",
        label: "MKT CAP",
        renderer: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "pe",
        label: "P / E",
        renderer: "number",
        align: "right",
        sortable: true,
      },
      {
        key: "sector",
        label: "SECTOR",
        renderer: "badge",
        align: "center",
        sortable: true,
      },
      {
        key: "actions",
        label: "ACTIONS",
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
            market_cap: "₹11.2L Cr",
            pe: 19.8,
            sector: "Banks & NBFC",
          },
          meta: {
            list_ids: ["core", "banks"],
            draggable: true,
            logo: {
              type: "initials",
              label: "HD",
              variant: "banks",
            },
          },
        },
        {
          id: "hul",
          values: {
            company_name: "Hindustan Unilever",
            symbol: "HUL",
            exchange: "NSE",
            last_price: 2374.85,
            change_percent: -0.18,
            low_52w: 2172,
            high_52w: 2768,
            market_cap: "₹5.6L Cr",
            pe: 55.2,
            sector: "FMCG",
          },
          meta: {
            list_ids: ["core"],
            draggable: true,
            logo: {
              type: "initials",
              label: "HU",
              variant: "consumer",
            },
          },
        },
        {
          id: "maruti",
          values: {
            company_name: "Maruti Suzuki",
            symbol: "MARUTI",
            exchange: "NSE",
            last_price: 11264.0,
            change_percent: 1.56,
            low_52w: 9885,
            high_52w: 13680,
            market_cap: "₹3.4L Cr",
            pe: 25.9,
            sector: "Auto",
          },
          meta: {
            list_ids: ["core"],
            draggable: true,
            logo: {
              type: "initials",
              label: "MA",
              variant: "default",
            },
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
            market_cap: "₹20.2L Cr",
            pe: 26.8,
            sector: "Energy",
          },
          meta: {
            list_ids: ["core"],
            draggable: true,
            logo: {
              type: "initials",
              label: "RE",
              variant: "energy",
            },
          },
        },
        {
          id: "tcs",
          values: {
            company_name: "Tata Consultancy Services",
            symbol: "TCS",
            exchange: "NSE",
            last_price: 3842.1,
            change_percent: -2.4,
            low_52w: 3115,
            high_52w: 4254,
            market_cap: "₹14.0L Cr",
            pe: 28.4,
            sector: "IT services",
          },
          meta: {
            list_ids: ["core", "it"],
            draggable: true,
            logo: {
              type: "initials",
              label: "TC",
              variant: "it",
            },
          },
        },
      ],
    },
    pagination: {
      page: 1,
      page_size: 25,
      total_items: 15,
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