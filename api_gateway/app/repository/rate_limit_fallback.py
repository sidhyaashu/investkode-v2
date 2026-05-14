import time
from collections import defaultdict


class LocalRateLimiter:
    def __init__(self, max_keys=10000):
        self.store = defaultdict(list)
        self.max_keys = max_keys

    def allow(self, key, limit=100, window=60):
        now = time.time()

        # 🧹 Memory Protection: If store gets too large, clear it
        if len(self.store) >= self.max_keys:
            # Simple cleanup: clear the whole store
            # In a real system, we'd use LRU or clear only expired keys
            self.store.clear()

        requests = self.store[key]

        # 🧹 Key Cleanup: remove old requests
        valid_requests = [t for t in requests if now - t < window]
        
        if len(valid_requests) >= limit:
            self.store[key] = valid_requests # Save cleaned state
            return False

        valid_requests.append(now)
        self.store[key] = valid_requests
        return True


local_limiter = LocalRateLimiter()
