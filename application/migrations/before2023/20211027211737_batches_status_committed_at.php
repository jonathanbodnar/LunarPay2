<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_batches_status_committed_at extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_batches_status</p>");

        $this->db->query("ALTER TABLE `batches`
	ADD COLUMN `status` CHAR(1) NULL DEFAULT 'U' COMMENT 'U = Uncommitted, C = Committed' AFTER `campus_id`,
	ADD INDEX `status` (`status`);
");

        $this->db->query("ALTER TABLE `batches`
	ADD COLUMN `committed_at` DATETIME NULL DEFAULT NULL AFTER `created_at`;
");
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
