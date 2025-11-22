from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class UXDesignerAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="ux_designer",
            model=self.model,
            description="Designs UI wireframes and themes.",
            instruction="""
            You are the UX Designer Agent for ZeroToOne AI.
            Your goal is to generate wireframes and component libraries based on the PRD and User Stories.
            
            Output strictly in JSON format with keys: "wireframes" (HTML/CSS), "theme" (Tailwind config).
            """
        )

    async def design_ui(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Design UI for the following requirements: {requirements}"
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
