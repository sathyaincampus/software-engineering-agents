# SparkToShip - Complete Implementation Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Agent Implementation Details](#agent-implementation-details)
4. [Frontend Development Guide](#frontend-development-guide)
5. [Testing Guide](#testing-guide)
6. [Deployment Guide](#deployment-guide)
7. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **Google Cloud Account**: With Gemini API enabled
- **Git**: For version control

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/sparktoship.git
cd sparktoship

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure environment
cat > .env << EOF
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.0-flash-exp
PROJECT_NAME=SparkToShip AI
EOF

# 4. Start backend
uvicorn app.main:app --reload --port 8000 &

# 5. Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev

# 6. Open browser
# Navigate to http://localhost:5173
```

---

## Step-by-Step Setup

### 1. Google Cloud Setup

#### Enable Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Generative Language API**
4. Navigate to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key (starts with `AIza...`)
7. (Optional) Restrict the API key to Generative Language API only

#### Set Up Billing

1. Navigate to **Billing** in Cloud Console
2. Link a billing account
3. Set up budget alerts (recommended: $50/month for development)

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

#### Verify Installation

```bash
# Check ADK installation
python -c "import google.adk; print(google.adk.__version__)"
# Should print: 1.19.0 or higher

# Check FastAPI installation
python -c "import fastapi; print(fastapi.__version__)"
```

#### Configure Environment

Create `.env` file in `backend/` directory:

```env
# Required
GOOGLE_API_KEY=AIzaSyD...your_actual_key_here

# Optional (with defaults)
MODEL_NAME=gemini-2.0-flash-exp
PROJECT_NAME=SparkToShip AI
```

**Important**: Never commit `.env` to version control!

Add to `.gitignore`:
```
backend/.env
backend/venv/
backend/__pycache__/
backend/data/
```

#### Create Data Directory

```bash
mkdir -p backend/data
# This stores all project artifacts
```

#### Test Backend

```bash
# Start server
uvicorn app.main:app --reload --port 8000

# In another terminal, test API
curl http://localhost:8000/
# Should return: {"message": "SparkToShip AI API"}

# Test session creation
curl -X POST http://localhost:8000/session/start \
  -H "Content-Type: application/json" \
  -d '{"project_name": "Test Project"}'
# Should return session details
```

### 3. Frontend Setup

#### Install Node.js Dependencies

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm list react react-dom vite
```

#### Configure Frontend

Update `src/App.tsx` if backend is not on `localhost:8000`:

```typescript
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

For production, create `.env.production`:
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

#### Test Frontend

```bash
# Start development server
npm run dev

# Should output:
# VITE v4.5.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

Open browser to `http://localhost:5173`

### 4. Verify Full Stack

#### Test Complete Workflow

1. **Open Frontend**: Navigate to `http://localhost:5173`
2. **Create Project**: Click "New Project", enter name
3. **Generate Ideas**: Enter keywords like "task management app"
4. **Check Backend Logs**: Should see agent execution logs
5. **Verify Storage**: Check `backend/data/{session_id}/` for artifacts

---

## Agent Implementation Details

### Creating a New Agent

#### Step 1: Define Agent Class

Create file: `backend/app/agents/your_category/your_agent.py`

```python
from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service
from typing import Dict, Any
import json

class YourAgent:
    def __init__(self):
        # Initialize Gemini model
        self.model = Gemini(model=settings.MODEL_NAME)
        
        # Create agent with instructions
        self.agent = Agent(
            name="your_agent",
            model=self.model,
            description="Brief description of agent's purpose",
            instruction="""
            You are the [Agent Name] for SparkToShip AI.
            
            Your responsibilities:
            1. [Responsibility 1]
            2. [Responsibility 2]
            
            Input format:
            - [Input description]
            
            Output format:
            - [Output description]
            - Must be valid JSON
            
            Example output:
            {
                "key": "value"
            }
            """
        )
        
        # Create app and runner
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)
    
    async def execute_task(self, input_data: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        """
        Execute the agent's main task.
        
        Args:
            input_data: Input parameters for the task
            session_id: Project session ID
            
        Returns:
            Dict containing task results
        """
        # Construct prompt
        prompt = f"Process this input: {json.dumps(input_data)}"
        
        # Import helper functions
        from app.utils.adk_helper import collect_response, parse_json_response
        
        # Create Content object
        message = Content(parts=[Part(text=prompt)])
        
        # Run agent
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        # Parse JSON response
        result = parse_json_response(response)
        
        return result
```

#### Step 2: Register Agent

In `backend/app/main.py`:

```python
# Import your agent
from app.agents.your_category.your_agent import YourAgent

# Initialize agent
your_agent = YourAgent()

# Register with orchestrator
orchestrator.register_agent("your_agent", your_agent)
```

#### Step 3: Create API Endpoint

In `backend/app/main.py`:

```python
class YourAgentRequest(BaseModel):
    input_field: str
    # Add other fields as needed

@app.post("/agents/your-agent/{session_id}")
async def run_your_agent(session_id: str, request: YourAgentRequest):
    """
    Execute your agent.
    
    Args:
        session_id: Project session ID
        request: Input parameters
        
    Returns:
        Agent execution results
    """
    try:
        # Get or restore session
        session = orchestrator.get_or_restore_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Execute agent
        result = await your_agent.execute_task(
            input_data=request.dict(),
            session_id=session_id
        )
        
        # Save artifact
        from app.services.project_storage import project_storage
        project_storage.save_artifact(
            session_id=session_id,
            artifact_name="your_artifact.json",
            content=json.dumps(result, indent=2)
        )
        
        # Update session
        session.add_log(f"Your agent completed successfully")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in your_agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

#### Step 4: Test Agent

```bash
# Test endpoint
curl -X POST http://localhost:8000/agents/your-agent/test-session-id \
  -H "Content-Type: application/json" \
  -d '{"input_field": "test value"}'
```

### Agent Best Practices

#### 1. Prompt Engineering

**Good Prompt Structure:**
```
You are the [Role] for SparkToShip AI.

Context:
[Provide relevant context about the project]

Your task:
[Specific, actionable task description]

Input format:
[Describe expected input structure]

Output requirements:
1. Must be valid JSON
2. Include all required fields
3. Follow this schema: {...}

Example:
[Provide concrete example]

Important notes:
- [Critical constraint 1]
- [Critical constraint 2]
```

**Bad Prompt:**
```
Generate some code for the user.
```

#### 2. Error Handling

```python
async def execute_task(self, input_data: Dict, session_id: str) -> Dict:
    try:
        # Validate input
        if not input_data.get('required_field'):
            raise ValueError("Missing required_field")
        
        # Execute task
        result = await self._process(input_data, session_id)
        
        # Validate output
        if not self._is_valid_output(result):
            raise ValueError("Invalid output format")
        
        return result
        
    except Exception as e:
        logger.error(f"Agent error: {str(e)}", exc_info=True)
        # Return error in consistent format
        return {
            "error": str(e),
            "status": "failed"
        }

def _is_valid_output(self, result: Dict) -> bool:
    """Validate output structure"""
    required_keys = ['key1', 'key2']
    return all(key in result for key in required_keys)
```

#### 3. Response Parsing

Use the helper function from `app/utils/adk_helper.py`:

```python
from app.utils.adk_helper import parse_json_response

# Handles:
# - Markdown code blocks (```json ... ```)
# - Malformed JSON
# - Non-JSON responses
# - Nested structures

result = parse_json_response(raw_response)
```

#### 4. Session Management

```python
# Always use get_or_restore_session
session = orchestrator.get_or_restore_session(session_id)

# Add logs for debugging
session.add_log(f"Starting task: {task_name}")

# Update session phase
session.current_phase = "engineering"

# Save artifacts
project_storage.save_artifact(session_id, "artifact.json", content)
```

---

## Frontend Development Guide

### Creating a New Component

#### Step 1: Create Component File

Create `frontend/src/components/YourComponent.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface YourComponentProps {
  sessionId: string;
  onComplete?: (result: any) => void;
}

const YourComponent: React.FC<YourComponentProps> = ({ sessionId, onComplete }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Your Component</h2>
      {/* Render your data */}
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default YourComponent;
```

#### Step 2: Add to Parent Component

In `frontend/src/pages/MissionControl.tsx`:

```typescript
import YourComponent from '../components/YourComponent';

// Inside component:
<YourComponent 
  sessionId={sessionId} 
  onComplete={(result) => {
    console.log('Component completed:', result);
    // Update state, move to next step, etc.
  }}
/>
```

### Styling Guidelines

#### Use TailwindCSS Utilities

```tsx
// Good: Utility classes
<div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">
  <span className="text-lg font-semibold">Title</span>
  <button className="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
    Action
  </button>
</div>

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '16px', backgroundColor: '#3b82f6' }}>
  ...
</div>
```

#### Responsive Design

```tsx
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {/* Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

#### Dark Mode Support

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  {/* Automatically adapts to system theme */}
</div>
```

### State Management

#### Local State (useState)

```typescript
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

#### Global State (Context)

Create `frontend/src/context/YourContext.tsx`:

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YourContextType {
  value: string;
  setValue: (value: string) => void;
}

const YourContext = createContext<YourContextType | undefined>(undefined);

export const YourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [value, setValue] = useState('');

  return (
    <YourContext.Provider value={{ value, setValue }}>
      {children}
    </YourContext.Provider>
  );
};

export const useYourContext = () => {
  const context = useContext(YourContext);
  if (!context) {
    throw new Error('useYourContext must be used within YourProvider');
  }
  return context;
};
```

Use in components:

```typescript
import { useYourContext } from '../context/YourContext';

const MyComponent = () => {
  const { value, setValue } = useYourContext();
  
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
};
```

### API Integration

#### Create API Service

Create `frontend/src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Session
  createSession: async (projectName: string) => {
    const response = await axios.post(`${API_BASE_URL}/session/start`, {
      project_name: projectName
    });
    return response.data;
  },

  // Agents
  generateIdeas: async (sessionId: string, keywords: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/agents/idea-generator/${sessionId}`,
      { keywords }
    );
    return response.data;
  },

  // Add more API methods...
};
```

Use in components:

```typescript
import { api } from '../services/api';

const handleGenerateIdeas = async () => {
  try {
    const result = await api.generateIdeas(sessionId, keywords);
    setIdeas(result.ideas);
  } catch (error) {
    console.error('Error generating ideas:', error);
  }
};
```

---

## Testing Guide

### Backend Testing

#### Unit Tests

Create `backend/tests/test_agents.py`:

```python
import pytest
from app.agents.strategy.idea_generator import IdeaGeneratorAgent

@pytest.mark.asyncio
async def test_idea_generator():
    agent = IdeaGeneratorAgent()
    result = await agent.generate_ideas(
        keywords="task management app",
        session_id="test-session"
    )
    
    assert "ideas" in result
    assert len(result["ideas"]) == 5
    assert "title" in result["ideas"][0]
```

#### Integration Tests

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_session():
    response = client.post("/session/start", json={
        "project_name": "Test Project"
    })
    assert response.status_code == 200
    assert "session_id" in response.json()

def test_generate_ideas():
    # Create session
    session_response = client.post("/session/start", json={
        "project_name": "Test"
    })
    session_id = session_response.json()["session_id"]
    
    # Generate ideas
    ideas_response = client.post(
        f"/agents/idea-generator/{session_id}",
        json={"keywords": "test app"}
    )
    assert ideas_response.status_code == 200
    assert "ideas" in ideas_response.json()
```

#### Run Tests

```bash
# Install pytest
pip install pytest pytest-asyncio

# Run all tests
pytest backend/tests/

# Run specific test
pytest backend/tests/test_agents.py::test_idea_generator

# Run with coverage
pytest --cov=app backend/tests/
```

### Frontend Testing

#### Component Tests

Create `frontend/src/components/__tests__/YourComponent.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent sessionId="test-id" />);
    expect(screen.getByText('Your Component')).toBeInTheDocument();
  });

  it('handles button click', () => {
    const onComplete = jest.fn();
    render(<YourComponent sessionId="test-id" onComplete={onComplete} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onComplete).toHaveBeenCalled();
  });
});
```

#### Run Tests

```bash
# Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm run test

