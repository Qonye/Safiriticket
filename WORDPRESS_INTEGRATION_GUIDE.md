# WordPress to CRM Lead Integration Guide

## Overview
This guide explains how to integrate WordPress contact forms from `safiritickets.com` and `jungledwellers.net` with the SafiriTicket CRM system.

## CRM API Endpoint

**Endpoint**: `POST https://safiriticket.up.railway.app/api/leads`

**Headers Required**:
- `Content-Type: application/json`
- `X-API-Key: safiri-leads-2025-secure-key-change-in-production`

**Note**: Change the API key in production for security!

## Integration Methods

### Method 1: WordPress Plugin (Recommended)

Create a custom WordPress plugin that hooks into form submissions.

#### Step 1: Create Plugin File

Create a new file: `wp-content/plugins/safiri-crm-integration/safiri-crm-integration.php`

```php
<?php
/**
 * Plugin Name: Safiri CRM Integration
 * Description: Sends contact form submissions to SafiriTicket CRM
 * Version: 1.0.0
 * Author: Safiri Tickets
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class SafiriCRMIntegration {
    
    private $api_url = 'https://safiriticket.up.railway.app/api/leads';
    private $api_key = 'safiri-leads-2025-secure-key-change-in-production';
    private $source_website = 'safiritickets'; // Change to 'jungledwellers' for that site
    
    public function __construct() {
        // Hook into Contact Form 7
        add_action('wpcf7_mail_sent', array($this, 'handle_cf7_submission'), 10, 1);
        
        // Hook into WPForms
        add_action('wpforms_process_complete', array($this, 'handle_wpforms_submission'), 10, 4);
        
        // Hook into Gravity Forms
        add_action('gform_after_submission', array($this, 'handle_gravityforms_submission'), 10, 2);
        
        // Hook into Elementor Forms
        add_action('elementor_pro/forms/new_record', array($this, 'handle_elementor_submission'), 10, 2);
        
        // Generic hook for any form submission
        add_action('wp_ajax_nopriv_safiri_submit_lead', array($this, 'handle_ajax_submission'));
        add_action('wp_ajax_safiri_submit_lead', array($this, 'handle_ajax_submission'));
    }
    
    /**
     * Handle Contact Form 7 submissions
     */
    public function handle_cf7_submission($contact_form) {
        $submission = WPCF7_Submission::get_instance();
        if ($submission) {
            $posted_data = $submission->get_posted_data();
            $this->send_to_crm($posted_data);
        }
    }
    
    /**
     * Handle WPForms submissions
     */
    public function handle_wpforms_submission($fields, $entry, $form_data, $entry_id) {
        $formatted_data = array();
        foreach ($fields as $field_id => $field) {
            $formatted_data[$field['name']] = $field['value'];
        }
        $this->send_to_crm($formatted_data);
    }
    
    /**
     * Handle Gravity Forms submissions
     */
    public function handle_gravityforms_submission($entry, $form) {
        $formatted_data = array();
        foreach ($form['fields'] as $field) {
            $formatted_data[$field->label] = rgar($entry, $field->id);
        }
        $this->send_to_crm($formatted_data);
    }
    
    /**
     * Handle Elementor Forms submissions
     */
    public function handle_elementor_submission($record, $handler) {
        $form_data = $record->get('fields');
        $formatted_data = array();
        foreach ($form_data as $id => $field) {
            $formatted_data[$field['title']] = $field['value'];
        }
        $this->send_to_crm($formatted_data);
    }
    
    /**
     * Handle AJAX submissions
     */
    public function handle_ajax_submission() {
        $data = $_POST;
        $this->send_to_crm($data);
        wp_send_json_success(array('message' => 'Lead submitted successfully'));
    }
    
    /**
     * Send data to CRM API
     */
    private function send_to_crm($form_data) {
        // Map form fields to CRM format
        $lead_data = array(
            'name' => $this->get_field_value($form_data, array('name', 'your-name', 'Name', 'full_name', 'fullname')),
            'email' => $this->get_field_value($form_data, array('email', 'your-email', 'Email', 'email_address', 'e-mail')),
            'phone' => $this->get_field_value($form_data, array('phone', 'tel', 'Phone', 'phone_number', 'mobile', 'telephone')),
            'company' => $this->get_field_value($form_data, array('company', 'Company', 'organization', 'org')),
            'sourceWebsite' => $this->source_website,
            'message' => $this->get_field_value($form_data, array('message', 'Message', 'comment', 'comments', 'inquiry', 'your-message')),
            'metadata' => $this->extract_metadata($form_data)
        );
        
        // Validate required fields
        if (empty($lead_data['name']) || empty($lead_data['email'])) {
            error_log('Safiri CRM: Missing required fields (name or email)');
            return false;
        }
        
        // Send to CRM
        $response = wp_remote_post($this->api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->api_key
            ),
            'body' => json_encode($lead_data),
            'timeout' => 15,
            'sslverify' => true
        ));
        
        if (is_wp_error($response)) {
            error_log('Safiri CRM Error: ' . $response->get_error_message());
            return false;
        }
        
        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code === 201 || $response_code === 200) {
            error_log('Safiri CRM: Lead submitted successfully');
            return true;
        } else {
            $response_body = wp_remote_retrieve_body($response);
            error_log('Safiri CRM Error: HTTP ' . $response_code . ' - ' . $response_body);
            return false;
        }
    }
    
    /**
     * Get field value by trying multiple possible field names
     */
    private function get_field_value($data, $possible_keys) {
        foreach ($possible_keys as $key) {
            // Try exact match
            if (isset($data[$key])) {
                return sanitize_text_field($data[$key]);
            }
            // Try case-insensitive match
            foreach ($data as $data_key => $value) {
                if (strtolower($data_key) === strtolower($key)) {
                    return sanitize_text_field($value);
                }
            }
        }
        return '';
    }
    
    /**
     * Extract additional metadata from form
     */
    private function extract_metadata($form_data) {
        $metadata = array();
        $excluded_keys = array('name', 'email', 'phone', 'company', 'message', 'your-name', 'your-email', 'your-message', 'submit', '_wpcf7', '_wpcf7_version', '_wpcf7_locale', '_wpcf7_unit_tag', '_wpcf7_container_post');
        
        foreach ($form_data as $key => $value) {
            if (!in_array(strtolower($key), array_map('strtolower', $excluded_keys))) {
                $metadata[$key] = sanitize_text_field($value);
            }
        }
        
        return $metadata;
    }
}

// Initialize plugin
new SafiriCRMIntegration();
```

