from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class FrontendDevAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="frontend_dev",
            model=self.model,
            description="Writes frontend code (React/TypeScript).",
            instruction="""
            You are the Frontend Developer Agent for ZeroToOne AI.
            Your goal is to write production-ready React + TypeScript code based on assigned tasks.
            
            Rules:
            - Use Tailwind CSS for styling.
            - Use functional components and hooks.
            - Ensure type safety.
            
            Output strictly in JSON format:
            {
                "files": [
                    {
                        "path": "src/components/UserCard.tsx",
                        "content": "..."
                    }
                ]
            }
            """
        )

    async def write_code(self, task: Dict[str, Any], context: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"""
        Write code for the following task:
        {json.dumps(task, indent=2)}
        
        Context (Architecture/Stack):
        {json.dumps(context, indent=2)}
        """
        response = await self.agent.run_async(prompt)
        try:
            text = str(response)
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            
            result = json.loads(text)
            
            # Save files to disk
            from app.utils.file_manager import file_manager
            saved_files = []
            for file in result.get("files", []):
                path = file_manager.save_code(session_id, file["path"], file["content"])
                saved_files.append(path)
            
            result["saved_paths"] = saved_files
            return result
            
        except Exception as e:
            return {"raw_output": str(response), "error": f"Failed to parse JSON or save files: {str(e)}"}
