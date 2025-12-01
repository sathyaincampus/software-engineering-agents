import json
from functools import wraps
from typing import Any, Callable, TypeVar

from redis import Redis

from core.config import settings
from core.redis_client import get_redis_client

# Generic Type Variable for function return types
T = TypeVar('T')

def cache_response(cache_key_prefix: str, expire_seconds: int = settings.CACHE_EXPIRATION_SECONDS):
    """Decorator to cache the response of a function (typically an API endpoint).

    Args:
        cache_key_prefix: A prefix for the Redis cache key to distinguish different cached data.
        expire_seconds: The time-to-live for the cache entry in seconds.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            redis: Redis = get_redis_client() # Use the dependency injection
            
            # Construct a cache key based on function name and arguments
            # Ensure kwargs are sorted for consistent key generation
            key_parts = [cache_key_prefix, func.__name__]
            for arg in args:
                # Attempt to serialize args, handle complex types carefully
                try:
                    key_parts.append(str(arg))
                except TypeError:
                    key_parts.append(repr(arg)) # Fallback for unstringable types
            
            sorted_kwargs = sorted(kwargs.items())
            for key, value in sorted_kwargs:
                try:
                    key_parts.append(f"{key}={value}")
                except TypeError:
                    key_parts.append(f"{key}={repr(value)}")

            cache_key = ":".join(key_parts)

            # Check cache first
            cached_data = redis.get(cache_key)
            if cached_data:
                try:
                    # Assuming cached data is JSON serialized
                    return json.loads(cached_data)
                except json.JSONDecodeError:
                    # If data is corrupted or not JSON, proceed to compute and re-cache
                    pass

            # If not cached, call the original function
            result = await func(*args, **kwargs)

            # Cache the result if it's not None
            if result is not None:
                try:
                    # Serialize the result to JSON before storing
                    serialized_result = json.dumps(result)
                    redis.set(cache_key, serialized_result, ex=expire_seconds)
                except TypeError:
                    # Handle cases where result might not be JSON serializable
                    # Log this error or decide on a different caching strategy
                    print(f"Warning: Result for {cache_key} is not JSON serializable and cannot be cached.")
            
            return result
        return wrapper
    return decorator

def invalidate_cache(cache_key: str):
    """Invalidates a specific cache key."""
    redis: Redis = get_redis_client()
    redis.delete(cache_key)

# Example of how you might use it (requires an async function)
# async def get_user_data(user_id: str):
#     # ... database lookup ...
#     pass

# @cache_response("user_data", expire_seconds=600)
# async def get_user_data_cached(user_id: str):
#    return await get_user_data(user_id)
