from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os

class Settings(BaseSettings):
    # SECURITY: Do NOT use GOOGLE_API_KEY from .env
    # Users MUST provide their own API key via UI settings
    # This prevents accidentally using the developer's API key
    MODEL_NAME: str = "gemini-2.0-flash-exp"
    PROJECT_NAME: str = "SparkToShip AI"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# SECURITY: Do NOT set GOOGLE_API_KEY from .env
# All API keys must come from user settings via UI
