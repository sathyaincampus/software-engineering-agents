"""
Helper function to create ADK runner with validation
"""
from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from app.core.services import session_service
from app.core.model_config import ModelConfig
from app.utils.security import validate_api_key
import os


def create_adk_runner(
    agent_name: str,
    agent_description: str,
    agent_instruction: str,
    model_config: ModelConfig
) -> Runner:
    """
    Create an ADK Runner with proper validation.
    
    This function:
    1. Validates the user's API key
    2. Creates a Gemini model with the user's configuration
    3. Creates an ADK Agent
    4. Wraps it in an App
    5. Returns a Runner with session management
    
    Args:
        agent_name: Name of the agent
        agent_description: Description of the agent
        agent_instruction: Instruction prompt for the agent
        model_config: Model configuration with user's API key
        
    Returns:
        ADK Runner instance
        
    Raises:
        ValueError: If API key is invalid or missing
    """
    # Validate API key BEFORE using it
    is_valid, error_msg = validate_api_key(model_config.api_key)
    if not is_valid:
        raise ValueError(error_msg)
    
    # Set API key in environment for Gemini
    os.environ["GOOGLE_API_KEY"] = model_config.api_key
    
    # Create ADK model with user's selected model
    model = Gemini(
        model=model_config.model_name,
        temperature=model_config.temperature
    )
    
    # Create ADK Agent
    agent = Agent(
        name=agent_name,
        model=model,
        description=agent_description,
        instruction=agent_instruction
    )
    
    # Create ADK App
    app = App(name="spark_to_ship", root_agent=agent)
    
    # Create ADK Runner with session service
    runner = Runner(app=app, session_service=session_service)
    
    return runner
