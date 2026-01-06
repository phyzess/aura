#!/bin/bash

# Test script for alerts API
# Usage: ./test-alerts.sh <API_URL> <SESSION_COOKIE> <ADMIN_TOKEN>

API_URL=${1:-"http://localhost:8787"}
SESSION_COOKIE=${2:-""}
ADMIN_TOKEN=${3:-""}

echo "Testing Alerts API"
echo "=================="
echo ""

# Test 1: Send alerts (requires authentication)
if [ -n "$SESSION_COOKIE" ]; then
  echo "Test 1: Sending test alerts..."
  curl -X POST "$API_URL/api/app/alerts" \
    -H "Content-Type: application/json" \
    -H "Cookie: $SESSION_COOKIE" \
    -d '{
      "alerts": [
        {
          "level": "info",
          "type": "test",
          "message": "Test info alert",
          "metrics": {"test": true}
        },
        {
          "level": "warning",
          "type": "high_conflict_rate",
          "message": "Test warning alert",
          "metrics": {"conflicts": 55}
        },
        {
          "level": "error",
          "type": "clock_skew",
          "message": "Test error alert",
          "metrics": {"serverWins": 100, "localWins": 0}
        }
      ]
    }'
  echo ""
  echo ""
else
  echo "Test 1: Skipped (no session cookie provided)"
  echo ""
fi

# Test 2: View alerts (requires admin token)
if [ -n "$ADMIN_TOKEN" ]; then
  echo "Test 2: Viewing all alerts..."
  curl -H "X-Admin-Token: $ADMIN_TOKEN" \
    "$API_URL/api/admin/alerts?limit=10"
  echo ""
  echo ""

  echo "Test 3: Viewing error alerts only..."
  curl -H "X-Admin-Token: $ADMIN_TOKEN" \
    "$API_URL/api/admin/alerts?level=error&limit=5"
  echo ""
  echo ""

  echo "Test 4: Viewing sync metrics..."
  curl -H "X-Admin-Token: $ADMIN_TOKEN" \
    "$API_URL/api/admin/metrics?limit=5"
  echo ""
  echo ""
else
  echo "Test 2-4: Skipped (no admin token provided)"
  echo ""
fi

echo "Tests completed!"
echo ""
echo "To run all tests, provide:"
echo "  ./test-alerts.sh <API_URL> <SESSION_COOKIE> <ADMIN_TOKEN>"
echo ""
echo "Example:"
echo "  ./test-alerts.sh http://localhost:8787 'better-auth.session_token=xxx' 'your-secret'"

