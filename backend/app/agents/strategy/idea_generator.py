from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json

class IdeaGeneratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="idea_generator",
            description="Generates robust application ideas based on keywords.",
            instruction="""
            You are the Idea Generator Agent for SparkToShip AI.
            Your goal is to take vague keywords or problem statements and generate 5 distinct, robust application ideas.
            Each idea should include:
            - Title
            - One-line pitch
            - Core Features (3-5 bullets)
            - Target Audience
            - Monetization Strategy
            
            Output strictly in JSON format.
            """
        )

    async def generate_ideas(self, keywords: str, session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Generate 5 app ideas for the following keywords: {keywords}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Get runner with current model configuration
        runner = self._get_or_create_runner(model_config)
        
        # Create Content object for the prompt
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Use robust JSON parsing
        return parse_json_response(response)
