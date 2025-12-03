# SparkToShip - Quick Deployment Reference

## 🚀 One-Command Deployment

```bash
export PROJECT_ID="sparktoship-prod" && \
export GOOGLE_API_KEY="your_key_here" && \
./deploy-to-gcp.sh
```

---

## 💰 Cost at a Glance

| Usage | Monthly Cost | Trial Duration |
|-------|--------------|----------------|
| 10 projects/month | **$19.68** | **15.2 months** |
| 100 projects/month | **$19.68** | **15.2 months** |

**Your $300 free trial covers 15+ months!** 🎉

---

## 📋 Deployment Checklist

### Prerequisites
- [ ] Google Cloud account with $300 free trial
- [ ] Domain `sparktoship.dev` on Cloudflare
- [ ] `gcloud` CLI installed
- [ ] Docker installed
- [ ] Gemini API key

### Deployment Steps
- [ ] Run `./deploy-to-gcp.sh`
- [ ] Get static IP: `gcloud compute addresses describe sparktoship-ip --global`
- [ ] Add DNS A record in Cloudflare: `@ → <STATIC_IP>`
- [ ] Add DNS CNAME: `www → sparktoship.dev`
- [ ] Set Cloudflare SSL to "Full (strict)"
- [ ] Test: `https://sparktoship.dev`

---

## 🛠️ Essential Commands

### Deploy Backend
```bash
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/sparktoship-prod/sparktoship-repo/sparktoship-backend:latest
gcloud run deploy sparktoship-backend --image us-central1-docker.pkg.dev/sparktoship-prod/sparktoship-repo/sparktoship-backend:latest --region us-central1
```

### Deploy Frontend
```bash
cd frontend
npm run build
gsutil -m rsync -r -d dist gs://sparktoship-frontend
```

### View Logs
```bash
gcloud run services logs read sparktoship-backend --region=us-central1 --limit=50
```

### Check Costs
```bash
python3 cost-calculator.py --projects 10
```

---

## 🔗 Important URLs

- **Deployment Guide**: `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md`
- **Cost Calculator**: `python3 cost-calculator.py --help`
- **ADK Knowledge**: `ADK_DEPLOYMENT_KNOWLEDGE.md`
- **Summary**: `DEPLOYMENT_SUMMARY.md`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not deploying | Check logs: `gcloud run services logs read sparktoship-backend --region=us-central1` |
| Frontend not loading | Re-upload: `gsutil -m rsync -r -d frontend/dist gs://sparktoship-frontend` |
| CORS errors | Update `allow_origins` in `backend/app/main.py`, redeploy |
| High costs | Run: `python3 cost-calculator.py` to analyze |

---

## 📞 Support

- **Docs**: See `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md`
- **Community**: [Google Cloud Community](https://www.googlecloudcommunity.com/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/sparktoship/issues)

---

**Ready? Run `./deploy-to-gcp.sh` now!** 🚀
