# Development Roadmap 🗺️

## Phase 1: Core Fixes ✅ COMPLETE

- [x] Fix ADK session management
- [x] Implement Runner + App pattern
- [x] Add error handling & timeouts
- [x] Create Settings UI
- [x] Secure API key handling
- [x] Fix JSON parsing for ideas
- [x] Add gemini-2.0-flash-lite model

## Phase 2: Project Persistence 📁 NEXT

### 2.1 Database Setup
```python
# backend/app/db/models.py
from sqlalchemy import Column, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    session_id = Column(String, primary_key=True)
    project_name = Column(String)
    created_at = Column(DateTime)
    ideas = Column(JSON)
    selected_idea = Column(JSON)
    prd = Column(JSON)
    user_stories = Column(JSON)
    architecture = Column(JSON)
    ui_design = Column(JSON)
    sprint_plan = Column(JSON)
    code_files = Column(JSON)
```

### 2.2 Storage Service
```python
# backend/app/services/project_storage.py
class ProjectStorage:
    def save_step(self, session_id: str, step: str, data: dict):
        """Save a workflow step"""
        pass
    
    def load_project(self, session_id: str) -> Project:
        """Load entire project"""
        pass
    
    def export_code(self, session_id: str) -> bytes:
        """Export code as ZIP"""
        pass
```

### 2.3 File System Storage
```
backend/data/projects/{session_id}/
├── metadata.json
├── ideas.json
├── prd.md
├── architecture.json
└── code/
    ├── backend/
    │   ├── main.py
    │   └── requirements.txt
    └── frontend/
        ├── package.json
        └── src/
```

**Estimated Time**: 2-3 days

---

## Phase 3: ADK Workflows 🔄

### 3.1 Sequential Workflow
```python
from google.adk.workflows import SequentialWorkflow

# Auto-chain: Idea → PRD → Analysis → Architecture
strategy_workflow = SequentialWorkflow(
    name="strategy_phase",
    agents=[
        idea_agent,
        prd_agent,
        analysis_agent,
        architect_agent
    ]
)

# Run entire workflow
result = await strategy_workflow.run(
    user_id="user",
    session_id=session_id,
    initial_input=keywords
)
```

### 3.2 Parallel Workflow
```python
from google.adk.workflows import ParallelWorkflow

# Run Backend + Frontend dev simultaneously
dev_workflow = ParallelWorkflow(
    name="development_phase",
    agents=[
        backend_dev_agent,
        frontend_dev_agent
    ]
)
```

### 3.3 Coordinator Pattern
```python
from google.adk.agents import CoordinatorAgent

coordinator = CoordinatorAgent(
    name="project_coordinator",
    model=Gemini(model="gemini-2.0-flash-exp"),
    sub_agents={
        "strategy": strategy_workflow,
        "development": dev_workflow,
        "qa": qa_agent
    }
)

# Coordinator decides which agents to call
await coordinator.run(user_request)
```

**Estimated Time**: 3-4 days

---

## Phase 4: Visual Agent Graph 📊

### 4.1 Backend: Execution Tracking
```python
# backend/app/services/execution_tracker.py
class ExecutionTracker:
    def log_agent_start(self, agent_name: str, input_data: dict):
        """Track when agent starts"""
        pass
    
    def log_agent_complete(self, agent_name: str, output_data: dict):
        """Track when agent completes"""
        pass
    
    def get_execution_graph(self, session_id: str) -> dict:
        """Get agent execution flow"""
        return {
            "nodes": [
                {"id": "idea_gen", "status": "complete", "duration": 5.2},
                {"id": "prd_gen", "status": "running", "duration": None}
            ],
            "edges": [
                {"from": "idea_gen", "to": "prd_gen"}
            ]
        }
```

### 4.2 Frontend: ReactFlow Integration
```typescript
// frontend/src/components/AgentFlowGraph.tsx
import ReactFlow from 'reactflow';

const AgentFlowGraph = ({ sessionId }: { sessionId: string }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    
    useEffect(() => {
        // Poll for execution updates
        const interval = setInterval(async () => {
            const res = await axios.get(`/execution/${sessionId}`);
            setNodes(res.data.nodes);
            setEdges(res.data.edges);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [sessionId]);
    
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
        />
    );
};
```

**Estimated Time**: 4-5 days

---

## Phase 5: Dynamic Settings ⚙️

### 5.1 Agent Factory Pattern
```python
# backend/app/core/agent_factory.py
class AgentFactory:
    @staticmethod
    def create_agent(
        agent_type: str,
        model_config: ModelConfig
    ) -> BaseAgent:
        """Create agent with specific model config"""
        model = ModelFactory.create_model(
            provider=model_config.provider,
            model_name=model_config.model_name,
            api_key=model_config.api_key
        )
        
        if agent_type == "idea_generator":
            return IdeaGeneratorAgent(model=model)
        # ... other agents
```

