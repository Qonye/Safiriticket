# WordPress Plugin Installation Instructions

## For safiritickets.com

### Step 1: Access WordPress Admin

1. Go to: `https://safiritickets.com/wp-admin`
2. Login with:
   - Username: `admin`
   - Password: `%218mRZEx8VvDW#d`

### Step 2: Upload Plugin via FTP (Recommended)

Since the plugin file is ready, you can upload it via FTP:

1. **Connect via FTP** to your GoDaddy hosting:
   - Host: `ftp.safiritickets.com` (or check your GoDaddy hosting details)
   - Username: Your FTP username
   - Password: Your FTP password

2. **Navigate to**: `/wp-content/plugins/`

3. **Create folder**: `safiri-crm-integration`

4. **Upload file**: Copy `safiri-crm-integration.php` into that folder

5. **File structure should be**:
   ```
   wp-content/
     plugins/
       safiri-crm-integration/
         safiri-crm-integration.php
   ```

### Step 3: Activate Plugin

1. Go to WordPress Admin → Plugins
2. Find "Safiri CRM Integration"
3. Click "Activate"

### Step 4: Configure Settings

1. Go to **Settings → Safiri CRM**
2. Configure:
   - **API URL**: `https://safiriticket.up.railway.app/api/leads`
   - **API Key**: `safiri-leads-2025-secure-key-change-in-production`
   - **Source Website**: Select "Safiri Tickets"

3. Click "Save Changes"

4. Click "Test Connection" to verify it works

### Step 5: Verify Integration

1. Go to your contact form page: `https://safiritickets.com/contact-us/`
2. Submit a test form
3. Check your CRM at: `https://admin.safiritickets.com` → Leads section
4. The lead should appear there!

## Form Field Mapping

Your BitForms contact form has these fields that will be mapped:

| Form Field | CRM Field |
|------------|-----------|
| First name + Last name | `name` |
| Email address | `email` |
| Phone Number | `phone` |
| Tell Us About Your Project | `message` |
| Additional Information | `message` (appended) |
| Preferred Contact Method | `metadata.preferredContactMethod` |
| Preferred Time | `metadata.preferredTime` |
| All other fields | `metadata.*` |

## Troubleshooting

### Plugin Not Appearing
- Check file permissions (should be 644 for PHP files)
- Verify the file is in the correct folder structure
- Check WordPress error logs

### Leads Not Appearing in CRM
1. Check WordPress error logs: `wp-content/debug.log`
2. Verify API URL is correct
3. Verify API key matches in both WordPress and `.env` file
4. Test connection using the "Test Connection" button

### Form Submission Not Working
- Check if BitForms plugin is active
- Verify the form is using BitForms (not another form plugin)
- Check browser console for JavaScript errors

## Next Steps

Once this is working for safiritickets.com, we can:
1. Install the same plugin on jungledwellers.net
2. Configure it with `sourceWebsite: 'jungledwellers'`
3. Test both integrations

## Support

If you encounter issues:
1. Check WordPress error logs
2. Check CRM server logs
3. Verify the API endpoint is accessible: `https://safiriticket.up.railway.app/api/leads`

