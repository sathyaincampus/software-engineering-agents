from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import uuid
from datetime import datetime

class ProjectSession(BaseModel):
    session_id: str
    project_name: str = "Untitled Project"
    status: str = "initialized"
    created_at: datetime = datetime.now()
    artifacts: Dict[str, str] = {} # Map of artifact name to path
    current_phase: str = "strategy"
    logs: List[str] = []

    def add_log(self, message: str):
        self.logs.append(f"[{datetime.now().isoformat()}] {message}")

class Orchestrator:
    def __init__(self):
        self.sessions: Dict[str, ProjectSession] = {}
        self.agents: Dict[str, Any] = {}

    def create_session(self) -> ProjectSession:
        session_id = str(uuid.uuid4())
        
        # Create ADK Session
        from app.core.services import session_service
        session_service.create_session_sync(
            app_name="zero_to_one",
            user_id="user",
            session_id=session_id
        )
        
        session = ProjectSession(session_id=session_id)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ProjectSession]:
        return self.sessions.get(session_id)

    def register_agent(self, agent_name: str, agent_instance: Any):
        self.agents[agent_name] = agent_instance

    def dispatch_task(self, session_id: str, agent_name: str, task_payload: Dict[str, Any]):
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        agent = self.agents.get(agent_name)
        if not agent:
            raise ValueError(f"Agent {agent_name} not found")
            
        session.add_log(f"Dispatching task to {agent_name}")
        # Logic to invoke agent (mock for now)
        return {"status": "dispatched", "agent": agent_name}

# Global Orchestrator Instance
orchestrator = Orchestrator()
