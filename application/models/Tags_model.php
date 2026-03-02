<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Tags_model extends CI_Model { //general purpose tags

    private $table     = 'tags';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    public function get_tags_list($scope = 'B') {

        $limit  = 10; //it must coincide with the limit defined on front end
        $offset = ($this->input->post('page') ? $this->input->post('page') - 1 : 0) * $limit;

        $this->db->select('SQL_CALC_FOUND_ROWS id, name', false);

        $this->db->where('scope', $scope);
        $this->db->where('client_id', $this->session->userdata('user_id'));

        if ($this->input->post('q')) {
            $this->db->group_start();
            $this->db->like('name', $this->input->post('q'));
            $this->db->group_end();
        }

        $this->db->limit($limit, $offset);

        $result = $this->db->get($this->table)->result();

        $data = [];
        foreach ($result as $row) {
            $data[] = ['id' => $row->id, 'text' => $row->name];
        }

        $total_count = $this->db->query('SELECT FOUND_ROWS() cnt')->row();

        return [
            'items'       => $data,
            'total_count' => $total_count->cnt
        ];
    }

    // $data holds an array
    // create tags if they don't exist
    public function create($tagsData, $scope) { //scope B = Batches
        $val_messages = [];

        $userId = $this->session->userdata('user_id');

        $tagIds = [];
        foreach ($tagsData as $tagName) {

            $tagName = ucwords(strtolower(trimLR_Duplicates($tagName)));

            $tagExists = $this->db->where('name', $tagName)->where('scope', $scope)
                            ->where('client_id', $userId) //securing
                            ->get($this->table)->row();

            if (!$tagExists) {
                $save_data = ['client_id' => $userId, 'name' => $tagName, 'scope' => $scope, 'created_at' => date('Y-m-d H:i:s')];
                $this->db->insert($this->table, $save_data);
                $tId       = $this->db->insert_id();
            } else {
                $tId = (int) $tagExists->id;
            }

            if (!in_array($tId, $tagIds)) { //the user could send a repeated tag in the same request, example: "tag1", "TAG1") we want to return a clean tagIds array
                $tagIds [] = $tId;
            }
        }

        if (empty($val_messages)) {

            return ['status' => true, 'tag_ids' => $tagIds, 'message' => langx('Tags processed')];
        }

        return ['status' => false, 'message' => langx('Validation error found'), 'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages];
    }

    public function removeUnusedTags($scope, $userId = false) {
        $userId = $userId ? $userId : $this->session->userdata('user_id');

        $tags = $this->db->select('id')->where('client_id', $userId)->where('scope', $scope)->get($this->table)->result();

        if ($scope == 'B') { //batches
            $batchTags = $this->db->select('bt.tag_id')
                            ->where('client_id', $userId) //we could make a inner join with tags but we put the client_id on this table for improving query performance
                            ->get('batch_tags bt')->result();

            $scopeTags = $batchTags;
        } else {
            //other scope
        }


        foreach ($tags as $tag) {
            $found = false;
            foreach ($scopeTags as $scopeTag) {
                if ($tag->id == $scopeTag->tag_id) {
                    $found = true; //it means the tag is being used, just skip current loop and continue with the next tag
                    break;
                }
            }

            if (!$found) {
                $this->db->where('id', $tag->id)->delete($this->table);
            }
        }
    }

}
