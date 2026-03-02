<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_invoice_subscription_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_invoice_subscription_id</p>");

        $this->db->query("ALTER TABLE `invoices` ADD `subscription_id` INT NULL AFTER `post_purchase_link`, ADD INDEX `subscription_id_index` (`subscription_id`);
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
