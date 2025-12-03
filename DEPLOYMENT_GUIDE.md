# SparkToShip Deployment Guide

Complete guide for deploying SparkToShip to Google Cloud Platform with custom domain.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Load Balancer Setup](#load-balancer-setup)
- [Regular Updates](#regular-updates)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
gsutil --version

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project sparktoship
```

### Required Environment Variables
```bash
# Set these in your terminal or add to ~/.zshrc
export GOOGLE_API_KEY="your-gemini-api-key"
export REGION="us-west1"
export PROJECT_ID="sparktoship"
```

---

## Initial Setup

### 1. Enable Required APIs
```bash
gcloud services enable compute.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Reserve Static IP
```bash
gcloud compute addresses create sparktoship-ip --global
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip --global --format='value(address)')
echo "Static IP: $STATIC_IP"
```

### 3. Configure DNS
Point your domain to the static IP:
- **Domain**: sparktoship.dev
- **Type**: A Record
- **Value**: `35.241.14.255` (your static IP)
- **TTL**: 300

---

## Backend Deployment

### Important: Backend Configuration

**CRITICAL**: The backend must be configured with `root_path="/api"` to work with the load balancer.

In `backend/app/main.py`:
```python
app = FastAPI(
    title="SparkToShip AI API", 
    version="1.0",
    root_path="/api"  # Required for load balancer routing
)
```

### Deploy Backend to Cloud Run

```bash
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

# Deploy to Cloud Run
gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"

# Note the service URL (e.g., https://sparktoship-api-480987910366.us-west1.run.app)
```

### Verify Backend
```bash
# Test the Cloud Run URL directly
curl https://sparktoship-api-480987910366.us-west1.run.app/health
```

---

## Frontend Deployment

### Important: Frontend Configuration

**CRITICAL**: The frontend must be built with the production environment variable.

### 1. Configure Production Environment

Create/verify `frontend/.env.production`:
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

# Create production environment file
echo "VITE_API_BASE_URL=https://sparktoship.dev/api" > .env.production

# Verify the file
cat .env.production
```

**Output should be:**
```
VITE_API_BASE_URL=https://sparktoship.dev/api
```

### 2. Build Frontend

```bash
# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Verify the build
ls -la dist/
```

### 3. Deploy to Cloud Storage

```bash
# Set bucket name
export BUCKET_NAME="sparktoship-frontend"

# Create bucket (only needed once)
# gsutil mb -l us-west1 gs://$BUCKET_NAME

# Configure bucket for web hosting (only needed once)
# gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make bucket public (only needed once)
# gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Sync files to bucket
gsutil -m rsync -r -d dist gs://$BUCKET_NAME

# Verify deployment
gsutil ls gs://$BUCKET_NAME
```

---

## Load Balancer Setup

### Only needed for initial setup. Skip if already configured.

### 1. Create Backend Bucket
```bash
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME --enable-cdn
```

### 2. Create Network Endpoint Group
```bash
gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=sparktoship-api
```

### 3. Create Backend Service
```bash
gcloud compute backend-services create sparktoship-api-backend --global

gcloud compute backend-services add-backend sparktoship-api-backend \
  --global \
  --network-endpoint-group=sparktoship-api-neg \
  --network-endpoint-group-region=$REGION
```

### 4. Create URL Map
```bash
gcloud compute url-maps create sparktoship-lb \
  --default-backend-bucket=sparktoship-frontend-backend

gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"
```

### 5. Create SSL Certificate
```bash
gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev --global
```

### 6. Create HTTPS Proxy
```bash
gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb \
  --ssl-certificates=sparktoship-ssl-cert
```

### 7. Create Forwarding Rule
```bash
gcloud compute forwarding-rules create sparktoship-https-rule \
  --global \
  --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip \
  --ports=443
```

### 8. Wait for SSL Certificate
```bash
# Check SSL certificate status (takes 10-60 minutes)
gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global --format='get(managed.status)'

# Should show: ACTIVE (when ready)
```

---

## Regular Updates

Use these commands for regular deployments after code changes.

### Quick Update Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying SparkToShip..."

# Deploy Backend
echo "📦 Deploying Backend..."
cd backend
gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}" \
  --quiet

echo "✅ Backend deployed!"

# Deploy Frontend
echo "📦 Building Frontend..."
cd ../frontend

# Verify production env
if [ ! -f .env.production ]; then
    echo "VITE_API_BASE_URL=https://sparktoship.dev/api" > .env.production
fi

npm run build

echo "📦 Deploying Frontend..."
gsutil -m rsync -r -d dist gs://sparktoship-frontend

echo "✅ Frontend deployed!"
echo "🎉 Deployment complete!"
echo "🌐 Visit: https://sparktoship.dev"
```

Make it executable:
```bash
chmod +x deploy.sh
```

### Manual Update Steps

#### Update Backend Only
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"
```

#### Update Frontend Only
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

# Verify .env.production exists
cat .env.production

# Build
npm run build

# Deploy
gsutil -m rsync -r -d dist gs://sparktoship-frontend
```

---

## Verification

### Test Backend Through Load Balancer
```bash
# Health check
curl https://sparktoship.dev/api/health

# Models endpoint
curl https://sparktoship.dev/api/models/google

# Expected output: JSON with model list
```

### Test Frontend
```bash
# Check frontend loads
curl -I https://sparktoship.dev/

# Expected: HTTP/2 200
```

### Browser Test
1. Open https://sparktoship.dev
2. Click Settings icon
3. Select AI Provider: Google (Gemini)
4. Verify Model dropdown shows Gemini models
5. Enter your API key
6. Test idea generation

---

## Troubleshooting

### Issue: Model list not loading

**Symptom**: Model dropdown is empty or shows error

**Solution**:
1. Check backend configuration has `root_path="/api"`:
   ```bash
   grep "root_path" backend/app/main.py
   ```
   Should show: `root_path="/api"`

2. Verify frontend environment:
   ```bash
   cat frontend/.env.production
   ```
   Should show: `VITE_API_BASE_URL=https://sparktoship.dev/api`

3. Rebuild and redeploy both:
   ```bash
   ./deploy.sh
   ```

### Issue: CORS errors

**Symptom**: Browser console shows CORS errors

**Solution**: Verify backend CORS configuration in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "https://sparktoship.dev",
        "https://www.sparktoship.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: 404 errors on API calls

**Symptom**: API calls return 404

**Solution**: 
1. Verify `root_path="/api"` is set in backend
2. Redeploy backend:
   ```bash
   cd backend
   gcloud run deploy sparktoship-api --source . --region=us-west1 --allow-unauthenticated
   ```

### Issue: Frontend shows old version

**Symptom**: Changes not visible after deployment

**Solution**:
1. Clear browser cache (Cmd+Shift+R on Mac)
2. Verify files were uploaded:
   ```bash
   gsutil ls -lh gs://sparktoship-frontend/
   ```
3. Check file timestamps are recent

### Issue: SSL certificate not active

**Symptom**: HTTPS not working

**Solution**:
1. Check certificate status:
   ```bash
   gcloud compute ssl-certificates describe sparktoship-ssl-cert --global
   ```
2. Verify DNS is pointing to correct IP:
   ```bash
   dig +short sparktoship.dev @8.8.8.8
   ```
   Should show: `35.241.14.255`
3. Wait 10-60 minutes for certificate provisioning

---

## Cost Management

### Pause Resources
```bash
./pause-sparktoship.sh
```

### Resume Resources
```bash
./resume-sparktoship.sh
```

### Check Daily Costs
```bash
./daily-cost-check.sh
```

---

## Important Files Checklist

Before deploying, verify these files:

- [ ] `backend/app/main.py` - Has `root_path="/api"`
- [ ] `frontend/.env.production` - Has `VITE_API_BASE_URL=https://sparktoship.dev/api`
- [ ] `backend/Dockerfile` - Exists and is correct
- [ ] `frontend/dist/` - Built with production env

---

## Quick Reference

### Backend URL
- **Cloud Run**: https://sparktoship-api-480987910366.us-west1.run.app
- **Through Load Balancer**: https://sparktoship.dev/api

### Frontend URL
- **Cloud Storage**: gs://sparktoship-frontend
- **Public URL**: https://sparktoship.dev

### Key Configuration
- **Backend root_path**: `/api`
- **Frontend API URL**: `https://sparktoship.dev/api`
- **Static IP**: `35.241.14.255`
- **Region**: `us-west1`

---

## Summary

### First Time Setup
1. Enable APIs
2. Reserve static IP
3. Configure DNS
4. Deploy backend
5. Deploy frontend
6. Set up load balancer
7. Wait for SSL certificate

### Regular Updates
1. Make code changes
2. Run `./deploy.sh` OR
3. Deploy backend: `cd backend && gcloud run deploy ...`
4. Deploy frontend: `cd frontend && npm run build && gsutil rsync ...`
5. Verify: https://sparktoship.dev

---

**Last Updated**: 2025-12-03
**Status**: ✅ Production Ready
