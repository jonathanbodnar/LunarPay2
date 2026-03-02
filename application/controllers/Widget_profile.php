<?php

defined('BASEPATH') OR exit('No direct script access allowed');

use Dompdf\Dompdf;

class Widget_profile extends CI_Controller {

    private $session_id = null;
    
    public function __construct() {
        parent::__construct();
        
        $this->load->use_theme();
        $this->load->model('donor_model');
        $this->load->library(['form_validation']);
        $this->hash_method = $this->config->item('hash_method', 'ion_auth');
        
        $this->load->model('api_session_model');
        
        /* ------- NO ACCESS_TOKEN METHODS ------- */
        $free = ['login', 'login_send_code', 'login_with_code', 'register_send_code', 'register_with_code'];
        /* ------- ---------------- ------ */
        
        $this->load->library('widget_api_202107');
        
        $action = $this->router->method;        
        
        if (!in_array($action, $free)) {
            $result = $this->widget_api_202107->validaAccessToken();
            
            if ($result['status'] === false) {
                output_json_custom($result);
                die;
            }
            $this->session_id = $result['current_access_token'];
        }
    }

    public function login_send_code() {
        $identity      = $this->input->post('phone_main_form');
        $full_identity = null;
        $organization  = $this->get_organization_data();
        $church_id     = $organization->church_id;

        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $donor_user = $this->donor_model->getLoginData($identity, $church_id);
            $full_identity = $identity;
        } else {
            $donor_user = $this->donor_model->getLoginData(null, $church_id,$identity,null,true);
            $full_identity = $identity;
        }

