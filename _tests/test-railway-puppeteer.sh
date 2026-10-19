#!/bin/bash

# RAILWAY PUPPETEER TEST SCRIPT
# Tests if Chromium can launch on Railway production

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU"
BACKEND="https://pal-backend-production.up.railway.app"

echo "================================================================================"
echo "RAILWAY PUPPETEER TEST - Can Chromium Launch on Production?"
echo "================================================================================"
echo "Backend: $BACKEND"
echo "================================================================================"
echo ""

echo "[TEST 1] POST /api/butler/universal - Screenshot Task"
echo "--------------------------------------------------------------------------------"
echo "Task: Navigate to https://example.com and take a screenshot"
echo ""
echo "Sending request with verbose output..."
echo ""

# Make the request with verbose output
curl -X POST "$BACKEND/api/butler/universal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "task": "Navigate to https://example.com and take a screenshot",
    "confirmed": true,
    "headless": true
  }' \
  -w "\n\n--- TIMING INFO ---\nHTTP Code: %{http_code}\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\n" \
  -v 2>&1 | tee /tmp/railway-test-output.txt

echo ""
echo "================================================================================"
echo "TEST COMPLETE"
echo "================================================================================"
echo "Full output saved to: /tmp/railway-test-output.txt"
echo ""
echo "ANALYSIS:"
echo "--------------------------------------------------------------------------------"

# Check if response contains success indicators
if grep -q '"success":true' /tmp/railway-test-output.txt; then
    echo "✅ SUCCESS: Task executed successfully"
    if grep -q '"finalScreenshot"' /tmp/railway-test-output.txt; then
        echo "✅ SUCCESS: Screenshot data received"
        echo ""
        echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
        echo "PUPPETEER IS WORKING ON RAILWAY!"
        echo "Chromium launched successfully and took a screenshot."
        echo "🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉"
    fi
elif grep -q '"success":false' /tmp/railway-test-output.txt; then
    echo "❌ FAILED: Task failed"
    echo ""
    if grep -q -i 'launch\|chrome\|browser\|puppeteer' /tmp/railway-test-output.txt; then
        echo "❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌"
        echo "BROWSER LAUNCH FAILURE DETECTED"
        echo "❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌"
        echo ""
        echo "Puppeteer cannot launch Chromium on Railway."
        echo ""
        echo "RECOMMENDED ACTIONS:"
        echo "1. Check Railway deployment logs"
        echo "2. Verify Dockerfile built successfully"
        echo "3. Check Railway build configuration (should use DOCKERFILE)"
        echo "4. SSH into Railway and run: which chromium"
    fi
    echo ""
    echo "Error details:"
    grep -o '"error":"[^"]*"' /tmp/railway-test-output.txt || echo "No error message found"
elif grep -q '401' /tmp/railway-test-output.txt; then
    echo "❌ AUTHENTICATION FAILED: Token expired or invalid"
elif grep -q '500' /tmp/railway-test-output.txt; then
    echo "❌ SERVER ERROR: Backend crashed"
else
    echo "⚠️  UNKNOWN RESULT: Check output above"
fi

echo "================================================================================"
echo ""

# Optionally test the simpler execute endpoint
echo ""
echo "[TEST 2] POST /api/butler/execute - Alternative Endpoint"
echo "--------------------------------------------------------------------------------"

curl -X POST "$BACKEND/api/butler/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "goal": "Take a screenshot of google.com",
    "confirmed": true
  }' \
  -w "\n\nHTTP Code: %{http_code}\n" \
  -s | head -100

echo ""
echo "================================================================================"
echo "All tests complete."
echo "================================================================================"
