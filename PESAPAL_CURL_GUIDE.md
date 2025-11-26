# Pesapal API 3.0 - cURL Testing Guide

This guide provides cURL commands to test all Pesapal API endpoints without using Postman.

---

## Prerequisites

1. **Sandbox Credentials** (get from: https://developer.pesapal.com/api3-demo-keys.txt)
   - Consumer Key
   - Consumer Secret

2. **Base URLs**:
   - Sandbox: `http://cybqa.pesapal.com/pesapalv3`
   - Production: `http://pay.pesapal.com/v3`

---

## Step 1: Get Access Token

First, authenticate and get a Bearer token.

### cURL Command:

```bash
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "consumer_key": "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW",
    "consumer_secret": "osGQ364R49cXKeOYSpaOnT++rHs="
  }'
```

### Expected Response:

```json
{
  "token": "your-bearer-token-here",
  "expiryDate": "2025-01-15T10:30:00Z"
}
```

### Save Token:

```bash
# Save token to variable (Linux/Mac)
TOKEN=$(curl -s -X POST "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "consumer_key": "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW",
    "consumer_secret": "osGQ364R49cXKeOYSpaOnT++rHs="
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

**Note**: For Windows PowerShell, use different syntax (see Windows section below).

---

## Step 2: Register IPN URL

Register your webhook URL to receive payment notifications.

### cURL Command:

```bash
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://your-backend.com/api/payments/pesapal-webhook",
    "ipn_notification_type": "GET"
  }'
```

### Expected Response:

```json
{
  "url": "https://your-backend.com/api/payments/pesapal-webhook",
  "created_date": "2025-01-10T08:00:00Z",
  "ipn_id": "ipn-id-returned-here"
}
```

### Save IPN ID:

```bash
IPN_ID=$(curl -s -X POST "http://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://your-backend.com/api/payments/pesapal-webhook",
    "ipn_notification_type": "GET"
  }' | jq -r '.ipn_id')

echo "IPN ID: $IPN_ID"
```

---

## Step 3: Submit Order Request (Create Payment)

Create a payment order and get the redirect URL.

### cURL Command:

```bash
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "id": "invoice_12345",
    "currency": "KES",
    "amount": 1000.00,
    "description": "Payment for Invoice INV-12345",
    "callback_url": "https://admin.safiritickets.com/payment-success",
    "notification_id": "'$IPN_ID'",
    "billing_address": {
      "email_address": "customer@email.com",
      "phone_number": "254712345678",
      "country_code": "KE",
      "first_name": "John",
      "middle_name": "",
      "last_name": "Doe",
      "line_1": "Nairobi",
      "line_2": "",
      "city": "Nairobi",
      "state": "",
      "postal_code": "",
      "zip_code": ""
    }
  }'
```

### Expected Response:

```json
{
  "order_tracking_id": "pesapal-tracking-id-abc123",
  "merchant_reference": "invoice_12345",
  "redirect_url": "https://pay.pesapal.com/iframe/..."
}
```

### Save Tracking ID:

```bash
TRACKING_ID=$(curl -s -X POST "http://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "id": "invoice_12345",
    "currency": "KES",
    "amount": 1000.00,
    "description": "Payment for Invoice INV-12345",
    "callback_url": "https://admin.safiritickets.com/payment-success",
    "notification_id": "'$IPN_ID'",
    "billing_address": {
      "email_address": "customer@email.com",
      "phone_number": "254712345678",
      "country_code": "KE",
      "first_name": "John",
      "last_name": "Doe",
      "line_1": "Nairobi",
      "city": "Nairobi"
    }
  }' | jq -r '.order_tracking_id')

echo "Tracking ID: $TRACKING_ID"
```

---

## Step 4: Get Transaction Status

Check the status of a payment transaction.

### cURL Command:

```bash
curl -X GET "http://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=$TRACKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Expected Response:

```json
{
  "payment_method": "Card",
  "amount": 1000.00,
  "created_date": "2025-01-10T08:00:00Z",
  "confirmation_code": "ABC123",
  "payment_status_description": "Completed",
  "description": "Payment for Invoice INV-12345",
  "message": "Transaction successful",
  "payment_account": "411111******1111",
  "call_back_url": "https://admin.safiritickets.com/payment-success",
  "status_code": 1,
  "merchant_reference": "invoice_12345",
  "payment_status_code": "1",
  "currency": "KES"
}
```

