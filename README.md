# ZeroToOne AI - Multi-Agent Software Engineering Platform

A production-ready multi-agent system built with **Google Agent Development Kit (ADK)** that automates the entire software development lifecycle from idea generation to code implementation.

## 🎯 Overview

This platform uses specialized AI agents to:
1. **Generate Ideas** - Brainstorm application concepts
2. **Create PRDs** - Write detailed product requirements
3. **Analyze Requirements** - Extract user stories
4. **Design Architecture** - Plan system architecture and tech stack
5. **Design UI/UX** - Create wireframes and design systems
6. **Plan Sprints** - Break down work into tasks
7. **Write Code** - Generate backend and frontend code
8. **Review Code** - Perform QA and suggest improvements

## 🏗️ Architecture

```
Frontend (React + Vite)
        ↓
FastAPI Backend
        ↓
   Orchestrator
        ↓
ADK Session Service (Shared)
        ↓
┌───────┴───────┐
│   9 Agents    │
│  (Each with   │
│   App+Runner) │
└───────────────┘
```

## 📋 Prerequisites

- **Python 3.14+**
- **Node.js 22+**
- **Google AI API Key** ([Get one here](https://aistudio.google.com/app/apikey))

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Run backend
uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

### 3. Access the Application

Open your browser to: **http://localhost:5174**

## 🔑 Environment Variables

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_google_ai_api_key_here
MODEL_NAME=gemini-2.0-flash-exp
PROJECT_NAME=ZeroToOne AI
```

## 📖 ADK Implementation

This project follows Google ADK best practices:

### Key Components

1. **Session Service** - Shared `InMemorySessionService` across all agents
2. **App** - Each agent wrapped in an `App` with name "zero_to_one"
3. **Runner** - Executes agents with proper session management
4. **Event Streaming** - Async generators for real-time responses

### Agent Structure

```python
class IdeaGeneratorAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="idea_generator",
            model=self.model,
            description="...",
            instruction="..."
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_ideas(self, keywords: str, session_id: str):
        message = Content(parts=[Part(text=f"Generate ideas for: {keywords}")])
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        return response
```

## 🧪 Testing

```bash
cd backend
python3 test_adk_implementation.py
```

## 📚 Documentation

- **[ADK Implementation Guide](./ADK_IMPLEMENTATION_GUIDE.md)** - Detailed ADK patterns and best practices
- **[Implementation Guide](./implementation-guide.md)** - Original project setup guide

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Google ADK** - Agent orchestration
- **Gemini 2.0 Flash** - LLM model
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **ReactFlow** - Architecture diagrams

## 📁 Project Structure

```
software-engineering-agents/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── strategy/          # Idea, PRD, Analysis agents
│   │   │   ├── architecture/      # Architect, UX agents
│   │   │   └── engineering/       # Manager, Dev, QA agents
│   │   ├── core/
│   │   │   ├── config.py          # Configuration
│   │   │   ├── orchestrator.py    # Session management
│   │   │   └── services.py        # Shared session service
│   │   ├── utils/
│   │   │   └── adk_helper.py      # Event collection utility
│   │   └── main.py                # FastAPI app
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/                 # React pages
│   │   ├── layouts/               # Layout components
│   │   └── index.css              # Global styles
│   └── package.json
└── ADK_IMPLEMENTATION_GUIDE.md
```

## 🐛 Troubleshooting

### "Session not found" Error
- **Cause**: Session wasn't created or app_name mismatch
- **Fix**: Ensure `orchestrator.create_session()` is called before agent invocation

### "'async_generator' object can't be awaited"
- **Cause**: Trying to await the generator directly
- **Fix**: Use `collect_response()` helper function

### "Missing key inputs argument"
- **Cause**: GOOGLE_API_KEY not set
- **Fix**: Add your API key to `backend/.env`

## 🔄 Workflow

1. **Start Session** → Creates ADK session
2. **Generate Ideas** → IdeaGeneratorAgent
3. **Select Idea** → User chooses one
4. **Generate PRD** → ProductRequirementsAgent
5. **Analyze PRD** → RequirementAnalysisAgent
6. **Design Architecture** → SoftwareArchitectAgent
7. **Design UI/UX** → UXDesignerAgent
8. **Create Sprint Plan** → EngineeringManagerAgent
9. **Write Code** → BackendDevAgent + FrontendDevAgent
10. **Review Code** → QAAgent

## 📝 API Endpoints

- `POST /session/start` - Initialize project session
- `GET /session/{session_id}` - Get session details
- `POST /agent/idea_generator/run` - Generate ideas
- `POST /agent/product_requirements/run` - Generate PRD
- `POST /agent/requirement_analysis/run` - Analyze requirements
- `POST /agent/software_architect/run` - Design architecture
- `POST /agent/ux_designer/run` - Design UI/UX
- `POST /agent/engineering_manager/run` - Create sprint plan
- `POST /agent/backend_dev/run` - Write backend code
- `POST /agent/frontend_dev/run` - Write frontend code
- `POST /agent/qa_agent/run` - Review code

## 🤝 Contributing

This is a demonstration project showcasing Google ADK capabilities. Feel free to fork and extend!

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [Google Agent Development Kit (ADK)](https://github.com/google/adk)
- Powered by [Gemini 2.0](https://deepmind.google/technologies/gemini/)
- Inspired by modern software engineering practices

---

**Note**: This project requires a Google AI API key. Get yours at [Google AI Studio](https://aistudio.google.com/app/apikey).
