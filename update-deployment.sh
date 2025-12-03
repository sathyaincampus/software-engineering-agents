#!/bin/bash
# Script to update deployment with latest code

echo "🚀 Starting Deployment Update..."
echo "================================="

# 1. Deploy Backend
echo ""
echo "📦 Updating Backend (Cloud Run)..."
cd /Users/sathya/web/python/adk/software-engineering-agents/backend

# Note: We don't need to specify API key again, Cloud Run remembers it!
gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated

echo "✅ Backend updated!"

# 2. Deploy Frontend
echo ""
echo "🎨 Updating Frontend (Cloud Storage)..."
cd /Users/sathya/web/python/adk/software-engineering-agents/frontend

echo "   Building React app..."
npm run build

echo "   Uploading to Cloud Storage..."
export BUCKET_NAME="sparktoship-frontend"
gsutil -m rsync -r -d dist gs://$BUCKET_NAME

echo "✅ Frontend updated!"

echo ""
echo "================================="
echo "🎉 Update Complete!"
echo "🌍 Live at: https://sparktoship.dev"
