# Pesapal Migration Guide - From IntaSend to Pesapal

## Executive Summary

This document provides a comprehensive analysis of your Safiriticket application and a detailed guide for migrating from IntaSend to Pesapal payment gateway.

---

## Current IntaSend Implementation Analysis

### 1. **Backend Integration (Node.js/Express)**

Your app currently uses IntaSend in the following ways:

#### Files Affected:
- `src/services/intasend.js` - Main IntaSend service
- `src/routes/payments.js` - Payment routes
- `src/models/Payment.js` - Payment data model
- `src/server.js` - Server configuration
- `src/package.json` - Dependencies

#### Current Features:
1. **Payment Link Generation** (`generatePaymentLink`)
   - Creates checkout sessions for invoices
   - Stores payment records in MongoDB
   - Supports multiple currencies (USD, EUR, GBP, KES)
   - Auto-generates payment links when invoices are created

2. **Webhook Processing** (`processWebhook`)
   - Receives payment status updates from IntaSend
   - Updates payment and invoice status
   - Handles various payment states (PENDING, COMPLETE, FAILED)
   - Supports multiple payment providers (M-PESA, CARD, etc.)

3. **Payment Link Regeneration** (`regeneratePaymentLink`)
   - Creates new payment links when invoice amounts change

#### Current Payment Flow:
```
1. Invoice Created → Generate IntaSend Payment Link
2. Customer Pays → IntaSend Webhook Triggered
3. Webhook Processed → Payment & Invoice Updated
4. Invoice Marked as Paid/Partially Paid
```

### 2. **Frontend Integration (Vanilla JavaScript)**

- `vanilla-frontend/modules/invoices.js` - Invoice management UI
- Displays payment links to users
- Button to manually generate payment links for existing invoices
- Shows payment status in invoice list

---

## Pesapal Documentation & Resources

### Official Documentation:
- **Main Docs**: https://developer.pesapal.com/docs
- **API Reference**: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
- **Developer Community**: https://developer.pesapal.com/

### Key Endpoints:
- **Sandbox**: `https://cybqa.pesapal.com/pesapalv3/`
- **Production**: `https://pay.pesapal.com/v3/`

### Required Credentials:
- Consumer Key
- Consumer Secret
- IPN (Instant Payment Notification) URL

---

## Pesapal API Overview

### Authentication
Pesapal uses OAuth-based authentication:
1. Request token using Consumer Key & Secret
2. Receive Bearer Token
3. Use token in subsequent API calls
4. Token expires after a set period (need to refresh)

### Key API Endpoints:

#### 1. **Get Access Token**
```
POST /api/Auth/RequestToken
Body: {
  "consumer_key": "your-key",
  "consumer_secret": "your-secret"
}
Response: {
  "token": "bearer-token",
  "expiryDate": "timestamp"
}
```

#### 2. **Register IPN URL**
```
POST /api/URLSetup/RegisterIPN
Headers: { Authorization: "Bearer token" }
Body: {
  "url": "https://your-backend.com/api/payments/pesapal-webhook",
  "ipn_notification_type": "GET" or "POST"
}
```

#### 3. **Submit Order Request (Create Payment)**
```
POST /api/Transactions/SubmitOrderRequest
Headers: { Authorization: "Bearer token" }
Body: {
  "id": "unique-order-id",
  "currency": "KES",
  "amount": 1000,
  "description": "Payment for Invoice INV-12345",
  "callback_url": "https://admin.safiritickets.com/payment-success",
  "notification_id": "ipn-id-from-registration",
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
}
Response: {
  "order_tracking_id": "pesapal-tracking-id",
  "merchant_reference": "unique-order-id",
  "redirect_url": "https://pay.pesapal.com/iframe/..."
}
```

