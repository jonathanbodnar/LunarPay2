<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_Add_metadata_to_account_donor extends CI_Migration {

    public function up() {
        // Add metadata column to account_donor table
        $this->db->query("
            ALTER TABLE `account_donor` 
            ADD COLUMN `metadata` TEXT NULL DEFAULT NULL 
            COMMENT 'JSON metadata for customer, for example when created from api' 
            AFTER `created_from`
        ");

        echo "Migration: Added metadata field to account_donor table\n";
    }

    public function down() {
        
    }
} 