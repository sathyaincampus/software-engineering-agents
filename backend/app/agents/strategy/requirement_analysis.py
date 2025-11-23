from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class RequirementAnalysisAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="requirement_analysis",
            model=self.model,
            description="Analyzes PRD and extracts user stories.",
            instruction="""
            You are the Requirement Analysis Agent for ZeroToOne AI.
            Your goal is to analyze the PRD and break it down into technical user stories.
            Each user story should have:
            - Title
            - Description
            - Acceptance Criteria
            - Priority (High, Medium, Low)
            
            Output strictly in JSON format.
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def analyze_prd(self, prd_content: str, session_id: str) -> Dict[str, Any]:
        prompt = f"Analyze the following PRD and extract user stories: {prd_content}"
        from app.utils.adk_helper import collect_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Attempt to parse JSON from response
        try:
            text = str(response)
            # Simple cleanup if markdown code blocks are present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except Exception:
            return {"raw_output": str(response), "error": "Failed to parse JSON"}
