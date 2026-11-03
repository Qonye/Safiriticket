# BitForms Webhook Configuration Guide

Since BitForms doesn't automatically trigger WordPress hooks, we need to configure it to use webhooks directly.

## Step-by-Step Instructions

### 1. Access BitForms in WordPress Admin

1. Go to: `https://safiritickets.com/wp-admin`
2. Navigate to: **BitForms** → **Forms** (or find your contact form)
3. Click on your contact form to edit it

### 2. Add Webhook Integration

1. In the form editor, look for **Integrations** or **Workflows** tab/section
2. Click **Add Integration** or **+ New Integration**
3. Select **Webhook** or **HTTP Request** from the integration options

### 3. Configure Webhook Settings

**Webhook URL:**
```
https://safiriticket.up.railway.app/api/leads
```

**Method:**
```
POST
```

**Headers:**
Add these headers (one per line or as key-value pairs):
```
Content-Type: application/json
X-API-Key: safiri-leads-2025-secure-key-change-in-production
```

**Request Body (JSON):**
```json
{
  "name": "{{First name}} {{Last name}}",
  "email": "{{Email address}}",
  "phone": "{{Phone Number}}",
  "sourceWebsite": "safiritickets",
  "message": "{{Tell Us About Your Project:}}",
  "metadata": {
    "preferredContactMethod": "{{Preferred Contact Method}}",
    "preferredTime": "{{Preferred Time}}",
    "additionalInformation": "{{Additional Information:}}"
  }
}
```

**Note:** Replace `{{Field Name}}` with the actual field names/IDs from your BitForms form. BitForms might use different syntax like:
- `{field_name}`
- `[field_name]`
- `{{field_id}}`
- Or field IDs like `field_1`, `field_2`, etc.

### 4. Find Your Field Names/IDs

To find the correct field names:
1. In BitForms form editor, click on each field
2. Look at the field settings/configuration
3. Note the field ID or name (might be in the field settings panel)
4. Use those exact names in the webhook JSON above

### 5. Test the Integration

1. Save the webhook configuration
2. Go to your contact form on the website
3. Submit a test form
4. Check your CRM → Leads section
5. The lead should appear!

## Alternative: Use BitForms Field Mapping

If BitForms has a field mapping interface:
1. Map each form field to the corresponding JSON property
2. Use the field picker/selector to choose fields
3. This is easier than manually typing field names

## Troubleshooting

### If webhook doesn't work:

1. **Check BitForms Integration Logs:**
   - Go to BitForms → Entries
   - Find your test submission
   - Check for integration/webhook logs
   - Look for error messages

2. **Test Webhook URL:**
   - Use a tool like https://webhook.site to test
   - Temporarily use that URL in BitForms
   - Submit a form and see if data arrives
   - This confirms BitForms is sending data

3. **Check Field Names:**
   - Make sure field names in JSON match exactly
   - BitForms might use different field identifiers
   - Check BitForms documentation for field reference syntax

4. **Check API Response:**
   - Your CRM API should return status 201 or 200
   - Check WordPress error logs: `wp-content/debug.log`
   - Check CRM server logs for incoming requests

## Quick Reference

**API Endpoint:** `https://safiriticket.up.railway.app/api/leads`  
**Method:** `POST`  
**Required Headers:**
- `Content-Type: application/json`
- `X-API-Key: safiri-leads-2025-secure-key-change-in-production`

**Required Fields:**
- `name` (required)
- `email` (required)
- `sourceWebsite` (required - set to "safiritickets")

**Optional Fields:**
- `phone`
- `company`
- `message`
- `metadata` (any additional data)

