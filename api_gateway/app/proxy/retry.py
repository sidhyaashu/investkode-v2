import asyncio
import httpx

async def retry(func, method="GET", retries=3, base_delay=0.2):
    """
    Standardized retry logic for the API Gateway.
    
    🛡️ CRITICAL PRODUCTION FIX: 
    Only retry idempotent methods (GET, HEAD, OPTIONS). 
    Never retry POST, PUT, DELETE, or PATCH to prevent duplicate writes or data corruption.
    """
    if method not in ["GET", "HEAD", "OPTIONS"]:
        return await func()

    for attempt in range(retries):
        try:
            return await func()
        except (httpx.ConnectError, httpx.TimeoutException):
            # Only retry on network/timeout errors, not on 4xx/5xx responses
            if attempt == retries - 1:
                raise
            
            delay = base_delay * (2 ** attempt)  # Exponential backoff
            await asyncio.sleep(delay)
        except Exception:
            # For any other exception, raise immediately
            raise
