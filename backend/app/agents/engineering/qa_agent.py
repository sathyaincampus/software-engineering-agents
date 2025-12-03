from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json

class QAAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="qa_agent",
            description="Reviews code and suggests fixes.",
            instruction="""
            You are the QA Agent for SparkToShip AI.
            Your goal is to review code for bugs, security issues, and style violations.
            
            Output strictly in JSON format.
            """
        )

    async def review_code(self, code_files: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"Review the following code files: {json.dumps(code_files)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Get runner with current model configuration
        runner = self._get_or_create_runner(model_config)
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        # Use robust JSON parsing
        return parse_json_response(response)
