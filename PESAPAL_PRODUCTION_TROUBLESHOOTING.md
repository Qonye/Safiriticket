# Pesapal Production Troubleshooting Guide

## Problem: 522 Connection Timeout Error in Production

If sandbox works but production fails with 522 (Connection Timeout) errors, Pesapal may be blocking your requests.

## Common Causes

### 1. IP Whitelisting Required
**Most Common Issue**: Pesapal production environment often requires IP whitelisting.

**Solution**:
- Get your Railway server's public IP address
- Contact Pesapal support to whitelist your IP
- Email: pesapalv2.zohodesk.com
- Provide: Your merchant account details and server IP address

**How to get Railway IP**:
- Check Railway logs for outbound IP
- Or use: `curl ifconfig.me` from your server
- Railway may use dynamic IPs - ask Pesapal about IP ranges

### 2. Production Account Not Activated
Your Pesapal production account may need to be activated/enabled.

**Solution**:
- Log into your Pesapal merchant dashboard
- Check account status
- Contact Pesapal support to activate production API access
- Verify your account is approved for live transactions

### 3. Incorrect Production Credentials
Double-check you're using the correct production consumer key and secret.

**Solution**:
- Log into Pesapal merchant dashboard
- Navigate to API settings
- Verify production credentials match your `.env` file
- Ensure you're not mixing sandbox and production keys

### 4. URL Format Issues
Production might require HTTPS instead of HTTP.

**Current Configuration**:
- Sandbox: `http://cybqa.pesapal.com/pesapalv3`
- Production: `http://pay.pesapal.com/v3`

**Try**:
- Update `.env` to use: `https://pay.pesapal.com/v3` (with HTTPS)
- Some production APIs require HTTPS

### 5. Network/Firewall Issues
Railway's network might be blocked by Pesapal's firewall.

**Solution**:
- Check Railway logs for detailed error messages
- Contact Railway support if IP is blocked
- Consider using a static IP service if needed

## Diagnostic Steps

### Step 1: Check Railway Logs
After attempting to generate a payment link, check Railway logs for:
- Exact error code and message
- Request URL being called
- Response status and data
- Network error codes

### Step 2: Test Production API Directly
Try calling the production API from your local machine or a different server:

```bash
curl -X POST https://pay.pesapal.com/v3/api/Auth/RequestToken \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "consumer_key": "YOUR_PRODUCTION_KEY",
    "consumer_secret": "YOUR_PRODUCTION_SECRET"
  }'
```

If this works from your machine but not from Railway, it's likely an IP whitelisting issue.

### Step 3: Verify Environment Variables
Check your Railway environment variables:
- `PESAPAL_BASE_URL` should be `http://pay.pesapal.com/v3` or `https://pay.pesapal.com/v3`
- `PESAPAL_CONSUMER_KEY` should be your production key
- `PESAPAL_CONSUMER_SECRET` should be your production secret

### Step 4: Contact Pesapal Support
When contacting Pesapal support, provide:
1. Your merchant account details
2. Your server's public IP address (from Railway)
3. Error message: "522 Connection Timeout"
4. Request URL: `https://pay.pesapal.com/v3/api/Auth/RequestToken`
5. Confirmation that sandbox works fine

## What to Ask Pesapal Support

1. **IP Whitelisting**: "Do I need to whitelist my server IP for production API access? My server IP is: [YOUR_IP]"

2. **Account Activation**: "Is my production account activated for API access? My merchant account is: [YOUR_ACCOUNT]"

3. **URL Format**: "Should I use HTTP or HTTPS for the production API base URL?"

4. **Credentials**: "Can you verify my production consumer key and secret are correct?"

5. **Firewall Rules**: "Are there any firewall rules blocking requests from Railway hosting?"

## Quick Fixes to Try

### Option 1: Try HTTPS URL
Update your Railway `.env`:
```
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
```

### Option 2: Check Credentials
Verify production credentials in Pesapal dashboard match your `.env` file.

### Option 3: Wait and Retry
Sometimes Pesapal's production servers have temporary issues. Wait a few minutes and try again.

## Expected Behavior

**Sandbox (Working)**:
- URL: `http://cybqa.pesapal.com/pesapalv3`
- No IP whitelisting required
- Works immediately with demo credentials

**Production (Blocked)**:
- URL: `http://pay.pesapal.com/v3` or `https://pay.pesapal.com/v3`
- May require IP whitelisting
- Requires activated production account
- Uses production credentials

## Support Contacts

- **Pesapal Support**: pesapalv2.zohodesk.com
- **Developer Portal**: https://developer.pesapal.com/
- **Pesapal Forum**: https://developer.pesapal.com/forum

## Next Steps

1. Check Railway logs for detailed error information
2. Get your Railway server IP address
3. Contact Pesapal support with the information above
4. Try HTTPS URL if currently using HTTP
5. Verify account activation status


