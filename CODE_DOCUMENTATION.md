# SparkToShip - Code Documentation

## Table of Contents
1. [Backend Code Documentation](#backend-code-documentation)
2. [Frontend Code Documentation](#frontend-code-documentation)
3. [Code Examples](#code-examples)
4. [API Usage Examples](#api-usage-examples)

---

## Backend Code Documentation

### Core Module

#### `backend/app/core/config.py`

**Purpose**: Application configuration and environment variable management.

**Key Components**:
- `Settings`: Pydantic settings class for environment variables
- `get_settings()`: Cached settings retrieval function

**Code**:
```python
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Attributes:
        GOOGLE_API_KEY (str): Google Gemini API key
        MODEL_NAME (str): Default Gemini model name
        PROJECT_NAME (str): Application name
    """
    GOOGLE_API_KEY: str
    MODEL_NAME: str = "gemini-2.0-flash-exp"
    PROJECT_NAME: str = "SparkToShip AI"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    """
    Get cached settings instance.
    
    Returns:
        Settings: Application settings
    """
    return Settings()

settings = get_settings()
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
```

**Usage**:
```python
from app.core.config import settings

# Access configuration
api_key = settings.GOOGLE_API_KEY
model_name = settings.MODEL_NAME
```

---

#### `backend/app/core/orchestrator.py`

**Purpose**: Central session management and agent coordination.

**Key Components**:
- `ProjectSession`: Session data model
- `Orchestrator`: Session manager and agent dispatcher

**Code**:
```python
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import uuid
from datetime import datetime

class ProjectSession(BaseModel):
    """
    Represents an active project session.
    
    Attributes:
        session_id (str): Unique session identifier
        project_name (str): User-defined project name
        status (str): Current status (initialized, in_progress, completed)
        created_at (datetime): Session creation timestamp
        artifacts (Dict[str, str]): Map of artifact names to file paths
        current_phase (str): Current workflow phase
        logs (List[str]): Activity log entries
    """
    session_id: str
    project_name: str = "Untitled Project"
    status: str = "initialized"
    created_at: datetime = datetime.now()
    artifacts: Dict[str, str] = {}
    current_phase: str = "strategy"
    logs: List[str] = []

    def add_log(self, message: str):
        """Add timestamped log entry."""
        self.logs.append(f"[{datetime.now().isoformat()}] {message}")

class Orchestrator:
    """
    Central coordinator for sessions and agents.
    
    Attributes:
        sessions (Dict[str, ProjectSession]): Active sessions
        agents (Dict[str, Any]): Registered agent instances
    """
    
    def __init__(self):
        self.sessions: Dict[str, ProjectSession] = {}
        self.agents: Dict[str, Any] = {}

    def create_session(self) -> ProjectSession:
        """
        Create a new project session.
        
        Returns:
            ProjectSession: New session instance
        """
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

    def get_or_restore_session(self, session_id: str) -> Optional[ProjectSession]:
        """
        Get session from memory or restore from filesystem.
        
        Args:
            session_id (str): Session identifier
            
        Returns:
            Optional[ProjectSession]: Session if found, None otherwise
        """
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        return self.restore_session(session_id)

    def restore_session(self, session_id: str) -> Optional[ProjectSession]:
        """
        Restore session from filesystem.
        
        Args:
            session_id (str): Session identifier
            
        Returns:
            Optional[ProjectSession]: Restored session or None
        """
        from app.services.project_storage import project_storage
        
        summary = project_storage.get_project_summary(session_id)
        if not summary:
            return None
        
        session = ProjectSession(
            session_id=session_id,
            project_name=summary.get('project_name', 'Restored Project'),
            status='restored',
            created_at=datetime.fromisoformat(
                summary.get('created_at', datetime.now().isoformat())
            )
        )
        
        self.sessions[session_id] = session
        return session

    def register_agent(self, agent_name: str, agent_instance: Any):
        """Register an agent instance."""
        self.agents[agent_name] = agent_instance

# Global instance
orchestrator = Orchestrator()
```

**Usage**:
```python
from app.core.orchestrator import orchestrator

# Create session
session = orchestrator.create_session()

# Get session
session = orchestrator.get_or_restore_session(session_id)

# Register agent
orchestrator.register_agent("idea_generator", idea_gen_agent)
```

---

#### `backend/app/core/model_factory.py`

**Purpose**: Dynamic AI model management with runtime configuration.

**Key Components**:
- `ModelFactory`: Singleton for model instance management
- Dynamic model switching
- API key updates

**Code**:
```python
from google.adk.models import Gemini
from app.core.config import settings
from typing import Optional
import os

class ModelFactory:
    """
    Factory for creating and managing Gemini model instances.
    
    Supports runtime model switching and API key updates.
    """
    
    _instance = None
    _model = None
    _current_model_name = None
    _current_api_key = None

    def __new__(cls):
        """Singleton pattern implementation."""
        if cls._instance is None:
            cls._instance = super(ModelFactory, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._model is None:
            self._current_model_name = settings.MODEL_NAME
            self._current_api_key = settings.GOOGLE_API_KEY
            self._model = Gemini(model=self._current_model_name)

    def get_model(self) -> Gemini:
        """
        Get current Gemini model instance.
        
        Returns:
            Gemini: Model instance
        """
        return self._model

    def update_config(self, api_key: Optional[str] = None, 
                     model_name: Optional[str] = None):
        """
        Update model configuration at runtime.
        
        Args:
            api_key (Optional[str]): New API key
            model_name (Optional[str]): New model name
        """
        if api_key:
            self._current_api_key = api_key
            os.environ["GOOGLE_API_KEY"] = api_key
        
        if model_name:
            self._current_model_name = model_name
        
        # Recreate model instance
        self._model = Gemini(model=self._current_model_name)

    def get_current_config(self) -> dict:
        """
        Get current configuration.
        
        Returns:
            dict: Current model name and API key (masked)
        """
        return {
            "model_name": self._current_model_name,
            "api_key": self._current_api_key[:10] + "..." if self._current_api_key else None
        }

# Global instance
model_factory = ModelFactory()
```

**Usage**:
```python
from app.core.model_factory import model_factory

# Get model
model = model_factory.get_model()

# Update configuration
model_factory.update_config(
    api_key="new_api_key",
    model_name="gemini-2.5-pro"
)
```

---

### Agent Module

#### `backend/app/agents/strategy/idea_generator.py`

**Purpose**: Generate application ideas from keywords.

**Key Components**:
- `IdeaGeneratorAgent`: Agent class
- `generate_ideas()`: Main execution method

**Code**:
```python
from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class IdeaGeneratorAgent:
    """
    Agent for generating application ideas from keywords.
    
    Role: Creative Director
    Model: Gemini Flash (speed-optimized)
    """
    
    def __init__(self):
        """Initialize agent with Gemini model and instructions."""
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="idea_generator",
            model=self.model,
            description="Generates robust application ideas based on keywords.",
            instruction="""
            You are the Idea Generator Agent for SparkToShip AI.
            Your goal is to take vague keywords or problem statements and 
            generate 5 distinct, robust application ideas.
            
            Each idea should include:
            - Title: Catchy, descriptive name
            - One-line pitch: Compelling value proposition
            - Core Features: 3-5 key features
            - Target Audience: Primary user demographic
            - Monetization Strategy: Revenue model
            
            Output strictly in JSON format:
            {
                "ideas": [
                    {
                        "title": "App Name",
                        "pitch": "One-line description",
                        "features": ["Feature 1", "Feature 2", "Feature 3"],
                        "target_audience": "User demographic",
                        "monetization": "Revenue strategy"
                    }
                ]
            }
            """
        )
        self.app = App(name="spark_to_ship", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_ideas(self, keywords: str, session_id: str) -> Dict[str, Any]:
        """
        Generate application ideas from keywords.
        
        Args:
            keywords (str): User-provided keywords
            session_id (str): Project session ID
            
        Returns:
            Dict[str, Any]: Generated ideas in JSON format
        """
        prompt = f"Generate 5 app ideas for the following keywords: {keywords}"
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Create Content object for the prompt
        message = Content(parts=[Part(text=prompt)])
        
        # Run agent asynchronously
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Parse JSON response
        return parse_json_response(response)
```

**Usage**:
```python
from app.agents.strategy.idea_generator import IdeaGeneratorAgent

agent = IdeaGeneratorAgent()
result = await agent.generate_ideas(
    keywords="task management app for teams",
    session_id="session-123"
)
```

---

#### `backend/app/agents/engineering/backend_dev.py`

**Purpose**: Generate backend code (FastAPI).

**Key Components**:
- `BackendDevAgent`: Backend development agent
- `write_code()`: Code generation method

**Code Structure**:
```python
class BackendDevAgent:
    """
    Agent for generating FastAPI backend code.
    
    Role: Senior Python Engineer
    Model: Gemini Flash
    
    Capabilities:
    - FastAPI route implementation
    - Pydantic model creation
    - Database integration
    - Error handling
    - Type hints
    """
    
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="backend_dev",
            model=self.model,
            description="Writes production-ready FastAPI backend code.",
            instruction="""
            You are the Backend Developer Agent for SparkToShip AI.
            
            Your responsibilities:
            1. Implement FastAPI routes and endpoints
            2. Create Pydantic models for validation
            3. Write clean, type-hinted Python code
            4. Follow RESTful API design principles
            5. Implement proper error handling
            
            Code requirements:
            - Use Python 3.10+ features
            - Include comprehensive docstrings
            - Follow PEP 8 style guide
            - Use async/await for I/O operations
            - Implement proper logging
            
            Output format:
            {
                "files": {
                    "path/to/file.py": "file content"
                },
                "summary": "Brief description of changes"
            }
            """
        )
        self.app = App(name="spark_to_ship", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def write_code(self, task: Dict[str, Any], 
                        context: Dict[str, Any], 
                        session_id: str) -> Dict[str, Any]:
        """
        Generate backend code for a task.
        
        Args:
            task (Dict[str, Any]): Task specification
            context (Dict[str, Any]): Project context (architecture, existing code)
            session_id (str): Project session ID
            
        Returns:
            Dict[str, Any]: Generated code files and summary
        """
        prompt = f"""
        Task: {task.get('title')}
        Description: {task.get('description')}
        
        Context:
        - Architecture: {json.dumps(context.get('architecture', {}), indent=2)}
        - Existing Code: {json.dumps(context.get('existing_code', {}), indent=2)}
        
        Generate the necessary backend code files.
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)
```

---

### Service Module

#### `backend/app/services/project_storage.py`

**Purpose**: File-based project persistence.

**Key Components**:
- `ProjectStorage`: Storage manager
- File operations for artifacts

**Code Structure**:
```python
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

class ProjectStorage:
    """
    File-based storage for project artifacts.
    
    Storage structure:
    data/
    └── {session_id}/
        ├── metadata.json
        ├── prd.json
        ├── architecture.json
        └── ...
    """
    
    def __init__(self, base_path: str = "data"):
        """
        Initialize storage manager.
        
        Args:
            base_path (str): Base directory for project storage
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def get_project_path(self, session_id: str) -> Path:
        """Get project directory path."""
        return self.base_path / session_id

    def save_artifact(self, session_id: str, artifact_name: str, 
                     content: str) -> bool:
        """
        Save project artifact.
        
        Args:
            session_id (str): Project session ID
            artifact_name (str): Artifact filename
            content (str): Artifact content
            
        Returns:
            bool: Success status
        """
        project_path = self.get_project_path(session_id)
        project_path.mkdir(exist_ok=True)
        
        file_path = project_path / artifact_name
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error saving artifact: {e}")
            return False

    def load_artifact(self, session_id: str, 
                     artifact_name: str) -> Optional[str]:
        """
        Load project artifact.
        
        Args:
            session_id (str): Project session ID
            artifact_name (str): Artifact filename
            
        Returns:
            Optional[str]: Artifact content or None
        """
        file_path = self.get_project_path(session_id) / artifact_name
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error loading artifact: {e}")
            return None

    def get_project_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get project metadata summary.
        
        Args:
            session_id (str): Project session ID
            
        Returns:
            Optional[Dict[str, Any]]: Project metadata or None
        """
        metadata = self.load_artifact(session_id, "metadata.json")
        if metadata:
            return json.loads(metadata)
        return None

    def list_projects(self) -> List[Dict[str, Any]]:
        """
        List all projects.
        
        Returns:
            List[Dict[str, Any]]: List of project summaries
        """
        projects = []
        
        for project_dir in self.base_path.iterdir():
            if project_dir.is_dir():
                summary = self.get_project_summary(project_dir.name)
                if summary:
                    projects.append(summary)
        
        return sorted(projects, key=lambda x: x.get('created_at', ''), reverse=True)

# Global instance
project_storage = ProjectStorage()
```

---

### Utility Module

#### `backend/app/utils/adk_helper.py`

**Purpose**: ADK response handling and JSON parsing.

**Key Components**:
- `collect_response()`: Stream response collection
- `parse_json_response()`: Robust JSON parsing

**Code**:
```python
import json
import re
from typing import Dict, Any, AsyncGenerator

async def collect_response(response_stream: AsyncGenerator) -> str:
    """
    Collect streamed response from ADK runner.
    
    Args:
        response_stream (AsyncGenerator): ADK response stream
        
    Returns:
        str: Complete response text
    """
    full_response = ""
    
    async for event in response_stream:
        if hasattr(event, 'content'):
            if hasattr(event.content, 'parts'):
                for part in event.content.parts:
                    if hasattr(part, 'text'):
                        full_response += part.text
    
    return full_response

def parse_json_response(response: str) -> Dict[str, Any]:
    """
    Parse JSON from agent response, handling various formats.
    
    Handles:
    - Markdown code blocks (```json ... ```)
    - Malformed JSON
    - Non-JSON responses
    
    Args:
        response (str): Raw agent response
        
    Returns:
        Dict[str, Any]: Parsed JSON or error dict
    """
    # Remove markdown code blocks
    json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
    if json_match:
        response = json_match.group(1)
    
    # Remove any leading/trailing whitespace
    response = response.strip()
    
    try:
        return json.loads(response)
    except json.JSONDecodeError as e:
        # Try to extract JSON object
        json_obj_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_obj_match:
            try:
                return json.loads(json_obj_match.group(0))
            except:
                pass
        
        # Return error
        return {
            "error": "Failed to parse JSON",
            "raw_response": response,
            "parse_error": str(e)
        }
```

---

## Frontend Code Documentation

### Component Documentation

#### `frontend/src/pages/MissionControl.tsx`

**Purpose**: Main workflow page for project development.

**Key Components**:
- Workflow step management
- Agent execution
- Artifact display

**Code Structure**:
```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProjectState {
  sessionId: string | null;
  projectName: string;
  currentStep: number;
  ideas: any[];
  selectedIdea: any;
  prd: any;
  architecture: any;
  sprintPlan: any;
  systemLogs: string[];
}

const MissionControl: React.FC = () => {
  const [state, setState] = useState<ProjectState>({
    sessionId: null,
    projectName: '',
    currentStep: 0,
    ideas: [],
    selectedIdea: null,
    prd: null,
    architecture: null,
    sprintPlan: null,
    systemLogs: []
  });

  const [loading, setLoading] = useState(false);

  /**
   * Create new project session
   */
  const createSession = async () => {
    try {
      const response = await axios.post('http://localhost:8000/session/start', {
        project_name: state.projectName
      });
      
      setState(prev => ({
        ...prev,
        sessionId: response.data.session_id
      }));
      
      addLog('Session created successfully');
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  /**
   * Generate ideas from keywords
   */
  const generateIdeas = async (keywords: string) => {
    if (!state.sessionId) return;
    
    setLoading(true);
    addLog('Generating ideas...');
    
    try {
      const response = await axios.post(
        `http://localhost:8000/agents/idea-generator/${state.sessionId}`,
        { keywords }
      );
      
      setState(prev => ({
        ...prev,
        ideas: response.data.ideas,
        currentStep: 1
      }));
      
      addLog('Ideas generated successfully');
    } catch (error) {
      console.error('Error generating ideas:', error);
      addLog('Error generating ideas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add log entry
   */
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setState(prev => ({
      ...prev,
      systemLogs: [...prev.systemLogs, `[${timestamp}] ${message}`]
    }));
  };

  return (
    <div className="mission-control">
      {/* Workflow steps */}
      {/* Agent execution buttons */}
      {/* Artifact display */}
      {/* System logs */}
    </div>
  );
};

export default MissionControl;
```

---

#### `frontend/src/components/ArchitectureViewer.tsx`

**Purpose**: Render Mermaid diagrams for system architecture.

**Key Features**:
- Mermaid.js integration
- Fullscreen zoom
- Copy to clipboard
- Light/dark mode support

**Code Structure**:
```typescript
import React, { useState } from 'react';
import Mermaid from 'react-mermaid2';
import { Copy, Maximize2, Minimize2 } from 'lucide-react';

interface ArchitectureViewerProps {
  architecture: {
    system_architecture?: string;
    sequence_diagrams?: Array<{
      name: string;
      diagram: string;
    }>;
    database_schema?: string;
  };
}

const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ architecture }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<string>('system');

  /**
   * Copy Mermaid code to clipboard
   */
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show toast notification
  };

  /**
   * Mermaid configuration for consistent styling
   */
  const mermaidConfig = {
    theme: 'default',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#2563eb',
      lineColor: '#6b7280',
      secondaryColor: '#10b981',
      tertiaryColor: '#f59e0b',
      background: '#ffffff',
      mainBkg: '#f3f4f6',
      secondBkg: '#e5e7eb',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    flowchart: {
      curve: 'basis',
      padding: 20
    },
    sequence: {
      actorMargin: 50,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35
    }
  };

  return (
    <div className={`architecture-viewer ${fullscreen ? 'fullscreen' : ''}`}>
      {/* Diagram tabs */}
      <div className="diagram-tabs">
        <button onClick={() => setSelectedDiagram('system')}>
          System Architecture
        </button>
        <button onClick={() => setSelectedDiagram('sequence')}>
          Sequence Diagrams
        </button>
        <button onClick={() => setSelectedDiagram('database')}>
          Database Schema
        </button>
      </div>

      {/* Diagram display */}
      <div className="diagram-container">
        {selectedDiagram === 'system' && architecture.system_architecture && (
          <div>
            <div className="diagram-actions">
              <button onClick={() => copyToClipboard(architecture.system_architecture!)}>
                <Copy size={16} /> Copy Code
              </button>
              <button onClick={() => setFullscreen(!fullscreen)}>
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            <Mermaid 
              chart={architecture.system_architecture} 
              config={mermaidConfig}
            />
          </div>
        )}

        {/* Similar for sequence diagrams and database schema */}
      </div>
    </div>
  );
};

