# 📦 Phase 2: Frontend Deployment Commands

## You Are Here
```
Folder: /Users/sathya/web/python/adk/software-engineering-agents/frontend
Node: v22.19.0 ✅
Status: Ready to build!
```

---

## Commands to Run (Copy & Paste)

### Step 1: Set API URL
```bash
export API_URL="https://sparktoship-api-480987910366.us-west1.run.app"
echo "VITE_API_BASE_URL=$API_URL" > .env.production
```
**What this does**: Creates `.env.production` file with your backend API URL

---

### Step 2: Install Dependencies
```bash
npm install
```
**What this does**: Installs all required packages (takes 2-3 minutes)

---

### Step 3: Build for Production
```bash
npm run build
```
**What this does**: 
- Compiles your React app
- Creates optimized production files in `dist/` folder
- Takes 2-3 minutes

**Expected output**:
```
vite v5.0.0 building for production...
✓ 1234 modules transformed.
dist/index.html                   1.23 kB
dist/assets/index-abc123.css     45.67 kB
dist/assets/index-def456.js     234.56 kB
✓ built in 12.34s
```

---

### Step 4: Create Cloud Storage Bucket
```bash
export BUCKET_NAME="sparktoship-frontend"
gsutil mb -l us-west1 gs://$BUCKET_NAME
```
**What this does**: Creates a storage bucket for your frontend files

---

### Step 5: Configure Website Hosting
```bash
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
```
**What this does**: Tells Cloud Storage to serve `index.html` as the main page

---

### Step 6: Make Publicly Readable
```bash
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
```
**What this does**: Allows anyone to view your frontend files (needed for public website)

---

### Step 7: Upload Files
```bash
gsutil -m rsync -r -d dist gs://$BUCKET_NAME
```
**What this does**: 
- Uploads all files from `dist/` to Cloud Storage
- `-m` = multi-threaded (faster)
- `-r` = recursive (all files and folders)
- `-d` = delete files in bucket that aren't in dist/

**Expected output**:
```
Building synchronization state...
Starting synchronization...
Copying file://dist/index.html [Content-Type=text/html]...
Copying file://dist/assets/index-abc123.css [Content-Type=text/css]...
Copying file://dist/assets/index-def456.js [Content-Type=application/javascript]...
...
Operation completed over 50 objects/234.5 kB.
```

---

### Step 8: Verify Upload
```bash
gsutil ls gs://$BUCKET_NAME
```
**What this does**: Lists all files in your bucket to confirm upload

**Expected output**:
```
gs://sparktoship-frontend/index.html
gs://sparktoship-frontend/assets/
gs://sparktoship-frontend/favicon.ico
...
```

---

## Troubleshooting

### If `npm install` fails:
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### If `npm run build` fails:
```bash
# Check for errors in the output
# Common issue: Missing dependencies
npm install
npm run build
```

### If `gsutil mb` says bucket already exists:
```bash
# Use a different bucket name
export BUCKET_NAME="sparktoship-frontend-v2"
# Then retry from Step 4
```

### If upload is slow:
- This is normal! Uploading can take 2-5 minutes
- The `-m` flag helps by using multiple threads

---

## What Happens Next

After Step 8, your frontend will be:
- ✅ Built and optimized
- ✅ Uploaded to Cloud Storage
- ✅ Publicly accessible (but not yet at sparktoship.dev)

**Next**: Phase 3 - Configure Load Balancer to route `sparktoship.dev` to your frontend

---

## Quick Reference

| Step | Command | Time | What It Does |
|------|---------|------|--------------|
| 1 | Set API URL | 1 sec | Configure backend URL |
| 2 | npm install | 2-3 min | Install packages |
| 3 | npm run build | 2-3 min | Build React app |
| 4 | Create bucket | 5 sec | Make storage bucket |
| 5 | Configure hosting | 2 sec | Set index.html |
| 6 | Make public | 2 sec | Allow public access |
| 7 | Upload files | 2-5 min | Upload to Cloud Storage |
| 8 | Verify | 2 sec | Check files uploaded |

**Total time**: ~10-15 minutes

---

## Ready?

Start with Step 1 and work your way down! 🚀

Copy each command, paste in terminal, wait for it to complete, then move to next step.

**You're doing great!** Backend is done, frontend is next! 💪
