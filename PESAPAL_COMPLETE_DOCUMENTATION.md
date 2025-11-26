# Complete Pesapal API Documentation

## Overview

This document contains all the Pesapal API documentation gathered from their official developer portal and resources.

---

## Official Documentation Links

### Main Resources:
- **Developer Portal**: https://developer.pesapal.com/
- **API 3.0 Documentation**: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
- **Postman API Collection**: http://documenter.getpostman.com/view/6715320/UyxepTv1
- **Integration Guide**: https://developer.pesapal.com/how-to-integrate
- **Sample Code**: Available on developer portal
- **Forum**: https://developer.pesapal.com/forum

### Testing & Setup Resources:
- **Demo Keys for Sandbox Testing**: https://developer.pesapal.com/api3-demo-keys.txt
- **Sandbox/Demo IPN Registration Form**: Available on developer portal (contact Pesapal support for direct link)
- **Production/Live IPN Registration Form**: Available on developer portal (contact Pesapal support for direct link)

### Support:
- **Email Support**: pesapalv2.zohodesk.com (via Pesapal Developer support)

---

## Base URLs

### Sandbox (Testing Environment)
```
http://cybqa.pesapal.com/pesapalv3
```

### Production (Live Environment)
```
http://pay.pesapal.com/v3
```

---

## Authentication

Pesapal API 3.0 uses **OAuth-based authentication** with Bearer tokens.

### Step 1: Get Access Token

**Endpoint**: `POST /api/Auth/RequestToken`

**Base URL**: 
- Sandbox: `http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken`
- Production: `http://pay.pesapal.com/v3/api/Auth/RequestToken`

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

**Request Body**:
```json
{
  "consumer_key": "your-consumer-key",
  "consumer_secret": "your-consumer-secret"
}
```

**Response**:
```json
{
  "token": "bearer-token-here",
  "expiryDate": "2025-01-15T10:30:00Z"
}
```

**Important Notes**:
- Tokens expire after a set period
- Store token with expiry timestamp
- Refresh token before expiration
- Use token in `Authorization: Bearer {token}` header for subsequent requests

---

## Core API Endpoints

### 1. Register IPN (Instant Payment Notification) URL

**Purpose**: Register your webhook URL to receive payment status updates

**Important**: Pesapal provides online forms for IPN registration:
- **Sandbox/Demo IPN Registration Form**: Use this for testing
- **Production/Live IPN Registration Form**: Use this for live environment
- Contact Pesapal support or check developer portal for direct links to these forms

**Alternative Method - API Endpoint**: `POST /api/URLSetup/RegisterIPN`

**Full URL**:
- Sandbox: `http://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN`
- Production: `http://pay.pesapal.com/v3/api/URLSetup/RegisterIPN`

**Headers**:
```
Authorization: Bearer {access-token}
Content-Type: application/json
Accept: application/json
```

**Request Body**:
```json
{
  "url": "https://your-backend.com/api/payments/pesapal-webhook",
  "ipn_notification_type": "GET"
}
```

**Note**: `ipn_notification_type` can be `"GET"` or `"POST"`

**Response**:
```json
{
  "url": "https://your-backend.com/api/payments/pesapal-webhook",
  "created_date": "2025-01-10T08:00:00Z",
  "ipn_id": "ipn-id-returned-here"
}
```

**Important**: Save the `ipn_id` - you'll need it when creating payment orders!

---

### 2. Submit Order Request (Create Payment)

**Purpose**: Create a payment order and get redirect URL for customer

**Endpoint**: `POST /api/Transactions/SubmitOrderRequest`

**Full URL**:
- Sandbox: `http://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest`
- Production: `http://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest`

**Headers**:
```
Authorization: Bearer {access-token}
Content-Type: application/json
Accept: application/json
```

**Request Body**:
```json
{
  "id": "unique-order-id-12345",
  "currency": "KES",
  "amount": 1000.00,
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
```

**Field Descriptions**:
- `id`: Unique order identifier (use invoice ID or generate unique ID)
- `currency`: Currency code (KES, USD, EUR, GBP - depends on merchant account)
- `amount`: Payment amount (decimal)
- `description`: Description of payment
- `callback_url`: URL to redirect customer after payment
- `notification_id`: IPN ID from RegisterIPN endpoint
- `billing_address`: Customer billing information

**Response**:
```json
{
  "order_tracking_id": "pesapal-tracking-id-abc123",
  "merchant_reference": "unique-order-id-12345",
  "redirect_url": "https://pay.pesapal.com/iframe/..."
}
```

