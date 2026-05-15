import time
from app.repository.redis import redis_client

# Local fallback in case Redis crashes
_local_state = {}


class DistributedCircuitBreaker:
    """
    🛡️ Distributed Circuit Breaker.
    Uses Redis for state sharing with local memory fallback.
    """

    def __init__(self, key: str, failure_threshold=5, cooldown=30):
        self.key = f"circuit_breaker:{key}"
        self.threshold = failure_threshold
        self.cooldown = cooldown

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
            failures = await redis_client.incr(f"{self.key}:failures")
            if int(failures) == 1:
                await redis_client.expire(f"{self.key}:failures", self.cooldown)

            if int(failures) >= self.threshold:
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