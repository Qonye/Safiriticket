# Pesapal Payment Integration - Developer Guide

This document provides essential information for maintaining and upgrading the Pesapal payment integration.

## Overview

The application uses **Pesapal API 3.0** for payment processing. The integration is implemented in `src/services/pesapal.js` and handles:
- Payment link generation
- Webhook processing (IPN notifications)
- Transaction status checking
- Token management with caching

## Environment Configuration

### Required Environment Variables

```bash
# API Credentials
PESAPAL_CONSUMER_KEY=your-consumer-key
PESAPAL_CONSUMER_SECRET=your-consumer-secret

# Base URL (IMPORTANT: Use HTTPS for production, HTTP for sandbox)
PESAPAL_BASE_URL=https://pay.pesapal.com/v3          # Production
# PESAPAL_BASE_URL=http://cybqa.pesapal.com/pesapalv3  # Sandbox

# IPN Configuration
PESAPAL_IPN_URL=https://your-backend.com/api/payments/pesapal-webhook
PESAPAL_IPN_ID=your-ipn-id  # Optional, will auto-register if not provided

# Callback URL
PESAPAL_CALLBACK_URL=https://your-frontend.com/payment-success
```

### ⚠️ Critical Configuration Notes

1. **Production requires HTTPS**: Always use `https://pay.pesapal.com/v3` (NOT `http://`)
2. **Sandbox uses HTTP**: Use `http://cybqa.pesapal.com/pesapalv3` for testing
3. **Base URL only**: Set only the base URL (e.g., `https://pay.pesapal.com/v3`), the code appends endpoint paths automatically

## API Endpoints Used

The service uses the following Pesapal API endpoints:

- `POST /api/Auth/RequestToken` - Get access token
- `POST /api/URLSetup/RegisterIPN` - Register IPN URL
- `POST /api/Transactions/SubmitOrderRequest` - Create payment order
- `GET /api/Transactions/GetTransactionStatus` - Check transaction status

## Key Functions

### `generatePaymentLink(invoice, client)`
Generates a payment link for an invoice. Returns:
```javascript
{
  success: true,
  paymentLink: "https://pay.pesapal.com/...",
  paymentLinkId: "order-tracking-id",
  paymentId: "payment-db-id",
  message: "Payment link generated successfully"
}
```

### `processWebhook(queryParams, body)`
Processes IPN notifications from Pesapal. Handles both GET and POST webhooks.

### `getTransactionStatus(orderTrackingId)`
Retrieves the current status of a transaction from Pesapal.

### `registerIPN(ipnUrl, notificationType)`
Registers an IPN URL with Pesapal. Returns the IPN ID.

## Token Management

The service implements automatic token caching:
- Tokens are cached in memory
- Tokens expire after a set period (from Pesapal response)
- New tokens are automatically fetched when expired
- Cache expires 5 minutes before actual expiry for safety

## Webhook Processing

Pesapal sends IPN notifications via:
- **GET request** with query parameters
- **POST request** with JSON body

The webhook handler:
1. Extracts `OrderTrackingId` from the request
2. Verifies transaction status by calling Pesapal API
3. Updates payment record in database
4. Updates invoice status if payment is completed

## Common Issues & Solutions

### Issue: Connection Timeout
**Symptom**: `ECONNABORTED` or timeout errors**

**Solutions**:
1. ✅ **Check URL protocol**: Production MUST use `https://` (not `http://`)
2. Verify credentials are correct
3. Check network connectivity
4. Ensure account is activated

### Issue: Invalid Token
**Symptom**: 401 Unauthorized errors

**Solutions**:
1. Verify `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET` are correct
2. Ensure you're using production credentials with production URL (and vice versa)
3. Check token hasn't expired (should auto-refresh)

### Issue: IPN Not Received
**Symptom**: Payments complete but webhook not triggered

**Solutions**:
1. Verify `PESAPAL_IPN_URL` is publicly accessible
2. Check IPN is registered: Use `registerIPN()` function
3. Verify `PESAPAL_IPN_ID` matches registered IPN
4. Check webhook endpoint is accessible (no firewall blocking)

## Testing

### Sandbox Testing
1. Set `PESAPAL_BASE_URL=http://cybqa.pesapal.com/pesapalv3`
2. Use sandbox credentials (available in `env.example`)
3. Test payment flow end-to-end

### Production Testing
1. Set `PESAPAL_BASE_URL=https://pay.pesapal.com/v3` (⚠️ HTTPS required)
2. Use production credentials from Pesapal merchant dashboard
3. Test with small amounts first

## Upgrading the Integration

### When Pesapal Updates Their API

1. **Check Pesapal Developer Portal**: https://developer.pesapal.com/
2. **Review API Changes**: Check for breaking changes in API 3.0
3. **Update Endpoints**: Modify endpoint URLs if changed
4. **Test Thoroughly**: Test in sandbox before deploying to production

### Adding New Features

1. **New Payment Methods**: Pesapal supports multiple payment methods automatically
2. **Additional Webhooks**: Extend `processWebhook()` to handle new notification types
3. **Status Codes**: Update status mapping if Pesapal adds new status codes

## Code Structure

```
src/services/pesapal.js
├── getAccessToken()           # Internal: Get/cache access token
├── registerIPN()              # Public: Register IPN URL
├── getIPNId()                 # Internal: Get or register IPN
├── generatePaymentLink()      # Public: Create payment link
├── getTransactionStatus()     # Public: Check transaction status
├── processWebhook()           # Public: Handle IPN notifications
└── regeneratePaymentLink()    # Public: Regenerate payment link
```

## Database Models

### Payment Model
Stores payment records with:
- `invoice`: Reference to invoice
- `amount`: Payment amount
- `currency`: Payment currency
- `status`: Payment status (PENDING, COMPLETED, FAILED, CANCELLED)
- `paymentMethod`: Payment method (PESAPAL, CARD, MPESA, etc.)
- `metadata`: Contains Pesapal-specific data (order_tracking_id, etc.)

## Support Resources

- **Pesapal Developer Portal**: https://developer.pesapal.com/
- **API Documentation**: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
- **Support**: pesapalv2.zohodesk.com

## Important Reminders

1. ⚠️ **Always use HTTPS for production** (`https://pay.pesapal.com/v3`)
2. ⚠️ **Never commit production credentials to version control**
3. ⚠️ **Test in sandbox before deploying to production**
4. ⚠️ **Keep IPN URL publicly accessible and secure**
5. ⚠️ **Monitor webhook logs for failed notifications**

## Migration Notes

If migrating from another payment provider or upgrading:
1. Ensure all environment variables are set correctly
2. Register IPN URL before going live
3. Test webhook endpoint is accessible
4. Verify callback URL redirects correctly
5. Monitor first few transactions closely

---

**Last Updated**: 2025-01-XX  
**API Version**: Pesapal API 3.0  
**Maintained By**: Development Team

