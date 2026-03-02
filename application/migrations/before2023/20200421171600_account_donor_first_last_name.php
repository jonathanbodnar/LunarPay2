<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_account_donor_first_last_name extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE chatgive.account_donor DROP COLUMN  first_last_name;');
        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `first_name` varchar(45) NULL DEFAULT NULL;');
        $this->db->query('ALTER TABLE chatgive.account_donor ADD COLUMN `last_name` varchar(45) NULL DEFAULT NULL;');
        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
