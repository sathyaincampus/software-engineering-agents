# SparkToShip - Comprehensive Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Agent Ecosystem](#agent-ecosystem)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [Configuration](#configuration)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

**SparkToShip** is an autonomous software engineering platform that orchestrates a team of specialized AI agents to transform ideas into production-ready web applications. Built on Google's Agent Development Kit (ADK) and powered by Gemini models, it automates the entire software development lifecycle.

### Core Philosophy
- **Context Preservation**: Every agent has access to the complete project context
- **Architecture-First**: Design before implementation prevents technical debt
- **Self-Healing**: Automated debugging and error recovery
- **Living Documentation**: Auto-generated walkthroughs for onboarding

### Technology Stack

#### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI Framework**: Google ADK 1.19.0+
- **AI Models**: Gemini 2.0 Flash Exp / Gemini 2.5 pro
- **Session Management**: InMemorySessionService (ADK)
- **Storage**: File-based project persistence
- **API**: RESTful with CORS support

#### Frontend
- **Framework**: React 18.2 + TypeScript
- **Build Tool**: Vite 4.5
- **Styling**: TailwindCSS 3.3
- **Routing**: React Router DOM 6.20
- **Visualization**: Mermaid.js 10.9, ReactFlow 11.10
- **Markdown**: React Markdown with syntax highlighting
- **HTTP Client**: Axios 1.6

---

## Architecture

### High-Level Architecture

SparkToShip uses a **Hub-and-Spoke** architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│                    (React + TypeScript)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     FastAPI Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Orchestrator (Hub)                       │  │
│  │  - Session Management                                 │  │
│  │  - Agent Coordination                                 │  │
│  │  - State Persistence                                  │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         │               │               │                   │
│    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐              │
│    │Strategy │    │  Arch   │    │   Eng   │              │
│    │ Agents  │    │ Agents  │    │ Agents  │              │
│    └─────────┘    └─────────┘    └─────────┘              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │
                    ┌────▼────┐
                    │  Gemini │
                    │   API   │
                    └─────────┘
```

### Component Breakdown

#### 1. Orchestrator (`backend/app/core/orchestrator.py`)
The central coordinator that:
- Creates and manages project sessions
- Registers and dispatches tasks to agents
- Maintains project state and artifacts
- Handles session persistence and restoration

**Key Classes:**
- `ProjectSession`: Represents an active project with metadata
- `Orchestrator`: Singleton that manages all sessions and agents

#### 2. Agent Teams

##### Strategy Team (`backend/app/agents/strategy/`)
- **IdeaGeneratorAgent**: Expands keywords into product concepts
- **ProductRequirementsAgent**: Creates formal PRDs with user stories
- **RequirementAnalysisAgent**: Analyzes PRDs for technical constraints

##### Architecture Team (`backend/app/agents/architecture/`)
- **SoftwareArchitectAgent**: Designs system architecture, generates Mermaid diagrams
- **UXDesignerAgent**: Plans UI/UX, component hierarchy, design tokens

##### Engineering Team (`backend/app/agents/engineering/`)
- **EngineeringManagerAgent**: Creates sprint plans, manages task breakdown
- **BackendDevAgent**: Implements FastAPI backend code
- **FrontendDevAgent**: Builds React frontend components
- **QAAgent**: Performs code reviews and static analysis
- **E2ETestAgent**: Generates end-to-end test plans
- **DebuggerAgent**: Analyzes errors and applies fixes
- **WalkthroughAgent**: Creates onboarding documentation

#### 3. Core Services

##### Model Factory (`backend/app/core/model_factory.py`)
Manages AI model instances with:
- Dynamic model selection (Pro vs Flash)
- API key management
- Model configuration caching

##### Session Service (`backend/app/core/services.py`)
Provides ADK session management:
- `InMemorySessionService` for active sessions
- Session creation and retrieval
- Thread-safe operations

##### Project Storage (`backend/app/services/project_storage.py`)
File-based persistence layer:
- Saves project artifacts (PRD, architecture, code)
- Enables project load/resume functionality
- Maintains project history and metadata

---

## Agent Ecosystem

### Agent Architecture Pattern

Each agent follows a consistent pattern:

```python
class AgentName:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="agent_name",
            model=self.model,
            description="Agent purpose",
            instruction="Detailed system prompt"
        )
        self.app = App(name="spark_to_ship", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)
    
    async def execute_task(self, input_data: Dict, session_id: str) -> Dict:
        # Task execution logic
        pass
