# SparkToShip - Cost Optimization Guide

## 💰 Make $300 Credit Last 12-25 Months!

### Quick Summary
- **Active 24/7**: $24/month → 12.5 months
- **Paused overnight**: $12/month → 25 months ⭐ RECOMMENDED
- **Paused completely**: $1/month → 300 months

---

## 🚦 Daily Usage Pattern

### Morning (2 minutes)
```bash
./resume-sparktoship.sh
```
App is live at https://sparktoship.dev

### Evening (1 minute)
```bash
./pause-sparktoship.sh
```
Saves ~$0.60/day = $18/month

### Check Costs (30 seconds)
```bash
./daily-cost-check.sh
```

---

## 📊 Cost Breakdown

### Always Running (Can't Turn Off)
- Cloud Storage: $0.02/month
- Static IP: $0 (free when in use)

### Can Be Paused
- Load Balancer: $18/month → **Pause this!**
- Cloud Run: $5/month → Auto-scales to $0
- Vertex AI: $0-12/month → Delete when not needed

---

## 🔔 Set Up Budget Alerts

```bash
# Get billing account
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" | head -n 1)

# Create budget
gcloud billing budgets create \
  --billing-account=$BILLING_ACCOUNT \
  --display-name="SparkToShip Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

You'll get alerts at:
- 50% ($25) - Warning
- 90% ($45) - Urgent  
- 100% ($50) - Critical

---

## 🎯 Best Practices

### Development Phase (Now)
- ✅ Pause overnight and weekends
- ✅ Don't deploy Vertex AI yet
- **Cost**: ~$8-12/month

### Demo Phase (1-2 days)
- ✅ Keep everything running 24/7
- ✅ Deploy Vertex AI for performance
- **Cost**: ~$24-35/month

### Post-Demo
- ✅ Pause Load Balancer
- ✅ Delete Vertex AI agents
- **Cost**: ~$1/month

---

## 🚨 Emergency Cost Control

If costs are high:
```bash
# 1. Pause everything
./pause-sparktoship.sh

# 2. Check what's running
./daily-cost-check.sh

# 3. Delete Vertex AI
gcloud ai agent-engines list --region=us-west1
gcloud ai agent-engines delete AGENT_ID --region=us-west1

# 4. Check billing
open https://console.cloud.google.com/billing
```

---

## 💡 Pro Tips

1. **Set calendar reminders** to pause at night
2. **Pause on weekends** - saves ~$6
3. **Monitor daily** for first 2 weeks
4. **Use budget alerts** - they're free!
5. **Delete Vertex AI** when not demoing

### Shell Aliases
Add to `~/.zshrc`:
```bash
alias gcp-pause='./pause-sparktoship.sh'
alias gcp-resume='./resume-sparktoship.sh'
alias gcp-cost='./daily-cost-check.sh'
```

---

## 📈 Expected Costs

### With Smart Management
- Week 1-2 (active dev): $24/month
- Week 3-4 (paused nights): $12/month
- Post-demo (paused): $1/month

**Average over 3 months**: ~$10-15/month  
**Free credit lasts**: 20-30 months! 🎉

---

## ✅ Summary

**Key Actions**:
1. Pause overnight: `./pause-sparktoship.sh`
2. Resume morning: `./resume-sparktoship.sh`
3. Check daily: `./daily-cost-check.sh`
4. Set up budget alerts
5. Delete Vertex AI when not needed

**Result**: $300 credit lasts 20-30 months! 🚀
