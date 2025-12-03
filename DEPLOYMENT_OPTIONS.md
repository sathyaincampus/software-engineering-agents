# SparkToShip - Deployment Options Summary

## 🎯 Overview

You have **two excellent options** for deploying SparkToShip to Google Cloud Platform. This document helps you choose the right one for your needs.

---

## 📊 Quick Comparison

| Feature | **Vertex AI Agent Engine** ⭐ | **Cloud Run** |
|---------|------------------------------|---------------|
| **Recommended For** | Production ADK deployments | General web services |
| **Deployment Complexity** | ⭐⭐⭐⭐⭐ Easiest (1 command) | ⭐⭐⭐ Moderate (Docker + config) |
| **Session Management** | ✅ Built-in (Firestore) | ❌ Manual setup required |
| **Cost (10 projects/month)** | **$19.18/month** | **$19.68/month** |
| **Cost (100 projects/month)** | **$19.18/month** | **$19.68/month** |
| **Free Trial Duration** | **15.6 months** | **15.2 months** |
| **Auto-scaling** | ✅ Built-in | ✅ Built-in |
| **ADK Optimized** | ✅ Purpose-built for agents | ⚠️ General purpose |
| **Deployment Command** | `adk deploy agent_engine` | `gcloud run deploy` |
| **Learning Curve** | Low (ADK-native) | Medium (Docker knowledge) |

---

## 🏆 Recommendation: Vertex AI Agent Engine

**For SparkToShip, we recommend Vertex AI Agent Engine** because:

1. ✅ **Purpose-built for ADK agents** - Optimized for your use case
2. ✅ **Simpler deployment** - One command vs multi-step Docker process
3. ✅ **Built-in session management** - Firestore integration included
4. ✅ **Slightly lower cost** - $0.50/month savings
5. ✅ **Better for learning** - Covered in Kaggle notebooks you have

---

## 💰 Cost Breakdown

### Vertex AI Agent Engine Deployment

```
Monthly Cost (10 projects):
├── Vertex AI Agent Engine:  $0.00  ✅ (Free tier)
├── Firestore (Sessions):    $0.00  ✅ (Free tier)
├── Cloud Storage:            $1.10
└── Load Balancer:           $18.08
────────────────────────────────────
TOTAL:                       $19.18/month

Free Trial: Lasts 15.6 months ✅
```

### Cloud Run Deployment

```
Monthly Cost (10 projects):
├── Cloud Run (Backend):     $0.00  ✅ (Free tier)
├── Cloud Storage:           $1.10
├── Load Balancer:          $18.08
└── Artifact Registry:       $0.50
────────────────────────────────────
TOTAL:                      $19.68/month

Free Trial: Lasts 15.2 months ✅
```

### Key Insight

**Both options stay within free tiers for compute!** The main costs are:
- **Load Balancer**: $18/month (required for custom domain)
- **Cloud Storage**: $1.10/month (frontend hosting)

---

## 📚 Documentation & Tools

### Vertex AI Agent Engine (Recommended)

**Documentation**:
- 📖 [VERTEX_AI_DEPLOYMENT_GUIDE.md](./VERTEX_AI_DEPLOYMENT_GUIDE.md) - Complete deployment guide
- 💰 [vertex-ai-cost-calculator.py](./vertex-ai-cost-calculator.py) - Cost estimation tool

**Cost Calculator**:
```bash
# Estimate costs
python3 vertex-ai-cost-calculator.py --projects 10 --duration 7

# Different scenarios
python3 vertex-ai-cost-calculator.py --projects 100 --duration 10
```

**Deployment Command**:
```bash
adk deploy agent_engine \
  --project=$PROJECT_ID \
  --region=$REGION \
  sparktoship_agent
```

### Cloud Run (Alternative)

**Documentation**:
- 📖 [GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md](./GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md) - Complete deployment guide
- 💰 [cost-calculator.py](./cost-calculator.py) - Cost estimation tool

**Cost Calculator**:
```bash
# Estimate costs
python3 cost-calculator.py --projects 10 --duration 7

# Different scenarios
python3 cost-calculator.py --projects 100 --duration 10
```

**Deployment Commands**:
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/sparktoship-backend
gcloud run deploy sparktoship-backend \
  --image gcr.io/$PROJECT_ID/sparktoship-backend \
  --region=$REGION
```

---

## 🚀 Quick Start Guide

### Option 1: Vertex AI Agent Engine (Recommended)

1. **Review the guide**:
   ```bash
   cat VERTEX_AI_DEPLOYMENT_GUIDE.md
   ```

2. **Estimate costs**:
   ```bash
   python3 vertex-ai-cost-calculator.py --projects 10
   ```

3. **Deploy**:
   ```bash
   cd backend
   adk deploy agent_engine \
     --project=sparktoship-prod \
     --region=us-west1 \
     sparktoship_agent
   ```

4. **Deploy frontend** (same for both options):
   ```bash
   cd frontend
   npm run build
   gsutil -m rsync -r -d dist gs://sparktoship-frontend
   ```

### Option 2: Cloud Run

1. **Review the guide**:
   ```bash
   cat GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md
   ```

2. **Estimate costs**:
   ```bash
   python3 cost-calculator.py --projects 10
   ```

3. **Deploy**:
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/sparktoship-prod/sparktoship-backend
   gcloud run deploy sparktoship-backend \
     --image gcr.io/sparktoship-prod/sparktoship-backend \
     --region=us-central1
   ```

