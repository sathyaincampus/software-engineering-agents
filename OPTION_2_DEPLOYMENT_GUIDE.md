# SparkToShip - Option 2 Deployment Guide
## FastAPI Gateway + Vertex AI Agent Engine (Hybrid Approach)

> **Based on**: Google ADK Kaggle Notebooks (Day 5b: Agent Deployment)  
> **Deployment Time**: ~2 hours  
> **Cost**: $24/month (covered by $300 free credit for 12+ months)

---

## 🎯 What You're Building

Your app will run on:
- **Cloud Run**: FastAPI backend (all your existing endpoints)
- **Cloud Storage**: React frontend (static files)
- **Load Balancer**: Routes traffic, provides HTTPS
- **Vertex AI** (Optional): Deploy agents for heavy workloads

**Benefits**: Zero frontend changes, all features preserved, flexible scaling

---

## 📋 Prerequisites

### Python Version Note 🐍
- **Your Local**: Python 3.14.0 (cutting edge!)
- **Docker/Cloud Run**: Python 3.12 (latest stable)
- **Compatibility**: ✅ 100% - Your code works on both!

See [PYTHON_VERSION_NOTE.md](./PYTHON_VERSION_NOTE.md) for details.

### 1. Google Cloud Setup
```bash
# Install gcloud CLI
brew install --cask google-cloud-sdk

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set variables
export PROJECT_ID="sparktoship"
export REGION="us-west1"
export GEMINI_API_KEY="your_api_key"

# Create project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com storage.googleapis.com \
  aiplatform.googleapis.com compute.googleapis.com cloudbuild.googleapis.com
```

---

## 🚀 Phase 1: Deploy Backend to Cloud Run

### Step 1: Create Dockerfile

**Note**: Your local environment uses Python 3.14, but we'll use Python 3.12 for Docker as it's the latest stable version in official images. They're fully compatible!

```bash
cd backend

# The Dockerfile has already been created for you!
# It uses Python 3.12-slim with optimized configuration
# Location: backend/Dockerfile

# If you need to recreate it:
cat > Dockerfile << 'EOF'
# Use Python 3.12 (your local uses 3.14, but 3.12 is latest stable in Docker)
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Run the application (Cloud Run sets PORT env var)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
EOF
```


### Step 2: Deploy
```bash
gcloud run deploy sparktoship-api \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=$GEMINI_API_KEY,MODEL_NAME=gemini-2.0-flash-exp" \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=3
```

### Step 3: Test
```bash
export API_URL=$(gcloud run services describe sparktoship-api --region=$REGION --format='value(status.url)')
curl $API_URL/health
```

✅ **Backend deployed!**

---

## 🎨 Phase 2: Deploy Frontend

### Step 1: Build
```bash
cd ../frontend
export API_URL=$(gcloud run services describe sparktoship-api --region=$REGION --format='value(status.url)')
echo "VITE_API_BASE_URL=$API_URL" > .env.production
npm install
npm run build
```

### Step 2: Upload to Cloud Storage
```bash
export BUCKET_NAME="${PROJECT_ID}-frontend"
gsutil mb -l $REGION gs://$BUCKET_NAME
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
gsutil -m rsync -r -d dist gs://$BUCKET_NAME
```

✅ **Frontend deployed!**

---

## 🌐 Phase 3: Configure Load Balancer

### Step 1: Reserve IP
```bash
gcloud compute addresses create sparktoship-ip --global
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip --global --format='value(address)')
echo "Static IP: $STATIC_IP"
```

### Step 2: Create Backends
```bash
# Frontend backend
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME --enable-cdn

# API backend (NEG)
gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=$REGION --network-endpoint-type=serverless --cloud-run-service=sparktoship-api

gcloud compute backend-services create sparktoship-api-backend --global
gcloud compute backend-services add-backend sparktoship-api-backend \
  --global --network-endpoint-group=sparktoship-api-neg --network-endpoint-group-region=$REGION
```

### Step 3: URL Map
```bash
gcloud compute url-maps create sparktoship-lb --default-backend-bucket=sparktoship-frontend-backend
gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"
```

### Step 4: SSL & HTTPS
```bash
gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev --global

gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb --ssl-certificates=sparktoship-ssl-cert

gcloud compute forwarding-rules create sparktoship-https-rule \
  --global --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip --ports=443
```

### Step 5: Configure DNS
1. Go to Cloudflare DNS
2. Add A record: @ → $STATIC_IP (DNS only initially)
3. Wait for SSL cert (10-15 min): `gcloud compute ssl-certificates describe sparktoship-ssl-cert --global`
4. Once ACTIVE, enable Cloudflare proxy (orange cloud)

✅ **App live at https://sparktoship.dev!**

---

## 🤖 Phase 4: Optional Vertex AI

### When to Use
- Heavy agent workloads
- Need managed sessions
- Want auto-scaling

### Deploy Agent
```bash
cd backend
mkdir -p sparktoship_agent
cd sparktoship_agent

# Create agent.py (see full guide for code)
# Create requirements.txt
# Create .env with GOOGLE_GENAI_USE_VERTEXAI=1
# Create .agent_engine_config.json

cd ..
adk deploy agent_engine --project=$PROJECT_ID --region=$REGION sparktoship_agent
```

---

## 💰 Cost Optimization

### Pause When Not Using
```bash
./pause-sparktoship.sh  # Saves ~$18/month
```

### Resume When Needed
```bash
./resume-sparktoship.sh  # Live in 1-2 minutes
```

### Check Costs Daily
```bash
./daily-cost-check.sh
```

### Cost Breakdown
- **Active 24/7**: $24/month → 12.5 months free
- **Paused overnight**: $12/month → 25 months free ⭐
- **Paused completely**: $1/month → 300 months free

---

## 🔧 Troubleshooting

### Permission Denied
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/editor"
```

### Frontend Can't Reach API
Update CORS in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sparktoship.dev", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### High Costs
```bash
./pause-sparktoship.sh
gcloud ai agent-engines list --region=$REGION
gcloud ai agent-engines delete AGENT_ID --region=$REGION
```

---

## ✅ Success!

Your app is live at:
- **Frontend**: https://sparktoship.dev
- **API**: https://sparktoship.dev/api/*
- **Health**: https://sparktoship.dev/api/health

### Next Steps
1. Test all features
2. Set up budget alerts
3. Monitor costs daily
4. Pause overnight to save money

---

## 📞 Resources

- **Cloud Console**: https://console.cloud.google.com
- **ADK Docs**: https://google.github.io/adk-docs/
- **Kaggle Notebooks**: `Google-ADK-Kaggle-Notebooks/day-5b-agent-deployment.ipynb`

**Estimated Time**: 2-3 hours  
**Monthly Cost**: $24 (or $12 with pausing)  
**Free Credit Lasts**: 12-25 months

🚀 **Happy Deploying!**
