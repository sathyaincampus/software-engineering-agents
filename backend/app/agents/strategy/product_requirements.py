from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any
import os

class ProductRequirementsAgent:
    def __init__(self):
        self.name = "product_requirements"
        self.description = "Generates detailed PRDs."
        self.instruction = """
            You are the Product Requirements Agent (PM) for SparkToShip AI.
            Your goal is to generate a detailed Product Requirement Document (PRD) based on a selected idea.
            The PRD must include:
            - Executive Summary
            - User Personas
            - Functional Requirements (Must Have, Should Have, Could Have)
            - Non-Functional Requirements
            - User Flow / Journey
            
            Output strictly in Markdown format.
            """
        self._runner = None
        self._current_api_key = None

    async def generate_prd(self, idea_context: Dict[str, Any], session_id: str, model_config: ModelConfig) -> str:
        prompt = f"Generate a PRD for the following idea context: {idea_context}"
        from app.utils.adk_helper import collect_response, extract_markdown_from_codeblocks
        
        # Create or update runner with user's API key and model
        if self._runner is None or self._current_api_key != model_config.api_key:
            # Set API key for this request
            os.environ["GOOGLE_API_KEY"] = model_config.api_key
            
            # Create ADK model with user's selected model
            model = Gemini(
                model=model_config.model_name,
                temperature=model_config.temperature
            )
            
            # Create ADK Agent
            agent = Agent(
                name=self.name,
                model=model,
                description=self.description,
                instruction=self.instruction
            )
            
            # Create ADK App
            app = App(name="spark_to_ship", root_agent=agent)
            
            # Create ADK Runner with session service
            self._runner = Runner(app=app, session_service=session_service)
            self._current_api_key = model_config.api_key
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self._runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Strip markdown code blocks if present
        clean_response = extract_markdown_from_codeblocks(response)
        return clean_response
