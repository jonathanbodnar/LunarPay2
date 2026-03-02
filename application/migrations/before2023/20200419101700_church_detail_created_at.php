<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_detail_created_at extends CI_Migration {

    private $table = 'church_detail';

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {
        $this->db->query('ALTER TABLE chatgive.church_detail ADD giving_type_json text NOT NULL;');
        $this->db->query('ALTER TABLE `church_detail` ADD COLUMN `created_at` DATETIME NULL DEFAULT NULL AFTER `tax_id`;');
        printd(get_class($this) . '<br>');
    }

    public function down() {
        
    }

}
