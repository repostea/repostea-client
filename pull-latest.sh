#!/bin/bash

# 📥 Pull Latest Changes Script
# Fetches and resets to latest code from current branch
#
# Usage:
#   ./pull-latest.sh              # Pull with confirmation
#   ./pull-latest.sh --yes        # Pull without confirmation

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

print_status "📥 Pull Latest Changes"
echo ""

# Check if running as root (should not be)
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    exit 1
fi

# Confirmation
if [ "$SKIP_CONFIRMATION" = false ]; then
    print_warning "This will pull the latest changes from the current branch."
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Pull cancelled."
        exit 0
    fi
fi

echo ""
print_status "========================================="
print_status "📥 PULLING LATEST CHANGES (SHALLOW)"
print_status "========================================="
echo ""

# Pull latest changes using shallow clone
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

if git fetch --depth=1 origin "$CURRENT_BRANCH"; then
    print_success "✅ Latest changes fetched successfully"
else
    print_error "Failed to fetch changes"
    exit 1
fi

if git reset --hard FETCH_HEAD; then
    print_success "✅ Repository updated to latest commit"
else
    print_error "Failed to update repository"
    exit 1
fi

# Clean up old history
git reflog expire --expire=all --all 2>/dev/null || true
git gc --prune=all 2>/dev/null || true

echo ""
print_success "✨ Pull completed successfully!"
echo ""

exit 0
