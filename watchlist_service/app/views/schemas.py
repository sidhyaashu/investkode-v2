from typing import Any, Literal
from pydantic import BaseModel, Field


ViewType = Literal[
    "data_grid",
    "dashboard",
    "composed_view",
    "financial_statement_table",
    "comparison_table",
    "kpi_grid",
    "chart",
    "event_list",
    "transcript_timeline",
    "analysis_panel",
    "entity_list",
    "breakdown_view",
]

SortDirection = Literal["asc", "desc"]


class Component(BaseModel):
    id: str
    type: str
    title: str | None = None
    data_provider: str | None = None
    data: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None
    config: dict[str, Any] = Field(default_factory=dict)


class Section(BaseModel):
    id: str
    type: str
    title: str | None = None
    layout: str | None = None
    components: list[Component] = Field(default_factory=list)
    meta: dict[str, Any] | None = None


class ViewContext(BaseModel):
    entity_type: str | None = None
    entity_id: str | None = None
    company_id: str | None = None
    concall_id: str | None = None
    portfolio_id: str | None = None


class ViewPermissions(BaseModel):
    access: Literal["allowed", "denied", "locked"] = "allowed"
    plan: str = "free"
    required_plan: str = "free"

    can_view: bool = True
    can_export: bool = False
    can_customize_layout: bool = True
    can_sort: bool = True
    can_filter: bool = True
    can_add_column: bool = False
    can_remove_column: bool = True
    can_expand_rows: bool = False
    can_view_nested_data: bool = False

    locked_reason: str | None = None


class ViewFeatures(BaseModel):
    searchable: bool = True
    sortable: bool = True
    filterable: bool = True
    exportable: bool = False
    pagination: bool = True
    column_customization: bool = True
    row_actions: bool = True
    bulk_actions: bool = False
    mobile_card_view: bool = True
    virtualized: bool = False

    expandable_rows: bool = False
    lazy_expansion: bool = False
    nested_views: bool = False
    row_hierarchy: bool = False
    child_pagination: bool = False
    child_sorting: bool = False
    child_filtering: bool = False
    expansion_cache: bool = False

    # Your 100-row rule support.
    client_sorting: bool = False
    client_filtering: bool = False
    client_pagination: bool = False
    server_sorting: bool = True
    server_filtering: bool = True
    server_pagination: bool = True


class ViewLayout(BaseModel):
    density: Literal["compact", "comfortable", "spacious"] = "compact"
    variant: str = "glass"
    responsive_mode: str = "table_to_cards"
    pinned_columns: list[str] = Field(default_factory=list)
    pinned_rows: list[str] = Field(default_factory=list)
    default_page_size: int = 10
    expansion_position: str = "below_row"
    expansion_indent: bool = True


class UserLayout(BaseModel):
    source: str = "default"
    preference_id: str | None = None
    visible_columns: list[str] = Field(default_factory=list)
    column_order: list[str] = Field(default_factory=list)
    column_widths: dict[str, int] = Field(default_factory=dict)
    pinned_columns: list[str] = Field(default_factory=list)
    expanded_rows: list[str] = Field(default_factory=list)
    sort: dict[str, Any] | None = None
    filters: list[dict[str, Any]] = Field(default_factory=list)
    density: str = "compact"


class DataGridColumn(BaseModel):
    key: str
    label: str

    type: Literal[
        "text",
        "number",
        "percent",
        "currency",
        "company",
        "range",
        "badge",
        "actions",
    ]

    renderer: str | None = None
    formatter: str | None = None
    tone_rule: str | None = None

    sortable: bool = False
    filterable: bool = False
    hideable: bool = True
    default_visible: bool = True

    width: int | None = None
    min_width: int | None = None
    align: Literal["left", "center", "right"] = "left"


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_rows: int
    total_pages: int
    mode: Literal["client", "server"] = "server"


class SortingMeta(BaseModel):
    mode: Literal["client", "server"] = "server"
    default: dict[str, Any] | None = None
    allowed_keys: list[str] = Field(default_factory=list)