#### 4. **Get Transaction Status**
```
GET /api/Transactions/GetTransactionStatus?orderTrackingId=pesapal-tracking-id
Headers: { Authorization: "Bearer token" }
Response: {
  "payment_method": "Card",
  "amount": 1000,
  "created_date": "timestamp",
  "confirmation_code": "ABC123",
  "payment_status_description": "Completed",
  "description": "Payment for Invoice INV-12345",
  "message": "Transaction successful",
  "payment_account": "411111******1111",
  "call_back_url": "https://admin.safiritickets.com/payment-success",
  "status_code": 1,
  "merchant_reference": "unique-order-id",
  "payment_status_code": "1",
  "currency": "KES"
}
```

### Payment Status Codes:
- `0` - Invalid
- `1` - Completed
- `2` - Failed
- `3` - Reversed

---

## Migration Strategy

### Phase 1: Preparation

1. **Create Pesapal Account**
   - Sign up at https://www.pesapal.com/
   - Complete KYC verification
   - Get Consumer Key and Consumer Secret

2. **Install Dependencies**
   ```bash
   npm install axios
   # No official Pesapal Node.js SDK, we'll use axios for HTTP requests
   ```

3. **Environment Variables**
   Add to your `.env` file:
   ```
   PESAPAL_CONSUMER_KEY=your-consumer-key
   PESAPAL_CONSUMER_SECRET=your-consumer-secret
   PESAPAL_IPN_URL=https://your-backend.com/api/payments/pesapal-webhook
   PESAPAL_BASE_URL=https://cybqa.pesapal.com/pesapalv3 # Sandbox
   # PESAPAL_BASE_URL=https://pay.pesapal.com/v3 # Production
   ```

### Phase 2: Code Implementation

#### 1. Create Pesapal Service (`src/services/pesapal.js`)

Key Functions Needed:
- `getAccessToken()` - Authenticate and get bearer token
- `registerIPN()` - Register webhook URL
- `generatePaymentLink(invoice, client)` - Create payment order
- `getTransactionStatus(orderTrackingId)` - Check payment status
- `processWebhook(webhookData)` - Handle IPN notifications

#### 2. Update Payment Model (`src/models/Payment.js`)

Change:
```javascript
paymentMethod: { 
  type: String, 
  enum: ['INTASEND', 'MPESA', 'CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'],
  default: 'INTASEND'
}
```

To:
```javascript
paymentMethod: { 
  type: String, 
  enum: ['PESAPAL', 'MPESA', 'CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'],
  default: 'PESAPAL'
}
```

#### 3. Update Routes (`src/routes/payments.js`)

- Change webhook endpoint from `/webhook` to `/pesapal-webhook`
- Update webhook handler to process Pesapal IPN format
- Keep manual payment routes unchanged

#### 4. Update Server Configuration (`src/server.js`)

- Replace IntaSend import with Pesapal import
- Update payment link generation calls

### Phase 3: Currency Considerations

**Important**: Pesapal primarily supports:
- KES (Kenyan Shilling) - Primary
- USD, GBP, EUR - Limited support, depends on merchant account setup

Your app currently supports: USD, EUR, GBP, KES, CAD, AUD

**Recommendation**: 
- Focus on KES for local payments
- Use KES as primary currency
- Convert other currencies to KES equivalent
- Or maintain dual gateway system (Pesapal for KES, another for international)

### Phase 4: Testing

1. **Sandbox Testing**
   - Use Pesapal sandbox credentials
   - Test payment link generation
   - Test various payment scenarios
   - Test webhook notifications

2. **Test Cards** (Pesapal Sandbox):
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits

3. **M-PESA Testing**:
   - Use test phone numbers provided in sandbox

### Phase 5: Deployment

1. Switch to production credentials
2. Update IPN URL to production backend
3. Monitor transactions closely
4. Keep IntaSend as fallback initially

---

## Side-by-Side Comparison

