# Pesapal Testing Guide - Test Cards & Callbacks

## Test Card Details for Sandbox

### Visa Test Card
- **Card Number**: `4111 1111 1111 1111`
- **Expiry Date**: Any future date (e.g., `12/2025`, `01/2026`)
- **CVV**: Any 3 digits (e.g., `123`, `456`, `789`)
- **Cardholder Name**: Any name (e.g., `Test User`)

### Mastercard Test Card
- **Card Number**: `5555 5555 5555 4444`
- **Expiry Date**: Any future date
- **CVV**: Any 3 digits
- **Cardholder Name**: Any name

### Test Card Examples:
```
Card 1 (Visa):
Number: 4111 1111 1111 1111
Expiry: 12/2025
CVV: 123
Name: Test User

Card 2 (Mastercard):
Number: 5555 5555 5555 4444
Expiry: 06/2026
CVV: 456
Name: John Doe
```

---

## Testing Payment Flow

### Step 1: Create Test Invoice
1. Create an invoice in your app
2. Payment link should be generated automatically
3. Copy the payment link

### Step 2: Complete Test Payment
1. Open the payment link in browser
2. Select "Card" payment method
3. Enter test card details:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., `12/2025`)
   - CVV: Any 3 digits (e.g., `123`)
   - Name: Any name
4. Complete the payment

### Step 3: Verify Callback/Webhook
1. Check your Railway logs for webhook call
2. Verify invoice status updated to "Paid"
3. Check payment record created in database

---

## Testing Webhooks/Callbacks

### What to Expect

When a payment is completed, Pesapal will:

1. **Send IPN to your webhook endpoint**:
   ```
   GET https://safiriticket.up.railway.app/api/payments/pesapal-webhook?OrderTrackingId=xxx&OrderMerchantReference=invoice_xxx&OrderNotificationType=CHANGE
   ```

2. **Your webhook handler will**:
   - Receive the notification
   - Call `GetTransactionStatus` to verify
   - Update payment status
   - Update invoice status

### Monitor Webhooks

**Check Railway Logs**:
```bash
# In Railway dashboard, check logs for:
- "Processing Pesapal webhook"
- "Transaction Status:"
- "Payment status updated"
```

**Test Webhook Manually**:
```bash
# Simulate a webhook call
curl "https://safiriticket.up.railway.app/api/payments/pesapal-webhook?OrderTrackingId=test123&OrderMerchantReference=invoice_test&OrderNotificationType=CHANGE"
```

---

## Test Scenarios

### Scenario 1: Successful Card Payment
1. Create invoice (KES 1000)
2. Use test card: `4111 1111 1111 1111`
3. Complete payment
4. **Expected**:
   - Webhook received
   - Payment status: `COMPLETED`
   - Invoice status: `Paid`
   - Payment record created

### Scenario 2: Failed Payment
1. Create invoice
2. Start payment but cancel/decline
3. **Expected**:
   - Webhook may or may not be sent
   - Payment status: `FAILED` or `PENDING`
   - Invoice remains unpaid

### Scenario 3: Partial Payment
1. Create invoice (KES 1000)
2. Make payment for KES 500
3. **Expected**:
   - Webhook received
   - Payment status: `COMPLETED`
   - Invoice status: `Partially Paid`
   - Invoice `paidAmount`: 500

---

## Testing M-PESA (If Available)

For M-PESA testing in sandbox:
- Use test phone numbers provided by Pesapal
- Check sandbox documentation for test numbers
- Test M-PESA payment flow

---

## Debugging Tips

### 1. Check Webhook Endpoint
```bash
# Test if endpoint is accessible
curl https://safiriticket.up.railway.app/api/payments/pesapal-webhook
```

### 2. Check Railway Logs
- Look for "Processing Pesapal webhook"
- Check for errors
- Verify transaction status calls

### 3. Verify IPN Registration
- Confirm IPN ID is set: `7c577cd9-8784-4e6c-9e05-db0afb22317b`
- Check IPN URL is correct
- Verify in Pesapal dashboard

### 4. Test Transaction Status API
```bash
# Get transaction status manually
curl -X GET "http://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=YOUR_TRACKING_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Test Card Numbers

### Visa
- `4111 1111 1111 1111` ✅ (Most common)
- `4000 0000 0000 0002` (Decline)
- `4000 0000 0000 9995` (Insufficient funds)

### Mastercard
- `5555 5555 5555 4444` ✅
- `5105 1051 0510 5100` ✅

### Important Notes:
- **Expiry**: Must be a future date
- **CVV**: Any 3 digits work
- **Name**: Any name works
- **Amount**: Any amount works in sandbox

---

## Expected Webhook Flow

```
1. Customer completes payment on Pesapal
   ↓
2. Pesapal sends IPN to your webhook:
   GET /api/payments/pesapal-webhook?OrderTrackingId=xxx&...
   ↓
3. Your webhook handler:
   - Receives notification
   - Calls GetTransactionStatus to verify
   - Updates payment record
   - Updates invoice status
   ↓
4. Customer redirected to callback URL
   ↓
5. Invoice shows as "Paid" in your app
```

---

## Quick Test Checklist

- [ ] Create test invoice
- [ ] Payment link generated
- [ ] Open payment link
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Complete payment
- [ ] Check webhook received (Railway logs)
- [ ] Verify invoice status updated
- [ ] Verify payment record created
- [ ] Check callback URL redirect works

---

## Troubleshooting

### Webhook Not Received?
1. Check IPN URL is registered correctly
2. Verify endpoint is publicly accessible
3. Check Railway logs for errors
4. Verify IPN ID is correct in `.env`

### Payment Link Not Working?
1. Check Pesapal credentials are correct
2. Verify token generation works
3. Check IPN ID is set
4. Review Railway logs for errors

### Invoice Not Updating?
1. Check webhook is being received
2. Verify `GetTransactionStatus` is working
3. Check database connection
4. Review payment processing logic

---

**Test Card Summary**: Use `4111 1111 1111 1111` with any future expiry and any 3-digit CVV for testing! 🎯

