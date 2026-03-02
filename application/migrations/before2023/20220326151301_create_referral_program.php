<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_referral_program extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_create_referral_table</p>");

        $this->db->query("CREATE TABLE `referals` (
          `id` int NOT NULL AUTO_INCREMENT,
          `parent_id` int NOT NULL,
          `user_id` int DEFAULT NULL,
          `email` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
          `full_name` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
          `referal_message` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
          `date_sent` datetime DEFAULT CURRENT_TIMESTAMP,
          `date_register` datetime DEFAULT NULL,
          PRIMARY KEY (`id`),
          KEY `parent_id` (`parent_id`)
        ) ENGINE=InnoDB COLLATE 'utf8_general_ci' ");
        
        $this->db->query("ALTER TABLE `users`
        ADD `zelle_account_id` varchar(200) COLLATE 'utf8_general_ci' NULL,
        ADD `zelle_social_security` varchar(200) COLLATE 'utf8_general_ci' NULL AFTER `zelle_account_id`;");
        
        $this->db->query("ALTER TABLE `users`
        ADD `referral_code` varchar(200) COLLATE 'utf8_general_ci' NULL;");
        
        $this->db->query("ALTER TABLE `users`
        ADD INDEX `referral_code` (`referral_code`);");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
