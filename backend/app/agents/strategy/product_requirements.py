from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any

class ProductRequirementsAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="product_requirements",
            model=self.model,
            description="Generates detailed PRDs.",
            instruction="""
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
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_prd(self, idea_context: Dict[str, Any], session_id: str) -> str:
        prompt = f"Generate a PRD for the following idea context: {idea_context}"
        from app.utils.adk_helper import collect_response, extract_markdown_from_codeblocks
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Strip markdown code blocks if present
        clean_response = extract_markdown_from_codeblocks(response)
        return clean_response
