#!/bin/bash
set -e

echo "🚀 Deploying SparkToShip to Production..."
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check for required environment variables
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "⚠️  Warning: GOOGLE_API_KEY not set"
    echo "   Backend will deploy without API key"
    echo "   Users will need to provide their own API key via UI"
fi

# Deploy Backend
echo "📦 Step 1/3: Deploying Backend to Cloud Run..."
cd backend

gcloud run deploy sparktoship-api \
  --source . \
  --region=us-west1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_API_KEY=${GOOGLE_API_KEY:-}" \
  --quiet

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully!"
else
    echo "❌ Backend deployment failed!"
    exit 1
fi

cd ..

# Build and Deploy Frontend
echo ""
echo "📦 Step 2/3: Building Frontend..."
cd frontend

# Verify production environment file exists
if [ ! -f .env.production ]; then
    echo "⚠️  Creating .env.production file..."
    echo "VITE_API_BASE_URL=https://sparktoship.dev/api" > .env.production
fi

# Show what we're using
echo "   Using environment:"
cat .env.production

# Build
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "📦 Step 3/3: Deploying Frontend to Cloud Storage..."

gsutil -m rsync -r -d dist gs://sparktoship-frontend

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed successfully!"
else
    echo "❌ Frontend deployment failed!"
    exit 1
fi

cd ..

# Summary
echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📊 Deployment Summary:"
echo "   Backend:  https://sparktoship-api-480987910366.us-west1.run.app"
echo "   Frontend: https://sparktoship.dev"
echo "   API:      https://sparktoship.dev/api"
echo ""
echo "🔍 Verify deployment:"
echo "   curl https://sparktoship.dev/api/health"
echo "   open https://sparktoship.dev"
echo ""
echo "💡 Next steps:"
echo "   1. Test the website in your browser"
echo "   2. Check model dropdown is populated"
echo "   3. Verify API key settings work"
echo ""
