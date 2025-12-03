#!/bin/bash

# SparkToShip - Google Cloud Deployment Script
# This script automates the deployment of SparkToShip to Google Cloud Platform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-sparktoship-prod}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-sparktoship-backend}"
BUCKET_NAME="${BUCKET_NAME:-sparktoship-frontend}"
DOMAIN="${DOMAIN:-sparktoship.dev}"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI found"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker found"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js: https://nodejs.org/"
        exit 1
    fi
    print_success "npm found"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 not found. Please install: https://www.python.org/"
        exit 1
    fi
    print_success "Python 3 found"
    
    # Check GOOGLE_API_KEY
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "GOOGLE_API_KEY not set. You'll need to set it later."
    else
        print_success "GOOGLE_API_KEY is set"
    fi
}

configure_gcloud() {
    print_header "Configuring Google Cloud"
    
    print_info "Setting project to $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    
    print_info "Setting region to $REGION"
    gcloud config set compute/region $REGION
    
    print_success "Google Cloud configured"
}

enable_apis() {
    print_header "Enabling Required APIs"
    
    print_info "This may take a few minutes..."
    gcloud services enable \
        run.googleapis.com \
        cloudbuild.googleapis.com \
        artifactregistry.googleapis.com \
        compute.googleapis.com \
        storage.googleapis.com \
        cloudresourcemanager.googleapis.com
    
    print_success "APIs enabled"
}

create_artifact_registry() {
    print_header "Creating Artifact Registry Repository"
    
    # Check if repository exists
    if gcloud artifacts repositories describe sparktoship-repo --location=$REGION &> /dev/null; then
        print_warning "Repository already exists, skipping creation"
    else
        print_info "Creating repository..."
        gcloud artifacts repositories create sparktoship-repo \
            --repository-format=docker \
            --location=$REGION \
            --description="SparkToShip Docker images"
        print_success "Repository created"
    fi
}

build_and_deploy_backend() {
    print_header "Building and Deploying Backend"
    
    # Check if Dockerfile exists
    if [ ! -f "backend/Dockerfile" ]; then
        print_error "backend/Dockerfile not found. Creating one..."
        cat > backend/Dockerfile << 'EOF'
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF
        print_success "Dockerfile created"
    fi
    
    # Build and push image
    print_info "Building Docker image (this may take a few minutes)..."
    cd backend
    gcloud builds submit \
        --tag $REGION-docker.pkg.dev/$PROJECT_ID/sparktoship-repo/$SERVICE_NAME:latest
    cd ..
    print_success "Docker image built and pushed"
    
    # Deploy to Cloud Run
    print_info "Deploying to Cloud Run..."
    
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_warning "GOOGLE_API_KEY not set. Deploying without it."
        gcloud run deploy $SERVICE_NAME \
            --image $REGION-docker.pkg.dev/$PROJECT_ID/sparktoship-repo/$SERVICE_NAME:latest \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --memory 2Gi \
            --cpu 2 \
            --timeout 300 \
            --max-instances 10 \
            --min-instances 0
    else
        gcloud run deploy $SERVICE_NAME \
            --image $REGION-docker.pkg.dev/$PROJECT_ID/sparktoship-repo/$SERVICE_NAME:latest \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY,MODEL_NAME=gemini-2.0-flash-exp \
            --memory 2Gi \
            --cpu 2 \
            --timeout 300 \
            --max-instances 10 \
            --min-instances 0
    fi
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    print_success "Backend deployed to: $SERVICE_URL"
}

build_frontend() {
    print_header "Building Frontend"
    
    cd frontend
    
    # Create production env file
    print_info "Creating production environment file..."
    cat > .env.production << EOF
VITE_API_BASE_URL=https://$DOMAIN/api
EOF
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install
    
    # Build
    print_info "Building frontend (this may take a few minutes)..."
    npm run build
    
    cd ..
    print_success "Frontend built"
}

deploy_frontend() {
    print_header "Deploying Frontend to Cloud Storage"
    
    # Create bucket
    print_info "Creating Cloud Storage bucket..."
    if gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
        print_warning "Bucket already exists, skipping creation"
    else
        gsutil mb -l $REGION gs://$BUCKET_NAME
        print_success "Bucket created"
    fi
    
    # Make bucket public
    print_info "Making bucket publicly readable..."
    gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME
    
    # Enable website configuration
    print_info "Enabling website configuration..."
    gsutil web set -m index.html -e index.html gs://$BUCKET_NAME
    
    # Upload files
    print_info "Uploading frontend files..."
    gsutil -m rsync -r -d frontend/dist gs://$BUCKET_NAME
    
    print_success "Frontend deployed to: https://storage.googleapis.com/$BUCKET_NAME/index.html"
}

setup_load_balancer() {
    print_header "Setting Up Load Balancer"
    
    print_warning "Load balancer setup is complex and requires manual steps."
    print_info "Please follow the detailed instructions in GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md"
    print_info "Key steps:"
    print_info "  1. Reserve static IP"
    print_info "  2. Create backend services"
    print_info "  3. Create URL map"
    print_info "  4. Create SSL certificate"
    print_info "  5. Create HTTPS proxy and forwarding rule"
}

print_cloudflare_instructions() {
    print_header "Cloudflare DNS Configuration"
    
    print_info "To connect your domain to Google Cloud:"
    print_info ""
    print_info "1. Get your static IP:"
    print_info "   gcloud compute addresses describe sparktoship-ip --global --format='get(address)'"
    print_info ""
    print_info "2. In Cloudflare Dashboard:"
    print_info "   - Go to DNS → Records"
    print_info "   - Add A record: @ → <YOUR_STATIC_IP>"
    print_info "   - Add CNAME record: www → $DOMAIN"
    print_info "   - Enable Proxy (orange cloud)"
    print_info ""
    print_info "3. Configure SSL/TLS:"
    print_info "   - Set encryption mode to 'Full (strict)'"
    print_info ""
    print_info "See GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md for detailed instructions"
}

print_summary() {
    print_header "Deployment Summary"
    
    echo ""
    print_success "Backend deployed successfully!"
    print_success "Frontend built and uploaded!"
    echo ""
    print_info "Next steps:"
    print_info "  1. Set up Load Balancer (see GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md)"
    print_info "  2. Configure Cloudflare DNS"
    print_info "  3. Test your deployment"
    echo ""
    print_info "Useful commands:"
    print_info "  - View backend logs: gcloud run services logs read $SERVICE_NAME --region=$REGION"
    print_info "  - Update backend: gcloud run services update $SERVICE_NAME --region=$REGION"
    print_info "  - View costs: gcloud billing accounts list"
    echo ""
    print_info "Documentation:"
    print_info "  - Deployment Guide: GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md"
    print_info "  - ADK Knowledge: ADK_DEPLOYMENT_KNOWLEDGE.md"
    echo ""
}

# Main execution
main() {
    print_header "SparkToShip - Google Cloud Deployment"
    echo ""
    print_info "Project ID: $PROJECT_ID"
    print_info "Region: $REGION"
    print_info "Domain: $DOMAIN"
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    check_prerequisites
    configure_gcloud
    enable_apis
    create_artifact_registry
    build_and_deploy_backend
    build_frontend
    deploy_frontend
    setup_load_balancer
    print_cloudflare_instructions
    print_summary
}

# Run main function
main
