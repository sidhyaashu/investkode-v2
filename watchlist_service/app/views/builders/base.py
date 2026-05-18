from abc import ABC, abstractmethod
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession


SortDirection = Literal["asc", "desc"]
ViewMode = Literal["client", "server"]


class ViewBuildContext:
    def __init__(
        self,
        user: dict[str, Any],
        db: AsyncSession,
        financial_db: AsyncSession,
        query: dict[str, Any],
        request_id: str | None = None,
    ):
        self.user = user
        self.db = db
        self.financial_db = financial_db
        self.query = query
        self.request_id = request_id

    @property
    def user_id(self) -> str:
        return str(self.user["user_id"])

    @property
    def plan(self) -> str:
        return str(self.user.get("tier", "free"))

    @property
    def mode(self) -> ViewMode:
        raw = str(self.query.get("mode") or "client")
        return "server" if raw == "server" else "client"

    @property
    def page(self) -> int:
        return max(1, int(self.query.get("page") or 1))

    @property
    def page_size(self) -> int:
        return min(100, max(1, int(self.query.get("page_size") or 10)))

    @property
    def sort_key(self) -> str:
        return str(self.query.get("sort_key") or "position")

    @property
    def sort_dir(self) -> SortDirection:
        return "desc" if str(self.query.get("sort_dir")) == "desc" else "asc"


class BaseViewBuilder(ABC):
    view_id: str

    def __init__(self, context: ViewBuildContext):
        self.context = context

    async def build_response(self) -> dict[str, Any]:
        view = await self.build_view()
        return self.serialize(view)

    @abstractmethod
    async def build_view(self):
        raise NotImplementedError

    @abstractmethod
    def serialize(self, view) -> dict[str, Any]:
        raise NotImplementedError