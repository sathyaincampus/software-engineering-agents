from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class RequirementAnalysisAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="requirement_analysis",
            model=self.model,
            description="Breaks PRD into User Stories.",
            instruction="""
            You are the Requirement Analysis Agent (BA) for ZeroToOne AI.
            Your goal is to break down a PRD into atomic User Stories (Jira style).
            
            Output strictly in JSON format:
            {
                "stories": [
                    {"id": "US-001", "title": "...", "description": "...", "acceptance_criteria": ["..."], "priority": "High"}
                ]
            }
            """
        )

    async def analyze_prd(self, prd_content: str) -> Dict[str, Any]:
        prompt = f"Analyze the following PRD and generate User Stories:\n\n{prd_content}"
        response = await self.agent.run_async(prompt)
        # Attempt to parse JSON from response
        try:
            # This assumes response is a string or has a text attribute
            text = str(response)
            # Simple cleanup if markdown code blocks are present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return json.loads(text)
        except Exception:
            return {"raw_output": str(response), "error": "Failed to parse JSON"}
