#!/bin/bash
# SparkToShip - Resume Script
# Resumes paused resources to make the app accessible again

set -e

echo "▶️  Resuming SparkToShip..."
echo ""

# Configuration
PROJECT_ID="sparktoship"
REGION="us-west1"

# Set project
gcloud config set project $PROJECT_ID 2>/dev/null

# Get static IP
STATIC_IP=$(gcloud compute addresses describe sparktoship-ip --global --format="value(address)" 2>/dev/null || echo "")

if [ -z "$STATIC_IP" ]; then
    echo "❌ Error: Static IP 'sparktoship-ip' not found"
    echo "   Please run the deployment guide first"
    exit 1
fi

# Resume Load Balancer
echo "🌐 Resuming Load Balancer..."
if gcloud compute forwarding-rules describe sparktoship-https-rule --global &>/dev/null; then
    echo "  ℹ️  Load Balancer already running"
else
    gcloud compute forwarding-rules create sparktoship-https-rule \
      --global \
      --target-https-proxy=sparktoship-https-proxy \
      --address=sparktoship-ip \
      --ports=443
    echo "  ✓ Load Balancer resumed"
fi

# Cloud Run is already running (auto-scales from 0)
echo "✓ Cloud Run is ready (auto-scales on demand)"

echo ""
echo "✅ SparkToShip resumed successfully!"
echo ""
echo "🌐 Your app is live at:"
echo "   https://sparktoship.dev"
echo ""
echo "⏱️  Note: Load Balancer may take 1-2 minutes to fully activate"
echo ""
echo "💰 Current cost: ~$24/month (covered by free credit)"
echo "💡 To pause again: ./pause-sparktoship.sh"
echo ""
