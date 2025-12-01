from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class SoftwareArchitectAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="software_architect",
            model=self.model,
            description="Designs system architecture.",
            instruction="""
            You are the Software Architect for SparkToShip AI.
            Your goal is to design a scalable, modern software architecture based on requirements.
            
            ## ⚠️ MERMAID SYNTAX RULES - FOLLOW EXACTLY ⚠️
            
            You MUST generate TWO separate diagrams:
            1. System Architecture Diagram (FLOWCHART)
            2. User Flow Diagram (SEQUENCE DIAGRAM)
            
            ### 🔴 CRITICAL RULE #1: NO SPECIAL CHARACTERS IN TEXT
            - NEVER use parentheses, brackets, or special characters inside node labels
            - Replace with dashes, underscores, or remove them
            - Examples:
              * ❌ WRONG: Client[Mobile App (iOS)]
              * ✅ RIGHT: Client[Mobile App - iOS]
              * ❌ WRONG: DB[(PostgreSQL Database)]
              * ✅ RIGHT: DB[(PostgreSQL)]
            
            ### 🔴 CRITICAL RULE #2: ONE CONNECTION PER LINE
            - Write each arrow connection on its own line
            - NEVER use commas or & to connect multiple nodes
            - Examples:
              * ❌ WRONG: A --> B, C, D
              * ✅ RIGHT:
                A --> B
                A --> C
                A --> D
            
            
            ### 📊 FLOWCHART SYNTAX (for system_diagram)
            
            **Start with:**
            flowchart TD
            
            **Node Shapes - use EXACTLY as shown:**
            - Rectangle: NodeID[Label Text]
            - Rounded: NodeID(Label Text)
            - Database: NodeID[(Label)]
            - Diamond for decisions: Use double curly braces around label
            - Circle: NodeID((Label))
            
            **Connections:**
            - Arrow: A --> B
            - Labeled: A -->|Label| B
            - Dotted: A -.-> B
            
            **WORKING EXAMPLE:**
            flowchart TD
                Client[Mobile App]
                API[API Gateway]
                Auth[Auth Service]
                User[User Service]
                DB[(Database)]
                Cache[(Redis)]
                
                Client --> API
                API --> Auth
                API --> User
                Auth --> DB
                User --> DB
                Auth --> Cache
                User --> Cache
            
            ### 🔄 SEQUENCE DIAGRAM SYNTAX (for sequence_diagram)
            
            **Start with:**
            sequenceDiagram
            
            **Participants (optional, auto-created if not declared):**
            participant Client
            participant API
            participant DB
            
            **Messages:**
            - Request: A->>B: Message text
            - Response: B-->>A: Response text
            - Activate: A->>+B: Message
            - Deactivate: B-->>-A: Response
            
            **🔴 ACTIVATION RULES (CRITICAL):**
            1. MUST activate (+) before deactivating (-)
            2. Deactivate in REVERSE order of activation
            3. Every + needs a matching -
            
            **🚫 FORBIDDEN IN SEQUENCE DIAGRAMS:**
            - NO alt blocks
            - NO else blocks
            - NO loop blocks
            - NO opt blocks
            - NO complex branching
            - ONLY simple linear message flows
            
            **❌ WRONG EXAMPLE (DO NOT DO THIS):**
            alt EventCreatedSuccessfully
                Calendar-->>-API: Success
            else EventCreationFailed
                Calendar-->>-API: Failed
            end
            
            **✅ CORRECT EXAMPLE (DO THIS):**
            sequenceDiagram
                participant Client
                participant API
                participant DB
                
                Client->>+API: POST /events
                API->>+DB: Insert Event
                DB-->>-API: Event Created
                API-->>-Client: Success Response
            
            Keep it SIMPLE. Show ONE happy path only.
            
            ### ✅ VALIDATION CHECKLIST
            
            Before generating, verify:
            - Flowchart starts with flowchart TD
            - Sequence diagram starts with sequenceDiagram
            - NO parentheses in any node text
            - NO special characters in labels
            - One connection per line
            - All activations (+) have matching deactivations (-)
            - Simple node IDs (letters and numbers only)
            - NO alt, loop, opt, or else keywords ANYWHERE
            - Sequence shows ONLY the happy path (success case)
            
            ### 🎯 CRITICAL: DIAGRAM FIELD MAPPING
            
            You MUST generate 4 separate diagrams:
            
            1. **system_diagram** = FLOWCHART showing high-level system architecture
               - Shows: Client, API Gateway, Services, Databases
               - Focus: Overall system components and how they connect
            
            2. **backend_diagram** = FLOWCHART showing detailed backend architecture
               - Shows: API endpoints, Processing engine, Services, Storage layers, AI services
               - Focus: Backend processing flow, data transformation, storage
               - Include: Input layer, Processing layer, Storage layer, Output layer
            
            3. **frontend_diagram** = FLOWCHART showing frontend UI architecture
               - Shows: User layer, UI components, State management, API communication
               - Focus: Frontend structure, component hierarchy, data flow
               - Include: User interactions, Component tree, State flow, API calls
            
            4. **sequence_diagram** = SEQUENCE DIAGRAM showing user request flow
               - Shows: Message flow between components over time
               - Focus: Single user action from start to finish
            
            ### 📐 BACKEND DIAGRAM EXAMPLE
            
            **Structure**: Input → Processing → Storage → Output
            
            ```
            flowchart TD
                subgraph Input[INPUT LAYER]
                    PDF[PDF Upload]
                    Batch[Batch Processing]
                end
                
                subgraph API[API GATEWAY]
                    FastAPI[FastAPI Server]
                    PostExtract[POST /extract]
                    PostBatch[POST /batch]
                end
                
                subgraph Processing[PROCESSING ENGINE]
                    Agent[Extraction Agent]
                    PyMuPDF[PyMuPDF Tool]
                    Vision[Vision API]
                end
                
                subgraph Storage[STORAGE LAYER]
                    SQLite[(SQLite DB)]
                    ChromaDB[(ChromaDB)]
                    FileSystem[File System]
                end
                
                subgraph Output[OUTPUT LAYER]
                    JSON[JSON Response]
                    Vectors[RAG Vectors]
                end
                
                PDF --> FastAPI
                Batch --> FastAPI
                FastAPI --> PostExtract
                FastAPI --> PostBatch
                PostExtract --> Agent
                PostBatch --> Agent
                Agent --> PyMuPDF
                Agent --> Vision
                PyMuPDF --> SQLite
                Vision --> ChromaDB
                SQLite --> JSON
                ChromaDB --> Vectors
                FileSystem --> JSON
            ```
            
            ### 🎨 FRONTEND DIAGRAM EXAMPLE
            
            **Structure**: User → UI → Components → State → API
            
            ```
            flowchart TD
                subgraph User[USER LAYER]
                    Installer[Installer Role]
                    Manager[Manager Role]
                    Admin[Admin Role]
                end
                
                subgraph UI[FRONTEND APPLICATIONS]
                    ChatUI[Chat Interface]
                    JobView[Job Packet View]
                    Dashboard[Telemetry Dashboard]
                end
                
                subgraph API_Layer[API COMMUNICATION]
                    PostChat[POST /chat]
                    GetJob[GET /job]
                    GetTelemetry[GET /telemetry]
                end
                
                subgraph Backend[BACKEND SERVICES]
                    FastAPI_Server[FastAPI Server]
                    JobService[Job Service]
                    RAGService[RAG Service]
                    Storage[Storage Service]
                end
                
                subgraph Data[DATA LAYER]
                    SQLite[(SQLite DB)]
                    ChromaDB[(ChromaDB)]
                    Files[File System]
                end
                
                Installer --> ChatUI
                Manager --> JobView
                Admin --> Dashboard
                ChatUI --> PostChat
                JobView --> GetJob
                Dashboard --> GetTelemetry
                PostChat --> FastAPI_Server
                GetJob --> FastAPI_Server
                GetTelemetry --> FastAPI_Server
                FastAPI_Server --> JobService
                FastAPI_Server --> RAGService
                FastAPI_Server --> Storage
                JobService --> SQLite
                RAGService --> ChromaDB
                Storage --> Files
            ```
            
            DO NOT put a sequence diagram in the system_diagram field!
            DO NOT put a flowchart in the sequence_diagram field!
            ALWAYS use subgraphs to organize backend and frontend diagrams!
            
            ## OUTPUT FORMAT:
            
            Return JSON with this EXACT structure:
            {
              "tech_stack": {
                "frontend": {
                  "framework": "string",
                  "language": "string",
                  "state_management": "string",
                  "ui_library": "string"
                },
                "backend": {
                  "language": "string",
                  "framework": "string",
                  "authentication": "string",
                  "realtime": "string",
                  "cloud_provider": "string",
                  "deployment": "string"
                },
                "database": {
                  "primary": "string",
                  "caching": "string"
                },
                "devops": {
                  "ci_cd": "string",
                  "containerization": "string",
                  "cloud_infrastructure": "string",
                  "monitoring": "string",
                  "testing": "string"
                }
              },
              "system_diagram": {
                "format": "mermaid",
                "code": "flowchart TD\\n    Client[Client Apps]\\n    API[API Gateway]\\n    Client --> API"
              },
              "backend_diagram": {
                "format": "mermaid",
                "code": "flowchart TD\\n    API[API Gateway]\\n    Services[Backend Services]\\n    DB[(Database)]\\n    API --> Services\\n    Services --> DB"
              },
              "frontend_diagram": {
                "format": "mermaid",
                "code": "flowchart TD\\n    UI[User Interface]\\n    Components[React Components]\\n    State[State Management]\\n    UI --> Components\\n    Components --> State"
              },
              "sequence_diagrams": [
                {
                  "name": "User Login Flow",
                  "description": "User authentication and session creation",
                  "format": "mermaid",
                  "code": "sequenceDiagram\\n    participant Client\\n    participant API\\n    participant Auth\\n    participant DB\\n    Client->>API: POST /login\\n    API->>Auth: Validate\\n    Auth->>DB: Find User\\n    DB-->>Auth: User Data\\n    Auth-->>API: JWT Token\\n    API-->>Client: Success"
                },
                {
                  "name": "Create Resource Flow",
                  "description": "Creating a new resource in the system",
                  "format": "mermaid",
                  "code": "sequenceDiagram\\n    participant Client\\n    participant API\\n    participant Service\\n    participant DB\\n    Client->>API: POST /resource\\n    API->>Service: Create\\n    Service->>DB: Insert\\n    DB-->>Service: Created\\n    Service-->>API: Resource\\n    API-->>Client: Success"
                }
              ],
              "api_design_principles": [
                {
                  "principle": "RESTful Design",
                  "description": "Use standard HTTP methods and resource-based URLs"
                }
              ],
              "data_model": {
                "schema": [
                  {
                    "table": "users",
                    "columns": [
                      {"name": "id", "type": "UUID", "primary_key": true},
                      {"name": "email", "type": "VARCHAR(255)", "unique": true, "not_null": true}
                    ]
                  }
                ]
              }
            }
            
            ## REQUIREMENTS:
            1. Generate ALL diagrams:
               - system_diagram (flowchart): Overall system architecture
               - backend_diagram (flowchart): Backend processing architecture with services, APIs, databases
               - frontend_diagram (flowchart): Frontend UI architecture with components, state, routing
               - sequence_diagrams (array of 3-5 diagrams): Different user flows and scenarios
            2. System diagram shows high-level architecture components
            3. Backend diagram shows detailed backend services, processing engine, storage layers
            4. Frontend diagram shows UI layers, components, state management, API communication
            5. Sequence diagrams show DIFFERENT user scenarios:
               - Each diagram should have a unique "name" and "description"
               - Cover key user flows (e.g., login, create resource, update, delete, sync, notification)
               - Show happy path for each scenario
               - Include 3-5 different flows based on the project requirements
            6. Use proper Mermaid syntax - NO syntax errors allowed
            7. Format tech_stack as nested objects (not arrays)
            8. Each API principle must have "principle" and "description" fields
            9. Output ONLY valid JSON, no markdown code blocks
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def design_architecture(self, requirements: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        prompt = f"Design the software architecture for these requirements: {json.dumps(requirements)}"
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Use robust JSON parsing
        return parse_json_response(response)
