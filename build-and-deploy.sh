#!/bin/bash

# 🔨 Build and Deploy Script
# Builds application and restarts PM2 processes
# Uses releases with symlinks for instant rollback
#
# Usage:
#   ./build-and-deploy.sh                    # Deploy to production (default)
#   ./build-and-deploy.sh --staging          # Deploy to staging/PRE environment
#   ./build-and-deploy.sh --yes              # Skip confirmation
#   ./build-and-deploy.sh --staging --yes    # Deploy to staging without confirmation
#   ./build-and-deploy.sh --rollback         # Rollback to previous release
#   ./build-and-deploy.sh --list             # List available releases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RELEASES_DIR="releases"
RELEASES_TO_KEEP=5

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
IS_STAGING=false
DO_ROLLBACK=false
LIST_RELEASES=false
for arg in "$@"; do
    if [ "$arg" = "--yes" ] || [ "$arg" = "-y" ]; then
        SKIP_CONFIRMATION=true
    elif [ "$arg" = "--staging" ]; then
        IS_STAGING=true
    elif [ "$arg" = "--rollback" ]; then
        DO_ROLLBACK=true
    elif [ "$arg" = "--list" ]; then
        LIST_RELEASES=true
    fi
done

# Determine environment
if [ "$IS_STAGING" = true ]; then
    ENV_NAME="STAGING (PRE)"
    PM2_APP_NAME=""
    PM2_PATTERN="nuxt-pre2-"
    PORT_RANGE="3010-3013"
    USE_CLUSTER=false
else
    ENV_NAME="PRODUCTION"
    PM2_APP_NAME="nuxt-prod"
    PM2_PATTERN=""
    PORT_RANGE="3100"
    USE_CLUSTER=true
fi

# Function to list releases
list_releases() {
    print_status "Available releases:"
    if [ -d "$RELEASES_DIR" ]; then
        ls -lt "$RELEASES_DIR" | grep "^d" | head -10 | awk '{print "  " $NF}'
        CURRENT=$(readlink .output 2>/dev/null || echo "none")
        echo ""
        print_status "Current: $CURRENT"
    else
        print_warning "No releases directory found"
    fi
}

