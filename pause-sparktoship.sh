#!/bin/bash
# SparkToShip - Pause Script
# Pauses expensive resources to save money when not in use

set -e

echo "🛑 Pausing SparkToShip to save money..."
echo ""

# Configuration
PROJECT_ID="sparktoship"
REGION="us-west1"

# Set project
gcloud config set project $PROJECT_ID 2>/dev/null

# Pause Load Balancer (saves ~$18/month)
echo "⏸️  Pausing Load Balancer..."
if gcloud compute forwarding-rules describe sparktoship-https-rule --global &>/dev/null; then
    gcloud compute forwarding-rules delete sparktoship-https-rule --global --quiet
    echo "  ✓ Load Balancer paused"
else
    echo "  ℹ️  Load Balancer already paused"
fi

# Cloud Run already scales to zero (min-instances=0)
echo "✓ Cloud Run scales to zero automatically (no action needed)"

# Delete Vertex AI agents (if deployed)
echo ""
echo "🤖 Checking for Vertex AI agents..."
AGENTS=$(gcloud ai agent-engines list --region=$REGION --format="value(name)" 2>/dev/null || echo "")
if [ ! -z "$AGENTS" ]; then
    echo "  Deleting Vertex AI agents..."
    echo "$AGENTS" | while read agent; do
        if [ ! -z "$agent" ]; then
            gcloud ai agent-engines delete $agent --region=$REGION --quiet
            echo "  ✓ Deleted agent: $agent"
        fi
    done
else
    echo "  ℹ️  No Vertex AI agents found"
fi

echo ""
echo "✅ SparkToShip paused successfully!"
echo ""
echo "💰 Cost Savings:"
echo "   • Load Balancer: ~$18/month saved"
echo "   • Vertex AI: ~$0-12/month saved"
echo "   • Current cost: ~$1/month (storage only)"
echo ""
echo "💡 To resume: ./resume-sparktoship.sh"
echo ""
