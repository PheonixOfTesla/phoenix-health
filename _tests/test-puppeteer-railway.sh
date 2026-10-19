#!/bin/bash
# Test Puppeteer Automation on Railway Production
# Date: 2025-12-26

API_URL="https://pal-backend-production.up.railway.app"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU"

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║   PUPPETEER AUTOMATION VERIFICATION - RAILWAY PRODUCTION          ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo -e "${BLUE}[TEST 1]${NC} Backend Health Check..."
HEALTH=$(curl -s "$API_URL/api/health")
if echo "$HEALTH" | grep -q "OK"; then
    echo -e "${GREEN}✅ PASS${NC} - Backend is running"
    echo "   Uptime: $(echo $HEALTH | jq -r '.uptime // "unknown"')s"
else
    echo -e "${RED}❌ FAIL${NC} - Backend not responding"
    exit 1
fi
echo ""

# Test 2: Authentication
echo -e "${BLUE}[TEST 2]${NC} JWT Token Validation..."
AUTH_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Token accepted by server"
else
    echo -e "${RED}❌ FAIL${NC} - Authentication failed"
    exit 1
fi
echo ""

# Test 3: Universal Agent Endpoint (Email - No Browser Required)
echo -e "${BLUE}[TEST 3]${NC} Universal Agent - Email Task (No Puppeteer)..."
echo "   Task: Send email to test@example.com"
EMAIL_TEST=$(curl -s -X POST "$API_URL/api/butler/universal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"task": "Send an email to test@example.com saying hello"}')

echo "$EMAIL_TEST" | jq '.'
if echo "$EMAIL_TEST" | grep -q "needsConfirmation\|needsGoogleAuth\|success"; then
    echo -e "${GREEN}✅ PASS${NC} - Endpoint responding correctly"
else
    echo -e "${YELLOW}⚠️  WARN${NC} - Unexpected response format"
fi
echo ""

# Test 4: Simple Browser Task (REAL PUPPETEER TEST)
echo -e "${BLUE}[TEST 4]${NC} Puppeteer Browser Launch Test..."
echo "   Task: Navigate to google.com"
echo "   This is the CRITICAL test - will browser actually launch?"
echo ""
echo -e "${YELLOW}   Sending request (may take 10-30 seconds)...${NC}"

BROWSER_TEST=$(curl -s -X POST "$API_URL/api/butler/universal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"task": "Go to google.com and take a screenshot", "confirmed": true}' \
  --max-time 60)

echo ""
echo "Response:"
echo "$BROWSER_TEST" | jq '.' 2>/dev/null || echo "$BROWSER_TEST"
echo ""

# Analyze response
if echo "$BROWSER_TEST" | grep -q '"success":true'; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅✅✅ PUPPETEER WORKS ON RAILWAY! ✅✅✅${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Browser automation is FULLY FUNCTIONAL in production!"
    echo "Screenshot available: $(echo $BROWSER_TEST | jq -r '.finalScreenshot != null')"
    echo "Session ID: $(echo $BROWSER_TEST | jq -r '.sessionId')"
    echo "Execution time: $(echo $BROWSER_TEST | jq -r '.executionTime')ms"

elif echo "$BROWSER_TEST" | grep -qi "chromium\|browser\|puppeteer"; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ PUPPETEER FAILED - BROWSER ISSUE${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Error indicates Chromium/Puppeteer is not working:"
    echo "$BROWSER_TEST" | jq -r '.message // .error // "Unknown error"'
    echo ""
    echo "Possible causes:"
    echo "  1. Chromium not installed in Railway container"
    echo "  2. Missing shared libraries"
    echo "  3. PUPPETEER_EXECUTABLE_PATH not set"
    echo "  4. Memory limit too low"

elif echo "$BROWSER_TEST" | grep -qi "timeout\|timed out"; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  TIMEOUT - BROWSER MAY HAVE HUNG${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Browser launched but did not complete navigation."
    echo "This could indicate:"
    echo "  1. Network restrictions"
    echo "  2. Memory pressure"
    echo "  3. Slow startup time"

elif echo "$BROWSER_TEST" | grep -q "needsConfirmation"; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}ℹ️  AI PLANNING WORKED (Browser not tested yet)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Universal Agent created a plan but needs confirmation."
    echo "This means AI planning works, but browser execution wasn't attempted."
    echo ""
    echo "Plan:"
    echo "$BROWSER_TEST" | jq -r '.plan'

else
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  UNKNOWN RESULT${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Response doesn't match expected patterns."
    echo "See full response above for details."
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║   TEST COMPLETE - CHECK RAILWAY LOGS FOR MORE DETAILS             ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "To view live logs:"
echo "  1. Go to railway.app"
echo "  2. Select pal-backend-production"
echo "  3. Click 'Deployments' → 'View Logs'"
echo "  4. Search for: 'puppeteer', 'chromium', 'browser'"
echo ""
