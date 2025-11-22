from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class IdeaGeneratorAgent:
    def __init__(self):
        self.model = Gemini(
            model=settings.MODEL_NAME,
            # api_key=settings.GOOGLE_API_KEY # ADK might pick this up from env automatically, but let's be safe if needed
        )
        
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

    async def generate_ideas(self, keywords: str) -> Dict[str, Any]:
        prompt = f"Generate 5 app ideas for the following keywords: {keywords}"
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