| Feature | IntaSend | Pesapal |
|---------|----------|---------|
| **Authentication** | API Key + Publishable Key | OAuth (Consumer Key/Secret) |
| **Payment Methods** | M-PESA, Cards, Bank | M-PESA, Cards, Bank, Airtel Money |
| **Primary Market** | East Africa, International | Kenya, Tanzania, Uganda |
| **Currencies** | USD, KES, EUR, GBP | Mainly KES, limited USD/EUR/GBP |
| **Webhook Format** | JSON POST | GET or POST with params |
| **SDK Availability** | Official Node.js SDK | No official SDK (REST API) |
| **Checkout Experience** | Hosted checkout page | Hosted iFrame/redirect |
| **Transaction Fees** | 3.5% + KES 10 | Varies by method, ~3.5% |

---

## Implementation Checklist

### Backend Tasks:
- [ ] Create `src/services/pesapal.js`
- [ ] Implement `getAccessToken()`
- [ ] Implement `registerIPN()`
- [ ] Implement `generatePaymentLink()`
- [ ] Implement `getTransactionStatus()`
- [ ] Implement `processWebhook()`
- [ ] Update `src/models/Payment.js`
- [ ] Update `src/routes/payments.js`
- [ ] Update `src/server.js`
- [ ] Add environment variables
- [ ] Test in sandbox
- [ ] Update invoice creation flow
- [ ] Update invoice update flow

### Frontend Tasks:
- [ ] Update payment link display (if needed)
- [ ] Update payment method labels
- [ ] Test payment link generation UI
- [ ] Test webhook status updates in UI

### Deployment Tasks:
- [ ] Register IPN URL with Pesapal
- [ ] Update production environment variables
- [ ] Deploy to staging for testing
- [ ] Deploy to production
- [ ] Monitor first transactions
- [ ] Update user documentation

---

## Potential Challenges & Solutions

### 1. **Currency Support**
**Challenge**: Your app supports 6 currencies, Pesapal primarily KES
**Solution**: 
- Implement currency detection
- Route KES payments to Pesapal
- Consider keeping IntaSend for international currencies
- Or implement multi-gateway system

### 2. **Webhook Format Differences**
**Challenge**: IntaSend and Pesapal webhooks have different formats
**Solution**:
- Create adapter layer in webhook handler
- Normalize webhook data before processing
- Handle both formats during transition period

### 3. **No Official SDK**
**Challenge**: Pesapal doesn't have official Node.js SDK
**Solution**:
- Build custom service using axios
- Handle authentication token refresh
- Implement retry logic
- Add comprehensive error handling

### 4. **Token Expiration**
**Challenge**: Pesapal tokens expire and need refresh
**Solution**:
- Implement token caching
- Auto-refresh before expiration
- Store token with expiry in memory/Redis

---

## Recommended Migration Path

### Option 1: Full Replacement (Recommended if you primarily serve Kenyan market)
1. Implement Pesapal completely
2. Replace all IntaSend code
3. Focus on KES transactions
4. Simple, clean codebase

### Option 2: Dual Gateway System (Recommended if you serve international clients)
1. Keep IntaSend for international currencies (USD, EUR, GBP)
2. Add Pesapal for KES transactions
3. Route based on currency:
   - KES → Pesapal
   - Others → IntaSend
4. More complex but better coverage

### Option 3: Phased Migration
1. Implement Pesapal alongside IntaSend
2. Run both in parallel for 1-2 months
3. Gradually switch customers to Pesapal
4. Deprecate IntaSend after confidence period

---

## Next Steps

1. **Decision Point**: Choose migration path (Option 1, 2, or 3)
2. **Account Setup**: Register Pesapal merchant account
3. **Development**: Implement Pesapal service layer
4. **Testing**: Thorough sandbox testing
5. **Deployment**: Gradual rollout to production
6. **Monitoring**: Close monitoring of transactions

---

## Code Examples Coming Next

Would you like me to:
1. ✅ Create the complete `pesapal.js` service file
2. ✅ Update all affected files
3. ✅ Create migration scripts
4. ✅ Implement dual-gateway system (if preferred)

Let me know which option you prefer, and I'll implement it for you!

