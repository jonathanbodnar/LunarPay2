<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_batch_tags_client_id extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_batch_tags_client_id</p>");

        $this->db->query("ALTER TABLE `batch_tags`
	ADD COLUMN `client_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `id`,
	CHANGE COLUMN `tag_id` `tag_id` INT(10) UNSIGNED NULL DEFAULT NULL AFTER `client_id`,
	ADD INDEX `client_id` (`client_id`);
");

        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
    }

    public function down() {
        
    }

}
