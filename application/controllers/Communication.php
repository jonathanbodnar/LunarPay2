<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Communication extends My_Controller {

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

    public function sms() {
        $this->template_data['title']         = langx("SMS Inbox");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name,token');
        $this->template_data['organizations'] = $organizations;

        $view                                 = $this->load->view('communication/sms', ['view_data' => $this->template_data], true);
        $this->template_data['content']       = $view;
        $this->load->view('main', $this->template_data);
    }

    public function send_mass_text()
    {
        if ($this->input->post()) {
            $clients = $this->input->post('donors');

            if ($clients) {

                $this->form_validation->set_rules('text_message', langx('text_message'), 'trim|required');

                if ($this->form_validation->run() === TRUE) {

                    require_once 'application/libraries/messenger/MessengerProvider.php';
                    MessengerProvider::init();
                    $MenssengerInstance = MessengerProvider::getInstance();

                    $text_message = $this->input->post('text_message');
                    $this->load->model('communication_model');

                    $sms_errors = [];
                    $sms_pushed = 0;

                    //output_json(['status' => FALSE, 'message' => 'Messages not sent yet, Development mode on', 'sms_errors' => []]);
                    //return;

                    $this->load->model('donor_model');
                    foreach ($clients as $donor_id) {
                        $donor = $this->donor_model->get($donor_id, 'phone');

                        $from = TWILIO_PHONE_FROM;
                        $to = $donor->phone;
                        //$to = '8174098280';
                        $result             = $MenssengerInstance->sendSms($to, $from, $text_message, TRUE);

                        $data = [
                            'user_id'    => $this->session->userdata('user_id'),
                            'client_id'  => $donor_id,
                            'text'       => $text_message,
                            'from'       => $from,
                            'to'         => $to,
                            'direction'  => 'S', //==== sent
                            'created_at' => date('Y-m-d H:i:s')
                        ];

                        if($result['status']) {
                            $data['sid'] = $result['response']->sid;
                            $data['sms_status'] = $result['response']->status;

                            $this->communication_model->create($data);
                            $this->donor_model->changeStatusSmsChat($this->session->userdata('user_id'),$donor_id,'O');

                            $sms_pushed ++;

                        } else {
                            $exc = $result['exception'];
                            $errMessage = (string) $exc->getMessage();
                            $code = (string) $exc->getCode();
                            if(!isset($sms_errors[$code])){
                                $sms_errors[$code]['count'] = 1;
                                $sms_errors[$code]['phones'] = $to . " | ";
                                $sms_errors[$code]['message'] = $code == 21211 ? 'No valid phone' : ($code == 21610 ? "$errMessage (Phone was unsubscribed)" : $errMessage);
                                $sms_errors[$code]['code'] = $code;
                            }else{
                                $sms_errors[$code]['count'] ++;
                                $sms_errors[$code]['phones'] .= $to . " | ";
                            }
                            log_message("error", "_INFO_LOG send_mass_text : " . date("Y-m-d H:i:s"). " client_id $client_id | mobile $to | response $code $errMessage");
                            $data['sms_status'] = TWILIO_LOCAL_ERROR_LABEL;
                            $data['error_detail'] = "$errMessage Error code $code";

                            $this->communication_model->create($data);

                        }
                    }
                    output_json([
                        'status' => true,
                        'message' => 'Message successfully sent',
                        'sms_errors' => $sms_errors,
                        'sms_pushed' => $sms_pushed,
                        'sms_total' => count($clients)
                    ]);
                } else {
                    output_json([
                        'status' => false,
                        'message' => validation_errors()
                    ]);
                }
            } else {
                output_json([
                    'status' => false,
                    'message' => 'Please select at least one record'
                ]);
            }
        }
    }

    public function send_sms_text()
    {
        if ($this->input->post()) {
            $donor_id = $this->input->post('donor_id');

            if ($donor_id) {

                $this->form_validation->set_rules('text_message', langx('text_message'), 'trim|required');

                if ($this->form_validation->run() === TRUE) {

                    $this->load->model('donor_model');
                    $result = $this->donor_model->changeStatusSmsChat($this->session->userdata('user_id'),$donor_id,'O');

                    if(!$result){
                        output_json([
                            'status'     => false,
                            'message'    => $result->message
                        ]);
                    }

                    require_once 'application/libraries/messenger/MessengerProvider.php';
                    MessengerProvider::init();
                    $MenssengerInstance = MessengerProvider::getInstance();

                    $text_message = $this->input->post('text_message');
                    $this->load->model('communication_model');

                    $this->load->model('donor_model');
                    $client = $this->donor_model->get($donor_id, 'phone');

                    $from = TWILIO_PHONE_FROM;
                    $to = $client->phone_number; //'+197238835871';
                    //$to = '+18174098280';
                    $result             = $MenssengerInstance->sendSms($to, $from, $text_message, TRUE);

                    $data = [
                        'user_id'    => $this->session->userdata('user_id'),
                        'client_id'  => $donor_id,
                        'text'       => $text_message,
                        'from'       => $from,
                        'to'         => $to,
                        'direction'  => 'S', //==== sent
                        'created_at' => date('Y-m-d H:i:s e')
                    ];

                    if($result['status']) {
                        $data['sid'] = $result['response']->sid;
                        $data['sms_status'] = $result['response']->status;

                        $this->communication_model->create($data);

                        output_json([
                            'status'     => true,
                            'message'    => 'Message successfully sent',
                            'sms_status' => $data['sms_status']
                        ]);

                    } else {
                        $exc = $result['exception'];
                        $errMessage = (string) $exc->getMessage();
                        $code = (string) $exc->getCode();
                        $message = $code == 21211 ? 'No valid phone' : ($code == 21610 ? "$errMessage (Phone was unsubscribed)" : $errMessage);

                        log_message("error", "_INFO_LOG send_sms_text : " . date("Y-m-d H:i:s"). " donor_id $donor_id | mobile $to | response $code $errMessage");
                        $data['sms_status'] = TWILIO_LOCAL_ERROR_LABEL;
                        $data['error_detail'] = "$errMessage Error code $code";

                        $this->communication_model->create($data);
                        $this->communication_model->assignUser($donor_id,$this->session->userdata('user_id'));

                        output_json([
                            'status'     => false,
                            'message'    => $message,
                            'sms_status' => $data['sms_status']
                        ]);
                    }

                } else {
                    output_json([
                        'status' => false,
                        'message' => validation_errors()
                    ]);
                }
            } else {
                output_json([
                    'status' => false,
                    'message' => 'No client sent'
                ]);
            }
        }
    }

    public function change_sms_status_chat()
    {
        $user_id = $this->session->userdata('user_id');
        $donor_id = $this->input->post('donor_id');
        $status = $this->input->post('status_chat');
        $this->load->model('donor_model');
        $result = $this->donor_model->changeStatusSmsChat($user_id,$donor_id,$status);

        if($result){
            output_json([
                'status'  =>true
            ]);
        } else {
            output_json([
                'status'  => false,
                'message' => $result->message
            ]);
        }
    }

    public function get_sms_chats()
    {
        $this->load->model('communication_model');
        $status_chat = $this->input->post('status_chat');
        $user_id = $this->session->userdata('user_id');
        $church_id = $this->input->post('church_id');
        $campus_id = $this->input->post('campus_id');
        $offset = $this->input->post('offset');
        $search = $this->input->post('search');
        $refresh = $this->input->post('refresh');
        $data = $this->communication_model->getChats($status_chat,$user_id,$church_id,$campus_id,$offset,$search,$refresh);

        output_json([
            'status'     => true,
            'data'       => $data['data'],
            'more_items' => $data['more_items'],
            'timezone'   => $data['timezone']
        ]);
    }

    public function get_sms_chat_messages()
    {
        $this->load->model('communication_model');
        $client_id = $this->input->post('client_id');
        $data = $this->communication_model->getChatMessages($client_id);

        output_json([
            'status'    => true,
            'data'      => $data,
            'timezone'  => date('P')
        ]);
    }
}
