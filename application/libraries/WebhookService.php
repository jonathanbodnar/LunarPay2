<?php

defined('BASEPATH') or exit('No direct script access allowed');

class WebhookService
{
    private $CI;

    public function __construct()
    {
        $this->CI = &get_instance();
        $this->CI->load->model('api_merchant_credentials_model');
    }

    /**
     * Send webhook to merchant endpoints
     */
    public function sendWebhook($client_id, $event_type, $data)
    {
        try {
            // Get merchant's webhook configuration
            $webhook_config = $this->CI->api_merchant_credentials_model->getWebhookConfig($client_id);
            
            if (!$webhook_config || !isset($webhook_config[$event_type])) {
                log_custom(LOG_CUSTOM_INFO, "No webhook configured for event: $event_type, client_id: $client_id");
                return false;
            }

            $webhook_data = $webhook_config[$event_type];
            
            if (!isset($webhook_data['enabled']) || !$webhook_data['enabled']) {
                log_custom(LOG_CUSTOM_INFO, "Webhook disabled for event: $event_type, client_id: $client_id");
                return false;
            }

            // Prepare webhook payload
            $payload = [
                'event_type' => $event_type,
                'timestamp' => date('c'),
                'client_id' => $client_id,
                'data' => $data
            ];

            // Send webhook
            $result = $this->sendHttpRequest($webhook_data['url'], $payload);
            
            if ($result['success']) {
                log_custom(LOG_CUSTOM_INFO, "Webhook sent successfully for event: $event_type, client_id: $client_id, url: {$webhook_data['url']}");
            } else {
                log_custom(LOG_CUSTOM_ERROR, "Webhook failed for event: $event_type, client_id: $client_id, url: {$webhook_data['url']}, error: {$result['error']}");
            }

            return $result['success'];

        } catch (Exception $e) {
            log_custom(LOG_CUSTOM_ERROR, "Webhook exception for event: $event_type, client_id: $client_id, error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send webhook for subscription created event types
     */
    public function sendSubscription($client_id, $subscription_data, $webhook_type)
    {
        if (!in_array($webhook_type, ['subscription_created', 'subscription_updated'])) {
            throw new InvalidArgumentException("Invalid webhook type: $webhook_type");
            return false;
        }

        if(!in_array($subscription_data['c_status'], ['active', 'on_trial', 'cancelled', 'unpaid'])) {
            throw new InvalidArgumentException("Invalid subscription c_status: " . $subscription_data["c_status"]);
            return false;
        }
        
        $webhook_data = [
            'customer_id' => $subscription_data['account_donor_id'],
            'subscription_id' => $subscription_data['id'],
            'plan_type' => $this->getPlanType($subscription_data['payment_link_products_id']),
            'billing_cycle' => $subscription_data['frequency'],
            'amount' => $subscription_data['amount'],
            'start_date' => $subscription_data['start_on'],
            'next_payment_on' => $subscription_data['next_payment_on'],
            'customer_email' => $subscription_data['email'],
            'customer_name' => $subscription_data['first_name'] . ' ' . $subscription_data['last_name'],
            'c_status' => $subscription_data['c_status'],
            'status' => $subscription_data['status'],
            'trial_ends_at' => $subscription_data['trial_ends_at'], // Will be set if this is a trial subscription
            'ends_at' => $subscription_data['ends_at'],
            'trial_status' => $subscription_data['trial_status'],
            'last_transaction_id' => $subscription_data['last_transaction_id'],
            'access_period_status' => $subscription_data['access_period_status'],
            'created_as_trial' => $subscription_data['created_as_trial'],
        ];

        $currentState = [
            'c_status' => $subscription_data['c_status'],
            'trial_status' => $subscription_data['trial_status'],
            'access_period_status' => $subscription_data['access_period_status'],
            'sent_at' => date('Y-m-d H:i:s'),
        ];

        $log = json_decode($subscription_data['webhook_sent_log'] ?? '[]', true); //array

        array_unshift($log, $currentState);

        $saveData['webhook_sent_log'] = json_encode($log, JSON_PRETTY_PRINT);
        $saveData['webhook_last_state_sent'] = json_encode($currentState, JSON_PRETTY_PRINT);
        $saveData['updated_at'] = date('Y-m-d H:i:s');
        
        if($webhook_data['c_status'] == 'cancelled' && $webhook_data['access_period_status'] == 'ended') { // formula for closing subscriptions webhooks firing
            $saveData['webhook_closed'] = 1;
        }

        $this->CI->db->where('id', $subscription_data['id']);
        $this->CI->db->update('epicpay_customer_subscriptions', $saveData);
        
        return $this->sendWebhook($client_id, $webhook_type, $webhook_data);
    }

    /**
     * Send HTTP request to webhook endpoint
     */
    private function sendHttpRequest($url, $payload)
    {
        // Get bearer token from merchant configuration
        $bearerToken = $this->getWebhookApiKey($payload['client_id'] ?? null);
        
        // Determine webhook type based on event_type
        $webhookType = $this->determineWebhookType($payload['event_type']);
        
        // Generate unique event ID
        $eventId = uniqid('webhook_', true);
        
        // Prepare webhook log data
        $webhookLogData = [
            'webhook_type' => $webhookType,
            'client_id' => $payload['client_id'] ?? '',
            'status' => 'pending',
            'retry_count' => 0,
            'max_retries' => 3,
            'next_retry_at' => null,
            'last_attempt_at' => date('Y-m-d H:i:s'),
            'payload' => json_encode($payload),
            'response_body' => null,
            'http_status_code' => null,
            'error_message' => null,
            'webhook_url' => $url,
            'event_type' => $payload['event_type'],
            'event_id' => $eventId
        ];
        
        // Insert initial webhook log record
        $this->CI->db->insert('webhook_sent_logs', $webhookLogData);
        $webhookLogId = $this->CI->db->insert_id();

        $payload['webhook_id'] = $webhookLogId;
        
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: LunarPay-Webhook/1.0',
            'X-LunarPay-Event: ' . $payload['event_type'],
            'X-LunarPay-Timestamp: ' . $payload['timestamp'],
            'Authorization: Bearer ' . $bearerToken
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);        
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Determine success status
        $success = !$error && $http_code >= 200 && $http_code < 300;
        
        // Update webhook log with results
        $updateData = [
            'status' => $success ? 'success' : 'failed',
            'response_body' => $response,
            'http_status_code' => $http_code,
            'error_message' => $error ?: (!$success ? "HTTP $http_code" : null),
            'last_attempt_at' => date('Y-m-d H:i:s')
        ];
        
        // If failed and retries are allowed, set next retry time (but don't increment retry_count yet)
        if (!$success && $webhookLogData['retry_count'] < $webhookLogData['max_retries']) {
            $updateData['next_retry_at'] = $this->calculateNextRetryTime(1); // First retry will be attempt #1
        }
        
        $this->CI->db->where('id', $webhookLogId);
        $this->CI->db->update('webhook_sent_logs', $updateData);

        if ($error) {
            return [
                'success' => false,
                'error' => $error,
                'http_code' => null,
                'response' => null
            ];
        }

        return [
            'success' => $success,
            'error' => $success ? null : "HTTP $http_code",
            'http_code' => $http_code,
            'response' => $response
        ];
    }

    /**
     * Determine webhook type based on event type
     */
    private function determineWebhookType($eventType)
    {
        if (strpos($eventType, 'subscription') !== false) {
            return 'sub';
        }
        
        if (strpos($eventType, 'payment') !== false) {
            return 'payment';
        }
        
        // Default to 'other' for unknown types
        return 'other';
    }

    /**
     * Calculate next retry time using exponential backoff
     */
    private function calculateNextRetryTime($retryCount)
    {
        // Exponential backoff: 1min, 5min, 15min
        $delays = [1, 5, 15]; // minutes
        
        $delayIndex = min($retryCount - 1, count($delays) - 1);
        $delayMinutes = $delays[$delayIndex];
        
        return date('Y-m-d H:i:s', strtotime("+{$delayMinutes} minutes"));
    }

    /**
     * Get webhook API key from merchant configuration
     */
    private function getWebhookApiKey($client_id)
    {
        if (!$client_id) {
            return '';
        }
        
        $webhook_config = $this->CI->api_merchant_credentials_model->getWebhookConfig($client_id);
        
        if (!$webhook_config || !isset($webhook_config['bearer_token'])) {
            return '';
        }
        
        return $webhook_config['bearer_token'];
    }

    /**
     * Get plan name from subscription data using FortisLib method
     */
    private function getPlanType($payment_link_products_id)
    {
        // Use the centralized method from FortisLib
        $this->CI->load->library('gateways/FortisLib');
        $fortisLib = new FortisLib();
        
        return $fortisLib->getPlanType($payment_link_products_id);
    }
} 