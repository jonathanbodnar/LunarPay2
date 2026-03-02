<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_products_subscription_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_products_subscription_fields</p>");

        $this->db->query("ALTER TABLE products ADD COLUMN recurrence char(1) DEFAULT 'O' NULL COMMENT 'O = one_time , R = recurring'
                          , ADD COLUMN  billing_period varchar(30) NULL;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
