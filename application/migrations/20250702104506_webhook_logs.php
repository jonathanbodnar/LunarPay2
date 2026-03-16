<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_webhook_logs extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_webhook_logs</p>");

        $this->db->query("
            CREATE TABLE `webhook_sent_logs` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `webhook_type` varchar(50) NOT NULL COMMENT 'Type of webhook (sub, payment, etc.)',
                `client_id` varchar(255) NOT NULL COMMENT 'Client identifier',
                `status` enum('pending','success','failed','retrying') NOT NULL DEFAULT 'pending' COMMENT 'Current status of webhook delivery',
                `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of retry attempts made',
                `max_retries` int(11) NOT NULL DEFAULT 3 COMMENT 'Maximum number of retries allowed',
                `next_retry_at` datetime NULL COMMENT 'When to attempt next retry',
                `last_attempt_at` datetime NULL COMMENT 'When last attempt was made',
                `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When webhook was first created',
                `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'When record was last updated',
                `payload` longtext NOT NULL COMMENT 'Webhook payload (sanitized, no sensitive data)',
                `response_body` longtext NULL COMMENT 'Response body from webhook endpoint',
                `http_status_code` int(11) NULL COMMENT 'HTTP status code from response',
                `error_message` text NULL COMMENT 'Error message if webhook failed',
                `webhook_url` varchar(500) NOT NULL COMMENT 'Target webhook URL',
                `event_type` varchar(100) NOT NULL COMMENT 'Type of event (subscription.created, etc.)',
                `event_id` varchar(255) NULL COMMENT 'Unique identifier for the event',
                PRIMARY KEY (`id`),
                KEY `idx_webhook_type` (`webhook_type`),
                KEY `idx_client_id` (`client_id`),
                KEY `idx_status` (`status`),
                KEY `idx_next_retry` (`next_retry_at`),
                KEY `idx_created_at` (`created_at`),
                KEY `idx_status_retry` (`status`, `next_retry_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Webhook delivery logs with retry support';
        ");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        $this->db->query("DROP TABLE IF EXISTS `webhook_logs`;");
    }

} 