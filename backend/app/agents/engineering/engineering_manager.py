from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any, List
import json

class EngineeringManagerAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="engineering_manager",
            model=self.model,
            description="Creates sprint plans and assigns tasks.",
            instruction="""
            You are the Engineering Manager for ZeroToOne AI.
            Your goal is to create a sprint plan based on user stories and architecture.
            You should:
            - Break down stories into technical tasks
            - Assign tasks to Backend or Frontend agents
            - Estimate effort
            
            Output strictly in JSON format.
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def create_sprint_plan(self, user_stories: list, architecture: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"""
        Create a Sprint Plan.
        User Stories: {json.dumps(user_stories)}
        Architecture: {json.dumps(architecture)}
        """
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
