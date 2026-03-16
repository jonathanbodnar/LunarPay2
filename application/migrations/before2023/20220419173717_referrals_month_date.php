<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_referrals_month_date extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_referrals_month_date</p>");

        $this->db->query("ALTER TABLE `payment_affiliates`
	ADD COLUMN `date_month_covered` DATE NULL DEFAULT NULL AFTER `amount`;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
