# Vertex AI vs Cloud Run: Cost Impact Analysis

## 📊 Executive Summary

**Question**: How does using Vertex AI Agent Engine for deployment impact costs compared to Cloud Run?

**Answer**: **Minimal impact** - Vertex AI is actually **$0.50/month cheaper** and provides **better value** for ADK agent deployments.

---

## 💰 Cost Comparison

### Monthly Costs (10 Projects/Month)

| Component | Vertex AI Agent Engine | Cloud Run | Difference |
|-----------|----------------------|-----------|------------|
| **Compute** | $0.00 (free tier) | $0.00 (free tier) | $0.00 |
| **Session Storage** | $0.00 (Firestore free tier) | N/A (manual setup) | $0.00 |
| **Container Registry** | N/A (not needed) | $0.50 | **-$0.50** |
| **Cloud Storage** | $1.10 | $1.10 | $0.00 |
| **Load Balancer** | $18.08 | $18.08 | $0.00 |
| **TOTAL** | **$19.18/month** | **$19.68/month** | **-$0.50/month** |

### Monthly Costs (100 Projects/Month)

| Component | Vertex AI Agent Engine | Cloud Run | Difference |
|-----------|----------------------|-----------|------------|
| **Compute** | $0.00 (free tier) | $0.00 (free tier) | $0.00 |
| **Session Storage** | $0.00 (Firestore free tier) | N/A (manual setup) | $0.00 |
| **Container Registry** | N/A (not needed) | $0.50 | **-$0.50** |
| **Cloud Storage** | $1.10 | $1.10 | $0.00 |
| **Load Balancer** | $18.08 | $18.08 | $0.00 |
| **TOTAL** | **$19.18/month** | **$19.68/month** | **-$0.50/month** |

### Monthly Costs (1000 Projects/Month - Heavy Usage)

| Component | Vertex AI Agent Engine | Cloud Run | Difference |
|-----------|----------------------|-----------|------------|
| **Compute** | $12.50 | $15.00 | **-$2.50** |
| **Session Storage** | $0.90 (Firestore) | N/A (manual setup) | +$0.90 |
| **Container Registry** | N/A (not needed) | $0.50 | **-$0.50** |
| **Cloud Storage** | $5.10 | $5.10 | $0.00 |
| **Load Balancer** | $18.50 | $18.50 | $0.00 |
| **TOTAL** | **$37.00/month** | **$39.10/month** | **-$2.10/month** |

---

## 🎯 Key Findings

### 1. Vertex AI is Cheaper at All Scales

- **Light usage (10 projects/month)**: $0.50/month cheaper
- **Medium usage (100 projects/month)**: $0.50/month cheaper
- **Heavy usage (1000 projects/month)**: $2.10/month cheaper

### 2. Both Stay Within Free Tiers for Typical Usage

For 10-100 projects/month:
- ✅ **Vertex AI Agent Engine**: Free tier (first 10 agents)
- ✅ **Cloud Run**: Free tier (180K vCPU-seconds/month)
- ✅ **Firestore**: Free tier (50K reads, 20K writes/day)

### 3. Main Cost is Infrastructure, Not Compute

The **Load Balancer** ($18/month) is the biggest cost for both options:
- Required for custom domain (sparktoship.dev)
- Same cost regardless of deployment method
- Can be eliminated during development

### 4. Vertex AI Includes Session Management

- **Vertex AI**: Built-in Firestore integration (free tier)
- **Cloud Run**: Manual setup required (additional development time)

---

## 📈 Free Trial Duration

With $300 GCP free trial credit:

| Usage Level | Vertex AI | Cloud Run | Difference |
|-------------|-----------|-----------|------------|
| **10 projects/month** | 15.6 months | 15.2 months | +0.4 months |
| **100 projects/month** | 15.6 months | 15.2 months | +0.4 months |
| **1000 projects/month** | 8.1 months | 7.7 months | +0.4 months |

**Verdict**: Vertex AI gives you **~2 extra weeks** on your free trial.

---

## 🔍 Detailed Cost Breakdown

### Vertex AI Agent Engine Costs

#### What's Free:
- ✅ **First 10 agents** - Covers single deployment
- ✅ **Up to 100 hours/month runtime** - More than enough for 100 projects
- ✅ **Firestore**: 50K reads, 20K writes per day
- ✅ **Cloud Storage**: 5GB storage, 1GB egress

#### What You Pay For:
- 💰 **Load Balancer**: $18/month (required for custom domain)
- 💰 **Cloud Storage egress**: $0.12/GB after 1GB free
- 💰 **Agent runtime**: $0.10/hour after 100 hours/month (only at scale)

### Cloud Run Costs

#### What's Free:
- ✅ **180K vCPU-seconds/month** - Covers ~50 hours runtime
- ✅ **360K GB-seconds/month** - Covers ~100 GB-hours memory
- ✅ **2M requests/month** - More than enough
- ✅ **Cloud Storage**: 5GB storage, 1GB egress

#### What You Pay For:
- 💰 **Load Balancer**: $18/month (required for custom domain)
- 💰 **Artifact Registry**: $0.10/GB/month (~$0.50 for Docker images)
- 💰 **Cloud Storage egress**: $0.12/GB after 1GB free
- 💰 **Cloud Run runtime**: $0.024/vCPU-hour after free tier

