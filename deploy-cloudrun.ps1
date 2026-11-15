# Google Cloud Run 1-Command Deployment Script for MediBridge AI
# Hackathon Project: medibridge-ai-4f126

$PROJECT_ID = "medibridge-ai-4f126"
$REGION = "us-central1"
$SERVICE_NAME = "medibridge-ai"
$RUNTIME_SA = "medibridge-cloudrun@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Deploying MediBridge AI to Google Cloud Run" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID | Region: $REGION" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 0. Preflight: Verify gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "`n[ERROR] Google Cloud SDK ('gcloud') is not found in PATH." -ForegroundColor Red
    Write-Host "Please install the Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "  winget install Google.CloudSDK" -ForegroundColor White
    Write-Host "Then authenticate via:" -ForegroundColor Yellow
    Write-Host "  gcloud auth login" -ForegroundColor White
    exit 1
}

# Set GCP project
Write-Host "`n0. Setting GCP project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required Google Cloud services
Write-Host "`n1. Enabling Cloud Run, Cloud Build, and Container Registry APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# Setup dedicated Cloud Run runtime service account
Write-Host "`n2. Ensuring dedicated Cloud Run runtime service account ($RUNTIME_SA)..." -ForegroundColor Yellow
gcloud iam service-accounts describe $RUNTIME_SA --project $PROJECT_ID 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating service account $RUNTIME_SA..." -ForegroundColor Cyan
    gcloud iam service-accounts create medibridge-cloudrun --display-name="MediBridge Cloud Run Runtime SA" --project $PROJECT_ID
}

# Grant Firestore Datastore User role to runtime SA
Write-Host "Granting roles/datastore.user to $RUNTIME_SA..." -ForegroundColor Cyan
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$RUNTIME_SA" --role="roles/datastore.user" --condition=None

# Grant Firebase Authentication Admin role to runtime SA
Write-Host "Granting roles/firebaseauth.admin to $RUNTIME_SA..." -ForegroundColor Cyan
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$RUNTIME_SA" --role="roles/firebaseauth.admin" --condition=None

# Submit build to Cloud Build
Write-Host "`n3. Building and deploying container image using Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit --config=cloudbuild.yaml .

# Get service URL
Write-Host "`n4. Deployment Complete! Fetching Cloud Run service URL..." -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)"
Write-Host "=============================================" -ForegroundColor Green
Write-Host "MediBridge AI is LIVE at: $SERVICE_URL" -ForegroundColor Green
Write-Host "Healthcheck: $SERVICE_URL/api/health" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
