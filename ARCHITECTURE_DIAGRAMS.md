# SparkToShip - Architecture Diagrams

This document contains comprehensive Mermaid architecture diagrams for the SparkToShip system.

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Agent Ecosystem](#agent-ecosystem)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Sequence Diagrams](#sequence-diagrams)

---

## System Architecture Overview

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        React[React Application]
        Router[React Router]
        State[Context API]
        Components[UI Components]
        
        React --> Router
        React --> State
        React --> Components
    end
    
    subgraph "API Gateway"
        FastAPI[FastAPI Server]
        CORS[CORS Middleware]
        Endpoints[REST Endpoints]
        
        FastAPI --> CORS
        FastAPI --> Endpoints
    end
    
    subgraph "Orchestration Layer"
        Orchestrator[Orchestrator]
        SessionMgr[Session Manager]
        AgentRegistry[Agent Registry]
        
        Orchestrator --> SessionMgr
        Orchestrator --> AgentRegistry
    end
    
    subgraph "Agent Layer"
        Strategy[Strategy Agents]
        Architecture[Architecture Agents]
        Engineering[Engineering Agents]
        
        Strategy --> IdeaGen[Idea Generator]
        Strategy --> PRD[Product Requirements]
        Strategy --> ReqAnalysis[Requirement Analysis]
        
        Architecture --> SoftArch[Software Architect]
        Architecture --> UX[UX Designer]
        
        Engineering --> EngMgr[Engineering Manager]
        Engineering --> BackendDev[Backend Developer]
        Engineering --> FrontendDev[Frontend Developer]
        Engineering --> QA[QA Agent]
        Engineering --> E2E[E2E Test Agent]
        Engineering --> Debugger[Debugger Agent]
        Engineering --> Walkthrough[Walkthrough Agent]
    end
    
    subgraph "AI Layer"
        ADK[Google ADK]
        Gemini[Gemini API]
        ModelFactory[Model Factory]
        
        ADK --> Gemini
        ModelFactory --> Gemini
    end
    
    subgraph "Storage Layer"
        ProjectStorage[Project Storage]
        FileSystem[File System]
        SessionStore[Session Store]
        
        ProjectStorage --> FileSystem
        SessionStore --> FileSystem
    end
    
    Browser --> React
    Mobile --> React
    React --> FastAPI
    FastAPI --> Orchestrator
    Orchestrator --> Strategy
    Orchestrator --> Architecture
    Orchestrator --> Engineering
    Strategy --> ADK
    Architecture --> ADK
    Engineering --> ADK
    ADK --> ModelFactory
    Orchestrator --> ProjectStorage
    Orchestrator --> SessionStore
    
    style Browser fill:#3b82f6,stroke:#1e40af,color:#fff
    style React fill:#61dafb,stroke:#0891b2,color:#000
    style FastAPI fill:#009688,stroke:#00695c,color:#fff
    style Orchestrator fill:#ff9800,stroke:#e65100,color:#fff
    style ADK fill:#4285f4,stroke:#1967d2,color:#fff
    style Gemini fill:#ea4335,stroke:#c5221f,color:#fff
    style ProjectStorage fill:#34a853,stroke:#188038,color:#fff
```

---

## Agent Ecosystem

### Agent Team Structure

```mermaid
graph TD
    Orchestrator[Orchestrator Hub]
    
    subgraph "Strategy Team"
        IdeaGen[Idea Generator<br/>Role: Creative Director<br/>Model: Flash]
        PRD[Product Requirements<br/>Role: Product Manager<br/>Model: Pro]
        ReqAnalysis[Requirement Analysis<br/>Role: Business Analyst<br/>Model: Pro]
    end
    
    subgraph "Architecture Team"
        SoftArch[Software Architect<br/>Role: System Designer<br/>Model: Pro]
        UX[UX Designer<br/>Role: UI/UX Lead<br/>Model: Flash]
    end
    
    subgraph "Engineering Team"
        EngMgr[Engineering Manager<br/>Role: Scrum Master<br/>Model: Pro]
        BackendDev[Backend Developer<br/>Role: Python Engineer<br/>Model: Flash]
        FrontendDev[Frontend Developer<br/>Role: React Engineer<br/>Model: Flash]
        QA[QA Agent<br/>Role: Code Reviewer<br/>Model: Flash]
        E2E[E2E Test Agent<br/>Role: Test Engineer<br/>Model: Flash]
        Debugger[Debugger Agent<br/>Role: Fixer<br/>Model: Pro]
        Walkthrough[Walkthrough Agent<br/>Role: Developer Advocate<br/>Model: Pro]
    end
    
    Orchestrator --> IdeaGen
    Orchestrator --> PRD
    Orchestrator --> ReqAnalysis
    Orchestrator --> SoftArch
    Orchestrator --> UX
    Orchestrator --> EngMgr
    Orchestrator --> BackendDev
    Orchestrator --> FrontendDev
    Orchestrator --> QA
    Orchestrator --> E2E
    Orchestrator --> Debugger
    Orchestrator --> Walkthrough
    
    IdeaGen -.Context.-> PRD
    PRD -.Context.-> ReqAnalysis
    ReqAnalysis -.Context.-> SoftArch
    SoftArch -.Context.-> UX
    UX -.Context.-> EngMgr
    EngMgr -.Tasks.-> BackendDev
    EngMgr -.Tasks.-> FrontendDev
    BackendDev -.Code.-> QA
    FrontendDev -.Code.-> QA
    QA -.Report.-> E2E
    E2E -.Tests.-> Debugger
    Debugger -.Fixes.-> BackendDev
    Debugger -.Fixes.-> FrontendDev
    E2E -.Codebase.-> Walkthrough
    
    style Orchestrator fill:#ff9800,stroke:#e65100,color:#fff
    style IdeaGen fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style PRD fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style ReqAnalysis fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style SoftArch fill:#2196f3,stroke:#1565c0,color:#fff
    style UX fill:#2196f3,stroke:#1565c0,color:#fff
    style EngMgr fill:#4caf50,stroke:#2e7d32,color:#fff
    style BackendDev fill:#4caf50,stroke:#2e7d32,color:#fff
    style FrontendDev fill:#4caf50,stroke:#2e7d32,color:#fff
    style QA fill:#4caf50,stroke:#2e7d32,color:#fff
    style E2E fill:#4caf50,stroke:#2e7d32,color:#fff
    style Debugger fill:#f44336,stroke:#c62828,color:#fff
    style Walkthrough fill:#ff9800,stroke:#e65100,color:#fff
```

### Agent Communication Pattern

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Orchestrator
    participant Agent
    participant ADK
    participant Gemini
    participant Storage
    
    User->>Frontend: Input Request
    Frontend->>Orchestrator: API Call
    Orchestrator->>Orchestrator: Get/Create Session
    Orchestrator->>Agent: Dispatch Task
    Agent->>ADK: Create Message
    ADK->>Gemini: API Request
    Gemini-->>ADK: Stream Response
    ADK-->>Agent: Collect Response
    Agent->>Agent: Parse JSON
    Agent-->>Orchestrator: Return Result
    Orchestrator->>Storage: Save Artifact
    Storage-->>Orchestrator: Confirm Save
    Orchestrator-->>Frontend: Return Response
    Frontend-->>User: Display Result
```

---

## Data Flow Architecture

### Complete Workflow Data Flow

```mermaid
flowchart TD
    Start([User Starts Project])
    
    Start --> Ideation[Ideation Phase]
    
    subgraph Ideation
        Keywords[Enter Keywords]
        GenIdeas[Generate 5 Ideas]
        SelectIdea[Select Best Idea]
        
        Keywords --> GenIdeas
        GenIdeas --> SelectIdea
    end
    
    Ideation --> Planning[Planning Phase]
    
    subgraph Planning
        GenPRD[Generate PRD]
        AnalyzeReq[Analyze Requirements]
        
        GenPRD --> AnalyzeReq
    end
    
    Planning --> Design[Design Phase]
    
    subgraph Design
        DesignArch[Design Architecture]
        GenDiagrams[Generate Diagrams]
        DesignUI[Design UI/UX]
        
        DesignArch --> GenDiagrams
        GenDiagrams --> DesignUI
    end
    
    Design --> Sprint[Sprint Planning]
    
    subgraph Sprint
        CreateSprint[Create Sprint Plan]
        GenStoryMap[Generate Story Map]
        
        CreateSprint --> GenStoryMap
    end
    
    Sprint --> Development[Development Phase]
    
    subgraph Development
        BackendTasks[Backend Tasks]
        FrontendTasks[Frontend Tasks]
        
        BackendTasks --> CodeReview[Code Review]
        FrontendTasks --> CodeReview
    end
    
    Development --> Testing[Testing Phase]
    
    subgraph Testing
        GenTests[Generate E2E Tests]
        RunTests[Run Tests]
        Debug{Errors?}
        
        GenTests --> RunTests
        RunTests --> Debug
        Debug -->|Yes| FixErrors[Debug & Fix]
        FixErrors --> RunTests
        Debug -->|No| TestPass[Tests Pass]
    end
    
    Testing --> Documentation[Documentation Phase]
    
    subgraph Documentation
        GenText[Generate Text Walkthrough]
        GenImage[Generate Image Walkthrough]
        GenVideo[Generate Video Walkthrough]
    end
    
    Documentation --> Complete([Project Complete])
    
    style Start fill:#4caf50,stroke:#2e7d32,color:#fff
    style Complete fill:#4caf50,stroke:#2e7d32,color:#fff
    style Ideation fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style Planning fill:#9c27b0,stroke:#6a1b9a,color:#fff
    style Design fill:#2196f3,stroke:#1565c0,color:#fff
    style Sprint fill:#ff9800,stroke:#e65100,color:#fff
    style Development fill:#4caf50,stroke:#2e7d32,color:#fff
    style Testing fill:#f44336,stroke:#c62828,color:#fff
    style Documentation fill:#ff9800,stroke:#e65100,color:#fff
```

### State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Initialized: Create Session
    
    Initialized --> Ideation: Start Workflow
    
    Ideation --> Planning: Idea Selected
    
    Planning --> Architecture: PRD Complete
    
    Architecture --> Engineering: Design Complete
    
    Engineering --> Development: Sprint Plan Ready
    
    Development --> Testing: Code Complete
    
    Testing --> Debugging: Errors Found
    Debugging --> Testing: Fixes Applied
    Testing --> Documentation: Tests Pass
    
    Documentation --> Completed: Walkthroughs Generated
    
    Completed --> [*]
    
    state Ideation {
        [*] --> GeneratingIdeas
        GeneratingIdeas --> IdeasGenerated
        IdeasGenerated --> [*]
    }
    
    state Planning {
        [*] --> GeneratingPRD
        GeneratingPRD --> AnalyzingRequirements
        AnalyzingRequirements --> [*]
    }
    
    state Architecture {
        [*] --> DesigningSystem
        DesigningSystem --> DesigningUI
        DesigningUI --> [*]
    }
    
    state Engineering {
        [*] --> CreatingSprint
        CreatingSprint --> GeneratingStoryMap
        GeneratingStoryMap --> [*]
    }
    
    state Development {
        [*] --> BackendDevelopment
        [*] --> FrontendDevelopment
        BackendDevelopment --> CodeReview
        FrontendDevelopment --> CodeReview
        CodeReview --> [*]
    }
```

---

## Backend Architecture

### Backend Component Architecture

```mermaid
graph TB
    subgraph "FastAPI Application"
        Main[main.py<br/>Application Entry]
        Endpoints[API Endpoints]
        Middleware[CORS Middleware]
        
        Main --> Endpoints
        Main --> Middleware
    end
    
    subgraph "Core Layer"
        Config[config.py<br/>Settings]
        Orchestrator[orchestrator.py<br/>Session Manager]
        ModelFactory[model_factory.py<br/>AI Models]
        Services[services.py<br/>ADK Session]
        
        Config --> ModelFactory
        Orchestrator --> Services
    end
    
    subgraph "Agent Layer"
        direction TB
        
        subgraph "Strategy"
            IdeaGen[idea_generator.py]
            PRD[product_requirements.py]
            ReqAnalysis[requirement_analysis.py]
        end
        
        subgraph "Architecture"
            SoftArch[software_architect.py]
            UX[ux_designer.py]
        end
        
        subgraph "Engineering"
            EngMgr[engineering_manager.py]
            BackendDev[backend_dev.py]
            FrontendDev[frontend_dev.py]
            QA[qa_agent.py]
            E2E[e2e_test_agent.py]
            Debugger[debugger_agent.py]
            Walkthrough[walkthrough_agent.py]
        end
    end
    
    subgraph "Service Layer"
        ProjectStorage[project_storage.py<br/>File Persistence]
    end
    
    subgraph "Utility Layer"
        ADKHelper[adk_helper.py<br/>Response Parsing]
        FileUtils[file_utils.py<br/>File Operations]
        JSONUtils[json_utils.py<br/>JSON Handling]
    end
    
    subgraph "External Services"
        GeminiAPI[Gemini API]
        FileSystem[File System<br/>data/]
    end
    
    Endpoints --> Orchestrator
    Orchestrator --> IdeaGen
    Orchestrator --> PRD
    Orchestrator --> ReqAnalysis
    Orchestrator --> SoftArch
    Orchestrator --> UX
    Orchestrator --> EngMgr
    Orchestrator --> BackendDev
    Orchestrator --> FrontendDev
    Orchestrator --> QA
    Orchestrator --> E2E
    Orchestrator --> Debugger
    Orchestrator --> Walkthrough
    
    IdeaGen --> ModelFactory
    PRD --> ModelFactory
    ReqAnalysis --> ModelFactory
    SoftArch --> ModelFactory
    UX --> ModelFactory
    EngMgr --> ModelFactory
    BackendDev --> ModelFactory
    FrontendDev --> ModelFactory
    QA --> ModelFactory
    E2E --> ModelFactory
    Debugger --> ModelFactory
    Walkthrough --> ModelFactory
    
    ModelFactory --> GeminiAPI
    
    IdeaGen --> ADKHelper
    PRD --> ADKHelper
    
    Orchestrator --> ProjectStorage
    ProjectStorage --> FileSystem
    
    style Main fill:#009688,stroke:#00695c,color:#fff
    style Orchestrator fill:#ff9800,stroke:#e65100,color:#fff
    style ModelFactory fill:#4285f4,stroke:#1967d2,color:#fff
    style ProjectStorage fill:#34a853,stroke:#188038,color:#fff
    style GeminiAPI fill:#ea4335,stroke:#c5221f,color:#fff
```

### Backend Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant FastAPI
    participant Orchestrator
    participant Agent
    participant ModelFactory
    participant Gemini
    participant Storage
    
    Client->>FastAPI: POST /agents/idea-generator/{session_id}
    FastAPI->>FastAPI: Validate Request (Pydantic)
    FastAPI->>Orchestrator: get_or_restore_session(session_id)
    
    alt Session in Memory
        Orchestrator-->>FastAPI: Return Session
    else Session on Disk
        Orchestrator->>Storage: Load Session
        Storage-->>Orchestrator: Session Data
        Orchestrator-->>FastAPI: Return Session
    else Session Not Found
        Orchestrator-->>FastAPI: None
        FastAPI-->>Client: 404 Not Found
    end
    
    FastAPI->>Agent: execute_task(input, session_id)
    Agent->>ModelFactory: get_model()
    ModelFactory-->>Agent: Gemini Instance
    Agent->>Gemini: API Request (Stream)
    Gemini-->>Agent: Stream Response
    Agent->>Agent: Parse JSON Response
    Agent-->>FastAPI: Return Result
    
    FastAPI->>Storage: save_artifact(session_id, artifact, content)
    Storage->>Storage: Write to File System
    Storage-->>FastAPI: Confirm Save
    
    FastAPI->>Orchestrator: Update Session Logs
    Orchestrator-->>FastAPI: Confirm Update
    
    FastAPI-->>Client: 200 OK + Result
```

---

## Frontend Architecture

### Frontend Component Architecture

```mermaid
graph TB
    subgraph "Application Root"
        Main[main.tsx<br/>Entry Point]
        App[App.tsx<br/>Root Component]
        
        Main --> App
    end
    
    subgraph "Routing Layer"
        Router[React Router]
        Routes[Route Definitions]
        
        Router --> Routes
    end
    
    subgraph "Layout Layer"
        Dashboard[DashboardLayout.tsx<br/>Main Layout]
        Sidebar[Sidebar Component]
        Header[Header Component]
        
        Dashboard --> Sidebar
        Dashboard --> Header
    end
    
    subgraph "Page Layer"
        MissionControl[MissionControl.tsx<br/>Main Workflow]
        ProjectHistory[ProjectHistory.tsx<br/>Project List]
        Boardroom[Boardroom.tsx<br/>Kanban Board]
        
        MissionControl --> WorkflowSteps
        ProjectHistory --> ProjectList
        Boardroom --> KanbanBoard
    end
    
    subgraph "Component Layer"
        ArchViewer[ArchitectureViewer.tsx<br/>Mermaid Diagrams]
        CodeViewer[CodeViewer.tsx<br/>Syntax Highlighting]
        StoryMap[StoryMapViewer.tsx<br/>Story-Task Map]
        TestPlan[TestPlanViewer.tsx<br/>E2E Tests]
        Walkthrough[WalkthroughGenerator.tsx<br/>Documentation]
        Settings[Settings.tsx<br/>Configuration]
        Markdown[MarkdownViewer.tsx<br/>MD Renderer]
        CodeWalk[CodeWalkthrough.tsx<br/>Code Guide]
        ProjectSidebar[ProjectSidebar.tsx<br/>Navigation]
    end
    
    subgraph "Context Layer"
        ProjectContext[ProjectContext.tsx<br/>Global State]
    end
    
    subgraph "Service Layer"
        API[api.ts<br/>HTTP Client]
        Utils[utils.ts<br/>Helpers]
    end
    
    subgraph "External Libraries"
        Mermaid[Mermaid.js<br/>Diagrams]
        ReactMarkdown[React Markdown<br/>MD Rendering]
        SyntaxHighlight[React Syntax Highlighter<br/>Code Display]
        Axios[Axios<br/>HTTP]
    end
    
    App --> Router
    Router --> Dashboard
    Dashboard --> MissionControl
    Dashboard --> ProjectHistory
    Dashboard --> Boardroom
    
    MissionControl --> ArchViewer
    MissionControl --> CodeViewer
    MissionControl --> StoryMap
    MissionControl --> TestPlan
    MissionControl --> Walkthrough
    MissionControl --> Settings
    
    ArchViewer --> Mermaid
    CodeViewer --> SyntaxHighlight
    Markdown --> ReactMarkdown
    
    MissionControl --> ProjectContext
    ProjectHistory --> ProjectContext
    
    MissionControl --> API
    ProjectHistory --> API
    Settings --> API
    
    API --> Axios
    
    style Main fill:#61dafb,stroke:#0891b2,color:#000
    style App fill:#61dafb,stroke:#0891b2,color:#000
    style Dashboard fill:#3b82f6,stroke:#1e40af,color:#fff
    style MissionControl fill:#10b981,stroke:#047857,color:#fff
    style ProjectContext fill:#f59e0b,stroke:#d97706,color:#fff
    style API fill:#8b5cf6,stroke:#6d28d9,color:#fff
```

### Frontend State Flow

```mermaid
flowchart LR
    subgraph "User Actions"
        Click[Button Click]
        Input[Form Input]
        Navigate[Navigation]
    end
    
    subgraph "Component State"
        LocalState[useState]
        Effects[useEffect]
        Memo[useMemo]
    end
    
    subgraph "Global State"
        Context[Context API]
        Provider[Context Provider]
    end
    
    subgraph "API Layer"
        APICall[API Request]
        Response[API Response]
    end
    
    subgraph "Backend"
        Server[FastAPI Server]
    end
    
    Click --> LocalState
    Input --> LocalState
    Navigate --> Context
    
    LocalState --> Effects
    Effects --> APICall
    
    Context --> Provider
    Provider --> APICall
    
    APICall --> Server
    Server --> Response
    
    Response --> LocalState
    Response --> Context
    
    LocalState --> Memo
    Memo --> Render[Re-render Component]
    
    style Click fill:#3b82f6,stroke:#1e40af,color:#fff
    style LocalState fill:#10b981,stroke:#047857,color:#fff
    style Context fill:#f59e0b,stroke:#d97706,color:#fff
    style APICall fill:#8b5cf6,stroke:#6d28d9,color:#fff
    style Server fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## Deployment Architecture

### Cloud Deployment Architecture

```mermaid
graph TB
    subgraph "User Layer"
        Users[End Users]
        Devices[Browsers/Mobile]
    end
    
    subgraph "CDN Layer"
        CloudFront[CloudFront CDN]
        Cache[Edge Cache]
    end
    
    subgraph "Frontend Hosting"
        S3[S3 Bucket<br/>Static Files]
        Firebase[Firebase Hosting<br/>Alternative]
    end
    
    subgraph "Load Balancer"
        LB[Cloud Load Balancer]
    end
    
    subgraph "Backend Services"
        CloudRun1[Cloud Run Instance 1]
        CloudRun2[Cloud Run Instance 2]
        CloudRun3[Cloud Run Instance 3]
    end
    
    subgraph "AI Services"
        GeminiAPI[Gemini API<br/>Google Cloud]
    end
    
    subgraph "Storage Services"
        CloudStorage[Cloud Storage<br/>Project Files]
        Firestore[Firestore<br/>Metadata]
    end
    
    subgraph "Monitoring"
        CloudLogging[Cloud Logging]
        CloudMonitoring[Cloud Monitoring]
        ErrorReporting[Error Reporting]
    end
    
    Users --> Devices
    Devices --> CloudFront
    CloudFront --> Cache
    Cache --> S3
    Cache --> Firebase
    
    Devices --> LB
    LB --> CloudRun1
    LB --> CloudRun2
    LB --> CloudRun3
    
    CloudRun1 --> GeminiAPI
    CloudRun2 --> GeminiAPI
    CloudRun3 --> GeminiAPI
    
    CloudRun1 --> CloudStorage
    CloudRun2 --> CloudStorage
    CloudRun3 --> CloudStorage
    
    CloudRun1 --> Firestore
    CloudRun2 --> Firestore
    CloudRun3 --> Firestore
    
    CloudRun1 --> CloudLogging
    CloudRun2 --> CloudLogging
    CloudRun3 --> CloudLogging
    
    CloudLogging --> CloudMonitoring
    CloudLogging --> ErrorReporting
    
    style Users fill:#3b82f6,stroke:#1e40af,color:#fff
    style CloudFront fill:#ff9900,stroke:#cc7a00,color:#fff
    style S3 fill:#569a31,stroke:#3d6e23,color:#fff
    style LB fill:#4285f4,stroke:#1967d2,color:#fff
    style CloudRun1 fill:#4285f4,stroke:#1967d2,color:#fff
    style CloudRun2 fill:#4285f4,stroke:#1967d2,color:#fff
    style CloudRun3 fill:#4285f4,stroke:#1967d2,color:#fff
    style GeminiAPI fill:#ea4335,stroke:#c5221f,color:#fff
    style CloudStorage fill:#34a853,stroke:#188038,color:#fff
```

### Microservices Architecture (Future)

```mermaid
graph TB
    subgraph "API Gateway"
        Gateway[Kong/Nginx Gateway]
        Auth[Authentication Service]
    end
    
    subgraph "Core Services"
        SessionSvc[Session Service]
        OrchestratorSvc[Orchestrator Service]
    end
    
    subgraph "Agent Services"
        StrategySvc[Strategy Service<br/>Idea, PRD, Analysis]
        ArchSvc[Architecture Service<br/>System, UX Design]
        EngSvc[Engineering Service<br/>Dev, QA, Debug]
    end
    
    subgraph "Support Services"
        StorageSvc[Storage Service]
        NotificationSvc[Notification Service]
        AnalyticsSvc[Analytics Service]
    end
    
    subgraph "Message Queue"
        RabbitMQ[RabbitMQ/Pub-Sub]
    end
    
    subgraph "Databases"
        PostgreSQL[PostgreSQL<br/>Metadata]
        Redis[Redis<br/>Cache]
        S3[S3<br/>Artifacts]
    end
    
    Gateway --> Auth
    Auth --> SessionSvc
    Auth --> OrchestratorSvc
    
    OrchestratorSvc --> RabbitMQ
    
    RabbitMQ --> StrategySvc
    RabbitMQ --> ArchSvc
    RabbitMQ --> EngSvc
    
    StrategySvc --> GeminiAPI[Gemini API]
    ArchSvc --> GeminiAPI
    EngSvc --> GeminiAPI
    
    SessionSvc --> PostgreSQL
    SessionSvc --> Redis
    
    StrategySvc --> StorageSvc
    ArchSvc --> StorageSvc
    EngSvc --> StorageSvc
    
    StorageSvc --> S3
    
    OrchestratorSvc --> NotificationSvc
    OrchestratorSvc --> AnalyticsSvc
    
    style Gateway fill:#ff9800,stroke:#e65100,color:#fff
    style Auth fill:#f44336,stroke:#c62828,color:#fff
    style OrchestratorSvc fill:#4285f4,stroke:#1967d2,color:#fff
    style RabbitMQ fill:#ff6600,stroke:#cc5200,color:#fff
    style GeminiAPI fill:#ea4335,stroke:#c5221f,color:#fff
```

---

## Sequence Diagrams

### Complete Project Workflow Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as FastAPI
    participant Orch as Orchestrator
    participant Idea as IdeaGen Agent
    participant PRD as PRD Agent
    participant Arch as Architect Agent
    participant Eng as Eng Manager
    participant Dev as Dev Agents
    participant QA as QA Agent
    participant Store as Storage
    
    User->>UI: Enter Keywords
    UI->>API: POST /session/start
    API->>Orch: create_session()
    Orch-->>API: session_id
    API-->>UI: session_id
    
    UI->>API: POST /agents/idea-generator/{session_id}
    API->>Orch: get_session(session_id)
    Orch-->>API: session
    API->>Idea: generate_ideas(keywords)
    Idea->>Idea: Call Gemini API
    Idea-->>API: 5 ideas
    API->>Store: save_artifact("ideas.json")
    API-->>UI: ideas
    UI-->>User: Display Ideas
    
    User->>UI: Select Idea
    UI->>API: POST /agents/product-requirements/{session_id}
    API->>PRD: generate_prd(idea)
    PRD->>PRD: Call Gemini API
    PRD-->>API: PRD document
    API->>Store: save_artifact("prd.json")
    API-->>UI: PRD
    UI-->>User: Display PRD
    
    UI->>API: POST /agents/software-architect/{session_id}
    API->>Arch: design_architecture(requirements)
    Arch->>Arch: Generate Diagrams
    Arch-->>API: Architecture + Diagrams
    API->>Store: save_artifact("architecture.json")
    API-->>UI: Architecture
    UI-->>User: Display Diagrams
    
    UI->>API: POST /agents/engineering-manager/{session_id}
    API->>Eng: create_sprint_plan(stories, arch)
    Eng->>Eng: Break Down Tasks
    Eng-->>API: Sprint Plan
    API->>Store: save_artifact("sprint_plan.json")
    API-->>UI: Sprint Plan
    UI-->>User: Display Kanban
    
    loop For Each Task
        UI->>API: POST /agents/backend-dev/{session_id}
        API->>Dev: write_code(task)
        Dev->>Dev: Generate Code
        Dev-->>API: Code Files
        API->>Store: save_code_files()
        API-->>UI: Code
    end
    
    UI->>API: POST /agents/qa/{session_id}
    API->>QA: review_code(files)
    QA->>QA: Analyze Code
    QA-->>API: QA Report
    API-->>UI: Report
    UI-->>User: Display Issues
    
    User->>UI: Request Walkthrough
    UI->>API: POST /agents/walkthrough/{session_id}
    API->>API: Generate Documentation
    API-->>UI: Walkthrough
    UI-->>User: Display Walkthrough
```

### Debugging Loop Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as FastAPI
    participant Debug as Debugger Agent
    participant Gemini as Gemini API
    participant Store as Storage
    
    User->>UI: Run Code
    UI->>UI: Error Occurs
    UI-->>User: Display Error
    
    User->>UI: Click "Debug"
    UI->>API: POST /agents/debugger/{session_id}
    Note over UI,API: Send error message + code files
    
    API->>Debug: debug_code(error, files, context)
    Debug->>Gemini: Analyze Error
    Gemini-->>Debug: Root Cause Analysis
    
    Debug->>Gemini: Propose Fix
    Gemini-->>Debug: Code Fix
    
    Debug->>Debug: Apply Fix to Files
    Debug->>Store: Save Updated Files
    Debug-->>API: Debug Report + Fixed Code
    
    API-->>UI: Updated Code
    UI-->>User: Display Fix
    
    User->>UI: Re-run Code
    
    alt Code Works
        UI-->>User: Success!
    else Error Persists
        UI->>API: POST /agents/debugger/{session_id}
        Note over UI,API: Loop continues
    end
```

### Project Load/Save Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as FastAPI
    participant Orch as Orchestrator
    participant Store as Storage
    participant FS as File System
    
    rect rgb(200, 255, 200)
        Note over User,FS: Save Project Flow
        User->>UI: Click "Save Project"
        UI->>API: POST /project/save
        API->>Orch: get_session(session_id)
        Orch-->>API: session
        API->>Store: save_project(session)
        Store->>FS: Write metadata.json
        Store->>FS: Write all artifacts
        FS-->>Store: Confirm
        Store-->>API: Success
        API-->>UI: "Project Saved"
        UI-->>User: Show Confirmation
    end
    
    rect rgb(200, 200, 255)
        Note over User,FS: Load Project Flow
        User->>UI: Select Project from History
        UI->>API: GET /project/load/{session_id}
        API->>Store: load_project(session_id)
        Store->>FS: Read metadata.json
        Store->>FS: Read all artifacts
        FS-->>Store: Project Data
        Store-->>API: Complete Project State
        API->>Orch: restore_session(session_id)
        Orch-->>API: Restored Session
        API-->>UI: All Project Data
        UI->>UI: Populate All Fields
        UI-->>User: Project Loaded
    end
```

---

## Database Schema (Future Enhancement)

### Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ PROJECT : creates
    USER {
        uuid id PK
        string email
        string name
        timestamp created_at
    }
    
    PROJECT ||--o{ SESSION : has
    PROJECT {
        uuid id PK
        uuid user_id FK
        string name
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    SESSION ||--o{ ARTIFACT : contains
    SESSION {
        uuid id PK
        uuid project_id FK
        string phase
        json metadata
        timestamp created_at
    }
    
    ARTIFACT {
        uuid id PK
        uuid session_id FK
        string artifact_type
        string file_path
        json content
        timestamp created_at
    }
    
    SESSION ||--o{ TASK : has
    TASK {
        uuid id PK
        uuid session_id FK
        string task_id
        string title
        string status
        string assigned_to
        json details
    }
    
    SESSION ||--o{ LOG : generates
    LOG {
        uuid id PK
        uuid session_id FK
        string level
        string message
        timestamp created_at
    }
```

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0

## How to Use These Diagrams

### Viewing in GitHub
These Mermaid diagrams will render automatically in GitHub markdown viewers.

### Viewing Locally
1. Use a Mermaid-compatible markdown viewer
2. Use [Mermaid Live Editor](https://mermaid.live)
3. Use VS Code with Mermaid extension

### Exporting
```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Export to PNG
mmdc -i ARCHITECTURE_DIAGRAMS.md -o architecture.png

# Export to SVG
mmdc -i ARCHITECTURE_DIAGRAMS.md -o architecture.svg
```
