from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json
import os

class IdeaGeneratorAgent:
    def __init__(self):
        self.name = "idea_generator"
        self.description = "Generates robust application ideas based on keywords."
        self.instruction = """
            You are the Idea Generator Agent for SparkToShip AI.
            Your goal is to take vague keywords or problem statements and generate 5 distinct, robust application ideas.
            
            IMPORTANT: You must return ONLY valid JSON in the exact format below. Do not wrap it in markdown code blocks.
            
            Return a JSON object with this EXACT structure (use lowercase keys):
            {
              "app_ideas": [
                {
                  "title": "App Name",
                  "pitch": "One-line pitch describing the app",
                  "core_features": [
                    "Feature 1",
                    "Feature 2",
                    "Feature 3"
                  ],
                  "target_audience": "Description of target users",
                  "monetization_strategy": "How the app will make money"
                }
              ]
            }
            
            Generate exactly 5 app ideas following this structure.
            """
        self._runner = None
        self._current_api_key = None

    async def generate_ideas(self, keywords: str, session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Generate 5 app ideas for the following keywords: {keywords}"
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
        
        # Create Content object for the prompt
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self._runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Use robust JSON parsing
        return parse_json_response(response)


