<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoices_add_payment_method extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoices_add_payment_method</p>");

        $sql = "ALTER TABLE `invoices` 
                ADD `payment_method_id` INT NULL DEFAULT NULL 
                COMMENT 'Used for auto charge the customer' 
                AFTER `subscription_id`,
                ADD INDEX `payment_method_idx` (`payment_method_id`)";
        $this->db->query($sql);
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
