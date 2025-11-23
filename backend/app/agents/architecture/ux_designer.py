from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class UXDesignerAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="ux_designer",
            model=self.model,
            description="Designs UI/UX wireframes.",
            instruction="""
            You are the UX Designer for ZeroToOne AI.
            Your goal is to design the user interface and user experience.
            You should produce:
            - Color Palette (Tailwind CSS classes)
            - Typography
            - Component Hierarchy
            - Wireframe descriptions for key screens
            
            Output strictly in JSON format.
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def design_ui(self, requirements: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"Design the UI/UX for these requirements: {json.dumps(requirements)}"
        from app.utils.adk_helper import collect_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        try:
            text = str(response)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except Exception:
            return {"raw_output": str(response), "error": "Failed to parse JSON"}
