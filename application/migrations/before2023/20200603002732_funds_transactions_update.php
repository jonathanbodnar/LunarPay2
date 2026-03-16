<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_funds_transactions_update extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('ALTER TABLE `transactions_funds`
	ADD COLUMN `subscription_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `transaction_id`,
	CHANGE COLUMN `amount` `amount` DECIMAL(15,2) NULL DEFAULT NULL AFTER `fund_id`,
	CHANGE COLUMN `fee` `fee` DECIMAL(15,2) NULL DEFAULT NULL AFTER `amount`,
	ADD COLUMN `net` DECIMAL(15,2) NULL DEFAULT NULL AFTER `fee`,
	DROP INDEX `fund_id`,
	ADD INDEX `fund_id` (`fund_id`),
	ADD INDEX `subscription_id` (`subscription_id`);

');
        
        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
