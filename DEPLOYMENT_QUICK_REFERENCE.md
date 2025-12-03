# 🚀 SparkToShip Deployment Quick Reference

**Last Updated**: 2025-12-03

## ⚡ Quick Commands

### Deploy Everything
```bash
./deploy.sh
```

### Deploy Backend Only
```bash
cd backend
gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY}"
```

### Deploy Frontend Only
```bash
cd frontend
npm run build
gsutil -m rsync -r -d dist gs://sparktoship-frontend
```

## 🔍 Verify Deployment

```bash
# Test backend through load balancer
curl https://sparktoship.dev/api/health

# Test models endpoint
curl https://sparktoship.dev/api/models/google

# Open website
open https://sparktoship.dev
```

## ⚙️ Critical Configuration

### Backend: `backend/app/main.py`
```python
app = FastAPI(
    title="SparkToShip AI API", 
    version="1.0",
    root_path="/api"  # ⚠️ REQUIRED for load balancer
)
```

### Frontend: `frontend/.env.production`
```env
VITE_API_BASE_URL=https://sparktoship.dev/api
```

## 🌐 URLs

| Resource | URL |
|----------|-----|
| **Production Website** | https://sparktoship.dev |
| **API (via Load Balancer)** | https://sparktoship.dev/api |
| **Backend (Cloud Run)** | https://sparktoship-api-480987910366.us-west1.run.app |
| **Frontend Bucket** | gs://sparktoship-frontend |
| **Static IP** | 35.241.14.255 |

## 💰 Cost Management

```bash
# Pause resources (saves ~$18/month)
./pause-sparktoship.sh

# Resume resources
./resume-sparktoship.sh

# Check costs
./daily-cost-check.sh
```

## 🔧 Common Issues

### Model list not loading
1. Check backend has `root_path="/api"` in `main.py`
2. Verify `.env.production` has correct URL
3. Rebuild and redeploy: `./deploy.sh`

### CORS errors
- Verify `allow_origins` in `backend/app/main.py` includes:
  - `https://sparktoship.dev`
  - `https://www.sparktoship.dev`

### 404 on API calls
- Backend missing `root_path="/api"`
- Redeploy backend

## 📚 Documentation

- **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Full reference
- **[README](./README.md)** - Project overview
- **[Cost Optimization](./COST_OPTIMIZATION_GUIDE.md)** - Save money

## 🎯 Pre-Deployment Checklist

- [ ] Backend has `root_path="/api"` in `main.py`
- [ ] Frontend has `.env.production` with correct URL
- [ ] Environment variable `GOOGLE_API_KEY` is set (optional)
- [ ] Run `./deploy.sh` from project root
- [ ] Test: `curl https://sparktoship.dev/api/health`
- [ ] Open: https://sparktoship.dev
- [ ] Verify model dropdown works

---

**Need help?** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.
