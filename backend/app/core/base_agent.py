"""
Base agent class that supports dynamic model configuration.
All agents should inherit from this to use user-provided API keys.
"""
from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from app.core.services import session_service
from app.core.model_config import ModelConfig
from app.core.model_factory import ModelFactory
import os
from typing import Optional


class BaseAgent:
    """Base class for all agents with dynamic model configuration support."""
    
    def __init__(self, name: str, description: str, instruction: str):
        """
        Initialize base agent without creating model instance.
        Model will be created dynamically when needed.
        
        Args:
            name: Agent name
            description: Agent description
            instruction: Agent instruction prompt
        """
        self.name = name
        self.description = description
        self.instruction = instruction
        self._model = None
        self._agent = None
        self._app = None
        self._runner = None
        self._current_api_key = None
    
    def _get_or_create_runner(self, model_config: ModelConfig) -> Runner:
        """
        Get or create runner with the given model configuration.
        Recreates runner if API key has changed.
        
        Args:
            model_config: Model configuration with API key
            
        Returns:
            Runner instance
            
        Raises:
            ValueError: If API key is invalid or missing
        """
        from app.utils.security import mask_api_key, validate_api_key
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Validate API key
        is_valid, error_msg = validate_api_key(model_config.api_key)
        if not is_valid:
            logger.error(f"[{self.name}] {error_msg}")
            raise ValueError(error_msg)
        
        # Check if we need to recreate the runner (API key changed)
        if self._runner is None or self._current_api_key != model_config.api_key:
            masked_key = mask_api_key(model_config.api_key)
            logger.info(f"[{self.name}] Using API key: {masked_key} (user-provided)")
            
            # Set the API key in environment for Gemini
            os.environ["GOOGLE_API_KEY"] = model_config.api_key
            
            # Create new model instance
            self._model = ModelFactory.create_model(
                provider=model_config.provider,
                model_name=model_config.model_name,
                api_key=model_config.api_key,
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens
            )
            
            # Create new agent
            self._agent = Agent(
                name=self.name,
                model=self._model,
                description=self.description,
                instruction=self.instruction
            )
            
            # Create new app and runner
            self._app = App(name="spark_to_ship", root_agent=self._agent)
            self._runner = Runner(app=self._app, session_service=session_service)
            
            # Remember current API key
            self._current_api_key = model_config.api_key
            logger.info(f"[{self.name}] Runner created successfully with model: {model_config.model_name}")
        
        return self._runner
