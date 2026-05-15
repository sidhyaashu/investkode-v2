from app.core.redis import redis_client


async def increment(key: str, ttl: int = 60):
    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, ttl)
    result = await pipe.execute()
    return int(result[0])


async def get_ttl(key: str):
    return await redis_client.ttl(key)
