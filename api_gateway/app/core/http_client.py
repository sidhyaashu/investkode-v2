import httpx

class AsyncHttpClient:
    """
    🛡️ Centralized HTTP Client for the Gateway.
    Uses connection pooling (Limits) and keep-alive to maximize performance 
    and reduce latency between services.
    """
    def __init__(self):
        self.client: httpx.AsyncClient = None

    def start(self):
        # 🛡️ PRODUCTION LIMITS: Optimized for high concurrency
        limits = httpx.Limits(
            max_connections=200,
            max_keepalive_connections=50,
            keepalive_expiry=30.0
        )
        
        self.client = httpx.AsyncClient(
            limits=limits,
            timeout=httpx.Timeout(timeout=10.0, connect=5.0),
            follow_redirects=False
        )

    async def stop(self):
        if self.client:
            await self.client.aclose()
            self.client = None

http_client = AsyncHttpClient()
