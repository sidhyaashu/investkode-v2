from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.views.builders.base import ViewBuildContext
from app.views.builders.watchlist_default import WatchlistDefaultViewBuilder


VIEW_BUILDERS = {
    "watchlist.default": WatchlistDefaultViewBuilder,
}


async def build_view_response(
    view_id: str,
    user: dict[str, Any],
    db: AsyncSession,
    financial_db: AsyncSession,
    query: dict[str, Any],
    request_id: str | None = None,
) -> dict[str, Any]:
    builder_cls = VIEW_BUILDERS.get(view_id)

    if not builder_cls:
        return {
            "success": False,
            "status": "error",
            "request_id": request_id,
            "schema_version": "1.0",
            "error": {
                "code": "UNKNOWN_VIEW",
                "message": f"Unsupported view_id: {view_id}",
            },
        }

    context = ViewBuildContext(
        user=user,
        db=db,
        financial_db=financial_db,
        query=query,
        request_id=request_id,
    )

    builder = builder_cls(context)
    return await builder.build_response()