---

## 🔍 Detailed Comparison

### Deployment Process

#### Vertex AI Agent Engine
```
1. Create agent directory structure
2. Add agent.py, requirements.txt, .env, config.json
3. Run: adk deploy agent_engine
4. Done! ✅
```

**Time**: ~5 minutes

#### Cloud Run
```
1. Create Dockerfile
2. Build Docker image
3. Push to Artifact Registry
4. Deploy to Cloud Run
5. Configure environment variables
6. Set up session storage (optional)
```

**Time**: ~15 minutes

### Session Management

#### Vertex AI Agent Engine
- ✅ **Built-in Firestore integration**
- ✅ Automatic session persistence
- ✅ No additional configuration needed
- ✅ Covered by free tier

#### Cloud Run
- ❌ **Manual setup required**
- ⚠️ Need to configure Firestore separately
- ⚠️ More code to write
- ⚠️ Additional complexity

### Scaling

Both options auto-scale identically:
- Scale to zero when idle
- Scale up based on demand
- Pay only for what you use

### Monitoring

#### Vertex AI Agent Engine
- View in Cloud Console → Vertex AI → Agent Engine
- Built-in metrics and logging
- Agent-specific dashboards

#### Cloud Run
- View in Cloud Console → Cloud Run
- Standard Cloud Run metrics
- General-purpose dashboards

---

## 🎓 Learning Resources

### Vertex AI Agent Engine

From your Kaggle notebooks:
- **day-5b-agent-deployment.ipynb** - Complete deployment tutorial
- **day-1a-from-prompt-to-action.ipynb** - ADK basics
- **day-3a-agent-sessions.ipynb** - Session management
- **day-4a-agent-observability.ipynb** - Monitoring

### Cloud Run

Official documentation:
- [Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts)
- [Deploy from Source](https://cloud.google.com/run/docs/deploying-source-code)
- [Container Runtime Contract](https://cloud.google.com/run/docs/container-contract)

---

## 🤔 Decision Matrix

### Choose Vertex AI Agent Engine if:
- ✅ You want the **simplest deployment**
- ✅ You're **learning ADK** (matches Kaggle notebooks)
- ✅ You want **built-in session management**
- ✅ You prefer **ADK-native tools**
- ✅ You want to **minimize configuration**

### Choose Cloud Run if:
- ✅ You have **existing Docker expertise**
- ✅ You need **custom container configuration**
- ✅ You're deploying **non-ADK services** alongside
- ✅ You want **maximum flexibility**
- ✅ You prefer **general-purpose platforms**

---

## 💡 Our Recommendation

**For SparkToShip, use Vertex AI Agent Engine** because:

1. **Matches your learning materials** - The Kaggle notebooks you have cover Agent Engine deployment
2. **Simpler for ADK** - Purpose-built for your use case
3. **Less code to maintain** - No Dockerfile, no manual session setup
4. **Slightly cheaper** - $0.50/month savings
5. **Better developer experience** - `adk deploy` vs multi-step Docker process

---

## 📊 Cost Scenarios

### Scenario 1: Development (10 projects/month)

| Service | Vertex AI | Cloud Run |
|---------|-----------|-----------|
| Compute | $0.00 | $0.00 |
| Storage | $1.10 | $1.10 |
| Load Balancer | $18.08 | $18.08 |
| Other | $0.00 | $0.50 |
| **Total** | **$19.18** | **$19.68** |

### Scenario 2: Production (100 projects/month)

| Service | Vertex AI | Cloud Run |
|---------|-----------|-----------|
| Compute | $0.00 | $0.00 |
| Storage | $1.10 | $1.10 |
| Load Balancer | $18.08 | $18.08 |
| Other | $0.00 | $0.50 |
| **Total** | **$19.18** | **$19.68** |

### Scenario 3: Heavy Usage (1000 projects/month)

| Service | Vertex AI | Cloud Run |
|---------|-----------|-----------|
| Compute | $12.50 | $15.00 |
| Storage | $5.10 | $5.10 |
| Load Balancer | $18.50 | $18.50 |
| Other | $0.90 | $0.50 |
| **Total** | **$37.00** | **$39.10** |

---

## ✅ Next Steps

1. **Review both guides**:
   - `VERTEX_AI_DEPLOYMENT_GUIDE.md` (recommended)
   - `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md` (alternative)

2. **Run cost calculators**:
   ```bash
   python3 vertex-ai-cost-calculator.py --projects 10
   python3 cost-calculator.py --projects 10
   ```

3. **Choose your deployment method**

4. **Follow the deployment guide**

5. **Deploy to production!** 🚀

---

## 📞 Support

- **Vertex AI Agent Engine**: [Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview)
- **Cloud Run**: [Documentation](https://cloud.google.com/run/docs)
- **ADK**: [Documentation](https://google.github.io/adk-docs/)
- **Community**: [Google Cloud Community](https://www.googlecloudcommunity.com/)

---

**Ready to deploy?** We recommend starting with **Vertex AI Agent Engine** for the best experience! 🎉
