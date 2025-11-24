# Settings & Debugging Features - Implementation Summary

## What Was Added

### 1. **Settings UI** ⚙️
A comprehensive settings modal accessible from the header that allows users to:

- **Select AI Provider**: Google (Gemini), Anthropic (Claude - coming soon), OpenAI (GPT - coming soon)
- **Choose Model**: Different Gemini models with descriptions
- **Configure API Key**: Securely enter and manage API keys
- **Adjust Temperature**: Control creativity vs precision (0.0 - 1.0)
- **Set Timeout**: Configure request timeout (30-300 seconds)

**Location**: Click the ⚙️ icon in the top-right header

### 2. **Backend Enhancements**

#### New Endpoints
```
GET  /settings          - Get current settings
POST /settings          - Update settings
GET  /models/{provider} - Get available models for provider
GET  /health            - Health check with detailed status
```

#### Error Handling
- **Timeout Protection**: Requests automatically timeout after configured duration
- **Detailed Logging**: All requests logged with timestamps and session IDs
- **Error Messages**: Clear, actionable error messages returned to frontend

#### Model Factory
- **Multi-Provider Support**: Architecture ready for Claude, GPT, etc.
- **Dynamic Model Creation**: Models created based on user settings
- **API Key Management**: Secure handling of provider-specific keys

### 3. **Debugging Features**

#### Frontend
- **Console Logging**: All API responses logged to browser console
- **Error Display**: Errors shown in UI logs panel
- **Response Format Handling**: Gracefully handles different response formats

#### Backend
- **Structured Logging**: Using Python's logging module
- **Request Tracing**: Each request logged with session ID
- **Exception Handling**: Try-catch blocks with detailed error info

## How to Use

### Initial Setup

1. **Start the application**
   ```bash
   # Backend
   cd backend
   uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload
   
   # Frontend
   cd frontend
   npm run dev
   ```

2. **Open Settings**
   - Go to http://localhost:5174
   - Click the ⚙️ icon in top-right
   
3. **Configure Model**
   - Provider: Google (Gemini)
   - Model: gemini-2.0-flash-exp (or gemini-1.5-flash for faster responses)
   - API Key: Your Google AI API key
   - Temperature: 0.7 (balanced)
   - Timeout: 120 seconds (increase if requests timeout)

4. **Save Settings**
   - Click "Save Settings"
   - Settings are applied immediately

### Debugging a Stuck Request

1. **Check Backend Logs**
   - Look at terminal running uvicorn
   - Check for errors like:
     - `Invalid API key`
     - `Rate limit exceeded`
     - `Timeout`

2. **Check Browser Console**
   - Press F12 → Console tab
   - Look for "Raw response from backend:"
   - Check Network tab for failed requests

3. **Increase Timeout**
   - Open Settings
   - Increase timeout to 180s or 300s
   - Save and retry

4. **Verify API Key**
   - Open Settings
   - Check if "API key set" shows true
   - If not, enter your API key
   - Get new key from: https://aistudio.google.com/app/apikey

### Common Scenarios

#### Scenario 1: "Request hangs indefinitely"
**Diagnosis**: Timeout too short or API issue
**Solution**:
1. Check backend logs for errors
2. Increase timeout in Settings
3. Verify API key is valid
4. Check quota at Google AI Studio

#### Scenario 2: "No ideas displayed"
**Diagnosis**: Response format issue
**Solution**:
1. Open browser console (F12)
2. Look for "Raw response from backend:"
3. If you see `raw_output`, the model didn't return JSON
4. Try regenerating or use a different model

#### Scenario 3: "API key error"
**Diagnosis**: Invalid or missing API key
**Solution**:
1. Open Settings
2. Enter valid API key from Google AI Studio
3. Save settings
4. Retry request

## Architecture

### Settings Flow
```
User → Settings UI → POST /settings → Update app_settings → Agents use new config
```

### Request Flow with Timeout
```
Frontend → Backend Endpoint → asyncio.wait_for(agent.method(), timeout) → Response
                                        ↓
                                   TimeoutError → 504 Response
```

### Multi-Provider Architecture
```
Settings → ModelFactory.create_model(provider, model_name, api_key)
                ↓
         Provider-specific model instance
                ↓
         Agent uses model via ADK
```

## Files Modified/Created

### Backend
- ✅ `backend/app/core/model_config.py` - Model configuration schema
- ✅ `backend/app/core/model_factory.py` - Multi-provider model factory
- ✅ `backend/app/main.py` - Added settings endpoints and timeout handling

### Frontend
- ✅ `frontend/src/components/Settings.tsx` - Settings modal component
- ✅ `frontend/src/layouts/DashboardLayout.tsx` - Integrated settings button
- ✅ `frontend/src/pages/MissionControl.tsx` - Enhanced error handling

### Documentation
- ✅ `TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- ✅ `SETTINGS_DEBUGGING.md` - This file

## Future Enhancements

### Planned Features
1. **Anthropic (Claude) Support**
   - Claude Sonnet 4.5
   - Claude Opus
   
2. **OpenAI Support**
   - GPT-4
   - GPT-4 Turbo

3. **Advanced Settings**
   - Max tokens configuration
   - Top-p / Top-k sampling
   - Presence/frequency penalties

4. **Telemetry Dashboard**
   - Request latency graphs
   - Token usage tracking
   - Error rate monitoring

5. **Retry Logic**
   - Automatic retry on transient failures
   - Exponential backoff
   - Circuit breaker pattern

## API Reference

### GET /settings
Returns current application settings (API key masked).

**Response:**
```json
{
  "provider": "google",
  "model_name": "gemini-2.0-flash-exp",
  "temperature": 0.7,
  "timeout": 120,
  "debug_mode": false,
  "api_key_set": true
}
```

### POST /settings
Update application settings.

**Request:**
```json
{
  "provider": "google",
  "model_name": "gemini-1.5-flash",
  "api_key": "your-api-key",
  "temperature": 0.8,
  "timeout": 180
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Settings updated. Please restart agents for changes to take effect."
}
```

### GET /models/{provider}
Get available models for a provider.

**Example:** `GET /models/google`

**Response:**
```json
[
  {
    "id": "gemini-2.0-flash-exp",
    "name": "Gemini 2.0 Flash (Experimental)",
    "description": "Latest experimental model"
  },
  {
    "id": "gemini-1.5-pro",
    "name": "Gemini 1.5 Pro",
    "description": "Most capable model"
  }
]
```

### GET /health
Health check with system status.

**Response:**
```json
{
  "status": "healthy",
  "active_sessions": 2,
  "model_provider": "google",
  "model_name": "gemini-2.0-flash-exp",
  "debug_mode": false
}
```

## Best Practices

1. **Always configure settings before first use**
2. **Use appropriate timeouts** (120s for simple, 300s for complex)
3. **Monitor backend logs** during development
4. **Check browser console** for frontend errors
5. **Start with simple prompts** to test configuration
6. **Keep API keys secure** (never commit to git)

## Support

For issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review backend logs
3. Check browser console
4. Verify settings configuration
