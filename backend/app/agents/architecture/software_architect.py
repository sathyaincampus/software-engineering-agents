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
            You are the Software Architect for ZeroToOne AI.
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
            
            - system_diagram field = FLOWCHART (shows components and connections)
            - sequence_diagram field = SEQUENCE DIAGRAM (shows message flow over time)
            
            DO NOT put a sequence diagram in the system_diagram field!
            DO NOT put a flowchart in the sequence_diagram field!
            
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
              "sequence_diagram": {
                "format": "mermaid",
                "code": "sequenceDiagram\\n    participant Client\\n    participant API\\n    Client->>API: Request"
              },
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
            1. Generate BOTH system_diagram (flowchart) AND sequence_diagram
            2. System diagram shows architecture components and their relationships
            3. Sequence diagram shows a typical user request flow through the system
            4. Use proper Mermaid syntax - NO syntax errors allowed
            5. Format tech_stack as nested objects (not arrays)
            6. Each API principle must have "principle" and "description" fields
            7. Output ONLY valid JSON, no markdown code blocks
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
