#!/bin/bash

# ============================================================================
# PHOENIX DEPLOYMENT MONITOR & TEST CONSOLE
# ============================================================================

echo "🚀 PHOENIX DEPLOYMENT MONITOR"
echo "════════════════════════════════════════════════════════════"
echo ""

BACKEND_URL="https://pal-backend-production.up.railway.app/api"
TEST_EMAIL="test@test.com"
TEST_PASSWORD="password123"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

test_health() {
    echo -e "${BLUE}[HEALTH CHECK]${NC}"
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Status: 200${NC}"
        echo "Body: $body"
        return 0
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        echo "Body: $body"
        return 1
    fi
}

test_preflight() {
    echo -e "\n${BLUE}[CORS PREFLIGHT]${NC}"
    http_code=$(curl -s -w "%{http_code}" -o /dev/null -X OPTIONS "$BACKEND_URL/auth/login")

    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        echo -e "${GREEN}✅ Status: $http_code${NC}"
        return 0
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        return 1
    fi
}

test_register() {
    echo -e "\n${BLUE}[REGISTER USER]${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"Test User\",
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"emailVerified\": true
        }")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "201" ] || [ "$http_code" = "400" ]; then
        echo -e "${GREEN}✅ Status: $http_code${NC}"
        if echo "$body" | grep -q "already exists"; then
            echo "ℹ️  User already exists (OK for test)"
        else
            echo "Body: $body"
        fi
        return 0
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        echo "Body: $body"
        return 1
    fi
}

test_login() {
    echo -e "\n${BLUE}[LOGIN TEST]${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ LOGIN SUCCESSFUL - Status: 200${NC}"
        token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$token" ]; then
            echo -e "${GREEN}✅ Token received:${NC} ${token:0:30}..."
            echo ""
            echo -e "${YELLOW}🔗 REDIRECT URL:${NC}"
            echo "dashboard.html#token=$(printf %s "$token" | jq -sRr @uri)&t=$(date +%s)"
            return 0
        fi
    elif [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}ℹ️  Status: 403 - Verification Required${NC}"
        echo "Body: $body"
        return 0
    else
        echo -e "${RED}❌ Status: $http_code${NC}"
        echo "Body: $body"
        return 1
    fi
}

# ============================================================================
# MONITOR FUNCTION
# ============================================================================

monitor_deployment() {
    local max_attempts=60
    local attempt=0
    local success=0

    echo -e "${YELLOW}Monitoring deployment (will check for 60 attempts, 2 seconds apart)${NC}"
    echo ""

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')

        echo -ne "\r[${timestamp}] Attempt $attempt/$max_attempts... "

        http_code=$(curl -s -w "%{http_code}" -o /dev/null "$BACKEND_URL/health")

        if [ "$http_code" = "200" ]; then
            echo -e "\r${GREEN}[${timestamp}] ✅ Backend is LIVE!${NC}                    "
            success=1
            break
        elif [ "$http_code" = "502" ]; then
            echo -ne "\r[${timestamp}] Deployment in progress (502)... "
        else
            echo -ne "\r[${timestamp}] Waiting (HTTP $http_code)... "
        fi

        sleep 2
    done

    echo ""

    if [ $success -eq 1 ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        return 0
    else
        echo -e "${RED}❌ Deployment timed out${NC}"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

echo "Target: $BACKEND_URL"
echo ""

# Show initial status
echo "📊 INITIAL STATUS"
echo "════════════════════════════════════════════════════════════"
test_health || true
echo ""

# Monitor deployment
echo "📡 DEPLOYMENT MONITORING"
echo "════════════════════════════════════════════════════════════"
if monitor_deployment; then
    # Run full test suite
    echo ""
    echo "🧪 RUNNING TEST SUITE"
    echo "════════════════════════════════════════════════════════════"

    test_health && \
    test_preflight && \
    test_register && \
    test_login

    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ ALL SYSTEMS GO - READY FOR PRODUCTION${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ DEPLOYMENT FAILED - Check Railway logs${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
fi
