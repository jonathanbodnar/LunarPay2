<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_church_onboard_paysafe_owner2_fields extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_table_church_onboard_paysafe_owner2_fields</p>");

        $this->db->query("ALTER TABLE `church_onboard_paysafe`
	ADD COLUMN `business_owner2_id` VARCHAR(255) NULL DEFAULT NULL AFTER `business_owner_id2`,
	ADD COLUMN `business_owner2_id2` VARCHAR(255) NULL DEFAULT NULL AFTER `business_owner2_id`,
	ADD COLUMN `owner2_first_name` VARCHAR(128) NULL DEFAULT NULL AFTER `owner_previous_address_line_2`,
	ADD COLUMN `owner2_last_name` VARCHAR(128) NULL DEFAULT NULL AFTER `owner2_first_name`,
	ADD COLUMN `owner2_title` VARCHAR(128) NULL DEFAULT NULL AFTER `owner2_last_name`,
	ADD COLUMN `owner2_phone` VARCHAR(64) NULL DEFAULT NULL AFTER `owner2_title`,
	ADD COLUMN `owner2_is_european` CHAR(3) NULL DEFAULT NULL AFTER `owner2_phone`,
	ADD COLUMN `owner2_nationality` VARCHAR(2) NULL DEFAULT NULL AFTER `owner2_is_european`,
	ADD COLUMN `owner2_gender` VARCHAR(1) NULL DEFAULT NULL AFTER `owner2_nationality`,
	ADD COLUMN `owner2_birth` DATE NULL DEFAULT NULL AFTER `owner2_gender`,
	ADD COLUMN `owner2_ssn` VARCHAR(15) NULL DEFAULT NULL AFTER `owner2_birth`,
	ADD COLUMN `owner2_current_country` VARCHAR(2) NULL DEFAULT NULL AFTER `owner2_ssn`,
	ADD COLUMN `owner2_current_state` VARCHAR(2) NULL DEFAULT NULL AFTER `owner2_current_country`,
	ADD COLUMN `owner2_current_city` VARCHAR(50) NULL DEFAULT NULL AFTER `owner2_current_state`,
	ADD COLUMN `owner2_current_zip` VARCHAR(16) NULL DEFAULT NULL AFTER `owner2_current_city`,
	ADD COLUMN `owner2_current_address_line_1` VARCHAR(512) NULL DEFAULT NULL AFTER `owner2_current_zip`,
	ADD COLUMN `owner2_current_address_line_2` VARCHAR(512) NULL DEFAULT NULL AFTER `owner2_current_address_line_1`,
	ADD COLUMN `years_at_address2` VARCHAR(2) NULL DEFAULT NULL AFTER `owner2_current_address_line_2`,
	ADD COLUMN `owner2_previous_country` VARCHAR(2) NULL DEFAULT NULL AFTER `years_at_address2`,
	ADD COLUMN `owner2_previous_state` VARCHAR(2) NULL DEFAULT NULL AFTER `owner2_previous_country`,
	ADD COLUMN `owner2_previous_city` VARCHAR(50) NULL DEFAULT NULL AFTER `owner2_previous_state`,
	ADD COLUMN `owner2_previous_zip` VARCHAR(16) NULL DEFAULT NULL AFTER `owner2_previous_city`,
	ADD COLUMN `owner2_previous_address_line_1` VARCHAR(512) NULL DEFAULT NULL AFTER `owner2_previous_zip`,
	ADD COLUMN `owner2_previous_address_line_2` VARCHAR(512) NULL DEFAULT NULL AFTER `owner2_previous_address_line_1`,
	ADD COLUMN `owner_is_control_prong` TINYINT(1) NULL DEFAULT 0 AFTER `owner_previous_address_line_2`,
	ADD COLUMN `owner_is_applicant` TINYINT(1) NULL DEFAULT 0 AFTER `owner_previous_address_line_2`,
	ADD COLUMN `euidcard_number2` VARCHAR(30) NULL DEFAULT NULL AFTER `owner2_previous_address_line_2`,
	ADD COLUMN `euidcard_country_of_issue2` VARCHAR(2) NULL DEFAULT NULL AFTER `euidcard_number2`,
	ADD COLUMN `euidcard_expiry_date2` DATE NULL DEFAULT NULL AFTER `euidcard_country_of_issue2`,
	ADD COLUMN `euidcard_number_line_12` VARCHAR(30) NULL DEFAULT NULL AFTER `euidcard_expiry_date2`,
	ADD COLUMN `euidcard_number_line_22` VARCHAR(30) NULL DEFAULT NULL AFTER `euidcard_number_line_12`,
	ADD COLUMN `euidcard_number_line_32` VARCHAR(30) NULL DEFAULT NULL AFTER `euidcard_number_line_22`;
	;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
