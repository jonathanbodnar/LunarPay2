<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_account_donor_add_field_acums_last_dates extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `amount_acum` decimal (15,2) DEFAULT 0.0;');
        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `fee_acum` decimal (15,2) DEFAULT 0.0;');
        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `last_donation_date` DATETIME NULL;');

        printd(get_class($this) . '<br>');
        
    }

    public function down() {
        
    }

}
