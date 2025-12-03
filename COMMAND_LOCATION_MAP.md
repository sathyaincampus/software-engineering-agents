# 🗺️ Deployment Command Map - Visual Guide

## Where You Run Commands

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR MAC (Local Machine)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Terminal Window                      │    │
│  │                                                          │    │
│  │  Current Folder: /Users/sathya/web/python/adk/         │    │
│  │                  software-engineering-agents/           │    │
│  │                                                          │    │
│  │  $ gcloud auth login          ← Runs here              │    │
│  │  $ gcloud run deploy ...      ← Runs here              │    │
│  │  $ npm run build              ← Runs here              │    │
│  │  $ ./pause-sparktoship.sh     ← Runs here              │    │
│  │                                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  These commands TALK TO Google Cloud via gcloud CLI             │
│  But they RUN on your Mac!                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Internet
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       GOOGLE CLOUD                               │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Cloud Run   │  │Cloud Storage │  │Load Balancer │         │
│  │  (Backend)   │  │  (Frontend)  │  │   (HTTPS)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Resources are CREATED here by your gcloud commands             │
│  But you DON'T log into Google Cloud Console!                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (Browser)                          │
│                                                                  │
│  Only ONE thing you do in browser:                              │
│  • Configure DNS (A record pointing to your IP)                 │
│                                                                  │
│  https://dash.cloudflare.com                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Command Execution Map

### Phase 1: Backend Deployment

```
YOUR MAC TERMINAL                          GOOGLE CLOUD
┌─────────────────────┐                   ┌──────────────┐
│ backend/ folder     │                   │              │
│                     │  gcloud run       │              │
│ $ gcloud run deploy │─────deploy────────▶│  Cloud Run   │
│                     │                   │              │
│ Dockerfile is here  │                   │  Creates:    │
│ (already exists!)   │                   │  • Container │
│                     │                   │  • Service   │
└─────────────────────┘                   └──────────────┘
```

### Phase 2: Frontend Deployment

```
YOUR MAC TERMINAL                          GOOGLE CLOUD
┌─────────────────────┐                   ┌──────────────┐
│ frontend/ folder    │                   │              │
│                     │  npm run build    │              │
│ $ npm run build     │─────────────────▶ │  (local)     │
│                     │                   │              │
│ Creates dist/       │                   │              │
│                     │  gsutil rsync     │              │
│ $ gsutil rsync ...  │─────upload────────▶│Cloud Storage │
│                     │                   │              │
└─────────────────────┘                   └──────────────┘
```

### Phase 3: Load Balancer

```
YOUR MAC TERMINAL                          GOOGLE CLOUD
┌─────────────────────┐                   ┌──────────────┐
│ Any folder          │                   │              │
│ (project root OK)   │  gcloud compute   │              │
│                     │─────commands──────▶│Load Balancer │
│ $ gcloud compute    │                   │              │
│   addresses create  │                   │  Creates:    │
│   ...               │                   │  • Static IP │
│                     │                   │  • SSL Cert  │
│                     │                   │  • Routing   │
└─────────────────────┘                   └──────────────┘
```

---

## File Locations

```
/Users/sathya/web/python/adk/software-engineering-agents/
│
├── backend/                          ← DEPLOY FROM HERE (Phase 1)
│   ├── Dockerfile                    ← Already exists! ✅
│   ├── .dockerignore                 ← Already exists! ✅
│   ├── requirements.txt
│   └── app/
│       └── main.py
│
├── frontend/                         ← BUILD FROM HERE (Phase 2)
│   ├── src/
│   ├── package.json
│   └── dist/                         ← Created by npm build
│
├── OPTION_2_DEPLOYMENT_GUIDE.md      ← Read this
├── WHERE_TO_RUN_COMMANDS.md          ← You are here
│
└── Scripts (run from project root):
    ├── pause-sparktoship.sh          ← ./pause-sparktoship.sh
    ├── resume-sparktoship.sh         ← ./resume-sparktoship.sh
    └── daily-cost-check.sh           ← ./daily-cost-check.sh
```

---

## Common Questions

### Q: Do I need to log into Google Cloud Console in my browser?
**A: NO!** Everything is done via `gcloud` CLI from your Mac Terminal.

### Q: Where is the Dockerfile?
**A: `/Users/sathya/web/python/adk/software-engineering-agents/backend/Dockerfile`**
It's already created! You don't need to create it.

### Q: Do I run commands in Google Cloud Shell?
**A: NO!** Run everything in your Mac Terminal (Terminal.app, iTerm, or VS Code terminal).

### Q: What folder should I be in?
**A: Depends on the command:**
- Backend deployment: `backend/` folder
- Frontend build: `frontend/` folder
- Load Balancer setup: Any folder (project root is fine)
- Scripts: Project root

### Q: How do I know which folder I'm in?
**A: Run `pwd` in terminal**
```bash
pwd
# Shows: /Users/sathya/web/python/adk/software-engineering-agents/backend
```

### Q: How do I navigate between folders?
```bash
# Go to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# Go to backend
cd backend

# Go back up one level
cd ..

# Go to frontend from backend
cd ../frontend
```

---

## Step-by-Step Checklist

### Before You Start
- [ ] Open Terminal on your Mac
- [ ] Navigate to project root: `cd /Users/sathya/web/python/adk/software-engineering-agents`
- [ ] Verify gcloud is installed: `gcloud --version`

### Phase 1: Backend
- [ ] In Terminal, go to backend folder: `cd backend`
- [ ] Verify Dockerfile exists: `ls -la Dockerfile`
- [ ] Run deploy command: `gcloud run deploy ...`
- [ ] Test: `curl $API_URL/health`

### Phase 2: Frontend
- [ ] In Terminal, go to frontend folder: `cd ../frontend`
- [ ] Build: `npm run build`
- [ ] Upload: `gsutil -m rsync -r -d dist gs://...`

### Phase 3: Load Balancer
- [ ] In Terminal, go to project root: `cd ..`
- [ ] Run all `gcloud compute` commands
- [ ] Note your Static IP

### Phase 4: DNS
- [ ] Open browser: https://dash.cloudflare.com
- [ ] Add A record with your Static IP
- [ ] Wait for SSL certificate
- [ ] Enable Cloudflare proxy

---

## 🎯 Quick Start

Open Terminal and copy-paste this:

```bash
# Navigate to your project
cd /Users/sathya/web/python/adk/software-engineering-agents

# Open the detailed guide
open WHERE_TO_RUN_COMMANDS.md

# Open the deployment guide
open OPTION_2_DEPLOYMENT_GUIDE.md

# You're ready to start!
```

**Remember**: Everything runs on YOUR MAC in Terminal! 🚀
