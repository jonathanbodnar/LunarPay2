<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Messaging extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);
    }

    public function inbox() {
        if(BASE_URL == 'https://app.chatgive.com/') {
            die('Not available');
        }
        
        $this->template_data['title']         = langx("Inbox");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name,token');
        $this->template_data['organizations'] = $organizations;

        $view                                 = $this->load->view('messaging/inbox', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get_chats(){
        $church_id = (int)$this->input->post('church_id');
        $campus_id = (int)$this->input->post('campus_id');
        $status_chat = $this->input->post('status_chat');
        $user_id = $this->session->userdata('user_id');
        $offset = $this->input->post('offset');
        $refresh = $this->input->post('refresh');
        $this->load->model('history_chat_model');
        $data = $this->history_chat_model->getChats($church_id,$campus_id,$status_chat,$user_id,$offset,$refresh);

        output_json([
            'status'     => true,
            'data'       => $data['data'],
            'more_items' => $data['more_items'],
            'timezone'   => $data['timezone']
        ]);
    }

    public function get_chat_messages()
    {
        $chat_id = $this->input->post('chat_id');
        $this->load->model('history_chat_model');
        $data = $this->history_chat_model->getChatMessages($chat_id);

        output_json([
            'status' => true,
            'data' => $data,
            'timezone' => date('P')
        ]);
    }

    public function set_archive()
    {
        $hst_id = $this->input->post('id');
        $archive = $this->input->post('archive');

        $this->load->model('history_chat_model');
        $result = $this->history_chat_model->set_archived($hst_id,$archive,$this->session->userdata('user_id'));

        if($result){
            output_json([
                'status'=>true
            ]);
        }
    }

}
