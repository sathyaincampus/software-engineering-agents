# ADK Deployment Knowledge Base

## Overview

This document consolidates deployment knowledge for Google ADK (Agent Development Kit) applications, specifically for SparkToShip and future projects.

---

## Table of Contents

1. [ADK Core Concepts](#adk-core-concepts)
2. [Deployment Patterns](#deployment-patterns)
3. [Kaggle Notebooks Reference](#kaggle-notebooks-reference)
4. [Best Practices](#best-practices)
5. [Common Pitfalls](#common-pitfalls)
6. [Future Project Template](#future-project-template)

---

## ADK Core Concepts

### What is Google ADK?

Google's Agent Development Kit (ADK) is a framework for building AI agent applications powered by Gemini models. Key components:

- **Agent**: An AI entity with a specific role and instructions
- **App**: Container for agents and their interactions
- **Runner**: Executes agent tasks and manages sessions
- **Session Service**: Maintains conversation state and context
- **Model**: The underlying Gemini model (Flash, Pro, etc.)

### ADK Architecture for Production

```python
from google import adk
from google.adk.models import Gemini
from google.adk.agents import Agent
from google.adk.app import App
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

# 1. Create session service (stateful)
session_service = InMemorySessionService()

# 2. Initialize model
model = Gemini(
    model="gemini-2.0-flash-exp",
    api_key=os.getenv("GOOGLE_API_KEY")
)

# 3. Define agent
agent = Agent(
    name="my_agent",
    model=model,
    description="Agent purpose",
    instruction="Detailed system prompt"
)

# 4. Create app
app = App(name="my_app", root_agent=agent)

# 5. Create runner
runner = Runner(app=app, session_service=session_service)

# 6. Execute tasks
async def execute_task(user_input: str, session_id: str):
    response = await runner.run(
        user_input=user_input,
        session_id=session_id
    )
    return response
```

---

## Deployment Patterns

### Pattern 1: Serverless (Cloud Run)

**Best for**: Low to moderate traffic, cost-sensitive deployments

**Architecture**:
```
User → Load Balancer → Cloud Run (ADK App) → Gemini API
```

**Pros**:
- Pay-per-use pricing
- Auto-scaling (0 to N instances)
- No server management
- Fast cold starts with ADK

**Cons**:
- Cold start latency (mitigated with min-instances)
- Stateless (need external session storage)
- 300s request timeout

**Deployment**:
```bash
gcloud run deploy my-adk-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GEMINI_KEY \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

---

### Pattern 2: Containerized (GKE)

**Best for**: High traffic, complex orchestration, multi-tenant

**Architecture**:
```
User → Ingress → GKE Pods (ADK App) → Gemini API
                     ↓
                 Firestore (Sessions)
```

**Pros**:
- Full control over infrastructure
- Persistent connections
- Advanced networking
- Horizontal pod autoscaling

**Cons**:
- Higher cost (always-on nodes)
- More complex setup
- Requires Kubernetes knowledge

**Deployment**:
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adk-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: adk-app
  template:
    metadata:
      labels:
        app: adk-app
    spec:
      containers:
      - name: adk-app
        image: gcr.io/project/adk-app:latest
        env:
        - name: GOOGLE_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
```

---

### Pattern 3: Hybrid (Cloud Run + Firestore)

**Best for**: SparkToShip - serverless backend with persistent state

**Architecture**:
```
User → Load Balancer → Cloud Run (ADK App) ← Firestore (Sessions)
                            ↓
                        Gemini API
```

**Session Management**:
```python
from google.cloud import firestore

class FirestoreSessionService:
    def __init__(self):
        self.db = firestore.Client()
    
    async def create_session(self, session_id: str, data: dict):
        doc_ref = self.db.collection('sessions').document(session_id)
        doc_ref.set(data)
    
    async def get_session(self, session_id: str):
        doc_ref = self.db.collection('sessions').document(session_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None
    
    async def update_session(self, session_id: str, data: dict):
        doc_ref = self.db.collection('sessions').document(session_id)
        doc_ref.update(data)
```

---

## Kaggle Notebooks Reference

### Note on Kaggle Notebooks

**Important**: The user mentioned 10 Kaggle notebooks with ADK deployment instructions, but these were not found in the conversation history or project files. 

If you have these notebooks, please:
1. Share the Kaggle notebook URLs
2. Or export them as `.ipynb` files
3. Place them in a `notebooks/` directory in this project

### Expected Notebook Topics (Based on ADK Documentation)

1. **ADK Quickstart**: Basic agent setup and execution
2. **Multi-Agent Systems**: Orchestrating multiple agents
3. **Session Management**: Persistent conversations
4. **Cloud Deployment**: Deploying to Cloud Run
5. **Firestore Integration**: Using Firestore for state
6. **Streaming Responses**: Real-time agent outputs
7. **Error Handling**: Retry logic and fallbacks
8. **Cost Optimization**: Efficient API usage
9. **Security**: API key management and authentication
10. **Monitoring**: Logging and observability

### Recommended Kaggle Resources

- [Google ADK Official Docs](https://ai.google.dev/adk)
- [Gemini API Cookbook](https://github.com/google-gemini/cookbook)
- [ADK Examples Repository](https://github.com/google/adk-examples)

---

## Best Practices

### 1. API Key Management

**❌ Don't**:
```python
model = Gemini(model="gemini-2.0-flash-exp", api_key="AIza...")
```

**✅ Do**:
```python
import os
from google.cloud import secretmanager

def get_api_key():
    if os.getenv("ENV") == "production":
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{PROJECT_ID}/secrets/gemini-api-key/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    else:
        return os.getenv("GOOGLE_API_KEY")

model = Gemini(model="gemini-2.0-flash-exp", api_key=get_api_key())
```

---

### 2. Session Persistence

**For Production**: Use Firestore or Cloud SQL, not in-memory

```python
# Development
session_service = InMemorySessionService()

# Production
session_service = FirestoreSessionService(project_id="my-project")
```

---

### 3. Error Handling

**Implement retry logic for Gemini API calls**:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def call_gemini_with_retry(runner, user_input, session_id):
    try:
        response = await runner.run(
            user_input=user_input,
            session_id=session_id
        )
        return response
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise
```

---

### 4. Cost Optimization

**Use appropriate models**:
- **Gemini 2.0 Flash**: Fast, cheap, good for simple tasks
- **Gemini 2.5 Pro**: Expensive, best for complex reasoning

**Implement caching**:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_response(prompt_hash: str):
    # Check if response exists in cache
    pass
```

**Monitor token usage**:
```python
response = await runner.run(user_input=user_input, session_id=session_id)
tokens_used = response.usage.total_tokens
cost = tokens_used * 0.00001  # Example pricing
logger.info(f"Tokens: {tokens_used}, Cost: ${cost:.4f}")
```

---

### 5. Streaming Responses

**For better UX, stream agent responses**:

```python
async def stream_agent_response(user_input: str, session_id: str):
    async for chunk in runner.stream(
        user_input=user_input,
        session_id=session_id
    ):
        yield chunk.text
```

**FastAPI endpoint**:
```python
from fastapi.responses import StreamingResponse

@app.post("/agents/stream/{session_id}")
async def stream_response(session_id: str, request: dict):
    return StreamingResponse(
        stream_agent_response(request["input"], session_id),
        media_type="text/event-stream"
    )
```

---

## Common Pitfalls

### 1. Session ID Collisions

**Problem**: Using predictable session IDs

**Solution**: Use UUIDs
```python
import uuid
session_id = str(uuid.uuid4())
```

---

### 2. Memory Leaks with InMemorySessionService

**Problem**: Sessions never expire, memory grows indefinitely

**Solution**: Implement TTL
```python
from datetime import datetime, timedelta

class TTLSessionService(InMemorySessionService):
    def __init__(self, ttl_hours=24):
        super().__init__()
        self.ttl = timedelta(hours=ttl_hours)
        self.session_timestamps = {}
    
    async def create_session(self, session_id, data):
        await super().create_session(session_id, data)
        self.session_timestamps[session_id] = datetime.now()
    
    async def cleanup_expired_sessions(self):
        now = datetime.now()
        expired = [
            sid for sid, ts in self.session_timestamps.items()
            if now - ts > self.ttl
        ]
        for sid in expired:
            await self.delete_session(sid)
            del self.session_timestamps[sid]
```

---

### 3. Not Handling Gemini API Rate Limits

**Problem**: Hitting rate limits (60 requests/minute for free tier)

**Solution**: Implement rate limiting
```python
from aiolimiter import AsyncLimiter

rate_limiter = AsyncLimiter(max_rate=50, time_period=60)

async def rate_limited_call(runner, user_input, session_id):
    async with rate_limiter:
        return await runner.run(user_input=user_input, session_id=session_id)
```

---

### 4. Ignoring Cold Starts

**Problem**: First request takes 5-10 seconds on Cloud Run

**Solution**: Set min-instances or implement warmup
```bash
# Set min-instances to 1 for critical services
gcloud run services update my-service --min-instances=1

# Or implement a warmup endpoint
@app.get("/warmup")
async def warmup():
    # Pre-load models, initialize connections
    return {"status": "warm"}
```

---

## Future Project Template

### Directory Structure

```
my-adk-project/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   └── my_agent.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── model_factory.py
│   │   │   └── session_service.py
│   │   ├── services/
│   │   │   └── storage.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── notebooks/
│   └── adk_experiments.ipynb
├── .github/
│   └── workflows/
│       └── deploy.yml
├── terraform/
│   ├── main.tf
│   └── variables.tf
├── README.md
└── DEPLOYMENT_GUIDE.md
```

---

### Minimal ADK Backend Template

**`backend/app/main.py`**:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from google.adk.models import Gemini
from google.adk.agents import Agent
from google.adk.app import App
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

app = FastAPI(title="My ADK App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ADK components
session_service = InMemorySessionService()
model = Gemini(
    model=os.getenv("MODEL_NAME", "gemini-2.0-flash-exp"),
    api_key=os.getenv("GOOGLE_API_KEY")
)

agent = Agent(
    name="assistant",
    model=model,
    description="A helpful AI assistant",
    instruction="You are a helpful assistant. Provide clear, concise answers."
)

adk_app = App(name="my_app", root_agent=agent)
runner = Runner(app=adk_app, session_service=session_service)

class ChatRequest(BaseModel):
    message: str
    session_id: str

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await runner.run(
            user_input=request.message,
            session_id=request.session_id
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Deployment Checklist

- [ ] Environment variables configured (`.env` or Secret Manager)
- [ ] Dockerfile optimized (multi-stage build, minimal image)
- [ ] CORS configured for production domain
- [ ] Health check endpoint implemented
- [ ] Error handling and logging in place
- [ ] Session persistence strategy chosen (in-memory vs Firestore)
- [ ] Rate limiting implemented
- [ ] Monitoring and alerts configured
- [ ] CI/CD pipeline set up (GitHub Actions, Cloud Build)
- [ ] Domain and SSL configured
- [ ] Backup and disaster recovery plan
- [ ] Cost monitoring and budgets set

---

## Resources

### Official Documentation
- [Google ADK Docs](https://ai.google.dev/adk)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Firestore Docs](https://cloud.google.com/firestore/docs)

### Community
- [ADK GitHub Discussions](https://github.com/google/adk/discussions)
- [r/GoogleCloud](https://reddit.com/r/googlecloud)
- [Stack Overflow - google-adk tag](https://stackoverflow.com/questions/tagged/google-adk)

### Tools
- [ADK CLI](https://pypi.org/project/google-adk/)
- [gcloud CLI](https://cloud.google.com/sdk/gcloud)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

---

## Contributing to This Knowledge Base

If you discover new deployment patterns, optimizations, or have Kaggle notebooks to share:

1. Add them to this document
2. Create examples in `notebooks/`
3. Update the deployment guide
4. Share with the community!

---

**Last Updated**: December 1, 2025  
**Maintainer**: SparkToShip Team  
**Version**: 1.0.0

---

## Appendix: Kaggle Notebooks Placeholder

### Notebook 1: [Title]
- **URL**: [Kaggle URL]
- **Topics**: [Topics covered]
- **Key Learnings**: [Summary]

### Notebook 2: [Title]
- **URL**: [Kaggle URL]
- **Topics**: [Topics covered]
- **Key Learnings**: [Summary]

... (Continue for all 10 notebooks once provided)

---

**Note**: Please provide the Kaggle notebook URLs or files so we can populate this section with actual deployment knowledge from those resources.
