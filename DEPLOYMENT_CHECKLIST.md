# Deployment Checklist - Pesapal Migration

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Pesapal service created
- [x] IntaSend service removed
- [x] Routes updated to use Pesapal
- [x] Payment model updated
- [x] Dependencies updated (axios added, intasend-node removed)
- [x] Environment variables configured

### ⚠️ Before Pushing

1. **Verify Environment Variables in Railway**
   - Go to Railway dashboard
   - Check that these variables are set (or will be set after deployment):
     - `PESAPAL_CONSUMER_KEY`
     - `PESAPAL_CONSUMER_SECRET`
     - `PESAPAL_BASE_URL`
     - `PESAPAL_IPN_URL`
     - `PESAPAL_CALLBACK_URL`

2. **Install Dependencies Locally** (to verify)
   ```bash
   cd src
   npm install
   ```

---

## Deployment Steps (In Order!)

### Step 1: Deploy Code to Railway 🚀

**CRITICAL**: Deploy FIRST so the IPN endpoint exists!

```bash
# 1. Commit changes
git add .
git commit -m "Migrate from IntaSend to Pesapal API 3.0"

# 2. Push to trigger Railway deployment
git push origin main
# (or your branch name)
```

**Wait for Railway deployment to complete** (check Railway dashboard)

### Step 2: Verify Endpoint is Live ✅

Test that your IPN endpoint is accessible:

```bash
# This should return an error about missing parameters
# (which confirms the endpoint exists and is working)
curl https://safiriticket.up.railway.app/api/payments/pesapal-webhook
```

**Expected**: Error about missing `OrderTrackingId` (this is good - means endpoint exists!)

### Step 3: Register IPN URL with Pesapal 📝

**Now that your endpoint is live, register it:**

1. Go to: https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/IpnRegistration

2. Fill in the form:
   - **Request Type**: `GET` (or `POST`)
   - **Consumer Key**: `qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW`
   - **Consumer Secret**: `osGQ364R49cXKeOYSpaOnT++rHs=`
   - **IPN URL**: `https://safiriticket.up.railway.app/api/payments/pesapal-webhook`

3. Click "Register IPN"

4. **Save the IPN ID** returned (optional - service will auto-register if not set)

### Step 4: Test Payment Flow 🧪

1. **Create a test invoice** in your app
2. **Check payment link** is generated automatically
3. **Click payment link** - should redirect to Pesapal
4. **Complete test payment** using sandbox test card:
   - Card: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
5. **Verify webhook** receives notification:
   - Check Railway logs
   - Check that invoice status updates
   - Check payment record is created

### Step 5: Monitor & Verify 📊

- [ ] Check Railway logs for webhook calls
- [ ] Verify payments are being created in database
- [ ] Verify invoice status updates correctly
- [ ] Test multiple payment scenarios

---

## Troubleshooting

### IPN Not Receiving Notifications?

1. **Verify endpoint is accessible**:
   ```bash
   curl https://safiriticket.up.railway.app/api/payments/pesapal-webhook
   ```

2. **Check Railway logs** for errors

3. **Verify IPN is registered** correctly with Pesapal

4. **Check environment variables** in Railway dashboard

5. **Test with cURL**:
   ```bash
   # Simulate Pesapal webhook
   curl "https://safiriticket.up.railway.app/api/payments/pesapal-webhook?OrderTrackingId=test123&OrderMerchantReference=invoice_test&OrderNotificationType=CHANGE"
   ```

### Payment Links Not Generating?

1. Check Railway logs for errors
2. Verify `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET` are set
3. Check token generation is working
4. Verify IPN registration succeeded

### Token Errors?

- Check credentials are correct
- Verify base URL is correct (sandbox vs production)
- Check token expiry handling

---

## Going to Production

When ready to go live:

1. **Get Production Credentials** from Pesapal
2. **Update Railway Environment Variables**:
   - `PESAPAL_CONSUMER_KEY` → Production key
   - `PESAPAL_CONSUMER_SECRET` → Production secret
   - `PESAPAL_BASE_URL` → `http://pay.pesapal.com/v3`
3. **Register Production IPN URL** using production registration form
4. **Redeploy** (or Railway will auto-deploy on env var change)
5. **Test with small real payment**
6. **Monitor closely** for first few transactions

---

## Quick Reference

**Your IPN URL**: `https://safiriticket.up.railway.app/api/payments/pesapal-webhook`

**Sandbox Registration**: https://cybqa.pesapal.com/PesapalIframe/PesapalIframe3/IpnRegistration

**Sandbox Credentials**:
- Consumer Key: `qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW`
- Consumer Secret: `osGQ364R49cXKeOYSpaOnT++rHs=`

---

**Remember**: Deploy FIRST, then register IPN! 🚀

