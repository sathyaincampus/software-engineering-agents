# API Key Configuration Update

## Summary

Successfully refactored the application to use **user-provided API keys** instead of the `.env` file API key. This ensures users' own API tokens are consumed, not yours.

## Changes Made

### 1. **Created Base Agent Class** (`backend/app/core/base_agent.py`)
- All agents now inherit from `BaseAgent`
- Agents create model instances dynamically based on user-provided `ModelConfig`
- API key is set per-request, not at startup
- Runners are recreated when API key changes

### 2. **Updated All 12 Agents**
All agents now accept `model_config: ModelConfig` parameter:
- ✅ `IdeaGeneratorAgent`
- ✅ `ProductRequirementsAgent`
- ✅ `RequirementAnalysisAgent`
- ✅ `SoftwareArchitectAgent`
- ✅ `UXDesignerAgent`
- ✅ `EngineeringManagerAgent`
- ✅ `BackendDevAgent`
- ✅ `FrontendDevAgent`
- ✅ `QAAgent`
- ✅ `DebuggerAgent`
- ✅ `E2ETestAgent`
- ✅ `WalkthroughAgent`

### 3. **Updated Main.py Endpoints**
All agent method calls now pass `app_settings.ai_model_config`:
- `/agent/idea_generator/run`
- `/agent/product_requirements/run`
- `/agent/requirement_analysis/run`
- `/agent/software_architect/run`
- `/agent/ux_designer/run`
- `/agent/engineering_manager/run`
- `/agent/backend_dev/run`
- `/agent/frontend_dev/run`
- `/agent/qa_agent/run`
- `/agent/debugger/debug`
- `/agent/debugger/lint`
- `/agent/e2e_test/generate`
- `/agent/walkthrough/generate`

### 4. **Updated Configuration** (`backend/app/core/config.py`)
- Made `GOOGLE_API_KEY` optional in `.env` file
- Added fallback logic - only uses `.env` key if provided
- Won't fail if `.env` file is missing or incomplete

### 5. **Frontend Already Configured**
- Settings UI already requires API key before saving
- Users must enter their API key in Settings → API Key field
- API key is sent with `/settings` POST request

## How It Works Now

### User Flow:
1. **User opens the app**
2. **User clicks Settings** (gear icon)
3. **User enters their Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. **User selects model** (e.g., Gemini 2.5 Pro)
5. **User clicks "Save Settings"**
6. **Backend updates `app_settings.ai_model_config`** with user's API key
7. **All subsequent agent calls use the user's API key**

### Technical Flow:
```
User enters API key in UI
    ↓
POST /settings with {provider, model_name, api_key, ...}
    ↓
Backend updates app_settings.ai_model_config
    ↓
Agent endpoint called (e.g., /agent/idea_generator/run)
    ↓
Passes app_settings.ai_model_config to agent method
    ↓
Agent calls _get_or_create_runner(model_config)
    ↓
Sets os.environ["GOOGLE_API_KEY"] = model_config.api_key
    ↓
Creates Gemini model with user's API key
    ↓
User's tokens are consumed, not yours!
```

## Testing

To test the changes:

1. **Remove or comment out `GOOGLE_API_KEY` from `.env`** (optional - to verify it's not being used)
2. **Start the backend**: `cd backend && uvicorn app.main:app --reload --port 8050`
3. **Start the frontend**: `cd frontend && npm run dev`
4. **Open the app** in browser
5. **Click Settings** (gear icon)
6. **Enter your Gemini API key**
7. **Save settings**
8. **Try generating ideas** - should use YOUR API key

## Important Notes

⚠️ **API Key Storage**: The API key is stored in memory (`app_settings`) and is lost when the server restarts. Users will need to re-enter their API key after each restart.

💡 **Future Enhancement**: Consider adding persistent storage (database or encrypted file) to save user API keys securely.

✅ **Security**: API keys are never logged or exposed in responses (masked in `/settings` GET endpoint).

## Verification

You can verify the API key being used by:
1. Checking the backend logs - the API key will be set in environment variables
2. Monitoring your Google Cloud Console - API calls should appear under the user's project, not yours
3. Checking the Settings UI - it should show "API key set: true" when a key is configured

## Troubleshooting

### "Session not found" Error
If you see an error like:
```json
{
    "error": "Failed to collect response",
    "details": "Session not found: <session-id>"
}
```

**Solution**: This was fixed by ensuring the app name in `BaseAgent` matches the orchestrator's app name (`"spark_to_ship"`). If you still see this error:
1. Restart the backend server
2. Create a new session (don't reuse old session IDs)
3. Make sure you've saved your API key in Settings before starting any operations

See `SESSION_FIX.md` for more details.

### API Key Not Being Used
If the system seems to be using the .env API key instead of yours:
1. Check that you've clicked "Save Settings" after entering your API key
2. Verify in the browser console that the POST /settings request succeeded
3. Restart the backend to clear any cached settings
4. Re-enter your API key in the UI

## Rollback

If you need to rollback to using `.env` file:
1. Add `GOOGLE_API_KEY=your_key` back to `.env`
2. The system will use it as a fallback
3. Users can still override it via UI settings