export default ArchitectureViewer;
```

---

## Code Examples

### Example 1: Creating a New Agent

```python
# backend/app/agents/custom/my_agent.py

from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any

class MyCustomAgent:
    """
    Custom agent for specific task.
    
    Role: [Your Role]
    Model: Gemini Flash/Pro
    """
    
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="my_custom_agent",
            model=self.model,
            description="Brief description of agent purpose",
            instruction="""
            You are the [Agent Name] for SparkToShip AI.
            
            Your task: [Specific task description]
            
            Input format: [Expected input structure]
            
            Output format: [Required output structure]
            
            Example:
            {
                "result": "value"
            }
            """
        )
        self.app = App(name="spark_to_ship", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def execute_task(self, input_data: Dict[str, Any], 
                          session_id: str) -> Dict[str, Any]:
        """
        Execute the agent's task.
        
        Args:
            input_data: Task input
            session_id: Project session ID
            
        Returns:
            Task result
        """
        prompt = f"Process this: {input_data}"
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)
```

### Example 2: Creating a Frontend Component

```typescript
// frontend/src/components/MyComponent.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MyComponentProps {
  sessionId: string;
  onComplete?: (result: any) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ sessionId, onComplete }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `http://localhost:8000/your-endpoint/${sessionId}`
      );
      setData(response.data);
      onComplete?.(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="my-component">
      <h2>My Component</h2>
      {/* Render your data */}
    </div>
  );
};

