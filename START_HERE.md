# 🚀 START HERE - Deployment in 3 Steps

## TL;DR - The Absolute Basics

1. **Everything runs on YOUR MAC** in Terminal
2. **Dockerfile already exists** in `backend/` folder
3. **Follow OPTION_2_DEPLOYMENT_GUIDE.md** step by step

---

## Before You Begin

### Open Terminal on Your Mac
- **Mac**: Press `Cmd + Space`, type "Terminal", press Enter
- **Or**: Use iTerm or VS Code's integrated terminal

### Navigate to Your Project
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents
```

---

## The 3 Main Phases

### Phase 1: Deploy Backend (30 min)
**WHERE**: Terminal, in `backend/` folder

```bash
# 1. Go to backend folder
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

# 2. Check Dockerfile exists (it does!)
ls -la Dockerfile

# 3. Deploy to Cloud Run
gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=your_key_here"
```

### Phase 2: Deploy Frontend (30 min)
**WHERE**: Terminal, in `frontend/` folder

```bash
# 1. Go to frontend folder
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

# 2. Build
npm run build

# 3. Upload to Cloud Storage
gsutil -m rsync -r -d dist gs://sparktoship-frontend
```

### Phase 3: Configure Load Balancer (60 min)
**WHERE**: Terminal, in project root

```bash
# 1. Go to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# 2. Follow all the gcloud compute commands
# (See OPTION_2_DEPLOYMENT_GUIDE.md Phase 3)
```

---

## Key Files You Need to Know

### Already Created (Don't Create Again!)
- ✅ `backend/Dockerfile` - Uses Python 3.12
- ✅ `backend/.dockerignore` - Optimizes build
- ✅ `pause-sparktoship.sh` - Pause resources
- ✅ `resume-sparktoship.sh` - Resume resources
- ✅ `daily-cost-check.sh` - Check costs

### You Need to Create
- ❌ Nothing! Everything is ready!

---

## Detailed Guides (Read These)

### 1. WHERE TO RUN COMMANDS
**File**: `WHERE_TO_RUN_COMMANDS.md`
**What**: Explains exactly where to run each command

```bash
open WHERE_TO_RUN_COMMANDS.md
```

### 2. COMMAND LOCATION MAP
**File**: `COMMAND_LOCATION_MAP.md`
**What**: Visual diagrams showing command flow

```bash
open COMMAND_LOCATION_MAP.md
```

### 3. MAIN DEPLOYMENT GUIDE
**File**: `OPTION_2_DEPLOYMENT_GUIDE.md`
**What**: Complete step-by-step instructions

```bash
open OPTION_2_DEPLOYMENT_GUIDE.md
```

---

## Quick Answers to Your Questions

### "Where do I run these commands?"
**Answer**: On YOUR MAC in Terminal (not in Google Cloud Console)

### "Which folder do I need to be in?"
**Answer**: 
- Backend deployment: `backend/` folder
- Frontend build: `frontend/` folder
- Load Balancer: Any folder (project root is fine)

### "Where do I create the Dockerfile?"
**Answer**: You DON'T! It's already in `backend/Dockerfile`

### "Do I use Google Cloud Shell?"
**Answer**: NO! Use your Mac Terminal

### "Do I need to open Google Cloud Console in browser?"
**Answer**: NO! Only for viewing (optional). All commands run via `gcloud` CLI

---

## Your First Command

Open Terminal and run this:

```bash
# Navigate to your project
cd /Users/sathya/web/python/adk/software-engineering-agents

# Verify you're in the right place
pwd
# Should show: /Users/sathya/web/python/adk/software-engineering-agents

# Check if Dockerfile exists
ls -la backend/Dockerfile
# Should show: -rw-r--r--  1 sathya  staff  866 Dec  2 15:31 backend/Dockerfile

# Open the main guide
open OPTION_2_DEPLOYMENT_GUIDE.md

# Open the "where to run" guide
open WHERE_TO_RUN_COMMANDS.md
```

---

## Folder Navigation Cheat Sheet

```bash
# Check where you are
pwd

# Go to project root
cd /Users/sathya/web/python/adk/software-engineering-agents

# Go to backend
cd backend

# Go to frontend (from backend)
cd ../frontend

# Go back to project root
cd ..

# List files in current folder
ls -la
```

---

## What Happens When You Deploy

### Phase 1: Backend
```
Your Mac Terminal (backend/ folder)
    │
    │ gcloud run deploy
    ▼
Google Cloud builds Docker image
    │
    │ Uses backend/Dockerfile
    ▼
Deploys to Cloud Run
    │
    ▼
You get a URL: https://sparktoship-api-xyz.a.run.app
```

### Phase 2: Frontend
```
Your Mac Terminal (frontend/ folder)
    │
    │ npm run build
    ▼
Creates dist/ folder
    │
    │ gsutil rsync
    ▼
Uploads to Cloud Storage
    │
    ▼
Files are now in Google Cloud
```

### Phase 3: Load Balancer
```
Your Mac Terminal (any folder)
    │
    │ gcloud compute commands
    ▼
Creates Load Balancer in Google Cloud
    │
    ▼
Routes traffic:
  • sparktoship.dev/ → Cloud Storage (frontend)
  • sparktoship.dev/api/* → Cloud Run (backend)
```

---

## Ready to Start?

### Step 1: Open Terminal
```bash
# Mac: Cmd + Space, type "Terminal"
```

### Step 2: Navigate to Project
```bash
cd /Users/sathya/web/python/adk/software-engineering-agents
```

### Step 3: Read the Guides
```bash
# Main deployment guide
open OPTION_2_DEPLOYMENT_GUIDE.md

# Where to run commands
open WHERE_TO_RUN_COMMANDS.md

# Visual map
open COMMAND_LOCATION_MAP.md
```

### Step 4: Start Deploying!
Follow OPTION_2_DEPLOYMENT_GUIDE.md step by step.

---

## Need Help?

### Check These Files
1. `WHERE_TO_RUN_COMMANDS.md` - Detailed command locations
2. `COMMAND_LOCATION_MAP.md` - Visual diagrams
3. `OPTION_2_DEPLOYMENT_GUIDE.md` - Complete guide
4. `PYTHON_VERSION_NOTE.md` - Python version info
5. `COST_OPTIMIZATION_GUIDE.md` - Save money

### Common Issues
- **"Command not found"**: Install gcloud CLI first
- **"Permission denied"**: Run `gcloud auth login`
- **"Wrong folder"**: Run `pwd` to check, `cd` to navigate

---

## Summary

✅ **Run everything on YOUR MAC in Terminal**  
✅ **Dockerfile already exists in backend/**  
✅ **Follow OPTION_2_DEPLOYMENT_GUIDE.md**  
✅ **Takes 2-3 hours total**  
✅ **Costs $24/month (covered by $300 free credit)**  

**You're ready! Open the guides and start deploying!** 🚀
