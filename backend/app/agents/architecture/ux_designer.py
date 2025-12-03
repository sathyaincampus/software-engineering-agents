from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json

class UXDesignerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ux_designer",
            description="Designs UI/UX wireframes.",
            instruction="""
            You are the UX Designer for SparkToShip AI.
            Your goal is to design the user interface and user experience.
            You should produce:
            - Color Palette (Tailwind CSS classes)
            - Typography
            - Component Hierarchy
            - Wireframe descriptions for key screens
            
            Output strictly in JSON format.
            """
        )

    async def design_ui(self, requirements: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Design the UI/UX for these requirements: {json.dumps(requirements)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Get runner with current model configuration
        runner = self._get_or_create_runner(model_config)
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Use robust JSON parsing
        return parse_json_response(response)
