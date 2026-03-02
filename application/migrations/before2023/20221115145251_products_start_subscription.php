<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_products_start_subscription extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_products_start_subscription</p>");
        
        $this->db->query("ALTER TABLE products ADD start_subscription CHAR(1) NOT NULL DEFAULT 'D' AFTER custom_date");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
