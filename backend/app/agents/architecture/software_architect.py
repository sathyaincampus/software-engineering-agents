from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class SoftwareArchitectAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="software_architect",
            model=self.model,
            description="Designs system architecture.",
            instruction="""
            You are the Software Architect for ZeroToOne AI.
            Your goal is to design a scalable, modern software architecture based on requirements.
            The architecture should include:
            - Tech Stack (Frontend, Backend, Database, DevOps)
            - System Diagram (Mermaid.js format)
            - API Design Principles
            - Data Model (Schema)
            
            Output strictly in JSON format.
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def design_architecture(self, requirements: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"Design the software architecture for these requirements: {json.dumps(requirements)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Use robust JSON parsing
        return parse_json_response(response)