export default MyComponent;
```

---

## API Usage Examples

### Example 1: Complete Workflow

```python
import asyncio
import httpx

async def complete_workflow():
    """Example of complete project workflow."""
    
    base_url = "http://localhost:8000"
    
    # 1. Create session
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{base_url}/session/start", json={
            "project_name": "My Awesome App"
        })
        session_id = response.json()["session_id"]
        print(f"Session created: {session_id}")
        
        # 2. Generate ideas
        response = await client.post(
            f"{base_url}/agents/idea-generator/{session_id}",
            json={"keywords": "task management app"}
        )
        ideas = response.json()["ideas"]
        print(f"Generated {len(ideas)} ideas")
        
        # 3. Generate PRD
        response = await client.post(
            f"{base_url}/agents/product-requirements/{session_id}",
            json={"idea_context": ideas[0]}
        )
        prd = response.json()["prd"]
        print("PRD generated")
        
        # 4. Design architecture
        response = await client.post(
            f"{base_url}/agents/software-architect/{session_id}",
            json={"requirements": prd}
        )
        architecture = response.json()["architecture"]
        print("Architecture designed")
        
        # 5. Create sprint plan
        response = await client.post(
            f"{base_url}/agents/engineering-manager/{session_id}",
            json={
                "user_stories": prd["user_stories"],
                "architecture": architecture
            }
        )
        sprint_plan = response.json()["sprint_plan"]
        print(f"Sprint plan created with {len(sprint_plan['tasks'])} tasks")

asyncio.run(complete_workflow())
```

### Example 2: Frontend Integration

```typescript
// Complete workflow in React

const runCompleteWorkflow = async () => {
  const API_BASE = 'http://localhost:8000';
  
  try {
    // 1. Create session
    const sessionRes = await axios.post(`${API_BASE}/session/start`, {
      project_name: 'My App'
    });
    const sessionId = sessionRes.data.session_id;
    
    // 2. Generate ideas
    const ideasRes = await axios.post(
      `${API_BASE}/agents/idea-generator/${sessionId}`,
      { keywords: 'task management' }
    );
    const ideas = ideasRes.data.ideas;
    
    // 3. Generate PRD
    const prdRes = await axios.post(
      `${API_BASE}/agents/product-requirements/${sessionId}`,
      { idea_context: ideas[0] }
    );
    const prd = prdRes.data.prd;
    
    // 4. Design architecture
    const archRes = await axios.post(
      `${API_BASE}/agents/software-architect/${sessionId}`,
      { requirements: prd }
    );
    const architecture = archRes.data.architecture;
    
    console.log('Workflow complete!');
    
  } catch (error) {
    console.error('Workflow error:', error);
  }
};
```

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