```

### Agent Communication Flow

1. **User Request** → Frontend sends request to FastAPI endpoint
2. **Orchestrator** → Routes request to appropriate agent
3. **Agent Execution** → Agent processes task using Gemini model
4. **Response Collection** → ADK Runner streams response
5. **State Update** → Orchestrator updates session artifacts
6. **Persistence** → Project storage saves updated state
7. **UI Update** → Frontend receives and displays results

### Agent Capabilities

#### Strategy Agents

**IdeaGeneratorAgent**
- **Input**: Keywords (string)
- **Output**: 5 application ideas with titles, pitches, features, target audience
- **Model**: Gemini Flash (speed-optimized)
- **Prompt Engineering**: Structured JSON output format

**ProductRequirementsAgent**
- **Input**: Selected idea context
- **Output**: Formal PRD with user stories, acceptance criteria, functional requirements
- **Model**: Gemini Pro (reasoning-optimized)
- **Artifacts**: `prd.json`, `user_stories.json`

**RequirementAnalysisAgent**
- **Input**: PRD content
- **Output**: Technical constraints, dependencies, risk analysis
- **Model**: Gemini Pro
- **Artifacts**: `requirements_analysis.json`

#### Architecture Agents

**SoftwareArchitectAgent**
- **Input**: Requirements and user stories
- **Output**: 
  - System architecture (Mermaid flowchart)
  - Sequence diagrams (Mermaid sequence)
  - Database ERD (Mermaid ERD)
  - Tech stack recommendations
- **Model**: Gemini Pro
- **Artifacts**: `architecture.json`, `diagrams.json`

**UXDesignerAgent**
- **Input**: Requirements and architecture
- **Output**:
  - Component hierarchy
  - TailwindCSS color palette
  - Wireframe descriptions
  - Responsive design guidelines
- **Model**: Gemini Flash
- **Artifacts**: `ui_design.json`

#### Engineering Agents

**EngineeringManagerAgent**
- **Input**: User stories + architecture
- **Output**: Sprint plan with atomic tasks
- **Task Structure**:
  ```json
  {
    "task_id": "TASK-001",
    "title": "Implement User Authentication API",
    "description": "Create FastAPI endpoints for login/signup",
    "assigned_to": "backend_dev",
    "story_id": "STORY-001",
    "status": "pending",
    "dependencies": [],
    "estimated_hours": 4
  }
  ```
- **Artifacts**: `sprint_plan.json`, `story_map.json`

**BackendDevAgent**
- **Input**: Task specification + context
- **Output**: FastAPI code (models, routes, services)
- **Code Structure**:
  - Pydantic models for validation
  - Type hints throughout
  - RESTful API design
  - Error handling
- **Artifacts**: `backend/` directory with Python files

**FrontendDevAgent**
- **Input**: Task specification + UI design
- **Output**: React/TypeScript components
- **Code Structure**:
  - Functional components with hooks
  - TypeScript interfaces
  - TailwindCSS styling
  - Responsive design
- **Artifacts**: `frontend/src/` directory with TSX files

**QAAgent**
- **Input**: Code files
- **Output**: Code review report with:
  - Best practice violations
  - Security vulnerabilities
  - Performance issues
  - Refactoring suggestions
- **Artifacts**: `qa_report.json`

**E2ETestAgent**
- **Input**: User stories + implemented code
- **Output**: Comprehensive test plan
- **Test Coverage**:
  - User journey tests
  - API integration tests
  - UI interaction tests
  - Edge case scenarios
- **Artifacts**: `e2e_test_plan.json`

**DebuggerAgent**
- **Input**: Error message + code files + context
- **Output**: 
  - Root cause analysis
  - Proposed fix
  - Updated code files
- **Loop Behavior**: Continues until error is resolved
- **Artifacts**: `debug_report.json`, updated code files

**WalkthroughAgent**
- **Input**: Final codebase
- **Output Types**:
  - **Text**: Markdown documentation explaining architecture and code
  - **Image**: Visual slides highlighting key components (PowerPoint)
  - **Video**: Scripted video tour (Playwright recording)
- **Artifacts**: `walkthrough_text.md`, `walkthrough_slides.pptx`, `walkthrough_video.mp4`

---

## Backend Implementation

### Directory Structure

```
backend/
├── app/
│   ├── agents/
│   │   ├── strategy/
│   │   │   ├── idea_generator.py
│   │   │   ├── product_requirements.py
│   │   │   └── requirement_analysis.py
│   │   ├── architecture/
│   │   │   ├── software_architect.py
│   │   │   └── ux_designer.py
│   │   └── engineering/
│   │       ├── engineering_manager.py
│   │       ├── backend_dev.py
│   │       ├── frontend_dev.py
│   │       ├── qa_agent.py
│   │       ├── e2e_test_agent.py
│   │       ├── debugger_agent.py
│   │       └── walkthrough_agent.py
│   ├── core/
│   │   ├── config.py              # Environment configuration
│   │   ├── orchestrator.py        # Central coordinator
│   │   ├── model_config.py        # Model settings
│   │   ├── model_factory.py       # Model instance management
│   │   └── services.py            # ADK session service
│   ├── services/
│   │   └── project_storage.py     # File-based persistence
│   ├── utils/
│   │   ├── adk_helper.py          # ADK utility functions
│   │   ├── file_utils.py          # File operations
│   │   └── json_utils.py          # JSON parsing
│   └── main.py                    # FastAPI application
├── data/                          # Project storage directory
├── requirements.txt
└── .env                           # Environment variables
```

### Key Backend Files

#### `main.py` - FastAPI Application

**Endpoints:**

1. **Session Management**
   - `POST /session/start` - Create new project session
   - `GET /session/{session_id}` - Retrieve session details

2. **Strategy Phase**
   - `POST /agents/idea-generator/{session_id}` - Generate ideas
   - `POST /agents/product-requirements/{session_id}` - Create PRD
   - `POST /agents/requirement-analysis/{session_id}` - Analyze requirements

3. **Architecture Phase**
   - `POST /agents/software-architect/{session_id}` - Design architecture
   - `POST /agents/ux-designer/{session_id}` - Design UI/UX

4. **Engineering Phase**
   - `POST /agents/engineering-manager/{session_id}` - Create sprint plan
   - `POST /agents/backend-dev/{session_id}` - Write backend code
   - `POST /agents/frontend-dev/{session_id}` - Write frontend code
   - `POST /agents/qa/{session_id}` - Review code
   - `POST /agents/e2e-test/{session_id}` - Generate test plan
   - `POST /agents/debugger/{session_id}` - Debug errors

5. **Documentation**
   - `POST /agents/walkthrough/{session_id}` - Generate walkthrough

6. **Project Management**
   - `POST /project/save` - Save project state
   - `GET /project/load/{session_id}` - Load project state
   - `GET /project/history` - List all projects
   - `GET /project/summary/{session_id}` - Get project summary

7. **Utilities**
   - `POST /settings/update` - Update API key and model
   - `GET /story-map/{session_id}` - Get story-to-task mapping

**Middleware:**
- CORS enabled for `localhost:5173` and `localhost:5174`
- JSON request/response handling
- Error handling and logging

#### `orchestrator.py` - Session Orchestrator

**ProjectSession Model:**
```python
class ProjectSession(BaseModel):
    session_id: str                    # UUID
    project_name: str                  # User-defined name
    status: str                        # initialized, in_progress, completed
    created_at: datetime               # Timestamp
    artifacts: Dict[str, str]          # Artifact name → file path
    current_phase: str                 # strategy, architecture, engineering
    logs: List[str]                    # Activity log
