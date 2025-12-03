from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.services import session_service
from app.core.model_config import ModelConfig
from typing import Dict, Any, List
import json
import os

class E2ETestAgent:
    def __init__(self):
        self.name = "e2e_test_agent"
        self.description = "Creates and runs end-to-end integration tests."
        self.instruction = """
            You are the E2E Testing Agent for SparkToShip AI.
            Your goal is to create comprehensive end-to-end integration tests based on:
            - User stories
            - Architecture
            - Generated code (backend + frontend)
            
            You should:
            1. Analyze user stories to understand expected behavior
            2. Review architecture to understand system components
            3. Create test scenarios covering critical user flows
            4. Generate test cases with:
               - Test ID
               - Test name
               - Description
               - Steps to execute
               - Expected results
               - Priority (Critical/High/Medium/Low)
               - Test type (API/UI/Integration)
            5. Identify edge cases and error scenarios
            
            Output strictly in JSON format with the following structure:
            {
                "test_suites": [
                    {
                        "suite_name": "User Authentication Flow",
                        "description": "Tests for user signup, login, and profile management",
                        "test_cases": [
                            {
                                "test_id": "E2E-001",
                                "name": "User can sign up with email and password",
                                "description": "Verify that a new user can successfully create an account",
                                "priority": "Critical",
                                "type": "Integration",
                                "steps": [
                                    "Navigate to signup page",
                                    "Enter valid email and password",
                                    "Click signup button",
                                    "Verify user is redirected to dashboard"
                                ],
                                "expected_result": "User account is created and user is logged in",
                                "test_data": {
                                    "email": "test@example.com",
                                    "password": "SecurePass123!"
                                },
                                "dependencies": [],
                                "estimated_time": "2 minutes"
                            }
                        ]
                    }
                ],
                "coverage_summary": {
                    "total_test_cases": 25,
                    "critical_tests": 8,
                    "high_priority_tests": 10,
                    "medium_priority_tests": 5,
                    "low_priority_tests": 2,
                    "api_tests": 12,
                    "ui_tests": 8,
                    "integration_tests": 5
                },
                "test_execution_plan": {
                    "smoke_tests": ["E2E-001", "E2E-002"],
                    "regression_tests": ["E2E-001", "E2E-003", "E2E-005"],
                    "estimated_total_time": "45 minutes"
                }
            }
            """
        self._runner = None
        self._current_api_key = None

    async def generate_test_plan(
        self, 
        user_stories: List[Dict[str, Any]], 
        architecture: Dict[str, Any],
        backend_code: Dict[str, Any],
        frontend_code: Dict[str, Any],
        session_id: str,
        model_config: ModelConfig
    ) -> Dict[str, Any]:
        """
        Generate comprehensive E2E test plan based on user stories, architecture, and code.
        """
        prompt = f"""
        Generate a comprehensive End-to-End test plan for the following application:
        
        User Stories:
        {json.dumps(user_stories, indent=2)}
        
        Architecture:
        {json.dumps(architecture, indent=2)}
        
        Backend Code Summary:
        {json.dumps(backend_code.get('summary', 'No backend code available'), indent=2)}
        
        Frontend Code Summary:
        {json.dumps(frontend_code.get('summary', 'No frontend code available'), indent=2)}
        
        Create test suites covering:
        1. Critical user flows (authentication, core features)
        2. API integration tests
        3. UI/UX tests
        4. Error handling and edge cases
        5. Performance and security tests
        
        Ensure tests are:
        - Comprehensive (cover all user stories)
        - Prioritized (Critical > High > Medium > Low)
        - Executable (clear steps and expected results)
        - Maintainable (well-documented)
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
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

    async def execute_tests(
        self,
        test_plan: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Simulate test execution and return results.
        In a real implementation, this would actually run the tests.
        """
        # For now, return a mock execution result
        # In production, this would integrate with Playwright, Cypress, or similar
        return {
            "execution_status": "completed",
            "total_tests": test_plan.get("coverage_summary", {}).get("total_test_cases", 0),
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "execution_time": "0 minutes",
            "test_results": [],
            "message": "Test execution not yet implemented. This agent generates test plans only."
        }
