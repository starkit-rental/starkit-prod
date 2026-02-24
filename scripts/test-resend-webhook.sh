#!/bin/bash

# Test script for Resend webhook (wynajem@starkit.pl)
# Usage: ./scripts/test-resend-webhook.sh [email]

EMAIL=${1:-"starkit.rental@gmail.com"}
API_URL=${2:-"http://localhost:3000"}

echo "🧪 Testing Resend Email Webhook"
echo "================================"
echo "Email: $EMAIL"
echo "API URL: $API_URL"
echo ""

curl -X POST "$API_URL/api/webhooks/resend-test" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"orderNumber\": \"SK-2024-TEST-$(date +%s)\",
    \"customerName\": \"Jan Kowalski\",
    \"startDate\": \"15.03.2024\",
    \"endDate\": \"22.03.2024\",
    \"inpostPointId\": \"KRA010\",
    \"inpostPointAddress\": \"ul. Floriańska 1, 31-019 Kraków\",
    \"depositAmount\": \"500\",
    \"totalAmount\": \"1060\"
  }" | jq '.'

echo ""
echo "✅ Request sent! Check your inbox at $EMAIL"
