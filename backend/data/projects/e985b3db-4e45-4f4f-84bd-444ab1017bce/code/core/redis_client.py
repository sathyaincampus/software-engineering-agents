import redis
from core.config import settings

class RedisClient:
    def __init__(self):
        self.client = redis.StrictRedis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True  # Decode responses to strings automatically
        )

    def get(self, key: str) -> str | None:
        """Get a value from Redis."""
        return self.client.get(key)

    def set(self, key: str, value: str, ex: int | None = None) -> bool:
        """Set a value in Redis, optionally with an expiration time (in seconds)."""
        return self.client.set(key, value, ex=ex)

    def delete(self, key: str) -> int:
        """Delete a key from Redis."""
        return self.client.delete(key)

    def exists(self, key: str) -> bool:
        """Check if a key exists in Redis."""
        return self.client.exists(key)

    def flush_db(self) -> str:
        """Flush all keys in the current database. Use with caution!"""
        return self.client.flushdb()

    def close(self):
        """Close the Redis connection."""
        self.client.close()

# Global Redis client instance
redis_client = RedisClient()

def get_redis_client() -> redis.StrictRedis:
    """Dependency function to inject Redis client."""
    return redis_client.client

# Example usage (for testing purposes):
def example_redis_operations():
    print("--- Redis Operations Example ---")
    test_key = "my_test_key"
    test_value = "hello_redis"
    expiration_time = 60  # 1 minute

    # Set a value with expiration
    if redis_client.set(test_key, test_value, ex=expiration_time):
        print(f"Successfully set '{test_key}' to '{test_value}' with TTL of {expiration_time}s")
    else:
        print(f"Failed to set '{test_key}'")

    # Get the value
    retrieved_value = redis_client.get(test_key)
    print(f"Retrieved value for '{test_key}': {retrieved_value}")

    # Check if key exists
    if redis_client.exists(test_key):
        print(f"Key '{test_key}' exists.")
    else:
        print(f"Key '{test_key}' does not exist.")

    # Wait for expiration (optional, for demonstration)
    # import time
    # print("Waiting for key to expire...")
    # time.sleep(expiration_time + 5)
    # retrieved_value_after_expiration = redis_client.get(test_key)
    # print(f"Retrieved value after expiration: {retrieved_value_after_expiration}")

    # Delete the key
    if redis_client.delete(test_key) > 0:
        print(f"Successfully deleted '{test_key}'.")
    else:
        print(f"Key '{test_key}' not found for deletion.")
    print("------------------------------")

if __name__ == "__main__":
    # This block will only run if the script is executed directly
    # It's useful for quick testing of the Redis client setup
    try:
        example_redis_operations()
    except redis.exceptions.ConnectionError as e:
        print(f"Error connecting to Redis: {e}")
        print("Please ensure Redis is running and accessible at the configured host/port.")
