from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any, List
import json
import os

class EngineeringManagerAgent:
    def __init__(self):
        self.name = "engineering_manager"
        self.description = "Creates sprint plans and assigns tasks."
        self.instruction = """
            You are the Engineering Manager for SparkToShip AI.
            Your goal is to create a sprint plan based on user stories and architecture.
            You should:
            - Break down stories into technical tasks
            - Assign tasks to Backend or Frontend agents
            - Estimate effort
            
            Output strictly in JSON format.
            """
        self._runner = None
        self._current_api_key = None

    async def create_sprint_plan(self, user_stories: list, architecture: Dict[str, Any], session_id: str, model_config: ModelConfig) -> Dict[str, Any]:
        prompt = f"""
        Create a Sprint Plan.
        User Stories: {json.dumps(user_stories)}
        Architecture: {json.dumps(architecture)}
        
        You MUST include the following mandatory tasks in the sprint plan:
        1. "Project Documentation": Create README.md, IMPLEMENTATION_GUIDE.md, and HOW_TO_RUN.md. Assign to Backend.
        2. "UI Visualizations": Create UI_SCREENSHOTS.html (a static HTML file simulating screenshots of key views). Assign to Frontend.
        
        Output strictly in JSON format with the following structure:
        {{
            "sprint_plan": [
                {{
                    "task_id": "TASK-001",
                    "title": "Task Title",
                    "description": "Task Description",
                    "assignee": "Frontend|Backend|DevOps",
                    "story_id": "STORY-001",
                    "effort": "High|Medium|Low"
                }}
            ]
        }}
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
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