#### Step 2: Activate Plugin

1. Go to WordPress Admin → Plugins
2. Find "Safiri CRM Integration"
3. Click "Activate"

#### Step 3: Configure for Each Site

For `safiritickets.com`:
- Set `$source_website = 'safiritickets';` in the plugin file

For `jungledwellers.net`:
- Set `$source_website = 'jungledwellers';` in the plugin file

### Method 2: Functions.php (Quick Setup)

If you prefer not to create a plugin, add this code to your theme's `functions.php` file:

```php
// Safiri CRM Integration
function safiri_send_to_crm($form_data) {
    $api_url = 'https://safiriticket.up.railway.app/api/leads';
    $api_key = 'safiri-leads-2025-secure-key-change-in-production';
    $source = 'safiritickets'; // Change to 'jungledwellers' for that site
    
    $lead_data = array(
        'name' => sanitize_text_field($form_data['name'] ?? $form_data['your-name'] ?? ''),
        'email' => sanitize_email($form_data['email'] ?? $form_data['your-email'] ?? ''),
        'phone' => sanitize_text_field($form_data['phone'] ?? $form_data['tel'] ?? ''),
        'company' => sanitize_text_field($form_data['company'] ?? ''),
        'sourceWebsite' => $source,
        'message' => sanitize_textarea_field($form_data['message'] ?? $form_data['your-message'] ?? ''),
        'metadata' => array()
    );
    
    if (empty($lead_data['name']) || empty($lead_data['email'])) {
        return false;
    }
    
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'X-API-Key' => $api_key
        ),
        'body' => json_encode($lead_data),
        'timeout' => 15
    ));
    
    return !is_wp_error($response) && wp_remote_retrieve_response_code($response) === 201;
}

// Hook into Contact Form 7
add_action('wpcf7_mail_sent', function($contact_form) {
    $submission = WPCF7_Submission::get_instance();
    if ($submission) {
        safiri_send_to_crm($submission->get_posted_data());
    }
}, 10, 1);
```

### Method 3: Webhook Plugin (Easiest)

If you're using a form plugin that supports webhooks:

1. Install a webhook plugin (e.g., "WP Webhooks" or "Zapier")
2. Configure webhook URL: `https://safiriticket.up.railway.app/api/leads`
3. Add header: `X-API-Key: safiri-leads-2025-secure-key-change-in-production`
4. Map form fields to CRM format:
   - `name` → Name field
   - `email` → Email field
   - `phone` → Phone field
   - `company` → Company field
   - `message` → Message field
   - `sourceWebsite` → Set to `"safiritickets"` or `"jungledwellers"`

## Testing

### Test the Integration

1. Submit a test form on your WordPress site
2. Check the CRM admin panel → Leads section
3. Verify the lead appears with correct information

### Debugging

Check WordPress error logs:
- Location: `wp-content/debug.log` (if WP_DEBUG_LOG is enabled)
- Or check server error logs

Common issues:
- **401 Unauthorized**: Check API key is correct
- **400 Bad Request**: Verify required fields (name, email, sourceWebsite) are being sent
- **Connection timeout**: Check if the CRM API URL is accessible

## Field Mapping

The CRM expects these fields:

| CRM Field | WordPress Form Field Names (try these) |
|-----------|----------------------------------------|
| `name` | name, your-name, Name, full_name |
| `email` | email, your-email, Email, email_address |
| `phone` | phone, tel, Phone, phone_number, mobile |
| `company` | company, Company, organization |
| `message` | message, Message, comment, your-message, inquiry |
| `sourceWebsite` | Always set to "safiritickets" or "jungledwellers" |
| `metadata` | All other form fields go here |

## Security Notes

1. **Change the API Key**: Update `LEAD_API_KEY` in `.env` and in WordPress code
2. **Use HTTPS**: Always use HTTPS for API calls
3. **Validate Input**: WordPress sanitization functions are used in the plugin
4. **Rate Limiting**: Consider adding rate limiting if needed

## Next Steps

1. Install and activate the plugin on both WordPress sites
2. Configure the `$source_website` variable for each site
3. Test form submissions
4. Monitor the CRM Leads section for incoming leads
5. Convert leads to clients as needed

## Support

If you encounter issues:
1. Check WordPress error logs
2. Verify API endpoint is accessible: `https://safiriticket.up.railway.app/api/leads`
3. Test API directly using cURL or Postman
4. Check CRM server logs for incoming requests

