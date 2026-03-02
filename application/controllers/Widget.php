<?php

defined('BASEPATH') OR exit('No direct script access allowed');
define("WIDGET_MIN_COUNT_BUTTONS", 4);

defined('FORCE_MULTI_FUNDS') OR define('FORCE_MULTI_FUNDS', FALSE);

class Widget extends CI_Controller {

    protected $recurring_options = [
        'one_time' => 'Just Once',
        'weekly' => 'Weekly',
        'monthly' => 'Monthly',
        'quarterly' => 'Quarterly',
        'yearly' => 'Yearly',
    ];

    private $session_id = null;
    private $is_session_enabled = false;
    private $bk_session_data = [];
    
    public function __construct() {

        parent::__construct();
        
        unset($this->session);
        $this->load->model('api_session_model');
        $this->load->model('chat_model');
        
        $this->load->library('widget_api_202107');
        $action = $this->router->method;        
        
        /* ------- NO ACCESS_TOKEN METHODS ------- */
        $free = ['get_settings', 'setup', 'is_logged']; //index method some times needs token validation
        /* ------- ---------------- ------ */
        
        //restrict endpoint when method/action is not in the free array OR
        if (!in_array($action, $free)) {        
            
            //BUT free index endpoint when id_bot is in the id_bot_free only
            $id_bot      = $this->input->post('id_bot');
            
            $id_bot_free =  array_column($this->chat_model->getPublicChatIds(),'id');
            
            //$id_bot_free = [35, 3, 33, 10, 5];
            
            if($action == 'index' && in_array($id_bot, $id_bot_free)) {
                $this->is_session_enabled = false;
                // ========== CONTINUE - IT'S FREE =========
            } else { //restrict - validate access token, if it does not match cut the flow
                $result = $this->widget_api_202107->validaAccessToken();
                if ($result['status'] === false) {
                    output_json_custom($result);
                    die;
                }
                $this->is_session_enabled = true;
                $this->session_id = $result['current_access_token'];
                
            }
        }
        
        //verifyx remove lines
        //$this->api_session_model->initialize($this->session_id);
        
        $this->load->model('donor_model');
        $this->load->model('chat_setting_model');
        $this->load->model('setting_model');

        $this->hash_method = $this->config->item('hash_method', 'ion_auth');
    }

    //MAIN CONTROLLERS FUNCTIONS
    public function setup(){

        $tokens_array = $this->input->post('chatgive_tokens');
        $connection   = $tokens_array['connection'];
        
        //verifyx remove lines
        //$token        = $tokens_array['token'];
        
        $page         = $tokens_array['page'];
        //$type         = $tokens_array['type']; // this is disabled currently

        if($connection == 1){
            $organization = $this->get_organization_data();
            if($organization){

                //Remove them - These will be added when logging
                //verifyx remove lines
//                $this->session->set_userdata(['tree_church_id'=> $organization->ch_id]);
//                $this->session->set_userdata(['tree_campus_id'=>null]);
//                $this->session->set_userdata(['tree_org_name'=> $organization->church_name]);
//
//                $this->api_session_model->setValue($this->session_id,'tree_church_id',$organization->ch_id);
//                $this->api_session_model->setValue($this->session_id,'tree_campus_id',null);
//                $this->api_session_model->setValue($this->session_id,'tree_org_name',$organization->church_name);
                /////////////////
                
                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);

                if(!$chat_settings){
                    $data_chat_setting = [
                        'id'                => 0,
                        'client_id'         => $organization->client_id,
                        'church_id'         => $organization->ch_id,
                        'suggested_amounts' => '["10","30","50","100"]',
                        'theme_color'       => '#000000',
                        'button_text_color' => '#ffffff'
                    ];
                    $this->chat_setting_model->save($data_chat_setting);
                    $chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);
                }

                //Get Client
                $this->load->model('user_model');
                $user = $this->user_model->get($organization->client_id);

                //Remove them - this will be added on is_logged
                //verifyx remove lines
                //$this->session->set_userdata(['tree_is_multiple_fund' => false]);
                //$this->session->set_userdata(['tree_conduit_funds' => null]);

                $conduit_funds = null;
                if(!$page){
                    if($chat_settings->type_widget == 'conduit'){ // Type of widget from script is disabled here
                        $conduit_funds = $chat_settings->conduit_funds;
                    }
                }

                //Verify Install Status
                if($chat_settings->install_status == null) {
                    //Zapier Code
                    $this->load->library('curl');
                    $url         = 'https://hooks.zapier.com/hooks/catch/8146183/ofkjj61/';
                    $zapier_data = [
                        "first_name"   => ucwords(strtolower($user->first_name)),
                        "last_name"    => ucwords(strtolower($user->last_name)),
                        "email"        => $user->email,
                        'phone'        => $user->phone,
                        'organization' => ucwords(strtolower($organization->church_name))];

                    if(ZAPIER_ENABLED)
                        $this->curl->post($url, $zapier_data);
                }
                $this->load->model('user_model');
                $starter_step = $this->user_model->getStarterStep($user->id);
                
                //verifyx why/where we need a starter_step = 8
                if($starter_step->starter_step === 7){
                    $starter_organization = $this->organization_model->getFirst($user->id);
                    if($starter_organization->ch_id === $organization->ch_id) {
                        $this->user_model->setStarterStep($user->id, 8);
                    }
                }

                $this->chat_setting_model->updateInstallStatus($chat_settings->id, date('Y-m-d H:i:s'), "C");

                //$this->security->csrf_set_cookie();
                
                output_json([
                    'status'        => true,
                    'chat_settings' => $chat_settings,
                    'new_token'     => [
                        'name'      => CSRF_TOKEN_NAME,
                        'value'     => null //$this->security->get_csrf_hash()
                    ],
                    'payment_processor' => $user->payment_processor,
                    'org_name'      => $organization->church_name
                ]);
                return;
            }
        } else if ($connection == 2){
            $suborganization = $this->get_organization_data();
            if($suborganization){
                //Remove them - These will be added when logging - use get_organization_data
                
                //verifyx remove lines
//                $this->session->set_userdata(['tree_church_id'=> $suborganization->church_id]);
//                $this->session->set_userdata(['tree_campus_id'=> $suborganization->id]);
//                $this->session->set_userdata(['tree_org_name'=> $suborganization->name]);
//
//                $this->api_session_model->setValue($this->session_id,'tree_church_id',$suborganization->church_id);
//                $this->api_session_model->setValue($this->session_id,'tree_campus_id',$suborganization->id);
//                $this->api_session_model->setValue($this->session_id,'tree_org_name',$suborganization->name);

                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);

                $this->load->model('organization_model');
                if(!$chat_settings){
                    $data_chat_setting = [
                        'id'                => 0,
                        'client_id'         => $suborganization->client_id,
                        'church_id'         => $suborganization->church_id,
                        'campus_id'         => $suborganization->id,
                        'suggested_amounts' => '["10","30","50","100"]',
                        'theme_color'       => '#000000',
                        'button_text_color' => '#ffffff'
                    ];
                    $this->chat_setting_model->save($data_chat_setting);
                    $chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);
                }

                //Get Client
                $this->load->model('user_model');
                $user = $this->user_model->get($organization->client_id);

                //Remove them - this will be added on is_logged
                //verifyx remove lines
