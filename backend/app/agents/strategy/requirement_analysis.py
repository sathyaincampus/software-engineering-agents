from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json
import os

class RequirementAnalysisAgent:
    def __init__(self):
        self.name = "requirement_analysis"
        self.description = "Analyzes PRD and extracts user stories."
        self.instruction = """
            You are the Requirement Analysis Agent for SparkToShip AI.
            Your goal is to analyze the PRD and break it down into technical user stories.
            Each user story should have:
            - Title
            - Description
            - Acceptance Criteria
            - Priority (High, Medium, Low)
            
            Output strictly in JSON format.
            """
        self._runner = None
        self._current_api_key = None

    async def analyze_prd(self, prd_content: str, session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Analyze the following PRD and extract user stories: {prd_content}"
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
        # Attempt to parse JSON from response
        # Use robust JSON parsing
        return parse_json_response(response)
