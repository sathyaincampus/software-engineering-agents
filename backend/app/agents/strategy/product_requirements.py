from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any

class ProductRequirementsAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="product_requirements",
            model=self.model,
            description="Generates detailed PRDs.",
            instruction="""
            You are the Product Requirements Agent (PM) for ZeroToOne AI.
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

    async def generate_prd(self, idea_context: Dict[str, Any]) -> str:
        prompt = f"Generate a PRD for the following idea context: {idea_context}"
        response = await self.agent.run_async(prompt)
        return str(response)
