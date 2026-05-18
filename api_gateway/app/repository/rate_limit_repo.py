from app.core.redis import redis_client


async def increment(key: str, ttl: int = 60):
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    result = await pipe.execute()
    count = int(result[0])
    key_ttl = int(result[1])
    if key_ttl < 0:
        await redis_client.expire(key, ttl)
    return count


async def get_ttl(key: str):
    return await redis_client.ttl(key)
