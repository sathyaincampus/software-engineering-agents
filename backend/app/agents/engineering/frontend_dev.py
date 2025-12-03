from google.genai.types import Content, Part
from app.core.base_agent import BaseAgent
from app.core.model_config import ModelConfig
from typing import Dict, Any
import json

class FrontendDevAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="frontend_dev",
            description="Writes frontend code.",
            instruction="""
            You are the Frontend Developer for SparkToShip AI.
            Your goal is to write clean, responsive, and modern frontend code (React/Tailwind) and create UI visualizations/mockups.
            
            Output strictly in JSON format with keys: "files" (list of {path, content}).
            """
        )

    async def write_code(self, task: Dict[str, Any], context: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"""
        Write code for the following task:
        {json.dumps(task, indent=2)}
        
        Context (Architecture/Stack):
        {json.dumps(context, indent=2)}
        """
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
