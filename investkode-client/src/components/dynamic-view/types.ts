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

export type SortDirection = "asc" | "desc" | null;

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
  | "market_cap_inr"
  | "percent"
  | "pe"
  | "ratio";

export type WatchlistType =
  | "all"
  | "core"
  | "it"
  | "banks"
  | "speculative"
  | "growth"
  | "custom";

export type WatchlistSource = "default" | "user";

export type WatchlistTab = {
  id: string;
  label: string;
  count: number;

  /**
   * Server sends semantic type only.
   * Client maps type to style/icon/color.
   */
  type: WatchlistType;

  /**
   * default = predefined system list
   * user = custom user-created list
   */
  source: WatchlistSource;

  is_default?: boolean;
};

export type WatchlistPreset = {
  id: string;
  label: string;
  description: string;
  type: WatchlistType;
};

export type WatchlistKpiCard = {
  key: string;
  label: string;
  value: string | number;
  suffix?: string;
  helper?: string;

  /**
   * For Best/Worst cards
   */
  name?: string;
  symbol?: string;
  price?: string | number;
  change?: string | number;

  sub_value?: string;
  sub_tone?: "positive" | "negative" | "warning" | "neutral" | "info";
  sparkline?: number[];
  tone?: "positive" | "negative" | "warning" | "neutral" | "info" | "accent";
};

export type ViewPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type DynamicRow = {
  id: string;
  values: Record<string, unknown>;

  meta?: {
    fincode?: number | string;
    list_ids?: string[];
    watchlist_id?: string;
    draggable?: boolean;

    logo?: {
      type?: "initials" | "image" | "symbol";
      label?: string;
      image_url?: string | null;

      /**
       * Server gives semantic business category.
       * Client maps it to visual treatment.
       */
      variant?: WatchlistType | "energy" | "finance" | "consumer" | "default";
    };

    sector_tone?: "positive" | "negative" | "warning" | "neutral" | "info";
  };

  _row?: {
    expandable?: boolean;
    expansion_key?: string;
    tone?: Tone;
  };
};

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

export type DynamicView = {
  view_id: string;
  view_type: ViewType;
  title: string;
  description?: string;

  watchlist?: {
    active_list_id: string;

    /**
     * Includes default + user-created lists.
     */
    tabs: WatchlistTab[];

    /**
     * Only used in New List flow.
     * Server returns semantic preset types, no colors/icons.
     */
    presets: WatchlistPreset[];

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
    client_sorting?: boolean;
    server_sorting?: boolean;
    client_filtering?: boolean;
    server_filtering?: boolean;
    client_pagination?: boolean;
    server_pagination?: boolean;
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
  pagination?: ViewPagination;

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

export type DynamicViewResponse = {
  success: boolean;
  status: "ok" | "partial" | "error" | "permission_denied";
  request_id?: string;
  schema_version: string;
  view: DynamicView;
};