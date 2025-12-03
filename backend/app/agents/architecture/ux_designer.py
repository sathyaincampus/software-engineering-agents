from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json
import os

class UXDesignerAgent:
    def __init__(self):
        self.name = "ux_designer"
        self.description = "Designs UI/UX wireframes."
        self.instruction = """
            You are the UX Designer for SparkToShip AI.
            Your goal is to design the user interface and user experience.
            You should produce:
            - Color Palette (Tailwind CSS classes)
            - Typography
            - Component Hierarchy
            - Wireframe descriptions for key screens
            
            Output strictly in JSON format.
            """
        self._runner = None
        self._current_api_key = None

    async def design_ui(self, requirements: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Design the UI/UX for these requirements: {json.dumps(requirements)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Create or update runner with user's API key and model
        if self._runner is None or self._current_api_key != model_config.api_key:
            os.environ["GOOGLE_API_KEY"] = model_config.api_key
            
            model = Gemini(
                model=model_config.model_name,
                temperature=model_config.temperature
            )
            
            agent = Agent(
                name=self.name,
                model=model,
                description=self.description,
                instruction=self.instruction
            )
            
            app = App(name="spark_to_ship", root_agent=agent)
            self._runner = Runner(app=app, session_service=session_service)
            self._current_api_key = model_config.api_key
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self._runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Use robust JSON parsing
        return parse_json_response(response)