# Run with coverage
npm run test -- --coverage
```

---

## Deployment Guide

### Production Checklist

- [ ] Environment variables configured
- [ ] API keys secured (not in code)
- [ ] CORS origins restricted
- [ ] Error logging enabled
- [ ] Rate limiting implemented
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Frontend built for production
- [ ] Backend running with production ASGI server

### Deploy to Google Cloud

#### Backend (Cloud Run)

```bash
# 1. Create Dockerfile
cat > backend/Dockerfile << EOF
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

# 2. Build and deploy
gcloud run deploy sparktoship-backend \
  --source backend/ \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY,MODEL_NAME=gemini-2.0-flash-exp

# 3. Get service URL
gcloud run services describe sparktoship-backend --region us-central1 --format 'value(status.url)'
```

#### Frontend (Firebase Hosting)

```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Initialize project
cd frontend
firebase init hosting

# 4. Build frontend
npm run build

# 5. Deploy
firebase deploy --only hosting

# 6. Get hosting URL
firebase hosting:channel:list
```

### Deploy to AWS

#### Backend (Elastic Beanstalk)

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
cd backend
eb init -p python-3.10 sparktoship-backend

# 3. Create environment
eb create sparktoship-env

# 4. Set environment variables
eb setenv GOOGLE_API_KEY=$GOOGLE_API_KEY MODEL_NAME=gemini-2.0-flash-exp

# 5. Deploy
eb deploy
```

