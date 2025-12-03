# Complete Cost Analysis: Infrastructure + Gemini API

## 🎯 Important Clarification

The cost calculators (`vertex-ai-cost-calculator.py` and `cost-calculator.py`) **only include GCP infrastructure costs**. They **DO NOT** include Gemini API costs, which are billed separately.

### What's Included in Cost Calculators:
- ✅ Vertex AI Agent Engine / Cloud Run
- ✅ Firestore (session storage)
- ✅ Cloud Storage (frontend)
- ✅ Load Balancer
- ✅ Artifact Registry (Cloud Run only)

### What's NOT Included:
- ❌ **Gemini API costs** (billed separately via Google AI Studio or Vertex AI)
- ❌ User's own API key usage

---

## 💰 Complete Cost Breakdown

### Total Monthly Cost = Infrastructure + Gemini API

```
TOTAL COST = GCP Infrastructure + Gemini API Usage
```

---

## 📊 Gemini API Pricing (December 2025)

### Gemini 2.0 Flash (Recommended for SparkToShip)

| Tier | Input Price | Output Price | Context Window |
|------|-------------|--------------|----------------|
| **Free Tier** | Free | Free | 1M tokens |
| **Pay-as-you-go** | $0.075 / 1M tokens | $0.30 / 1M tokens | 1M tokens |

### Gemini 1.5 Pro

| Tier | Input Price | Output Price | Context Window |
|------|-------------|--------------|----------------|
| **Free Tier** | Free (50 requests/day) | Free (50 requests/day) | 2M tokens |
| **Pay-as-you-go** | $1.25 / 1M tokens | $5.00 / 1M tokens | 2M tokens |

### Gemini 1.5 Flash

| Tier | Input Price | Output Price | Context Window |
|------|-------------|--------------|----------------|
| **Free Tier** | Free (1500 requests/day) | Free (1500 requests/day) | 1M tokens |
| **Pay-as-you-go** | $0.075 / 1M tokens | $0.30 / 1M tokens | 1M tokens |

