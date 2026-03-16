<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Chat_model extends CI_Model {

    private $table = 'chat_tree';

    public function __construct() {
        parent::__construct();
    }

    public function getChat($id) {
        return $this->db->from('chat_tree')
            ->where('id',$id)->get()->row();
    }

    public function getChildSelected($id_chat,$answer,$church_id,$campus_id) {
        $this->db
            ->select('cc.child_id,ct.html,ct.method_get,ct.type_set,ct.type_get,ct.replace,ct.back,ctx.customize_text')
            ->from('chat_childs as cc')
            ->join('chat_tree as ct','cc.child_id = ct.id')
            ->where('ct.answer',$answer)
            ->where('cc.parent_id',$id_chat);

        if(!$campus_id) {
            $this->db->join('chat_customize_text as ctx', 'ct.id = ctx.chat_tree_id'
                . ' and ctx.church_id = ' . $church_id
                . ' and ctx.campus_id is null'
                . ' and ct.is_text_customizable = 1'
                , 'left');

        } else {
            $this->db->join('chat_customize_text as ctx','ct.id = ctx.chat_tree_id'
                .' and ctx.church_id = '.$church_id
                .' and ctx.campus_id = '.$campus_id
                . ' and ct.is_text_customizable = 1'
                ,'left');
        }

        return $this->db->get()->row();
    }

    public function getPublicChatIds()
    {
        return $this->db->select('id')->where('is_session_enabled',0)->get($this->table)->result_array();
    }

    public function getSessionEnabledIds()
    {
        return $this->db->select('id , session_enabled_id')->where('session_enabled_id is not null')->get($this->table)->result_array();
    }
}
