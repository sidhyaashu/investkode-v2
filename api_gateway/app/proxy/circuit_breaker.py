import time

breaker_state = {}


class CircuitBreaker:

    def __init__(self, key, failure_threshold=5, cooldown=30):
        self.key = key
        self.failure_threshold = failure_threshold
        self.cooldown = cooldown

        if key not in breaker_state:
            breaker_state[key] = {
                "failures": 0,
                "state": "CLOSED",
                "last_failure": 0
            }

    def allow(self):
        state = breaker_state[self.key]

        if state["state"] == "OPEN":
            if time.time() - state["last_failure"] > self.cooldown:
                state["state"] = "HALF_OPEN"
                return True
            return False

        return True

    def success(self):
        breaker_state[self.key] = {
            "failures": 0,
            "state": "CLOSED",
            "last_failure": 0
        }

    def failure(self):
        state = breaker_state[self.key]
        state["failures"] += 1
        state["last_failure"] = time.time()

        if state["failures"] >= self.failure_threshold:
            state["state"] = "OPEN"


breaker = CircuitBreaker("global")