---

## 🎁 Hidden Benefits of Vertex AI

Beyond just cost, Vertex AI provides additional value:

### 1. Simpler Deployment
- **Vertex AI**: `adk deploy agent_engine` (1 command)
- **Cloud Run**: Build Docker → Push to registry → Deploy → Configure (4+ steps)

**Time saved**: ~10 minutes per deployment

### 2. Built-in Session Management
- **Vertex AI**: Firestore integration included
- **Cloud Run**: Manual setup required

**Development time saved**: ~2-4 hours

### 3. ADK-Optimized Infrastructure
- **Vertex AI**: Purpose-built for agents
- **Cloud Run**: General-purpose containers

**Better performance**: Optimized for agent workloads

### 4. Matches Learning Materials
- **Vertex AI**: Covered in Kaggle notebooks (day-5b-agent-deployment.ipynb)
- **Cloud Run**: Generic deployment, not ADK-specific

**Learning curve**: Easier to follow tutorials

---

## 💡 Cost Optimization Tips

### For Both Deployments:

1. **Skip Load Balancer During Development**
   - Save $18/month
   - Use direct URLs instead
   - Add Load Balancer only for production

2. **Enable Cloudflare Caching**
   - Reduce egress costs
   - Improve performance
   - Free tier available

3. **Compress Frontend Assets**
   - Reduce storage costs
   - Reduce egress costs
   - Faster load times

### Vertex AI-Specific:

4. **Set min_instances: 0**
   - Scale to zero when idle
   - Included in `.agent_engine_config.json`

5. **Clean Up Old Sessions**
   - Reduce Firestore storage
   - Simple cron job

### Cloud Run-Specific:

6. **Delete Unused Docker Images**
   - Reduce Artifact Registry costs
   - Use image retention policies

7. **Set min-instances: 0**
   - Scale to zero when idle
   - Avoid idle costs

---

## 📊 Real-World Scenarios

### Scenario 1: Student/Learner (10 projects/month)

**Vertex AI**:
- Cost: $19.18/month
- Free trial lasts: 15.6 months
- **Recommendation**: ⭐ **Best choice** - Matches Kaggle notebooks

**Cloud Run**:
- Cost: $19.68/month
- Free trial lasts: 15.2 months
- **Recommendation**: Good alternative if you know Docker

### Scenario 2: Freelancer/Consultant (100 projects/month)

**Vertex AI**:
- Cost: $19.18/month
- Free trial lasts: 15.6 months
- **Recommendation**: ⭐ **Best choice** - No cost increase with scale

**Cloud Run**:
- Cost: $19.68/month
- Free trial lasts: 15.2 months
- **Recommendation**: Good alternative, same scaling

### Scenario 3: Small Agency (1000 projects/month)

**Vertex AI**:
- Cost: $37.00/month
- Free trial lasts: 8.1 months
- **Recommendation**: ⭐ **Best choice** - $2/month cheaper

**Cloud Run**:
- Cost: $39.10/month
- Free trial lasts: 7.7 months
- **Recommendation**: Good alternative if you need custom containers

---

## 🏆 Final Recommendation

### Use Vertex AI Agent Engine if:
- ✅ You want the **simplest deployment** (1 command)
- ✅ You're **learning ADK** (matches Kaggle notebooks)
- ✅ You want **built-in session management**
- ✅ You want to **save $0.50-$2/month**
- ✅ You prefer **ADK-native tools**

### Use Cloud Run if:
- ✅ You have **existing Docker expertise**
- ✅ You need **custom container configuration**
- ✅ You're deploying **non-ADK services** alongside
- ✅ You want **maximum flexibility**

---

## 📈 Cost Projection

### 12-Month Cost Comparison

| Month | Vertex AI (100 projects) | Cloud Run (100 projects) | Savings |
|-------|-------------------------|-------------------------|---------|
| 1-12 | $19.18 | $19.68 | $0.50/month |
| **Total** | **$230.16** | **$236.16** | **$6.00/year** |

### With $300 Free Trial:

- **Vertex AI**: Covers 15.6 months → **$0 for first year**
- **Cloud Run**: Covers 15.2 months → **$0 for first year**

Both are **FREE for the first year** with GCP free trial! 🎉

---

## ✅ Conclusion

**Vertex AI Agent Engine has a POSITIVE cost impact:**

1. **Cheaper**: $0.50-$2/month less than Cloud Run
2. **Simpler**: One-command deployment vs multi-step Docker process
3. **Better value**: Includes session management built-in
4. **Optimized**: Purpose-built for ADK agents
5. **Educational**: Matches Kaggle notebook tutorials

**For SparkToShip, Vertex AI Agent Engine is the clear winner!** 🏆

---

## 📚 Resources

- **Vertex AI Cost Calculator**: `python3 vertex-ai-cost-calculator.py`
- **Cloud Run Cost Calculator**: `python3 cost-calculator.py`
- **Deployment Comparison**: [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)
- **Vertex AI Guide**: [VERTEX_AI_DEPLOYMENT_GUIDE.md](./VERTEX_AI_DEPLOYMENT_GUIDE.md)
- **Cloud Run Guide**: [GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md](./GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md)