class FilterMeta(BaseModel):
    key: str
    label: str
    type: Literal["text", "select", "multi_select", "number_range"]
    options: list[str] | None = None


ExpansionMode = Literal["inline", "lazy", "nested_view"]
ExpansionTrigger = Literal[
    "row_click",
    "icon_click",
    "card_click",
    "section_click",
    "segment_click",
]


class RowExpansionConfig(BaseModel):
    enabled: bool = False
    mode: ExpansionMode | None = None
    trigger: ExpansionTrigger = "row_click"
    endpoint: str | None = None
    allowed_expansion_keys: list[str] = Field(default_factory=list)
    cache_ttl_seconds: int = 300


class SourceMeta(BaseModel):
    type: str = "internal_db"
    name: str = "InvestKaro DB"
    vendor: str | None = None
    url: str | None = None


class ViewMeta(BaseModel):
    source: SourceMeta = Field(default_factory=SourceMeta)
    freshness: str = "monthly"
    data_quality: str = "partial"
    last_updated: str | None = None
    currency: str = "INR"
    unit: str = "mixed"
    warnings: list[str] = Field(default_factory=list)

    # Your frontend 100-row rule.
    client_processing_limit: int = 100


class EmptyStateAction(BaseModel):
    key: str
    label: str


class EmptyState(BaseModel):
    title: str = "No data available"
    description: str = "There is no data for this view."
    action: EmptyStateAction | None = None


class WatchlistTab(BaseModel):
    id: str
    label: str
    count: int
    type: Literal["all", "core", "it", "banks", "speculative", "growth", "custom"]
    source: Literal["default", "user"] = "user"
    is_default: bool = False


class WatchlistPreset(BaseModel):
    id: str
    label: str
    description: str
    type: Literal["core", "it", "banks", "speculative", "growth", "custom"]


class WatchlistKpiCard(BaseModel):
    key: str
    label: str
    value: str | int | float
    suffix: str | None = None
    sub_value: str | None = None
    sub_tone: Literal["positive", "negative", "neutral"] | None = None
    helper: str | None = None
    sparkline: list[int | float] = Field(default_factory=list)
    tone: Literal["positive", "negative", "neutral", "accent"] = "neutral"


class WatchlistViewConfig(BaseModel):
    active_list_id: str = "all"
    allow_new_list: bool = True
    allow_add_stock: bool = True
    allow_drag_reorder: bool = True
    allow_export: bool = False
    tabs: list[WatchlistTab] = Field(default_factory=list)
    presets: list[WatchlistPreset] = Field(default_factory=list)
    kpis: list[WatchlistKpiCard] = Field(default_factory=list)


class DynamicView(BaseModel):
    view_id: str
    view_type: ViewType
    title: str
    description: str | None = None

    context: ViewContext = Field(default_factory=ViewContext)
    permissions: ViewPermissions
    features: ViewFeatures
    layout: ViewLayout
    user_layout: UserLayout | None = None

    actions: list[dict[str, Any]] = Field(default_factory=list)

    # For data_grid.
    columns: list[DataGridColumn] = Field(default_factory=list)
    data: dict[str, Any] = Field(default_factory=dict)

    pagination: PaginationMeta | None = None
    sorting: SortingMeta | None = None
    filters: list[FilterMeta] = Field(default_factory=list)

    row_expansion: RowExpansionConfig = Field(default_factory=RowExpansionConfig)

    meta: ViewMeta = Field(default_factory=ViewMeta)
    empty_state: EmptyState = Field(default_factory=EmptyState)
    error_state: dict[str, Any] | None = None

    # For dashboard/composed_view later.
    sections: list[Section] = Field(default_factory=list)
    components: list[Component] = Field(default_factory=list)

    # Watchlist-specific page config.
    # This keeps your current frontend compatible.
    watchlist: WatchlistViewConfig | None = None


class DynamicViewResponse(BaseModel):
    success: bool = True
    status: Literal["ok", "partial", "error", "permission_denied"] = "ok"
    request_id: str | None = None
    schema_version: str = "1.0"
    view: DynamicView