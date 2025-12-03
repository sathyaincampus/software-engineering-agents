# Cost Calculator Guide

## 📊 Available Cost Calculators

SparkToShip provides **three cost calculators** to help you estimate deployment costs:

### 1. Infrastructure Only (Vertex AI)
**File**: `vertex-ai-cost-calculator.py`

Calculates **GCP infrastructure costs only** for Vertex AI Agent Engine deployment:
- Vertex AI Agent Engine
- Firestore (session storage)
- Cloud Storage (frontend)
- Load Balancer

**Does NOT include**: Gemini API costs

```bash
python3 vertex-ai-cost-calculator.py --projects 100
```

### 2. Infrastructure Only (Cloud Run)
**File**: `cost-calculator.py`

Calculates **GCP infrastructure costs only** for Cloud Run deployment:
- Cloud Run
- Cloud Storage (frontend)
- Load Balancer
- Artifact Registry

**Does NOT include**: Gemini API costs

```bash
python3 cost-calculator.py --projects 100
```

### 3. Complete Cost (Infrastructure + Gemini API)
**File**: `complete-cost-calculator.py` ⭐ **Recommended**

Calculates **total costs** including both infrastructure and Gemini API:
- All infrastructure components
- Gemini API token usage
- Free tier detection
- Model comparison

```bash
# With Gemini 2.0 Flash (recommended)
python3 complete-cost-calculator.py --projects 100 --model flash-2

# With Gemini 1.5 Pro
python3 complete-cost-calculator.py --projects 100 --model pro

# Compare models
python3 complete-cost-calculator.py --projects 100 --model flash-2
python3 complete-cost-calculator.py --projects 100 --model pro
```

---

## 💰 Cost Components Explained

### Infrastructure Costs (GCP)

These are the costs for running your application on Google Cloud:

| Component | What it does | Typical Cost |
|-----------|--------------|--------------|
| **Vertex AI Agent Engine** | Runs your ADK agents | $0 (free tier) |
| **Cloud Run** | Alternative backend hosting | $0 (free tier) |
| **Firestore** | Stores agent sessions | $0 (free tier) |
| **Cloud Storage** | Hosts frontend files | $1.10/month |
| **Load Balancer** | Routes traffic, provides HTTPS | $18/month |
| **Artifact Registry** | Stores Docker images (Cloud Run only) | $0.50/month |

**Total Infrastructure**: ~$19-20/month

### Gemini API Costs (Separate)

These are the costs for using Google's Gemini AI models:

| Model | Input Cost | Output Cost | Free Tier |
|-------|------------|-------------|-----------|
| **Gemini 2.0 Flash** ⭐ | $0.075/1M tokens | $0.30/1M tokens | 1500 req/day |
| **Gemini 1.5 Flash** | $0.075/1M tokens | $0.30/1M tokens | 1500 req/day |
| **Gemini 1.5 Pro** | $1.25/1M tokens | $5.00/1M tokens | 50 req/day |

**Per Project Cost**:
- Gemini 2.0 Flash: ~$0.009 (less than 1 cent!)
- Gemini 1.5 Pro: ~$0.15 (15 cents)

---

## 🎯 Which Calculator Should I Use?

### Use `complete-cost-calculator.py` if:
- ✅ You want to see **total costs** (infrastructure + API)
- ✅ You want to **compare Gemini models**
- ✅ You want to know if you're **within free tier**
- ✅ You want the **most accurate estimate**

**This is the recommended calculator for most users!**

### Use `vertex-ai-cost-calculator.py` if:
- ✅ You only care about **infrastructure costs**
- ✅ You're using your **own Gemini API key** (paid separately)
- ✅ You want to **compare deployment options** (Vertex AI vs Cloud Run)

### Use `cost-calculator.py` if:
- ✅ You're deploying to **Cloud Run** (not Vertex AI)
- ✅ You only care about **infrastructure costs**

---

## 📈 Example Cost Scenarios

### Scenario 1: Student/Learner (10 projects/month)

```bash
python3 complete-cost-calculator.py --projects 10 --model flash-2
```

**Result**:
```
Infrastructure:  $19.18
Gemini API:      $0.00 (free tier)
────────────────────────
TOTAL:           $19.18/month

Free trial lasts: 15.6 months ✅
```

### Scenario 2: Freelancer (100 projects/month)

```bash
python3 complete-cost-calculator.py --projects 100 --model flash-2
```

**Result**:
```
Infrastructure:  $19.18
Gemini API:      $0.00 (free tier)
────────────────────────
TOTAL:           $19.18/month

Free trial lasts: 15.6 months ✅
```

### Scenario 3: Production with Gemini Pro (100 projects/month)

```bash
python3 complete-cost-calculator.py --projects 100 --model pro
```