```

**Orchestrator Methods:**
- `create_session()`: Initializes new project with ADK session
- `get_session(session_id)`: Retrieves active or restored session
- `restore_session(session_id)`: Loads session from filesystem
- `register_agent(name, instance)`: Adds agent to registry
- `dispatch_task(session_id, agent_name, payload)`: Routes task to agent

#### `model_factory.py` - Dynamic Model Management

**Features:**
- Singleton pattern for model instances
- Supports model switching (Pro ↔ Flash)
- API key updates without restart
- Thread-safe operations

**Usage:**
```python
model_factory = ModelFactory()
model = model_factory.get_model()  # Returns current Gemini instance
model_factory.update_config(api_key="new_key", model_name="gemini-2.5-pro")
```

#### `project_storage.py` - Persistence Layer

**Storage Structure:**
```
data/
└── {session_id}/
    ├── metadata.json              # Project info
    ├── prd.json                   # Product requirements
    ├── architecture.json          # System design
    ├── sprint_plan.json           # Task breakdown
    ├── story_map.json             # Story-to-task mapping
    ├── backend/                   # Generated backend code
    ├── frontend/                  # Generated frontend code
    ├── qa_report.json             # Code review
    ├── e2e_test_plan.json         # Test plan
    └── walkthroughs/              # Documentation
