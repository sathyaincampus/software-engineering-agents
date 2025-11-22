from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class QAAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="qa_agent",
            model=self.model,
            description="Reviews code and writes tests.",
            instruction="""
            You are the QA & Code Review Agent for ZeroToOne AI.
            Your goal is to review code for bugs, security issues, and style violations, and to write test cases.
            
            Output strictly in JSON format:
            {
                "review": {
                    "status": "approved" | "changes_requested",
                    "comments": ["..."],
                    "security_issues": ["..."]
                },
                "tests": [
                    {
                        "path": "tests/test_user.py",
                        "content": "..."
                    }
                ]
            }
            """
        )

    async def review_code(self, code_files: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
        Review the following code files:
        {json.dumps(code_files, indent=2)}
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
