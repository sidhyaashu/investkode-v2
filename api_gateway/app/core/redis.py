import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    # --- Production Resilience Settings ---
    # Fail fast if the Redis server is unreachable (2s connect, 2s command)
    socket_connect_timeout=2.0,
    socket_timeout=2.0,
    # Actively probe idle connections to drop silently broken ones
    health_check_interval=10,
    # Cap pool size to prevent Redis from being overwhelmed during traffic spikes
    max_connections=500,
)
