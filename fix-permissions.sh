#!/bin/bash
# Fix Cloud Build Permissions
# Run this script to fix the permission error

set -e

echo "🔧 Fixing Cloud Build Permissions..."
echo ""

# Get project number
PROJECT_NUMBER=$(gcloud projects describe sparktoship --format='value(projectNumber)')
echo "Project Number: $PROJECT_NUMBER"
echo ""

# Step 1: Grant Cloud Build Service Account permissions
echo "Step 1: Granting Cloud Build Service Account permissions..."
gcloud projects add-iam-policy-binding sparktoship \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding sparktoship \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding sparktoship \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

echo "✅ Cloud Build permissions granted"
echo ""

# Step 2: Grant Compute Engine default service account permissions
echo "Step 2: Granting Compute Engine service account permissions..."
gcloud projects add-iam-policy-binding sparktoship \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding sparktoship \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"

echo "✅ Compute Engine permissions granted"
echo ""

# Step 3: Grant your user account permissions
echo "Step 3: Granting your user account permissions..."
gcloud projects add-iam-policy-binding sparktoship \
  --member="user:sathya.subscriptions@gmail.com" \
  --role="roles/owner"

echo "✅ User permissions granted"
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PERMISSIONS FIXED!                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "Now retry your deployment:"
echo ""
echo "cd /Users/sathya/web/python/adk/software-engineering-agents/backend"
echo ""
echo "gcloud run deploy sparktoship-api \\"
echo "  --source . \\"
echo "  --region=us-west1 \\"
echo "  --allow-unauthenticated \\"
echo "  --set-env-vars=\"GOOGLE_API_KEY=REDACTED_API_KEY\""
echo ""
