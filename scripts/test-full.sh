#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Renegados - Full Test Suite (Unit + E2E)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Check if API is running
API_URL="http://localhost:8000/api/health"
API_URL_ALT="http://localhost:8000"

echo -e "${YELLOW}[1/5]${NC} Checking if Laravel API is running..."

if curl -s "$API_URL" > /dev/null 2>&1 || curl -s "$API_URL_ALT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API is running on http://localhost:8000"
else
    echo -e "${RED}✗${NC} API is NOT running"
    echo ""
    echo -e "${YELLOW}Laravel API is required for E2E tests.${NC}"
    echo ""
    echo "Please start the API first:"
    echo ""
    echo "  cd ../server"
    echo "  php artisan serve"
    echo ""
    echo "Or if using Docker/Sail:"
    echo ""
    echo "  cd ../server"
    echo "  ./vendor/bin/sail up"
    echo ""
    echo -e "${BLUE}Once API is running, re-run this script.${NC}"
    exit 1
fi

# Run unit tests
echo ""
echo -e "${YELLOW}[2/5]${NC} Running unit tests..."
if npm test; then
    echo -e "${GREEN}✓${NC} Unit tests passed"
else
    echo -e "${RED}✗${NC} Unit tests failed"
    exit 1
fi

# Build application
echo ""
echo -e "${YELLOW}[3/5]${NC} Building application..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    exit 1
fi

# Start production server in background
echo ""
echo -e "${YELLOW}[4/5]${NC} Starting production server..."

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start server in background
npm run start > /tmp/nuxt-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
COUNTER=0
MAX_WAIT=30

while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Server is ready"
        break
    fi
    COUNTER=$((COUNTER + 1))
    sleep 1
    echo -n "."
done

if [ $COUNTER -eq $MAX_WAIT ]; then
    echo -e "${RED}✗${NC} Server failed to start"
    echo "Server logs:"
    cat /tmp/nuxt-server.log
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Run E2E tests
echo ""
echo -e "${YELLOW}[5/5]${NC} Running Cypress E2E tests..."

if npm run test:e2e; then
    echo -e "${GREEN}✓${NC} E2E tests passed"
    TEST_RESULT=0
else
    echo -e "${RED}✗${NC} E2E tests failed"
    TEST_RESULT=1
fi

# Cleanup - kill server
echo ""
echo -e "${BLUE}Cleaning up...${NC}"
kill $SERVER_PID 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}  ✓ ALL TESTS PASSED!${NC}"
else
    echo -e "${RED}  ✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check screenshots at: cypress/screenshots/"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

exit $TEST_RESULT
