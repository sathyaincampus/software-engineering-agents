# 🌐 PHASE 3: Load Balancer Configuration

## ✅ What You've Completed
- [x] Phase 1: Backend deployed to Cloud Run ✅
- [x] Phase 2: Frontend deployed to Cloud Storage ✅
- [ ] Phase 3: Load Balancer ← **YOU ARE HERE**

---

## 📍 WHERE TO RUN THESE COMMANDS

**Run ALL commands in your Mac Terminal**  
**Folder**: Any folder (project root is fine)

```bash
# Navigate to project root (if not already there)
cd /Users/sathya/web/python/adk/software-engineering-agents
```

---

## 🎯 Phase 3: Load Balancer Setup

### What This Does
Creates a Load Balancer that routes traffic:
- `sparktoship.dev/` → Cloud Storage (your frontend)
- `sparktoship.dev/api/*` → Cloud Run (your backend)
- Provides HTTPS with SSL certificate

### Time Required
30-45 minutes (mostly waiting for SSL certificate)

---

## Step 1: Reserve Static IP (30 seconds)

```bash
# Reserve a global static IP address
gcloud compute addresses create sparktoship-ip --global

# Get the IP address (save this!)
export STATIC_IP=$(gcloud compute addresses describe sparktoship-ip \
  --global --format='value(address)')

# Display it
echo "Your Static IP: $STATIC_IP"
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/addresses/sparktoship-ip].
Your Static IP: 34.120.123.45
```

**📝 IMPORTANT**: Write down this IP address! You'll need it for DNS configuration.

---

## Step 2: Create Backend Bucket (Frontend) (10 seconds)

```bash
# Set bucket name
export BUCKET_NAME="sparktoship-frontend"

# Create backend bucket for frontend
gcloud compute backend-buckets create sparktoship-frontend-backend \
  --gcs-bucket-name=$BUCKET_NAME \
  --enable-cdn
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendBuckets/sparktoship-frontend-backend].
```

---

## Step 3: Create Network Endpoint Group (API) (10 seconds)

```bash
# Create NEG for Cloud Run service
gcloud compute network-endpoint-groups create sparktoship-api-neg \
  --region=us-west1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=sparktoship-api
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/regions/us-west1/networkEndpointGroups/sparktoship-api-neg].
```

---

## Step 4: Create Backend Service (API) (15 seconds)

```bash
# Create backend service
gcloud compute backend-services create sparktoship-api-backend --global

# Add the NEG to the backend service
gcloud compute backend-services add-backend sparktoship-api-backend \
  --global \
  --network-endpoint-group=sparktoship-api-neg \
  --network-endpoint-group-region=us-west1
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/backendServices/sparktoship-api-backend].
```

---

## Step 5: Create URL Map (20 seconds)

```bash
# Create URL map with frontend as default
gcloud compute url-maps create sparktoship-lb \
  --default-backend-bucket=sparktoship-frontend-backend

# Add path matcher for API routes
gcloud compute url-maps add-path-matcher sparktoship-lb \
  --path-matcher-name=api-matcher \
  --default-backend-bucket=sparktoship-frontend-backend \
  --backend-service-path-rules="/api/*=sparktoship-api-backend"
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
Updated [https://www.googleapis.com/compute/v1/projects/sparktoship/global/urlMaps/sparktoship-lb].
```

---

## Step 6: Create SSL Certificate (10 seconds)

```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create sparktoship-ssl-cert \
  --domains=sparktoship.dev,www.sparktoship.dev \
  --global
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/sslCertificates/sparktoship-ssl-cert].
NAME: sparktoship-ssl-cert
TYPE: MANAGED
CREATION_TIMESTAMP: 2025-12-02T16:30:00.000-08:00
EXPIRE_TIME: 
MANAGED_STATUS: PROVISIONING
```

**⏳ IMPORTANT**: The certificate status will be `PROVISIONING`. It takes 10-60 minutes to become `ACTIVE`. We'll check this later.

---

## Step 7: Create HTTPS Proxy (10 seconds)

```bash
# Create target HTTPS proxy
gcloud compute target-https-proxies create sparktoship-https-proxy \
  --url-map=sparktoship-lb \
  --ssl-certificates=sparktoship-ssl-cert
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/targetHttpsProxies/sparktoship-https-proxy].
```

---

## Step 8: Create Forwarding Rule (10 seconds)

```bash
# Create forwarding rule
gcloud compute forwarding-rules create sparktoship-https-rule \
  --global \
  --target-https-proxy=sparktoship-https-proxy \
  --address=sparktoship-ip \
  --ports=443
```

