# Security & Architecture Guide

## API Key Security ✅

### How API Keys Are Protected

1. **Environment Variables**:
   - API keys are stored in `backend/.env` (NOT tracked by git)
   - `.gitignore` explicitly excludes `.env` files
   - Never hardcoded in source code

2. **Git Protection**:
   ```bash
   # In .gitignore:
   .env
   .env.local
   .env.*.local
   **/.env
   ```

3. **Settings API**:
   - API keys are NEVER returned in GET requests
   - Only a boolean `api_key_set` is exposed
   - Keys are only accepted via POST (not logged)

4. **Best Practices**:
   - ✅ Keys stored in `.env`
   - ✅ `.env` in `.gitignore`
   - ✅ Keys not in responses
   - ✅ Keys not in logs
   - ✅ HTTPS recommended for production

### Verify Your Setup

```bash
# Check .gitignore includes .env
grep ".env" .gitignore

# Verify .env is not tracked
git status backend/.env
# Should show: "not tracked" or nothing

# Check git history doesn't contain keys
git log --all --full-history --source -- "*/.env"
# Should be empty
```

## Settings Usage

### Current Implementation

**Settings are initialized** but agents use the **default model from .env**. Here's the flow:

```
1. App starts → Loads .env → Creates agents with default model
2. User updates settings → app_settings updated
3. Agents continue using original model (not dynamic yet)
```

### Making Settings Dynamic (TODO)

To make agents use updated settings, we need to:

1. **Option A: Recreate Agents** (Simple but requires restart)
2. **Option B: Dynamic Model Injection** (Complex but seamless)

Current implementation uses **Option A** - settings take effect after agent restart.

## Project Storage

### Current State: In-Memory Only

**Projects are NOT persisted** currently. Everything is in-memory:

```
Session Created → Data in RAM → Server Restart → Data Lost
```

### Planned: Database Storage

```python
# Future implementation
class ProjectStorage:
    def save_project(self, session_id: str, data: dict):
        # Save to SQLite/PostgreSQL
        pass
    
    def load_project(self, session_id: str):
        # Load from database
        pass
```

### Where Projects Will Be Saved

```
backend/
├── data/
│   ├── projects/
│   │   ├── {session_id}/
│   │   │   ├── ideas.json
│   │   │   ├── prd.json
│   │   │   ├── architecture.json
│   │   │   ├── code/
│   │   │   │   ├── backend/
│   │   │   │   └── frontend/
│   │   │   └── metadata.json
```

## Agent Flow Visualization

### Current: No Visual Graph

The current implementation **does not have** a visual agent flow graph like ADK Web UI.

### ADK Patterns Used

**Currently Implemented:**
- ✅ **Basic Agent Pattern**: Each agent is independent
- ✅ **Session Management**: Shared session across agents
- ✅ **Event Streaming**: Async generator responses

**NOT Implemented (Yet):**
- ❌ **Sequential Workflow**: Agents called manually, not auto-chained
- ❌ **Parallel Execution**: One agent at a time
- ❌ **Loop/Coordinator**: No automatic orchestration
- ❌ **Visual Graph**: No UI visualization

### Comparison with Kaggle Notebooks

| Feature | Kaggle Notebooks | This Implementation | Status |
|---------|------------------|---------------------|--------|
| Basic Agent | ✅ | ✅ | Done |
| Runner + App | ✅ | ✅ | Done |
| Session Management | ✅ | ✅ | Done |
| Event Streaming | ✅ | ✅ | Done |
| Sequential Workflow | ✅ | ❌ | TODO |
| Parallel Execution | ✅ | ❌ | TODO |
| Coordinator Pattern | ✅ | ❌ | TODO |
| Visual Graph | ✅ (Web UI) | ❌ | TODO |

### Implementing ADK Workflows

To match Kaggle notebooks, we need:

