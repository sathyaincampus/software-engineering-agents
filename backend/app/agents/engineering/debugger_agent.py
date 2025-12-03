from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any, List
import json
import os

class DebuggerAgent:
    def __init__(self):
        self.name = "debugger_agent"
        self.description = "Debugs and fixes code issues."
        self.instruction = """
            You are the Debugger Agent for SparkToShip AI.
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
        self._runner = None
        self._current_api_key = None

    async def debug_code(
        self, 
        error_message: str, 
        code_files: Dict[str, str], 
        context: Dict[str, Any],
        session_id: str,
        model_config: ModelConfig
    ) -> Dict[str, Any]:
        """
        Debug code based on error messages
        
        Args:
            error_message: The error/warning message
            code_files: Dictionary of file paths to their content
            context: Additional context (architecture, dependencies, etc.)
            session_id: Session identifier
            model_config: Model configuration with API key
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
        from app.utils.security import validate_api_key
        
        # Validate API key BEFORE using it
        is_valid, error_msg = validate_api_key(model_config.api_key)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Create or update runner with user's API key and model
        if self._runner is None or self._current_api_key != model_config.api_key:
            os.environ["GOOGLE_API_KEY"] = model_config.api_key
            
            model = Gemini(
                model=model_config.model_name,
                temperature=model_config.temperature
            )
            
            agent = Agent(
                name=self.name,
                model=model,
                description=self.description,
                instruction=self.instruction
            )
            
            app = App(name="spark_to_ship", root_agent=agent)
            self._runner = Runner(app=app, session_service=session_service)
            self._current_api_key = model_config.api_key
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self._runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)

    async def lint_code(
        self,
        code_files: Dict[str, str],
        session_id: str,
        model_config: ModelConfig
    ) -> Dict[str, Any]:
        """
        Perform static analysis and linting
        
        Args:
            code_files: Dictionary of file paths to their content
            session_id: Session identifier
            model_config: Model configuration with API key
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
        from app.utils.security import validate_api_key
        
        # Validate API key BEFORE using it
        is_valid, error_msg = validate_api_key(model_config.api_key)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Create or update runner with user's API key and model
        if self._runner is None or self._current_api_key != model_config.api_key:
            os.environ["GOOGLE_API_KEY"] = model_config.api_key
            
            model = Gemini(
                model=model_config.model_name,
                temperature=model_config.temperature
            )
            
            agent = Agent(
                name=self.name,
                model=model,
                description=self.description,
                instruction=self.instruction
            )
            
            app = App(name="spark_to_ship", root_agent=agent)
            self._runner = Runner(app=app, session_service=session_service)
            self._current_api_key = model_config.api_key
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self._runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)
