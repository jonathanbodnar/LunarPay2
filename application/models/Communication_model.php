<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Communication_model extends My_Model {

    protected $table      = 'communication';
    public $reformatToWithCode = TRUE;

    public function __construct() {
        parent::__construct();
    }
    
    private function beforeSave($data) {

        $data['sms_status']     = ucfirst(strtolower($data['sms_status']));
        $data['message_status'] = isset($data['message_status']) ? ucfirst(strtolower($data['message_status'])) : null;

        return $data;
    }

    public function create($data) {

        if (isset($data['to'])) { //===== remove all but numbers
            
            if($this->reformatToWithCode) {
                $code       = '+1';
                $data['to'] = preg_replace('/[^0-9]/', '', $data['to']);
                $data['to'] = $code . $data['to'];
            }
        }

        $data = $this->beforeSave($data);

        return $this->db->insert($this->table, $data);
    }

    //==== user for updating message statuses using the twilio callbacks
    public function updateBySid($data) {

        $id = $data['sid'];

        $data = $this->beforeSave($data);

        $this->db->where('sid', $id)->update($this->table, $data);
    }

    public function getChats($status_chat,$user_id,$church_id,$campus_id = null,$offset = 0,$search = null,$refresh =null){
        $count_chats= COUNT_CHAT_ITEMS;
        if($refresh){
            $count_chats = $refresh;
        }
        $this->db->from($this->table.' as com')
            ->select("com.client_id,CONCAT_WS(' ',c.first_name,c.last_name) as name, com.text, com.direction, com.created_at, c.status_chat")
            ->join('users as u','u.id = com.user_id')
            ->join('account_donor as c','com.client_id = c.id')
            ->join($this->table.' as com2','com.client_id = com2.client_id and com.id < com2.id','left')
            ->where("c.status_chat != 'C'")
            ->where('com2.id is null')
            ->where('com.user_id',$user_id)
            ->where('c.id_church',$church_id)
            ->group_by('com.client_id')
            ->limit($count_chats+1,$offset)
            ->order_by('com.created_at','desc');

        if($campus_id){
            $this->db->where('c.campus_id',$campus_id);
        } else {
            $this->db->where('c.campus_id is null');
        }

        if ($status_chat == "inbox") {
            $this->db->where('c.status_chat','O');
        } elseif ($status_chat == "archived"){
            $this->db->where('c.status_chat','A');
        }

        if ($search) {
            $this->db->like("CONCAT_WS(' ',c.first_name,c.last_name)", $search);
        }

        $chats = $this->db->get()->result_array();
        $more_items = false;
        if(count($chats) === $count_chats + 1){
            $more_items = true;
            array_pop($chats);
        }

        return ['data'=>$chats,'more_items'=>$more_items,'timezone'=> date('P')];
    }

    public function getChatMessages($donor_id) {
        return $this->db->from($this->table)
                        ->where('client_id', $donor_id)
                        ->order_by('created_at', 'desc')
                        ->get()->result_array();
    }
}