```

**Methods:**
- `save_artifact(session_id, artifact_name, content)`: Saves file
- `load_artifact(session_id, artifact_name)`: Retrieves file
- `get_project_summary(session_id)`: Returns metadata
- `list_projects()`: Returns all projects with summaries

---

## Frontend Implementation

### Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ArchitectureViewer.tsx    # Mermaid diagram renderer
│   │   ├── CodeViewer.tsx            # Syntax-highlighted code display
│   │   ├── CodeWalkthrough.tsx       # Walkthrough modal
│   │   ├── MarkdownViewer.tsx        # Markdown renderer
│   │   ├── ProjectSidebar.tsx        # Project navigation
│   │   ├── Settings.tsx              # API key and model config
│   │   ├── StoryMapViewer.tsx        # Story-to-task visualization
│   │   ├── TestPlanViewer.tsx        # E2E test display
│   │   └── WalkthroughGenerator.tsx  # Walkthrough controls
│   ├── pages/
│   │   ├── MissionControl.tsx        # Main workflow page
│   │   ├── ProjectHistory.tsx        # Project list
│   │   └── Boardroom.tsx             # Kanban board
│   ├── layouts/
│   │   └── DashboardLayout.tsx       # Main layout with sidebar
│   ├── context/
│   │   └── ProjectContext.tsx        # Global state management
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
├── public/
│   └── logo.svg                      # SparkToShip logo
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

### Key Frontend Components

#### `MissionControl.tsx` - Main Workflow Page

**Features:**
- Step-by-step workflow (Ideation → PRD → Architecture → Development)
- Real-time agent execution status
- Artifact display (PRD, diagrams, code)
- System logs panel
- Responsive layout with collapsible sidebar

**State Management:**
```typescript
interface ProjectState {
  sessionId: string | null;
  projectName: string;
  currentStep: number;
  ideas: any[];
  selectedIdea: any;
  prd: any;
  requirements: any;
  architecture: any;
  uiDesign: any;
  sprintPlan: any;
  storyMap: any;
  generatedCode: any;
  qaReport: any;
  e2eTests: any;
  walkthroughs: any;
  systemLogs: string[];
}
```

**Workflow Steps:**
1. **Ideation**: Keyword input → Generate ideas → Select idea
2. **PRD**: Generate PRD → Analyze requirements
3. **Architecture**: Design system → Design UI
4. **Sprint Planning**: Create task breakdown → View story map
5. **Development**: Execute tasks → Review code → Generate tests
6. **Documentation**: Generate walkthroughs

#### `ArchitectureViewer.tsx` - Diagram Renderer

**Features:**
- Renders Mermaid.js diagrams (flowchart, sequence, ERD)
- Fullscreen zoom mode
- Copy Mermaid code to clipboard
- Light/dark mode support
- Responsive scaling

**Diagram Types:**
- **System Architecture**: Component interaction flowchart
- **Sequence Diagrams**: API call flows (multiple diagrams supported)
- **Database ERD**: Entity relationships

**Implementation:**
```typescript
import Mermaid from 'react-mermaid2';

<Mermaid 
  chart={mermaidCode} 
  config={{
    theme: 'default',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1f2937',
      // ... theme customization
    }
  }}
/>
```

#### `CodeViewer.tsx` - Code Display

**Features:**
- Syntax highlighting (React Syntax Highlighter)
- File tree navigation
- Line numbers
- Copy code button
- Language detection
- Scrollable content

**Supported Languages:**
- Python (backend)
- TypeScript/TSX (frontend)
- JSON (configuration)
- Markdown (documentation)

#### `StoryMapViewer.tsx` - Task Visualization

**Features:**
- Story-to-task mapping
- Task status indicators (pending, in_progress, completed, failed)
- Expandable story cards
- Task details modal
- Progress statistics

**Data Structure:**
```typescript
interface StoryMap {
  stories: {
    [storyName: string]: {
      tasks: string[];
      description: string;
      acceptance_criteria: string[];
    }
  };
  orphan_tasks: string[];
  total_stories: number;
  total_tasks: number;
}
```

#### `Settings.tsx` - Configuration Panel

**Features:**
- API key management (masked input)
- Model selection (Pro vs Flash)
- Real-time updates (no restart required)
- Validation and error handling

**API Integration:**
```typescript
const updateSettings = async () => {
  await axios.post('http://localhost:8000/settings/update', {
    api_key: apiKey,
    model_name: modelName
  });
};
```

#### `WalkthroughGenerator.tsx` - Documentation Generator

**Features:**
- Generate text, image, or video walkthroughs
- Display generated content
- Download options
- Progress indicators

**Walkthrough Types:**
1. **Text**: Markdown documentation with architecture explanation
2. **Image**: PowerPoint slides with visual diagrams
3. **Video**: Playwright-recorded application tour

#### `ProjectSidebar.tsx` - Navigation

**Features:**
- Project list with search
- Recent projects
- Quick actions (New, Load, Save)
- Collapsible design

---

## Data Flow

### Complete Workflow Example

**User Action**: Create a "Task Management App"

#### Phase 1: Ideation
```
User Input: "task management app for teams"
    ↓
