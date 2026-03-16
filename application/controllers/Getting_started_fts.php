<?php

//for now we need to keep synced Getting_started.php with Paysafe.php, if you make a change here you have to do it there too

defined('BASEPATH') or exit('No direct script access allowed');

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Getting_started_fts extends My_Controller
{

    protected $twilio_phone_codes = TWILIO_AVAILABLE_COUNTRIES_NO_CREATION;
    public $data                  = [];

    public function __construct()
    {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $this->processor_selected = PROVIDER_PAYMENT_FORTIS;

        $this->PaymentInstance = PaymentsProvider::getInstance();

        PaymentsProvider::init(PROVIDER_PAYMENT_ETH);
        $this->PaymentCryptoInstance = PaymentsProvider::getInstance();

        $this->load->model('organization_model');
        $this->load->model('orgnx_onboard_fts_model');
        $this->load->model('orgnx_onboard_crypto_model');
        $this->load->model('chat_setting_model');

        display_errors();
    }

    //go to getting starter but to a specific step
    public function step($stepValue)
    {
        $this->load->model('user_model');

        $user_id = $this->session->userdata('user_id');
        try {
            $this->user_model->setStarterStep($user_id, $stepValue);
            redirect(BASE_URL . 'getting_started', 'refresh');
        } catch (Exception $ex) {
            show_error($ex->getMessage(), 400);
        }
    }

    public function index()
    {

        $this->template_data['title'] = langx("Getting Started");

        $this->load->model('localization_model');
        $this->template_data['us_states'] = $this->localization_model->getUsStates();

        $view = $this->load->view('getting_started/getting_started fts', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);
    }

    public function save_domain()
    {
        if ($this->input->post()) {
            $setting_id = (int) $this->input->post('setting_id');
            $domain     = $this->input->post('domain');

            $data = [
                'id'     => $setting_id,
                'domain' => $domain
            ];

            $resp = $this->chat_setting_model->save($data);
            if ($resp) {
                output_json(['status' => true, 'message' => 'Domain saved successfully']);
                return;
            } else {
                output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                return;
            }
        }
    }

    public function website_check($str)
    {
        //validate domain
        $str = strpos($str, 'http') !== 0 ? 'http://' . $str : $str;
        $url_split       = explode('.', $str);

        if (filter_var($str, FILTER_VALIDATE_URL) === false || count($url_split) < 2) {
            $this->form_validation->set_message('website_check', 'A valid website is required');
            return FALSE;
        }

        return true;
    }

    public function save_onboarding()
    {
        if ($this->input->post()) {

            $this->load->library('form_validation');

            $organization_id = (int) $this->input->post('id');

            $step    = $this->input->post('step');
            $user_id = $this->session->userdata('user_id');

            if ($step == 1) {
                $form = $_POST['step' . $step];

                $this->form_validation->set_rules('step' . $step . '[first_name]', langx('first_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[last_name]', langx('last_name'), 'trim|required');

                $this->form_validation->set_rules('step' . $step . '[dba_name]', langx('company_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[legal_name]', langx('legal_name'), 'trim|required');
                //$this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[email]', langx('email'), 'trim|required|valid_email');
                $this->form_validation->set_rules('step' . $step . '[phone]', langx('email'), 'required');

                $this->form_validation->set_rules('step' . $step . '[website]', langx('website'), 'callback_website_check');
                $this->form_validation->set_rules('step' . $step . '[address_line_1]', langx('address_line_1'), 'trim|required');

                $this->form_validation->set_rules('step' . $step . '[merchant_state]', langx('state'), 'required');
                $this->form_validation->set_rules('step' . $step . '[merchant_city]', langx('city'), 'required');
                $this->form_validation->set_rules('step' . $step . '[merchant_postal_code]', langx('postal_code'), 'required');

                if ($this->form_validation->run() === TRUE) {

                    $data = [
                        'ch_id'                => $organization_id,
                        'church_name'          => preg_replace('/\s\s+/', ' ', $form['dba_name']),
                        'legal_name'           => $form['legal_name'],
                        'website'              => $form['website'],
                        'street_address'       => $form['address_line_1'],
                    ];

                    $fts_data = [
                        'sign_first_name'            => $form['first_name'],
                        'sign_last_name'             => $form['last_name'],
                        'sign_phone_number'          => $form['phone'],
                        'email'                      => $form['email'],
                        'merchant_address_line_1'    => $form['address_line_1'],
                        'merchant_state'             => $form['merchant_state'],
                        'merchant_city'              => $form['merchant_city'],
                        'merchant_postal_code'       => $form['merchant_postal_code']
                    ];

                    $is_text_to_give_added = false;
                    if (!$organization_id) { //===== create mode
                        //create mode is not available from here, we are creating the basic organization info when creating the dashboard account
                        output_json([
                            "status"  => false,
                            "message" => '<p>An error ocurred, main id field missing</p>'
                        ]);
                        return;
                    } else { //===== update mode
                        $result           = $this->organization_model->update($data); //organization model validates ch_id belongs to the user

                        //these methods (using organization id should me moved after the $result === TRUE for inheriting the validation above

                        $ornx_onboard = $this->orgnx_onboard_fts_model->getByOrg($organization_id, $user_id, ['id']);
                        $fts_data['id'] = $ornx_onboard->id;
                        $fts_data['church_id'] = $organization_id;

                        $this->orgnx_onboard_fts_model->update($fts_data, $user_id);

                        $this->organization_model->setSlug($organization_id);

                        $this->load->model('chat_setting_model');

                        $chat_setting_current = $this->chat_setting_model->getChatSetting($user_id, $organization_id, null);

                        if ($chat_setting_current) {
                            $chat_setting_data = [
                                'id'     => $chat_setting_current->id,
                                'domain' => $form['website']
                            ];

                            $this->chat_setting_model->save($chat_setting_data);
                        } else {
                            output_json([
                                "status"  => false, "message" => '<p>Unexpected error, please contact support. Error: getting_started_no_chat_settings_found</p>'
                            ]);
                            return;
                        }


                        if ($result === TRUE) {

                            //Text to Give
                            if ($this->input->post('is_text_give')) {
                                $state_text   = $this->input->post('step1[state_text_give]');
                                $country_text = $this->input->post('step1[country_text_give]');

                                if (!$this->twilio_phone_codes[$country_text]) {
                                    output_json([
                                        "status"  => false, "message" => '<p>Country not allowed</p>'
                                    ]);
                                    return;
                                }

                                if ($country_text) {
                                    if ($country_text === 'US' && (!$state_text || empty($state_text))) {
                                        output_json([
                                            "status"  => false, "message" => '<p>State for text to give is required</p>'
                                        ]);
                                        return;
                                    }
                                    $orgnx = $this->organization_model->get($organization_id, 'ch_id, twilio_accountsid', false, $user_id);
                                    if (!$orgnx) {
                                        output_json([
                                            "status"  => false, "message" => '<p>Bad request</p>'
                                        ]);
                                        return;
                                    }

                                    if (!$orgnx->twilio_accountsid) {
                                        require_once 'application/libraries/messenger/MessengerProvider.php';
                                        MessengerProvider::init();
                                        $MenssengerInstance = MessengerProvider::getInstance();
                                        $numbers            = $MenssengerInstance->get_available_numbers((object) ['state' => $state_text, 'country' => $country_text]);

                                        if (count($numbers) == 0) {
                                            output_json([
                                                "status"  => false, "message" => '<p>Numbers not found, please try again</p>'
                                            ]);
                                            return;
                                        }

                                        $number = $numbers[0]['value'];

                                        $response = $MenssengerInstance->createno(null, $number);

                                        if (!empty($response)) {
                                            $uResult   = $MenssengerInstance->get_sub_account($response->accountSid);
                                            $authToken = $uResult->__get("authToken");

                                            $save_data = [
                                                "twilio_accountsid"     => $response->accountSid,
                                                "twilio_phonesid"       => $response->sid,
                                                "twilio_phoneno"        => $response->phoneNumber,
                                                "twilio_country_code"   => $country_text,
                                                "twilio_country_number" => $this->twilio_phone_codes[$country_text]['code'],
                                                "twilio_token"          => $authToken
                                            ];

                                            $this->organization_model->update_twilio($organization_id, $save_data);

                                            $is_text_to_give_added = true;
                                        } else {
                                            output_json([
                                                "status"  => false,
                                                "message" => '<p>An error ocurred attempting to to create the number</p>'
                                            ]);
                                            return;
                                        }
                                    }
                                }
                            }

                            $this->stepChange($step);
                            $onboarding_status = $this->getOnboardingStatus($organization_id);
                            output_json(['status' => true, 'ch_id' => $organization_id, 'is_text_to_give_added' => $is_text_to_give_added, 'message' => sprintf(langx('update_success'), langx('company')), 'onboarding_status' => $onboarding_status]);
                            return;
                        } else {
                            output_json($result);
                            return;
                        }
                    }
                }

                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 2) {

                $onboarding_status = $this->getOnboardingStatus($organization_id);
                if (in_array($onboarding_status['app_status'], ['BANK_INFORMATION_SENT', 'ACTIVE'])) {
                    output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company')), 'onboarding_status' => $onboarding_status]);
                    return;
                }

                if($onboarding_status['fortis_template']['status'] === false){
                    output_json(['status' => false, 'message' => $onboarding_status['fortis_template']['message']]);
                    return;
                }

                $this->form_validation->set_rules('step' . $step . '[ach_account_number]', langx('account_number'), 'required');
                $this->form_validation->set_rules('step' . $step . '[ach_routing_number]', langx('routing_number'), 'required');
                $this->form_validation->set_rules('step' . $step . '[account_holder_name]', langx('holder_name'), 'required');
                
                if ($this->form_validation->run() === TRUE) {

                    $form = $_POST['step' . $step];

                    if ($organization_id) { //===== update mode

                        $ornx_onboard = $this->orgnx_onboard_fts_model->getByOrg($organization_id, $user_id, ['id']);
                        $fts_data['id'] = $ornx_onboard->id;
                        $fts_data['church_id'] = $organization_id;

                        //update method will take care of the last 4 digits
                        $fts_data['account_number_last4'] = $form['ach_account_number'];
                        $fts_data['routing_number_last4'] = $form['ach_routing_number'];
                        $fts_data['account_holder_name'] = $form['account_holder_name'];
                        
                        $fts_data['account2_number_last4'] = $form['ach_account_number'];
                        $fts_data['routing2_number_last4'] = $form['ach_routing_number'];
                        $fts_data['account2_holder_name'] = $form['account_holder_name'];

                        $this->orgnx_onboard_fts_model->update($fts_data, $user_id);

                        $procesorResult = $this->doProcessorOnboarding($organization_id, $form);
                        $onboarding_status = $this->getOnboardingStatus($organization_id);   
                        
                        if ($procesorResult['status'] === true) {
                            $notifyData = $this->orgnx_onboard_fts_model->getByOrg($organization_id, $user_id, 'email, church_id as organization_id, mpa_link');
                            $notifyData->_user_id = $user_id;
                            
                            $this->load->helper('admin_notifier');
                            AdminNotifier::onOnboardBankSent($notifyData, ['juan@lunarpay.com']);
                            
                            $this->stepChange($step);
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company')), 'onboarding_status' => $onboarding_status]);
                        } else {
                            output_json(['status' => false, 'message' => '<p>' . $procesorResult['message'] . '</p>']);
                        }

                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 3) {
                $this->stepChange($step);
                $onboarding_status = $this->getOnboardingStatus($organization_id);

                output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company')), 'onboarding_status' => $onboarding_status]);
            } elseif ($step == 4) {
                return;
                $this->form_validation->set_rules('funds', langx('Funds'), 'trim|required');
                if (!$this->form_validation->run()) {
                    output_json(['status' => false, 'message' => validation_errors()]);
                    return;
                }

                // $funds = explode(',', $this->input->post('funds'));

                // $this->load->model('fund_model');
                // $fund_ids = $this->fund_model->resetFunds($funds, $organization_id);

                $amounts = explode(',', $this->input->post('suggested_amounts'));
                
                $conduit_funds = null; //not used
                if ($this->input->post('funds_flow') == 'conduit') {
                    //$conduit_funds = json_encode(array_values($fund_ids));
                }

                $save_data = [
                    'id'                => (int) $this->input->post('id_setting'),
                    'church_id'         => $organization_id,
                    'campus_id'         => null,
                    'trigger_text'      => $this->input->post('trigger_message'),
                    'debug_message'     => $this->input->post('debug_message'),
                    'theme_color'       => $this->input->post('theme_color'),
                    'button_text_color' => $this->input->post('button_text_color'),
                    'type_widget'       => $this->input->post('funds_flow'),
                    'conduit_funds'     => $conduit_funds,
                    'suggested_amounts' => json_encode($amounts),
                    'widget_position'   => $this->input->post('widget_position'),
                ];


                $image_changed = (int) $this->input->post('image_changed');

                if ($image_changed) {                    
                    $errors = []; //this code is repeated, getting_started_fts, it should be refactored
                    $allowed_types = ['image/gif', 'image/jpeg', 'image/png'];
                    if (!in_array($_FILES['logo']['type'], $allowed_types)) {
                        $errors[] = 'Invalid file type. Only GIF, JPEG, and PNG files are allowed.';
                    }

                    // Check file size
                    if ($_FILES['logo']['size'] > BRAND_MAX_LOGO_SIZE * 1024) {
                        $errors[] = 'File size exceeds the maximum allowed size of ' . BRAND_MAX_LOGO_SIZE . ' KB.';
                    }

                    if ($errors) {
                        return [
                            'status'  => false,
                            'message' => array_map(function ($error) {
                                return "<p>$error</p>";
                            }, $errors)
                        ];
                    }
                    $file_name = 'u' . $user_id . '_ch' . $save_data['church_id'];

                    if ($save_data['campus_id'])
                        $file_name .= '_cm' . $save_data['campus_id'];

                    $file_name .= '.' . pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION);

                    $this->load->library('external-storage/ExternalStorageProvider');
                    $extStorage = ExternalStorageProvider::init();
                    $storageResult = $extStorage->upload('branding_logo', $file_name, $_FILES['logo']['tmp_name']);
                    $save_data['logo'] = $storageResult['key'] . '?v=' . strtotime('now');
                }

                $save_data['client_id'] = $user_id;

                //Install or Update Chat Setting
                $result = $this->chat_setting_model->save($save_data);

                if ($result) {
                    $onboarding_status = $this->getOnboardingStatus($organization_id);
                    $this->stepChange($step);
                    output_json([
                        'status'  => true,
                        'id'      => $result,
                        'message' => '',
                        'onboarding_status' => $onboarding_status
                    ]);
                    return;
                } else {
                    output_json($result);
                    return;
                }
            } 
        }
    }

    public function get_organization()
    {
        $user_id = $this->session->userdata('user_id');

        $organization = $this->organization_model->getFirst($user_id, 'ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
            . 'legal_name, email, country, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, token, twilio_accountsid');

        $orgnx_onboard     = null;
        $chat_setting      = null;
        $onboarding_status = null;
        $funds             = [];

        if ($organization) {
            $orgnx_onboard     = $this->orgnx_onboard_fts_model->getByOrg($organization->ch_id, $user_id);

            $chat_setting      = $this->chat_setting_model->getChatSetting($user_id, $organization->ch_id, null);
            $onboarding_status = $this->getOnboardingStatus($organization->ch_id);

            if ($organization->twilio_accountsid) {
                $organization->_twilio_accountsid = true;
            } else {
                $organization->_twilio_accountsid = false;
            }
            unset($organization->twilio_accountsid);

            $this->load->model('fund_model');
            $funds = $this->fund_model->getList($organization->ch_id);
        }

        $this->load->model('ion_auth_model');
        $starter_step = $this->ion_auth_model->getStarterStep($user_id);

        output_json([
            'organization'      => $organization,
            'onboard'           => $orgnx_onboard,
            'onboarding_status' => $onboarding_status,
            'starter_step'      => $starter_step->starter_step,
            'chat_setting'      => $chat_setting,
            'funds'             => $funds
        ]);
    }

    //PAYSAFE METHODS
    private function getOnboardingStatus($orgnx_id)
    {
        $user_id       = $this->session->userdata('user_id');
        $orgnx_onboard = $this->orgnx_onboard_fts_model->getByOrg($orgnx_id, $user_id, ['id', 'app_status', 'mpa_link']); //church_id comes safe        
        $fortis_template = $this->organization_model->get($orgnx_id, 'fortis_template')->fortis_template;

        $orgnx_id_val = is_numeric($orgnx_id) ? (int)$orgnx_id : 0;
        $devLinkOnly = $_ENV['fortis_environment'] === 'dev' ? 
        '
        <div class="alert alert-secondary mt-3">
        THIS SECTION SHOWS UP ONLY IN DEV ENVIRONMENT
        <br>
        <br>
        <a class="text-dark text-underline" href="' .BASE_URL . 'utilities/admin_tasks/update_organization/' . $orgnx_id_val . '" target="_blank">Update price template here</a>
        <br><br>
        Test bank information: <br>
        <b>Account number:</b> 01234567890123 <br>
        <b>Routing number:</b> 011103093 <br>
        </div>' 
        : '';

        if ($orgnx_onboard) {
            return [
                'app_status'                 => $orgnx_onboard->app_status,
                'mpa_link'                   => $orgnx_onboard->mpa_link,
                'fortis_template'            => [
                    'status'  => $fortis_template ? true : false,
                    'message' => $fortis_template ? 'Template found' 
                    : ("<p>Please contact our support team to set up a price template before continuing.<p>" .
                        "$devLinkOnly")
                ]
            ];
        } else {
            return [
                'app_status' => null,
                'mpa_link'   => null,
                'fortis_template' => null
            ];
        }
    }

    private function doProcessorOnboarding($orgnx_id, $bank_accounts)
    {

        $user_id       = $this->session->userdata('user_id');
        $orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe        
        $orgnx_onboard = $this->orgnx_onboard_fts_model->getByOrg($orgnx_id, $user_id);

        $merchantData = [
            'primary_principal' => [
                'first_name'    => $orgnx_onboard->sign_first_name,
                'last_name'     => $orgnx_onboard->sign_last_name,
                'phone_number'  => $orgnx_onboard->sign_phone_number,
            ],
            'email' => $orgnx_onboard->email,
            'dba_name' => $orgnx->church_name,
            //'template_code' => $orgnx->fortis_template ? $orgnx->fortis_template
            //    : ($test ? 'Testing1234' :  FORTIS_TPL_DEFAULT),

            'template_code' => $orgnx->fortis_template,
            'website' => $orgnx->website,

            'location' => [
                'address_line_1' => $orgnx_onboard->merchant_address_line_1,                
                'state_province' => $orgnx_onboard->merchant_state,
                'city'           => $orgnx_onboard->merchant_city,
                'postal_code'    => $orgnx_onboard->merchant_postal_code,
                'phone_number'   => $orgnx_onboard->sign_phone_number,                                
            ],

            "app_delivery" => "link_iframe",

            'bank_account' => [
                'routing_number'      => $bank_accounts['ach_routing_number'],
                'account_number'      => $bank_accounts['ach_account_number'],
                'account_holder_name' => $bank_accounts['account_holder_name'],
            ],

            'alt_bank_account' => [
                'routing_number'      => $bank_accounts['ach_routing_number'],
                'account_number'      => $bank_accounts['ach_account_number'],
                'account_holder_name' => $bank_accounts['account_holder_name'],
                'deposit_type'        => 'fees_adjustments'
            ],

            'legal_name' => $orgnx->legal_name,

            'contact' => [
                'phone_number' => $orgnx_onboard->sign_phone_number,
            ],
            'client_app_id' => $orgnx->ch_id
        ];

        //$merchantData['app_complete_endpoint'] = base_url() . 'epicpay/merchant_appcomplete/' . $orgnx->ch_id;
        //$this->PaymentInstance->setTesting(false);

        $response                              = $this->PaymentInstance->onboardMerchant($merchantData);

        $save_data = ['id' => $orgnx_onboard->id, 'church_id' => $orgnx_id, 'processor_response' => json_encode($response['result'])];

        if ($response['status'] === true) {
            $save_data['app_status'] = 'BANK_INFORMATION_SENT';
            $save_data['mpa_link'] = $response['result']->data->app_link;
            $this->orgnx_onboard_fts_model->update($save_data, $user_id);
        } else {
            $save_data['app_status'] = 'FORM_ERROR';
            $this->orgnx_onboard_fts_model->update($save_data, $user_id);
        }

        return $response;
    }

    private function stepChange($step)
    {
        $this->load->model('ion_auth_model');
        $starter_step = $this->ion_auth_model->getStarterStep($this->session->userdata('user_id'));
        if ($starter_step->starter_step == $step) {
            $this->ion_auth_model->setStarterStep($this->session->userdata('user_id'), $step + 1);
        }
    }

    /*     * ************************************************* */
    /*     * ************************************************* */
    /*     * ************************************************* */
}
