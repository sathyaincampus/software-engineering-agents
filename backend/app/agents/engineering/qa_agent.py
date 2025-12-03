from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json
import os

class QAAgent:
    def __init__(self):
        self.name = "qa_agent"
        self.description = "Reviews code and suggests fixes."
        self.instruction = """
            You are the QA Agent for SparkToShip AI.
            Your goal is to review code for bugs, security issues, and style violations.
            
            Output strictly in JSON format.
            """
        self._runner = None
        self._current_api_key = None

    async def review_code(self, code_files: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Review the following code files: {json.dumps(code_files)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        from app.utils.security import validate_api_key
        
        # Validate API key BEFORE using it
        is_valid, error_msg = validate_api_key(model_config.api_key)
        if not is_valid:
            raise ValueError(error_msg)
        
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

