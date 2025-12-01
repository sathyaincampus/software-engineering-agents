import uuid
from datetime import timedelta

from redis import Redis

from core.config import settings
from core.redis_client import get_redis_client

SESSION_EXPIRATION_SECONDS = 3600  # 1 hour default session expiration

class SessionManager:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    def create_session(self, user_id: str, session_data: dict = None) -> str:
        """Creates a new session and stores it in Redis."""
        session_id = str(uuid.uuid4())
        if session_data is None:
            session_data = {}
        
        session_data['user_id'] = user_id # Ensure user_id is always in session data
        
        # Store session data in Redis with an expiration time
        self.redis.set(f"session:{session_id}", str(session_data), ex=SESSION_EXPIRATION_SECONDS)
        return session_id

    def get_session(self, session_id: str) -> dict | None:
        """Retrieves session data from Redis."""
        session_data_str = self.redis.get(f"session:{session_id}")
        if session_data_str:
            try:
                # Convert the string representation of dict back to dict
                # This simple approach assumes basic types; for complex objects, consider JSON serialization
                import ast
                return ast.literal_eval(session_data_str)
            except (ValueError, SyntaxError):
                # Handle cases where the stored data is not a valid literal or malformed
                return None
        return None

    def update_session(self, session_id: str, new_data: dict) -> bool:
        """Updates existing session data. Merges new data with existing data."""
        current_session = self.get_session(session_id)
        if current_session is None:
            return False

        current_session.update(new_data)
        # Extend expiration time on update
        self.redis.set(f"session:{session_id}", str(current_session), ex=SESSION_EXPIRATION_SECONDS)
        return True

    def destroy_session(self, session_id: str) -> bool:
        """Deletes a session from Redis."""
        deleted_count = self.redis.delete(f"session:{session_id}")
        return deleted_count > 0

    def extend_session(self, session_id: str) -> bool:
        """Extends the expiration time of an existing session."""
        if self.redis.exists(f"session:{session_id}"):
            return self.redis.expire(f"session:{session_id}", SESSION_EXPIRATION_SECONDS)
        return False

# Factory function to create a SessionManager instance
def get_session_manager() -> SessionManager:
    """Provides a SessionManager instance, injecting the Redis client."""
    redis_client = get_redis_client()
    return SessionManager(redis_client)

# Example Usage (for demonstration, typically used within FastAPI dependencies)
# async def example_session_flow():
#     session_manager = get_session_manager()
#     user_id = "user-123"
#     initial_data = {"username": "testuser"}

#     # Create session
#     session_id = session_manager.create_session(user_id, initial_data)
#     print(f"Created session with ID: {session_id}")

#     # Retrieve session
#     retrieved_session = session_manager.get_session(session_id)
#     print(f"Retrieved session: {retrieved_session}")

#     # Update session
#     update_success = session_manager.update_session(session_id, {"last_login": "now"})
#     print(f"Session update successful: {update_success}")
#     print(f"Updated session: {session_manager.get_session(session_id)}")

#     # Extend session
#     extend_success = session_manager.extend_session(session_id)
#     print(f"Session extended: {extend_success}")

#     # Destroy session
#     destroy_success = session_manager.destroy_session(session_id)
#     print(f"Session destroyed: {destroy_success}")
#     print(f"Session after destruction: {session_manager.get_session(session_id)}")

# if __name__ == "__main__":
#     try:
#         example_session_flow()
#     except redis.exceptions.ConnectionError as e:
#         print(f"Error connecting to Redis: {e}")
