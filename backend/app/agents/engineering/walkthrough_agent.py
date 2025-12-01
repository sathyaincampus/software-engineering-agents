from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any, List
import json

class WalkthroughAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="walkthrough_agent",
            model=self.model,
            description="Generates comprehensive code walkthroughs in text, image, or video format.",
            instruction="""
            You are the Code Walkthrough Agent for SparkToShip AI.
            Your goal is to create comprehensive, easy-to-understand walkthroughs of generated code.
            
            You can generate walkthroughs in three formats:
            1. **Text-Based**: Markdown documentation with code explanations
            2. **Image-Based**: Visual diagrams showing code structure and flow
            3. **Video-Based**: Animated explanation scripts (for video generation)
            
            For TEXT-BASED walkthroughs, create:
            - Overview of the codebase structure
            - Explanation of each major component/file
            - Code snippets with inline comments
            - Architecture diagrams (in Mermaid format)
            - Setup and running instructions
            - Key concepts and design patterns used
            
            For IMAGE-BASED walkthroughs, create:
            - Mermaid diagrams for:
              - Component architecture
              - Data flow
              - API endpoints
              - Database schema
              - User flows
            - Visual representations of code structure
            
            **IMPORTANT MERMAID SYNTAX RULES**:
            - Output ONLY the Mermaid code in the diagrams array
            - DO NOT wrap diagrams in ```mermaid code fences
            - Use valid Mermaid syntax for version 10.x
            
            **For ER Diagrams (erDiagram)**:
            - Start with: erDiagram
            - Relationships: ENTITY1 ||--o{ ENTITY2 : "relationship label"
            - Cardinality symbols: ||, }o, }|, |o (see Mermaid docs)
            - Attributes format: type name key
            - Types MUST start with alphabetic character: string, int, bool, datetime, date
            - Keys: PK, FK, UK (or combinations like "PK, FK")
            - Example:
              erDiagram
                  USERS ||--o{ TASKS : creates
                  USERS {
                      string user_id PK
                      string email
                      string password_hash
                      string role
                      string parent_id FK
                  }
                  TASKS {
                      string task_id PK
                      string family_id FK
                      string title
                      string description
                      int points
                  }
            
            **For Flowcharts**:
            - Start with: flowchart TD (or LR, BT, RL)
            - Nodes: A[Label], B(Label), C{Decision}
            - Connections: A --> B, A -- Label --> B
            
            **For Sequence Diagrams**:
            - Start with: sequenceDiagram
            - Participants: participant Name
            - Messages: Name->>OtherName: Message
            - Activations: activate/deactivate
            
            **For Graphs**:
            - Start with: graph TD (or LR, BT, RL)
            - Similar to flowcharts but simpler syntax
            - IMPORTANT: Each connection must be separate
            - CORRECT: A --> B
                A --> C
                A --> D
            - WRONG: A --> B, C, D (this is invalid!)
            - Use individual arrows for each connection
            
            For VIDEO-BASED walkthroughs, create:
            - Scene-by-scene script for animated explanation
            - Timestamps for each section
            - Visual cues and transitions
            - Code highlights and callouts
            - Voiceover script
            
            Output strictly in JSON format with the following structure:
            {
                "walkthrough_type": "text|image|video",
                "title": "Code Walkthrough: [Project Name]",
                "overview": "High-level overview of the project",
                "sections": [
                    {
                        "section_id": "SEC-001",
                        "title": "Project Structure",
                        "content": "Detailed content...",
                        "diagrams": ["mermaid code..."],
                        "code_snippets": [
                            {
                                "file": "path/to/file.js",
                                "language": "javascript",
                                "code": "actual code...",
                                "explanation": "What this code does..."
                            }
                        ],
                        "duration": "2 minutes" // for video
                    }
                ],
                "setup_instructions": {
                    "prerequisites": ["Node.js", "npm"],
                    "installation_steps": ["npm install", "npm run dev"],
                    "environment_variables": ["API_KEY", "DATABASE_URL"]
                },
                "key_concepts": [
                    {
                        "concept": "React Hooks",
                        "explanation": "Used for state management...",
                        "examples": ["useState", "useEffect"]
                    }
                ],
                "estimated_reading_time": "15 minutes",
                "difficulty_level": "Beginner|Intermediate|Advanced"
            }
            """
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_walkthrough(
        self,
        walkthrough_type: str,  # "text", "image", or "video"
        project_data: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Generate a code walkthrough based on the project data.
        
        Args:
            walkthrough_type: Type of walkthrough (text/image/video)
            project_data: Project information including code files, architecture, etc.
            session_id: Session identifier
        
        Returns:
            Walkthrough data in JSON format
        """
        
        # Build prompt based on walkthrough type
        if walkthrough_type == "text":
            format_instructions = """
            Generate a comprehensive TEXT-BASED walkthrough with:
            - Markdown-formatted documentation
            - Code explanations with inline comments
            - Mermaid diagrams for architecture
            - Setup and running instructions
            - Best practices and design patterns
            """
        elif walkthrough_type == "image":
            format_instructions = """
            Generate an IMAGE-BASED walkthrough with:
            - Multiple Mermaid diagrams showing:
              - Component architecture
              - Data flow diagrams
              - API endpoint structure
              - Database schema (if applicable)
              - User interaction flows
            - Visual code structure representations
            - Annotated screenshots descriptions
            """
        elif walkthrough_type == "video":
            format_instructions = """
            Generate a VIDEO-BASED walkthrough script with:
            - Scene-by-scene breakdown
            - Timestamps for each section
            - Voiceover script
            - Visual cues (zoom, highlight, transition)
            - Code walkthrough animations
            - On-screen text and callouts
            """
        else:
            format_instructions = "Generate a text-based walkthrough."
        
        prompt = f"""
        Generate a comprehensive code walkthrough for the following project:
        
        Project Name: {project_data.get('project_name', 'Untitled Project')}
        
        Architecture:
        {json.dumps(project_data.get('architecture', {}), indent=2)}
        
        User Stories:
        {json.dumps(project_data.get('user_stories', []), indent=2)}
        
        Sprint Plan:
        {json.dumps(project_data.get('sprint_plan', []), indent=2)}
        
        Code Files Summary:
        {json.dumps(project_data.get('code_files', {}), indent=2)}
        
        {format_instructions}
        
        Create a walkthrough that:
        1. Explains the overall project structure
        2. Breaks down each major component
        3. Shows how different parts connect
        4. Provides setup and running instructions
        5. Highlights key design decisions
        6. Makes it easy for developers to understand and contribute
        
        Format: {walkthrough_type.upper()}
        """
        
        from app.utils.adk_helper import collect_response, parse_json_response
        
        message = Content(parts=[Part(text=prompt)])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return parse_json_response(response)
