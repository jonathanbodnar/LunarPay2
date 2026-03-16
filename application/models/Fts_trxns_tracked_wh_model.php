<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Fts_trxns_tracked_wh_model extends My_Model {

    private $table = 'fortis_trxns_tracked_webhooks';

    // Insert a new record
    public function insert($data) {
        return $this->db->insert($this->table, $data);
    }

    // Get a record by ID
    public function getById($id) {
        return $this->db->get_where($this->table, ['id' => $id])->row_array();
    }

    // Update a record by ID
    public function update($id, $data) {
        $this->db->where('id', $id);
        return $this->db->update($this->table, $data);
    }

    // Delete (hard delete) a record by ID
    public function delete($id) {
        $this->db->where('id', $id);
        return $this->db->delete($this->table);
    }
}
