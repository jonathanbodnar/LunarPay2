<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_add_indexes extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query(""
                . "ALTER TABLE `church_detail`
	ADD INDEX `token` (`token`),
	ADD INDEX `slug` (`slug`);
");

        $this->db->query(""
                . "ALTER TABLE `church_detail`
	ADD INDEX `client_id` (`client_id`);
");
        printd('<p><b>- church_detail indexes added</b></p>');


        $this->db->query(""
                . "ALTER TABLE `campuses`
	ADD INDEX `token` (`token`),
	ADD INDEX `slug` (`slug`);
");

        printd('<p><b>- campuses indexes added</b></p>');

        $this->db->query(""
                . "     ALTER TABLE `chat_settings`
	ADD INDEX `client_id` (`client_id`),
	ADD INDEX `church_id` (`church_id`),
	ADD INDEX `campus_id` (`campus_id`);
");

        printd('<p><b>- chat_settings indexes added</b></p>');


        $this->db->query(""
                . "ALTER TABLE `account_donor`
	ADD INDEX `id_church` (`id_church`),
	ADD INDEX `campus_id` (`campus_id`);

");
        $this->db->query(""
                . "ALTER TABLE `history_chat`
	ADD INDEX `donor_id` (`donor_id`),
	ADD INDEX `church_id` (`church_id`),
	ADD INDEX `campus_id` (`campus_id`),
	ADD INDEX `status` (`status`),
	ADD INDEX `archived` (`archived`);

");
        printd('<p><b>- history_chat indexes added</b></p>');

        $this->db->query(""
                . "ALTER TABLE `history_chat_detail`
	ADD INDEX `history_chat_id` (`history_chat_id`),
	ADD INDEX `chat_tree_id` (`chat_tree_id`);

");
        printd('<p><b>- history_chat_detail indexes added</b></p>');

        
        $this->db->query(""
                . "ALTER TABLE `mobile_transaction`
	ADD INDEX `mobile_no_donarid_church_id_date_time_active` (`mobile_no`, `donarid`, `church_id`, `date_time`, `active`);

");
        printd('<p><b>- mobile_transaction grouped-indexes added</b></p>');


        printd("<p>Migration_add_indexes</p>");



        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
