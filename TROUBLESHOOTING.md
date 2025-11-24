# Troubleshooting Guide

## Common Issues and Solutions

### 1. Request Hangs / Times Out

**Symptoms:**
- Request starts but never completes
- No response after clicking "Brainstorm"
- Loading spinner runs indefinitely

**Possible Causes:**
1. **API Key Issues**
   - Invalid or expired API key
   - Rate limit exceeded
   - Quota exhausted

2. **Network Issues**
   - Backend not running
   - CORS errors
   - Firewall blocking requests

3. **Model Issues**
   - Model unavailable
   - Request too large
   - Token limit exceeded

**Solutions:**

#### Check Backend Logs
```bash
# Look for errors in the terminal running uvicorn
# Common errors:
# - "Invalid API key"
# - "Rate limit exceeded"
# - "Quota exceeded"
```

#### Verify API Key
1. Click the Settings icon (⚙️) in the top right
2. Check if API key is set
3. Get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. Update and save

#### Check Request Timeout
1. Open Settings
2. Increase timeout (default: 120s, try 180s or 300s)
3. Save settings

#### Monitor Backend
```bash
# Check if backend is running
curl http://localhost:8050/health

# Should return:
# {
#   "status": "healthy",
#   "active_sessions": 0,
#   "model_provider": "google",
#   "model_name": "gemini-2.0-flash-exp"
# }
```

### 2. No Ideas Displayed

**Symptoms:**
- Request completes successfully
- No errors in logs
- Ideas section remains empty

**Solutions:**

#### Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for the log: "Raw response from backend:"
4. Check the response format

#### Common Response Formats
```javascript
// Expected format:
{
  "ideas": [
    { "title": "...", "pitch": "...", ... }
  ]
}

// Or direct array:
[
  { "title": "...", "pitch": "...", ... }
]

// Or error format:
{
  "raw_output": "...",
  "error": "Failed to parse JSON"
}
```

#### Fix Response Parsing
If you see `raw_output`, the model returned text instead of JSON. This means:
1. The model didn't follow the JSON format instruction
2. Try regenerating
3. Or check if the model is appropriate for structured output

### 3. API Key / Token Exhaustion

**Symptoms:**
- Error: "Quota exceeded"
- Error: "Rate limit exceeded"
- 429 status code

**Solutions:**

#### Check Your Quota
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Check your usage limits
3. Wait for quota reset (usually daily)
4. Or upgrade to paid tier

#### Use Different Model
1. Open Settings
2. Select a different model (e.g., gemini-1.5-flash instead of gemini-2.0-flash-exp)
3. Flash models use fewer tokens

#### Reduce Request Size
- Use shorter, more concise prompts
- Reduce number of ideas requested (modify agent instruction)

### 4. CORS Errors

**Symptoms:**
- Error in browser console: "CORS policy"
- Requests blocked by browser

**Solutions:**

#### Verify Frontend Port
```bash
# Check which port frontend is running on
# Should be 5173 or 5174
```

#### Update Backend CORS
Edit `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"  # Add your port
    ],
    ...
)
```

### 5. Backend Won't Start

**Symptoms:**
- Import errors
- Module not found
- Port already in use

**Solutions:**

#### Check Python Version
```bash
python3 --version
# Should be 3.10+
```

#### Reinstall Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Kill Existing Process
```bash
# Find process on port 8050
lsof -ti:8050 | xargs kill -9

# Then restart
uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload
```

### 6. Frontend Won't Start

**Symptoms:**
- npm errors
- Module not found
- Port already in use

**Solutions:**

#### Reinstall Dependencies
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Use Different Port
```bash
# Edit package.json or use:
npm run dev -- --port 5175
```

## Debugging Tools

### Enable Debug Mode

#### Backend Logging
Edit `backend/app/main.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### Frontend Console
Check browser DevTools → Console tab for:
- API requests/responses
- Error messages
- State changes

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:8050/health

# Settings
curl http://localhost:8050/settings

# Available models
curl http://localhost:8050/models/google
```

### Test Agent Directly

```bash
cd backend
python3 test_adk_implementation.py
```

## Performance Tips

### 1. Reduce Latency
- Use `gemini-1.5-flash` instead of `gemini-2.0-flash-exp`
- Increase timeout for complex requests
- Use shorter prompts

### 2. Optimize Token Usage
- Be concise in prompts
- Reduce temperature for more focused responses
- Use caching (ADK feature)

### 3. Handle Rate Limits
- Implement retry logic
- Add delays between requests
- Monitor quota usage

## Getting Help

### Collect Debug Information

Before asking for help, collect:

1. **Backend logs** (last 50 lines)
```bash
# From terminal running uvicorn
```

2. **Browser console** (screenshot or copy errors)

3. **Request/Response** (from Network tab)

4. **Settings** (provider, model, timeout)

5. **Error message** (exact text)

### Check Documentation

- [ADK Implementation Guide](./ADK_IMPLEMENTATION_GUIDE.md)
- [README](./README.md)
- [Fix Summary](./FIX_SUMMARY.md)

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `Session not found` | ADK session wasn't created | Restart session |
| `Timeout` | Request took too long | Increase timeout in settings |
| `Invalid API key` | Wrong or expired key | Update API key in settings |
| `Quota exceeded` | Out of free tier tokens | Wait or upgrade |
| `CORS policy` | Frontend/backend port mismatch | Update CORS config |

## Prevention

### Best Practices

1. **Always set API key in Settings** before starting
2. **Monitor backend logs** for early warning signs
3. **Use appropriate timeouts** (120s for simple, 300s for complex)
4. **Test with simple prompts** first
5. **Keep dependencies updated**

### Regular Maintenance

```bash
# Update dependencies monthly
cd backend && pip install --upgrade -r requirements.txt
cd frontend && npm update
```

### Backup Configuration

Save your `.env` file:
```bash
cp backend/.env backend/.env.backup
```
