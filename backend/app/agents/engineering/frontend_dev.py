from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class FrontendDevAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="frontend_dev",
            model=self.model,
            description="Writes frontend code.",
            instruction="""
            You are the Frontend Developer for SparkToShip AI.
            Your goal is to write clean, responsive, and modern frontend code (React/Tailwind) and create UI visualizations/mockups.
            
            Output strictly in JSON format with keys: "files" (list of {path, content}).
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def write_code(self, task: Dict[str, Any], context: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"""
        Write code for the following task:
        {json.dumps(task, indent=2)}
        
        Context (Architecture/Stack):
        {json.dumps(context, indent=2)}
        """
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Use robust JSON parsing
        return parse_json_response(response)
