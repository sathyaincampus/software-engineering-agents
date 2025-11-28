# Additional Error Handling Fixes

## Issue: JSON Parse Error & Empty Agent Responses

### Problem
When running TASK-046, the system encountered:
1. **JSON Parse Error**: "Failed to parse JSON: Expecting value: line 1 column 1 (char 0)"
2. **Sprint Paused**: "🛑 Sprint paused: Unrecoverable error"
3. **404 Errors**: Multiple 404s when loading project (harmless, but noisy)

### Root Causes

1. **Empty Agent Response**: The agent returned an empty response, which `collect_response()` wrapped in an error JSON
2. **Double JSON Parsing**: `parse_json_response()` tried to parse the error JSON as if it were agent output
3. **Overly Strict Error Handling**: Frontend treated any error without `error_type` as unrecoverable

### Solutions Implemented

#### 1. Enhanced `collect_response()` (backend/app/utils/adk_helper.py)

**Changes:**
- Added event counting to track how many events were processed
- Detect empty responses and return structured error
- Provide helpful error messages and suggestions

**Before:**
```python
async def collect_response(async_gen):
    full_response = ""
    async for event in async_gen:
        # ... collect text ...
    return full_response  # Could be empty!
```

**After:**
```python
async def collect_response(async_gen):
    full_response = ""
    event_count = 0
    
    async for event in async_gen:
        event_count += 1
        # ... collect text ...
    
    # Check if we got an empty response
    if not full_response.strip():
        logger.warning(f"Empty response after processing {event_count} events")
        return json.dumps({
            "error": "Agent returned empty response",
            "details": f"Processed {event_count} events but got no text content",
            "suggestion": "The agent may have encountered an error or the prompt may need adjustment"
        })
    
    return full_response
```

#### 2. Improved `parse_json_response()` (backend/app/utils/adk_helper.py)

**Changes:**
- Check for empty responses first
- Try direct JSON parse before markdown extraction
- Detect and pass through error objects from `collect_response()`

**Before:**
```python
def parse_json_response(response: str) -> dict:
    try:
        json_text = extract_json_from_markdown(response)
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse JSON: {str(e)}", ...}
```

**After:**
```python
def parse_json_response(response: str) -> dict:
    # Check if response is empty
    if not response or not response.strip():
        return {"error": "Empty response from agent", ...}
    
    try:
        # First, try to parse directly (in case it's already JSON from error handler)
        parsed = json.loads(response)
        
        # If it's already an error object from collect_response, return it
        if isinstance(parsed, dict) and "error" in parsed:
            return parsed
        
        return parsed
    
    except json.JSONDecodeError:
        # Not direct JSON, try extracting from markdown
        pass
    
    # ... rest of parsing logic ...
```

#### 3. Smarter Frontend Error Handling (frontend/src/pages/MissionControl.tsx)

**Changes:**
- Display `details` field from error responses
- Change `!recoverable` to `recoverable === false` (explicit check)
- Treat errors without `error_type` as recoverable (continue sprint)
- Add helpful log message when continuing after error

**Before:**
```typescript
if (!recoverable) {
    addLog(`🛑 Sprint paused: Unrecoverable error`);
    return; // STOPS sprint
}
```

**After:**
```typescript
if (recoverable === false) {
    // Explicitly marked as unrecoverable
    addLog(`🛑 Sprint paused: Unrecoverable error`);
    return;
} else {
    // Generic error or agent error (no error_type)
    // Mark as error but continue to next task
    addLog(`⚠️  Marking ${task.task_id} as failed, continuing to next task...`);
    setTaskStatuses(prev => ({ ...prev, [task.task_id]: 'error' }));
}
```

### Error Flow Now

#### Scenario: Agent Returns Empty Response

```
1. Agent processes task but returns empty response
2. collect_response() detects empty response
3. Returns: {
     "error": "Agent returned empty response",
     "details": "Processed 5 events but got no text content",
     "suggestion": "The agent may have encountered an error..."
   }
4. parse_json_response() detects it's already JSON with error field
5. Returns error object as-is
6. Backend wraps in handle_adk_errors (no error_type added)
7. Frontend receives: {
     "error": "Agent returned empty response",
     "details": "...",
     "suggestion": "..."
   }
8. Frontend logs:
     ❌ TASK-046 failed: Agent returned empty response
     📝 Details: Processed 5 events but got no text content
     💡 The agent may have encountered an error...
     ⚠️  Marking TASK-046 as failed, continuing to next task...
9. Sprint CONTINUES to next task (not stopped)
```

### 404 Errors (Already Handled)

The 404 errors when loading projects are **expected and harmless**:

```typescript
// In ProjectContext.tsx
for (const step of steps) {
    try {
        const res = await fetch(`${API_BASE_URL}/projects/${sessionId}/${step}`);
        if (res.ok) {
            // Load step data
        }
        // Silently skip if step doesn't exist (404)
    } catch (e) {
        // Silently skip errors for individual steps
        console.warn(`Failed to load step ${step}:`, e);
    }
}
```

These occur because the project loading tries to fetch all possible steps (ideas, prd, user_stories, architecture, **ui_design**, sprint_plan, **backend_code**, **frontend_code**, **qa_review**), but some may not exist yet. The code already handles this gracefully by catching the errors and continuing.

### Benefits

1. **Better Error Messages**: Users see exactly what went wrong (empty response, event count, etc.)
2. **Sprint Continuity**: Agent errors don't stop the entire sprint
3. **Easier Debugging**: Detailed error information helps identify root cause
4. **Graceful Degradation**: Failed tasks are marked but sprint continues

### Testing

To test these fixes:

1. **Empty Response**: If an agent returns empty response, you should see:
   ```
   ❌ TASK-XXX failed: Agent returned empty response
   📝 Details: Processed N events but got no text content
   💡 The agent may have encountered an error or the prompt may need adjustment
   ⚠️  Marking TASK-XXX as failed, continuing to next task...
   ```

2. **Sprint Continuation**: Sprint should continue to next task instead of stopping

3. **404 Errors**: Should only appear in console as warnings, not affect UI

### Files Modified

1. `backend/app/utils/adk_helper.py`
   - Enhanced `collect_response()` with empty response detection
   - Improved `parse_json_response()` with error object passthrough

2. `frontend/src/pages/MissionControl.tsx`
   - Added details logging
   - Changed recoverable check to explicit `=== false`
   - Added continuation message for generic errors

### Related Documentation

- See `docs/ERROR_HANDLING.md` for full error handling documentation
- See `FIXES_SUMMARY.md` for original error handling implementation
