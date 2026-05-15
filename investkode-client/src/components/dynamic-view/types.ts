export type ViewType =
  | "data_grid"
  | "financial_statement_table"
  | "comparison_table"
  | "kpi_grid"
  | "chart"
  | "event_list"
  | "transcript_timeline"
  | "analysis_panel"
  | "entity_list"
  | "breakdown_view";

export type Tone =
  | "positive"
  | "negative"
  | "warning"
  | "neutral"
  | "info"
  | "muted"
  | "danger"
  | "success"
  | "live"
  | "premium";

export type CellRenderer =
  | "text"
  | "number"
  | "company"
  | "change_badge"
  | "price_range_band"
  | "badge"
  | "actions";

export type Formatter =
  | "text"
  | "currency_inr"
  | "percentage"
  | "number"
  | "market_cap"
  | "pe";

export type DynamicColumn = {
  key: string;
  label: string;
  renderer?: CellRenderer;
  formatter?: Formatter;
  align?: "left" | "center" | "right";
  width?: number;
  min_width?: number;
  sortable?: boolean;
  tone_rule?: string;
};


export type DynamicViewResponse = {
  success: boolean;
  status: "ok" | "partial" | "error" | "permission_denied";
  request_id?: string;
  schema_version: string;
  view: DynamicView;
};



export type WatchlistTab = {
  id: string;
  label: string;
  count: number;
  tone?: "blue" | "green" | "yellow" | "red" | "neutral";
  is_default?: boolean;
};

export type WatchlistKpiCard = {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  sub_value?: string;
  sub_tone?: "positive" | "negative" | "neutral";
  helper?: string;
  sparkline?: number[];
  tone?: "positive" | "negative" | "neutral" | "accent";
};

export type DynamicRow = {
  id: string;
  values: Record<string, unknown>;
  meta?: {
    list_ids?: string[];
    draggable?: boolean;
    logo_colors?: [string, string];
    sector_tone?: string;
  };
  _row?: {
    expandable?: boolean;
    expansion_key?: string;
    tone?: Tone;
  };
};

export type DynamicView = {
  view_id: string;
  view_type: ViewType;
  title: string;
  description?: string;

  watchlist?: {
    active_list_id: string;
    tabs: WatchlistTab[];
    kpis: WatchlistKpiCard[];
    allow_new_list: boolean;
    allow_add_stock: boolean;
    allow_drag_reorder: boolean;
    allow_export: boolean;
  };

  permissions?: {
    can_view?: boolean;
    can_sort?: boolean;
    can_filter?: boolean;
    can_export?: boolean;
    can_expand_rows?: boolean;
  };

  features?: {
    searchable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    pagination?: boolean;
    mobile_card_view?: boolean;
    expandable_rows?: boolean;
    lazy_expansion?: boolean;
    nested_views?: boolean;
    row_reorder?: boolean;
  };

  layout?: {
    density?: "compact" | "comfortable";
    variant?: "glass" | "plain";
    default_page_size?: number;
  };

  columns?: DynamicColumn[];
  data?: {
    rows?: DynamicRow[];
  };

  empty_state?: {
    title: string;
    description?: string;
  };

  meta?: {
    source?: {
      type?: string;
      name?: string;
      vendor?: string;
    };
    freshness?: string;
    data_quality?: string;
    last_updated?: string;
  };
};