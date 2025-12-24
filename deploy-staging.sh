#!/bin/bash

# 🚀 Renegados Client Deployment Script - STAGING
# Deploys the Nuxt client to staging/PRE environment
#
# This script orchestrates the deployment by calling:
#   1. pull-latest.sh - Pulls latest code from git
#   2. build-and-deploy.sh --staging - Builds and restarts PM2 processes
#
# Usage:
#   ./deploy-staging.sh              # Deploy with confirmation
#   ./deploy-staging.sh --yes        # Deploy without confirmation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
SKIP_CONFIRMATION=false
for arg in "$@"; do
    if [ "$arg" = "--yes" ] || [ "$arg" = "-y" ]; then
        SKIP_CONFIRMATION=true
    fi
done

print_status "🚀 Renegados Client Deployment - STAGING (PRE)"
echo ""

# Safety check: only run in staging directory
if [[ ! "$PWD" =~ "repostea-staging" ]]; then
    print_error "❌ This script must be run from /var/www/repostea-staging/client"
    print_error "   Current directory: $PWD"
    exit 1
fi

# Check if running as root (should not be)
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    exit 1
fi

# Confirmation
if [ "$SKIP_CONFIRMATION" = false ]; then
    print_warning "This will deploy the latest changes to STAGING (PRE)."
    print_warning "This will restart PM2 processes: nuxt-pre2-3010 through nuxt-pre2-3013"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

echo ""
print_status "========================================="
print_status "STEP 1: PULL LATEST CODE"
print_status "========================================="
echo ""

# Run pull-latest.sh
if bash pull-latest.sh --yes; then
    print_success "✅ Code updated successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi

echo ""
print_status "========================================="
print_status "STEP 2: BUILD AND DEPLOY"
print_status "========================================="
echo ""

# Run build-and-deploy.sh with --staging flag
if bash build-and-deploy.sh --staging --yes; then
    print_success "✅ Build and deployment completed successfully"
else
    print_error "Failed to build and deploy"
    exit 1
fi

echo ""
print_success "🎉 Staging deployment completed successfully!"
echo ""

exit 0