**Important**: 
- Use `redirect_url` to redirect customer to payment page
- Save `order_tracking_id` to track payment status
- `merchant_reference` will be your original `id`

---

### 3. Get Transaction Status

**Purpose**: Check the status of a payment transaction

**Endpoint**: `GET /api/Transactions/GetTransactionStatus?orderTrackingId={tracking-id}`

**Full URL**:
- Sandbox: `http://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId={tracking-id}`
- Production: `http://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId={tracking-id}`

**Headers**:
```
Authorization: Bearer {access-token}
Accept: application/json
```

**Response**:
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
  "merchant_reference": "unique-order-id-12345",
  "payment_status_code": "1",
  "currency": "KES"
}
```

---

## Payment Status Codes

### Status Code Values:
- `0` - Invalid
- `1` - Completed
- `2` - Failed
- `3` - Reversed

### Status Descriptions:
- `"Completed"` - Payment successful
- `"Failed"` - Payment failed
- `"Invalid"` - Invalid transaction
- `"Reversed"` - Payment reversed/refunded

---

## IPN (Instant Payment Notification) Webhook

### Webhook Format

Pesapal sends payment status updates to your registered IPN URL.

**If IPN type is GET**:
```
https://your-backend.com/api/payments/pesapal-webhook?OrderTrackingId={tracking-id}&OrderMerchantReference={merchant-ref}&OrderNotificationType={type}
```

**If IPN type is POST**:
- Content-Type: `application/json` or `application/x-www-form-urlencoded`
- Body contains the same parameters

**Parameters**:
- `OrderTrackingId`: Pesapal tracking ID
- `OrderMerchantReference`: Your original order ID
- `OrderNotificationType`: Type of notification

**Important**: After receiving webhook, you MUST call `GetTransactionStatus` to verify and get full payment details!

---

## Error Handling

### Error Response Format

When an error occurs, Pesapal returns a JSON error object:

```json
{
  "error": {
    "error_type": "InvalidRequest",
    "code": "ERR001",
    "message": "Invalid consumer key or secret",
    "data": {}
  }
}
```

### Common Error Codes:
- Invalid credentials
- Missing required fields
- Invalid amount/currency
- IPN URL not registered
- Token expired

**Always handle errors gracefully and log them for debugging!**

---

## Currency Support

### Supported Currencies:
- **KES** (Kenyan Shilling) - Primary, fully supported
- **USD** (US Dollar) - Limited support, depends on merchant account
- **EUR** (Euro) - Limited support, depends on merchant account
- **GBP** (British Pound) - Limited support, depends on merchant account

**Important**: 
- KES is the primary currency
- International currencies require special merchant account setup
- Check with Pesapal support for multi-currency support

---

## Payment Methods Supported

1. **M-PESA** (Mobile Money - Kenya)
2. **Visa Card**
3. **Mastercard**
4. **Airtel Money** (Mobile Money)
5. **Bank Transfer** (Limited)

---

## Integration Flow

### Complete Payment Flow:

```
1. Get Access Token
   ↓
2. Register IPN URL (one-time setup)
   ↓
3. Create Payment Order (SubmitOrderRequest)
   ↓
4. Redirect Customer to redirect_url
   ↓
5. Customer Completes Payment
   ↓
6. Pesapal Sends IPN to Your Webhook
   ↓
7. Verify Payment Status (GetTransactionStatus)
   ↓
8. Update Your Database
   ↓
9. Redirect Customer to callback_url
```

---

## Testing & Sandbox

### Sandbox Credentials:
- **Demo Keys URL**: https://developer.pesapal.com/api3-demo-keys.txt
- Contains Consumer Key and Consumer Secret for sandbox testing
- Use these credentials to test your integration before going live
- **Important**: These are test credentials only - do not use in production!

### Test Cards:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits

### Test M-PESA:
- Use test phone numbers provided in sandbox documentation

---

## Best Practices

### 1. Token Management
- Cache access tokens
- Refresh before expiration
- Handle token refresh errors gracefully

### 2. Webhook Security
- Always verify webhook by calling GetTransactionStatus
- Don't trust webhook data alone
- Implement idempotency (handle duplicate webhooks)

### 3. Error Handling
- Log all errors
- Retry failed requests with exponential backoff
- Notify administrators of critical failures

### 4. Payment Tracking
- Store `order_tracking_id` in your database
- Use `merchant_reference` to link to your invoices
- Track payment status changes

### 5. Currency Handling
- Validate currency before creating payment
- Convert amounts to appropriate currency if needed
- Display currency clearly to customers

---

## Sample Code Structure

### Node.js/Express Example:

```javascript
// 1. Get Access Token
async function getAccessToken() {
  const response = await axios.post(
    'http://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
    {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }
  );
  return response.data.token;
}