Frontend: POST /agents/idea-generator/{session_id}
    ↓
Backend: IdeaGeneratorAgent.generate_ideas()
    ↓
Gemini: Generates 5 app ideas
    ↓
Backend: Returns JSON with ideas
    ↓
Frontend: Displays ideas, user selects one
```

#### Phase 2: Requirements
```
User Action: Select "Collaborative Task Board" idea
    ↓
Frontend: POST /agents/product-requirements/{session_id}
    ↓
Backend: ProductRequirementsAgent.generate_prd()
    ↓
Gemini: Creates formal PRD with user stories
    ↓
Backend: Saves prd.json, returns PRD
    ↓
Frontend: Displays PRD in MarkdownViewer
    ↓
Frontend: POST /agents/requirement-analysis/{session_id}
    ↓
Backend: RequirementAnalysisAgent.analyze()
    ↓
Gemini: Analyzes technical constraints
    ↓
Backend: Returns requirements analysis
```

#### Phase 3: Architecture
```
Frontend: POST /agents/software-architect/{session_id}
    ↓
Backend: SoftwareArchitectAgent.design_architecture()
    ↓
Gemini: Generates:
  - System architecture (Mermaid flowchart)
  - Sequence diagrams (Mermaid sequence)
  - Database ERD (Mermaid ERD)
  - Tech stack
    ↓
Backend: Saves architecture.json
    ↓
Frontend: Renders diagrams in ArchitectureViewer
    ↓
Frontend: POST /agents/ux-designer/{session_id}
    ↓
Backend: UXDesignerAgent.design_ui()
    ↓
Gemini: Creates UI design with components and colors
    ↓
Backend: Saves ui_design.json
```

#### Phase 4: Sprint Planning
```
Frontend: POST /agents/engineering-manager/{session_id}
    ↓
Backend: EngineeringManagerAgent.create_sprint_plan()
    ↓
Gemini: Breaks down user stories into atomic tasks
    ↓
Backend: Saves sprint_plan.json
    ↓
Frontend: GET /story-map/{session_id}
    ↓
Backend: Generates story-to-task mapping
    ↓
Frontend: Displays in StoryMapViewer
```

#### Phase 5: Development
```
For each task in sprint_plan:
    ↓
Frontend: POST /agents/backend-dev/{session_id} (if backend task)
    ↓
Backend: BackendDevAgent.write_code()
    ↓
Gemini: Generates FastAPI code
    ↓
Backend: Saves code files, updates task status
    ↓
Frontend: Updates Kanban board
    ↓
Frontend: POST /agents/frontend-dev/{session_id} (if frontend task)
    ↓
Backend: FrontendDevAgent.write_code()
    ↓
Gemini: Generates React components
    ↓
Backend: Saves code files, updates task status
```

#### Phase 6: Quality Assurance
```
Frontend: POST /agents/qa/{session_id}
    ↓
Backend: QAAgent.review_code()
    ↓
Gemini: Analyzes code for issues
    ↓
Backend: Saves qa_report.json
    ↓
Frontend: POST /agents/e2e-test/{session_id}
    ↓
Backend: E2ETestAgent.generate_tests()
    ↓
Gemini: Creates comprehensive test plan
    ↓
Backend: Saves e2e_test_plan.json
```

#### Phase 7: Documentation
```
Frontend: POST /agents/walkthrough/{session_id}?type=text
    ↓
Backend: WalkthroughAgent.generate_walkthrough()
    ↓
Gemini: Analyzes codebase, creates documentation
    ↓
Backend: Saves walkthrough_text.md
    ↓
Frontend: Displays in WalkthroughGenerator
```

### Error Handling Flow

```
User Action: Run code, encounters error
    ↓
Frontend: POST /agents/debugger/{session_id}
    {
      error_message: "TypeError: Cannot read property 'id' of undefined",
      code_files: { ... },
      context: { ... }
    }
    ↓
