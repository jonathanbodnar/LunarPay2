<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Cron extends CI_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();
    }

    public function check_widget_installs() {
        $this->load->model('chat_setting_model');
        $chat_settings = $this->chat_setting_model->getChatSettingList('id,install_status_date',"install_status = 'C'");
        //Getting is_new_donor_before_days data
        $this->load->model('setting_model');
        $install_expiration_date = $this->setting_model->getItem('install_expiration_date');
        $expiration_date = date('Y-m-d H:i:s',strtotime('-'.$install_expiration_date.' day'));
        foreach ($chat_settings as $chat_setting){
            $install_status_date = date('Y-m-d H:i:s',strtotime($chat_setting['install_status_date']));
            if($install_status_date < $expiration_date){
                $this->chat_setting_model->updateInstallStatus($chat_setting['id'],$install_status_date,"N");
                print_r('Install Status to "Not Connected" on Chat: '.$chat_setting['id'].'<br>');
            }
        }
    }

    public function change_chat_incomplete() {
        $this->load->model('history_chat_model');
        $chats = $this->history_chat_model->getAllChatsOpen();
        $this->load->model('setting_model');
        $chat_expiration_hours = $this->setting_model->getItem('chat_expiration_hours');
        $expiration_date = date('Y-m-d H:i:s',strtotime('-'.$chat_expiration_hours.' hours'));
        foreach ($chats as $chat){
            $chat_last_date = date('Y-m-d H:i:s',strtotime($chat['created_at']));
            if($chat_last_date < $expiration_date){
                $this->history_chat_model->set_status($chat['id'],"I");
                print_r('Change to Incomplete the History Chat: '.$chat['id'].'<br>');
            }
        }
    }
    
    public function invoices($option = false) {

        if (!$option) {
            die;
        } 

        $valida = validateBearerToken(CRON_AUTH_TOKEN);

        if ($valida['error']) {
            // If the token is invalid, return an error response.
            header('Content-Type: application/json');
            echo json_encode($valida);
            http_response_code($valida['http_code']);
            die;
        }
    
        if ($option == 'set_due') {
            $this->load->model('invoice_model');
            $result = $this->invoice_model->setInvoicesAsDue();
            
            // Return the result as JSON
            header('Content-Type: application/json');
            echo json_encode($result);
            
            log_custom(LOG_CUSTOM_INFO, 'cron invoices-' . $option . ' - ' . json_encode($result));            
        }
    
        http_response_code(200);
    }
    
    
}
