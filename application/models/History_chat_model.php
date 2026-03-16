<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class History_chat_model extends CI_Model {

    private $table = 'history_chat';
    private $table_child = 'history_chat_detail';

    public function __construct() {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id) {
        return checkBelongsToUser([
            ['history_chat.id' => $id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);
    }

    public function getById($church_id,$campus_id,$history_id) {

        $this->db->from($this->table)
            ->where('church_id',$church_id)
            ->where('id',$history_id);

        if($campus_id){
            $this->db->where('campus_id',$campus_id);
        } else {
            $this->db->where('campus_id is null');
        }
        return $this->db->get()->row();
    }

    public function create_history($data) {
        $this->db->insert($this->table,$data);
        return $this->db->insert_id();
    }

    public function set_donor($history_id, $donor_id) {
        return $this->db->where('id',$history_id)->update($this->table,['donor_id'=>$donor_id]);
    }

    public function set_status($history_id, $status) {
        return $this->db->where('id',$history_id)->update($this->table,['status'=>$status]);
    }

    public function set_archived($history_id, $archived,$user_id) {

        $result  = $this->checkBelongsToUser($history_id, $user_id);
        if ($result !== true) {
            return $result;
        }

        $this->db->where('id',$history_id)->update($this->table,['archived'=>$archived]);
        return true;
    }

    public function create_history_detail($data) {
        $this->db->insert($this->table_child,$data);
        return $this->db->insert_id();
    }

    public function getAllChatsOpen(){
        $this->db->from($this->table.' as hst')
            ->select("hst.id, msg.created_at")
            ->join($this->table_child.' as msg','hst.id = msg.history_chat_id')
            ->join($this->table_child.' as msg2','msg.history_chat_id = msg2.history_chat_id and msg.id < msg2.id','left')
            ->join('account_donor as ac','ac.id = hst.donor_id','left')
            ->where('msg2.id is null')
            ->where('hst.status','O')
            ->group_by('hst.id')
            ->order_by('hst.created_at','desc')
            ->order_by('msg.id','desc');

        return $this->db->get()->result_array();
    }

    public function getChats($church_id,$campus_id,$status_chat,$user_id,$offset = 0,$refresh =null){
        $count_chats= COUNT_CHAT_ITEMS;
        if($refresh){
            $count_chats = $refresh;
        }
        $this->db->from($this->table.' as hst')
            ->select("CONCAT_WS(' ',ac.first_name,ac.last_name) as name, hst.id, msg.type as direction, msg.message as text, msg.created_at, hst.status")
            ->join($this->table_child.' as msg','hst.id = msg.history_chat_id')
            ->join($this->table_child.' as msg2','msg.history_chat_id = msg2.history_chat_id and msg.id < msg2.id','left')
            ->join('account_donor as ac','ac.id = hst.donor_id','left')
            ->where('msg2.id is null')
            ->where('hst.church_id',$church_id)
            ->group_by('hst.id')
            ->limit($count_chats+1,$offset)
            ->order_by('hst.created_at','desc')
            ->order_by('msg.id','desc');

        if($campus_id){
            $this->db->where('hst.campus_id',$campus_id);
        } else {
            $this->db->where('hst.campus_id is null');
        }

        if($status_chat !== "all") {
            if ($status_chat === "A") {
                $this->db->where('hst.archived', 1);
            } else {
                $this->db->where('hst.status', $status_chat)
                    ->where('hst.archived', 0);
            }
        }

        $chats = $this->db->get()->result_array();
        $more_items = false;
        if(count($chats) === $count_chats + 1){
            $more_items = true;
            array_pop($chats);
        }

        return ['data'=>$chats,'more_items'=>$more_items,'timezone'=> date('P')];
    }

    public function getChatMessages($chat_id) {
        return $this->db->select('msg.id,msg.type as direction,msg.message as text, msg.created_at, msg.chat_tree_id')
            ->from($this->table_child .' as msg ')
            ->where('msg.history_chat_id', $chat_id)
            ->order_by('msg.created_at', 'desc')
            ->order_by('msg.id', 'desc')
            ->get()->result_array();
    }

    public function deleteMessage($message_id)
    {
        $this->db->where('id',$message_id)->delete($this->table_child);
    }
}