**Source**: [Google AI Pricing](https://ai.google.dev/pricing)

---

## 🧮 Gemini API Cost Estimation

### Assumptions for SparkToShip:

Each project generation involves:
- **Planning phase**: ~5K input tokens, ~2K output tokens
- **Architecture phase**: ~8K input tokens, ~3K output tokens
- **Coding phase**: ~15K input tokens, ~10K output tokens
- **Debugging phase**: ~10K input tokens, ~5K output tokens

**Total per project**: ~38K input tokens, ~20K output tokens

### Cost Per Project (Gemini 2.0 Flash)

```
Input cost:  38,000 tokens × $0.075 / 1M = $0.00285
Output cost: 20,000 tokens × $0.30 / 1M  = $0.00600
──────────────────────────────────────────────────
Total per project: ~$0.009 (less than 1 cent!)
```

### Cost Per Project (Gemini 1.5 Pro)

```
Input cost:  38,000 tokens × $1.25 / 1M = $0.0475
Output cost: 20,000 tokens × $5.00 / 1M = $0.1000
──────────────────────────────────────────────────
Total per project: ~$0.15 (15 cents)
```

---

## 💵 Complete Monthly Cost Scenarios

### Scenario 1: 10 Projects/Month (Light Usage)

#### Using Gemini 2.0 Flash (Recommended)

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $19.18 |
| **Gemini API** (10 projects × $0.009) | $0.09 |
| **TOTAL** | **$19.27/month** |

**Free Trial Duration**: 15.6 months
**Gemini Free Tier**: ✅ Likely covered (1500 requests/day limit)

#### Using Gemini 1.5 Pro

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $19.18 |
| **Gemini API** (10 projects × $0.15) | $1.50 |
| **TOTAL** | **$20.68/month** |

**Free Trial Duration**: 14.5 months
**Gemini Free Tier**: ⚠️ May exceed (50 requests/day limit)

---

### Scenario 2: 100 Projects/Month (Medium Usage)

#### Using Gemini 2.0 Flash (Recommended)

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $19.18 |
| **Gemini API** (100 projects × $0.009) | $0.90 |
| **TOTAL** | **$20.08/month** |

**Free Trial Duration**: 14.9 months
**Gemini Free Tier**: ✅ Likely covered (1500 requests/day limit)

#### Using Gemini 1.5 Pro

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $19.18 |
| **Gemini API** (100 projects × $0.15) | $15.00 |
| **TOTAL** | **$34.18/month** |

**Free Trial Duration**: 8.8 months
**Gemini Free Tier**: ❌ Will exceed (50 requests/day limit)

---

### Scenario 3: 1000 Projects/Month (Heavy Usage)

#### Using Gemini 2.0 Flash (Recommended)

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $37.00 |
| **Gemini API** (1000 projects × $0.009) | $9.00 |
| **TOTAL** | **$46.00/month** |

**Free Trial Duration**: 6.5 months
**Gemini Free Tier**: ❌ Will exceed

#### Using Gemini 1.5 Pro

| Component | Cost |
|-----------|------|
| **GCP Infrastructure** (Vertex AI) | $37.00 |
| **Gemini API** (1000 projects × $0.15) | $150.00 |
| **TOTAL** | **$187.00/month** |

**Free Trial Duration**: 1.6 months
**Gemini Free Tier**: ❌ Will exceed

---

## 📈 Cost Comparison: Infrastructure Only vs Complete

### 10 Projects/Month

| Deployment | Infrastructure Only | + Gemini 2.0 Flash | + Gemini 1.5 Pro |
|------------|--------------------|--------------------|------------------|
| **Vertex AI** | $19.18 | $19.27 (+0.5%) | $20.68 (+7.8%) |
| **Cloud Run** | $19.68 | $19.77 (+0.5%) | $21.18 (+7.6%) |

### 100 Projects/Month

| Deployment | Infrastructure Only | + Gemini 2.0 Flash | + Gemini 1.5 Pro |
|------------|--------------------|--------------------|------------------|
| **Vertex AI** | $19.18 | $20.08 (+4.7%) | $34.18 (+78%) |
| **Cloud Run** | $19.68 | $20.58 (+4.6%) | $34.68 (+76%) |

### 1000 Projects/Month

| Deployment | Infrastructure Only | + Gemini 2.0 Flash | + Gemini 1.5 Pro |
|------------|--------------------|--------------------|------------------|
| **Vertex AI** | $37.00 | $46.00 (+24%) | $187.00 (+405%) |
| **Cloud Run** | $39.10 | $48.10 (+23%) | $189.10 (+384%) |

---

## 🎯 Key Insights

### 1. Gemini 2.0 Flash is MUCH Cheaper

For 100 projects/month:
- **Gemini 2.0 Flash**: $0.90/month
- **Gemini 1.5 Pro**: $15.00/month
- **Savings**: **$14.10/month (94% cheaper!)**

### 2. Infrastructure Cost Dominates at Low Usage

At 10-100 projects/month:
- Infrastructure: ~$19/month
- Gemini API (Flash): ~$0.09-$0.90/month
- **Gemini is only 0.5-4.7% of total cost**

### 3. API Cost Becomes Significant at Scale

At 1000 projects/month with Gemini 1.5 Pro:
- Infrastructure: $37/month
- Gemini API: $150/month
- **Gemini is 80% of total cost**

### 4. Free Tier is Generous

Gemini 2.0 Flash free tier:
- **1500 requests/day** = ~45,000 requests/month
- Enough for **~1500 projects/month** (assuming 30 API calls per project)
- **Most users won't pay for Gemini API!**

---

## 💡 Recommendations

### For Development/Learning (10-50 projects/month)

**Use Gemini 2.0 Flash with Free Tier**:
- ✅ Free API usage (within 1500 requests/day)
- ✅ Only pay for infrastructure (~$19/month)
- ✅ Fast and efficient
- ✅ **Total cost: ~$19/month**

### For Production/Freelancing (100-500 projects/month)

**Use Gemini 2.0 Flash (Pay-as-you-go)**:
- ✅ Very low API cost ($0.009 per project)
- ✅ Infrastructure: ~$19-25/month
- ✅ API: ~$1-5/month
- ✅ **Total cost: ~$20-30/month**

### For High Volume (1000+ projects/month)

**Use Gemini 2.0 Flash (Pay-as-you-go)**:
- ✅ API cost scales linearly ($0.009 per project)
- ✅ Infrastructure: ~$37-50/month
- ✅ API: ~$9-20/month
- ✅ **Total cost: ~$46-70/month**

**Avoid Gemini 1.5 Pro at scale** unless you need the extra capabilities:
- ⚠️ 16x more expensive than Flash
- ⚠️ Would cost $150/month for 1000 projects

---

## 🔧 Updated Cost Calculators

I'll create an enhanced cost calculator that includes Gemini API costs:

### Usage:

```bash
# Infrastructure only (current)
python3 vertex-ai-cost-calculator.py --projects 100

# Complete cost with Gemini API
python3 complete-cost-calculator.py --projects 100 --model flash
python3 complete-cost-calculator.py --projects 100 --model pro
```

---

## 📊 Real-World Cost Examples

### Example 1: Student Learning ADK

**Usage**: 10 projects/month, Gemini 2.0 Flash (free tier)

```
Infrastructure (Vertex AI):  $19.18
Gemini API:                  $0.00 (free tier)
────────────────────────────────────
TOTAL:                       $19.18/month

Free trial lasts: 15.6 months ✅
```

### Example 2: Freelance Developer

**Usage**: 100 projects/month, Gemini 2.0 Flash (paid)

```
Infrastructure (Vertex AI):  $19.18
Gemini API:                  $0.90
────────────────────────────────────
TOTAL:                       $20.08/month

Free trial lasts: 14.9 months ✅
```

### Example 3: Small Development Agency

**Usage**: 500 projects/month, Gemini 2.0 Flash (paid)

```
Infrastructure (Vertex AI):  $28.00
Gemini API:                  $4.50
────────────────────────────────────
TOTAL:                       $32.50/month

Free trial lasts: 9.2 months ✅
```

### Example 4: High-Volume Production

**Usage**: 1000 projects/month, Gemini 2.0 Flash (paid)

```
Infrastructure (Vertex AI):  $37.00
Gemini API:                  $9.00
────────────────────────────────────
TOTAL:                       $46.00/month

Free trial lasts: 6.5 months ✅
```

---

## ⚠️ Important Notes

### 1. Gemini API is Billed Separately

- **Google AI Studio API**: Billed to your Google Cloud account
- **Vertex AI Gemini**: Billed as part of Vertex AI usage
- **User's own key**: User pays directly

### 2. Free Tier Limits

**Gemini 2.0 Flash**:
- 1500 requests/day
- Resets daily
- No monthly cap

**Gemini 1.5 Pro**:
- 50 requests/day
- Resets daily
- Much more restrictive

### 3. Token Usage Varies

Actual token usage depends on:
- Project complexity
- Code length
- Number of iterations
- Debugging cycles

Our estimates are conservative averages.

### 4. Infrastructure Costs are Fixed

Regardless of Gemini model choice:
- Vertex AI Agent Engine: $19-37/month
- Cloud Run: $20-39/month
- Load Balancer: $18/month

---

## 🎓 Cost Optimization Strategies

### 1. Use Gemini 2.0 Flash

**Savings**: 94% compared to Gemini 1.5 Pro
- Flash: $0.009 per project
- Pro: $0.15 per project

### 2. Leverage Free Tier

**Savings**: 100% on API costs for light usage
- 1500 requests/day = ~50 projects/day
- Perfect for development and learning

### 3. Optimize Prompts

**Savings**: 20-40% on token usage
- Use concise prompts
- Avoid redundant context
- Cache common responses

### 4. Batch Processing

**Savings**: Reduce API calls
- Combine multiple operations
- Use streaming for long responses

### 5. Skip Load Balancer in Dev

**Savings**: $18/month
- Use direct URLs during development
- Add Load Balancer only for production

---

## ✅ Summary

### Infrastructure Costs (What calculators show):
- **Vertex AI**: $19.18/month (10-100 projects)
- **Cloud Run**: $19.68/month (10-100 projects)

### Gemini API Costs (What's missing):
- **Gemini 2.0 Flash**: $0.009 per project
- **Gemini 1.5 Pro**: $0.15 per project

### Complete Costs (Infrastructure + API):

| Usage | Vertex AI + Flash | Vertex AI + Pro |
|-------|------------------|-----------------|
| **10 projects** | $19.27/month | $20.68/month |
| **100 projects** | $20.08/month | $34.18/month |
| **1000 projects** | $46.00/month | $187.00/month |

### Recommendation:

**Use Vertex AI Agent Engine + Gemini 2.0 Flash**:
- ✅ Lowest infrastructure cost
- ✅ Lowest API cost (94% cheaper than Pro)
- ✅ Generous free tier
- ✅ **Total: ~$19-46/month** depending on usage

---

## 📚 Resources

- **Gemini Pricing**: https://ai.google.dev/pricing
- **Vertex AI Pricing**: https://cloud.google.com/vertex-ai/pricing
- **Infrastructure Calculator**: `python3 vertex-ai-cost-calculator.py`
- **Complete Calculator**: `python3 complete-cost-calculator.py` (coming soon)
