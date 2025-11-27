<?php
/**
 * Plugin Name: Safiri CRM Integration
 * Description: Sends contact form submissions to SafiriTicket CRM
 * Version: 1.0.0
 * Author: Safiri Tickets
 * Text Domain: safiri-crm
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
        
        // Hook into BitForms (most important for safiritickets.com)
        add_action('bitforms_form_submission_complete', array($this, 'handle_bitforms_submission'), 10, 3);
        add_action('bitforms_after_form_submit', array($this, 'handle_bitforms_submission_alt'), 10, 2);
        
        // Generic hook for any form submission
        add_action('wp_ajax_nopriv_safiri_submit_lead', array($this, 'handle_ajax_submission'));
        add_action('wp_ajax_safiri_submit_lead', array($this, 'handle_ajax_submission'));
        
        // Add admin settings page
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add admin settings page
     */
    public function add_admin_menu() {
        add_options_page(
            'Safiri CRM Settings',
            'Safiri CRM',
            'manage_options',
            'safiri-crm',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('safiri_crm_settings', 'safiri_crm_api_url');
        register_setting('safiri_crm_settings', 'safiri_crm_api_key');
        register_setting('safiri_crm_settings', 'safiri_crm_source_website');
        
        // Load saved settings
        $saved_url = get_option('safiri_crm_api_url');
        $saved_key = get_option('safiri_crm_api_key');
        $saved_source = get_option('safiri_crm_source_website');
        
        if ($saved_url) $this->api_url = $saved_url;
        if ($saved_key) $this->api_key = $saved_key;
        if ($saved_source) $this->source_website = $saved_source;
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Safiri CRM Integration Settings</h1>
            <form method="post" action="options.php">
                <?php settings_fields('safiri_crm_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="safiri_crm_api_url">API URL</label>
                        </th>
                        <td>
                            <input type="url" id="safiri_crm_api_url" name="safiri_crm_api_url" 
                                   value="<?php echo esc_attr(get_option('safiri_crm_api_url', $this->api_url)); ?>" 
                                   class="regular-text" required>
                            <p class="description">CRM API endpoint URL</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="safiri_crm_api_key">API Key</label>
                        </th>
                        <td>
                            <input type="text" id="safiri_crm_api_key" name="safiri_crm_api_key" 
                                   value="<?php echo esc_attr(get_option('safiri_crm_api_key', $this->api_key)); ?>" 
                                   class="regular-text" required>
                            <p class="description">API key for authentication</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="safiri_crm_source_website">Source Website</label>
                        </th>
                        <td>
                            <select id="safiri_crm_source_website" name="safiri_crm_source_website" required>
                                <option value="safiritickets" <?php selected(get_option('safiri_crm_source_website', $this->source_website), 'safiritickets'); ?>>Safiri Tickets</option>
                                <option value="jungledwellers" <?php selected(get_option('safiri_crm_source_website', $this->source_website), 'jungledwellers'); ?>>Jungle Dwellers</option>
                            </select>
                            <p class="description">Which website is this? (Used to track lead source)</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <hr>
            <h2>Test Integration</h2>
            <p>Test the connection to the CRM:</p>
            <button type="button" id="test-crm-connection" class="button">Test Connection</button>
            <div id="test-result" style="margin-top: 10px;"></div>
            
            <script>
            document.getElementById('test-crm-connection').addEventListener('click', function() {
                var resultDiv = document.getElementById('test-result');
                resultDiv.innerHTML = '<p>Testing...</p>';
                
                fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'action=safiri_test_connection'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resultDiv.innerHTML = '<p style="color: green;">✓ Connection successful!</p>';
                    } else {
                        resultDiv.innerHTML = '<p style="color: red;">✗ Connection failed: ' + (data.message || 'Unknown error') + '</p>';
                    }
                })
                .catch(error => {
                    resultDiv.innerHTML = '<p style="color: red;">✗ Error: ' + error.message + '</p>';
                });
            });
            </script>
        </div>
        <?php
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
     * Handle BitForms submissions (Primary for safiritickets.com)
     */
    public function handle_bitforms_submission($form_id, $entry_id, $form_data) {
        // BitForms stores data in a specific format
        $formatted_data = array();
        
        if (is_array($form_data)) {
            foreach ($form_data as $key => $value) {
                // BitForms may use field keys or labels
                $formatted_data[$key] = $value;
            }
        }
        
        $this->send_to_crm($formatted_data);
    }
    
    /**
     * Alternative BitForms hook
     */
    public function handle_bitforms_submission_alt($form_id, $entry_data) {
        if (is_array($entry_data)) {
            $this->send_to_crm($entry_data);
        }
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
        // Load settings
        $api_url = get_option('safiri_crm_api_url', $this->api_url);
        $api_key = get_option('safiri_crm_api_key', $this->api_key);
        $source = get_option('safiri_crm_source_website', $this->source_website);
        
        // For BitForms, combine first name and last name
        $first_name = $this->get_field_value($form_data, array('First name', 'first_name', 'firstname', 'fname', 'First Name'));
        $last_name = $this->get_field_value($form_data, array('Last name', 'last_name', 'lastname', 'lname', 'Last Name'));
        $full_name = trim($first_name . ' ' . $last_name);
        if (empty($full_name)) {
            $full_name = $this->get_field_value($form_data, array('name', 'your-name', 'Name', 'full_name', 'fullname'));
        }
        
        // Map form fields to CRM format
        $lead_data = array(
            'name' => $full_name,
            'email' => $this->get_field_value($form_data, array('Email address', 'email', 'your-email', 'Email', 'email_address', 'e-mail')),
            'phone' => $this->get_field_value($form_data, array('Phone Number', 'phone', 'tel', 'Phone', 'phone_number', 'mobile', 'telephone')),
            'company' => $this->get_field_value($form_data, array('company', 'Company', 'organization', 'org')),
            'sourceWebsite' => $source,
            'message' => $this->get_field_value($form_data, array('Tell Us About Your Project:', 'message', 'Message', 'comment', 'comments', 'inquiry', 'your-message', 'Additional Information:', 'Additional Information')),
            'metadata' => $this->extract_metadata($form_data)
        );
        
        // Validate required fields
        if (empty($lead_data['name']) || empty($lead_data['email'])) {
            error_log('Safiri CRM: Missing required fields (name or email)');
            return false;
        }
        
        // Send to CRM
        $response = wp_remote_post($api_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $api_key
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
            error_log('Safiri CRM: Lead submitted successfully - ' . $lead_data['email']);
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
        $excluded_keys = array('name', 'email', 'phone', 'company', 'message', 'your-name', 'your-email', 'your-message', 'submit', '_wpcf7', '_wpcf7_version', 'wpcf7_locale', '_wpcf7_unit_tag', '_wpcf7_container_post', '_wpnonce', 'action');
        
        foreach ($form_data as $key => $value) {
            $key_lower = strtolower($key);
            $excluded = false;
            foreach ($excluded_keys as $excluded) {
                if ($key_lower === strtolower($excluded)) {
                    $excluded = true;
                    break;
                }
            }
            if (!$excluded && !empty($value)) {
                $metadata[$key] = sanitize_text_field($value);
            }
        }
        
        return $metadata;
    }
}

// Initialize plugin
new SafiriCRMIntegration();

// Add test connection AJAX handler
add_action('wp_ajax_safiri_test_connection', function() {
    $api_url = get_option('safiri_crm_api_url', 'https://safiriticket.up.railway.app/api/leads');
    $api_key = get_option('safiri_crm_api_key', 'safiri-leads-2025-secure-key-change-in-production');
    
    $test_data = array(
        'name' => 'Test Connection',
        'email' => 'test@example.com',
        'sourceWebsite' => get_option('safiri_crm_source_website', 'safiritickets'),
        'message' => 'This is a test connection from WordPress'
    );
    
    $response = wp_remote_post($api_url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'X-API-Key' => $api_key
        ),
        'body' => json_encode($test_data),
        'timeout' => 10,
        'sslverify' => true
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error(array('message' => $response->get_error_message()));
    } else {
        $code = wp_remote_retrieve_response_code($response);
        if ($code === 201 || $code === 200) {
            wp_send_json_success(array('message' => 'Connection successful!'));
        } else {
            $body = wp_remote_retrieve_body($response);
            wp_send_json_error(array('message' => 'HTTP ' . $code . ': ' . $body));
        }
    }
});