// 2. Register IPN (one-time)
async function registerIPN(token) {
  const response = await axios.post(
    'http://cybqa.pesapal.com/pesapalv3/api/URLSetup/RegisterIPN',
    {
      url: process.env.PESAPAL_IPN_URL,
      ipn_notification_type: 'GET'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data.ipn_id;
}

// 3. Create Payment Order
async function createPaymentOrder(token, invoice, client, ipnId) {
  const response = await axios.post(
    'http://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest',
    {
      id: `invoice_${invoice._id}`,
      currency: invoice.currency || 'KES',
      amount: invoice.total - (invoice.paidAmount || 0),
      description: `Payment for Invoice ${invoice.number}`,
      callback_url: 'https://admin.safiritickets.com/payment-success',
      notification_id: ipnId,
      billing_address: {
        email_address: client.email,
        phone_number: client.phone || '254712345678',
        country_code: 'KE',
        first_name: client.name.split(' ')[0] || 'Customer',
        last_name: client.name.split(' ').slice(1).join(' ') || '',
        line_1: client.address || 'Nairobi',
        city: 'Nairobi'
      }
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}

// 4. Get Transaction Status
async function getTransactionStatus(token, orderTrackingId) {
  const response = await axios.get(
    `http://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

---

## Environment Variables Needed

```env
# Pesapal Credentials
PESAPAL_CONSUMER_KEY=your-consumer-key
PESAPAL_CONSUMER_SECRET=your-consumer-secret
PESAPAL_IPN_URL=https://your-backend.com/api/payments/pesapal-webhook

# Environment
PESAPAL_BASE_URL=http://cybqa.pesapal.com/pesapalv3  # Sandbox
# PESAPAL_BASE_URL=http://pay.pesapal.com/v3  # Production

# Callback URL
PESAPAL_CALLBACK_URL=https://admin.safiritickets.com/payment-success
```

---

## Additional Resources

### Official Links:
- **Main Website**: https://www.pesapal.com/
- **Support**: https://www.pesapal.com/support
- **Help Center**: Available on Pesapal website
- **Terms & Conditions**: Available on Pesapal website
- **Privacy Policy**: Available on Pesapal website

### Community:
- **Developer Forum**: https://developer.pesapal.com/forum
- **Postman Collection**: http://documenter.getpostman.com/view/6715320/UyxepTv1

### Integration Guides:
- PHP Integration Guide (PDF available on developer portal)
- .NET Integration Guide (PDF available on developer portal)
- Sample code for various languages (available on developer portal)

---

## Migration Notes for IntaSend → Pesapal

### Key Differences:

1. **Authentication**: 
   - IntaSend: API Key + Publishable Key
   - Pesapal: OAuth with Consumer Key/Secret + Bearer Token

2. **Payment Creation**:
   - IntaSend: Direct SDK call
   - Pesapal: REST API call with OAuth token

3. **Webhooks**:
   - IntaSend: JSON POST with specific format
   - Pesapal: GET/POST with query params, need to verify with GetTransactionStatus

4. **Currency**:
   - IntaSend: Multiple currencies supported
   - Pesapal: Primarily KES, limited international

5. **SDK**:
   - IntaSend: Official Node.js SDK
   - Pesapal: No official SDK, use REST API directly

---

## Next Steps

1. **Get Pesapal Account**: Sign up at https://www.pesapal.com/
2. **Get Credentials**: Obtain Consumer Key and Secret
3. **Test in Sandbox**: Use sandbox credentials for testing
4. **Register IPN**: Register your webhook URL
5. **Implement Integration**: Follow the code examples above
6. **Test Thoroughly**: Test all payment scenarios
7. **Go Live**: Switch to production credentials

---

## Support

For integration help:
- Developer Forum: https://developer.pesapal.com/forum
- Pesapal Support: https://www.pesapal.com/support
- Email support through Pesapal website

---

**Last Updated**: January 2025
**API Version**: 3.0 (JSON)
**Status**: Current and Active

