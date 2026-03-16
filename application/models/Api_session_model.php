<?php

defined('BASEPATH') OR exit('No direct script access allowed');

////////////////////////////////////////////////////////
//model used for keeping session data of donors (widget)

class Api_session_model extends CI_Model {

    private $table = 'api_access_token';

    public function __construct() {
        parent::__construct();
    }

    public function initialize($token) {
        $session = $this->db->where('token', $token)
            ->from($this->table)
            ->get()
            ->row();
        if(!$session){

            $data = [
                'token' => $token,
                'session_data' => '[]'
            ];

            $this->db->insert($this->table, $data);
        }
    }

    public function getSessionData($token) {

        $session_data = $this->db->where('token', $token)->select('session_data')
            ->from($this->table)
            ->get()
            ->row()->session_data ;

        return json_decode($session_data, true);
    }

    public function getFullData($token) {

        $fullData = $this->db->where('token', $token)
            ->from($this->table)
            ->get()
            ->row();

        if($fullData) {
            $this->load->model('organization_model');
            $org = $this->organization_model->get($fullData->church_id, 'client_id');
            $fullData->_merchant_id = $org->client_id;        
            $fullData->_session_data = json_decode($fullData->session_data, true);
        }

        return $fullData;
    }

    public function getValue($token,$name) {

        $data = $this->db->where('token', $token)->select('session_data')
            ->from($this->table)
            ->get()
            ->row();

        $json_session_data = $data ? json_decode($data->session_data, true) : null;

        return isset($json_session_data[$name]) ? $json_session_data[$name] : null;
    }

    public function setValue($token,$name,$value) {

        $session_data = $this->db->where('token', $token)->select('session_data')
            ->from($this->table)
            ->get()
            ->row()->session_data;

        $json_session_data = json_decode($session_data, true);

        $json_session_data[$name] = $value;

        $this->db->where('token', $token);
        return $this->db->update($this->table, ['session_data' => json_encode($json_session_data)]);
    }

    public function unsetValue($token,$name) {

        $session_data = $this->db->where('token', $token)->select('session_data')
            ->from($this->table)
            ->get()
            ->row()->session_data ;

        $json_session_data = json_decode($session_data, true);

        unset($json_session_data[$name]);

        $this->db->where('token', $token);
        return $this->db->update($this->table, ['session_data' => json_encode($json_session_data)]);
    }

    public function getById($id) {
        return $this->db->where('id', $id)->from($this->table)->get()->row_array();
    }

}
