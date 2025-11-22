from google.adk import Agent
from google.adk.models import Gemini
from app.core.config import settings
from typing import Dict, Any
import json

class BackendDevAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="backend_dev",
            model=self.model,
            description="Writes backend code (Python/FastAPI).",
            instruction="""
            You are the Backend Developer Agent for ZeroToOne AI.
            Your goal is to write production-ready Python code (FastAPI) based on assigned tasks.
            
            Rules:
            - Use Pydantic for data validation.
            - Follow PEP8.
            - Include docstrings.
            - Handle errors gracefully.
            
            Output strictly in JSON format:
            {
                "files": [
                    {
                        "path": "app/models/user.py",
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
