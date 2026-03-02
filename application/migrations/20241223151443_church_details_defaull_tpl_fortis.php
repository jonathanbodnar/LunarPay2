<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_church_details_defaull_tpl_fortis extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_church_details_defaull_tpl_fortis</p>");

        //create an sql for the church_detail table to set all templates to empty string if they are null
        $this->db->query("UPDATE church_detail SET fortis_template = '' WHERE fortis_template IS NULL");

        $this->db->query("ALTER TABLE church_detail MODIFY fortis_template VARCHAR(255) NOT NULL DEFAULT 'lunarpayfr'");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}
