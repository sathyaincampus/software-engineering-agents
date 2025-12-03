# 🎯 WHERE TO RUN WHAT - Clear Instructions

## Overview

**All commands run on YOUR LOCAL MACHINE** (your Mac), not in Google Cloud Console!

You'll use:
- ✅ **Your Mac Terminal** (iTerm, Terminal.app, or VS Code terminal)
- ✅ **gcloud CLI** (installed on your Mac, talks to Google Cloud)
- ❌ **NOT Google Cloud Shell** (we're not using the browser-based shell)

---

## 📁 Your Project Structure

```
/Users/sathya/web/python/adk/software-engineering-agents/
├── backend/                    ← Backend code here
│   ├── Dockerfile             ← Already created! ✅
│   ├── .dockerignore          ← Already created! ✅
│   ├── requirements.txt       ← Your dependencies
│   ├── app/                   ← Your FastAPI app
│   │   ├── main.py
│   │   ├── agents/
│   │   └── ...
│   └── data/
├── frontend/                   ← Frontend code here
│   ├── src/
│   ├── package.json
│   └── ...
├── OPTION_2_DEPLOYMENT_GUIDE.md  ← The guide you're reading
├── pause-sparktoship.sh       ← Helper scripts
├── resume-sparktoship.sh
└── daily-cost-check.sh
```

---

## 🚀 Step-by-Step: WHERE to Run Each Command

### Phase 0: Setup (Run ONCE on Your Mac)

#### Install gcloud CLI
**WHERE**: Your Mac Terminal  
**FOLDER**: Any folder (doesn't matter)

```bash
# Open Terminal on your Mac
# Run this:
brew install --cask google-cloud-sdk

# Verify it worked:
gcloud --version
```

#### Authenticate with Google Cloud
**WHERE**: Your Mac Terminal  
**FOLDER**: Any folder

```bash
# This will open your browser to log in
gcloud auth login

# This sets up application credentials
gcloud auth application-default login
```

---

### Phase 1: Deploy Backend

#### Step 1.1: Set Environment Variables
**WHERE**: Your Mac Terminal  
**FOLDER**: Any folder (but I recommend the project root)

```bash
# Navigate to your project
cd /Users/sathya/web/python/adk/software-engineering-agents

# Set these variables (they stay in your terminal session)
export PROJECT_ID="sparktoship"
export REGION="us-west1"
export GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Verify they're set:
echo $PROJECT_ID
echo $REGION
```

#### Step 1.2: Create Google Cloud Project
**WHERE**: Your Mac Terminal  
**FOLDER**: Project root (`/Users/sathya/web/python/adk/software-engineering-agents`)

```bash
# Create the project (this talks to Google Cloud via gcloud CLI)
gcloud projects create $PROJECT_ID --name="SparkToShip"

# Set it as your active project
gcloud config set project $PROJECT_ID

# Link billing (you'll need your billing account ID)
gcloud billing accounts list
# Copy the ACCOUNT_ID from the output, then:
gcloud billing projects link $PROJECT_ID --billing-account=ACCOUNT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  storage.googleapis.com \
  aiplatform.googleapis.com \
  compute.googleapis.com \
  cloudbuild.googleapis.com
```

#### Step 1.3: Verify Dockerfile Exists
**WHERE**: Your Mac Terminal  
**FOLDER**: Backend folder

```bash
# Navigate to backend folder
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

# Check if Dockerfile exists
ls -la Dockerfile

# If it exists, you'll see:
# -rw-r--r--  1 sathya  staff  866 Dec  2 15:31 Dockerfile

# View its contents to verify it's correct:
cat Dockerfile
# Should show: FROM python:3.12-slim
```

**✅ The Dockerfile is ALREADY CREATED!** You don't need to create it.

#### Step 1.4: Deploy to Cloud Run
**WHERE**: Your Mac Terminal  
**FOLDER**: Backend folder (`/Users/sathya/web/python/adk/software-engineering-agents/backend`)

```bash
# Make sure you're in the backend folder
pwd
# Should show: /Users/sathya/web/python/adk/software-engineering-agents/backend

# Deploy to Cloud Run (this uploads your code to Google Cloud)
gcloud run deploy sparktoship-api \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=$GEMINI_API_KEY,MODEL_NAME=gemini-2.0-flash-exp" \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=3

# This will:
# 1. Build Docker image using your Dockerfile
# 2. Upload to Google Cloud
# 3. Deploy to Cloud Run
# Takes 3-5 minutes
```

#### Step 1.5: Test Backend
**WHERE**: Your Mac Terminal  
**FOLDER**: Backend folder (or project root)

```bash
# Get the deployed URL
export API_URL=$(gcloud run services describe sparktoship-api \
  --region=$REGION \
  --format='value(status.url)')

# Show the URL
echo "Your API is at: $API_URL"

# Test it
curl $API_URL/health

# Should return: {"status":"healthy",...}
```

---

### Phase 2: Deploy Frontend

#### Step 2.1: Build Frontend
**WHERE**: Your Mac Terminal  
**FOLDER**: Frontend folder

```bash
# Navigate to frontend folder
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

# Make sure you have the API URL from Phase 1
export API_URL=$(gcloud run services describe sparktoship-api \
  --region=$REGION \
  --format='value(status.url)')

# Create production environment file
echo "VITE_API_BASE_URL=$API_URL" > .env.production

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# This creates a 'dist' folder with your built frontend
ls -la dist/
```

#### Step 2.2: Upload to Cloud Storage
**WHERE**: Your Mac Terminal  
**FOLDER**: Frontend folder (`/Users/sathya/web/python/adk/software-engineering-agents/frontend`)

```bash
# Make sure you're in frontend folder
pwd
# Should show: /Users/sathya/web/python/adk/software-engineering-agents/frontend

# Set bucket name
export BUCKET_NAME="${PROJECT_ID}-frontend"

# Create bucket
gsutil mb -l $REGION gs://$BUCKET_NAME

# Configure for website hosting
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload files
gsutil -m rsync -r -d dist gs://$BUCKET_NAME

# Verify upload
gsutil ls gs://$BUCKET_NAME
```

---

### Phase 3: Configure Load Balancer

**WHERE**: Your Mac Terminal  
**FOLDER**: Project root (or any folder)

```bash
# Navigate to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# All these commands run from your Mac Terminal
# They configure resources in Google Cloud

# Step 3.1: Reserve Static IP
gcloud compute addresses create sparktoship-ip --global
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip \
  --global --format='value(address)')
echo "Your Static IP: $STATIC_IP"

# Step 3.2: Create Backend Bucket
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME --enable-cdn

# Step 3.3: Create Network Endpoint Group for Cloud Run
gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=sparktoship-api

# Step 3.4: Create Backend Service
gcloud compute backend-services create sparktoship-api-backend --global
gcloud compute backend-services add-backend sparktoship-api-backend \
  --global \
  --network-endpoint-group=sparktoship-api-neg \
  --network-endpoint-group-region=$REGION

# Step 3.5: Create URL Map
gcloud compute url-maps create sparktoship-lb \
  --default-backend-bucket=sparktoship-frontend-backend

gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"

# Step 3.6: Create SSL Certificate
gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev \
  --global

# Step 3.7: Create HTTPS Proxy
gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb \
  --ssl-certificates=sparktoship-ssl-cert

# Step 3.8: Create Forwarding Rule
gcloud compute forwarding-rules create sparktoship-https-rule \
  --global \
  --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip \
  --ports=443
```

---

### Phase 4: Configure DNS (In Browser)

**WHERE**: Cloudflare Dashboard (in your web browser)  
**NOT in Terminal!**

1. Open browser: https://dash.cloudflare.com
2. Select your domain: `sparktoship.dev`
3. Go to DNS settings
4. Add A record:
   - Type: A
   - Name: @
   - Content: `<paste your STATIC_IP>`
   - Proxy: DNS only (gray cloud) initially
5. Wait 10-15 minutes for SSL certificate
6. Check status in Terminal:
   ```bash
   gcloud compute ssl-certificates describe sparktoship-ssl-cert \
     --global --format='get(managed.status)'
   ```
7. Once it shows "ACTIVE", go back to Cloudflare and enable proxy (orange cloud)

---

### Phase 5: Cost Management Scripts

**WHERE**: Your Mac Terminal  
**FOLDER**: Project root

```bash
# Navigate to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# Make scripts executable (already done, but just in case)
chmod +x pause-sparktoship.sh resume-sparktoship.sh daily-cost-check.sh

# Pause resources (saves money)
./pause-sparktoship.sh

# Resume resources
./resume-sparktoship.sh

# Check costs
./daily-cost-check.sh
```

---

## 📝 Quick Reference Card

### Where Am I?
```bash
# Check current folder
pwd

# Should be one of:
# /Users/sathya/web/python/adk/software-engineering-agents           ← Project root
# /Users/sathya/web/python/adk/software-engineering-agents/backend   ← Backend
# /Users/sathya/web/python/adk/software-engineering-agents/frontend  ← Frontend
```

### Navigation
```bash
# Go to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# Go to backend
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

# Go to frontend
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

# Go back to project root from anywhere
cd /Users/sathya/web/python/adk/software-engineering-agents
```

---

## ✅ Summary

| What | Where to Run | Folder |
|------|-------------|--------|
| **Install gcloud** | Mac Terminal | Any |
| **Authenticate** | Mac Terminal | Any |
| **Set variables** | Mac Terminal | Project root |
| **Create GCP project** | Mac Terminal | Project root |
| **Check Dockerfile** | Mac Terminal | `backend/` |
| **Deploy backend** | Mac Terminal | `backend/` |
| **Build frontend** | Mac Terminal | `frontend/` |
| **Upload frontend** | Mac Terminal | `frontend/` |
| **Configure Load Balancer** | Mac Terminal | Project root |
| **Configure DNS** | Browser | Cloudflare Dashboard |
| **Run cost scripts** | Mac Terminal | Project root |

**Key Point**: Everything runs on YOUR MAC in Terminal, except DNS configuration which is in your browser!

---

## 🎯 Ready to Start?

Open Terminal on your Mac and run:

```bash
# 1. Go to your project
cd /Users/sathya/web/python/adk/software-engineering-agents

# 2. Open the deployment guide
open OPTION_2_DEPLOYMENT_GUIDE.md

# 3. Start with Phase 1!
```

**Questions?** Now you know exactly where to run each command! 🚀
