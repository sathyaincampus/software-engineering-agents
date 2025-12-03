#!/bin/bash
# SparkToShip - Daily Cost Check
# Quick script to check what's running and estimate daily costs

set -e

echo "📊 SparkToShip Daily Cost Check"
echo "================================"
echo ""

# Configuration
PROJECT_ID="sparktoship"
REGION="us-west1"

# Set project
gcloud config set project $PROJECT_ID 2>/dev/null

echo "🏃 Active Resources:"
echo "-------------------"

# Cloud Run
RUN_COUNT=$(gcloud run services list --format="value(metadata.name)" 2>/dev/null | wc -l | tr -d ' ')
if [ "$RUN_COUNT" -gt 0 ]; then
    echo "✓ Cloud Run services: $RUN_COUNT"
    gcloud run services list --format="table(metadata.name,status.url)" 2>/dev/null | tail -n +2
else
    echo "  No Cloud Run services"
fi

echo ""

# Load Balancer
LB_COUNT=$(gcloud compute forwarding-rules list --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LB_COUNT" -gt 0 ]; then
    echo "✓ Load Balancers: $LB_COUNT"
    gcloud compute forwarding-rules list --format="table(name,IPAddress)" 2>/dev/null | tail -n +2
else
    echo "  No Load Balancers (paused)"
fi

echo ""

# Vertex AI
AI_COUNT=$(gcloud ai agent-engines list --region=$REGION --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
if [ "$AI_COUNT" -gt 0 ]; then
    echo "✓ Vertex AI agents: $AI_COUNT"
    gcloud ai agent-engines list --region=$REGION --format="table(name,createTime)" 2>/dev/null | tail -n +2
else
    echo "  No Vertex AI agents"
fi

echo ""
echo "💰 Estimated Daily Cost:"
echo "----------------------"

DAILY_COST=0

if [ "$LB_COUNT" -gt 0 ]; then
    echo "Load Balancer: ~\$0.60/day"
    DAILY_COST=$(echo "$DAILY_COST + 0.60" | bc)
fi

if [ "$RUN_COUNT" -gt 0 ]; then
    echo "Cloud Run: ~\$0.17/day (with traffic)"
    DAILY_COST=$(echo "$DAILY_COST + 0.17" | bc)
fi

if [ "$AI_COUNT" -gt 0 ]; then
    echo "Vertex AI: ~\$0.42/day (with usage)"
    DAILY_COST=$(echo "$DAILY_COST + 0.42" | bc)
fi

echo "Storage: ~\$0.001/day"
DAILY_COST=$(echo "$DAILY_COST + 0.001" | bc)

echo ""
echo "Total: ~\$$DAILY_COST/day"
echo ""

# Calculate projections
MONTHLY_COST=$(echo "$DAILY_COST * 30" | bc)
MONTHS_REMAINING=$(echo "scale=1; 300 / $MONTHLY_COST" | bc)

echo "📅 Projections:"
echo "--------------"
echo "Monthly: ~\$$MONTHLY_COST"
echo "Free credit lasts: ~$MONTHS_REMAINING months"
echo ""

# Recommendations
if (( $(echo "$MONTHLY_COST > 25" | bc -l) )); then
    echo "⚠️  WARNING: High monthly cost!"
    echo "💡 Recommendations:"
    echo "   • Pause Load Balancer overnight: ./pause-sparktoship.sh"
    echo "   • Delete Vertex AI agents if not needed"
    echo "   • Check for unused resources"
elif (( $(echo "$MONTHLY_COST > 15" | bc -l) )); then
    echo "ℹ️  Moderate cost - consider pausing overnight to save money"
else
    echo "✅ Cost is well optimized!"
fi

echo ""
echo "🔗 View detailed billing:"
echo "   https://console.cloud.google.com/billing"
echo ""
