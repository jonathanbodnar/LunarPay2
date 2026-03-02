<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_payment_link_products_paid extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_payment_link_products_paid</p>");
        
        $this->db->query("CREATE TABLE `payment_link_products_paid` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`payment_link_id` INT(11) NOT NULL,
	`product_id` INT(11) NOT NULL,
	`qty` INT(11) NOT NULL,
	PRIMARY KEY (`id`),
	INDEX `product_id` (`product_id`),
	INDEX `payment_link_id` (`payment_link_id`)
)
COMMENT='On payment links, the customer can change quantities, this table stores these quantity details for each payment, we can scale up to transactions table'
COLLATE='utf8_general_ci'
ENGINE=InnoDB
;
");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
