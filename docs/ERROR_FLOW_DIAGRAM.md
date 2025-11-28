# Error Handling Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    MissionControl.tsx                        │ │
│  │                                                              │ │
│  │  runSprint() / retryTask()                                  │ │
│  │    │                                                         │ │
│  │    ├─► POST /agent/backend_dev/run                          │ │
│  │    │   POST /agent/frontend_dev/run                         │ │
│  │    │                                                         │ │
│  │    └─► Check response.data.error                            │ │
│  │         │                                                    │ │
│  │         ├─► error_type === 'rate_limit'                     │ │
│  │         │    └─► Auto-retry with countdown                  │ │
│  │         │                                                    │ │
│  │         ├─► error_type === 'token_exhausted'                │ │
│  │         │    └─► Pause sprint, show suggestion              │ │
│  │         │                                                    │ │
│  │         └─► error_type === 'unknown'                        │ │
│  │              └─► Mark as error, continue                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP POST
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                         main.py                              │ │
│  │                                                              │ │
│  │  @app.post("/agent/backend_dev/run")                        │ │
│  │  @app.post("/agent/frontend_dev/run")                       │ │
│  │    │                                                         │ │
│  │    └─► handle_adk_errors(execute_task)                      │ │
│  │         │                                                    │ │
│  │         └─► Returns structured response:                    │ │
│  │              {                                               │ │
│  │                success: bool,                                │ │
│  │                data: result | null,                          │ │
│  │                error: str | null,                            │ │
│  │                error_type: str,                              │ │
│  │                retry_after: int,                             │ │
│  │                recoverable: bool,                            │ │
│  │                suggestion: str                               │ │
│  │              }                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    error_handler.py                          │ │
│  │                                                              │ │
│  │  handle_adk_errors(func)                                    │ │
│  │    │                                                         │ │
│  │    ├─► Try: await func()                                    │ │
│  │    │                                                         │ │
│  │    └─► Except:                                              │ │
│  │         │                                                    │ │
│  │         ├─► "400 INVALID_ARGUMENT" in error                 │ │
│  │         │    └─► error_type: 'token_exhausted'              │ │
│  │         │        recoverable: false                          │ │
│  │         │                                                    │ │
│  │         ├─► "429 RESOURCE_EXHAUSTED" in error               │ │
│  │         │    └─► error_type: 'rate_limit'                   │ │
│  │         │        retry_after: extracted from error          │ │
│  │         │        recoverable: true                           │ │
│  │         │                                                    │ │
│  │         └─► asyncio.TimeoutError                            │ │
│  │              └─► error_type: 'timeout'                      │ │
│  │                  recoverable: true                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     adk_helper.py                            │ │
│  │                                                              │ │
│  │  collect_response(async_gen)                                │ │
│  │    │                                                         │ │
│  │    └─► Try: async for event in async_gen                    │ │
│  │         │                                                    │ │
│  │         └─► Except:                                         │ │
│  │              ├─► Re-raise if token/rate error               │ │
│  │              └─► Return partial response otherwise          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Agent (backend_dev/frontend_dev)            │ │
│  │                                                              │ │
│  │  write_code(task, context, session_id)                      │ │
│  │    │                                                         │ │
│  │    └─► runner.run_async(...)                                │ │
│  │         │                                                    │ │
│  │         └─► ADK / Gemini API                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GEMINI API (Google)                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Returns:                                                    │ │
│  │    - 200 OK (success)                                        │ │
│  │    - 400 INVALID_ARGUMENT (token limit)                     │ │
│  │    - 429 RESOURCE_EXHAUSTED (rate limit)                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Error Flow Examples

### Example 1: Rate Limit (429)

```
1. Frontend: POST /agent/backend_dev/run
2. Backend: handle_adk_errors(execute_task)
3. Agent: runner.run_async(...)
4. Gemini API: 429 RESOURCE_EXHAUSTED, retry in 60s
5. error_handler: Catches error, extracts retry_after=60
6. Backend: Returns {
     success: false,
     error: "API rate limit exceeded...",
     error_type: "rate_limit",
     retry_after: 60,
     recoverable: true,
     suggestion: "The system will automatically retry..."
   }
7. Frontend: Detects error_type === 'rate_limit'
8. Frontend: Shows countdown "⏳ Retrying in 60 seconds..."
9. Frontend: Auto-retries after countdown
10. Sprint continues
```

### Example 2: Token Exhaustion (400)

```
1. Frontend: POST /agent/backend_dev/run
2. Backend: handle_adk_errors(execute_task)
3. Agent: runner.run_async(...)
4. Gemini API: 400 INVALID_ARGUMENT, token count exceeds 1048576
5. error_handler: Catches error, identifies token_exhausted
6. Backend: Returns {
     success: false,
     error: "Input token limit exceeded...",
     error_type: "token_exhausted",
     recoverable: false,
     suggestion: "Try reducing context or use larger model"
   }
7. Frontend: Detects error_type === 'token_exhausted'
8. Frontend: Shows "🛑 Sprint paused: Token limit exceeded"
9. Frontend: Shows suggestion
10. Sprint STOPS (requires user intervention)
11. State preserved for later resume
```

### Example 3: Success

```
1. Frontend: POST /agent/backend_dev/run
2. Backend: handle_adk_errors(execute_task)
3. Agent: runner.run_async(...)
4. Gemini API: 200 OK, returns generated code
5. adk_helper: collect_response() returns full text
6. Agent: Returns {files: [...], summary: "..."}
7. Backend: Returns {
     success: true,
     data: {files: [...], summary: "..."}
   }
8. Backend: Saves files, marks task complete
9. Frontend: Detects success (no error field)
10. Frontend: Updates UI, shows "✓ TASK-001 completed"
11. Sprint continues to next task
```

## State Preservation

```
┌─────────────────────────────────────────────────────────────────┐
│                      Task Status Flow                           │
└─────────────────────────────────────────────────────────────────┘

Frontend State:
  taskStatuses = {
    "TASK-001": "complete",
    "TASK-002": "error",      ← Error occurred here
    "TASK-003": "pending"
  }
         │
         │ Saved to backend
         ▼
Backend Storage:
  /projects/{session_id}/task_statuses.json
         │
         │ Loaded on page refresh
         ▼
Frontend State (after reload):
  taskStatuses = {
    "TASK-001": "complete",   ← Preserved
    "TASK-002": "error",      ← Preserved
    "TASK-003": "pending"     ← Preserved
  }

User can:
  - Click "Resume Sprint" → Skips TASK-001, retries TASK-002
  - Click "Retry" on TASK-002 → Retries just that task
  - Click "Run" on TASK-003 → Runs just that task
```

## Key Improvements

### Before
```
Error → 500 → Frontend crash → State lost → User frustrated
```

### After
```
Error → Structured response → Frontend handles gracefully → 
State preserved → Auto-retry or pause → User informed → 
Can resume later
```
