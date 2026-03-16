<?php
defined('BASEPATH') or exit('No direct script access allowed');

class Api_merchant_credentials_model extends CI_Model
{
    private $table = 'api_merchant_credentials';

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Find record by API key
     */
    public function findByKey($api_key)
    {
        $data =  $this->db->select('*')
            ->where('api_key', $api_key)
            ->get($this->table)
            ->row();

        return $data;
    }

    /**
     * Find record by client ID
     */
    public function findByClientId($client_id)
    {
        $data = $this->db->select('*')
            ->where('client_id', $client_id)
            ->get($this->table)
            ->row();

        return $data;
    }

    /**
     * Get webhook configuration for a client
     */
    public function getWebhookConfig($client_id)
    {
        $record = $this->findByClientId($client_id);
        
        if (!$record || !$record->webhook_config) {
            return null;
        }

        return json_decode($record->webhook_config, true);
    }

    /**
     * Set webhook configuration for a client
     */
    public function setWebhookConfig($client_id, $webhook_config)
    {
        $record = $this->findByClientId($client_id);
        
        if (!$record) {
            throw new Exception('Merchant credentials not found for client ID: ' . $client_id);
        }

        // If webhook_config is already a JSON string, use it directly
        if (is_string($webhook_config)) {
            $json_data = $webhook_config;
        } else {
            // Otherwise, encode with pretty formatting
            $json_data = json_encode($webhook_config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }

        $data = [
            'webhook_config' => $json_data,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $this->db->where('id', $record->id)
            ->update($this->table, $data);

        return true;
    }

    /**
     * Create or update credentials by client_id
     */
    public function createOrUpdate($clientId)
    {
        $this->load->model('user_model');
        $merchant = $this->user_model->get($clientId);

        if (!$merchant) {
            throw new Exception('Merchant user not found');
        }

        // Generate keys
        $api_key = bin2hex(random_bytes(16));
        $api_secret_raw = bin2hex(random_bytes(32));
        $api_secret_hash = password_hash($api_secret_raw, PASSWORD_DEFAULT);

        $existing = $this->db
            ->where('client_id', $clientId)
            ->get($this->table)
            ->row();

        $data = [
            'client_id' => $clientId,
            'api_key' => $api_key,
            'api_secret_hash' => $api_secret_hash,
            'webhook_config' => null, // Initialize with null
            'created_at' => date('Y-m-d H:i:s')
        ];

        if ($existing) {
            $this->db
                ->where('id', $existing->id)
                ->update($this->table, $data);
            $id = $existing->id;
        } else {
            $this->db->insert($this->table, $data);
        }

        return [
            'merchant_user_id' => $clientId,
            'credentials' => [
                'api_key' => $api_key,
                'api_secret' => $api_secret_raw
            ],
            'message' => 'Api secret is revealed only once, keep it safe'
        ];
    }
}
