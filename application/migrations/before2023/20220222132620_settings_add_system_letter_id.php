<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_settings_add_system_letter_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_settings_add_system_letter_id</p>");
        
        $this->db->query("ALTER TABLE `settings`
	CHANGE COLUMN `type` `type` VARCHAR(255) NOT NULL DEFAULT '' AFTER `settings_id`,
	CHANGE COLUMN `description` `description` TEXT NOT NULL DEFAULT '' AFTER `type`,
	ADD INDEX `type` (`type`);");        
        printd('<p><b>index added to type column</b></p>');

        $this->db->query("INSERT INTO settings (`type`, `description`) VALUES ('SYSTEM_LETTER_ID', 'L');");
        printd('<p><b>data added to settings table</b></p>');
        
        $this->db->query("ALTER TABLE `settings`
	COMMENT='SYSTEM_LETTER_ID => L = Lunarpay, C = Chatgive, H = CoachPay ';");
        printd('<p><b>comments added to settings table</b></p>');
    }

    public function down() {
        
    }

}
