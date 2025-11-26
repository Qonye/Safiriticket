# Pesapal API 3.0 Test Script (PowerShell)
# Sandbox Credentials: Kenyan Merchant

# Configuration
$baseUrl = "http://cybqa.pesapal.com/pesapalv3"
$consumerKey = "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"
$consumerSecret = "osGQ364R49cXKeOYSpaOnT++rHs="
$ipnUrl = "https://your-backend.com/api/payments/pesapal-webhook"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Pesapal API 3.0 - Sandbox Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Step 1: Getting Access Token ===" -ForegroundColor Green
$tokenBody = @{
    consumer_key = $consumerKey
    consumer_secret = $consumerSecret
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-RestMethod -Uri "$baseUrl/api/Auth/RequestToken" `
        -Method Post `
        -ContentType "application/json" `
        -Body $tokenBody
    
    $token = $tokenResponse.token
    if ($null -eq $token -or $token -eq "") {
        Write-Host "❌ Error: Invalid response" -ForegroundColor Red
        Write-Host "Response: $($tokenResponse | ConvertTo-Json)"
        exit 1
    }
    
    Write-Host "✅ Token received: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error: Failed to get token" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "=== Step 2: Registering IPN URL ===" -ForegroundColor Green
$ipnBody = @{
    url = $ipnUrl
    ipn_notification_type = "GET"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
}

try {
    $ipnResponse = Invoke-RestMethod -Uri "$baseUrl/api/URLSetup/RegisterIPN" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $ipnBody
    
    $ipnId = $ipnResponse.ipn_id
    if ($null -eq $ipnId -or $ipnId -eq "") {
        Write-Host "⚠️  Warning: IPN registration may have failed" -ForegroundColor Yellow
        Write-Host "Response: $($ipnResponse | ConvertTo-Json)"
        Write-Host "Continuing with empty IPN_ID..."
        $ipnId = ""
    } else {
        Write-Host "✅ IPN ID: $ipnId" -ForegroundColor Yellow
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  Warning: IPN registration failed" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    $ipnId = ""
    Write-Host ""
}

Write-Host "=== Step 3: Creating Payment Order ===" -ForegroundColor Green
$orderId = "invoice_$(Get-Date -Format 'yyyyMMddHHmmss')"
$orderBody = @{
    id = $orderId
    currency = "KES"
    amount = 1000.00
    description = "Test Payment - Invoice $orderId"
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

try {
    $orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/SubmitOrderRequest" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $headers `
        -Body $orderBody
    
    $trackingId = $orderResponse.order_tracking_id
    $redirectUrl = $orderResponse.redirect_url
    
    if ($null -eq $trackingId -or $trackingId -eq "") {
        Write-Host "❌ Error: Failed to create order" -ForegroundColor Red
        Write-Host "Response: $($orderResponse | ConvertTo-Json)"
        exit 1
    }
    
    Write-Host "✅ Order created successfully!" -ForegroundColor Yellow
    Write-Host "   Order ID: $orderId"
    Write-Host "   Tracking ID: $trackingId"
    Write-Host "   Redirect URL: $redirectUrl"
    Write-Host ""
} catch {
    Write-Host "❌ Error: Failed to create order" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host "=== Step 4: Checking Transaction Status ===" -ForegroundColor Green
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/Transactions/GetTransactionStatus?orderTrackingId=$trackingId" `
        -Method Get `
        -Headers $headers
    
    Write-Host "Transaction Status:" -ForegroundColor Yellow
    $statusResponse | ConvertTo-Json -Depth 10
    Write-Host ""
} catch {
    Write-Host "⚠️  Warning: Could not get transaction status" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open the redirect URL in your browser:"
Write-Host "   $redirectUrl" -ForegroundColor Cyan
Write-Host "2. Complete a test payment"
Write-Host "3. Check your webhook endpoint for IPN notifications"
Write-Host ""

