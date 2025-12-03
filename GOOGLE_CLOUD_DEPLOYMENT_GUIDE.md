# SparkToShip - Google Cloud Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Steps](#deployment-steps)
5. [Cloudflare Domain Configuration](#cloudflare-domain-configuration)
6. [Cost Estimation](#cost-estimation)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide walks you through deploying **SparkToShip** on Google Cloud Platform (GCP) and connecting it to your **sparktoship.dev** domain purchased on Cloudflare.

### Deployment Strategy

We'll use the following GCP services:
- **Cloud Run**: For containerized backend (FastAPI) - serverless, auto-scaling
- **Cloud Storage**: For static frontend hosting (React/Vite build)
- **Cloud Load Balancer**: For HTTPS and domain routing
- **Artifact Registry**: For Docker image storage
- **Cloud Build**: For CI/CD automation
- **Firestore/Cloud SQL**: For project persistence (optional upgrade from file-based)

---

## Prerequisites

### 1. Google Cloud Setup
- [ ] Google Cloud account with **$300 free trial credit** activated
- [ ] Project created (e.g., `sparktoship-prod`)
- [ ] Billing enabled
- [ ] `gcloud` CLI installed and authenticated

### 2. Cloudflare Setup
- [ ] Domain `sparktoship.dev` purchased and active
- [ ] Cloudflare account with domain management access
- [ ] API token for DNS management (optional for automation)

### 3. Local Development Environment
- [ ] Docker installed
- [ ] Node.js 18+ and npm
- [ ] Python 3.10+
- [ ] Git

### 4. API Keys
- [ ] Google Gemini API key (for AI agents)
- [ ] Google Cloud service account key (for deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare DNS                            │
│              sparktoship.dev → GCP Load Balancer             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (SSL/TLS)
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Google Cloud Load Balancer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  URL Map:                                             │  │
│  │  - sparktoship.dev/*        → Cloud Storage (Frontend)│  │
│  │  - sparktoship.dev/api/*    → Cloud Run (Backend)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌─────────▼────────┐
│  Cloud Storage  │            │    Cloud Run     │
│   (Frontend)    │            │    (Backend)     │
│                 │            │                  │
│  - React Build  │            │  - FastAPI       │
│  - Static Files │            │  - ADK Agents    │
│  - index.html   │            │  - Gemini API    │
└─────────────────┘            └──────────────────┘
                                        │
                               ┌────────▼────────┐
                               │  Artifact Reg   │
                               │  (Docker Image) │
                               └─────────────────┘
```

---

## Deployment Steps

### Step 1: Prepare Your Project

#### 1.1 Clone and Navigate
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents
```

#### 1.2 Set Environment Variables
```bash
export PROJECT_ID="sparktoship-prod"
export REGION="us-central1"
export SERVICE_NAME="sparktoship-backend"
export BUCKET_NAME="sparktoship-frontend"
export DOMAIN="sparktoship.dev"
```

#### 1.3 Configure gcloud
```bash
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
```

---

### Step 2: Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  storage.googleapis.com \
  cloudresourcemanager.googleapis.com
```

---

### Step 3: Create Artifact Registry Repository

```bash
gcloud artifacts repositories create sparktoship-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="SparkToShip Docker images"
```

---

### Step 4: Build and Deploy Backend

#### 4.1 Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Create data directory for project storage
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8080/health')"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

#### 4.2 Add Health Check Endpoint

Add to `backend/app/main.py`:

```python
@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {"status": "healthy", "service": "sparktoship-backend"}
```

#### 4.3 Update CORS for Production

Update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://sparktoship.dev",  # Add your domain
        "https://www.sparktoship.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4.4 Build and Push Docker Image

```bash
cd backend

# Build the image
gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/sparktoship-repo/$SERVICE_NAME:latest

cd ..
```

#### 4.5 Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/sparktoship-repo/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY,MODEL_NAME=gemini-2.0-flash-exp \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

**Note the Cloud Run service URL** (e.g., `https://sparktoship-backend-xxxxx-uc.a.run.app`)

---

### Step 5: Build and Deploy Frontend

#### 5.1 Update Frontend API URL

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://sparktoship.dev/api
```

#### 5.2 Update Frontend Code

Update `frontend/src/config.ts` (create if doesn't exist):

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

Update all API calls to use this config instead of hardcoded URLs.

#### 5.3 Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

#### 5.4 Create Cloud Storage Bucket

```bash
# Create bucket
gsutil mb -l $REGION gs://$BUCKET_NAME

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Enable website configuration
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
```

#### 5.5 Upload Frontend Build

```bash
gsutil -m rsync -r -d frontend/dist gs://$BUCKET_NAME
```

---

### Step 6: Set Up Load Balancer

#### 6.1 Reserve Static IP

```bash
gcloud compute addresses create sparktoship-ip \
  --global
```

Get the IP address:
```bash
gcloud compute addresses describe sparktoship-ip --global --format="get(address)"
```

**Save this IP** - you'll need it for Cloudflare DNS.

#### 6.2 Create Backend Service for Cloud Run

```bash
# Create serverless NEG for Cloud Run
gcloud compute network-endpoint-groups create sparktoship-backend-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=$SERVICE_NAME

# Create backend service
gcloud compute backend-services create sparktoship-backend-service \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED

# Add backend
gcloud compute backend-services add-backend sparktoship-backend-service \
  --global \
  --network-endpoint-group=sparktoship-backend-neg \
  --network-endpoint-group-region=$REGION
```

#### 6.3 Create Backend Bucket for Frontend

```bash
gcloud compute backend-buckets create sparktoship-frontend-bucket \
  --gcs-bucket-name=$BUCKET_NAME \
  --enable-cdn
```

#### 6.4 Create URL Map

```bash
gcloud compute url-maps create sparktoship-url-map \
  --default-backend-bucket=sparktoship-frontend-bucket
```

#### 6.5 Add Path Matcher for API

```bash
gcloud compute url-maps add-path-matcher sparktoship-url-map \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-bucket \
  --backend-service-path-rules="/api/*=sparktoship-backend-service"
```

#### 6.6 Create SSL Certificate

**Option A: Google-Managed Certificate (Recommended)**

```bash
gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=$DOMAIN,www.$DOMAIN \
  --global
```

**Option B: Use Cloudflare SSL (Flexible/Full)**
Skip this step and use Cloudflare's SSL termination.

#### 6.7 Create HTTPS Proxy

```bash
gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-url-map \
  --ssl-certificates=sparktoship-ssl-cert
```

#### 6.8 Create Forwarding Rule

```bash
gcloud compute forwarding-rules create sparktoship-https-forwarding-rule \
  --global \
  --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip \
  --ports=443
```

#### 6.9 Create HTTP to HTTPS Redirect (Optional)

```bash
gcloud compute url-maps import sparktoship-url-map \
  --global \
  --source /dev/stdin <<EOF
name: sparktoship-url-map
defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendBuckets/sparktoship-frontend-bucket
hostRules:
- hosts:
  - $DOMAIN
  pathMatcher: api-matcher
pathMatchers:
- name: api-matcher
  defaultService: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendBuckets/sparktoship-frontend-bucket
  pathRules:
  - paths:
    - /api/*
    service: https://www.googleapis.com/compute/v1/projects/$PROJECT_ID/global/backendServices/sparktoship-backend-service
EOF
```

---

## Cloudflare Domain Configuration

### Step 1: Add DNS Records

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain `sparktoship.dev`
3. Go to **DNS** → **Records**
4. Add the following records:

**A Record:**
- **Type**: A
- **Name**: @ (root domain)
- **IPv4 address**: `<YOUR_STATIC_IP_FROM_STEP_6.1>`
- **Proxy status**: Proxied (orange cloud) ✅
- **TTL**: Auto

**CNAME Record (www):**
- **Type**: CNAME
- **Name**: www
- **Target**: sparktoship.dev
- **Proxy status**: Proxied (orange cloud) ✅
- **TTL**: Auto

### Step 2: Configure SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)** if using Google-managed SSL
3. Or set to **Flexible** if using Cloudflare SSL only

### Step 3: Enable Performance Features

1. **Speed** → **Optimization**
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli compression

2. **Caching** → **Configuration**
   - Set Browser Cache TTL to 4 hours
   - Enable Always Online

### Step 4: Set Up Page Rules (Optional)

Create page rules for better performance:

**Rule 1: Cache Frontend Assets**
- URL: `sparktoship.dev/*.js`
- Settings: Cache Level = Cache Everything, Edge Cache TTL = 1 month

**Rule 2: Bypass Cache for API**
- URL: `sparktoship.dev/api/*`
- Settings: Cache Level = Bypass

---

## Cost Estimation

### Monthly Cost Breakdown (10 Projects/Month)

#### Assumptions:
- **10 projects per month** (each project takes ~5-10 minutes)
- **Users bring their own Gemini API keys** (no AI costs for you)
- **Low to moderate traffic** (100-500 requests/day)
- **Using $300 free trial credit**

#### Google Cloud Costs:

| Service | Usage | Cost/Month | Notes |
|---------|-------|------------|-------|
| **Cloud Run (Backend)** | ~50 hours/month, 2GB RAM | $0-5 | Free tier: 180,000 vCPU-seconds, 360,000 GiB-seconds |
| **Cloud Storage (Frontend)** | 1GB storage, 10GB egress | $0.02 + $1.20 = $1.22 | First 5GB egress free |
| **Cloud Load Balancer** | Forwarding rules + traffic | $18 + $0.80 = $18.80 | $18/month base + $0.008/GB |
| **Artifact Registry** | 5GB storage | $0.50 | $0.10/GB/month |
| **Cloud Build** | 10 builds/month | $0 | Free tier: 120 build-minutes/day |
| **Networking** | Minimal egress | $1-2 | |
| **SSL Certificate** | Google-managed | $0 | Free |

**Total GCP Cost: ~$20-25/month**

#### Cloudflare Costs:
- **Domain Registration**: ~$10-15/year (already paid)
- **Cloudflare Free Plan**: $0/month
- **Pro Plan (Optional)**: $20/month (better caching, analytics)

**Total Cloudflare Cost: $0/month (Free Plan)**

### Total Monthly Cost: **$20-25/month**

### With $300 Free Trial:
- **Trial Duration**: 90 days
- **Total Cost for 90 days**: ~$60-75
- **Remaining Credit**: $225-240
- **You can run for ~12-15 months** on the free trial!

### Cost Optimization Tips:

1. **Use Cloud Run Min Instances = 0**: Only pay when serving requests
2. **Enable CDN Caching**: Reduce backend calls
3. **Compress Assets**: Reduce egress costs
4. **Use Cloudflare Caching**: Reduce GCP egress
5. **Monitor Usage**: Set up billing alerts

### Scaling Costs (100 Projects/Month):

| Service | Cost/Month |
|---------|------------|
| Cloud Run | $10-20 |
| Cloud Storage | $2-3 |
| Load Balancer | $25-30 |
| Networking | $5-10 |
| **Total** | **$42-63/month** |

---

## Monitoring and Maintenance

### Set Up Monitoring

#### 1. Cloud Monitoring Dashboard

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Create uptime check
gcloud monitoring uptime create sparktoship-uptime \
  --resource-type=uptime-url \
  --host=$DOMAIN \
  --path=/health
```

#### 2. Set Up Alerts

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="SparkToShip High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=60s
```

#### 3. Log Aggregation

View logs:
```bash
# Backend logs
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50

# Load balancer logs
gcloud logging read "resource.type=http_load_balancer" --limit=50
```

### Maintenance Tasks

#### Weekly:
- [ ] Check error logs
- [ ] Review billing dashboard
- [ ] Monitor uptime

#### Monthly:
- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Backup project data
- [ ] Update SSL certificates (if needed)

---

## Troubleshooting

### Issue 1: SSL Certificate Not Provisioning

**Symptoms**: HTTPS not working, certificate pending

**Solutions**:
```bash
# Check certificate status
gcloud compute ssl-certificates describe sparktoship-ssl-cert --global

# Ensure DNS is pointing to correct IP
nslookup sparktoship.dev

# Wait 15-60 minutes for provisioning
```

### Issue 2: Backend Not Receiving Requests

**Symptoms**: API calls failing, 502/503 errors

**Solutions**:
```bash
# Check Cloud Run service status
gcloud run services describe $SERVICE_NAME --region=$REGION

# Check backend service health
gcloud compute backend-services get-health sparktoship-backend-service --global

# View logs
gcloud run services logs read $SERVICE_NAME --region=$REGION
```

### Issue 3: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
1. Verify CORS origins in `backend/app/main.py`
2. Ensure domain is added to `allow_origins`
3. Redeploy backend:
```bash
gcloud run services update $SERVICE_NAME --region=$REGION
```

### Issue 4: High Costs

**Symptoms**: Billing exceeds expectations

**Solutions**:
```bash
# Check current costs
gcloud billing accounts list
gcloud billing projects describe $PROJECT_ID

# Set budget alerts
gcloud billing budgets create \
  --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="SparkToShip Budget" \
  --budget-amount=50USD

# Reduce Cloud Run instances
gcloud run services update $SERVICE_NAME \
  --max-instances=5 \
  --region=$REGION
```

### Issue 5: Frontend Not Loading

**Symptoms**: Blank page, 404 errors

**Solutions**:
```bash
# Check bucket contents
gsutil ls gs://$BUCKET_NAME

# Verify bucket is public
gsutil iam get gs://$BUCKET_NAME

# Re-upload frontend
gsutil -m rsync -r -d frontend/dist gs://$BUCKET_NAME

# Clear Cloudflare cache
# Go to Cloudflare Dashboard → Caching → Purge Everything
```

---

## CI/CD Automation (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GCP

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Build and Deploy Backend
        run: |
          gcloud builds submit backend/ \
            --tag us-central1-docker.pkg.dev/${{ secrets.PROJECT_ID }}/sparktoship-repo/sparktoship-backend:latest
          
          gcloud run deploy sparktoship-backend \
            --image us-central1-docker.pkg.dev/${{ secrets.PROJECT_ID }}/sparktoship-repo/sparktoship-backend:latest \
            --region us-central1
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Storage
        run: |
          gsutil -m rsync -r -d frontend/dist gs://sparktoship-frontend
```

---

## Next Steps

1. **Test the Deployment**:
   ```bash
   curl https://sparktoship.dev/health
   curl https://sparktoship.dev/api/health
   ```

2. **Set Up Custom Domain Email** (Optional):
   - Use Google Workspace or Cloudflare Email Routing
   - Create `hello@sparktoship.dev`, `support@sparktoship.dev`

3. **Add Analytics**:
   - Google Analytics 4
   - Cloudflare Web Analytics (privacy-friendly)

4. **Implement Authentication** (Future):
   - Firebase Auth
   - Auth0
   - Google Identity Platform

5. **Database Migration** (Future):
   - Move from file-based storage to Cloud Firestore or Cloud SQL
   - Better scalability and multi-user support

---

## Summary

You now have:
- ✅ Backend deployed on Cloud Run
- ✅ Frontend hosted on Cloud Storage
- ✅ Load Balancer with HTTPS
- ✅ Custom domain `sparktoship.dev` via Cloudflare
- ✅ ~$20-25/month cost (covered by $300 free trial)
- ✅ Scalable architecture for 10-100+ projects/month

**Estimated Trial Duration**: 12-15 months with current usage

**Questions?** Check the troubleshooting section or open an issue!

---

**Last Updated**: December 1, 2025  
**Version**: 1.0.0  
**Author**: SparkToShip Team
