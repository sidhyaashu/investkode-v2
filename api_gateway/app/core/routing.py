from app.core.config import settings

ROUTES = {
    "/api/v1/auth": {
        "service_name": "auth_service",
        "target": settings.AUTH_SERVICE_URL,
        "auth_required": False,
        "strip_prefix": False,
        "timeout": 15.0,
        "cache_ttl": 0,
    },
    "/api/v1/user": {
        "service_name": "auth_service",
        "target": settings.AUTH_SERVICE_URL,
        "auth_required": True,
        "strip_prefix": False,
        "timeout": 15.0,
        "cache_ttl": 0,
    },
}


def resolve_route(path: str):
    matched = None
    longest = ""

    for prefix, config in ROUTES.items():
        if path.startswith(prefix) and len(prefix) > len(longest):
            longest = prefix
            matched = config

    return matched, longest
