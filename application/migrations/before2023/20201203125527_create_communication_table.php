<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_communication_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE IF NOT EXISTS `communication` (
                          `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                          `sid` varchar(128) NOT NULL DEFAULT '0',
                          `user_id` int(11) DEFAULT NULL,
                          `client_id` int(11) DEFAULT NULL,
                          `from` varchar(128) DEFAULT NULL,
                          `to` varchar(128) DEFAULT NULL,
                          `text` mediumtext DEFAULT NULL,
                          `direction` char(1) DEFAULT NULL COMMENT 'S sent R received',
                          `sms_status` varchar(32) DEFAULT NULL,
                          `message_status` varchar(32) DEFAULT NULL,
                          `received_payload` text DEFAULT NULL,
                          `created_at` datetime DEFAULT current_timestamp(),
                          `callback_at` datetime DEFAULT NULL,
                          PRIMARY KEY (`id`),
                          KEY `user_id` (`user_id`),
                          KEY `client_id` (`client_id`),
                          KEY `sid` (`sid`),
                          KEY `sms_status` (`sms_status`),
                          KEY `from` (`from`),
                          KEY `to` (`to`)
                        );");
        
        echo "Migration_create_communication_table";
        
        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
