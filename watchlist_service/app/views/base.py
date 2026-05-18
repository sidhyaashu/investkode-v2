from math import ceil
from typing import Any, Literal

from app.views.schemas import (
    DataGridColumn,
    DynamicView,
    DynamicViewResponse,
    EmptyState,
    EmptyStateAction,
    FilterMeta,
    PaginationMeta,
    RowExpansionConfig,
    SortingMeta,
    SourceMeta,
    UserLayout,
    ViewFeatures,
    ViewLayout,
    ViewMeta,
    ViewPermissions,
)


Density = Literal["compact", "comfortable", "spacious"]
SortDirection = Literal["asc", "desc"]


def calculate_total_pages(total_rows: int, page_size: int) -> int:
    if page_size <= 0:
        return 1

    if total_rows <= 0:
        return 1

    return ceil(total_rows / page_size)


def build_success_response(
    view: DynamicView,
    request_id: str | None = None,
    schema_version: str = "1.0",
) -> dict[str, Any]:
    response = DynamicViewResponse(
        success=True,
        status="ok",
        request_id=request_id,
        schema_version=schema_version,
        view=view,
    )

    return response.model_dump(mode="json", exclude_none=True)


def build_permissions(
    plan: str = "free",
    required_plan: str = "free",
    can_export: bool = False,
    can_expand_rows: bool = False,
) -> ViewPermissions:
    return ViewPermissions(
        access="allowed",
        plan=plan,
        required_plan=required_plan,
        can_view=True,
        can_export=can_export,
        can_customize_layout=True,
        can_sort=True,
        can_filter=True,
        can_add_column=False,
        can_remove_column=True,
        can_expand_rows=can_expand_rows,
        can_view_nested_data=can_expand_rows,
    )


def build_features(
    mode: Literal["client", "server"],
    exportable: bool = False,
    expandable_rows: bool = False,
    lazy_expansion: bool = False,
    nested_views: bool = False,
) -> ViewFeatures:
    is_client = mode == "client"

    return ViewFeatures(
        searchable=True,
        sortable=True,
        filterable=True,
        exportable=exportable,
        pagination=True,
        column_customization=True,
        row_actions=True,
        bulk_actions=False,
        mobile_card_view=True,
        virtualized=False,
        expandable_rows=expandable_rows,
        lazy_expansion=lazy_expansion,
        nested_views=nested_views,
        row_hierarchy=False,
        child_pagination=False,
        child_sorting=False,
        child_filtering=False,
        expansion_cache=lazy_expansion,
        client_sorting=is_client,
        client_filtering=is_client,
        client_pagination=is_client,
        server_sorting=not is_client,
        server_filtering=not is_client,
        server_pagination=not is_client,
    )


def build_layout(
    page_size: int = 10,
    pinned_columns: list[str] | None = None,
    density: Density = "compact",
) -> ViewLayout:
    return ViewLayout(
        density=density,
        variant="glass",
        responsive_mode="table_to_cards",
        pinned_columns=pinned_columns or [],
        pinned_rows=[],
        default_page_size=page_size,
        expansion_position="below_row",
        expansion_indent=True,
    )


def build_user_layout(
    sort_key: str | None = None,
    sort_dir: SortDirection | None = None,
    pinned_columns: list[str] | None = None,
    density: Density = "compact",
) -> UserLayout:
    sort = None

    if sort_key and sort_dir:
        sort = {
            "key": sort_key,
            "direction": sort_dir,
        }

    return UserLayout(
        source="default",
        preference_id=None,
        visible_columns=[],
        column_order=[],
        column_widths={},
        pinned_columns=pinned_columns or [],
        expanded_rows=[],
        sort=sort,
        filters=[],
        density=density,
    )


def build_pagination(
    page: int,
    page_size: int,
    total_rows: int,
    mode: Literal["client", "server"],
) -> PaginationMeta:
    return PaginationMeta(
        page=page,
        page_size=page_size,
        total_rows=total_rows,
        total_pages=calculate_total_pages(total_rows, page_size),
        mode=mode,
    )


def build_sorting(
    sort_key: str,
    sort_dir: SortDirection,
    allowed_keys: list[str],
    mode: Literal["client", "server"],
) -> SortingMeta:
    return SortingMeta(
        mode=mode,
        default={
            "key": sort_key,
            "direction": sort_dir,
        },
        allowed_keys=allowed_keys,
    )


def make_filter(
    key: str,
    label: str,
    filter_type: Literal["text", "select", "multi_select", "number_range"],
    options: list[str] | None = None,
) -> FilterMeta:
    return FilterMeta(
        key=key,
        label=label,
        type=filter_type,
        options=options or [],
    )


def make_column(
    key: str,
    label: str,
    column_type: Literal[
        "text",
        "number",
        "percent",
        "currency",
        "company",
        "range",
        "badge",
        "actions",
    ],
    renderer: str | None = None,
    formatter: str | None = None,
    tone_rule: str | None = None,
    sortable: bool = False,
    filterable: bool = False,
    hideable: bool = True,
    default_visible: bool = True,
    width: int | None = None,
    min_width: int | None = None,
    align: Literal["left", "center", "right"] = "left",
) -> DataGridColumn:
    return DataGridColumn(
        key=key,
        label=label,
        type=column_type,
        renderer=renderer,
        formatter=formatter,
        tone_rule=tone_rule,
        sortable=sortable,
        filterable=filterable,
        hideable=hideable,
        default_visible=default_visible,
        width=width,
        min_width=min_width,
        align=align,
    )


def build_row_expansion(
    enabled: bool,
    mode: Literal["inline", "lazy", "nested_view"] | None = None,
    endpoint: str | None = None,
    allowed_expansion_keys: list[str] | None = None,
) -> RowExpansionConfig:
    return RowExpansionConfig(
        enabled=enabled,
        mode=mode if enabled else None,
        trigger="row_click",
        endpoint=endpoint,
        allowed_expansion_keys=allowed_expansion_keys or [],
        cache_ttl_seconds=300,
    )


def build_view_meta(
    freshness: str = "monthly",
    data_quality: str = "partial",
    warnings: list[str] | None = None,
    client_processing_limit: int = 100,
) -> ViewMeta:
    return ViewMeta(
        source=SourceMeta(
            type="internal_db",
            name="InvestKaro DB",
            vendor="Accord Fintech",
        ),
        freshness=freshness,
        data_quality=data_quality,
        last_updated=None,
        currency="INR",
        unit="mixed",
        warnings=warnings or [],
        client_processing_limit=client_processing_limit,
    )


def build_empty_state(
    title: str,
    description: str,
    action_key: str | None = None,
    action_label: str | None = None,
) -> EmptyState:
    action = None

    if action_key and action_label:
        action = EmptyStateAction(
            key=action_key,
            label=action_label,
        )

    return EmptyState(
        title=title,
        description=description,
        action=action,
    )