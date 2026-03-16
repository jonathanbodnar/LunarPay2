<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Developers extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);
    }

    /**
     * Get API credentials for the current user
     */
    public function get_api_credentials()
    {
        try {
            $this->load->model('api_merchant_credentials_model');
            $user_id = $this->session->userdata('user_id');
            
            $credentials = $this->api_merchant_credentials_model->findByClientId($user_id);
            
            if (!$credentials) {
                output_json(['status' => false, 'message' => 'No API credentials found']);
                return;
            }

            // Mask the API secret for security
            $masked_secret = $credentials->api_secret_hash ? '••••••••••••••••••••••••••••••••' : null;
            
            $response = [
                'status' => true,
                'data' => [
                    'api_key' => $credentials->api_key,
                    'api_secret' => $masked_secret,
                    'has_secret' => !empty($credentials->api_secret_hash),
                    'created_at' => $credentials->created_at,
                    'updated_at' => $credentials->updated_at
                ]
            ];

            output_json($response);
        } catch (Exception $ex) {
            output_json(['status' => false, 'message' => $ex->getMessage()]);
        }
    }

    /**
     * Generate new API credentials
     */
    public function generate_api_credentials()
    {
        try {
            $this->load->model('api_merchant_credentials_model');
            $user_id = $this->session->userdata('user_id');
            
            $result = $this->api_merchant_credentials_model->createOrUpdate($user_id);
            
            output_json(['status' => true, 'data' => $result]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'message' => $ex->getMessage()]);
        }
    }

    /**
     * Get webhook configuration
     */
    public function get_webhook_config()
    {
        try {
            $this->load->model('api_merchant_credentials_model');
            $user_id = $this->session->userdata('user_id');
            
            $config = $this->api_merchant_credentials_model->getWebhookConfig($user_id);
            
            // Initialize default structure if no config exists
            if (!$config) {
                $config = [
                    'bearer_token' => null,
                    'subscription_created' => [
                        'enabled' => false,
                        'url' => ''
                    ],
                    'subscription_updated' => [
                        'enabled' => false,
                        'url' => ''
                    ]
                ];
            }

            // Mask the bearer token for security
            if (isset($config['bearer_token']) && $config['bearer_token']) {
                $config['bearer_token_masked'] = '••••••••••••••••••••••••••••••••';
                $config['has_bearer_token'] = true;
            } else {
                $config['bearer_token_masked'] = null;
                $config['has_bearer_token'] = false;
            }

            output_json(['status' => true, 'data' => $config]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'message' => $ex->getMessage()]);
        }
    }

    /**
     * Generate new bearer token
     */
    public function generate_bearer_token()
    {
        try {
            $this->load->model('api_merchant_credentials_model');
            $user_id = $this->session->userdata('user_id');
            
            // Check if API credentials exist first
            $credentials = $this->api_merchant_credentials_model->findByClientId($user_id);
            if (!$credentials) {
                output_json(['status' => false, 'message' => 'You must create API credentials first before generating a bearer token.']);
                return;
            }
            
            // Generate a new bearer token
            $bearer_token = 'lpwhkey_' . bin2hex(random_bytes(24));
            
            // Get current webhook config
            $current_config = $this->api_merchant_credentials_model->getWebhookConfig($user_id) ?: [];
            
            // Update with new bearer token
            $current_config['bearer_token'] = $bearer_token;
            
            // Save the updated config (will be pretty-formatted by the model)
            $this->api_merchant_credentials_model->setWebhookConfig($user_id, $current_config);
            
            output_json(['status' => true, 'data' => ['bearer_token' => $bearer_token]]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'message' => $ex->getMessage()]);
        }
    }

    /**
     * Save webhook configuration
     */
    public function save_webhook_config()
    {
        try {
            $this->load->model('api_merchant_credentials_model');
            $user_id = $this->session->userdata('user_id');
            
            // Check if API credentials exist first
            $credentials = $this->api_merchant_credentials_model->findByClientId($user_id);
            if (!$credentials) {
                output_json(['status' => false, 'message' => 'You must create API credentials first before configuring webhooks.']);
                return;
            }
            
            // Get current config to preserve bearer token
            $current_config = $this->api_merchant_credentials_model->getWebhookConfig($user_id) ?: [];

            if(!isset($current_config['bearer_token']) && empty($current_config['bearer_token'])) {
                output_json(['status' => false, 'message' => 'You must generate a bearer webhook token before configuring webhooks.']);
                return;
            }
            
            $webhook_enabled = $this->input->post('webhook_enabled') === 'true';
            $webhook_url = trim($this->input->post('webhook_url'));
            
            // Validate URL if webhook is enabled
            $errors = [];
            
            if ($webhook_enabled) {
                if (empty($webhook_url)) {
                    $errors[] = 'Webhook URL is required when enabled.';
                } else {
                    $url_validation = $this->validateWebhookUrl($webhook_url);
                    if (!$url_validation['valid']) {
                        $errors[] = 'Webhook URL: ' . $url_validation['message'];
                    }
                }
            }
            
            // If there are validation errors, return them
            if (!empty($errors)) {
                output_json(['status' => false, 'message' => implode(' ', $errors)]);
                return;
            }
            
            // Set both events to the same configuration
            $subscription_created = [
                'enabled' => $webhook_enabled,
                'url' => $webhook_url
            ];
            
            $subscription_updated = [
                'enabled' => $webhook_enabled,
                'url' => $webhook_url
            ];

            $webhook_config = [
                'bearer_token' => $current_config['bearer_token'] ?? null,
                'subscription_created' => $subscription_created,
                'subscription_updated' => $subscription_updated
            ];

            // Save the webhook config (will be pretty-formatted by the model)
            $this->api_merchant_credentials_model->setWebhookConfig($user_id, $webhook_config);
            
            output_json(['status' => true, 'message' => 'Webhook configuration saved successfully']);
        } catch (Exception $ex) {
            output_json(['status' => false, 'message' => $ex->getMessage()]);
        }
    }

    /**
     * Validate webhook URL
     */
    private function validateWebhookUrl($url)
    {
        // Check if URL is empty
        if (empty($url)) {
            return ['valid' => false, 'message' => 'URL cannot be empty.'];
        }
        
        // Check if URL starts with https://
        if (!IS_DEVELOPER_MACHINE && !preg_match('/^https:\/\//', $url)) {
            return ['valid' => false, 'message' => 'URL must use HTTPS protocol (https://).'];
        }
        
        // Validate URL format
        if (!IS_DEVELOPER_MACHINE && !filter_var($url, FILTER_VALIDATE_URL)) {
            return ['valid' => false, 'message' => 'Invalid URL format.'];
        }
        
        // Check URL length (reasonable limit)
        if (strlen($url) > 500) {
            return ['valid' => false, 'message' => 'URL is too long (maximum 500 characters).'];
        }
        
        // Check for common invalid characters or patterns
        if (preg_match('/[<>"\']/', $url)) {
            return ['valid' => false, 'message' => 'URL contains invalid characters.'];
        }
        
        // Additional security check - ensure it's a proper web URL
        $parsed_url = parse_url($url);
        if (!isset($parsed_url['host']) || empty($parsed_url['host'])) {
            return ['valid' => false, 'message' => 'Invalid URL host.'];
        }
        
        return ['valid' => true, 'message' => 'URL is valid.'];
    }
   
} 