        $status = false;
        $errMessage = '';
        $errCode = '';
        if ($donor_user) {
            $code = rand (10000, 99999);
            $this->load->model('code_security_model');
            $this->code_security_model->create($full_identity,$code);

            if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
                $message = $this->load->view('email/donor_login_security_code', ['code' => $code], TRUE);
                $from    = $this->config->item('admin_email', 'ion_auth');
                $to      = $identity;
                $subject = 'ChatGive Security Code';

                require_once 'application/libraries/email/EmailProvider.php';
                
                $email_data = EmailProvider::getInstance()->sendEmail($from, 'ChatGive' , $to, $subject, $message);

                if ($email_data['status']){
                    output_json([
                        'status'  => true,
                        'identity'      => $identity,
                        'message' => 'Security Code Sent Successfully'
                    ]);
                    return;
                } else {
                    output_json([
                        'status'  => false,
                        'message' => 'Error sending Security Code'
                    ]);
                    return;
                }
            } else {
                require_once 'application/libraries/messenger/MessengerProvider.php';
                MessengerProvider::init();
                $MenssengerInstance = MessengerProvider::getInstance();

                $to = '+' . $identity;

                $from = PROVIDER_MAIN_PHONE;
                $message = 'Security code:' . $code;

                try {
                    $MenssengerInstance->sendSms($to, $from, $message);
                    $status = true;
                } catch (Exception $exc) {
                    $excMessage = (string) $exc->getMessage();
                    $code = (string) $exc->getCode();
                    $errMessage = $code == 21211 ? "Not valid phone - Error (21211)" : ($code == 21610 ? "This number is unsubscribed - Error 21610" : $excMessage);
                    $errCode = $code;
                }
            }

        }else {
            $errMessage = 'Number or Email not found';
        }

        output_json([
            'status'        => $status,
            'error_message' => $errMessage, 
            'error_code'    => $errCode, 
            'identity'      => $identity
        ]);
    }

    public function login_with_code(){

        $verification_code = $this->input->post('phone_verification_code');
        $identity          = $this->input->post('identity');
        $full_identity     = null;

        $organization  = $this->get_organization_data();
        $church_id     = $organization->church_id;
        $campus_id     = $organization->campus_id;

        if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
            $donor_user = $this->donor_model->getLoginData($identity, $church_id);
            $full_identity = $identity;
        } else {
            $donor_user = $this->donor_model->getLoginData(null, $church_id,$identity,null,true);
            $full_identity = $identity;
        }

        $login_success = false;
        $access_token['token'] = null;
        $refresh_token['token'] = null;
        
        if ($donor_user) {
            $this->load->model('code_security_model');
            $code_security = $this->code_security_model->get($full_identity,$verification_code);
            if($code_security) {
                $login_success = true;
                
                $access_token  = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $donor_user->id);
                $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $donor_user->id);

                $this->session_id = $access_token['token'];

                $this->api_session_model->setValue($this->session_id, 'tree_user_id', $donor_user->id);
                $this->api_session_model->setValue($this->session_id, 'tree_first_name', $donor_user->first_name);
                $this->api_session_model->setValue($this->session_id, 'tree_church_id', $church_id);
                $this->api_session_model->setValue($this->session_id, 'tree_campus_id', $campus_id);
                $this->api_session_model->setValue($this->session_id, 'tree_organization_name', $organization->church_name);
            }
        }
        
        output_json([
            'status'                 => $login_success ? true : false,
            WIDGET_AUTH_OBJ_VAR_NAME => [
                WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME  => $access_token['token'],
                WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $refresh_token['token']
            ]
        ]);
    }

    public function register_send_code() {

        $status = true;
        $message = '';

        $this->load->library(['ion_auth', 'form_validation']);
        $this->form_validation->set_rules('register_name',langx('name'), 'trim|required');
        $this->form_validation->set_rules('register_email',langx('email'), 'trim|required');
        $this->form_validation->set_rules('register_phone',langx('phone'), 'trim|required');
        if ($this->form_validation->run() !== TRUE) {
            $status = false;
            $message = validation_errors();
        }

        $name        = $this->input->post('register_name');
        $email       = $this->input->post('register_email');
        $phone       = $this->input->post('register_phone');
        $phone_code  = $this->input->post('register_phone_code');
        $phone_country  = $this->input->post('country_phone_register');

        $organization  = $this->get_organization_data();
        $church_id     = $organization->church_id;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) && $status) {
            $status = false;
            $message = "Invalid Email";
        }

        if (!filter_var($phone, FILTER_VALIDATE_INT) && $status) {
            $status = false;
            $message = "Invalid Phone Number";
        }

        //Email Unique Validation
        $user_email = $this->donor_model->getLoginData($email,$church_id);
        if($user_email) {
            $status = false;
            $message = 'Email already registered';
        }

        //Phone Unique Validation
        $user_phone = $this->donor_model->getLoginData(null,$church_id,$phone,$phone_code);
        if($user_phone) {
            $status = false;
            $message = 'Phone Number already registered';
        }

        $register_session_data = [];
        if($status === true) {

            $register_session_data = [
                'register_name'          => $name,
                'register_email'         => $email,
                'register_phone'         => $phone,
                'register_phone_code'    => $phone_code,
                'register_phone_country' => $phone_country
            ];

            $this->load->helper('verification_code');
            $sendInfo = sendVerificationCode($phone_code.$phone);
            $status = $sendInfo['status'];
            $message = $sendInfo['message'];
        }

        output_json([
            'status'                => $status,
            'message'               => $message,
            'register_session_data' => $register_session_data
        ]);
    }

    public function register_with_code(){

        $register_session_data = $this->input->post('register_session_data');
        $verification_code     = $this->input->post('register_phone_verification_code');
        $name        = $register_session_data['register_name'];
        $email       = $register_session_data['register_email'];
        $phone       = $register_session_data['register_phone'];
        $phone_code  = $register_session_data['register_phone_code'];
        $phone_country  = $register_session_data['register_phone_country'];

        $organization  = $this->get_organization_data();
        $church_id     = $organization->church_id;
        $campus_id     = $organization->campus_id;

        //Email Unique Validation
        $user_email = $this->donor_model->getLoginData($email,$church_id);
        if($user_email) {
            output_json([
                'status' => false,
                'message' => 'Email already registered',
            ]);
            return;
        }

        //Phone Unique Validation
        $user_phone = $this->donor_model->getLoginData(null,$church_id,$phone,$phone_code);
        if($user_phone) {
            output_json([
                'status' => false,
                'message' => 'Phone Number already registered',
            ]);
            return;
        }

        $this->load->model('code_security_model');
        $code_security = $this->code_security_model->get($phone_code.$phone,$verification_code);
        if($code_security) {
            $data = [
                'created_from' => 'RC',
                'first_name'         => $name,
                'id_church'          => $church_id,
                'campus_id'          => $campus_id,
                'email'              => $email,
                'phone'              => $phone,
                'phone_code'         => $phone_code,
                'country_code_phone' => $phone_country
            ];

            $donor_id = $this->donor_model->register($data);
            
            $access_token['token'] = null;
            $refresh_token['token'] = null;

            if ($donor_id) {
                
                $access_token = $this->widget_api_202107->resetAccessToken('on_login', $church_id, $campus_id, $donor_id);
                $refresh_token = $this->widget_api_202107->resetRefreshToken('on_login', $church_id, $campus_id, $donor_id);
                
                $this->session_id = $access_token['token'];
                
                //Get Just First Name from Database
                $donor = $this->donor_model->get($donor_id, 'first_name');
                $this->api_session_model->setValue($this->session_id, 'tree_first_name', $donor->first_name);
                $this->api_session_model->setValue($this->session_id, 'tree_user_id', $donor_id);
                $this->api_session_model->setValue($this->session_id, 'tree_church_id', $church_id);
                $this->api_session_model->setValue($this->session_id, 'tree_campus_id', $campus_id);
                $this->api_session_model->setValue($this->session_id, 'tree_organization_name', $organization->church_name);

            }
            
            output_json([
                'status' => $donor_id ? true : false,
                WIDGET_AUTH_OBJ_VAR_NAME   => [
                    WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME => $access_token['token'], 
                    WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME => $refresh_token['token']
                ]
            ]);
        } else {
            output_json([
                'status' => false,
            ]);
        }
    }

    public function get() {
        $this->load->model('donor_model');
        $this->load->model('organization_model');

        //validate donor belongs to account when no session used
        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $donor     = $this->donor_model->get(['id' => $donorId], ['id', 'email', 'id_church']);
        $orgnx     = $this->organization_model->get($donor->id_church);
        $client_id = $orgnx->client_id;
        $this->load->model('user_model');
        $user = $this->user_model->get($orgnx->client_id);

        $data = $this->donor_model->getProfile($donor->id, $client_id);

        $data->hide_country = false;
        if($user->payment_processor == 'PSF') {
            $this->load->model('orgnx_onboard_psf_model');
            $onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($donor->id_church, $orgnx->client_id, 'region');
            if ($onboard_psf && ($onboard_psf->region == 'US' || $onboard_psf->region == 'CA')) {
                $data->hide_country = true;
                $data->autoselect_country = $onboard_psf->region;
            }
        }
        
        require_once 'application/controllers/extensions/Payments.php';
        $tokenObject = Payments::getSingleUseTokenEncodedApiKey($user->payment_processor, $donor->id_church);
        $envObj = Payments::getEnvironment($user->payment_processor, $donor->id_church);
        
        $single_use_token_api_key = $tokenObject['status'] ? $tokenObject['single_use_token_api_key'] : '';
        
        $environment = 'not_used_for_the_current_processor';
        if($envObj['status']) {
            $environment = $envObj['envTest'] ? 'TEST' : 'LIVE';
        }
        
        
        output_json([
            'status' => true,
            'data'   => $data,
            'payment_processor' => $user->payment_processor,
            'single_use_token_api_key' => $single_use_token_api_key,
            'environment'              => $environment
        ]);
    }

    public function update() {

        $input   = @file_get_contents('php://input');
        $request = json_decode($input);

        $this->load->model('donor_model');
        $this->load->model('organization_model');

        $donorId = $this->api_session_model->getValue($this->session_id,'tree_user_id');

        $donor     = $this->donor_model->get(['id' => $donorId], ['id_church','phone','phone_code']);
        $orgnx     = $this->organization_model->get($donor->id_church, ['client_id']);
        $client_id = $orgnx->client_id;

        //Validating Phone Number
        if($request->phone && (!is_numeric($request->phone) || strlen($request->phone) > 15)){
            output_json([
                'status'  => false,
                'message' => 'Invalid Phone Number'
            ]);
            return;
        }
        $phone_changed = false;
        if($request->phone != null){
            if($donor->phone_code.$donor->phone != $request->phone_code.$request->phone){
                $phone_changed = true;
            }
        }
        if($phone_changed && $request->phone){
            $user_repeated = $this->donor_model->getLoginData(null,$donor->id_church,$request->phone,$request->phone_code);
            if($user_repeated){
                output_json([
                    'status'  => false,
                    'message' => 'Phone has already been registered, enter another phone please'
                ]);
                return;
            }
        }

        $updateData = [
            'id'                  => $donorId,
            "first_name"          => $request->first_name,
            "last_name"           => $request->last_name,
            "address"             => $request->address,
            "city"                => $request->city,
            "state"               => $request->state,
            "postal_code"         => $request->postal_code,
            "phone"               => $request->phone,
            "phone_code"          => $request->phone_code,
            "country_code_phone"  => $request->country_code_phone
        ];

        $this->donor_model->update_profile($updateData, $client_id);

        output_json([
            'status'  => true,
            'message' => 'Profile successfully updated'
        ]);
    }

    public function get_payment_sources() {

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $this->load->model('sources_model');
        $data = $this->sources_model->getList($donorId, false, false, 'id, account_donor_id, church_id, customer_id, postal_code, source_type, '
                    . 'exp_month, exp_year, last_digits, name_holder, created_at, updated_at');
        output_json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function add_payment_source() {

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $input   = @file_get_contents('php://input');
        $request = json_decode($input);

        $this->load->model('donor_model');
        $donor = $this->donor_model->get(['id' => $donorId], ['id', 'email', 'id_church']);

        $request->email            = $donor->email;
        $request->account_donor_id = $donor->id;
        $request->email            = $donor->email;
        $request->church_id        = $donor->id_church;

        $request->save_source = 'Y';

        require_once 'application/controllers/extensions/Payments.php';
        $pResult = Payments::addPaymentSource($request);

        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);
    }

    /* Remove payment source | POST
     * @param    int     $sourceId 
     * @return   array   [status, message]
     */

    public function remove_payment_source() {

        $input   = @file_get_contents('php://input');
        $request = json_decode($input);

        $donorId  = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        $sourceId = $request->source_id;

        require_once 'application/controllers/extensions/Payments.php';
        $pResult = Payments::removePaymentSource($sourceId, $donorId);

        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);
    }

    /* Stop subscription | POST
     * @param    int     $sourceId 
     * @return   array   [status, message]
     */

    public function stop_subscription() {

        $input   = @file_get_contents('php://input');
        $request = json_decode($input);

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');
        $sub_id  = $request->subscription_id;

        require_once 'application/controllers/extensions/Payments.php';

        $user_id = false;
        $pResult = Payments::stopSubscription($sub_id, $user_id, $donorId);

        output_json([
            'status'  => $pResult['status'],
            'message' => $pResult['message']
        ]);
    }

    public function get_subscriptions() {

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $this->load->model('subscription_model');
        $data = $this->subscription_model->getList($donorId);
        output_json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function get_donations() {

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $input   = @file_get_contents('php://input');
        $request = json_decode($input);
        $offset  = isset($request->offset) ? $request->offset : 0;
        $limit   = isset($request->limit) ? $request->limit : false;

        $this->load->model('donation_model');
        $data = $this->donation_model->getLimitedList($donorId, $offset, $limit);
        output_json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function generate_ytd_statement() {

        $donorId = $this->api_session_model->getValue($this->session_id, 'tree_user_id');

        $folder_category = 'statmnts_donor/';

        $this->load->model('organization_model');
        $this->load->model('donation_model');

        $donor = $this->donor_model->get($donorId, ['id', 'email', 'id_church', 'first_name', 'last_name']);
        
        $pFrom = date('Y-01-01');
        $pTo   = date('Y-m-d');

        $transactions = $this->donation_model->getStatement($donor->id, $donor->id_church, $pFrom, $pTo);

        if (!$transactions) {
            output_json([
                'status'  => false,
                'message' => 'No records found'
            ]);
            return;
        }

        $orgnx = $this->organization_model->get($donor->id_church);

        $page_data = [
            'date_range'   => date('m/d/Y', strtotime($pFrom)) . ' to ' . date('m/d/Y', strtotime($pTo)),
            'date_title'   => date('Y') . ' Statement',
            'donor_name'   => $donor->first_name . ' ' . $donor->last_name,
            'donor_email'  => $donor->email,
            'donor_anon'   => $donor->id ? false : true,
            'church_data'  => $orgnx,
            'transactions' => $transactions
        ];

        $html = $this->load->view('donation/statement_template', $page_data, true);

        $files_location = 'application/uploads/' . $folder_category;

        $pdf = new Dompdf();

        $pdf->setPaper("Letter", "portrait");
        $pdf->loadHtml($html);
        $pdf->render();

        $left     = 'stmt_' . date('Ymdhis') . '_D' . $donorId;
        $fileName = $left . '.pdf';

        file_put_contents($files_location . $fileName, $pdf->output(['compress' => 0]));

        $zipFileName = '';
        $this->load->library('zip');

        $this->zip->read_file($files_location . $fileName, $fileName);

        $zipFileName = $left . '_all.zip';
        $this->zip->archive($files_location . $zipFileName);

        if (file_exists($files_location . $fileName)) {
            unlink($files_location . $fileName);
        }

        $this->load->model('statement_model');

        $statementId = $this->statement_model->register([
            'type'             => 'EPIC',
            'client_id'        => $orgnx->client_id,
            'account_donor_id' => $donor->id,
            'created_by'       => 'D', //>>>> Donor
            'date_from'        => $pFrom,
            'date_to'          => $pTo,
            'church_id'        => $donor->id_church,
            'file_name'        => $zipFileName,
            'created_at'       => date('Y-m-d H:i:s')
                ]
        );

        $this->load->model('statement_donor_model');

        $this->statement_donor_model->register([
            'statement_id' => $statementId,
            'church_id'    => $donor->id_church,
            'donor_email'  => $donor->email,
            'donor_name'   => $donor->first_name . ' ' . $donor->last_name,
            'created_at'   => date('Y-m-d H:i:s')
                ]
        );

        output_json([
            'status' => true,
            'data'   => FILES_URL . 'statmnts_donor/' . $zipFileName
        ]);
    }

    protected function get_organization_data(){
        $tokens_array = $this->input->post('chatgive_tokens');
        $connection   = $tokens_array['connection'];
        $token        = $tokens_array['token'];
        $organization = null;
        $this->load->model('chat_setting_model');
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
