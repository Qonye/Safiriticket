#!/bin/bash

# Pesapal API 3.0 Test Script
# Sandbox Credentials: Kenyan Merchant

# Configuration
BASE_URL="http://cybqa.pesapal.com/pesapalv3"
CONSUMER_KEY="qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"
CONSUMER_SECRET="osGQ364R49cXKeOYSpaOnT++rHs="
IPN_URL="https://your-backend.com/api/payments/pesapal-webhook"

echo "=========================================="
echo "Pesapal API 3.0 - Sandbox Test"
echo "=========================================="
echo ""

echo "=== Step 1: Getting Access Token ==="
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"consumer_key\": \"$CONSUMER_KEY\",
    \"consumer_secret\": \"$CONSUMER_SECRET\"
  }")

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to get token"
  exit 1
fi

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error: Invalid response"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:20}..."
echo ""

echo "=== Step 2: Registering IPN URL ==="
IPN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/URLSetup/RegisterIPN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"url\": \"$IPN_URL\",
    \"ipn_notification_type\": \"GET\"
  }")

IPN_ID=$(echo $IPN_RESPONSE | jq -r '.ipn_id')
if [ "$IPN_ID" == "null" ] || [ -z "$IPN_ID" ]; then
  echo "⚠️  Warning: IPN registration may have failed"
  echo "Response: $IPN_RESPONSE"
  echo "Continuing with empty IPN_ID..."
  IPN_ID=""
else
  echo "✅ IPN ID: $IPN_ID"
fi
echo ""

echo "=== Step 3: Creating Payment Order ==="
ORDER_ID="invoice_$(date +%s)"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/Transactions/SubmitOrderRequest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"id\": \"$ORDER_ID\",
    \"currency\": \"KES\",
    \"amount\": 1000.00,
    \"description\": \"Test Payment - Invoice $ORDER_ID\",
    \"callback_url\": \"https://admin.safiritickets.com/payment-success\",
    \"notification_id\": \"$IPN_ID\",
    \"billing_address\": {
      \"email_address\": \"test@example.com\",
      \"phone_number\": \"254712345678\",
      \"country_code\": \"KE\",
      \"first_name\": \"Test\",
      \"last_name\": \"User\",
      \"line_1\": \"Nairobi\",
      \"city\": \"Nairobi\"
    }
  }")

TRACKING_ID=$(echo $ORDER_RESPONSE | jq -r '.order_tracking_id')
REDIRECT_URL=$(echo $ORDER_RESPONSE | jq -r '.redirect_url')

if [ "$TRACKING_ID" == "null" ] || [ -z "$TRACKING_ID" ]; then
  echo "❌ Error: Failed to create order"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo "✅ Order created successfully!"
echo "   Order ID: $ORDER_ID"
echo "   Tracking ID: $TRACKING_ID"
echo "   Redirect URL: $REDIRECT_URL"
echo ""

echo "=== Step 4: Checking Transaction Status ==="
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/Transactions/GetTransactionStatus?orderTrackingId=$TRACKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "Transaction Status:"
echo "$STATUS_RESPONSE" | jq '.'
echo ""

echo "=========================================="
echo "✅ Test Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open the redirect URL in your browser:"
echo "   $REDIRECT_URL"
echo "2. Complete a test payment"
echo "3. Check your webhook endpoint for IPN notifications"
echo ""