**Expected output:**
```
Created [https://www.googleapis.com/compute/v1/projects/sparktoship/global/forwardingRules/sparktoship-https-rule].
```

---

## Step 9: Configure DNS (In Browser)

**⚠️ STOP HERE AND DO THIS IN YOUR BROWSER**

1. **Open Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select your domain**: `sparktoship.dev`
3. **Go to DNS settings**
4. **Add A record**:
   - Type: `A`
   - Name: `@`
   - Content: `<YOUR_STATIC_IP>` (from Step 1)
   - Proxy status: **DNS only** (gray cloud) ← IMPORTANT!
   - TTL: Auto

5. **Add CNAME record** (optional, for www):
   - Type: `CNAME`
   - Name: `www`
   - Content: `sparktoship.dev`
   - Proxy status: **DNS only** (gray cloud)
   - TTL: Auto

6. **Save changes**

---

## Step 10: Wait for SSL Certificate (10-60 minutes)

**Check certificate status:**

```bash
# Check every few minutes
gcloud compute ssl-certificates describe sparktoship-ssl-cert \
  --global \
  --format='get(managed.status)'
```

**Possible statuses:**
- `PROVISIONING` - Still waiting (keep checking)
- `FAILED_NOT_VISIBLE` - DNS not configured correctly (check Step 9)
- `ACTIVE` - ✅ Ready! (proceed to Step 11)

**💡 TIP**: Run this command every 5 minutes until it shows `ACTIVE`

**While waiting, you can:**
- Take a break ☕
- Read about Vertex AI (Phase 4)
- Check your backend: `curl https://sparktoship-api-480987910366.us-west1.run.app/health`

---

## Step 11: Enable Cloudflare Proxy (After SSL is ACTIVE)

**Once SSL certificate shows `ACTIVE`:**

1. Go back to Cloudflare DNS settings
2. Click on the `@` A record
3. Change Proxy status from **DNS only** (gray) to **Proxied** (orange)
4. Save
5. Do the same for `www` CNAME record (if you created it)

---

## Step 12: Test Your Deployment! 🎉

**Wait 2-3 minutes after enabling Cloudflare proxy, then:**

```bash
# Test frontend
curl -I https://sparktoship.dev

# Test backend API
curl https://sparktoship.dev/api/health
```

**Expected results:**

Frontend:
```
HTTP/2 200
content-type: text/html
```

Backend:
```json
{
  "status": "healthy",
  "active_sessions": 0,
  "model_provider": "google",
  "model_name": "gemini-2.0-flash-exp",
  "debug_mode": false
}
```

---

## ✅ Success Checklist

- [ ] Static IP reserved and noted
- [ ] Backend bucket created
- [ ] Network endpoint group created
- [ ] Backend service created
- [ ] URL map created
- [ ] SSL certificate created
- [ ] HTTPS proxy created
- [ ] Forwarding rule created
- [ ] DNS configured in Cloudflare
- [ ] SSL certificate is ACTIVE
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] Frontend loads at https://sparktoship.dev
- [ ] Backend API works at https://sparktoship.dev/api/health

---

## 🎊 When Complete

Your app will be live at:
- **Frontend**: https://sparktoship.dev
- **Backend API**: https://sparktoship.dev/api/*

---

## 💰 Current Costs

- Backend (Cloud Run): ~$5/month
- Frontend (Cloud Storage): ~$0.02/month
- Load Balancer: ~$18/month
- **Total**: ~$23/month (covered by $300 free credit)

---

## 🚨 Troubleshooting

### SSL Certificate stuck in PROVISIONING
- **Check DNS**: Make sure A record points to your Static IP
- **Wait longer**: Can take up to 60 minutes
- **Verify domain ownership**: Make sure sparktoship.dev is yours

### Frontend doesn't load
- **Check SSL status**: Must be ACTIVE
- **Check Cloudflare**: Proxy should be enabled (orange cloud)
- **Wait**: Can take 2-5 minutes to propagate

### API doesn't work
- **Check URL map**: Make sure `/api/*` routes to backend
- **Test Cloud Run directly**: `curl https://sparktoship-api-480987910366.us-west1.run.app/health`
- **Check CORS**: May need to update backend CORS settings

---

## 📖 Next: Phase 4 (Optional)

After Phase 3 is complete, you can optionally deploy to Vertex AI Agent Engine.

**But first, celebrate!** Your app is live! 🎉

---

**Ready? Start with Step 1!** 🚀