```python
from google.adk.workflows import SequentialWorkflow, ParallelWorkflow

# Sequential: Idea → PRD → Analysis → Architecture
workflow = SequentialWorkflow(
    agents=[
        idea_agent,
        prd_agent,
        analysis_agent,
        architect_agent
    ]
)

# Parallel: Backend + Frontend dev simultaneously
parallel_dev = ParallelWorkflow(
    agents=[backend_dev_agent, frontend_dev_agent]
)
```

## User Workflow

### Current Flow

```
1. Initialize Project
   ↓
2. Generate Ideas (Manual)
   ↓
3. Select Idea
   ↓
4. Generate PRD (Manual click)
   ↓
5. Analyze PRD (Manual click)
   ↓
6. Design Architecture (Manual click)
   ↓
7. Design UI (Manual click)
   ↓
8. Create Sprint Plan (Manual click)
   ↓
9. Write Code (Manual click)
   ↓
10. Review Code (Manual click)
```

### After Each Step

**User Can:**
- ✅ View the output in the UI
- ✅ See logs in real-time
- ✅ Continue to next step manually
- ❌ Edit/refine output (not implemented)
- ❌ Save progress (not implemented)
- ❌ Resume later (not implemented)

### What Happens to Generated Code

**Currently:**
- Code is displayed in UI
- Stored in session (in-memory)
- Lost on page refresh
- Not saved to files

**Should Be:**
- Saved to `backend/data/projects/{session_id}/code/`
- Downloadable as ZIP
- Editable in UI
- Committable to Git

## Next Steps for User

### Immediate (After Generating Ideas)

1. **Select an Idea** - Click on one of the generated ideas
2. **Generate PRD** - Click "Approve Strategy & Generate PRD"
3. **Continue Workflow** - Follow each step sequentially
4. **Download Results** - (Not implemented yet)

### Recommended Enhancements

1. **Add Project Persistence**:
   ```python
   # Save after each step
   project_storage.save_step(session_id, "ideas", ideas_data)
   ```

2. **Implement Workflows**:
   ```python
   # Auto-chain agents
   workflow.run(initial_input)
   ```

3. **Add Visual Graph**:
   ```typescript
   // Use ReactFlow to show agent execution
   <AgentFlowGraph nodes={agents} edges={connections} />
   ```

4. **Enable Refinement**:
   ```typescript
   // Let user edit and regenerate
   <EditableOutput value={prd} onRegenerate={regeneratePRD} />
   ```

## Implementation Priorities

### Phase 1: Core Functionality ✅
- [x] Basic agents
- [x] Session management
- [x] Settings UI
- [x] Error handling

### Phase 2: Persistence (Next)
- [ ] Database integration
- [ ] Project storage
- [ ] Resume capability
- [ ] Export/download

### Phase 3: Advanced Workflows
- [ ] Sequential workflow
- [ ] Parallel execution
- [ ] Coordinator pattern
- [ ] Auto-chaining

### Phase 4: Visualization
- [ ] Agent flow graph
- [ ] Execution timeline
- [ ] Token usage tracking
- [ ] Performance metrics

## Security Checklist

- [x] API keys in .env
- [x] .env in .gitignore
- [x] Keys not in responses
- [x] Keys not in logs
- [x] CORS configured
- [ ] HTTPS in production
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection protection (when DB added)
- [ ] XSS protection

## Summary

**What Works:**
- ✅ Basic agent execution
- ✅ Settings UI (keys secure)
- ✅ Manual workflow progression
- ✅ Real-time logging

**What's Missing:**
- ❌ Project persistence
- ❌ Automatic workflows
- ❌ Visual agent graph
- ❌ Code export
- ❌ Refinement capability

**Your API Key is Safe:**
- Stored in `.env` (gitignored)
- Never exposed in API responses
- Not logged anywhere
- Won't be committed to git

**Next User Action:**
After generating ideas → Select one → Click "Approve Strategy & Generate PRD" → Continue through each step manually.
