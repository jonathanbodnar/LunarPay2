<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_create_church_detail extends CI_Migration {

    private $table = 'church_detail';

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {
        
        $this->db->query("CREATE TABLE `church_detail` (
	`ch_id` INT(11) NOT NULL AUTO_INCREMENT,
	`client_id` INT(11) NOT NULL,
	`church_name` VARCHAR(100) NOT NULL,
	`phone_no` VARCHAR(128) NOT NULL,
	`website` VARCHAR(100) NOT NULL,
	`email` VARCHAR(300) NULL DEFAULT NULL,
	`street_address` VARCHAR(300) NOT NULL,
	`city` VARCHAR(100) NOT NULL,
	`state` VARCHAR(100) NOT NULL,
	`postal` VARCHAR(50) NOT NULL,
	`country` VARCHAR(50) NOT NULL,
	`latitude` DECIMAL(10,8) NULL DEFAULT NULL,
	`longitude` DECIMAL(11,8) NULL DEFAULT NULL,
	`giving_type` TEXT NOT NULL,
	`twilio_accountsid` VARCHAR(50) NULL DEFAULT NULL,
	`twilio_phonesid` VARCHAR(50) NULL DEFAULT NULL,
	`twilio_phoneno` VARCHAR(15) NULL DEFAULT NULL,
	`twilio_token` VARCHAR(1032) NULL DEFAULT NULL,
	`twilio_cancel_data` LONGTEXT NULL DEFAULT NULL,
	`sms_messaging_from` CHAR(1) NULL DEFAULT 'C' COMMENT 'M -> Main/Parent twilio account | C -> church twilio number',
	`logo` VARCHAR(100) NULL DEFAULT NULL,
	`color` VARCHAR(100) NULL DEFAULT NULL,
	`partnership` VARCHAR(50) NOT NULL,
	`cover_fee` INT(11) NOT NULL DEFAULT 0,
	`cfeed_code` VARCHAR(64) NULL DEFAULT NULL,
	`epicpay_verification_status` CHAR(1) NULL DEFAULT 'N',
	`epicpay_credentials` VARCHAR(500) NULL DEFAULT NULL,
	`epicpay_id` INT(11) NULL DEFAULT NULL,
	`epicpay_gateway_id` VARCHAR(255) NULL DEFAULT NULL,
	`txt_togive_with` VARCHAR(2) NULL DEFAULT 'EP',
	`epicpay_template` VARCHAR(32) NULL DEFAULT NULL,
	`epicpay_template_history` LONGTEXT NULL DEFAULT NULL,
	`tax_id` VARCHAR(32) NULL DEFAULT NULL,
	PRIMARY KEY (`ch_id`)
)
ENGINE=InnoDB
;
");     
        
        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