Backend: DebuggerAgent.debug_code()
    ↓
Gemini: Analyzes error and code
    ↓
Gemini: Proposes fix
    ↓
Backend: Applies fix to code files
    ↓
Backend: Saves updated code
    ↓
Frontend: Displays debug report and updated code
    ↓
User: Re-runs code
    ↓
If error persists: Repeat debugging loop
If resolved: Continue development
```

---

## API Reference

### Base URL
```
http://localhost:8000
```

### Authentication
Currently no authentication required (development mode).

### Endpoints

#### Session Management

**Create Session**
```http
POST /session/start
Content-Type: application/json

{
  "project_name": "My Awesome App"
}

Response: 200 OK
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_name": "My Awesome App",
  "status": "initialized",
  "created_at": "2025-11-30T13:43:35Z"
}
```

**Get Session**
```http
GET /session/{session_id}

Response: 200 OK
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_name": "My Awesome App",
  "status": "in_progress",
  "current_phase": "engineering",
  "artifacts": {
    "prd": "data/550e8400.../prd.json",
    "architecture": "data/550e8400.../architecture.json"
  }
}
```

#### Strategy Agents

**Generate Ideas**
```http
POST /agents/idea-generator/{session_id}
Content-Type: application/json

{
  "keywords": "task management app for teams"
}

Response: 200 OK
{
  "ideas": [
    {
      "title": "Collaborative Task Board",
      "pitch": "Real-time task management with team collaboration",
      "features": ["Drag-and-drop tasks", "Real-time updates", "Team chat"],
      "target_audience": "Remote teams",
      "monetization": "Freemium model"
    },
    // ... 4 more ideas
  ]
}
```

**Generate PRD**
```http
POST /agents/product-requirements/{session_id}
Content-Type: application/json

{
  "idea_context": {
    "title": "Collaborative Task Board",
    "pitch": "...",
    "features": [...]
  }
}

Response: 200 OK
{
  "prd": {
    "product_name": "Collaborative Task Board",
    "overview": "...",
    "user_stories": [
      {
        "id": "STORY-001",
        "title": "As a user, I want to create tasks",
        "acceptance_criteria": [...],
        "priority": "high"
      }
    ],
    "functional_requirements": [...],
    "non_functional_requirements": [...]
  }
}
```

**Analyze Requirements**
```http
POST /agents/requirement-analysis/{session_id}
Content-Type: application/json

{
  "prd_content": "..." // PRD JSON string
}

Response: 200 OK
{
  "analysis": {
    "technical_constraints": [...],
    "dependencies": [...],
    "risks": [...],
    "recommendations": [...]
  }
}
```

#### Architecture Agents

**Design Architecture**
```http
POST /agents/software-architect/{session_id}
Content-Type: application/json

{
  "requirements": {
    "user_stories": [...],
    "functional_requirements": [...]
  }
}

Response: 200 OK
{
  "architecture": {
    "system_architecture": "graph TD\n  User --> Frontend\n  ...",
    "sequence_diagrams": [
      {
        "name": "User Authentication Flow",
        "diagram": "sequenceDiagram\n  User->>API: POST /login\n  ..."
      }
    ],
    "database_schema": "erDiagram\n  User ||--o{ Task : creates\n  ...",
    "tech_stack": {
      "backend": "FastAPI",
      "frontend": "React",
      "database": "PostgreSQL"
    }
  }
}
```

**Design UI**
```http
POST /agents/ux-designer/{session_id}
Content-Type: application/json

{
  "requirements": {...}
}

Response: 200 OK
{
  "ui_design": {
    "components": [
      {
        "name": "TaskCard",
        "description": "...",
        "props": [...]
      }
    ],
    "color_palette": {
      "primary": "#3b82f6",
      "secondary": "#10b981"
    },
    "wireframes": [...]
  }
}
```

#### Engineering Agents

**Create Sprint Plan**
```http
POST /agents/engineering-manager/{session_id}
Content-Type: application/json

{
  "user_stories": [...],
  "architecture": {...}
}

Response: 200 OK
{
  "sprint_plan": {
    "tasks": [
      {
        "task_id": "TASK-001",
        "title": "Implement User Authentication API",
        "description": "...",
        "assigned_to": "backend_dev",
        "story_id": "STORY-001",
        "status": "pending",
        "dependencies": [],
        "estimated_hours": 4
      }
    ]
  }
}
```

**Write Backend Code**
```http
POST /agents/backend-dev/{session_id}
Content-Type: application/json

