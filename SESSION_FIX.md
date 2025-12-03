# Session Error Fix

## Issue
```json
{
    "error": "Failed to collect response",
    "details": "Session not found: dc58b9b4-c88b-4684-86e8-74a1a02e1462",
    "event_count": 0
}
```

## Root Cause
The `BaseAgent` was creating App instances with name `"sparktoship"`, but the orchestrator was creating ADK sessions with app_name `"spark_to_ship"`. This mismatch caused the session service to not find the sessions.

## Fix
Changed the app name in `BaseAgent._get_or_create_runner()` from:
```python
self._app = App(name="sparktoship", root_agent=self._agent)
```

To:
```python
self._app = App(name="spark_to_ship", root_agent=self._agent)
```

This ensures the app name matches what the orchestrator uses when creating sessions.

## Testing
After this fix, restart the backend and try again:

```bash
cd backend
uvicorn app.main:app --reload --port 8050
```

Then test by:
1. Opening the app
2. Entering your API key in Settings
3. Creating a new session
4. Generating ideas

The session should now be found correctly.
