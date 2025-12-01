"""
Model factory to support multiple AI providers
"""
from typing import Any
from google.adk.models import Gemini
import os

class ModelFactory:
    """Factory to create model instances based on provider"""
    
    @staticmethod
    def create_model(provider: str, model_name: str, api_key: str, **kwargs) -> Any:
        """
        Create a model instance based on provider
        
        Args:
            provider: "google", "anthropic", or "openai"
            model_name: Model identifier
            api_key: API key for the provider
            **kwargs: Additional model parameters (temperature, max_tokens, etc.)
        
        Returns:
            Model instance compatible with ADK
        """
        if provider == "google":
            # Set API key in environment for Gemini
            os.environ["GOOGLE_API_KEY"] = api_key
            return Gemini(
                model=model_name,
                **{k: v for k, v in kwargs.items() if k in ['temperature', 'max_output_tokens']}
            )
        
        elif provider == "anthropic":
            # ADK supports Anthropic models via google.genai
            os.environ["ANTHROPIC_API_KEY"] = api_key
            # Note: ADK's Anthropic support may require additional setup
            # For now, we'll use Gemini as fallback
            raise NotImplementedError(
                "Anthropic support coming soon. ADK primarily supports Gemini models."
            )
        
        elif provider == "openai":
            os.environ["OPENAI_API_KEY"] = api_key
            raise NotImplementedError(
                "OpenAI support coming soon. ADK primarily supports Gemini models."
            )
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    @staticmethod
    def get_available_models(provider: str) -> list[dict]:
        """Get list of available models for a provider"""
        models = {
            "google": [
                {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite", "description": "Lightweight, fast model"},
                {"id": "gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash (Experimental)", "description": "Latest experimental model"},
                {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "description": "Lightweight, fast model"},
                {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "description": "Most capable model"},
                {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Fast and efficient"},
            ],
            "anthropic": [
                {"id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5", "description": "Coming soon"},
            ],
            "openai": [
                {"id": "gpt-4", "name": "GPT-4", "description": "Coming soon"},
            ]
        }
        return models.get(provider, [])
