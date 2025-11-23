from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    MODEL_NAME: str = "gemini-2.0-flash-exp"
    PROJECT_NAME: str = "ZeroToOne AI"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# Set environment variable for ADK/Gemini to use
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
