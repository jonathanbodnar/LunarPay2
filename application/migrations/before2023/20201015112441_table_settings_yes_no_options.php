<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_table_settings_yes_no_options extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query("INSERT INTO `settings` (`settings_id`, `type`, `description`) VALUES (4, 'yes_options', '[\"yes\",\"yeah\",\"yep\",\"yea\",\"y\",\"sure\",\"true\",\"ok\",\"great\",\"nice\"]');");
        $this->db->query("INSERT INTO `settings` (`settings_id`, `type`, `description`) VALUES (5, 'no_options', '[\"no\",\"nah\",\"nope\",\"na\",\"n\",\"not\",\"false\"]');");

        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
