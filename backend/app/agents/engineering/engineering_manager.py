from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any, List
import json

class EngineeringManagerAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="engineering_manager",
            model=self.model,
            description="Manages the engineering team and assigns tasks.",
            instruction="""
            You are the Engineering Manager Agent for ZeroToOne AI.
            Your goal is to take User Stories and Architecture designs and create a detailed Sprint Plan.
            
            You must:
            1. Analyze the User Stories and Architecture.
            2. Break them down into specific coding tasks for Backend and Frontend developers.
            3. Assign each task to either 'backend_dev' or 'frontend_dev'.
            4. Estimate effort for each task.
            
            Output strictly in JSON format:
            {
                "sprint_plan": [
                    {
                        "task_id": "T-001",
                        "story_id": "US-001",
                        "title": "Implement User Model",
                        "description": "Create Pydantic models and DB schema for User.",
                        "assignee": "backend_dev",
                        "effort_hours": 2
                    }
                ]
            }
            """
        )

    async def create_sprint_plan(self, user_stories: List[Dict[str, Any]], architecture: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
        Create a sprint plan based on the following:
        
        User Stories:
        {json.dumps(user_stories, indent=2)}
        
        Architecture:
        {json.dumps(architecture, indent=2)}
        """
        response = await self.agent.run_async(prompt)
        try:
            text = str(response)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except Exception:
            return {"raw_output": str(response), "error": "Failed to parse JSON"}
