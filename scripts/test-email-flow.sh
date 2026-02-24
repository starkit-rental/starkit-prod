#!/bin/bash

# Test script for two-stage email flow
# Usage: ./scripts/test-email-flow.sh [email] [type]
# Types: received, confirmed

EMAIL=${1:-"starkit.rental@gmail.com"}
TYPE=${2:-"received"}
API_URL=${3:-"http://localhost:3000"}

echo "🧪 Testing Email Flow - Starkit"
echo "================================"
echo "Email: $EMAIL"
echo "Type: $TYPE"
echo "API URL: $API_URL"
echo ""

if [ "$TYPE" == "received" ]; then
  echo "📧 Sending ORDER RECEIVED email (no PDF)..."
  curl -X POST "$API_URL/api/test-email" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"received\",
      \"email\": \"$EMAIL\",
      \"orderNumber\": \"SK-2024-TEST-$(date +%s)\",
      \"customerName\": \"Jan Kowalski\",
      \"startDate\": \"15.03.2024\",
      \"endDate\": \"22.03.2024\",
      \"totalAmount\": \"1060\"
    }" | jq '.'
elif [ "$TYPE" == "confirmed" ]; then
  echo "📧 Sending ORDER CONFIRMED email (with PDF)..."
  curl -X POST "$API_URL/api/test-email" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"confirmed\",
      \"email\": \"$EMAIL\",
      \"orderNumber\": \"SK-2024-TEST-$(date +%s)\",
      \"customerName\": \"Jan Kowalski\",
      \"customerPhone\": \"+48 123 456 789\",
      \"startDate\": \"15.03.2024\",
      \"endDate\": \"22.03.2024\",
      \"inpostPointId\": \"KRA010\",
      \"inpostPointAddress\": \"ul. Floriańska 1, 31-019 Kraków\",
      \"rentalPrice\": \"560\",
      \"deposit\": \"500\",
      \"totalAmount\": \"1060\"
    }" | jq '.'
else
  echo "❌ Invalid type. Use 'received' or 'confirmed'"
  exit 1
fi

echo ""
echo "✅ Request sent! Check your inbox at $EMAIL"
