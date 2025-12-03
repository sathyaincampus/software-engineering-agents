# SparkToShip - Vertex AI Agent Engine Deployment Guide

## 🎯 Overview

This guide covers deploying **SparkToShip** to **Vertex AI Agent Engine** - Google Cloud's fully managed service specifically designed for AI agents. This is the **recommended approach** for production ADK agent deployments.

### Why Vertex AI Agent Engine?

- ✅ **Purpose-built for AI Agents** - Optimized for ADK applications
- ✅ **Fully Managed** - No infrastructure management required
- ✅ **Auto-scaling** - Scales from 0 to handle traffic spikes
- ✅ **Built-in Session Management** - Persistent sessions with Firestore integration
- ✅ **Simple Deployment** - One command deployment with ADK CLI
- ✅ **Cost-Effective** - Free tier available, pay only for what you use

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Cost Estimation](#cost-estimation)
4. [Deployment Steps](#deployment-steps)
5. [Frontend Deployment](#frontend-deployment)
6. [Domain Configuration](#domain-configuration)
7. [Monitoring & Management](#monitoring--management)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Google Cloud Account

- **Free Trial**: $300 credit for 90 days
- **Sign up**: https://cloud.google.com/free
- **Billing**: Credit card required (won't be charged during trial)

### 2. Required APIs

Enable these APIs in your GCP project:

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  cloudtrace.googleapis.com \
  telemetry.googleapis.com \
  run.googleapis.com
```

### 3. Local Tools

- **gcloud CLI**: https://cloud.google.com/sdk/docs/install
- **Python 3.10+**: For local development
- **Node.js 18+**: For frontend build
- **ADK CLI**: `pip install google-adk`

### 4. Environment Setup

```bash
# Set your project ID
export PROJECT_ID="sparktoship-prod"
export REGION="us-west1"  # or us-east4, europe-west1, europe-west4
export GEMINI_API_KEY="your_gemini_api_key"

# Configure gcloud
gcloud config set project $PROJECT_ID
gcloud auth login
gcloud auth application-default login
```

---

## Architecture Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare DNS                          │
│                      sparktoship.dev                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Google Cloud Load Balancer                     │
│                         (HTTPS/SSL)                             │
└─────────────┬─────────────────────────────┬─────────────────────┘
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────────────┐
│   Cloud Storage         │   │  Vertex AI Agent Engine         │
│   (Frontend - React)    │   │  (Backend - ADK Agents)         │
│                         │   │                                 │
│   sparktoship.dev/*     │   │  sparktoship.dev/api/*          │
└─────────────────────────┘   └────────────┬────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────────┐
                              │  Firestore                 │
                              │  (Session Storage)         │
                              └────────────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────────┐
                              │  Gemini API                │
                              │  (User's API Key)          │
                              └────────────────────────────┘
```

### Key Components

1. **Vertex AI Agent Engine**
   - Hosts your ADK agents
   - Manages sessions with Firestore
   - Auto-scales based on demand
   - Provides built-in monitoring

2. **Cloud Storage**
   - Hosts static frontend files
   - Serves React application
   - CDN-enabled for fast delivery

3. **Cloud Load Balancer**
   - Routes traffic to backend/frontend
   - Provides HTTPS termination
   - Integrates with Cloudflare

4. **Firestore**
   - Stores agent sessions
   - Persists conversation history
   - Managed by Agent Engine

---

## Cost Estimation

### Monthly Cost Breakdown

#### Scenario 1: 10 Projects/Month (Light Usage)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Vertex AI Agent Engine** | 1.2 hours runtime, 9K requests | **$0.00** (Free tier) |
| **Firestore** | 10K reads, 5K writes | **$0.00** (Free tier) |
| **Cloud Storage** | 1GB storage, 10GB egress | **$1.10** |
| **Load Balancer** | Fixed + ingress | **$18.08** |
| **Total** | | **$19.18/month** |

**Free Trial Duration**: 15.6 months ✅

#### Scenario 2: 100 Projects/Month (Medium Usage)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Vertex AI Agent Engine** | 11.7 hours runtime, 45K requests | **$0.00** (Free tier) |
| **Firestore** | 100K reads, 50K writes | **$0.00** (Free tier) |
| **Cloud Storage** | 1GB storage, 10GB egress | **$1.10** |
| **Load Balancer** | Fixed + ingress | **$18.08** |
| **Total** | | **$19.18/month** |

**Free Trial Duration**: 15.6 months ✅

#### Scenario 3: 1000 Projects/Month (Heavy Usage)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Vertex AI Agent Engine** | 117 hours runtime, 450K requests | **$12.50** |
| **Firestore** | 1M reads, 500K writes | **$0.90** |
| **Cloud Storage** | 1GB storage, 50GB egress | **$5.10** |
| **Load Balancer** | Fixed + ingress | **$18.50** |
| **Total** | | **$37.00/month** |

**Free Trial Duration**: 8.1 months ✅

### Cost Optimization Tips

1. **Use Free Tiers**
   - Agent Engine: Free for first 10 agents
   - Firestore: 50K reads, 20K writes/day free
   - Cloud Storage: 5GB storage free

2. **Optimize Agent Configuration**
   ```json
   {
     "min_instances": 0,  // Scale to zero when idle
     "max_instances": 1,  // Limit concurrent instances
     "resource_limits": {
       "cpu": "1",
       "memory": "1Gi"
     }
   }
   ```

3. **Enable Cloudflare Caching**
   - Cache static assets
   - Reduce egress costs
   - Improve performance

4. **Monitor Usage**
   ```bash
   # Check Agent Engine usage
   gcloud ai agent-engines list --region=$REGION
   
   # View billing
   gcloud billing accounts list
   ```

---

## Deployment Steps

### Step 1: Prepare Your Agent

#### 1.1 Create Agent Directory Structure

```bash
cd backend
mkdir -p sparktoship_agent
cd sparktoship_agent
```

#### 1.2 Create `agent.py`

```python
# sparktoship_agent/agent.py
import os
import vertexai
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini

# Initialize Vertex AI
vertexai.init(
    project=os.environ["GOOGLE_CLOUD_PROJECT"],
    location=os.environ["GOOGLE_CLOUD_LOCATION"],
)

# Import your agents from the main application
from app.agents.orchestrator import orchestrator_agent
from app.agents.architect import architect_agent
from app.agents.planner import planner_agent
from app.agents.coder import coder_agent
from app.agents.debugger import debugger_agent

# Export the root agent for deployment
root_agent = orchestrator_agent
```

#### 1.3 Create `requirements.txt`

```txt
google-adk
google-cloud-aiplatform
google-cloud-firestore
fastapi
uvicorn
pydantic
python-dotenv
```

#### 1.4 Create `.env`

```bash
# sparktoship_agent/.env
GOOGLE_CLOUD_LOCATION="us-west1"
GOOGLE_GENAI_USE_VERTEXAI=1
```

#### 1.5 Create `.agent_engine_config.json`

```json
{
  "min_instances": 0,
  "max_instances": 3,
  "resource_limits": {
    "cpu": "2",
    "memory": "4Gi"
  }
}
```

### Step 2: Deploy to Agent Engine

#### 2.1 Deploy Command

```bash
cd backend

adk deploy agent_engine \
  --project=$PROJECT_ID \
  --region=$REGION \
  sparktoship_agent \
  --agent_engine_config_file=sparktoship_agent/.agent_engine_config.json
```

#### 2.2 Deployment Output

```
Staging all files in: /tmp/sparktoship_agent_tmp...
Copying agent source code...
Reading agent engine config...
Initializing Vertex AI...
Deploying to agent engine...
✅ Created agent engine: projects/123456/locations/us-west1/reasoningEngines/789012
```

**Save this resource name** - you'll need it to interact with your agent!

#### 2.3 Verify Deployment

```bash
# List deployed agents
gcloud ai agent-engines list --region=$REGION

# Get agent details
gcloud ai agent-engines describe AGENT_ENGINE_ID --region=$REGION
```

### Step 3: Test Your Deployed Agent

#### 3.1 Using Python SDK

```python
import vertexai
from vertexai import agent_engines

# Initialize
vertexai.init(project=PROJECT_ID, location=REGION)

# Get your deployed agent
agent_engine = agent_engines.get(
    name='projects/123456/locations/us-west1/reasoningEngines/789012'
)

# Test the agent
response = agent_engine.query(
    input="Create a simple todo app with React"
)

print(response)
```

#### 3.2 Using REST API

```bash
# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Call the agent
curl -X POST \
  "https://$REGION-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/$REGION/reasoningEngines/AGENT_ID:query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Create a simple todo app with React"
  }'
```

### Step 4: Create API Gateway (Optional)

For easier frontend integration, create a Cloud Run service that wraps the Agent Engine:

#### 4.1 Create `api_gateway.py`

```python
# api_gateway.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import vertexai
from vertexai import agent_engines
import os

app = FastAPI()

# Initialize Vertex AI
vertexai.init(
    project=os.environ["PROJECT_ID"],
    location=os.environ["REGION"]
)

# Get agent engine
AGENT_ENGINE_ID = os.environ["AGENT_ENGINE_ID"]
agent_engine = agent_engines.get(name=AGENT_ENGINE_ID)

class QueryRequest(BaseModel):
    message: str
    session_id: str = None

@app.post("/api/chat")
async def chat(request: QueryRequest):
    try:
        response = agent_engine.query(
            input=request.message,
            session_id=request.session_id
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

#### 4.2 Deploy API Gateway to Cloud Run

```bash
# Build and deploy
gcloud run deploy sparktoship-api \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=$PROJECT_ID,REGION=$REGION,AGENT_ENGINE_ID=$AGENT_ENGINE_ID
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
cd frontend

# Create production environment file
cat > .env.production << EOF
VITE_API_BASE_URL=https://sparktoship-api-HASH-uc.a.run.app
EOF

# Build
npm run build
```

### Step 2: Deploy to Cloud Storage

```bash
# Create bucket
gsutil mb -l $REGION gs://sparktoship-frontend

# Enable website configuration
gsutil web set -m index.html -e index.html gs://sparktoship-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://sparktoship-frontend

# Upload files
gsutil -m rsync -r -d dist gs://sparktoship-frontend
```

### Step 3: Configure Load Balancer

See the [GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md](./GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md) for detailed Load Balancer setup instructions.

---

## Domain Configuration

### Step 1: Get Load Balancer IP

```bash
gcloud compute addresses describe sparktoship-ip --global --format="get(address)"
```

### Step 2: Configure Cloudflare DNS

1. Go to Cloudflare Dashboard → DNS
2. Add A record:
   - **Type**: A
   - **Name**: @
   - **Content**: `<LOAD_BALANCER_IP>`
   - **Proxy**: Enabled (orange cloud)

3. Add CNAME record:
   - **Type**: CNAME
   - **Name**: www
   - **Content**: sparktoship.dev
   - **Proxy**: Enabled

### Step 3: Configure SSL

1. **Cloudflare SSL/TLS Settings**:
   - Encryption mode: **Full (strict)**
   - Always Use HTTPS: **On**
   - Automatic HTTPS Rewrites: **On**

2. **Google Cloud SSL Certificate**:
   ```bash
   gcloud compute ssl-certificates create sparktoship-ssl-cert \
     --domains=sparktoship.dev,www.sparktoship.dev \
     --global
   ```

---

## Monitoring & Management

### View Logs

```bash
# Agent Engine logs
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" \
  --limit=50 \
  --format=json

# API Gateway logs (if using Cloud Run)
gcloud run services logs read sparktoship-api --region=$REGION
```

### Monitor Performance

```bash
# View metrics in Cloud Console
https://console.cloud.google.com/ai/platform/locations/$REGION/reasoning-engines

# Check Firestore usage
gcloud firestore databases describe --database=(default)
```

### Update Agent

```bash
# Make changes to your agent code
# Then redeploy
adk deploy agent_engine \
  --project=$PROJECT_ID \
  --region=$REGION \
  sparktoship_agent \
  --agent_engine_config_file=sparktoship_agent/.agent_engine_config.json
```

### Delete Agent

```bash
# Delete agent engine
gcloud ai agent-engines delete AGENT_ENGINE_ID --region=$REGION

# Clean up Firestore data (optional)
# This requires manual deletion through Console or script
```

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails

**Error**: `Permission denied`

**Solution**:
```bash
# Ensure you have the right permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/aiplatform.user"
```

#### 2. Agent Not Responding

**Check logs**:
```bash
gcloud logging read "resource.type=aiplatform.googleapis.com/ReasoningEngine" \
  --limit=10
```

**Common causes**:
- Missing environment variables
- Incorrect Gemini API key
- Firestore permissions

#### 3. High Costs

**Check usage**:
```bash
# View billing
gcloud billing accounts list

# Check Agent Engine usage
gcloud ai agent-engines list --region=$REGION
```

**Optimize**:
- Set `min_instances: 0`
- Reduce `max_instances`
- Enable Cloudflare caching

#### 4. Session Not Persisting

**Verify Firestore**:
```bash
# Check Firestore database
gcloud firestore databases describe --database=(default)
```

**Solution**:
- Ensure Firestore API is enabled
- Check Agent Engine has Firestore permissions

---

## Next Steps

1. **Set up CI/CD**: Automate deployments with GitHub Actions
2. **Add Monitoring**: Set up alerts for errors and performance
3. **Implement Authentication**: Add user authentication
4. **Scale**: Increase `max_instances` as needed
5. **Optimize**: Monitor costs and adjust configuration

---

## Resources

- **Vertex AI Agent Engine Docs**: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview
- **ADK Deployment Guide**: https://google.github.io/adk-docs/deploy/agent-engine/
- **Firestore Documentation**: https://cloud.google.com/firestore/docs
- **Cloud Load Balancer**: https://cloud.google.com/load-balancing/docs

---

## Summary

**Vertex AI Agent Engine** provides the simplest and most cost-effective way to deploy ADK agents to production:

- ✅ **One-command deployment**: `adk deploy agent_engine`
- ✅ **Built-in session management**: Firestore integration included
- ✅ **Auto-scaling**: From 0 to handle any load
- ✅ **Free tier**: First 10 agents free
- ✅ **$300 credit lasts 15+ months** with typical usage

**Ready to deploy?** Follow the steps above and your SparkToShip agents will be live in minutes!
