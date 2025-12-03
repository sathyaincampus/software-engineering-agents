# 🚀 SparkToShip - Deployment Quick Start

## What You're Deploying

**Option 2**: FastAPI + Vertex AI (Hybrid)
- ✅ Zero frontend changes
- ✅ All features preserved  
- ✅ $24/month (12+ months free)

---

## ⚡ Quick Start (2 Hours)

### 1. Prerequisites (15 min)
```bash
# Install gcloud
brew install --cask google-cloud-sdk

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set variables
export PROJECT_ID="sparktoship"
export REGION="us-west1"
export GEMINI_API_KEY="your_key"

# Create project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com storage.googleapis.com
```

### 2. Deploy Backend (30 min)
```bash
cd backend
# Create Dockerfile (see main guide)
gcloud run deploy sparktoship-api --source . --region=$REGION \
  --allow-unauthenticated --set-env-vars="GOOGLE_API_KEY=$GEMINI_API_KEY"
```

### 3. Deploy Frontend (30 min)
```bash
cd ../frontend
npm run build
gsutil mb -l $REGION gs://${PROJECT_ID}-frontend
gsutil -m rsync -r dist gs://${PROJECT_ID}-frontend
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-frontend
```

### 4. Configure Load Balancer (45 min)
See [OPTION_2_DEPLOYMENT_GUIDE.md](./OPTION_2_DEPLOYMENT_GUIDE.md) Phase 3

---

## 💰 Cost Management

### Daily Usage
```bash
./resume-sparktoship.sh  # Morning
./pause-sparktoship.sh   # Evening
./daily-cost-check.sh    # Anytime
```

### Expected Costs
- Active 24/7: $24/month
- Paused overnight: $12/month ⭐
- Paused: $1/month

---

## 🔧 Common Tasks

### Update Backend
```bash
cd backend
gcloud run deploy sparktoship-api --source . --region=$REGION
```

### Update Frontend
```bash
cd frontend
npm run build
gsutil -m rsync -r -d dist gs://${PROJECT_ID}-frontend
```

### Check What's Running
```bash
./daily-cost-check.sh
```

---

## 🆘 Troubleshooting

### Permission Denied
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/editor"
```

### High Costs
```bash
./pause-sparktoship.sh
./daily-cost-check.sh
```

---

## 📋 Checklist

- [ ] Google Cloud account ($300 credit)
- [ ] gcloud CLI installed
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Cloud Storage
- [ ] Load Balancer configured
- [ ] DNS configured
- [ ] Budget alerts set up
- [ ] Scripts tested

---

## 🎯 Next Steps

1. **Deploy**: Follow [OPTION_2_DEPLOYMENT_GUIDE.md](./OPTION_2_DEPLOYMENT_GUIDE.md)
2. **Optimize**: Read [COST_OPTIMIZATION_GUIDE.md](./COST_OPTIMIZATION_GUIDE.md)
3. **Monitor**: Run `./daily-cost-check.sh` daily

---

**Ready? Start with [OPTION_2_DEPLOYMENT_GUIDE.md](./OPTION_2_DEPLOYMENT_GUIDE.md)!** 🚀
