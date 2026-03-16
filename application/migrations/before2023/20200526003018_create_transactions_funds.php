<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_transactions_funds extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('CREATE TABLE `transactions_funds` (
                              `id` int(11) unsigned NOT NULL,
                              `transaction_id` int(10) unsigned DEFAULT NULL,
                              `fund_id` int(11) unsigned DEFAULT NULL,
                              `amount` decimal(15,2) unsigned DEFAULT NULL,
                              `fee` decimal(15,2) unsigned DEFAULT NULL,
                              PRIMARY KEY (`id`),
                              KEY `transaction_id` (`transaction_id`),
                              KEY `fund_id` (`fund_id`)
                            ) ENGINE=InnoDB; ');
        
        printd(get_class($this));
    }

    public function down() {
        
    }

}
