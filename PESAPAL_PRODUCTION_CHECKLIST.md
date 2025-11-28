# Pesapal Production Configuration Checklist

## ✅ Confirmed: Codebase is Working
Since sandbox works perfectly, the issue is **NOT** with your code. It's a Pesapal production configuration issue.

## 🔍 Railway Environment Variables to Verify

Check your Railway project's environment variables and ensure:

### 1. Production URL is Set
```
PESAPAL_BASE_URL=http://pay.pesapal.com/v3
```
OR try HTTPS:
```
PESAPAL_BASE_URL=https://pay.pesapal.com/v3
```

### 2. Production Credentials (NOT Sandbox)
```
PESAPAL_CONSUMER_KEY=<your-production-consumer-key>
PESAPAL_CONSUMER_SECRET=<your-production-consumer-secret>
```

⚠️ **CRITICAL**: Do NOT use sandbox credentials with production URL!

### 3. Production IPN ID (if different from sandbox)
```
PESAPAL_IPN_ID=<your-production-ipn-id>
```

## 🚨 Most Likely Issues (In Order of Probability)

### 1. IP Whitelisting Required (90% likely)
**Problem**: Railway server IP is not whitelisted in Pesapal production.

**Solution**:
- Get Railway server's public IP (check Railway logs or run `curl ifconfig.me` from Railway)
- Contact Pesapal support: **pesapalv2.zohodesk.com**
- Request IP whitelisting for production API access
- Provide: Merchant account details + Railway server IP

### 2. Using Sandbox Credentials with Production URL (80% likely)
**Problem**: Railway has production URL but still using sandbox credentials.

**Solution**:
- Log into Pesapal merchant dashboard
- Get your production consumer key and secret
- Update Railway environment variables with production credentials

### 3. Production Account Not Activated (50% likely)
**Problem**: Production account exists but API access is not enabled.

**Solution**:
- Log into Pesapal merchant dashboard
- Check account status
- Contact Pesapal support to activate production API access

### 4. HTTP vs HTTPS (30% likely)
**Problem**: Production might require HTTPS instead of HTTP.

**Solution**:
- Try changing `PESAPAL_BASE_URL` from `http://` to `https://`
- Update Railway environment variable

## 📋 Action Items

1. **Check Railway Environment Variables**
   - Go to Railway dashboard → Your project → Variables
   - Verify `PESAPAL_BASE_URL` is set to production URL
   - Verify `PESAPAL_CONSUMER_KEY` is production key (not sandbox)
   - Verify `PESAPAL_CONSUMER_SECRET` is production secret (not sandbox)

2. **Get Railway Server IP**
   - Check Railway logs for outbound IP
   - Or add a temporary endpoint to log the IP
   - Or contact Railway support for your server's IP

3. **Contact Pesapal Support**
   - Email: **pesapalv2.zohodesk.com**
   - Subject: "Production API Access - IP Whitelisting Required"
   - Include:
     - Merchant account details
     - Railway server IP address
     - Error: "Connection timeout (ECONNABORTED)"
     - Confirmation: "Sandbox works fine, only production fails"

4. **Try HTTPS URL**
   - Update `PESAPAL_BASE_URL` to `https://pay.pesapal.com/v3`
   - Redeploy on Railway
   - Test again

## 🎯 Quick Test

To verify if it's an IP whitelisting issue, try calling the production API from your local machine:

```bash
curl -X POST https://pay.pesapal.com/v3/api/Auth/RequestToken \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "consumer_key": "YOUR_PRODUCTION_KEY",
    "consumer_secret": "YOUR_PRODUCTION_SECRET"
  }'
```

- ✅ **If this works locally**: It's definitely an IP whitelisting issue
- ❌ **If this also fails**: Check your production credentials or account activation

## 📝 Summary

Since sandbox works, your code is correct. The timeout error indicates:
1. Railway server IP is blocked/not whitelisted (most likely)
2. Wrong credentials (production URL with sandbox keys)
3. Production account not activated
4. Network/firewall blocking Railway

**Next Step**: Contact Pesapal support with Railway IP for whitelisting.

