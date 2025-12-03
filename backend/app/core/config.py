from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[str] = None  # Optional - users can provide via UI
    MODEL_NAME: str = "gemini-2.0-flash-exp"
    PROJECT_NAME: str = "SparkToShip AI"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        # Don't fail if .env file is missing
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# Set environment variable for ADK/Gemini to use (only if provided in .env)
# This is a fallback - the actual API key will come from user settings
if settings.GOOGLE_API_KEY:
    os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