---

## Complete Test Script (Linux/Mac)

Save this as `test-pesapal.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://cybqa.pesapal.com/pesapalv3"
CONSUMER_KEY="qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"
CONSUMER_SECRET="osGQ364R49cXKeOYSpaOnT++rHs="
IPN_URL="https://your-backend.com/api/payments/pesapal-webhook"

echo "=== Step 1: Getting Access Token ==="
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"consumer_key\": \"$CONSUMER_KEY\",
    \"consumer_secret\": \"$CONSUMER_SECRET\"
  }")

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
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
echo "IPN ID: $IPN_ID"
echo ""

echo "=== Step 3: Creating Payment Order ==="
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/Transactions/SubmitOrderRequest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"id\": \"invoice_$(date +%s)\",
    \"currency\": \"KES\",
    \"amount\": 1000.00,
    \"description\": \"Test Payment\",
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
echo "Tracking ID: $TRACKING_ID"
echo "Redirect URL: $REDIRECT_URL"
echo ""

echo "=== Step 4: Checking Transaction Status ==="
STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/Transactions/GetTransactionStatus?orderTrackingId=$TRACKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")

echo "$STATUS_RESPONSE" | jq '.'
```

**Make it executable**:
```bash
chmod +x test-pesapal.sh
./test-pesapal.sh
```

---

## Windows PowerShell Commands

### Step 1: Get Access Token

```powershell
$baseUrl = "http://cybqa.pesapal.com/pesapalv3"
$consumerKey = "YOUR_CONSUMER_KEY"
$consumerSecret = "YOUR_CONSUMER_SECRET"

$body = @{
    consumer_key = $consumerKey
    consumer_secret = $consumerSecret
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/api/Auth/RequestToken" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$token = $response.token
Write-Host "Token: $token"
```

### Step 2: Register IPN URL

```powershell
$ipnUrl = "https://your-backend.com/api/payments/pesapal-webhook"

$ipnBody = @{
    url = $ipnUrl
    ipn_notification_type = "GET"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

$ipnResponse = Invoke-RestMethod -Uri "$baseUrl/api/URLSetup/RegisterIPN" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $ipnBody

$ipnId = $ipnResponse.ipn_id
Write-Host "IPN ID: $ipnId"
```

### Step 3: Submit Order Request

```powershell
$orderBody = @{
    id = "invoice_12345"
    currency = "KES"
    amount = 1000.00
    description = "Payment for Invoice INV-12345"
    callback_url = "https://admin.safiritickets.com/payment-success"
    notification_id = $ipnId
    billing_address = @{
        email_address = "customer@email.com"
        phone_number = "254712345678"
        country_code = "KE"
        first_name = "John"
        last_name = "Doe"
        line_1 = "Nairobi"
        city = "Nairobi"
    }
} | ConvertTo-Json -Depth 10

$orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/SubmitOrderRequest" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $orderBody

$trackingId = $orderResponse.order_tracking_id
$redirectUrl = $orderResponse.redirect_url
Write-Host "Tracking ID: $trackingId"
Write-Host "Redirect URL: $redirectUrl"
```

### Step 4: Get Transaction Status

```powershell
$statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/GetTransactionStatus?orderTrackingId=$trackingId" `
    -Method Get `
    -Headers $headers

$statusResponse | ConvertTo-Json -Depth 10
```

---

## Complete PowerShell Script

Save this as `test-pesapal.ps1`:

```powershell
# Configuration
$baseUrl = "http://cybqa.pesapal.com/pesapalv3"
$consumerKey = "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"
$consumerSecret = "osGQ364R49cXKeOYSpaOnT++rHs="
$ipnUrl = "https://your-backend.com/api/payments/pesapal-webhook"

Write-Host "=== Step 1: Getting Access Token ===" -ForegroundColor Green
$tokenBody = @{
    consumer_key = $consumerKey
    consumer_secret = $consumerSecret
} | ConvertTo-Json

$tokenResponse = Invoke-RestMethod -Uri "$baseUrl/api/Auth/RequestToken" `
    -Method Post `
    -ContentType "application/json" `
    -Body $tokenBody