//                $this->session->set_userdata(['tree_is_multiple_fund' => false]);
//                $this->session->set_userdata(['tree_conduit_funds' => null]);
//
//                $this->api_session_model->setValue($this->session_id,'tree_is_multiple_fund',false);
//                $this->api_session_model->setValue($this->session_id,'tree_conduit_funds',null);

                $conduit_funds = null;
                if(!$page){
                    if($chat_settings->type_widget == 'conduit'){
                        $conduit_funds = $chat_settings->conduit_funds;
                    }
                }

                //Verify Install Status
                if($chat_settings->install_status == null) {
                    //Zapier Code
                    $this->load->library('curl');
                    $url         = 'https://hooks.zapier.com/hooks/catch/8146183/ofkjj61/';
                    $zapier_data = [
                        "first_name"   => ucwords(strtolower($user->first_name)),
                        "last_name"    => ucwords(strtolower($user->last_name)),
                        "email"        => $user->email,
                        'phone'        => $user->phone,
                        'organization' => ucwords(strtolower($organization->church_name))];

                    if(ZAPIER_ENABLED)
                        $this->curl->post($url, $zapier_data);
                }
                $this->chat_setting_model->updateInstallStatus($chat_settings->id,date('Y-m-d H:i:s'),"C");

                output_json([
                    'status'        => true,
                    'chat_settings' => $chat_settings,
                    'new_token'     => [
                        'name'      => CSRF_TOKEN_NAME,
                        'value'     => null //$this->security->get_csrf_hash()
                    ],
                    'payment_processor' => $user->payment_processor,
                    'org_name'      => $suborganization->name
                ]);
                return;
            }
        }

        output_json([
            'status'  => false,
            'message' => 'Connection Refused'
        ]);
    }

    public function is_logged(){
        
        $result = $this->widget_api_202107->validaAccessToken();
        
        $this->is_session_enabled = $result['status'];
        $this->session_id = $result['current_access_token'];

        $user_id = null;
        $this->bk_session_data['tree_ready_for_register'] = 0;
        if($this->is_session_enabled){

            $church_id = $this->api_session_model->getValue($this->session_id,'tree_church_id');
            
            if(!$church_id) {
                output_json([
                    'status'    => false,
                    'chat'      => [],
                    'bk_session_data' => [],
                    'message' => 'Incorrect session'
                ]);
                $response = false;
                $this->log_out($response);
                return;
            }
            
            $campus_id = $this->api_session_model->getValue($this->session_id,'tree_campus_id');
            $user_id  = $this->api_session_model->getValue($this->session_id,'tree_user_id');
            
            $this->api_session_model->unsetValue($this->session_id,'tree_fund');
            
            $this->api_session_model->setValue($this->session_id,'tree_is_multiple_fund',0);
            $this->api_session_model->setValue($this->session_id,'tree_conduit_funds',null);

        } else {
            $organization = $this->get_organization_data();
            $church_id = $organization->church_id;
            $campus_id = $organization->campus_id;
            
            $this->bk_session_data['tree_is_multiple_fund'] = 0;
            $this->bk_session_data['tree_conduit_funds'] = null;
            $this->bk_session_data['tree_org_name'] = $organization->church_name;
        }

        //Get Organization / Client Id
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($church_id,'client_id,church_name');

        //Setting Multiple Funds
        $this->setting_multiple_funds($church_id,$campus_id,$organization->client_id,$this->input->post('chatgive_tokens')['page']);

        $user = null;
        if($user_id && $church_id)
            $user = $this->donor_model->is_logged($user_id,$church_id,$campus_id);

        $is_logged = false;
        if($user){
            $is_logged = true;
        }

        $is_logged_value = 0;

        $is_multiple_fund = null;
        if($this->is_session_enabled){
            $is_multiple_fund = $this->api_session_model->getValue($this->session_id,'tree_is_multiple_fund');            
        } else {
            $is_multiple_fund = $this->bk_session_data['tree_is_multiple_fund'];
        }

        if($is_multiple_fund){
            if($user){
                $is_logged_value = 11;
            } else {
                $is_logged_value = 10;
            }
        } else {
            if($user){
                $is_logged_value = 1;
            }
        }

        $id_bot = $this->input->post('id_bot');
        $child_selected = $this->chat_model->getChildSelected($id_bot,$is_logged_value,$church_id,$campus_id);
        if($child_selected->customize_text !== null){
            $child_selected->html = $child_selected->customize_text;
        }

        //Get Methods
        $method_get = $child_selected->method_get;
        $data_get = null;
        if($method_get) {
            $data_complete = $this->$method_get();
            if($data_complete['html']){
                $child_selected->html .= $data_complete['html'];
            }
            $data_get = $data_complete['data'];
        }

        if($child_selected->replace){
            $replaces = explode(',',$child_selected->replace);
            foreach ($replaces as $replace){
                $child_selected->html = $this->replace($child_selected->html,$replace);
            }
        }

        $data = array(
            'id_bot'    => $child_selected->child_id,
            'html'      => $child_selected->html,
            'type_set'  => $child_selected->type_set,
            'type_get'  => $child_selected->type_get,
            'back'      => $child_selected->back,
            'is_logged' => $is_logged,
            'data'      => $data_get,
        );

        
        $data_history = [
            'church_id'  => $church_id,
            'campus_id'  => $campus_id,
            'status'     => 'O',
            'donor_id'   => $is_logged ? $user_id : null,
            'created_at' => date("Y-m-d H:i:s")
        ];

        $this->load->model('history_chat_model');
        $history_chat = $this->history_chat_model->create_history($data_history);

        if($this->is_session_enabled) {
            $this->api_session_model->setValue($this->session_id, 'tree_history_chat_id', $history_chat);
        } else {
            $this->bk_session_data['tree_history_chat_id'] = $history_chat;
        }

        $data_history_detail = [
            'chat_tree_id'    => $child_selected->child_id,
            'history_chat_id' => $history_chat,
            'type'            => 'S',
            'message'         => trim(strip_tags($this->strip_tags_content($child_selected->html))),
            'created_at'      => date("Y-m-d H:i:s")
        ];

        $this->history_chat_model->create_history_detail($data_history_detail);

        output_json([
            'status'    => true,
            'chat'      => $data,
            'bk_session_data' => $this->bk_session_data
        ]);
    }

    public function index()
    {
        $id_bot = $this->input->post('id_bot');
        $answer = $this->input->post('answer');

        ////WE NEED VALIDATE HISTORY CHAT HERE!!!!!
        $this->bk_session_data = $this->input->post('bk_session_data');
        $organization = null;
        if($this->is_session_enabled){
            $history_chat_id = $this->api_session_model->getValue($this->session_id, 'tree_history_chat_id');
            $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
            $campus_id = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');
            
        } else {
            $history_chat_id =  $this->bk_session_data['tree_history_chat_id'];
            $organization = $this->get_organization_data();
            $church_id = $organization->church_id;
            $campus_id = $organization->campus_id;
        }

        $this->load->model('history_chat_model');

        //Back when another previous button is clicked
        $is_back = $this->input->post('is_back');
        if($is_back){

            if($this->is_session_enabled) {
                $user_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
                if ($id_bot == 10) { // STEP ID_BOT 10 = SET AMOUNT WHEN IS NOT LOGGED
                    //IF IS LOGGED SKIP LOG IN STEP
                    if ($user_id) {
                        $id_bot = 2;
                    }
                }
            }

            $history = $this->history_chat_model->getById($church_id,$campus_id,$history_chat_id);
            $history_messages = $this->history_chat_model->getChatMessages($history_chat_id);
            if($history->status == 'C'){
                $data_history = [
                    'church_id'  => $church_id,
                    'campus_id'  => $campus_id,
                    'status'     => 'O',
                    'donor_id'   => $user_id ? $user_id : null,
                    'session_id' => session_id(),
                    'created_at' => date("Y-m-d H:i:s")
                ];

                $this->load->model('history_chat_model');
                $history_chat_id = $this->history_chat_model->create_history($data_history);

                if($this->is_session_enabled) {
                    $this->api_session_model->setValue($this->session_id, 'tree_history_chat_id', $history_chat_id);
                } else {
                    $this->bk_session_data['tree_history_chat_id'] = $history_chat_id;
                }

                foreach (array_reverse($history_messages) as $message) {
                    if($message['chat_tree_id'] == $id_bot && $message['direction'] == 'R'){
                        break;
                    }
                    if($id_bot == 2 && $message['chat_tree_id'] == 11 && $message['direction'] == 'R'){
                        break;
                    }
                    $data_history_detail = [
                        'chat_tree_id'    => $message['chat_tree_id'],
                        'history_chat_id' => $history_chat_id,
                        'type'            => $message['direction'],
                        'message'         => $message['text'],
                        'created_at'      => date("Y-m-d H:i:s")
                    ];
                    $this->history_chat_model->create_history_detail($data_history_detail);
                }
            } else {
                foreach ($history_messages as $message) {
                    if ($message['direction'] == 'S') {
                        $chat_history = $this->chat_model->getChat($message['chat_tree_id']);
                        if ($chat_history->sessions) {
                            $sessions_vars = explode(',', $chat_history->sessions);
                            foreach ($sessions_vars as $var) {
                                if($this->is_session_enabled) {
                                    $this->api_session_model->unsetValue($this->session_id, 'tree_' . $var);
                                } else {
                                    unset($this->bk_session_data['tree_' . $var]);
                                }
                            }
                        }
                        if ($message['chat_tree_id'] == $id_bot) {
                            break;
                        }
                    }
                    $this->history_chat_model->deleteMessage($message['id']);
                }
            }
        }

        $current_chat = $this->chat_model->getChat($id_bot);
        $history_answer = $answer;
        if (in_array($current_chat->method_get, ['save_credit_card_form', 'save_bank_account_form'])) {
            $history_answer = '[Hidden Payment Data]';
        }

        //Saving Method on First Register
        if ($current_chat->type_set === 'form_method') {
            $data_payment = $this->save_payment_method($answer);
            if ($data_payment['data']['status'] === false) {

                $data = array(
                    'id_bot' => $id_bot,
                    'html' => $data_payment['data']['message'],
                    'type_set' => $current_chat->type_set,
                    'type_get' => $current_chat->type_get,
                    'data' => null,
                );

                output_json([
                    'status' => false,
                    'chat' => $data
                ]);
                return;
            }
        }

        //Wrong Answer - Buttons Validation
        if (($current_chat->type_get === "buttons" || $current_chat->type_get === "buttons_methods") && empty($answer)) {
            $data_history_detail = [
                'chat_tree_id' => $id_bot,
                'history_chat_id' => $history_chat_id,
                'type' => 'R',
                'message' => trim(strip_tags($this->strip_tags_content($this->input->post('bk_answer')))),
                'created_at' => date("Y-m-d H:i:s")
            ];
            $this->history_chat_model->create_history_detail($data_history_detail);

            $data = array(
                'id_bot' => $id_bot,
                'html' => "Invalid Response",
                'type_set' => $current_chat->type_set,
                'type_get' => $current_chat->type_get,
                'is_validation' => true,
                'data' => null,
            );

            $data_history_detail = [
                'chat_tree_id' => 0,
                'history_chat_id' => $history_chat_id,
                'type' => 'S',
                'message' => "Invalid Response",
                'created_at' => date("Y-m-d H:i:s")
            ];
            $this->history_chat_model->create_history_detail($data_history_detail);

            output_json([
                'status' => true,
                'chat' => $data
            ]);
            return;
        }

        //Hidden History Chat Payment data
        $answer_json = json_decode($answer);
        if ($answer_json && is_object($answer_json)) {
            if ($current_chat->type_set === 'form_password') {
                $history_answer = '••••••••••';
            } else if ($current_chat->type_set === 'form_method') {
                $history_answer = '[Hidden Payment Data]';
            } else if ($current_chat->type_get === 'no_send_form') {
                $history_answer = '[Hidden Payment Data]';
            } else if ($current_chat->method_get === 'login_form') {
                $history_answer = '[Hidden Credentials]';
            } else if ($current_chat->method_set === 'set_recurrent_date') {
                $history_answer = $answer_json->recurring_date;
            } else if ($current_chat->method_set === 'set_amount_fee') {
                $history_answer = $answer_json->answer;
            } else if ($current_chat->method_set === 'update_exp_date') {
                $history_answer = '[Hidden Card Data]';
            } else {
                $history_answer = $answer_json->answer;
            }
        }

        if ($current_chat->method_set === 'payment_checking') {
            $history_answer = '[Hidden Payment Data]';
        }

        if ($current_chat->type_get === "buttons" || $current_chat->type_get === "buttons_methods") {
            $history_answer = $this->input->post('button_text');
            if (!$history_answer || empty($history_answer)) {
                $history_answer = $this->input->post('bk_answer');
            }
            $data_history_detail = [
                'chat_tree_id' => $id_bot,
                'history_chat_id' => $history_chat_id,
                'type' => 'R',
                'message' => trim(strip_tags($this->strip_tags_content($history_answer))),
                'created_at' => date("Y-m-d H:i:s")
            ];
            $this->history_chat_model->create_history_detail($data_history_detail);
        } else {
            if (!empty($history_answer) && $current_chat->type_set !== 'auto_message') {
                $data_history_detail = [
                    'chat_tree_id' => $id_bot,
                    'history_chat_id' => $history_chat_id,
                    'type' => 'R',
                    'message' => trim($history_answer),
                    'created_at' => date("Y-m-d H:i:s")
                ];
                $this->history_chat_model->create_history_detail($data_history_detail);
            }
        }


        //validate answer
        $validation_result = $this->validation($answer, $current_chat->answer_type);
        if ($validation_result['status'] === false) {
            $data = array(
                'id_bot' => $id_bot,
                'html' => $validation_result['message'],
                'type_set' => $current_chat->type_set,
                'type_get' => $current_chat->type_get,
                'is_validation' => true,
                'data' => null
            );
            $status = true;
            if ($current_chat->method_get === 'recurring_date_form') {
                $status = false;
            }

            $data_history_detail = [
                'chat_tree_id' => 0,
                'history_chat_id' => $history_chat_id,
                'type' => 'S',
                'message' => trim(strip_tags($this->strip_tags_content($validation_result['message']))),
                'created_at' => date("Y-m-d H:i:s")
            ];
            $this->history_chat_model->create_history_detail($data_history_detail);

            output_json([
                'status' => $status,
                'chat' => $data
            ]);
            return;
        }

        $method_set = $current_chat->method_set;
        $child_selected = null;

        //Set Methods
        $value = true;
        $returned_data = null;
        
        if ($current_chat->set)
            $returned_data = $this->$method_set($current_chat->set, $answer);
        else {
            if ($method_set)
                $returned_data = $this->$method_set($answer);
        }

        if(is_array($returned_data)){
            if($returned_data['status'] == true){
                $value = $returned_data['result'];
            } else { //when error getting data as array
                $data = array(
                    'id_bot'        => $id_bot,
                    'html'          => $returned_data['message'],
                    'type_set'      => $current_chat->type_set,
                    'type_get'      => $current_chat->type_get,
                    'is_validation' => true,
                    'data'          => null
                );
                output_json([
                    'status' => true,
                    'chat'   => $data,
                    'bk_session_data' => $this->bk_session_data
                ]);
                return;
            }
        } else {
            $value = $returned_data;
        }

        $value = $value !== null ? $value : true;

        //Getting Multiple Fund Variable
        $is_multiple_fund = null;
        if($this->is_session_enabled){
            $is_multiple_fund = $this->api_session_model->getValue($this->session_id, 'tree_is_multiple_fund');
        } else {
            $is_multiple_fund = $this->bk_session_data['tree_is_multiple_fund'];
        }

        //Checking if Save Payment Method on register is multiple fund
        if ($current_chat->type_set === "form_method"){
            if($is_multiple_fund){
                $value = 11;
            }
        }

        $child_selected = $this->chat_model->getChildSelected($id_bot, $value, $church_id, $campus_id);

        if ($child_selected->customize_text !== null) {
            $child_selected->html = $child_selected->customize_text;
        }
        
        //Get Methods
        $method_get = $child_selected->method_get;
        $data_get = null;
        if ($method_get) {
            $data_complete = $this->$method_get($answer);
            if ($data_complete['html']) {
                $child_selected->html .= $data_complete['html'];
            }
            $data_get = $data_complete['data'];

            //Saving Successful Message on payment
            if ($method_get === 'payment') {
                $this->api_session_model->setValue($this->session_id,'tree_successful_message',$data_get['message']);
            } 
        }

        if($child_selected->replace){
            $replaces = explode(',',$child_selected->replace);
            foreach ($replaces as $replace){
                $child_selected->html = $this->replace($child_selected->html,$replace);
            }
        }
        
        $data = array(
            'id_bot' => $child_selected->child_id,
            'html' => $child_selected->html,
            'type_set' => $child_selected->type_set,
            'type_get' => $child_selected->type_get,
            'back' => $child_selected->back,
            'data' => $data_get
        );

        if ($child_selected->type_set === 'end') {
            $message = $this->api_session_model->getValue($this->session_id, 'tree_successful_message');
            $data['html'] = $message;
        }

        //Validation for Save Payment Method
        $main_status = true;
        if ($child_selected->method_get === "save_payment_method") {
            $main_status = $data_get['status'];
            if ($main_status === false) {
                $data['html'] = $data_get['message'];
            }
        } 
        
        //Login when user already exist
        if ($current_chat->method_set === 'set_security_code' && !$this->bk_session_data['tree_ready_for_register']) {
            $data['is_logging'] = true;
            $data['session_enabled_ids'] = $this->chat_model->getSessionEnabledIds();;

            $data[WIDGET_AUTH_OBJ_VAR_NAME][WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME] = $returned_data['access_token'];
            $data[WIDGET_AUTH_OBJ_VAR_NAME][WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME] = $returned_data['refresh_token'];
            
            $this->bk_session_data = [];
        }

        //Register when user doesn't exist
        if ($child_selected->method_get === 'register') {
            $data['is_logging'] = true;
            $data['session_enabled_ids'] = $this->chat_model->getSessionEnabledIds();;
            $this->bk_session_data = [];
            
            $this->api_session_model->setValue($this->session_id, 'tree_church_id', $church_id);
            $this->api_session_model->setValue($this->session_id, 'tree_campus_id', $campus_id);
            $this->api_session_model->setValue($this->session_id, 'tree_org_name', $organization ? $organization->church_name : '');
        }

        if (!empty($data['html'])){
            $data_history_detail = [
                'chat_tree_id' => $child_selected->child_id,
                'history_chat_id' => $history_chat_id,
                'type' => 'S',
                'message' => trim(strip_tags($this->strip_tags_content($data['html']))),
                'created_at' => date("Y-m-d H:i:s")
            ];
            $this->history_chat_model->create_history_detail($data_history_detail);
        }

        //Saving Failed message on History
        if ($method_get === 'payment') {
            if ($data_get['status'] === false) {
                $data_history_detail = [
                    'chat_tree_id' => $child_selected->child_id,
                    'history_chat_id' => $history_chat_id,
                    'type' => 'S',
                    'message' => trim(strip_tags($data_get['message'])),
                    'created_at' => date("Y-m-d H:i:s")
                ];
                $this->history_chat_model->create_history_detail($data_history_detail);
            }
        }

        output_json([
            'status'  => $main_status,
            'chat'    => $data,
            'bk_session_data' => $this->bk_session_data
        ]);
    }

    public function back() {

        $id_bot = $this->input->post('id_bot');

        $current_chat = $this->chat_model->getChat($id_bot);

        if($current_chat->replace){
            $replaces = explode(',',$current_chat->replace);
            foreach ($replaces as $replace){
                $current_chat->html = $this->replace($current_chat->html,$replace);
            }
        }

        //Get Methods
        $method_get = $current_chat->method_get;
        $data_get = null;
        if($method_get) {
            $data_complete = $this->$method_get(null);
            if($data_complete['html']){
                $current_chat->html .= $data_complete['html'];
            }
            $data_get = $data_complete['data'];
        }

        $data = array(
            'id_bot'    => $current_chat->id,
            'html'      => $current_chat->html,
            'type_set'  => $current_chat->type_set,
            'type_get'  => $current_chat->type_get,
            'back'      => $current_chat->back,
            'data'      => $data_get
        );

        output_json([
            'status'  => true,
            'chat'    => $data,
            'bk_session_data' => $this->bk_session_data
        ]);
    }

    // log_out is being rehused privately too when error ocurred
    public function log_out($response = true){
        
        $accessToken = $this->widget_api_202107->getAccessToken($this->session_id);
        
        $this->widget_api_202107->deleteAccessToken($this->session_id);
        $this->widget_api_202107->deleteRefreshTokenByUserId($accessToken->user_id);

        if($response) {        
            output_json([
                'status'    => true
            ]);
        }
    }

    public function get_settings(){

        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');

        $tokens_array = $this->input->post('tokens');
        $connection   = $tokens_array['connection'];
        $token        = $tokens_array['token'];

        if($connection == 1){
            $this->load->model('organization_model');
            $organization = $this->organization_model->getByToken($token);
            if($organization){

                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);

                //$this->security->csrf_set_cookie();

                output_json([
                    'status'        => true,
                    'chat_settings' => $chat_settings
                ]);
                return;
            }
        } elseif ($connection == 2) {
            $this->load->model('suborganization_model');
            $suborganization = $this->suborganization_model->getByToken($token);
            if($suborganization){

                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);

                output_json([
                    'status'        => true,
                    'chat_settings' => $chat_settings
                ]);
                return;
            }
        }

        output_json([
            'status'  => false,
            'message' => 'Connection Refused'
        ]);
    }

    //VALIDATION FUNCTION
    private function validation($answer,$type)
    {
        switch ($type){
            case 'yes_no':
                $answer = (string)$answer;
                $answer_json = json_decode($answer);
                if($answer_json && is_object($answer_json)){
                    $answer= strtolower($answer_json->answer);
                } else {
                    $answer= strtolower($answer);
                }

                $this->load->model("setting_model");
                $yes_options = json_decode($this->setting_model->getItem('yes_options'));
                $no_options = json_decode($this->setting_model->getItem('no_options'));

                if(!in_array($answer,$yes_options) && !in_array($answer,$no_options)
                )
                    return [
                        'status'  => false,
                        'message' => 'Invalid answer'
                    ];
                break;
            case 'money':
                $answer = (float)str_replace('$','',$answer);
                if($answer <= 0)
                    return [
                        'status'  => false,
                        'message' => 'Incorrect amount, please type a correct amount'
                    ];
                break;
            case 'money_or_quickgive':
                if($answer === 'quickgive'){
                    break;
                }
                $answer = (float)str_replace('$','',$answer);
                if($answer <= 0)
                    return [
                        'status'  => false,
                        'message' => 'Incorrect amount, please type a correct amount'
                    ];
                break;
            case 'date':
                $answer = (string)$answer;
                $answer_json = json_decode($answer);
                if($answer_json && is_object($answer_json)){
                    $answer= $answer_json->recurring_date;
                }
                if(!DateTime::createFromFormat('m/d/Y',$answer)){
                    return [
                        'status'  => false,
                        'message' => 'Invalid Date'
                    ];
                }
                break;
        }

        return [
            'status' => true,
        ];
    }

    //SET FUNCTIONS
    private function set($name,$value){
        $value = trim($value);
        if($name === 'first_name')
            $value = ucfirst(strtolower($value));
        if($name === 'email')
            $value = strtolower($value);

        if($this->is_session_enabled) {
            $this->api_session_model->setValue($this->session_id, $name, $value);
        } else {
            $this->bk_session_data['tree_' . $name] = is_bool($value) ? ($value ? 1 : 0) : $value;
        }
        return true;
    }

    private function set_fund($answer){
        $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($church_id);
        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        if($user->payment_processor === "PSF") {
            $treeAmountGross = $this->api_session_model->getValue($this->session_id, 'tree_amount_gross');
            $this->api_session_model->setValue($this->session_id,'tree_fund',[['fund_id' => $answer , 'fund_amount' => $treeAmountGross]]);
        } else {
            $this->api_session_model->setValue($this->session_id,'tree_fund',$answer);
        }
        return true;
    }

    private function set_fund_multiple($answer){
        if($answer === 'quickgive'){
            $donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

            $this->load->model('donation_model');
            $donation = $this->donation_model->getLastDonation($donor_id);

            $this->api_session_model->setValue($this->session_id,'tree_amount',$donation->total_amount);

            ///////// Build the fund_data setup
            $fund_data              = [];
            $fund_ids               = explode(',', $donation->fund_ids);
            $fund_conceived_amounts = explode(',', $donation->is_fee_covered ? $donation->fund_nets : $donation->fund_amounts);
            foreach ($fund_ids as $i => $fund_id) {
                $fund_data [] = ['fund_id' => $fund_id, 'fund_amount' => $fund_conceived_amounts[$i]];
            }
            
            $this->api_session_model->setValue($this->session_id,'tree_fund',$fund_data);
            /////////////////////////////

            $this->api_session_model->setValue($this->session_id,'tree_payment_method',$donation->customer_source_id);
            $this->api_session_model->setValue($this->session_id,'tree_save_source',0);
            $this->api_session_model->setValue($this->session_id,'tree_recurring','one_time');
            $this->api_session_model->setValue($this->session_id,'tree_is_recurring_today',0);
            $this->api_session_model->setValue($this->session_id,'tree_recurrent_date','');
            $this->api_session_model->setValue($this->session_id,'tree_is_cover_fee',$donation->is_fee_covered === '1' ? 'yes' : 'no');

            if($donation->payment_method == 'Card') {
                if(strlen($donation->source_exp_year) == 4){ //verifyx_paysafe
                    $expYear = substr($donation->source_exp_year, 2);
                } else {
                    $expYear = $donation->source_exp_year;
                }

                $exp_date = date_create_from_format('m/y/d', $donation->source_exp_month.'/'.$expYear.'/1')->format('Y/m/d');
                $now = date('Y/m/d');
                if($now > $exp_date){

                    $this->api_session_model->setValue($this->session_id,'tree_is_repeat_quickgive',1);
                    $this->api_session_model->setValue($this->session_id,'tree_is_exp_date',1);

                    return  5;
                }
            }

            return 2;
        } else {
            $fund_id = $answer;
            $fund_order_id = $this->input->post('fund_order_id');
            $donor_id = null;
            if($this->is_session_enabled) {
                
                $this->api_session_model->setValue($this->session_id, 'tree_last_fund_multiple', $fund_id);

                $funds = $this->api_session_model->getValue($this->session_id, 'tree_fund') ? $this->api_session_model->getValue($this->session_id, 'tree_fund') : [];

                if ($fund_order_id <= count($funds)) {

                    $funds = array_slice($funds, 0, $fund_order_id - 1);
                    $this->api_session_model->setValue($this->session_id, 'tree_fund', $funds);

                }

                $this->api_session_model->setValue($this->session_id, 'tree_last_fund_order_id', $fund_order_id);

                $donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
            } else {

                $this->bk_session_data['tree_last_fund_multiple'] = $fund_id;

                $funds =  isset($this->bk_session_data['tree_fund']) ? $this->bk_session_data['tree_fund'] : [];

                if ($fund_order_id <= count($funds)) {

                    $funds = array_slice($funds, 0, $fund_order_id - 1);

                    $this->bk_session_data['tree_fund'] = $funds;
                }

                $this->bk_session_data['tree_last_fund_order_id'] = $fund_order_id;
            }
            if ($donor_id) {
                return 11;
            }
            return 1;
        }
    }

    private function set_fund_multiple_loop($answer){
        if(is_numeric($answer)) {
            $fund_id = $answer;
            $fund_order_id = $this->input->post('fund_order_id');
            
            $this->api_session_model->setValue($this->session_id, 'tree_last_fund_multiple', $fund_id);

            $funds = $this->api_session_model->getValue($this->session_id, 'tree_fund') ? $this->api_session_model->getValue($this->session_id, 'tree_fund') : [];

            //Removing Funds When Back Fund is clicked
            if ($fund_order_id <= count($funds)) {
                $funds = array_slice($funds, 0, $fund_order_id - 1);
                $this->api_session_model->setValue($this->session_id, 'tree_fund', $funds);
            }

            $this->api_session_model->setValue($this->session_id, 'tree_last_fund_order_id', $fund_order_id);

            return 11;
        } else {

            $fund_order_id = $this->input->post('fund_order_id');
            $funds = $this->api_session_model->getValue($this->session_id, 'tree_fund') ? $this->api_session_model->getValue($this->session_id, 'tree_fund') : [];

            //Removing Funds When Back Fund is clicked
            if ($fund_order_id <= count($funds)) {
                $funds = array_slice($funds, 0, $fund_order_id - 1);
                $this->api_session_model->setValue($this->session_id, 'tree_fund', $funds);
            }

            $this->set_amount_gross_on_multiple_fund();
            return 1;
        }
    }

    private function set_amount_gross_logged($answer)
    {
        $this->api_session_model->setValue($this->session_id,'tree_is_repeat_quickgive',0);
        if($answer === 'quickgive'){
            $donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

            $this->load->model('donation_model');
            $donation = $this->donation_model->getLastDonation($donor_id);

            $this->api_session_model->setValue($this->session_id,'tree_amount',$donation->total_amount);

            ///////// Build the fund_data setup
            $fund_data              = [];
            $fund_ids               = explode(',', $donation->fund_ids);
            $fund_conceived_amounts = explode(',', $donation->is_fee_covered ? $donation->fund_nets : $donation->fund_amounts);
            foreach ($fund_ids as $i => $fund_id) {
                $fund_data [] = ['fund_id' => $fund_id, 'fund_amount' => $fund_conceived_amounts[$i]];
            }
            $this->api_session_model->setValue($this->session_id,'tree_fund',$fund_data);
            /////////////////////////////

            $this->api_session_model->setValue($this->session_id,'tree_payment_method',$donation->customer_source_id);
            $this->api_session_model->setValue($this->session_id,'tree_save_source',0);
            $this->api_session_model->setValue($this->session_id,'tree_recurring','one_time');
            $this->api_session_model->setValue($this->session_id,'tree_is_recurring_today',0);
            $this->api_session_model->setValue($this->session_id,'tree_recurrent_date','');
            $this->api_session_model->setValue($this->session_id,'tree_is_cover_fee',$donation->is_fee_covered === '1' ? 'yes' : 'no');

            if($donation->payment_method == 'Card') {
                if(strlen($donation->source_exp_year) == 4){ //verifyx_paysafe
                    $expYear = substr($donation->source_exp_year, 2);
                } else {
                    $expYear = $donation->source_exp_year;
                }

                $exp_date = date_create_from_format('m/y/d', $donation->source_exp_month.'/'.$expYear.'/1')->format('Y/m/d');
                $now = date('Y/m/d');
                if($now > $exp_date){

                    $this->api_session_model->setValue($this->session_id,'tree_is_repeat_quickgive',1);
                    $this->api_session_model->setValue($this->session_id,'tree_is_exp_date',1);

                    return  5;
                }
            }

            return 2;
        } else {
            $this->api_session_model->setValue($this->session_id,'tree_amount_gross',$answer);
            return 1;
        }
    }

    private function set_amount_to_fund($answer) {
        $amount_found = $answer;
        $fund_id = $this->input->post('fund_id');
        $fund_order_id = $this->input->post('fund_order_id');
        $funds = $this->api_session_model->getValue($this->session_id, 'tree_fund') ? $this->api_session_model->getValue($this->session_id, 'tree_fund') : [];

        if($fund_order_id <= count($funds)) {
            $funds = array_slice($funds, 0,$fund_order_id - 1); // removing funds when back to fund
        }

        $funds[] = ['fund_id' => $fund_id, 'fund_amount' => $amount_found];
        
        $this->api_session_model->setValue($this->session_id,'tree_fund',$funds);

        $conduit_funds = [];
        if($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds')) {
            $conduit_funds = json_decode($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds'));
        }

        if(count($funds) >= count($conduit_funds)) {
            $this->set_amount_gross_on_multiple_fund();
            return 1;
        }
          else
            return 10;
    }

    private function check_continue_multiple_funds($answer){
        $answer = strtolower($answer);

        $this->load->model("setting_model");
        $yes_options = json_decode($this->setting_model->getItem('yes_options'));

        if(in_array($answer,$yes_options)){
            return 10;
        } else {
            $this->set_amount_gross_on_multiple_fund();
            return 1;
        }
    }

    private function set_amount_fee($answer) {
        $this->api_session_model->setValue($this->session_id, 'tree_is_cover_fee', $answer);
        $answer = $this->format_yes_no(strtolower($answer));
        $this->api_session_model->setValue($this->session_id, 'tree_is_cover_fee_boolean', $answer);

        if($answer == 1){
            $fee = (float)$this->api_session_model->getValue($this->session_id, 'tree_fee');
            $amount = (float)$this->api_session_model->getValue($this->session_id, 'tree_amount_gross');
            
            $this->api_session_model->setValue($this->session_id,'tree_bk_amount',$amount);

            $this->api_session_model->setValue($this->session_id,'tree_amount',$amount + $fee);

        } else {
            $amount = (float)$this->api_session_model->getValue($this->session_id, 'tree_amount_gross');
            
            $this->api_session_model->setValue($this->session_id,'tree_bk_amount',$amount);

            $this->api_session_model->setValue($this->session_id,'tree_amount',$amount);
        }
        return 2;
    }

    private function set_save_source($save_source)
    {
        $save_source = $this->format_yes_no(strtolower($save_source));
        
        $this->api_session_model->setValue($this->session_id,'tree_save_source',$save_source);

        return 4;
    }

    private function set_recurrent($recurring){
        $recurring = strtolower($recurring);
        
        $this->api_session_model->setValue($this->session_id,'tree_recurring',$recurring);

        $this->api_session_model->setValue($this->session_id,'tree_chosen_frequency',$this->recurring_options[$recurring]);
        switch($recurring) {
            case 'one_time':
                return 2;
            default:
                return 1;
        }
    }

    private function is_recurring_today($answer){
        $answer = strtolower($answer);

        $this->load->model("setting_model");
        $yes_options = json_decode($this->setting_model->getItem('yes_options'));

        if(in_array($answer,$yes_options)){
            $this->api_session_model->setValue($this->session_id,'tree_is_recurring_today',true);

            return 2;
        } else {
            
            $this->api_session_model->setValue($this->session_id,'tree_is_recurring_today',false);

            return 0;
        }
    }

    private function set_recurrent_date($data_recurring_date){
        $data = json_decode($data_recurring_date);
        $recurring_date = $data->recurring_date;
        
        $this->api_session_model->setValue($this->session_id,'tree_recurrent_date',$recurring_date);

        return 2;
    }

    private function set_payment_method($method){
       
        $this->api_session_model->setValue($this->session_id,'tree_payment_method',$method);

        $this->api_session_model->setValue($this->session_id,'tree_is_exp_date',0);

        $user_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        $returned_value = 4;
        $source_selected = null;
        $method_selected  = "";
        if($method === 'new_credit_card') {
            $method_selected = 'card';
            $returned_value = 2;
        } else if($method === 'new_bank_account') {
            $method_selected = 'bank';
            $returned_value = 3;
        } else {
            $this->load->model('sources_model');
            $source_selected = $this->sources_model->getOne($user_id,$method,"source_type,exp_month,exp_year",true);
            $method_selected = $source_selected->source_type;
        }

        $amount = (float)$this->api_session_model->getValue($this->session_id, 'tree_amount_gross');
        $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($church_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        if($user->payment_processor == 'EPP') {
            $this->load->helper('epicpay');

            $ep_tpl_params = getEpicPayTplParams($organization->epicpay_template);

            if ($method_selected == 'bank') {
                $p = (float)($ep_tpl_params['var_bnk']);
                $k = (float)($ep_tpl_params['kte_bnk']);
                $amount = (($amount + $k) / (1 - $p)) - $amount;
            } else if ($method_selected == 'card') {
                $p = (float)($ep_tpl_params['var_cc']);
                $k = (float)($ep_tpl_params['kte_cc']);
                $amount = (($amount + $k) / (1 - $p)) - $amount;
            }
        } elseif ($user->payment_processor == 'PSF') {
            $this->load->helper('paysafe');
            $tpl_params = getPaySafeTplParams($organization->paysafe_template);
            if ($method_selected == 'bank') {
                $p = (float)($tpl_params['var_bnk']);
                $k = (float)($tpl_params['kte_bnk']);
                $amount = (($amount + $k) / (1 - $p)) - $amount;
            } else if ($method_selected == 'card') {
                $p = (float)($tpl_params['var_cc']);
                $k = (float)($tpl_params['kte_cc']);
                $amount = (($amount + $k) / (1 - $p)) - $amount;
            }
        }

        $this->api_session_model->setValue($this->session_id,'tree_fee',round($amount,2));

        if($source_selected && $method_selected == 'card') {
            if(strlen($source_selected->exp_year) == 4){ //verifyx_paysafe
                $expYear = substr($source_selected->exp_year, 2);
            } else {
                $expYear = $source_selected->exp_year;
            }
            
            $exp_date = date_create_from_format('m/y/d', $source_selected->exp_month.'/'.$expYear.'/1')->format('Y/m/d');
            $now = date('Y/m/d');
            if($now > $exp_date){
                
                $this->api_session_model->setValue($this->session_id,'tree_is_exp_date',1);

                $returned_value = 5;
            }
        }

        return $returned_value;
    }

    private function payment_checking($answer)
    {
        if($answer === "back")
            return 2;
        else{
            $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
            $recurring = $this->api_session_model->getValue($this->session_id, 'tree_recurring');
            $this->load->model('organization_model');
            $organization = $this->organization_model->get($organization_id);

            $this->load->model('user_model');
            $user = $this->user_model->get($organization->client_id);

            if(($user->payment_processor == 'PSF' && $recurring !== 'one_time')
                || ($user->payment_processor == 'PSF' && $answer === 'sepa')) {
                return 4;
            } else {
                return 1;
            }
        }

    }

    private function answer_save_method($answer)
    {
        $answer = strtolower($answer);

        $this->load->model("setting_model");
        $yes_options = json_decode($this->setting_model->getItem('yes_options'));

        if(in_array($answer,$yes_options)
        ){
            return 2;
        } else {
            return 1;
        }
    }

    private function set_method_save($method) {
        $this->api_session_model->setValue($this->session_id,'tree_method_save',$method);

        if($method === 'new_credit_card')
            return 1;
        if($method === 'new_bank_account')
            return 2;

        return 0;
    }

    private function save_payment_method($payment_method)
    {
        $donorId     = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        $method_save = $this->api_session_model->getValue($this->session_id, 'tree_method_save');

        $request = json_decode($payment_method);

        $this->load->model('donor_model');
        $donor = $this->donor_model->get(['id' => $donorId], ['id', 'email', 'id_church']);

        $request->email            = $donor->email;
        $request->account_donor_id = $donor->id;
        $request->email            = $donor->email;
        $request->church_id        = $donor->id_church;
        $request->payment_method   = str_replace('new_','', $method_save);

        $request->save_source = 'Y';

        require_once 'application/controllers/extensions/Payments.php';
        $pResult = Payments::addPaymentSource($request);

        $data = [
            'html' => null,
            'data' => $pResult
        ];

        return $data;
    }

    private function update_exp_date($data_update_exp_date){
        $data = json_decode($data_update_exp_date);
        $exp_date = $data->card_date;
        $postal_code = $data->postal_code;
        
        //===== used for paysafe only
        $holder_name = isset($data->holder_name) ? $data->holder_name : null;
        $street = isset($data->street) ? $data->street : null;
        $street2 = isset($data->street2) ? $data->street2 : null;
        $city = isset($data->city) ? $data->city : null;
        $country = isset($data->country) ? $data->country : null;
        
        $user_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        $source_id = $this->api_session_model->getValue($this->session_id, 'tree_payment_method');

        $this->load->model('sources_model');
        $this->sources_model->getOne($user_id,$source_id,"epicpay_wallet_id",true);

        // Use $exp_date  and $source_selected->epicpay_wallet_id;
        require_once 'application/controllers/extensions/Payments.php';
        $pResult = Payments::update_expiration_date($source_id, $postal_code, $exp_date, $holder_name, $street, $street2, $city, $country);

        //Use this sessions to set validation on next step

        $this->api_session_model->setValue($this->session_id,'tree_exp_date_status',$pResult['status']);

        $this->api_session_model->setValue($this->session_id,'tree_exp_date_message',$pResult['message']);

        $is_repeat_quickgive = $this->api_session_model->getValue($this->session_id,'tree_is_repeat_quickgive');
        if($is_repeat_quickgive) {
            return 2;
        } else {
            return 4;
        }
    }

    private function set_identity($identity)
    {
        //$phone_code    = DEFAULT_PHONE_CODE;
        $full_identity = null;

        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $full_identity = $identity;
        } else {
            $full_identity = $identity;
        }

        $code = rand (10000, 99999);
        $this->load->model('code_security_model');
        $this->code_security_model->create($full_identity,$code);

        $this->bk_session_data['tree_identity'] = $identity;

        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $this->load->use_theme();
            
            $message = $this->load->view('email/donor_login_security_code', ['code' => $code], TRUE);
            $from    = $this->config->item('admin_email', 'ion_auth');
            $to      = $identity;
            $subject = 'ChatGive Security Code';

            require_once 'application/libraries/email/EmailProvider.php';
            
            $email_data = EmailProvider::getInstance()->sendEmail($from, 'ChatGive' , $to, $subject, $message);

            if (!$email_data['status']){
                return [
                    'status'  => false,
                    'message' => 'Error sending Security Code'
                ];
            }

        } else {

            $this->load->model('donor_model');
            $organization = $this->get_organization_data();
            $organization_id = $organization->church_id;
            $donor_user = $this->donor_model->getLoginData(null,$organization_id,$identity,null,true);

            if(!$donor_user){
                return [
                    'status'  => false,
                    'message' => 'Phone does not exist please register with an email'
                ];
            }

            require_once 'application/libraries/messenger/MessengerProvider.php';
            MessengerProvider::init();
            $MenssengerInstance = MessengerProvider::getInstance();

            $to = '+' . $identity;

            $from = PROVIDER_MAIN_PHONE;
            $message = 'Security code:' . $code;

            try {
                $MenssengerInstance->sendSms($to, $from, $message);                
            } catch (Exception $exc) {
                $excMessage = (string) $exc->getMessage();
                $code = (string) $exc->getCode();
                $errMessage = $code == 21211 ? "Not valid phone - Error 21211)" : ($code == 21610 ? "This number is unsubscribed - Error 21610" : $excMessage);
                
                return [
                    'status'  => false,
                    'message' => $errMessage
                ];
            }
        }

        return true;
    }

    //LOGIN HERE if EXIST
    private function set_security_code($security_code)
    {
        $organization = $this->get_organization_data();
        $identity       = $this->bk_session_data['tree_identity'];
        $church_id      = $organization->church_id;
        $campus_id      = $organization->campus_id;

        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $donor_user = $this->donor_model->getLoginData($identity, $church_id);
            $full_identity = $identity;
        } else {
            $donor_user = $this->donor_model->getLoginData(null, $church_id,$identity,null,true);
            $full_identity = $identity;
        }

        $this->load->model('code_security_model');
        $code_security = $this->code_security_model->get($full_identity,$security_code);
        if($code_security) {
            
            $access_token['token'] = null;
            $refresh_token['token'] = null;
            
            if($donor_user) {
                //LOGIN HERE
                $access_token = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $donor_user->id);
                $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $donor_user->id);

                $this->session_id = $access_token['token'];
                $this->is_session_enabled = true;
                
                $this->api_session_model->setValue($this->session_id,'tree_user_id',$donor_user->id);
                $this->api_session_model->setValue($this->session_id,'tree_first_name',$donor_user->first_name);
                
                foreach ($this->bk_session_data as $session_key => $session_value){
                    $this->api_session_model->setValue($this->session_id,$session_key,$session_value);
                }
                
                $this->api_session_model->setValue($this->session_id, 'tree_church_id', $church_id);
                $this->api_session_model->setValue($this->session_id, 'tree_campus_id', $campus_id);
                $this->api_session_model->setValue($this->session_id, 'tree_org_name', $organization ? $organization->church_name : '');

                $return_data = [];
                $return_data['access_token'] = $access_token['token'];
                $return_data['refresh_token'] = $refresh_token['token'];
                $return_data['status'] = true;
                
                $this->setting_multiple_funds($church_id, $campus_id, $organization->client_id, $this->input->post('chatgive_tokens')['page']);
                
                if(!$this->api_session_model->getValue($this->session_id, 'tree_is_multiple_fund')){                    
                    $return_data['result'] = 1;
                } else {
                    $return_data['result'] = 11;
                }
                
                return $return_data;
                
            } else {
                //Verification Code sent successfully and identity ready for register
                $this->bk_session_data['tree_ready_for_register'] = 1;
                return 0;
            }
        } else {
            return [
                'status'  => false,
                'message' => 'Invalid Code'
            ];
        }
    }
    
    //GET FUNCTIONS
    private function register(){
        if($this->bk_session_data['tree_ready_for_register'] == 1) {

            $first_name = $this->bk_session_data['tree_first_name'];
            $identity   = $this->bk_session_data['tree_identity'];

            $organization = $this->get_organization_data();

            $church_id  = $organization->church_id;
            $campus_id  = $organization->campus_id;

            //Email Unique Validation
            $user_email = $this->donor_model->getLoginData($identity,$church_id);
            if($user_email) {
                show_error(400);
                return false;
            }

            $data = [
                'created_from' => 'R',
                'first_name' => $first_name,
                'id_church' => $church_id,
                'campus_id' => $campus_id,
            ];

            if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
                $data['email'] = $identity;
            } else {
                $data['phone']      = $identity;
                $data['phone_code'] = DEFAULT_PHONE_CODE;
            }

            $donor_id = $this->donor_model->register($data);

            $access_token['token'] = null;
            $refresh_token['token'] = null;
            
            if ($donor_id) {
                
                $access_token             = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $donor_id);
                $refresh_token            = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $donor_id);
                $this->session_id         = $access_token['token'];
                $this->is_session_enabled = true;

                foreach ($this->bk_session_data as $session_key => $session_value) {
                    $this->api_session_model->setValue($this->session_id, $session_key, $session_value);
                }
                
                //Get Just First Name from Database
                $donor = $this->donor_model->get($donor_id,'first_name');
                
                $this->api_session_model->setValue($this->session_id,'tree_first_name',$donor->first_name);

                $this->api_session_model->setValue($this->session_id,'tree_user_id',$donor_id);

                //Set Donor on History
                $history_chat_id = $this->api_session_model->getValue($this->session_id, 'tree_history_chat_id');
                $this->load->model('history_chat_model');
                $this->history_chat_model->set_donor($history_chat_id, $donor_id);
            }

            $data = [
                'html' => null,
                'data' => [
                    'user_id'       => $donor_id,
                    'is_logged'     => $donor_id ? true : false,
                    WIDGET_AUTH_OBJ_VAR_NAME => [
                        WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME  => $access_token['token'],
                        WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $refresh_token['token']
                    ]
                ]
            ];
            return $data;
        } else {
            show_404();
            return false;
        }
    }

    private function get_funds(){

        $this->load->model('fund_model');

        $church_id  = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $campus_id  = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');

        $funds = $this->fund_model->getListSimple($church_id,$campus_id);

        $html = '<div class="sc-options-buttons-container">';
        $count_buttons = 0;

        foreach($funds as $fund){
            $long_button = '';

            if(strlen($fund['name']) > 8){
                $long_button = ' sc-button-long ';
            }
            $html .= '<button type="button" data-tooltip-text="'.$fund['description'].'" class="hired-tooltip hired-tooltip-bottom sc-btn sc-btn-primary sc-btn-select theme_color button_text_color '.$long_button.'" data-value="'.$fund['id'].'">'.$fund['name'].'</button>';
            $count_buttons++;
        }
        $html .= "</div>";

        $data = [
            'html' => $html,
            'data' => $funds
        ];
        return $data;
    }

    //used when the donor is not logged in
    private function get_funds_multiple(){
        $this->load->model('fund_model');

        if($this->is_session_enabled) {
            $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
            $campus_id = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');
            $selected_funds = $this->api_session_model->getValue($this->session_id, 'tree_fund');
        } else {
            $organization = $this->get_organization_data();
            $church_id = $organization->church_id;
            $campus_id = $organization->campus_id;
            $selected_funds = isset($this->bk_session_data['tree_fund']) ? $this->bk_session_data['tree_fund'] : [];
        }

        $fund_ids = $selected_funds ? array_column($selected_funds,'fund_id') : [];

        $funds = $this->fund_model->getListSimple($church_id,$campus_id);

        $html = '<div class="sc-options-buttons-container multiple_fund">';
        $count_buttons = 0;

        if($this->is_session_enabled) {
            $conduit_funds = json_decode($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds'));
        } else {
            $conduit_funds = json_decode($this->bk_session_data['tree_conduit_funds']);
        }

        foreach($funds as $fund){

            if(!in_array($fund['id'],$conduit_funds)){
                continue;
            }

            if(in_array($fund['id'],$fund_ids)){
                continue;
            }

            $long_button = '';

            if(strlen($fund['name']) > 8){
                $long_button = ' sc-button-long ';
            }
            $html .= '<button type="button" data-tooltip-text="'.$fund['description'].'" class="hired-tooltip hired-tooltip-bottom sc-btn sc-btn-primary sc-btn-select theme_color button_text_color'.$long_button.'" data-fund-order="'. (count($fund_ids) + 1) .'" data-value="'.$fund['id'].'">'.$fund['name'].'</button>';
            $count_buttons++;
        }
        $html .= "</div>";

        $data = [
            'html' => $html,
            'data' => $funds
        ];
        return $data;
    }

    private function get_funds_multiple_loop(){
        $this->load->model('fund_model');

        if($this->is_session_enabled) {
            $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
            $campus_id = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');
            $selected_funds = $this->api_session_model->getValue($this->session_id, 'tree_fund');
        } else {
            $organization = $this->get_organization_data();
            $church_id = $organization->church_id;
            $campus_id = $organization->campus_id;
            $selected_funds = isset($this->bk_session_data['tree_fund']) ? $this->bk_session_data['tree_fund'] : [];
        }

        $fund_ids = $selected_funds ? array_column($selected_funds,'fund_id') : [];

        $funds = $this->fund_model->getListSimple($church_id,$campus_id);

        $html = '<div class="sc-options-buttons-container multiple_fund">';
        $html .= '<button type="button" class="sc-btn sc-btn-skip sc-btn-primary sc-btn-select theme_color button_text_color" data-fund-order="'. (count($fund_ids) + 1) .'" data-value="skip" style="padding: 0.52rem 0.5rem 0.27rem 0.6rem !important">Skip
        <svg style="width: 0.7rem;" 
        aria-hidden="true" focusable="false" data-prefix="fas" data-icon="step-forward" class="svg-inline--fa fa-step-forward fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 -50 448 512">
    <path id="skip_color" fill="currentColor" d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z">
    </path>
</svg></button>';
        $count_buttons = 0;

        if($this->is_session_enabled) {
            $conduit_funds = json_decode($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds'));
        } else {
            $conduit_funds = json_decode($this->bk_session_data['tree_conduit_funds']);
        }

        foreach($funds as $fund){

            if(!in_array($fund['id'],$conduit_funds)){
                continue;
            }

            if(in_array($fund['id'],$fund_ids)){
                continue;
            }

            $long_button = '';

            if(strlen($fund['name']) > 8){
                $long_button = ' sc-button-long ';
            }
            $html .= '<button type="button" data-tooltip-text="'.$fund['description'].'" class="hired-tooltip hired-tooltip-bottom sc-btn sc-btn-primary sc-btn-select theme_color button_text_color'.$long_button.'" data-fund-order="'. (count($fund_ids) + 1) .'" data-value="'.$fund['id'].'">'.$fund['name'].'</button>';
            $count_buttons++;
        }
        $html .= "</div>";

        $data = [
            'html' => $html,
            'data' => $funds
        ];
        return $data;
    }

    private function get_funds_multiple_loop_quickgive(){
        $this->load->model('fund_model');

        $church_id  = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $campus_id  = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');
        $selected_funds  = $this->api_session_model->getValue($this->session_id, 'tree_fund');
        $donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $this->load->model('donation_model');
        $donation = $this->donation_model->getLastDonation($donor_id);

        $fund_ids = $selected_funds ? array_column($selected_funds,'fund_id') : [];

        $funds = $this->fund_model->getListSimple($church_id,$campus_id);

        $html = '<div class="sc-options-buttons-container multiple_fund">';
        $count_buttons = 0;
        $conduit_funds = [];
        if($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds')) {
            $conduit_funds = json_decode($this->api_session_model->getValue($this->session_id, 'tree_conduit_funds'));
        }

        foreach($funds as $fund){

            if(!in_array($fund['id'],$conduit_funds)){
                continue;
            }

            if(in_array($fund['id'],$fund_ids)){
                continue;
            }

            $long_button = '';

            if(strlen($fund['name']) > 8){
                $long_button = ' sc-button-long ';
            }
            $html .= '<button type="button" data-tooltip-text="'.$fund['description'].'" class="hired-tooltip hired-tooltip-bottom sc-btn sc-btn-primary sc-btn-select theme_color button_text_color'.$long_button.'" data-fund-order="'. (count($fund_ids) + 1) .'" data-value="'.$fund['id'].'">'.$fund['name'].'</button>';
            $count_buttons++;
        }
        $html .= "</div>";

        if ($donation && $donation->source_status === 'P' && $donation->source_is_active === 'Y' && $donation->source_is_saved === 'Y') { //Following the model configuration for epicpay_customer_sources we use the same  (status = 'P', is_active = 'Y', is_saved = 'Y') setup for validating when a source is valid
            //Quickgive Donation
            $html .= '<div class="sc-quickgive-container"><button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long" data-value="quickgive_' . $donation->total_amount . '">Quick Give</button><div class="sc-quickgive-info">$' . $donation->total_amount
                . ' to ' . $donation->funds_name . ' with ' . $donation->payment_method . ' ...' . $donation->last_digits . '</div></div>';
        }

        $data = [
            'html' => $html,
            'data' => $funds
        ];
        return $data;
    }

    private function get_suggested_amounts()
    {

        $donation = null;
        if($this->is_session_enabled) {
            $donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
            $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
            $campus_id = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');

            $this->load->model('donation_model');
            $donation = $this->donation_model->getLastDonation($donor_id);
        } else {
            $organization = $this->get_organization_data();
            $church_id = $organization->church_id;
            $campus_id = $organization->campus_id;
        }

        $chat_settings = $this->chat_setting_model->getChatSettingByChurch($church_id, $campus_id);
        $amounts = json_decode($chat_settings->suggested_amounts);

        $html = '<div class="sc-options-buttons-container">';
        if ($donation) {
            if($donation->is_fee_covered)
                $repeat_amount = $donation->net;
            else
                $repeat_amount = $donation->total_amount;
            $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long" data-value="' . $repeat_amount . '">Repeat: $' . $repeat_amount . '</button>';
        }

        if ($amounts) {
            foreach ($amounts as $amount) {
                if($amount === '')
                    continue;

                $long_button = '';

                if(strlen('$'.$amount) > 8){
                    $long_button = ' sc-button-long ';
                }
                $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color '.$long_button.'" data-value="' . $amount . '">$' . $amount . '</button>';
            }
        }
        $html .= '<button type="button" class="sc-btn sc-custom-amount sc-btn-primary sc-btn-select theme_color button_text_color '.$long_button.'">Custom Amount</button>';
        $html .= "</div>";

        if ($donation && $donation->source_status === 'P' && $donation->source_is_active === 'Y' && $donation->source_is_saved === 'Y') { //Following the model configuration for epicpay_customer_sources we use the same  (status = 'P', is_active = 'Y', is_saved = 'Y') setup for validating when a source is valid
            //Quickgive Donation
            $html .= '<div class="sc-quickgive-container"><button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long" data-value="quickgive_' . $donation->total_amount . '">Quick Give</button><div class="sc-quickgive-info">$' . $donation->total_amount
                . ' to ' . $donation->funds_name . ' with ' . $donation->payment_method . ' ...' . $donation->last_digits . '</div></div>';
        }

        $data = [
            'html' => $html,
            'data' => null
        ];
        return $data;
    }

    private function get_suggested_amounts_multiple()
    {
        $church_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $campus_id = $this->api_session_model->getValue($this->session_id, 'tree_campus_id');
        $last_fund_multiple = $this->api_session_model->getValue($this->session_id, 'tree_last_fund_multiple');
        $last_fund_order_id = $this->api_session_model->getValue($this->session_id, 'tree_last_fund_order_id');

        //log_message("error", "get_suggested_amounts_multiple " . json_encode([$church_id,$campus_id]) . date("Y-m-d H:i:s"));
        
        $chat_settings = $this->chat_setting_model->getChatSettingByChurch($church_id, $campus_id);
        $amounts = json_decode($chat_settings->suggested_amounts);


        $html = '<div class="sc-options-buttons-container multiple_fund_amount">';

        if($amounts){
            foreach ($amounts as $amount) {
                if($amount === '')
                    continue;

                $long_button = '';

                if(strlen('$'.$amount) > 8){
                    $long_button = ' sc-button-long ';
                }
                $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color '.$long_button.'" data-fund-order="'. $last_fund_order_id .'" data-fund="'.$last_fund_multiple.'" data-value="' . $amount . '">$' . $amount . '</button>';
            }
        }
        $html .= '<button type="button" class="sc-btn sc-custom-amount sc-btn-primary sc-btn-select theme_color button_text_color '.$long_button.'">Custom Amount</button>';
        $html .= "</div>";

        $data = [
            'html' => $html,
            'data' => null
        ];
        return $data;
    }

    private function get_payment_methods(){
        $user_donor_id = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $this->load->model('sources_model');
        $payment_methods = $this->sources_model->getList($user_donor_id);

        $html = '<div class="sc-options-buttons-container">';
        $count_buttons = 0;
        if($payment_methods) {
            foreach ($payment_methods as $payment_method) {
                $number_method = '';
                if($payment_method['source_type'] === 'card'){
                    $number_method = '•••• •••• •••• '.$payment_method['last_digits'];
                } elseif($payment_method['source_type'] === 'bank') {
                    $number_method = '••••••••••'.$payment_method['last_digits'];
                }
                $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long '.'" data-chat-code="'.($count_buttons + 1).'" data-value="' . $payment_method['id'] . '">'.($count_buttons + 1).'. ' .
                    ucfirst($payment_method['source_type']) . ' '.$number_method.'</button>';
                $count_buttons++;

            }
        }

        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long '.'" data-value="new_credit_card">New Credit Card</button>';
        $count_buttons++;

        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long '.'" data-value="new_bank_account">New Bank Account</button>';

        $html .= "</div>";
        $data = [
            'html' => $html,
            'data' => null
        ];
        return $data;
    }

    private function get_yes_no_buttons(){
        $html =  '<div class="sc-yes-no-container sc-options-buttons-container">';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color" data-value="yes">Yes</button>';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color" data-value="no">No</button>';
        $html .= '</div>';

        $data = [
            'html' => $html,
            'data' => null
        ];
        return $data;

    }

    private function get_yes_no_payments(){
        $html =  '<div class="sc-yes-no-container sc-options-buttons-container">';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color" data-value="yes">Yes, cover the fee!</button>';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color" data-value="no">Not today</button>';
        $html .= '</div>';

        $data = null;

        if($this->api_session_model->getValue($this->session_id, 'tree_is_exp_date') == 1){
            $data = [
                "is_expiration" => 1,
                "exp_status"    => $this->api_session_model->getValue($this->session_id, 'tree_exp_date_status'),
                "exp_message"   => $this->api_session_model->getValue($this->session_id, 'tree_exp_date_message')
            ];
        }

        $data['fee'] = $this->api_session_model->getValue($this->session_id, 'tree_fee');

        $data = [
            'html' => $html,
            'data' => $data
        ];
        return $data;

    }

    private function get_recurring_options()
    {
        $html = '<div class="sc-options-buttons-container">';
        $count_buttons = 0;
        foreach($this->recurring_options as $key => $recurring_option){
            $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color '.'" data-value="'.$key.'">'.$recurring_option.'</button>';
            $count_buttons++;
        }
        $html .= "</div>";

        $data = [
            'html' => $html,
            'data' => ['amount_gross' => $this->api_session_model->getValue($this->session_id, 'tree_amount_gross')]
        ];
        return $data;
    }

    private function payment($data_payment){
                
        $session = $this->api_session_model->getSessionData($this->session_id);
        $data_payment = json_decode($data_payment, true);
        
        $donorId    = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        
        $request = new stdClass();
        $request->screen = 'chat';
        $request->church_id = $session['tree_church_id'];
        $request->campus_id = $session['tree_campus_id'];
        $request->amount = $session['tree_amount'];
        
        $request->fund_data = $session['tree_fund'];

        if($session['tree_payment_method'] === 'new_credit_card') {
            $request->payment_method = 'credit_card';
        } elseif($session['tree_payment_method'] === 'new_bank_account') {
            $request->payment_method = 'bank_account';            
        } elseif (filter_var($session['tree_payment_method'], FILTER_VALIDATE_INT) !== true ) {
            $wallet_id = $session['tree_payment_method'];
            $request->payment_method = 'wallet';
        }
        
        $this->load->model('organization_model');
        $this->load->model('user_model');
        $organization = $this->organization_model->get($session['tree_church_id']);
        $user = $this->user_model->get($organization->client_id);
        
        $bank_type = null;
        if($user->payment_processor == 'PSF') {
            if(isset($data_payment['bank_type']) && $data_payment['bank_type']) {
                $bank_type = $data_payment['bank_type'];
            } elseif(isset($wallet_id)) {
                $this->load->model('sources_model');
                $src = $this->sources_model->getOne($donorId, $wallet_id, ['id', 'bank_type'], true);
                $bank_type = $src->bank_type;                
            }
        }
        
        $payment = new stdClass();        
        $payment->bank_type = $bank_type;
        //
        
        $save_source = null;
        if($bank_type == 'sepa') {
            $save_source = 'Y'; // if sepa is used as payment method source saving is mandatory | bacs is not included as it is used with a token only
        } else {
            $save_source = isset($session['tree_save_source']) && strtolower($session['tree_save_source']) == '1' ? 'Y' : 'N';
        }

        
        $request->recurring = $session['tree_recurring'];
        
        if($request->recurring == 'once_time'){
            $request->recurring = 'one_time';
        }elseif($request->recurring == 'weekly'){
            $request->recurring = 'week';
        }elseif($request->recurring == 'quarterly'){
            $request->recurring = 'quarterly';
        }elseif($request->recurring == 'monthly'){
            $request->recurring = 'month';                   
        }elseif($request->recurring == 'yearly'){
            $request->recurring = 'year';
        }
        
        if($request->recurring != 'one_time'){
            $request->recurring_date = $session['tree_is_recurring_today'] ? date('Y-m-d') : $session['tree_recurrent_date'];
        }

        if($request->payment_method != 'wallet'){
            
            if($bank_type) {
                $payment->first_name = ucfirst(strtolower($data_payment[$bank_type . '[first_name]']));
                $payment->last_name = ucfirst(strtolower($data_payment[$bank_type . '[last_name]']));
                $payment->postal_code = $data_payment[$bank_type . '[postal_code]'];
            } else {
                $payment->first_name = ucfirst(strtolower($data_payment['first_name']));
                $payment->last_name = ucfirst(strtolower($data_payment['last_name']));
                $payment->postal_code = $data_payment['postal_code'];
            }
            
            $payment->save_source = $save_source;
        }
        
        if($request->payment_method == 'credit_card') {
            
            if($user->payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
                $payment->single_use_token = $data_payment['single_use_token'];
            } else {
                $payment->card_number = str_replace('-', '', $data_payment['card_number']);                
                $payment->card_cvv = $data_payment['card_cvv'];
                $payment->card_date = $data_payment['card_date'];
            }
        }elseif($request->payment_method == 'bank_account') {
            if($bank_type) {
                if($bank_type == 'ach') {
                    $payment->routing_number = $data_payment[$bank_type . '[routing_number]'];
                    $payment->account_number = $data_payment[$bank_type . '[account_number]'];
                    $payment->account_type = $data_payment[$bank_type . '[account_type]'];
                } elseif($bank_type == 'eft') {
                    $payment->account_number = $data_payment[$bank_type . '[account_number]'];
                    $payment->transit_number = $data_payment[$bank_type . '[transit_number]'];
                    $payment->institution_id = $data_payment[$bank_type . '[institution_id]'];
                } elseif($bank_type == 'sepa') {
                    $payment->iban              = $data_payment[$bank_type . '[iban]'];
                    $payment->mandate_reference = $data_payment[$bank_type . '[mandate]'];                    
                }
                
            } else {
                $payment->routing_number = $data_payment['routing_number'];
                $payment->account_number = $data_payment['account_number'];
                $payment->account_type = $data_payment['account_type'];
            }
            
        }elseif($request->payment_method == 'wallet') {
            $payment->wallet_id = $wallet_id;
        }
        
        if ($bank_type) {
            $payment->street  = isset($data_payment[$bank_type . '[street]']) ? $data_payment[$bank_type . '[street]'] : null;
            $payment->street2 = isset($data_payment[$bank_type . '[street2]']) ? $data_payment[$bank_type . '[street2]'] : null;
            $payment->city    = isset($data_payment[$bank_type . '[city]']) ? $data_payment[$bank_type . '[city]'] : null;
            $payment->country = isset($data_payment[$bank_type . '[country]']) ? $data_payment[$bank_type . '[country]'] : null;
        } else {
            $payment->street  = isset($data_payment['street']) ? $data_payment['street'] : null;
            $payment->street2 = isset($data_payment['street2']) ? $data_payment['street2'] : null;
            $payment->city    = isset($data_payment['city']) ? $data_payment['city'] : null;
            $payment->country = isset($data_payment['country']) ? $data_payment['country'] : null;
        }
        
        $payment->cover_fee = isset($session['tree_is_cover_fee']) && strtolower($session['tree_is_cover_fee']) == 'yes' ? 1 : 0;
        
        require_once 'application/controllers/extensions/Payments.php';
        $pResult = Payments::process($request, $payment, $donorId);

        $history_chat_id = $this->api_session_model->getValue($this->session_id, 'tree_history_chat_id');
        if($pResult['status'] == true){
            $this->load->model('history_chat_model');
            $this->history_chat_model->set_status($history_chat_id,'C');
        } else {
            $this->load->model('history_chat_model');
            $this->history_chat_model->set_status($history_chat_id,'F');
        }

        $data = [
            'html' => null,
            'data' => $pResult
        ];
        
        return $data;
    }

    private function get_methods_options(){
        $html = '<div class="sc-options-buttons-container">';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select sc-button-long theme_color button_text_color" data-value="new_credit_card">New Credit Card</button>';
        $html .= '<button type="button" class="sc-btn sc-btn-primary sc-btn-select sc-button-long theme_color button_text_color" data-value="new_bank_account">New Bank Account</button>';
        $html .= "</div>";
        $data = [
            'html' => $html,
            'data' => null
        ];
        return $data;
    }

    // FORMS - GET FUNCTIONS
    private function login_form(){
        $html = $this->load->view('themed/argon/widget/form/login_form', [], true);

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    private function confirmation(){

        $data = [
            'html' => null,
            'data' => [
                "fee" => $this->api_session_model->getValue($this->session_id, 'tree_fee'),
                "is_cover_fee" => $this->api_session_model->getValue($this->session_id, 'tree_is_cover_fee_boolean')
            ],
        ];
        return $data;
    }

    private function password_form(){
        $html = $this->load->view('themed/argon/widget/form/password_form', [], true);

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    private function credit_card_form(){

        $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($organization_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        if($user->payment_processor == 'PSF') {
            require_once 'application/controllers/extensions/Payments.php';
            $envObj = Payments::getEnvironment($user->payment_processor, $organization_id);

            if(!$envObj['envTest']){ // LIVE
                $html = $this->load->view('themed/argon/widget/form/credit_card_form_psf', [], true);
            } else {
                $html = $this->load->view('themed/argon/widget/form/test_credit_card_form_psf', [], true);
            }
        } else {
            $html = $this->load->view('themed/argon/widget/form/credit_card_form', [], true);
        }

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    private function bank_account_form(){
        $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($organization_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        $hide_country = false;
        $autoselect_country = null;
        if($user->payment_processor == 'PSF') {
            require_once 'application/controllers/extensions/Payments.php';
            $envObj = Payments::getEnvironment($user->payment_processor, $organization_id);

            if(!$envObj['envTest']){ // LIVE
                $html = $this->load->view('themed/argon/widget/form/bank_account_form_psf', [], true);
            } else {
                $html = $this->load->view('themed/argon/widget/form/test_bank_account_form_psf', [], true);
            }
            $this->load->model('orgnx_onboard_psf_model');
            $onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id,$organization->client_id,'region');
            if($onboard_psf && ($onboard_psf->region == 'US' || $onboard_psf->region == 'CA')){
                $hide_country = true;
                $autoselect_country = $onboard_psf->region;
            }
        } else {
            $html = $this->load->view('themed/argon/widget/form/bank_account_form', [], true);
        }

        $data = [
            'html' => $html,
            'data' => ['hide_country' => $hide_country,'autoselect_country' => $autoselect_country],
        ];
        return $data;
    }

    private function save_credit_card_form(){
        $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($organization_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        if($user->payment_processor == 'PSF') {
            require_once 'application/controllers/extensions/Payments.php';
            $envObj = Payments::getEnvironment($user->payment_processor, $organization_id);

            if(!$envObj['envTest']){ // LIVE
                $html = $this->load->view('themed/argon/widget/form/credit_card_form_psf', [], true);
            } else {
                $html = $this->load->view('themed/argon/widget/form/test_credit_card_form_psf', [], true);
            }
        } else {
        	$html = $this->load->view('themed/argon/widget/form/credit_card_form', [], true);
        }

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    private function save_bank_account_form(){

        $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($organization_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        $hide_country = false;
        $autoselect_country = null;
        if($user->payment_processor == 'PSF') {
            require_once 'application/controllers/extensions/Payments.php';
            $envObj = Payments::getEnvironment($user->payment_processor, $organization_id);

            if(!$envObj['envTest']){ // LIVE
                $html = $this->load->view('themed/argon/widget/form/bank_account_form_psf', [], true);
            } else {
                $html = $this->load->view('themed/argon/widget/form/test_bank_account_form_psf', [], true);
            }
            $this->load->model('orgnx_onboard_psf_model');
            $onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id,$organization->client_id,'region');
            if($onboard_psf && ($onboard_psf->region == 'US' || $onboard_psf->region == 'CA')){
                $hide_country = true;
                $autoselect_country = $onboard_psf->region;
            }
        } else {
            $html = $this->load->view('themed/argon/widget/form/bank_account_form', [], true);
        }

        $data = [
            'html' => $html,
            'data' => ['hide_country' => $hide_country,'autoselect_country' => $autoselect_country],
        ];
        return $data;
    }

    private function recurring_date_form(){
        $html = $this->load->view('themed/argon/widget/form/recurring_date_form', [], true);

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    private function get_update_exp_form(){
        $organization_id = $this->api_session_model->getValue($this->session_id, 'tree_church_id');
        $this->load->model('organization_model');
        $organization = $this->organization_model->get($organization_id);

        $this->load->model('user_model');
        $user = $this->user_model->get($organization->client_id);

        if($user->payment_processor == 'PSF') {
            $html = $this->load->view('themed/argon/widget/form/update_exp_form_psf', [], true);
        } else {
            $html = $this->load->view('themed/argon/widget/form/update_exp_form', [], true);
        }

        $data = [
            'html' => $html,
            'data' => null,
        ];
        return $data;
    }

    // UTILITIES FUNCTIONS
    private function replace($html, $session_name) {

        if ($this->is_session_enabled) {
            $value = $this->api_session_model->getValue($this->session_id, 'tree_' . $session_name);
        } else {
            $value = $this->bk_session_data['tree_' . $session_name];
        }

        return str_replace('[' . $session_name . ']', $value, $html);
    }

    private function format_yes_no($answer){
        $this->load->model("setting_model");
        $yes_options = json_decode($this->setting_model->getItem('yes_options'));

        if(in_array($answer,$yes_options)
        ){
            return 1;
        } else
            return 0;
    }

    private function set_amount_gross_on_multiple_fund(){
        $funds = $this->api_session_model->getValue($this->session_id, 'tree_fund');

        $amount_gross = 0;
        foreach ($funds as $fund){
            $amount_gross += (float)$fund['fund_amount'];
        }

        $this->api_session_model->setValue($this->session_id,'tree_amount_gross',$amount_gross);
    }

    //Setting Multiple Funds / Conduit Widget - Pages
    protected function setting_multiple_funds($church_id,$campus_id,$client_id,$page_id = null)
    {
        if ($page_id) {
            $this->load->model('page_model');
            $page = $this->page_model->get($page_id,$client_id);
            if($page->type_page == 'conduit'){
                if($this->is_session_enabled) {
                    $this->api_session_model->setValue($this->session_id, 'tree_is_multiple_fund', 1);
                    $this->api_session_model->setValue($this->session_id, 'tree_conduit_funds', $page->conduit_funds);
                } else {
                    $this->bk_session_data['tree_is_multiple_fund'] = 1;
                    $this->bk_session_data['tree_conduit_funds'] = $page->conduit_funds;
                }
            }
        } else {
            $chat_settings = $this->chat_setting_model->getChatSettingByChurch($church_id,$campus_id);
            if($chat_settings->conduit_funds) {
                if ($this->is_session_enabled) {
                    $this->api_session_model->setValue($this->session_id, 'tree_is_multiple_fund', 1);
                    $this->api_session_model->setValue($this->session_id, 'tree_conduit_funds', $chat_settings->conduit_funds);
                } else {
                    $this->bk_session_data['tree_is_multiple_fund'] = 1;
                    $this->bk_session_data['tree_conduit_funds'] = $chat_settings->conduit_funds;
                }
            }
        }
    }

    /** Retrieve hash algorithm according to options
     *
     * @return string|bool
     */
    protected function _get_hash_algo() {
        $algo = FALSE;
        switch ($this->hash_method) {
            case 'bcrypt':
                $algo = PASSWORD_BCRYPT;
                break;

            case 'argon2':
                $algo = PASSWORD_ARGON2I;
                break;

            default:
                // Do nothing
        }

        return $algo;
    }

    protected function strip_tags_content($text) {

        return preg_replace('@<(\w+)\b.*?>.*?</\1>@si', '', $text);

    }

    protected function get_organization_data(){
        $tokens_array = $this->input->post('chatgive_tokens');
        $connection   = $tokens_array['connection'];
        $token        = $tokens_array['token'];
        $organization = null;
        if($connection == 1){
            $this->load->model('organization_model');
            $organization = $this->organization_model->getByToken($token);
            $organization->church_id = $organization->ch_id;
            $organization->campus_id = null;
            $organization->chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);
            return $organization;
        } else if($connection == 2) {
            $this->load->model('suborganization_model');
            $suborganization = $this->suborganization_model->getByToken($token);

            //Getting Organization and Client ID
            $this->load->model('organization_model');
            $organization = $this->organization_model->get($suborganization->church_id,'client_id');

            $suborganization->client_id = $organization->client_id;

            $suborganization->chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);
            return $suborganization;
        }
        return null;
    }

}