# Function to rollback
do_rollback() {
    print_status "🔄 ROLLBACK - $ENV_NAME"
    echo ""

    if [ ! -d "$RELEASES_DIR" ]; then
        print_error "No releases directory found"
        exit 1
    fi

    # Get current release
    CURRENT=$(readlink .output 2>/dev/null | xargs basename || echo "")

    # List available releases
    RELEASES=($(ls -t "$RELEASES_DIR"))

    if [ ${#RELEASES[@]} -lt 2 ]; then
        print_error "Not enough releases for rollback"
        exit 1
    fi

    # Find previous release (skip current)
    PREVIOUS=""
    for rel in "${RELEASES[@]}"; do
        if [ "$rel" != "$CURRENT" ]; then
            PREVIOUS="$rel"
            break
        fi
    done

    if [ -z "$PREVIOUS" ]; then
        print_error "No previous release found"
        exit 1
    fi

    print_status "Current release: $CURRENT"
    print_status "Rolling back to: $PREVIOUS"

    if [ "$SKIP_CONFIRMATION" = false ]; then
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Rollback cancelled."
            exit 0
        fi
    fi

    # Atomic symlink swap
    ln -sfn "$RELEASES_DIR/$PREVIOUS" .output
    print_success "✅ Symlink updated to $PREVIOUS"

    # Reload PM2
    reload_pm2

    print_success "✨ Rollback completed!"
}

# Function to reload PM2
reload_pm2() {
    echo ""
    print_status "========================================="
    print_status "🔄 RESTARTING PM2 PROCESSES"
    print_status "========================================="
    echo ""

    if [ "$USE_CLUSTER" = true ]; then
        print_status "Using PM2 cluster reload (zero downtime)..."
        if pm2 reload "$PM2_APP_NAME" --update-env; then
            print_success "✅ $PM2_APP_NAME reloaded successfully (zero downtime)"
        else
            print_warning "⚠️  Failed to reload, trying restart..."
            if pm2 restart "$PM2_APP_NAME"; then
                print_success "✅ $PM2_APP_NAME restarted successfully"
            else
                print_error "Failed to restart $PM2_APP_NAME"
            fi
        fi
    else
        CURRENT_DIR=$(pwd)
        PM2_PROCESSES=$(pm2 jlist | jq -r ".[] | select(.pm2_env.pm_cwd == \"$CURRENT_DIR\" and (.name | startswith(\"$PM2_PATTERN\"))) | .name" | sort -u || echo "")

        if [ -z "$PM2_PROCESSES" ]; then
            print_warning "No PM2 processes found with pattern '$PM2_PATTERN'"
            print_warning "To start staging processes, run: ./start-pre2-cluster.sh"
        else
            print_status "Found PM2 processes: $(echo $PM2_PROCESSES | tr '\n' ' ')"

            for process in $PM2_PROCESSES; do
                print_status "Reloading $process..."
                if pm2 reload "$process" --update-env; then
                    print_success "✅ $process reloaded successfully"
                else
                    print_warning "⚠️  Failed to reload $process, trying restart..."
                    if pm2 restart "$process"; then
                        print_success "✅ $process restarted successfully"
                    else
                        print_error "Failed to restart $process"
                    fi
                fi
            done

            print_success "✅ All PM2 processes restarted"
        fi
    fi

    # Show PM2 status
    echo ""
    print_status "PM2 Status:"
    if [ "$USE_CLUSTER" = true ]; then
        pm2 list | grep -E "id|$PM2_APP_NAME" || pm2 list
    else
        pm2 list | grep -E "id|${PM2_PATTERN}" || pm2 list
    fi
}

# Function to cleanup old releases
cleanup_old_releases() {
    if [ -d "$RELEASES_DIR" ]; then
        RELEASE_COUNT=$(ls -1 "$RELEASES_DIR" | wc -l)
        if [ "$RELEASE_COUNT" -gt "$RELEASES_TO_KEEP" ]; then
            print_status "Cleaning up old releases (keeping last $RELEASES_TO_KEEP)..."
            ls -t "$RELEASES_DIR" | tail -n +$((RELEASES_TO_KEEP + 1)) | while read old_release; do
                print_status "Removing old release: $old_release"
                rm -rf "$RELEASES_DIR/$old_release"
            done
            print_success "✅ Old releases cleaned up"
        fi
    fi
}

# Handle --list
if [ "$LIST_RELEASES" = true ]; then
    list_releases
    exit 0
fi

# Handle --rollback
if [ "$DO_ROLLBACK" = true ]; then
    do_rollback
    exit 0
fi

# Main deploy flow
print_status "🔨 Build and Deploy - $ENV_NAME"
echo ""

# Check if running as root (should not be)
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    exit 1
fi

# Confirmation
if [ "$SKIP_CONFIRMATION" = false ]; then
    print_warning "This will build and deploy to $ENV_NAME."
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

echo ""
print_status "========================================="
print_status "📦 INSTALLING DEPENDENCIES"
print_status "========================================="
echo ""

# Install dependencies
if npm install; then
    print_success "✅ Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
print_status "========================================="
print_status "🔨 BUILDING APPLICATION"
print_status "========================================="
echo ""

# Create releases directory if it doesn't exist
mkdir -p "$RELEASES_DIR"

# Generate release name with timestamp
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)"
RELEASE_PATH="$RELEASES_DIR/$RELEASE_NAME"

# Clean temporary build directories and cache
print_status "Cleaning temporary build directories and cache..."
rm -rf .output-build .nuxt node_modules/.vite

# Build application
print_status "Building application..."
if npm run build; then
    print_success "✅ Application built successfully"
else
    print_error "Failed to build application"
    exit 1
fi

# Move build to releases directory
print_status "Moving build to releases/$RELEASE_NAME..."
if mv .output "$RELEASE_PATH"; then
    print_success "✅ Build moved to releases"
else
    print_error "Failed to move build to releases"
    exit 1
fi

echo ""
print_status "========================================="
print_status "🔗 ATOMIC SYMLINK SWAP"
print_status "========================================="
echo ""

# Get current release for logging
CURRENT_RELEASE=$(readlink .output 2>/dev/null | xargs basename || echo "none")
print_status "Previous release: $CURRENT_RELEASE"
print_status "New release: $RELEASE_NAME"

# Atomic symlink swap (ln -sfn is atomic on Linux)
if ln -sfn "$RELEASE_PATH" .output; then
    print_success "✅ Symlink updated atomically"
else
    print_error "Failed to update symlink"
    exit 1
fi

# Reload PM2
reload_pm2

echo ""
print_status "========================================="
print_status "🧹 POST-DEPLOY CLEANUP"
print_status "========================================="
echo ""

# Clean up old releases
cleanup_old_releases

if [ -d ".nuxt" ]; then
    print_status "Removing .nuxt cache directory..."
    rm -rf .nuxt
    print_success "✅ Cache directory removed"
fi

echo ""
print_status "========================================="
print_status "📋 DEPLOYMENT SUMMARY"
print_status "========================================="
echo ""

print_success "✨ $ENV_NAME deployment completed successfully!"
echo ""
echo "📦 Release: $RELEASE_NAME"

if [ "$IS_STAGING" = true ]; then
    echo "🌐 Application URL: https://pre-app.renegados.es"
    echo "🔌 Ports: $PORT_RANGE"
    echo ""
    print_status "💡 Useful commands:"
    echo "  View logs:           pm2 logs ${PM2_PATTERN}3010"
    echo "  Rollback:            ./build-and-deploy.sh --staging --rollback"
    echo "  List releases:       ./build-and-deploy.sh --list"
else
    echo "🌐 Application URL: https://app.renegados.es"
    echo "🔌 Port: $PORT_RANGE (cluster mode)"
    echo ""
    print_status "💡 Useful commands:"
    echo "  View logs:           pm2 logs $PM2_APP_NAME"
    echo "  Reload (zero dt):    pm2 reload $PM2_APP_NAME"
    echo "  Rollback:            ./build-and-deploy.sh --rollback"
    echo "  List releases:       ./build-and-deploy.sh --list"
fi

echo ""

exit 0
