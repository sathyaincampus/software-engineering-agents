# Error Handling & Recovery System

## Overview

This document describes the graceful error handling and recovery system implemented to handle token exhaustion, rate limiting, and other API errors without losing UI state or crashing the application.

## Problem Statement

Previously, when the system encountered errors like:
- **Token limit exceeded** (400 INVALID_ARGUMENT): Input exceeds 1,048,576 tokens
- **Rate limit exceeded** (429 RESOURCE_EXHAUSTED): 4M tokens/minute quota exceeded
- **Network errors** or **timeouts**

The backend would return 500 errors, causing:
1. UI to revert to original state
2. Loss of progress in sprint execution
3. No clear feedback to users
4. No automatic recovery mechanism

## Solution Architecture

### Backend Components

#### 1. Error Handler (`backend/app/utils/error_handler.py`)

**Purpose**: Centralized error handling for ADK agent calls

**Key Functions**:

- `handle_adk_errors(func, *args, **kwargs)`: Wraps agent calls and returns structured error responses
  ```python
  {
      "success": bool,
      "data": result,  # if successful
      "error": str,  # error message
      "error_type": str,  # 'token_exhausted', 'rate_limit', 'timeout', 'unknown'
      "retry_after": int,  # seconds to wait before retry
      "recoverable": bool,  # whether error can be recovered from
      "suggestion": str  # user-friendly suggestion
  }
  ```

- `retry_with_backoff(func, max_retries, initial_delay, max_delay)`: Implements exponential backoff retry logic

**Error Types**:

1. **Token Exhausted** (`token_exhausted`)
   - Triggered by: 400 INVALID_ARGUMENT or "token count exceeds"
   - Recoverable: No (requires user intervention)
   - Suggestion: Reduce context size or use larger model

2. **Rate Limit** (`rate_limit`)
   - Triggered by: 429 RESOURCE_EXHAUSTED or "quota exceeded"
   - Recoverable: Yes (with retry_after delay)
   - Suggestion: Wait specified seconds before retrying

3. **Timeout** (`timeout`)
   - Triggered by: asyncio.TimeoutError
   - Recoverable: Yes
   - Suggestion: Retry or break down task

4. **Unknown** (`unknown`)
   - Triggered by: Other exceptions
   - Recoverable: No
   - Suggestion: Check logs

#### 2. Updated ADK Helper (`backend/app/utils/adk_helper.py`)

**Changes**:
- Added try-except wrapper in `collect_response()`
- Re-raises specific errors (token/rate limit) for error_handler
- Returns partial response for other errors
- Logs all errors for debugging

#### 3. Updated API Endpoints (`backend/app/main.py`)

**Modified Endpoints**:
- `/agent/backend_dev/run`
- `/agent/frontend_dev/run`

**Changes**:
- Wrapped agent calls with `handle_adk_errors()`
- Return error info instead of raising HTTPException
- Include task_id in error response for frontend tracking

**Response Format**:
```python
# Success
{
    "files": [...],
    "summary": "..."
}

# Error
{
    "error": "API rate limit exceeded. Please wait 60 seconds before retrying.",
    "error_type": "rate_limit",
    "retry_after": 60,
    "recoverable": true,
    "suggestion": "The system will automatically retry in 60 seconds...",
    "task_id": "TASK-001"
}
```

### Frontend Components

#### 1. Enhanced Sprint Execution (`frontend/src/pages/MissionControl.tsx`)

**Changes to `runSprint()`**:

1. **Error Detection**: Check `response.data.error` instead of relying on try-catch
2. **Error Type Handling**:
   - **Rate Limit**: Auto-retry with countdown
     ```typescript
     if (errorType === 'rate_limit' && retryAfter) {
         // Show countdown
         for (let i = retryAfter; i > 0; i--) {
             addLog(`⏳ Retrying in ${i} seconds...`);
             await new Promise(resolve => setTimeout(resolve, 1000));
         }
         await retryTask(task);
         continue;
     }
     ```
   - **Token Exhausted**: Pause sprint, require user intervention
     ```typescript
     else if (errorType === 'token_exhausted') {
         addLog(`🛑 Sprint paused: Token limit exceeded`);
         return; // Stop sprint
     }
     ```
   - **Unrecoverable**: Pause sprint
   - **Generic**: Mark as error, continue to next task

