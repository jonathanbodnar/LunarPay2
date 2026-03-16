<?php 
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_request_logs_rebuild extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        printd("<p>Migration_request_logs_rebuild</p>");

        $this->db->query("DROP TABLE `request_logs`");

        $this->db->query("CREATE TABLE `request_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('REQ','RES') NULL DEFAULT NULL,
  `headers` text DEFAULT NULL,
  `method` enum('GET','POST','PUT','DEL') DEFAULT NULL,
  `url` varchar(256) DEFAULT NULL,
  `payload` text DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
        
        //$this->db->query("");        
        //printd('<p><b>comment when adding data</b></p>');
        
    }

    public function down() {
        
    }

}