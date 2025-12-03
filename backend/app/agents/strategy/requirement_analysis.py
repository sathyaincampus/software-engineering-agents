from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json

class RequirementAnalysisAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="requirement_analysis",
            description="Analyzes PRD and extracts user stories.",
            instruction="""
            You are the Requirement Analysis Agent for SparkToShip AI.
            Your goal is to analyze the PRD and break it down into technical user stories.
            Each user story should have:
            - Title
            - Description
            - Acceptance Criteria
            - Priority (High, Medium, Low)
            
            Output strictly in JSON format.
            """
        )

    async def analyze_prd(self, prd_content: str, session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Analyze the following PRD and extract user stories: {prd_content}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Get runner with current model configuration
        runner = self._get_or_create_runner(model_config)
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Attempt to parse JSON from response
        # Use robust JSON parsing
        return parse_json_response(response)
