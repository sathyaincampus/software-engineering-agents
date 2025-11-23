from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class BackendDevAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="backend_dev",
            model=self.model,
            description="Writes backend code.",
            instruction="""
            You are the Backend Developer for ZeroToOne AI.
            Your goal is to write clean, efficient, and scalable backend code (Python/FastAPI).
            
            Output strictly in JSON format with keys: "files" (list of {path, content}).
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def write_code(self, task: Dict[str, Any], context: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"""
        Write code for the following task:
        {json.dumps(task, indent=2)}
        
        Context (Architecture/Stack):
        {json.dumps(context, indent=2)}
        """
        from app.utils.adk_helper import collect_response
        
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