### 5.2 Hot Reload Endpoint
```python
@app.post("/agents/reload")
async def reload_agents():
    """Recreate all agents with new settings"""
    global idea_agent, prd_agent, ...
    
    idea_agent = AgentFactory.create_agent(
        "idea_generator",
        app_settings.ai_model_config
    )
    # ... reload other agents
    
    return {"status": "reloaded"}
```

**Estimated Time**: 2 days

---

## Phase 6: Code Export & Refinement 💾

### 6.1 Export Functionality
```python
@app.get("/projects/{session_id}/export")
async def export_project(session_id: str):
    """Export project as ZIP"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        # Add backend files
        zip_file.writestr("backend/main.py", backend_code)
        # Add frontend files
        zip_file.writestr("frontend/App.tsx", frontend_code)
        # Add README
        zip_file.writestr("README.md", readme_content)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=project.zip"}
    )
```

### 6.2 Refinement UI
```typescript
// frontend/src/components/EditableOutput.tsx
const EditableOutput = ({ value, onRegenerate }: Props) => {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(value);
    
    return (
        <div>
            {editing ? (
                <textarea value={content} onChange={e => setContent(e.target.value)} />
            ) : (
                <pre>{content}</pre>
            )}
            <button onClick={() => setEditing(!editing)}>
                {editing ? 'Save' : 'Edit'}
            </button>
            <button onClick={() => onRegenerate(content)}>
                Regenerate
            </button>
        </div>
    );
};
```

**Estimated Time**: 3 days

---

## Phase 7: Advanced Features 🚀

### 7.1 Token Usage Tracking
```python
class TokenTracker:
    def track_request(self, agent: str, tokens: int, cost: float):
        """Track token usage per agent"""
        pass
    
    def get_session_usage(self, session_id: str) -> dict:
        """Get total usage for session"""
        return {
            "total_tokens": 15000,
            "total_cost": 0.045,
            "by_agent": {
                "idea_generator": {"tokens": 3000, "cost": 0.009},
                "prd_agent": {"tokens": 8000, "cost": 0.024}
            }
        }
```

### 7.2 Telemetry Dashboard
```typescript
// frontend/src/pages/Telemetry.tsx
const TelemetryDashboard = () => {
    return (
        <div>
            <TokenUsageChart />
            <AgentPerformanceMetrics />
            <ExecutionTimeline />
            <ErrorRateGraph />
        </div>
    );
};
```

### 7.3 Multi-Provider Support
```python
# Full implementation of Anthropic & OpenAI
class ModelFactory:
    @staticmethod
    def create_model(provider: str, model_name: str, api_key: str):
        if provider == "anthropic":
            return AnthropicModel(model=model_name, api_key=api_key)
        elif provider == "openai":
            return OpenAIModel(model=model_name, api_key=api_key)
        # ...
```

**Estimated Time**: 5-7 days

---

## Implementation Priority

### High Priority (Do First)
1. ✅ Fix JSON parsing
2. ✅ Add missing models
3. 📁 Project persistence
4. 💾 Code export

### Medium Priority
5. 🔄 ADK Workflows
6. ⚙️ Dynamic settings
7. 📊 Visual graph

### Low Priority (Nice to Have)
8. 🚀 Token tracking
9. 📈 Telemetry dashboard
10. 🌐 Multi-provider

---

## Quick Wins (Can Do Now)

### 1. Add Project Download Button
```typescript
// In MissionControl.tsx
<button onClick={() => downloadProject(sessionId)}>
    Download Project
</button>
```

### 2. Add "Copy to Clipboard" for Outputs
```typescript
<button onClick={() => navigator.clipboard.writeText(prd)}>
    Copy PRD
</button>
```

### 3. Add Session Resume
```python
@app.get("/session/{session_id}/resume")
async def resume_session(session_id: str):
    """Resume a previous session"""
    session = orchestrator.get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session
```

---

## Total Estimated Timeline

- **Phase 2 (Persistence)**: 2-3 days
- **Phase 3 (Workflows)**: 3-4 days
- **Phase 4 (Visual Graph)**: 4-5 days
- **Phase 5 (Dynamic Settings)**: 2 days
- **Phase 6 (Export/Refinement)**: 3 days
- **Phase 7 (Advanced)**: 5-7 days

**Total**: ~3-4 weeks for full implementation

---

## Current Status

✅ **Working**: Basic agents, settings, security
⚠️ **Partial**: Model selection (requires restart)
❌ **Missing**: Persistence, workflows, visualization

**Next Immediate Step**: Implement project persistence (Phase 2)
