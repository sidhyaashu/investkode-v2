import secrets
from app.core.redis import redis_client

from app.core.config import settings

def generate_otp():
    # Cryptographically secure random 6-digit OTP
    return "".join(secrets.choice("0123456789") for _ in range(6))


async def store_otp(email: str, otp: str, purpose: str):
    key = f"otp:{purpose}:{email}"
    await redis_client.set(key, otp, ex=settings.OTP_EXPIRY_SECONDS)


async def verify_otp(email: str, otp: str, purpose: str):
    key = f"otp:{purpose}:{email}"
    stored = await redis_client.get(key)

    if not stored or stored != otp:
        return False

    await redis_client.delete(key)
    return True


async def check_otp_rate_limit(email: str):
    key = f"otp_rate:{email}"

    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    result = await pipe.execute()

    count = int(result[0])
    key_ttl = int(result[1])

    if key_ttl < 0:
        await redis_client.expire(key, settings.OTP_RATE_LIMIT_WINDOW)

    if count > settings.OTP_RATE_LIMIT_MAX:
        return False

    return True


async def check_login_rate_limit(email: str):
    key = f"login_rate:{email}"

    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    result = await pipe.execute()

    count = int(result[0])
    key_ttl = int(result[1])

    if key_ttl < 0:
        await redis_client.expire(key, settings.LOGIN_RATE_LIMIT_WINDOW)

    if count > settings.LOGIN_RATE_LIMIT_MAX:
        return False

    return True
