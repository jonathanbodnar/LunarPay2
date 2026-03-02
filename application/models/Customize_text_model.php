<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Customize_text_model extends CI_Model {

    private $table = 'chat_customize_text';

    public function __construct() {
        parent::__construct();
    }

    public function getCustomizeTexts($church_id, $campus_id) {

        $this->db->from('chat_tree as ct')
            ->select('ct.id,ct.html,ct.purpose,ctx.customize_text')
            ->where('order != 0');

        if(!$campus_id)
            $this->db->join($this->table.' as ctx','ct.id = ctx.chat_tree_id '                
                .' and ctx.church_id = '.$church_id
                .' and ctx.campus_id is null'
                ,'left');

        else {
            $this->db->join($this->table.' as ctx','ct.id = ctx.chat_tree_id '                
                .' and ctx.church_id = '.$church_id
                .' and ctx.campus_id = '.$campus_id
                ,'left');
        }
        $this->db->where('ct.is_text_customizable',1);
        $this->db->order_by('ct.order','ASC');

        return $this->db->get()->result_array();
    }

    public function save($data, $user_id) {
        
        $result = checkBelongsToUser([['church_detail.ch_id' => $data['church_id'], 'client_id', 'users.id', $user_id]]);
        
        if ($result !== true) {
            return $result;
        }
        
        $this->db->from($this->table)->where('church_id',$data['church_id']);
        
        if($data['campus_id']){
            $this->db->where('campus_id',$data['campus_id']);
        }
        $customize_text = $this->db->get()->row();
        if(!$customize_text){
            $this->db->insert($this->table,$data);
            return $this->db->insert_id();
        } else {
            $this->db->where('id',$customize_text->id);
            $this->db->update($this->table,$data);
            return $customize_text->id;
        }
    }

}
