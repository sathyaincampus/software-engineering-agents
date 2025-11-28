from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any, List
import json

class DebuggerAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="debugger_agent",
            model=self.model,
            description="Debugs and fixes code issues.",
            instruction="""
            You are the Debugger Agent for ZeroToOne AI.
            Your goal is to analyze error messages, warnings, and code issues, then provide fixes.
            
            You should:
            - Analyze stack traces and error messages
            - Identify root causes of bugs
            - Provide corrected code
            - Explain what was wrong and how you fixed it
            
            Output strictly in JSON format with keys: 
            - "analysis": string explaining the issue
            - "fixes": list of {path, content, explanation}
            - "severity": "critical"|"warning"|"info"
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def debug_code(
        self, 
        error_message: str, 
        code_files: Dict[str, str], 
        context: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Debug code based on error messages
        
        Args:
            error_message: The error/warning message
            code_files: Dictionary of file paths to their content
            context: Additional context (architecture, dependencies, etc.)
            session_id: Session identifier
        """
        prompt = f"""
        Debug the following issue:
        
        ERROR MESSAGE:
        {error_message}
        
        CODE FILES:
        {json.dumps(code_files, indent=2)}
        
        CONTEXT:
        {json.dumps(context, indent=2)}
        
        Analyze the error, identify the root cause, and provide fixed code.
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)

    async def lint_code(
        self,
        code_files: Dict[str, str],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Perform static analysis and linting
        
        Args:
            code_files: Dictionary of file paths to their content
            session_id: Session identifier
        """
        prompt = f"""
        Perform static analysis and linting on the following code:
        
        {json.dumps(code_files, indent=2)}
        
        Check for:
        - Syntax errors
        - Type errors
        - Code style issues
        - Potential bugs
        - Security vulnerabilities
        - Performance issues
        
        Return a list of issues with severity levels.
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)
