# Google ADK Implementation Guide

## Overview
This project uses **Google Agent Development Kit (ADK)** to build a multi-agent software engineering system. This guide explains the proper ADK patterns used.

## Key ADK Concepts

### 1. **Agent** - The AI Worker
An `Agent` is a single AI entity with a specific role and instruction set.

```python
from google.adk import Agent
from google.adk.models import Gemini

agent = Agent(
    name="idea_generator",
    model=Gemini(model="gemini-2.0-flash-exp"),
    description="Generates application ideas",
    instruction="You are an idea generator..."
)
```

### 2. **App** - The Container
An `App` wraps one or more agents and provides a unified interface.

```python
from google.adk.apps import App

app = App(
    name="zero_to_one",
    root_agent=agent
)
```

### 3. **Session** - The Conversation State
A `Session` maintains conversation history and state across multiple interactions.

```python
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()

# Create a session
session_service.create_session_sync(
    app_name="zero_to_one",
    user_id="user",
    session_id="unique-session-id"
)
```

### 4. **Runner** - The Executor
A `Runner` executes the app/agent and manages the session lifecycle.

```python
from google.adk import Runner

runner = Runner(
    app=app,
    session_service=session_service
)

# Run the agent
async for event in runner.run_async(
    user_id="user",
    session_id="session-id",
    new_message=Content(parts=[Part(text="Hello")])
):
    # Process events
    pass
```

## Architecture Pattern

```
┌─────────────────────────────────────────────────┐
│                  FastAPI App                     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              Orchestrator                        │
│  - Manages ProjectSessions                       │
│  - Creates ADK Sessions                          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         InMemorySessionService                   │
│  (Shared across all agents)                      │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐            ┌──────────────┐
│   Agent 1    │            │   Agent 2    │
│   (App)      │            │   (App)      │
│   Runner     │            │   Runner     │
└──────────────┘            └──────────────┘
```

## Event Streaming

ADK uses event streaming for responses. Events contain the model's output in chunks.

```python
async def collect_response(async_gen):
    """Collect all events from the async generator"""
    full_response = ""
    async for event in async_gen:
        if hasattr(event, 'content') and event.content:
            if hasattr(event.content, 'parts'):
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        full_response += part.text
            elif isinstance(event.content, str):
                full_response += event.content
        elif hasattr(event, 'text') and event.text:
            full_response += event.text
    return full_response
```

## Session Management

**Critical**: All agents must share the same `app_name` and use the same `session_service`.

1. **Create Session Once** (in Orchestrator):
```python
session_service.create_session_sync(
    app_name="zero_to_one",
    user_id="user",
    session_id=session_id
)
```

2. **Use Session in Agents**:
```python
runner.run_async(
    user_id="user",
    session_id=session_id,  # Same ID from step 1
    new_message=Content(parts=[Part(text=prompt)])
)
```

## Message Format

ADK expects messages in the `Content` format:

```python
from google.genai.types import Content, Part

message = Content(parts=[Part(text="Your prompt here")])
```

## Common Errors and Solutions

### Error: "Session not found"
**Cause**: Session wasn't created or app_name mismatch
**Solution**: Ensure session is created with correct app_name before calling runner

### Error: "'async_generator' object can't be awaited"
**Cause**: Trying to await the generator directly
**Solution**: Use `async for` to iterate over events

### Error: "'str' object has no attribute 'model_copy'"
**Cause**: Passing string instead of InvocationContext
**Solution**: Use Runner.run_async() with proper parameters, not Agent.run_async()

## Telemetry (Optional)

ADK includes built-in telemetry for debugging:

```python
from google.adk.telemetry import tracer

# Telemetry is automatically enabled
# Check logs for trace information
```

## Best Practices

1. **One SessionService per Application**: Share it across all agents
2. **One App Name**: Use the same app_name for all agents
3. **Session Creation**: Create sessions in the orchestrator, not in agents
4. **Event Processing**: Always use async iteration to consume events
5. **Error Handling**: Wrap agent calls in try/except for robust error handling

## Example: Complete Agent Implementation

```python
from google.adk import Agent, Runner
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai.types import Content, Part
from app.core.config import settings
from app.core.services import session_service

class IdeaGeneratorAgent:
    def __init__(self):
        self.model = Gemini(model=settings.MODEL_NAME)
        self.agent = Agent(
            name="idea_generator",
            model=self.model,
            description="Generates application ideas",
            instruction="You are an idea generator..."
        )
        self.app = App(name="zero_to_one", root_agent=self.agent)
        self.runner = Runner(app=self.app, session_service=session_service)

    async def generate_ideas(self, keywords: str, session_id: str):
        from app.utils.adk_helper import collect_response
        
        message = Content(parts=[Part(text=f"Generate ideas for: {keywords}")])
        
        response = await collect_response(self.runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message
        ))
        
        return response
```

## References

- [Google ADK Documentation](https://github.com/google/adk)
- [Kaggle ADK Examples](https://www.kaggle.com/code)
