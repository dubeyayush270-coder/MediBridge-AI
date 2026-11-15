# Google Cloud Run 1-Command Deployment Script for MediBridge AI
# Hackathon Project: medibridge-ai-4f126

$PROJECT_ID = "medibridge-ai-4f126"
$REGION = "us-central1"
$SERVICE_NAME = "medibridge-ai"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Deploying MediBridge AI to Google Cloud Run" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID | Region: $REGION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Set GCP project
gcloud config set project $PROJECT_ID

# Enable required Google Cloud services
Write-Host "`n1. Enabling Cloud Run, Cloud Build, and Artifact Registry APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Submit build to Cloud Build
Write-Host "`n2. Building and deploying container image using Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --config=cloudbuild.yaml .

# Get service URL
Write-Host "`n3. Deployment Complete! Fetching Cloud Run service URL..." -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)"
Write-Host "MediBridge AI is LIVE at: $SERVICE_URL" -ForegroundColor Green
Write-Host "Healthcheck: $SERVICE_URL/api/health" -ForegroundColor Green
