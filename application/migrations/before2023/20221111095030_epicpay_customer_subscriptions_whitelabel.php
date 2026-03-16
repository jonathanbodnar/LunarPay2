<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_epicpay_customer_subscriptions_whitelabel extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_epicpay_customer_subscriptions_whitelabel</p>");

        $this->db->query("ALTER TABLE epicpay_customer_subscriptions 
ADD COLUMN `white_label_tag` VARCHAR(64) NULL DEFAULT NULL AFTER `payment_link_products_id`;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