#### Frontend (S3 + CloudFront)

```bash
# 1. Build
cd frontend
npm run build

# 2. Create S3 bucket
aws s3 mb s3://sparktoship-frontend

# 3. Upload files
aws s3 sync dist/ s3://sparktoship-frontend --acl public-read

# 4. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name sparktoship-frontend.s3.amazonaws.com
```

---

## Best Practices

### Code Quality

1. **Type Hints (Python)**
   ```python
   def process_data(input: Dict[str, Any]) -> List[str]:
       return list(input.keys())
   ```

2. **TypeScript Strict Mode**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true
     }
   }
   ```

3. **Linting**
   ```bash
   # Python
   pip install black flake8
   black backend/app/
   flake8 backend/app/
   
   # TypeScript
   npm run lint
   ```

### Performance

1. **Async/Await**
   ```python
   # Good
   async def fetch_data():
       result = await api_call()
       return result
   
   # Bad
   def fetch_data():
       result = api_call()  # Blocking
       return result
   ```

2. **Memoization**
   ```typescript
   const expensiveComputation = useMemo(() => {
     return processLargeData(data);
   }, [data]);
   ```

3. **Lazy Loading**
   ```typescript
   const LazyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

### Security

1. **Input Validation**
   ```python
   from pydantic import BaseModel, validator
   
   class UserInput(BaseModel):
       email: str
       
       @validator('email')
       def validate_email(cls, v):
           if '@' not in v:
               raise ValueError('Invalid email')
           return v
   ```

2. **Environment Variables**
   ```python
   # Never do this
   API_KEY = "AIzaSy..."
   
   # Always do this
   API_KEY = os.getenv("GOOGLE_API_KEY")
   ```

3. **CORS Configuration**
   ```python
   # Production
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://yourdomain.com"],
       allow_credentials=True,
       allow_methods=["GET", "POST"],
       allow_headers=["*"],
   )
   ```

---

## Troubleshooting Common Issues

### Issue: Agent returns malformed JSON

**Solution**: Update prompt to enforce JSON format:
```python
instruction="""
...
CRITICAL: Your response MUST be valid JSON. Do not include any text outside the JSON object.

Example:
{
  "key": "value"
}
"""
```

### Issue: Frontend can't connect to backend

**Solution**: Check CORS and network:
```bash
# Test backend directly
curl http://localhost:8000/

# Check CORS headers
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:8000/session/start -v
```

### Issue: Session not persisting

**Solution**: Verify data directory exists:
```bash
mkdir -p backend/data
chmod 755 backend/data
```

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
