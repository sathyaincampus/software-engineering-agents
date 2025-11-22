from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class SoftwareArchitectAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="software_architect",
            model=self.model,
            description="Designs architecture and stack.",
            instruction="""
            You are the Software Architect Agent for ZeroToOne AI.
            Your goal is to analyze requirements and suggest the optimal technology stack and architecture.
            
            You must output:
            1. Tech Stack Recommendation (Backend, Frontend, Database, Cloud, AI Models)
            2. Mermaid Diagram Code for:
               - Sequence Diagram
               - Data Flow Diagram
               - ER Diagram
            
            Output strictly in JSON format with keys: "stack", "diagrams".
            """
        )

    async def design_architecture(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Design architecture for the following requirements: {requirements}"
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