**Result**:
```
Infrastructure:  $19.18
Gemini API:      $14.75 (exceeds free tier)
────────────────────────
TOTAL:           $33.93/month

Free trial lasts: 8.8 months ⚠️

💡 Switch to Flash to save $13.87/month (94% reduction)
```

---

## 🔧 Calculator Options

### Common Options (All Calculators)

```bash
--projects N          # Number of projects per month (default: 10)
--duration N          # Avg project duration in minutes (default: 7)
--storage N           # Frontend storage in GB (default: 1.0)
--egress N            # Egress per month in GB (default: 10.0)
--no-load-balancer    # Exclude Load Balancer costs
```

### Complete Calculator Only

```bash
--model MODEL         # Gemini model: flash-2, flash, or pro (default: flash-2)
```

### Examples

```bash
# Light usage, no load balancer (development)
python3 complete-cost-calculator.py --projects 5 --no-load-balancer

# Heavy usage with Gemini Pro
python3 complete-cost-calculator.py --projects 1000 --model pro

# Custom configuration
python3 complete-cost-calculator.py \
  --projects 50 \
  --duration 10 \
  --storage 2.0 \
  --egress 20.0 \
  --model flash-2
```

---

## 💡 Cost Optimization Tips

### 1. Use Gemini 2.0 Flash
**Savings**: 94% compared to Gemini 1.5 Pro

```bash
# Compare costs
python3 complete-cost-calculator.py --projects 100 --model flash-2
python3 complete-cost-calculator.py --projects 100 --model pro
```

### 2. Skip Load Balancer During Development
**Savings**: $18/month

```bash
python3 complete-cost-calculator.py --projects 10 --no-load-balancer
```

### 3. Stay Within Free Tiers
**Savings**: 100% on API costs

- Gemini 2.0 Flash: 1500 requests/day = ~50 projects/day
- Vertex AI Agent Engine: First 10 agents free
- Firestore: 50K reads, 20K writes per day

### 4. Use Cloudflare Caching
**Savings**: Reduce egress costs

Not reflected in calculators, but can save $1-5/month on egress.

---

## 📊 Cost Comparison Table

| Usage | Infrastructure Only | + Gemini Flash | + Gemini Pro |
|-------|--------------------|--------------------|------------------|
| **10 projects** | $19.18 | $19.18 (free tier) | $20.68 |
| **100 projects** | $19.18 | $19.18 (free tier) | $33.93 |
| **1000 projects** | $37.00 | $46.00 | $187.00 |

---

## 🎓 Understanding the Numbers

### Why is infrastructure cost the same for 10-100 projects?

Because both stay within **free tiers**:
- Vertex AI: First 10 agents free
- Firestore: 50K reads, 20K writes/day free
- Load Balancer: Fixed cost ($18/month)

### Why is Gemini API free for 100 projects?

Gemini 2.0 Flash free tier:
- **1500 requests/day** limit
- 100 projects/month = ~3.3 projects/day
- Each project ≈ 30 API calls
- Total: ~100 API calls/day (well within limit!)

### When do costs increase?

- **Infrastructure**: After 100 hours runtime/month (Vertex AI)
- **Gemini API**: After 1500 requests/day (Flash) or 50 requests/day (Pro)

---

## 📚 Additional Resources

- **Complete Cost Analysis**: [COMPLETE_COST_ANALYSIS.md](./COMPLETE_COST_ANALYSIS.md)
- **Deployment Options**: [DEPLOYMENT_OPTIONS.md](./DEPLOYMENT_OPTIONS.md)
- **Cost Impact Analysis**: [COST_IMPACT_ANALYSIS.md](./COST_IMPACT_ANALYSIS.md)
- **Vertex AI Guide**: [VERTEX_AI_DEPLOYMENT_GUIDE.md](./VERTEX_AI_DEPLOYMENT_GUIDE.md)

---

## ✅ Quick Reference

```bash
# Most accurate (recommended)
python3 complete-cost-calculator.py --projects 100 --model flash-2

# Infrastructure only (Vertex AI)
python3 vertex-ai-cost-calculator.py --projects 100

# Infrastructure only (Cloud Run)
python3 cost-calculator.py --projects 100

# Compare models
python3 complete-cost-calculator.py --projects 100 --model flash-2
python3 complete-cost-calculator.py --projects 100 --model pro

# Development (no load balancer)
python3 complete-cost-calculator.py --projects 10 --no-load-balancer --model flash-2
```

---

## 🎯 Bottom Line

**For typical usage (10-100 projects/month)**:

- **Infrastructure**: ~$19/month (mostly Load Balancer)
- **Gemini API**: $0/month (free tier with Flash)
- **TOTAL**: ~$19/month

**Your $300 GCP free trial will last 15+ months!** 🎉