$token = $tokenResponse.token
Write-Host "Token: $token" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Step 2: Registering IPN URL ===" -ForegroundColor Green
$ipnBody = @{
    url = $ipnUrl
    ipn_notification_type = "GET"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

$ipnResponse = Invoke-RestMethod -Uri "$baseUrl/api/URLSetup/RegisterIPN" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $ipnBody

$ipnId = $ipnResponse.ipn_id
Write-Host "IPN ID: $ipnId" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Step 3: Creating Payment Order ===" -ForegroundColor Green
$orderId = "invoice_$(Get-Date -Format 'yyyyMMddHHmmss')"
$orderBody = @{
    id = $orderId
    currency = "KES"
    amount = 1000.00
    description = "Test Payment"
    callback_url = "https://admin.safiritickets.com/payment-success"
    notification_id = $ipnId
    billing_address = @{
        email_address = "test@example.com"
        phone_number = "254712345678"
        country_code = "KE"
        first_name = "Test"
        last_name = "User"
        line_1 = "Nairobi"
        city = "Nairobi"
    }
} | ConvertTo-Json -Depth 10

$orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/SubmitOrderRequest" `
    -Method Post `
    -ContentType "application/json" `
    -Headers $headers `
    -Body $orderBody

$trackingId = $orderResponse.order_tracking_id
$redirectUrl = $orderResponse.redirect_url
Write-Host "Tracking ID: $trackingId" -ForegroundColor Yellow
Write-Host "Redirect URL: $redirectUrl" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Step 4: Checking Transaction Status ===" -ForegroundColor Green
$statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/GetTransactionStatus?orderTrackingId=$trackingId" `
    -Method Get `
    -Headers $headers

$statusResponse | ConvertTo-Json -Depth 10
```

**Run it**:
```powershell
.\test-pesapal.ps1
```

---

## Testing Individual Endpoints

### Test Authentication Only:

```bash
# Linux/Mac
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -d '{"consumer_key":"qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW","consumer_secret":"osGQ364R49cXKeOYSpaOnT++rHs="}' | jq

# Windows PowerShell
$body = @{consumer_key="qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW";consumer_secret="osGQ364R49cXKeOYSpaOnT++rHs="} | ConvertTo-Json
Invoke-RestMethod -Uri "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" -Method Post -ContentType "application/json" -Body $body
```

### Test IPN Registration Only:

```bash
# Linux/Mac (after getting token)
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-backend.com/api/payments/pesapal-webhook","ipn_notification_type":"GET"}' | jq
```

---

## Error Handling

### Check for Errors:

```bash
# Add -v flag for verbose output
curl -v -X POST "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -d '{"consumer_key":"qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW","consumer_secret":"osGQ364R49cXKeOYSpaOnT++rHs="}'
```

### Common Errors:

1. **401 Unauthorized**: Invalid credentials or expired token
2. **400 Bad Request**: Missing or invalid parameters
3. **500 Internal Server Error**: Pesapal server issue

---

## Tips

1. **Use jq for JSON formatting** (Linux/Mac):
   ```bash
   curl ... | jq '.'
   ```

2. **Save responses to files**:
   ```bash
   curl ... > response.json
   ```

3. **Use environment variables**:
   ```bash
   export PESAPAL_CONSUMER_KEY="your-key"
   export PESAPAL_CONSUMER_SECRET="your-secret"
   ```

4. **Test with different currencies**:
   - Change `"currency": "KES"` to `"USD"`, `"EUR"`, or `"GBP"`

5. **Test with different amounts**:
   - Try small amounts first (e.g., 10.00)
   - Test edge cases (0.01, 999999.99)

---

## Next Steps

1. ✅ **Credentials Updated** - Your sandbox credentials are already configured in all scripts
2. Update the IPN URL to your actual webhook endpoint (currently set to `https://your-backend.com/api/payments/pesapal-webhook`)
3. Run the test script
4. Check the redirect URL in a browser to test the payment flow
5. Monitor your webhook endpoint for IPN notifications

---

## Quick Test Command

**Test authentication right now** (copy and paste):

```bash
# Linux/Mac
curl -X POST "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" \
  -H "Content-Type: application/json" \
  -d '{"consumer_key":"qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW","consumer_secret":"osGQ364R49cXKeOYSpaOnT++rHs="}' | jq

# Windows PowerShell
$body = @{consumer_key="qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW";consumer_secret="osGQ364R49cXKeOYSpaOnT++rHs="} | ConvertTo-Json
Invoke-RestMethod -Uri "http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken" -Method Post -ContentType "application/json" -Body $body
```

**All scripts are ready to use with your credentials!** 🚀

