<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Batch_tags_model extends CI_Model { //include suborgnx too

    private $table     = 'batch_tags';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    //$data holds and array
    //removes the list of tags and create them again
    public function reset($data, $batchId, $userId = false) {
        $userId = $userId ? $userId : $this->session->userdata('user_id');

        $this->db->where('batch_id', $batchId)->delete($this->table);
        foreach ($data as $tagId) {
            $this->db->insert($this->table, ['tag_id' => $tagId, 'batch_id' => $batchId, 'client_id' => $userId, 'created_at' => date('Y-m-d H:i:s')]);
        }

        return [
            'status'  => true,
            'message' => langx('Batch tags processed')
        ];
    }

    public function getByBatch($batch_id, $userId = false) {
        $userId = $userId ? $userId : $this->session->userdata('user_id');

        return $this->db->select('t.id, t.name as text')->where('bt.batch_id', $batch_id)->where('bt.client_id', $userId)
                        ->join('tags t', 't.id = bt.tag_id', 'inner')
                        ->order_by('t.id', 'ASC')
                        ->get($this->table . ' bt')->result();
    }

}
