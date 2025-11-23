from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class IdeaGeneratorAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="idea_generator",
            model=self.model,
            description="Generates robust application ideas based on keywords.",
            instruction="""
            You are the Idea Generator Agent for ZeroToOne AI.
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
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_ideas(self, keywords: str, session_id: str) -> Dict[str, Any]:
        prompt = f"Generate 5 app ideas for the following keywords: {keywords}"
        from app.utils.adk_helper import collect_response
        
        # Create Content object for the prompt
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        try:
            text = str(response)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except Exception as e:
            return {"raw_output": str(response), "error": f"Failed to parse JSON: {str(e)}"}