{
  "task": {
    "task_id": "TASK-001",
    "title": "...",
    "description": "..."
  },
  "context": {
    "architecture": {...},
    "existing_code": {...}
  }
}

Response: 200 OK
{
  "code_files": {
    "backend/models/user.py": "from pydantic import BaseModel\n...",
    "backend/routes/auth.py": "from fastapi import APIRouter\n..."
  },
  "task_status": "completed"
}
```

**Write Frontend Code**
```http
POST /agents/frontend-dev/{session_id}
Content-Type: application/json

{
  "task": {...},
  "context": {...}
}

Response: 200 OK
{
  "code_files": {
    "frontend/src/components/TaskCard.tsx": "import React from 'react';\n...",
    "frontend/src/pages/Dashboard.tsx": "..."
  },
  "task_status": "completed"
}
```

**Review Code**
```http
POST /agents/qa/{session_id}
Content-Type: application/json

{
  "code_files": {...}
}

Response: 200 OK
{
  "qa_report": {
    "issues": [
      {
        "severity": "high",
        "file": "backend/routes/auth.py",
        "line": 42,
        "message": "Missing input validation",
        "suggestion": "Add Pydantic model validation"
      }
    ],
    "summary": {
      "total_issues": 5,
      "high": 1,
      "medium": 2,
      "low": 2
    }
  }
}
```

**Generate E2E Tests**
```http
POST /agents/e2e-test/{session_id}

Response: 200 OK
{
  "e2e_tests": {
    "test_suites": [
      {
        "name": "User Authentication",
        "tests": [
          {
            "name": "User can sign up",
            "steps": [...],
            "assertions": [...]
          }
        ]
      }
    ]
  }
}
```

**Debug Code**
```http
POST /agents/debugger/{session_id}
Content-Type: application/json

{
  "error_message": "TypeError: Cannot read property 'id' of undefined",
  "code_files": {...},
  "context": {...}
}

Response: 200 OK
{
  "debug_report": {
    "root_cause": "...",
    "proposed_fix": "...",
    "updated_files": {...}
  }
}
```

#### Documentation

**Generate Walkthrough**
```http
POST /agents/walkthrough/{session_id}?type=text

Response: 200 OK
{
  "walkthrough": {
    "type": "text",
    "content": "# Codebase Walkthrough\n\n## Architecture\n...",
    "file_path": "data/550e8400.../walkthroughs/walkthrough_text.md"
  }
}
```

#### Project Management

**Save Project**
```http
POST /project/save
Content-Type: application/json

{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response: 200 OK
{
  "message": "Project saved successfully",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Load Project**
```http
GET /project/load/{session_id}

Response: 200 OK
{
  "session": {...},
  "prd": {...},
  "architecture": {...},
  "sprint_plan": {...},
  "code_files": {...}
}
```

**List Projects**
```http
GET /project/history

Response: 200 OK
{
  "projects": [
    {
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "project_name": "My Awesome App",
      "created_at": "2025-11-30T13:43:35Z",
      "last_modified": "2025-11-30T14:30:00Z",
      "status": "completed"
    }
  ]
}
```

**Get Story Map**
```http
GET /story-map/{session_id}

Response: 200 OK
{
  "stories": {
    "User Authentication": {
      "tasks": ["TASK-001", "TASK-002"],
      "description": "...",
      "acceptance_criteria": [...]
    }
  },
  "orphan_tasks": [],
  "total_stories": 5,
  "total_tasks": 25
}
```

#### Settings

**Update Settings**
```http
POST /settings/update
Content-Type: application/json

{
  "api_key": "AIza...",
  "model_name": "gemini-2.5-pro"
}

Response: 200 OK
{
  "message": "Settings updated successfully",
  "model_name": "gemini-2.5-pro"
}
```

---

## Configuration

### Backend Configuration

**Environment Variables** (`.env`):
```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.0-flash-exp
PROJECT_NAME=SparkToShip AI
```

**Model Options:**
- `gemini-2.0-flash-exp` - Latest Flash model (fast, cost-effective)
- `gemini-1.5-flash` - Stable Flash model
- `gemini-2.5-pro` - Pro model (advanced reasoning)

### Frontend Configuration

**API Endpoint** (`src/App.tsx`):
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

**Tailwind Configuration** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
        // ... custom colors
      }
    }
  }
}
```

---

## Deployment

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Backend (Cloud Run / App Engine)

**Dockerfile:**
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY backend/data ./data

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Deploy to Cloud Run:**
```bash
gcloud run deploy sparktoship-backend \
  --source backend/ \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY
