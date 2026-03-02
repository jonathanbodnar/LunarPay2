<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class slack extends My_Controller {

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            die;
        }
        $this->load->model('user_model');
        $this->load->model('organization_model');
        set_time_limit(0);
        ini_set('max_execution_time', 0);
    }
    public function validatetoken() {       
        $conn_data    = $this->getConnData();
        $dataresponse = [
            'conn_status'   => $conn_data['slack_oauth'], //===== true/false
            'message'       => '',
            'stateslack'    => $conn_data['slack_status'],
            'slack_channel' => $conn_data['slack_channel'],
        ];
        output_json($dataresponse);
    }

    private function testsendmessage() {
        $conn_data = $this->getConnData();
        $texttest  = 'Test message from LunarPay. Date:' . date('m-d-Y h:i:s a', time());
        $this->load->helper('slack');
        $result    = sendSlackMessage($conn_data['slack_oauth'], $conn_data['slack_channel'], $texttest);
        return $result;
    }

    private function getConnData() {
        $user_id    = $this->session->userdata('user_id');
        $slack_data = ['slack_status'  => $this->user_model->get($user_id, 'id, slack_status')->slack_status,
            'slack_oauth'   => $this->user_model->get($user_id, 'id, slack_oauth')->slack_oauth,
            'slack_channel' => $this->user_model->get($user_id, 'id, slack_channel')->slack_channel,
        ];
        return $slack_data;
    }

    public function savedataslack() {
        $slackoauth   = $this->input->post('slack_text_oauth');
        $slackchannel = $this->input->post('slack_channel');
        $testmessage  = $this->input->post('testmessage');
        if ($slackchannel != "" && $slackoauth != "") {
            $this->load->model('user_model');
            $save_data    = [
                'slack_oauth'   => $slackoauth,
                'slack_channel' => $slackchannel,
            ];
            $this->user_model->update($save_data, $this->session->userdata('user_id'));
            $dataresponse = ['message' => 'Data update'];
            if ($testmessage == 1) {
                $response     = ($this->testsendmessage());
                $dataresponse = ["status" => true,'message' => $response['message']];
            }
        } else {
            $dataresponse = ["status" => false,'message' => 'User Oauth Token and Prefered Channel are required' ];
        }
        output_json($dataresponse);
    }

    public function stateslider() {
        $conn_data   = $this->getConnData();
        $sliderstate = $this->input->post('slider_state');

        if ($sliderstate == 'true' && isset($conn_data['slack_oauth']) && isset($conn_data['slack_channel'])) {
            // Estate send messages E=Enable, D= Disable
            $save_data    = [
                'slack_status' => "E", // state send messages
            ];
            $this->load->model('user_model');
            $this->user_model->update($save_data, $this->session->userdata('user_id'));
            $dataresponse = ['message' => 'System enabled'];
        } else {
            $dataresponse = ['message' => 'Enter all the data'];
        }
        if ($sliderstate == 'false') {
            $save_data    = [
                'slack_status' => "D", // state send messages
            ];
            $this->load->model('user_model');
            $this->user_model->update($save_data, $this->session->userdata('user_id'));
            $dataresponse = ['message' => 'System disabled'];
        }
        output_json($dataresponse);
    }

}
