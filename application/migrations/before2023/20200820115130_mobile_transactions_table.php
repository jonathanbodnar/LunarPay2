<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_mobile_transactions_table extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("CREATE TABLE `mobile_transaction` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`mobile_no` VARCHAR(20) NOT NULL,
	`donarid` INT(11) NOT NULL,
	`church_id` INT(11) NOT NULL,
	`amount` FLOAT NOT NULL,
	`giving_type` VARCHAR(30) NOT NULL,
	`source_name` VARCHAR(20) NOT NULL,
	`date_time` DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
	`sourceid` VARCHAR(50) NOT NULL,
	`active` TINYINT(1) NOT NULL DEFAULT 1,
	PRIMARY KEY (`id`)
)
ENGINE=InnoDB
;
");

        printd(get_class($this));

        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