```

#### Frontend (Firebase Hosting / Vercel)

**Build:**
```bash
cd frontend
npm run build
```

**Deploy to Firebase:**
```bash
firebase init hosting
firebase deploy
```

**Deploy to Vercel:**
```bash
vercel --prod
```

### Environment Variables (Production)

**Backend:**
- `GOOGLE_API_KEY` - Gemini API key
- `MODEL_NAME` - Default model
- `CORS_ORIGINS` - Allowed frontend origins

**Frontend:**
- `VITE_API_BASE_URL` - Backend API URL

---

## Troubleshooting

### Common Issues

#### Backend

**Issue: `ModuleNotFoundError: No module named 'google.adk'`**
```bash
# Solution: Install ADK
pip install google-adk>=1.19.0
```

**Issue: `GOOGLE_API_KEY not set`**
```bash
# Solution: Create .env file
echo "GOOGLE_API_KEY=your_key_here" > backend/.env
```

**Issue: `Address already in use (port 8000)`**
```bash
# Solution: Kill existing process
lsof -ti:8000 | xargs kill -9
# Or use different port
uvicorn app.main:app --port 8001
```

**Issue: `Session not found`**
```bash
# Solution: Check data directory exists
mkdir -p backend/data
# Or restore session from filesystem
```

#### Frontend

**Issue: `Cannot find module 'react'`**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue: `CORS error`**
```bash
# Solution: Check backend CORS settings in main.py
# Ensure frontend URL is in allow_origins
```

**Issue: `Mermaid diagrams not rendering`**
```bash
# Solution: Check Mermaid syntax
# Use Mermaid Live Editor: https://mermaid.live
```

**Issue: `API calls failing`**
```bash
# Solution: Verify backend is running
curl http://localhost:8000/
# Check browser console for errors
```

### Debugging Tips

**Enable Debug Logging (Backend):**
```python
# In main.py
logging.basicConfig(level=logging.DEBUG)
```

**View ADK Session State:**
```python
# In Python console
from app.core.services import session_service
session = session_service.get_session("session_id")
print(session)
```

**Inspect Project Storage:**
```bash
# View saved artifacts
ls -la backend/data/{session_id}/
cat backend/data/{session_id}/metadata.json
```

**Frontend State Debugging:**
```typescript
// In browser console
console.log(localStorage.getItem('sparktoship_session'));
```

---

## Performance Optimization

### Backend

1. **Model Caching**: ModelFactory caches model instances
2. **Async Operations**: All agent calls use `async/await`
3. **Session Pooling**: InMemorySessionService reuses sessions
4. **File Streaming**: Large files streamed instead of loaded into memory

### Frontend

1. **Code Splitting**: React.lazy for route-based splitting
2. **Memoization**: useMemo for expensive computations
3. **Virtual Scrolling**: For large code files and task lists
4. **Debouncing**: Search and input fields debounced

---

## Security Considerations

### API Key Management
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate API keys regularly
- Implement rate limiting for production

### CORS
- Restrict `allow_origins` to specific domains in production
- Use authentication tokens for API access
- Implement CSRF protection

### Code Execution
- Never execute user-provided code directly
- Sandbox generated code before running
- Validate all inputs with Pydantic models

---

## Future Enhancements

### Planned Features
1. **Multi-user Collaboration**: Real-time project sharing
2. **Version Control Integration**: Git integration for generated code
3. **Deployment Automation**: One-click deploy to cloud platforms
4. **Custom Agent Templates**: User-defined agent behaviors
5. **Advanced Debugging**: Interactive debugging with breakpoints
6. **Performance Monitoring**: Built-in APM for generated apps
7. **AI Model Marketplace**: Support for Claude, GPT-4, etc.

### Roadmap
- Q1 2026: Multi-user support
- Q2 2026: Git integration
- Q3 2026: Cloud deployment automation
- Q4 2026: Enterprise features (SSO, audit logs)

---

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- **Backend**: PEP 8, type hints, docstrings
- **Frontend**: ESLint, TypeScript strict mode
- **Commits**: Conventional Commits format

### Testing
```bash
# Backend tests
pytest backend/tests/

# Frontend tests
npm run test
```

---

## License

MIT License - See LICENSE file for details

---

## Support

- **Documentation**: https://github.com/yourusername/sparktoship/wiki
- **Issues**: https://github.com/yourusername/sparktoship/issues
- **Discord**: https://discord.gg/sparktoship

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
**Authors**: Team SparkToShip
