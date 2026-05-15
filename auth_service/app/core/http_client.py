import httpx


class AsyncHttpClient:
    """
    🛡️ Centralized HTTP Client for the Auth Service.
    Uses connection pooling (Limits) and keep-alive to maximize performance
    and reduce TCP handshake latency for external calls (e.g., Google OAuth).
    """

    def __init__(self):
        self.client: httpx.AsyncClient = None

    def start(self):
        # Production Limits: Optimized for typical auth service traffic
        limits = httpx.Limits(
            max_connections=100,
            max_keepalive_connections=20,
            keepalive_expiry=30.0
        )

        self.client = httpx.AsyncClient(
            limits=limits,
            # Default timeout for all external HTTP calls
            timeout=httpx.Timeout(timeout=10.0, connect=5.0),
            follow_redirects=False,
        )

    async def stop(self):
        if self.client:
            await self.client.aclose()
            self.client = None


http_client = AsyncHttpClient()
