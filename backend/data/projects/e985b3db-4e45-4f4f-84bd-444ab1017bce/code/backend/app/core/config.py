import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from a .env file if it exists
# This is useful for local development
load_dotenv()

class Settings(BaseSettings):
    # --- General Settings ---
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_secret_key_for_dev_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Database Settings ---
    # Format: postgresql://user:password@host:port/database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/sparktoship_db")
    # Example for async connection pool:
    # DATABASE_URL_ASYNC: str = os.getenv("DATABASE_URL_ASYNC", "postgresql+asyncpg://postgres:password@localhost:5432/sparktoship_db")

    # --- Redis Settings ---
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD: str | None = os.getenv("REDIS_PASSWORD")

    # --- Logging Settings ---
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO") # e.g., DEBUG, INFO, WARNING, ERROR
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json") # e.g., json, plain

    # --- Cloud Storage Settings (Example for AWS S3) ---
    AWS_ACCESS_KEY_ID: str | None = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str | None = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str | None = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME: str | None = os.getenv("S3_BUCKET_NAME", "sparktoship-attachments-dev")

    # --- Monitoring Settings (Example for Prometheus metrics endpoint) ---
    METRICS_ENABLED: bool = os.getenv("METRICS_ENABLED", "false").lower() == "true"
    METRICS_PORT: int = int(os.getenv("METRICS_PORT", 9091)) # Port for metrics endpoint if separate

    class Config:
        env_file = '.env' # Specifies the file to load environment variables from
        env_file_encoding = 'utf-8'
        # case_sensitive = True # Set to True if variable names are case-sensitive

# Instantiate settings
settings = Settings()

# --- Helper Function (Optional) --- 
def get_database_url() -> str:
    """Returns the database URL, potentially prioritizing async if needed."""
    # Example: prioritize async URL if available
    # return settings.DATABASE_URL_ASYNC if settings.DATABASE_URL_ASYNC else settings.DATABASE_URL
    return settings.DATABASE_URL

