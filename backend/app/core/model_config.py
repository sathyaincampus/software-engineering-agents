from pydantic import BaseModel
from typing import Optional, Literal

class ModelConfig(BaseModel):
    provider: Literal["google", "anthropic", "openai"] = "google"
    model_name: str = "gemini-2.0-flash-exp"
    api_key: str
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    timeout: int = 120  # seconds

class AppSettings(BaseModel):
    ai_model_config: ModelConfig  # Renamed from model_config to avoid Pydantic reserved name
    debug_mode: bool = False
    enable_telemetry: bool = True
