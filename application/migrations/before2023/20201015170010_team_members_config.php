<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_team_members_config extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("INSERT INTO `groups` (`id`, `name`, `description`) VALUES (3, 'team1', 'Team Member')");

        echo "Migration_team_members_config";

        //$this->db->query("");        
        //printd('<b>comment when adding data</b>');
    }

    public function down() {
        
    }

}
