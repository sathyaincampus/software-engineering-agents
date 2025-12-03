from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any

class ProductRequirementsAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="product_requirements",
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

    async def generate_prd(self, idea_context: Dict[str, Any], session_id: str, model_config: ModelConfig) -> str:
        prompt = f"Generate a PRD for the following idea context: {idea_context}"
        from app.utils.adk_helper import collect_response, extract_markdown_from_codeblocks
        
        # Get runner with current model configuration
        runner = self._get_or_create_runner(model_config)
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Strip markdown code blocks if present
        clean_response = extract_markdown_from_codeblocks(response)
        return clean_response
