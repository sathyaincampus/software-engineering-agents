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
            app_name="spark_to_ship",
            user_id="user",
            session_id=session_id
        )
        
        session = ProjectSession(session_id=session_id)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ProjectSession]:
        # If session exists in memory, return it
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        # Try to restore from filesystem
        restored = self.restore_session(session_id)
        if restored:
            return restored
        
        return None
    
    def restore_session(self, session_id: str) -> Optional[ProjectSession]:
        """Restore a session from filesystem if it exists"""
        from app.services.project_storage import project_storage
        from app.core.services import session_service
        
        # Check if project exists on filesystem
        summary = project_storage.get_project_summary(session_id)
        if not summary:
            return None
        
        # Restore ADK session first
        try:
            session_service.create_session_sync(
                app_name="spark_to_ship",
                user_id="user",
                session_id=session_id
            )
        except Exception as e:
            # Session might already exist, that's okay
            pass
        
        # Create session object
        session = ProjectSession(
            session_id=session_id,
            project_name=summary.get('project_name', 'Restored Project'),
            status='restored',
            created_at=datetime.fromisoformat(summary.get('created_at', datetime.now().isoformat()))
        )
        
        # Add to active sessions
        self.sessions[session_id] = session
        session.add_log(f"Session restored from filesystem")
        
        return session
    
    def get_or_restore_session(self, session_id: str) -> Optional[ProjectSession]:
        """Get session from memory or restore from filesystem"""
        return self.get_session(session_id)

    def register_agent(self, agent_name: str, agent_instance: Any):
        self.agents[agent_name] = agent_instance

    def dispatch_task(self, session_id: str, agent_name: str, task_payload: Dict[str, Any]):
        session = self.get_or_restore_session(session_id)
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
