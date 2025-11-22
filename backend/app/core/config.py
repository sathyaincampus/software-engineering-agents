from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    MODEL_NAME: str = "gemini-2.5-flash-lite"
    PROJECT_NAME: str = "ZeroToOne AI"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
