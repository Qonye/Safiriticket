# Pesapal Email Resources - Quick Reference

This document contains the resources provided by Pesapal Developer Support via email.

---

## Email from Pesapal Developer Support

**Date**: November 21, 2024  
**From**: Pesapal Developer via pesapalv2.zohodesk.com  
**Subject**: Pesapal Integration Resources

---

## Official Resources Provided

### 1. API Reference Guide
**URL**: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference

**What it contains**:
- Complete API endpoint documentation
- Request/response formats
- Authentication details
- Error handling

---

### 2. Postman Collection
**URL**: https://documenter.getpostman.com/view/6715320/UyxepTv1

**What it contains**:
- Interactive API testing environment
- All API endpoints pre-configured
- Request examples
- Response examples
- Can import directly into Postman

**How to use**:
1. Open Postman
2. Click "Import"
3. Paste the URL or import the collection
4. Start testing API endpoints

---

### 3. Demo Keys for Sandbox Testing
**URL**: https://developer.pesapal.com/api3-demo-keys.txt

**What it contains**:
- Consumer Key (for sandbox)
- Consumer Secret (for sandbox)
- Test credentials to use during development

**Important Notes**:
- These are **TEST credentials only**
- Do NOT use in production
- Use these to test your integration
- Sandbox environment: `http://cybqa.pesapal.com/pesapalv3`

**How to use**:
1. Visit the URL to get your demo keys
2. Copy the Consumer Key and Consumer Secret
3. Use them in your `.env` file for testing:
   ```
   PESAPAL_CONSUMER_KEY=your-demo-consumer-key
   PESAPAL_CONSUMER_SECRET=your-demo-consumer-secret
   PESAPAL_BASE_URL=http://cybqa.pesapal.com/pesapalv3
   ```

---

### 4. IPN Registration Forms

Pesapal provides **online forms** to register your IPN (Instant Payment Notification) URLs:

#### Sandbox/Demo IPN Registration Form
- **Purpose**: Register webhook URL for testing
- **When to use**: During development and testing
- **Note**: Contact Pesapal support or check developer portal for direct link

#### Production/Live IPN Registration Form
- **Purpose**: Register webhook URL for live environment
- **When to use**: When ready to go live
- **Note**: Contact Pesapal support or check developer portal for direct link

**What you'll need**:
- Your IPN URL (e.g., `https://your-backend.com/api/payments/pesapal-webhook`)
- IPN notification type (GET or POST)
- Your merchant account details

**Alternative**: You can also register IPN via API using the `RegisterIPN` endpoint (see main documentation)

---

## Integration Journey Overview

According to Pesapal, the integration journey covers:

1. **Generating Access Tokens**
   - Get OAuth token using Consumer Key/Secret
   - Token expires, need to refresh periodically

2. **Submitting Order Requests**
   - Create payment orders
   - Get redirect URL for customers
   - Handle payment initiation

3. **Handling Real-time Payment Notifications**
   - Receive IPN webhooks from Pesapal
   - Verify payment status
   - Update your database
   - Notify customers

---

## Quick Start Checklist

### Step 1: Get Demo Keys
- [ ] Visit: https://developer.pesapal.com/api3-demo-keys.txt
- [ ] Copy Consumer Key and Consumer Secret
- [ ] Add to your `.env` file

### Step 2: Review Documentation
- [ ] Read API Reference: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference
- [ ] Import Postman Collection: https://documenter.getpostman.com/view/6715320/UyxepTv1
- [ ] Test endpoints in Postman

### Step 3: Register IPN URL
- [ ] Determine your webhook URL
- [ ] Use Sandbox IPN Registration Form (for testing)
- [ ] Save the IPN ID returned

### Step 4: Implement Integration
- [ ] Implement token generation
- [ ] Implement payment order creation
- [ ] Implement webhook handler
- [ ] Test in sandbox

### Step 5: Go Live
- [ ] Get production credentials from Pesapal
- [ ] Register production IPN URL
- [ ] Switch to production base URL
- [ ] Monitor transactions

---

## Support Contact

**Email**: pesapalv2.zohodesk.com (via Pesapal Developer support)

**When to contact**:
- Need help with integration
- Questions about API endpoints
- Issues with sandbox testing
- Production setup assistance
- IPN registration form links

---

## Additional Notes

### Base URLs:
- **Sandbox**: `http://cybqa.pesapal.com/pesapalv3`
- **Production**: `http://pay.pesapal.com/v3`

### Important Reminders:
1. Always test in sandbox first
2. Never use demo keys in production
3. Register IPN URLs before going live
4. Verify webhook signatures/status
5. Handle errors gracefully
6. Test all payment scenarios

---

## Next Steps

1. ✅ Get demo keys from the provided URL
2. ✅ Review API documentation
3. ✅ Test in Postman collection
4. ✅ Register sandbox IPN URL
5. ✅ Implement integration code
6. ✅ Test thoroughly in sandbox
7. ✅ Get production credentials
8. ✅ Register production IPN URL
9. ✅ Deploy to production
10. ✅ Monitor and maintain

---

**Last Updated**: November 2024  
**Source**: Official Pesapal Developer Support Email