3. **Enhanced Logging**: Display error messages and suggestions in logs panel

4. **State Preservation**: Task statuses are saved and persist across errors

**Changes to `retryTask()`**:
- Same error handling as `runSprint()`
- Provides feedback for retry attempts
- Handles both success and error responses

## User Experience Flow

### Scenario 1: Rate Limit Exceeded

1. User starts sprint execution
2. Task hits rate limit (429 error)
3. **Backend**: Returns structured error with `retry_after: 60`
4. **Frontend**: 
   - Displays: "⏸️ Pausing sprint. Will retry in 60 seconds..."
   - Shows countdown: "⏳ Retrying in 59 seconds..."
   - Auto-retries after countdown
   - Continues sprint execution

### Scenario 2: Token Limit Exceeded

1. User starts sprint execution
2. Task hits token limit (400 error)
3. **Backend**: Returns error with `recoverable: false`
4. **Frontend**:
   - Displays: "🛑 Sprint paused: Token limit exceeded"
   - Shows suggestion: "💡 Please reduce context size or use a larger model"
   - **Stops sprint** (requires user intervention)
   - **Preserves state** - user can resume later after fixing

### Scenario 3: Network Error

1. User starts sprint execution
2. Network connection drops
3. **Frontend**:
   - Catches axios error
   - Displays: "❌ TASK-001 failed: Network error"
   - Marks task as error
   - **Continues to next task** (doesn't stop sprint)

## State Persistence

### Task Statuses
- Saved to backend: `/projects/{session_id}/task_statuses`
- Loaded on page refresh
- Allows resuming from where it left off

### Resume Functionality
```typescript
// Resume from current state (skip completed tasks)
runSprint(resumeFromCurrent: true)
```

## Benefits

1. **No State Loss**: UI preserves all progress even on errors
2. **Clear Feedback**: Users see exactly what went wrong and how to fix it
3. **Automatic Recovery**: Rate-limited requests auto-retry with countdown
4. **Graceful Degradation**: Unrecoverable errors pause sprint instead of crashing
5. **Resume Capability**: Users can resume from where they left off
6. **Better Logging**: All errors logged with context for debugging

## Configuration

### Backend Retry Settings
```python
# In error_handler.py
await retry_with_backoff(
    func,
    max_retries=3,      # Maximum retry attempts
    initial_delay=1,    # Initial delay in seconds
    max_delay=60        # Maximum delay in seconds
)
```

### Frontend Countdown
```typescript
// In MissionControl.tsx
for (let i = retryAfter; i > 0; i--) {
    addLog(`⏳ Retrying in ${i} seconds...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Testing

### Test Token Exhaustion
1. Use a very large context (>1M tokens)
2. Observe: Sprint pauses with clear message
3. Verify: State is preserved, can resume later

### Test Rate Limiting
1. Execute many tasks rapidly
2. Observe: Auto-retry countdown
3. Verify: Sprint continues after retry

### Test Network Error
1. Disconnect network during sprint
2. Observe: Error message displayed
3. Verify: Sprint continues to next task

## Future Enhancements

1. **Context Size Management**: Automatically trim context when approaching limits
2. **Smart Retry**: Exponential backoff for network errors
3. **Progress Indicators**: Visual countdown timer in UI
4. **Error Analytics**: Track error patterns for optimization
5. **Model Switching**: Auto-switch to larger model on token exhaustion

## Troubleshooting

### "Unknown agent" warnings in logs
- **Cause**: Session mismatch between frontend and backend
- **Solution**: Reload project to sync session IDs

### Sprint doesn't auto-resume after rate limit
- **Cause**: Frontend countdown interrupted
- **Solution**: Use manual "Resume Sprint" button

### Task statuses not persisting
- **Cause**: Backend storage error
- **Solution**: Check backend logs, verify file permissions

## Related Files

- `backend/app/utils/error_handler.py` - Error handling utilities
- `backend/app/utils/adk_helper.py` - ADK response collection
- `backend/app/main.py` - API endpoints
- `frontend/src/pages/MissionControl.tsx` - Sprint execution UI
