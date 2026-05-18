import time
from app.core.redis import redis_client
from app.core.config import settings

# Local fallback in case Redis crashes
_local_state = {}


class DistributedCircuitBreaker:
    """
    🛡️ Distributed Circuit Breaker.
    Uses Redis for state sharing with local memory fallback.
    """

    def __init__(self, service_name: str, failure_threshold: int = None, cooldown: int = None):
        self.key = f"circuit_breaker:{service_name}"
        self.threshold = failure_threshold or settings.CIRCUIT_BREAKER_THRESHOLD
        self.cooldown = cooldown or settings.CIRCUIT_BREAKER_COOLDOWN

    async def allow(self) -> bool:
        """Checks if the circuit is open."""
        try:
            # 🌟 UPGRADE: Check Redis for "OPEN" state
            is_open = await redis_client.get(f"{self.key}:open")
            if is_open:
                return False
            return True
        except Exception:
            # Fallback to local memory if Redis is down
            state = _local_state.get(self.key, {"failures": 0, "open_until": 0})
            if time.time() < state["open_until"]:
                return False
            return True

    async def success(self):
        """Resets the circuit on successful request."""
        try:
            await redis_client.delete(f"{self.key}:failures")
            await redis_client.delete(f"{self.key}:open")
        except Exception:
            _local_state[self.key] = {"failures": 0, "open_until": 0}

    async def failure(self):
        """Increments failure count and trips the circuit if threshold is reached."""
        try:
            pipe = redis_client.pipeline()
            pipe.incr(f"{self.key}:failures")
            pipe.ttl(f"{self.key}:failures")
            result = await pipe.execute()

            failures = int(result[0])
            failures_ttl = int(result[1])

            if failures_ttl < 0:
                await redis_client.expire(f"{self.key}:failures", self.cooldown)

            if failures >= self.threshold:
                # Trip the breaker for the specified cooldown period
                await redis_client.set(f"{self.key}:open", "true", ex=self.cooldown)
        except Exception:
            # Local fallback logic
            state = _local_state.get(self.key, {"failures": 0, "open_until": 0})
            state["failures"] += 1
            if state["failures"] >= self.threshold:
                state["open_until"] = time.time() + self.cooldown
            _local_state[self.key] = state


# Global breaker instance
breaker = DistributedCircuitBreaker("global")
