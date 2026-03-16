<?php

//for now we need to keep synced Getting_started.php with Paysafe.php, if you make a change here you have to do it there too

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Getting_started extends My_Controller {

    protected $twilio_phone_codes = TWILIO_AVAILABLE_COUNTRIES_NO_CREATION;
    public $data                  = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        if($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_FORTIS_SHORT) {
            redirect('getting_started_fts', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);
        PaymentsProvider::init(PROVIDER_PAYMENT_PAYSAFE);
        $this->PaymentInstance = PaymentsProvider::getInstance();
        
        PaymentsProvider::init(PROVIDER_PAYMENT_ETH);
        $this->PaymentCryptoInstance = PaymentsProvider::getInstance();
        
        $this->load->model('organization_model');
        $this->load->model('orgnx_onboard_psf_model');
        $this->load->model('orgnx_onboard_crypto_model');
        $this->load->model('chat_setting_model');

        display_errors();
    }
    
    //go to getting starter but to a specific step
    public function step($stepValue) {
        $this->load->model('user_model');

        $user_id = $this->session->userdata('user_id');
        try {
            $this->user_model->setStarterStep($user_id, $stepValue);
            redirect(BASE_URL . 'getting_started', 'refresh');
        } catch (Exception $ex) {
            show_error($ex->getMessage(), 400);            
        }
    }

    public function index() {

        $this->template_data['title'] = langx("Getting Started");
                
        $this->load->model('localization_model');
        $this->template_data['us_states'] = $this->localization_model->getUsStates();

        $view = $this->load->view('getting_started/getting_started', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);
    }

    public function save_domain() {
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

    public function website_check($str) {
        //validate domain
        $str = strpos($str, 'http') !== 0 ? 'http://' . $str : $str;
        $url_split       = explode('.', $str);

        if (filter_var($str, FILTER_VALIDATE_URL) === false || count($url_split) < 2) {
            $this->form_validation->set_message('website_check', 'A valid website is required');
            return FALSE;            
        }
        
        return true;

    }
    
    public function save_onboarding() {
        if ($this->input->post()) {

            $this->load->library('form_validation');

            $organization_id = (int) $this->input->post('id');

            $step    = $this->input->post('step');
            $user_id = $this->session->userdata('user_id');

            if ($step == 1) {
                $form = $_POST['step' . $step];

                $this->form_validation->set_rules('step' . $step . '[dba_name]', langx('company_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[legal_name]', langx('legal_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[region]', langx('region'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[business_category]', langx('business_category'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                //$this->form_validation->set_rules('step' . $step . '[email]', langx('email'), 'trim|required|valid_email');
                $this->form_validation->set_rules('step' . $step . '[yearlyVolumeRange]', langx('yearly_volume_range'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[averageTransactionAmount]', langx('average_transaction_amount'), 'trim|required');

                $this->form_validation->set_rules('step' . $step . '[processing_currency]', langx('processing_currency'), 'trim|required');

                $this->form_validation->set_rules('step' . $step . '[businessType]', langx('business_type'), 'trim|required');

                if ($_POST['step' . $step]['region'] === 'EU') {
                    $this->form_validation->set_rules('step' . $step . '[federalTaxNumber]', langx('tax_identification_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[registrationNumber]', langx('registration_number'), 'trim|required');
                } else {
                    $this->form_validation->set_rules('step' . $step . '[federalTaxNumber]', langx('federal_tax_number'), 'trim|required');
                }
                
                $this->form_validation->set_rules('step' . $step . '[website]', langx('website'), 'callback_website_check');
                
                //Merchant Address Rules
                $this->form_validation->set_rules('step' . $step . '[country]', langx('country'), 'trim|required');
                if ($form['country'] === 'US' || $form['country'] === 'CA') {
                    $this->form_validation->set_rules('step' . $step . '[state_province]', langx('state'), 'trim|required');
                }
                $this->form_validation->set_rules('step' . $step . '[city]', langx('city'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[postal_code]', langx('postal_code'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[address_line_1]', langx('address_line_1'), 'trim|required');

                if ($this->form_validation->run() === TRUE) {
                    
                    $data = [
                        'ch_id'                => $organization_id,
                        'church_name'          => preg_replace('/\s\s+/', ' ', $form['dba_name']),
                        'legal_name'           => $form['legal_name'],
                        'website'              => $form['website'],
                        'phone_no'             => $form['phone_number'],
                        'tax_id'               => $form['federalTaxNumber'],
                        'city'                 => $form['city'],
                        'street_address'       => $form['address_line_1'],
                        'street_address_suite' => $form['address_line_2'],
                        'postal'               => $form['postal_code'],
                        'country'              => $form['country']
                    ];
                    if ($form['country'] === 'US' || $form['country'] === 'CA') {
                        $data['state'] = $form['state_province'];
                    }

                    //takes the first letter of each word and removes duplicated spaces, 
                    //dynamic_descriptor will always be initialized as $data['church_name'] will always be a not empty string

                    if (preg_match_all('/\b(\w)/', strtoupper($data['church_name']), $m)) {
                        $dynamic_descriptor = implode('', $m[1]) . ' ' . $form['region'];
                    }

                    $psf_data = [
                        'merchant_name'              => $data['church_name'],
                        'region'                     => $form['region'],
                        'business_category'          => $form['business_category'],
                        'yearly_volume_range'        => $form['yearlyVolumeRange'],
                        'average_transaction_amount' => $form['averageTransactionAmount'],
                        'currency'                   => $form['processing_currency'],
                        'dynamic_descriptor'         => $dynamic_descriptor,
                        'phone_descriptor'           => $form['phone_number'],
                        'business_type'              => $form['businessType'],
                        'federal_tax_number'         => $form['federalTaxNumber'],
                        'registration_number'        => $_POST['step' . $step]['region'] === 'EU' ? $form['registrationNumber'] : null
                    ];

                    $is_text_to_give_added = false;
                    if (!$organization_id) {//===== create mode
                        //create mode is not available from here, we are creating the basic organization info when creating the dashboard account
                        output_json([
                            "status"  => false,
                            "message" => '<p>An error ocurred, main id field missing</p>'
                        ]);
                        return;
                    } else {//===== update mode
                        $result           = $this->organization_model->update($data); //organization model validates ch_id belongs to the user
                        
                        //these methods (using organization id should me moved after the $result === TRUE for inheriting the validation above
                        
                        $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id']);

                        if ($ornx_onboard_psf) {
                            $psf_data['id'] = $ornx_onboard_psf->id;
                        }
                        $psf_data['church_id'] = $organization_id;

                        if ($ornx_onboard_psf) {
                            $this->orgnx_onboard_psf_model->update($psf_data, $user_id);
                        } else {
                            $this->orgnx_onboard_psf_model->register($psf_data);
                        }
                        
                        $this->organization_model->setSlug($organization_id);
                        
                        $this->load->model('chat_setting_model');
                        
                        $chat_setting_current = $this->chat_setting_model->getChatSetting($user_id, $organization_id, null);
                        
                        if($chat_setting_current) {
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

                            output_json(['status' => true, 'ch_id' => $organization_id, 'is_text_to_give_added' => $is_text_to_give_added, 'message' => sprintf(langx('update_success'), langx('company'))]);
                            return;
                        } else {
                            output_json($result);
                            return;
                        }
                    }
                }

                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 2) {

                $this->form_validation->set_rules('step' . $step . '[first_name]', langx('first_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[last_name]', langx('last_name'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[title]', langx('title'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[business_owner_is_european]', langx('business_owner_is_european'), 'trim|required');

                //using imask in the front end, it sends "__/__/____" when empty so we use isValidDate own function for validating dates
                $_POST['step' . $step]['date_of_birth'] = isValidDate($_POST['step' . $step]['date_of_birth']) ? $_POST['step' . $step]['date_of_birth'] : null;
                $this->form_validation->set_rules('step' . $step . '[date_of_birth]', langx('date_of_birth'), 'trim|required');

                if ($_POST['step1']['region'] == 'US' && !in_array($_POST['step1']['businessType'], ['NPCORP', 'CHARITY', 'GOV'])) {
                    $this->form_validation->set_rules('step' . $step . '[ssn]', langx('ssn'), 'trim|required');
                }

                $this->form_validation->set_rules('step' . $step . '[owner_current_country]', langx('country'), 'trim|required');

                if (in_array($_POST['step2']['owner_current_country'], ['US', 'CA'])) {
                    $this->form_validation->set_rules('step' . $step . '[owner_current_state_province]', langx('state'), 'trim|required');
                }

                $this->form_validation->set_rules('step' . $step . '[owner_current_city]', langx('city'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[owner_current_postal_code]', langx('postal_code'), 'trim|required');
                $this->form_validation->set_rules('step' . $step . '[owner_current_address_line_1]', langx('address_line'), 'trim|required');

                if ($_POST['step1']['region'] != 'US') {
                    $this->form_validation->set_rules('step' . $step . '[years_at_address]', langx('years_at_address'), 'trim|required');
                }

                if ($_POST['step1']['region'] != 'US' && $_POST['step2']['years_at_address'] < 3 && $_POST['step2']['years_at_address'] != "") {
                    $this->form_validation->set_rules('step' . $step . '[years_at_address]', langx('years_at_address'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[owner_previous_country]', langx('owner_previous_country'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_previous_state_province]', langx('owner_previous_state'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_previous_city]', langx('owner_previous_city'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_previous_postal_code]', langx('owner_previous_postal_code'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_previous_address_line_1]', langx('owner_previous_address_line'), 'trim|required');
                }

                if ($_POST['step2']['business_owner_is_european'] == 'Yes') {
                    $this->form_validation->set_rules('step' . $step . '[nationality]', langx('business_owner_nationality'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_gender]', langx('owner_gender'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[euidcard_number]', langx('identity_card_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[euidcard_country_issue]', langx('identity_card_country_of_issue'), 'trim|required');

                    //using imask in the front end, it sends "__/__/____" when empty so we use isValidDate own function for validating dates
                    $_POST['step' . $step]['eu_xpry_date'] = isValidDate($_POST['step' . $step]['eu_xpry_date']) ? $_POST['step' . $step]['eu_xpry_date'] : null;
                    $this->form_validation->set_rules('step' . $step . '[eu_xpry_date]', langx('identity_card_expiry_date'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[id_number_line_1]', langx('identity_card_id_number_line_1'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[id_number_line_2]', langx('identity_card_id_number_line_2'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[id_number_line_3]', langx('identity_card_id_number_line_3'), 'trim|required');
                }

                if (time() < strtotime('+18 years', strtotime($_POST['step2']['date_of_birth']))) {
                    output_json(['status' => false, 'message' => '<p>Date of Birth must be > 18 Years</p>']);
                    return;
                }

                $_POST['step2']['is_control_prong'] = isset($_POST['step2']['is_control_prong']) ? (int)$_POST['step2']['is_control_prong'] : 0;
                $_POST['step2']['is_applicant'] = isset($_POST['step2']['is_applicant']) ? (int)$_POST['step2']['is_applicant'] : 0;

                if ($_POST['step1']['region'] != 'EU' && !$_POST['step2']['is_applicant']) {
                    output_json(['status' => false, 'message' => '<p>You must be an Applicant to continue.</p>']);
                    return;
                }

                if($_POST['step1']['region'] == 'US'){
                    if(!$_POST['step2']['is_control_prong']){
                        $this->form_validation->set_rules('step' . $step . '[owner2_current_country]', langx('country'), 'trim|required');

                        if (in_array($_POST['step2']['owner2_current_country'], ['US', 'CA'])) {
                            $this->form_validation->set_rules('step' . $step . '[owner2_current_state_province]', langx('state'), 'trim|required');
                        }

                        $this->form_validation->set_rules('step' . $step . '[owner2_current_city]', langx('city'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner2_current_postal_code]', langx('postal_code'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner2_current_address_line_1]', langx('address_line'), 'trim|required');

                        if ($_POST['step2']['owner2_business_owner_is_european'] == 'Yes') {
                            $this->form_validation->set_rules('step' . $step . '[owner2_nationality]', langx('business_owner_nationality'), 'trim|required');
                            $this->form_validation->set_rules('step' . $step . '[owner2_gender]', langx('owner_gender'), 'trim|required');
                            $this->form_validation->set_rules('step' . $step . '[owner2_euidcard_number]', langx('identity_card_number'), 'trim|required');
                            $this->form_validation->set_rules('step' . $step . '[owner2_euidcard_country_issue]', langx('identity_card_country_of_issue'), 'trim|required');

                            //using imask in the front end, it sends "__/__/____" when empty so we use isValidDate own function for validating dates
                            $_POST['step' . $step]['owner2_eu_xpry_date'] = isValidDate($_POST['step' . $step]['owner2_eu_xpry_date']) ? $_POST['step' . $step]['owner2_eu_xpry_date'] : null;
                            $this->form_validation->set_rules('step' . $step . '[owner2_eu_xpry_date]', langx('identity_card_expiry_date'), 'trim|required');

                            $this->form_validation->set_rules('step' . $step . '[owner2_id_number_line_1]', langx('identity_card_id_number_line_1'), 'trim|required');
                            $this->form_validation->set_rules('step' . $step . '[owner2_id_number_line_2]', langx('identity_card_id_number_line_2'), 'trim|required');
                            $this->form_validation->set_rules('step' . $step . '[owner2_id_number_line_3]', langx('identity_card_id_number_line_3'), 'trim|required');
                        }

                        if (time() < strtotime('+18 years', strtotime($_POST['step2']['owner2_date_of_birth']))) {
                            output_json(['status' => false, 'message' => '<p>Date of Birth must be > 18 Years</p>']);
                            return;
                        }
                    }
                }

                if ($this->form_validation->run() === TRUE) {

                    $form = $_POST['step' . $step];

                    if ($organization_id) {//===== update mode
                        $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id']);
                        $psf_data         = [
                            'id'                            => $ornx_onboard_psf->id,
                            'church_id'                     => $organization_id,
                            'owner_first_name'              => $form['first_name'],
                            'owner_last_name'               => $form['last_name'],
                            'owner_title'                   => $form['title'],
                            'owner_phone'                   => $form['phone_number'],
                            'owner_is_european'             => $form['business_owner_is_european'],
                            'owner_nationality'             => isset($form['nationality']) ? $form['nationality'] : null,
                            'owner_gender'                  => isset($form['owner_gender']) ? $form['owner_gender'] : null,
                            'owner_birth'                   => date('Y-m-d', strtotime($form['date_of_birth'])),
                            'owner_ssn'                     => isset($form['ssn']) ? $form['ssn'] : null,
                            'owner_current_country'         => $form['owner_current_country'],
                            'owner_current_state'           => isset($form['owner_current_state_province']) ? $form['owner_current_state_province'] : null,
                            'owner_current_city'            => $form['owner_current_city'],
                            'owner_current_zip'             => $form['owner_current_postal_code'],
                            'owner_current_address_line_1'  => $form['owner_current_address_line_1'],
                            'owner_current_address_line_2'  => $form['owner_current_address_line_2'],

                            'years_at_address'              => isset($form['years_at_address']) ? $form['years_at_address'] : null,
                            ////////////////////////////
                            'owner_previous_country'        => isset($form['owner_previous_country']) ? $form['owner_previous_country'] : null,
                            'owner_previous_state'          => isset($form['owner_previous_state_province']) ? $form['owner_previous_state_province'] : null,
                            'owner_previous_city'           => isset($form['owner_previous_city']) ? $form['owner_previous_city'] : null,
                            'owner_previous_zip'            => isset($form['owner_previous_postal_code']) ? $form['owner_previous_postal_code'] : null,
                            'owner_previous_address_line_1' => isset($form['owner_previous_address_line_1']) ? $form['owner_previous_address_line_1'] : null,
                            'owner_previous_address_line_2' => isset($form['owner_previous_address_line_2']) ? $form['owner_previous_address_line_2'] : null,
                            ///////////////////////////
                            'euidcard_number'               => $form['euidcard_number'],
                            'euidcard_country_of_issue'     => $form['euidcard_country_issue'],
                            'euidcard_expiry_date'          => date('Y-m-d', strtotime($form['eu_xpry_date'])),
                            'euidcard_number_line_1'        => $form['id_number_line_1'],
                            'euidcard_number_line_2'        => $form['id_number_line_2'],
                            'euidcard_number_line_3'        => $form['id_number_line_3']
                        ];

                        if ($_POST['step1']['region'] == 'US') {
                            $psf_data['owner_is_applicant']            = $form['is_applicant'];
                            $psf_data['owner_is_control_prong']        = $form['is_control_prong'];

                        } else if ($_POST['step1']['region'] == 'CA'){
                            $psf_data['owner_is_applicant']            = $form['is_applicant'];
                            $psf_data['owner_is_control_prong']        = false;
                        } else {
                            $psf_data['owner_is_applicant']            = false;
                            $psf_data['owner_is_control_prong']        = false;
                        }

                        if ($_POST['step1']['region'] == 'US' && !$form['is_control_prong']) {
                            $psf_data['owner2_first_name']                = $form['owner2_first_name'];
                            $psf_data['owner2_last_name']                 = $form['owner2_last_name'];
                            $psf_data['owner2_title']                     = $form['owner2_title'];
                            $psf_data['owner2_phone']                     = $form['owner2_phone_number'];
                            $psf_data['owner2_is_european']               = $form['owner2_business_owner_is_european'];
                            $psf_data['owner2_nationality']               = isset($form['owner2_nationality']) ? $form['owner2_nationality'] : null;
                            $psf_data['owner2_gender']                    = isset($form['owner2_gender']) ? $form['owner2_gender'] : null;
                            $psf_data['owner2_birth']                     = date('Y-m-d', strtotime($form['owner2_date_of_birth']));
                            $psf_data['owner2_ssn']                       = isset($form['owner2_ssn']) ? $form['owner2_ssn'] : null;
                            $psf_data['owner2_current_country']           = $form['owner2_current_country'];
                            $psf_data['owner2_current_state']             = isset($form['owner2_current_state_province']) ? $form['owner2_current_state_province'] : null;
                            $psf_data['owner2_current_city']              = $form['owner2_current_city'];
                            $psf_data['owner2_current_zip']               = $form['owner2_current_postal_code'];
                            $psf_data['owner2_current_address_line_1']    = $form['owner2_current_address_line_1'];
                            $psf_data['owner2_current_address_line_2']    = $form['owner2_current_address_line_2'];
                            $psf_data['owner2_is_applicant']              = false;
                            $psf_data['owner2_is_control_prong']             = true;

                            $psf_data['years_at_address2']          = isset($form['owner2_years_at_address']) ? $form['owner2_years_at_address'] : null;
                            ////////////////////////////
                            $psf_data['owner2_previous_country']          = isset($form['owner2_previous_country']) ? $form['owner2_previous_country'] : null;
                            $psf_data['owner2_previous_state']            = isset($form['owner2_previous_state_province']) ? $form['owner2_previous_state_province'] : null;
                            $psf_data['owner2_previous_city']             = isset($form['owner2_previous_city']) ? $form['owner2_previous_city'] : null;
                            $psf_data['owner2_previous_zip']              = isset($form['owner2_previous_postal_code']) ? $form['owner2_previous_postal_code'] : null;
                            $psf_data['owner2_previous_address_line_1']   = isset($form['owner2_previous_address_line_1']) ? $form['owner2_previous_address_line_1'] : null;
                            $psf_data['owner2_previous_address_line_2']   = isset($form['owner2_previous_address_line_2']) ? $form['owner2_previous_address_line_2'] : null;
                            ///////////////////////////
                            $psf_data['euidcard_number2']           = $form['owner2_euidcard_number'];
                            $psf_data['euidcard_country_of_issue2'] = $form['owner2_euidcard_country_issue'];
                            $psf_data['euidcard_expiry_date2']      = date('Y-m-d', strtotime($form['owner2_eu_xpry_date']));
                            $psf_data['euidcard_number_line_12']    = $form['owner2_id_number_line_1'];
                            $psf_data['euidcard_number_line_22']    = $form['owner2_id_number_line_2'];
                            $psf_data['euidcard_number_line_32']    = $form['owner2_id_number_line_3'];
                        } else {
                            $psf_data['owner2_first_name']                = null;
                            $psf_data['owner2_last_name']                 = null;
                            $psf_data['owner2_title']                     = null;
                            $psf_data['owner2_phone']                     = null;
                            $psf_data['owner2_is_european']               = null;
                            $psf_data['owner2_nationality']               = null;
                            $psf_data['owner2_gender']                    = null;
                            $psf_data['owner2_birth']                     = null;
                            $psf_data['owner2_ssn']                       = null;
                            $psf_data['owner2_current_country']           = null;
                            $psf_data['owner2_current_state']             = null;
                            $psf_data['owner2_current_city']              = null;
                            $psf_data['owner2_current_zip']               = null;
                            $psf_data['owner2_current_address_line_1']    = null;
                            $psf_data['owner2_current_address_line_2']    = null;

                            $psf_data['owner2_is_applicant']              = false;
                            $psf_data['owner2_is_control_prong']             = false;

                            $psf_data['years_at_address2']          = null;
                            ////////////////////////////
                            $psf_data['owner2_previous_country']          = null;
                            $psf_data['owner2_previous_state']            = null;
                            $psf_data['owner2_previous_city']             = null;
                            $psf_data['owner2_previous_zip']              = null;
                            $psf_data['owner2_previous_address_line_1']   = null;
                            $psf_data['owner2_previous_address_line_2']   = null;
                            ///////////////////////////
                            $psf_data['euidcard_number2']           = null;
                            $psf_data['euidcard_country_of_issue2'] = null;
                            $psf_data['euidcard_expiry_date2']      = null;
                            $psf_data['euidcard_number_line_12']    = null;
                            $psf_data['euidcard_number_line_22']    = null;
                            $psf_data['euidcard_number_line_32']    = null;
                        }

                        $result = $this->orgnx_onboard_psf_model->update($psf_data, $user_id);

                        $onboarding_status = $this->getOnboardingStatus($organization_id);

                        if ($result === TRUE) {
                            $this->stepChange($step);
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company')), 'onboarding_status' => $onboarding_status]);
                            return;
                        } else {
                            output_json($result);
                            return;
                        }
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 3) {

                $ornx_onboard_psf  = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id', 'backoffice_username', 'bank_type']);
                $onboarding_status = $this->getOnboardingStatus($organization_id);
                
                //just create the crypto wallet register
                $active_crypto_wallet = isset($_POST['step' . $step]['create_crypto_wallet']) && $_POST['step' . $step]['create_crypto_wallet'] ? 1 : 0;                
                $orgnx_onboard_crypto = $this->orgnx_onboard_crypto_model->getByOrg($organization_id, $user_id, ['id']);                
                $crypto_data          = ['church_id' => $organization_id, 'active' => $active_crypto_wallet];                                                    
                
                if ($orgnx_onboard_crypto) {
                    $crypto_data['id'] = $orgnx_onboard_crypto->id;
                    $this->orgnx_onboard_crypto_model->update($crypto_data, $user_id);
                } else {
                    $this->orgnx_onboard_crypto_model->register($crypto_data);
                }
                
                
                $this->createCryptoWallet($organization_id);
                
                if (!$onboarding_status['bank_account_created_1'] || !$onboarding_status['bank_account_created_2']) {
                    // validate bank information data

                    $bankAlreadyCreated = false;

                    $form = $_POST['step' . $step];

                    $bank_type = strtolower($form['bank_type']);

                    if (!$bank_type) {
                        output_json(['status' => false, 'message' => '<p>Please, select a bank type</p>']);
                        return;
                    }

                    foreach ($form as $key => $value) {
                        if (substr($key, 0, strlen($bank_type)) === $bank_type) {
                            $name = str_replace($bank_type . '_', '', $key);
                            $this->form_validation->set_rules('step' . $step . '[' . $key . ']', langx($name), 'trim|required');
                        }
                    }
                } else {
                    // bank information data is disabled, form not sent, take bank_type from ornx_onboard_psf
                    $bankAlreadyCreated = true;
                    $form               = [];
                    $bank_type          = strtolower($ornx_onboard_psf->bank_type);
                }

                if ($bankAlreadyCreated || $this->form_validation->run() === TRUE) {

                    if ($organization_id) {//===== update mode
                        $bank_account = [];
                        foreach ($form as $key => $value) {
                            if (substr($key, 0, strlen($bank_type)) === $bank_type) {
                                $bank_account[$key] = $value;
                            }
                        }

                        $resp = $this->doProcessorOnboarding($organization_id, $bank_account, $bank_type);

                        $onboarding_status = $this->getOnboardingStatus($organization_id);

                        if ($resp['error']) {
                            output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                            return;
                        }
                        $this->stepChange($step);
                        output_json(['status' => true, 'ch_id' => $organization_id, 'message' => $resp['message'], 'onboard_id' => $ornx_onboard_psf->id, 'onboarding_status' => $onboarding_status]);
                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 4) {
                if ($organization_id) { //===== update mode
                    $resp = $this->termsAndValidationsRequestProcessorOnboarding($organization_id);

                    $onboarding_status = $this->getOnboardingStatus($organization_id);
                    if ($resp['error']) {
                        output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                        return;
                    }
                    $this->stepChange($step);
                    output_json(['status' => true, 'ch_id' => $organization_id, 'message' => $resp['message'], 'onboarding_status' => $onboarding_status]);
                } else {
                    output_json(['status' => false, 'message' => 'Invalid request']);
                }
            } elseif ($step == 5) {
                $this->form_validation->set_rules('funds', langx('Funds'), 'trim|required');
                if (!$this->form_validation->run()) {
                    output_json(['status' => false, 'message' => validation_errors()]);
                    return;
                }

                $funds = explode(',', $this->input->post('funds'));

                $this->load->model('fund_model');
                $fund_ids = $this->fund_model->resetFunds($funds, $organization_id);

                $amounts = explode(',', $this->input->post('suggested_amounts'));

                $conduit_funds = null;
                if($this->input->post('funds_flow') == 'conduit'){
                    $conduit_funds = json_encode(array_values($fund_ids));
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
                    $logo_category = 'branding_logo';

                    $config['upload_path']   = './application/uploads/' . $logo_category . '/';
                    $config['allowed_types'] = 'gif|jpg|jpeg|png';
                    $config['max_size']      = 300;
                    $config['overwrite']     = true;
                    $config['file_name']     = 'u' . $user_id . '_ch' . $save_data['church_id'];

                    if ($save_data['campus_id'])
                        $config['file_name'] .= '_cm' . $save_data['campus_id'];

                    $this->load->library('upload', $config);

                    if ($this->upload->do_upload('logo')) {
                        $image_data        = $this->upload->data();
                        $save_data['logo'] = $logo_category . '/' . $image_data['file_name'].'?v='.strtotime('now');
                    } else {
                        output_json([
                            'status'  => false,
                            'message' => $this->upload->display_errors()
                        ]);
                        return;
                    }
                }

                $save_data['client_id'] = $user_id;

                //Install or Update Chat Setting
                $result = $this->chat_setting_model->save($save_data);

                if ($result) {
                    $this->stepChange($step);
                    output_json([
                        'status'  => true,
                        'id'      => $result,
                        'message' => ''
                    ]);
                    return;
                } else {
                    output_json($result);
                    return;
                }
            } elseif ($step == 6) {

                $onboarding_status = $this->getOnboardingStatus($organization_id);
                
                //if validation_amount is not sent, it means that it's not possible to make the bank validation, but the user can continue and do that later trhough support
                if ($onboarding_status['microdeposit_validation'] == 'VALIDATED' || !isset($_POST['step' . $step]['validation_amount'])) {
                    //if it's already validated just jump to the next step, the user already passed this
                    $this->stepChange($step);
                    output_json(['status' => true, 'ch_id' => $organization_id, 'message' => '', 'onboarding_status' => $onboarding_status]);
                    return;
                }

                $this->form_validation->set_rules('step' . $step . '[validation_amount]', langx('validation_amount'), 'trim|required');
                if ($this->form_validation->run() === TRUE) {
                    $form = $_POST['step' . $step];
                    if ($organization_id) { //===== update mode
                        $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id']);
                        $psf_data         = [
                            'id'                => $ornx_onboard_psf->id,
                            'church_id'         => $organization_id,
                            'validation_amount' => $form['validation_amount'],
                        ];

                        $this->orgnx_onboard_psf_model->update($psf_data, $user_id);

                        $resp = $this->finishProcessorOnboarding($organization_id);

                        $onboarding_status = $this->getOnboardingStatus($organization_id);
                        
                        if ($resp['error']) {
                            output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>', 'onboarding_status' => $onboarding_status]);
                            return;
                        }

                        if ($onboarding_status['microdeposit_validation'] == 'VALIDATED') {
                            $this->stepChange($step);
                        }
                        output_json(['status' => true, 'ch_id' => $organization_id, 'message' => $resp['message'], 'onboarding_status' => $onboarding_status]);
                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                        return;
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            }
        }
    }

    public function get_organization() {
        $user_id = $this->session->userdata('user_id');

        $organization = $this->organization_model->getFirst($user_id, 'ch_id, client_id, website, logo, church_name, phone_no, website, street_address, street_address_suite, '
                . 'legal_name, email, country, city, state, postal, tax_id, giving_type, epicpay_template, epicpay_verification_status, token, twilio_accountsid');

        $orgnx_onboard     = null;
        $chat_setting      = null;
        $onboarding_status = null;
        $funds             = [];

        if ($organization) {
            $orgnx_onboard     = $this->orgnx_onboard_psf_model->getByOrg($organization->ch_id, $user_id);            
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
    private function getOnboardingStatus($orgnx_id) {
        $user_id       = $this->session->userdata('user_id');
        $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($orgnx_id, $user_id); //church_id comes safe
        $orgnx_onboard_crypto = $this->orgnx_onboard_crypto_model->getByOrg($orgnx_id, $user_id, 'id, active'); //church_id comes safe
        
        if (!$orgnx_onboard) {
            return [
                'microddeposit_created'       => false,
                'microdeposit_validation'     => null,
                'bank_status_blocked'         => ['status' => false, 'error' => '<p></p>'],
                'account_status_credit_card'  => null,
                'account_status_direct_debit' => null,
                'bank_account_created_1'      => false,
                'bank_account_created_2'      => false,
                'terms_conditions_acceptance' => false,
                'orgnx_onboard_crypto'        => null,
                'message'                     => ''
            ];
        }

        $bank_status_blocked = $orgnx_onboard->bank_status_blocked ? json_decode($orgnx_onboard->bank_status_blocked) : false;

        if ($bank_status_blocked) {
            $error               = ['response' => $bank_status_blocked->response];
            $error               = $this->composeError($error);
            $bank_status_blocked = [
                'status' => true,
                'error'  => '<p>' . $error . '</p>'
            ];
        } else {
            $bank_status_blocked = [
                'status' => false,
                'error'  => '<p></p>'
            ];
        }

        $message = "";

        return [
            'microddeposit_created'       => $orgnx_onboard->bank_microdeposit_id ? true : false,
            'microdeposit_validation'     => strtoupper($orgnx_onboard->bank_status),
            'bank_status_blocked'         => $bank_status_blocked,
            'account_status_credit_card'  => strtoupper($orgnx_onboard->account_status),
            'account_status_direct_debit' => strtoupper($orgnx_onboard->account_status2),
            'bank_account_created_1'      => $orgnx_onboard->bank_id ? true : false,
            'bank_account_created_2'      => $orgnx_onboard->bank_id2 ? true : false,
            'terms_conditions_acceptance' => $orgnx_onboard->terms_conditions_acceptance_id ? true : false,
            'orgnx_onboard_crypto'        => $orgnx_onboard_crypto,
            'message'                     => $message
        ];
    }

    private function finishProcessorOnboarding($orgnx_id) {
        $user_id       = $this->session->userdata('user_id');
        //$orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe
        $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($orgnx_id, $user_id);

        //using exceptions to escale errors wherever they occur
        try {

            $this->bank_amount_confirmation($orgnx_onboard);
        } catch (Exception $exc) {
            log_message("error", "PAYSAFE_ONBOARD_EXCEPTION: onboard_psf ID $orgnx_onboard->id "
                    . "church_id $orgnx_id user_id $user_id message: " . $exc->getMessage() . "\nTRACE\n" . $exc->getTraceAsString());
            return ['error' => 1, 'message' => $exc->getMessage()];
        }

        return ['error' => 0, 'message' => 'success'];
    }

    private function termsAndValidationsRequestProcessorOnboarding($orgnx_id) {
        $user_id       = $this->session->userdata('user_id');
        //$orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe
        $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($orgnx_id, $user_id);

        //using exceptions to escale errors wherever they occur
        try {

            $this->accept_terms_conditions($orgnx_onboard, 'credit_card');
            $this->accept_terms_conditions($orgnx_onboard, 'bank');

            $this->activation_request($orgnx_onboard, 'credit_card');
            $this->activation_request($orgnx_onboard, 'bank');

            $this->bank_validation_request($orgnx_onboard, 'credit_card');

            //$this->bank_validation_request($orgnx_onboard, 'bank');
            //when sending the microdeposit for validation the bank on merchant account | bank | it says it is already sent, it must be the
            //microdeposit made to merchan account | credit card
            /////////////////////////////////////////////////
        } catch (Exception $exc) {
            log_message("error", "PAYSAFE_ONBOARD_EXCEPTION: onboard_psf ID $orgnx_onboard->id "
                    . "church_id $orgnx_id user_id $user_id message: " . $exc->getMessage() . "\nTRACE\n" . $exc->getTraceAsString());
            return ['error' => 1, 'message' => $exc->getMessage()];
        }

        return ['error' => 0, 'message' => 'success'];
    }

    private function doProcessorOnboarding($orgnx_id, $bank_account, $bank_type) {
        $user_id       = $this->session->userdata('user_id');
        $orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe
        $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($orgnx_id, $user_id);

        //using exceptions to escale errors wherever they occur
        try {

            $this->create_merchant($orgnx);

            $this->create_merchant_account($orgnx_id, $orgnx_onboard, 'credit_card', null); //bank type not needed when creating the credit card merchant account
            $this->create_backoffice_user($orgnx_onboard);
            $this->create_business_owner($orgnx_onboard, 'credit_card', null);
            if($orgnx_onboard->region == 'US') {
                if (!$orgnx_onboard->owner_is_control_prong) {
                    $this->create_business_owner($orgnx_onboard, 'credit_card', null,'2');
                }
            }
            $this->create_bank($bank_type, $orgnx_onboard, $bank_account, 'credit_card', null); //bank type not needed when creating the credit card bank account

            $this->create_merchant_account($orgnx_id, $orgnx_onboard, 'bank', $bank_type); //backoffice user is attached from the first account id
            $this->create_business_owner($orgnx_onboard, 'bank', $bank_type);
            if($orgnx_onboard->region == 'US') {
                if (!$orgnx_onboard->owner_is_control_prong) {
                    $this->create_business_owner($orgnx_onboard, 'bank', $bank_type,'2');
                }
            }
            $this->create_bank($bank_type, $orgnx_onboard, $bank_account, 'bank', $bank_type);

            $this->get_terms_conditions($orgnx_onboard, 'credit_card', null);
            $this->get_terms_conditions($orgnx_onboard, 'bank', $bank_type);

            /////////////////////////////////////////////////
        } catch (Exception $exc) {
            log_message("error", "PAYSAFE_ONBOARD_EXCEPTION: onboard_psf ID $orgnx_onboard->id "
                    . "church_id $orgnx_id user_id $user_id message: " . $exc->getMessage() . "\nTRACE\n" . $exc->getTraceAsString());
            return ['error' => 1, 'message' => $exc->getMessage()];
        }

        return ['error' => 0, 'message' => 'success'];
    }
    
    private function createCryptoWallet($orgnx_id) { //
        $user_id       = $this->session->userdata('user_id');
        $orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe
        $orgnx_crypto = $this->orgnx_onboard_crypto_model->getByOrg($orgnx_id, $user_id, 'id, account_id, active, api_requests, api_responses');
        
        $this->operation = 'create_crypto_wallet';

        $data            = [];
        $data['payload']   = ['wallet_data' => ['ref_id' => $orgnx->ch_id]];
        $data['church_id'] = $orgnx->ch_id;
        
        //account creation will only executed if there is not account_id that means that there is not a crypto wallet
        if ($orgnx_crypto->active && !$orgnx_crypto->account_id) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_crypto', 'id', $orgnx_crypto, 'api_requests', $data_logs);

            //alexey |  wallet creation
            $response = $this->PaymentCryptoInstance->create_wallet($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_crypto', 'id', $orgnx_crypto, 'api_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $response['message'] = 'success';
                //alexey | wallet creation response fields saving
                $this->db->where('id', $orgnx_crypto->id)
                        ->update("church_onboard_crypto", [
                            'account_id'    => date('ymdhms'), //$response["response"]->id,
                            'merchant_name' => date('ymdhms'), //$response["response"]->name
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        } 
    }

    private function create_merchant($orgnx) {

        $this->operation = 'create_merchant';

        $data            = [];
        $data['payload'] = [];

        $data['church_id']       = $orgnx->ch_id;
        $data['payload']['name'] = $orgnx->church_name;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $this->checkChurch($church_paysafe, 'check_merchant_not_linked');
        if (!$church_paysafe->merchant_id) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->create_merchant($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $response['message'] = 'success';
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            "merchant_id"   => $response["response"]->id,
                            "merchant_name" => $response["response"]->name
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function create_merchant_account($orgnx_id, $orgnx_onboard, $account_type, $bank_type) {

        //this function does not receives the orngx but the orgnx_id as we need to refresh the orgnx. 
        //create merchant account is called more than 1 so paysafe_template is updated each time, 
        //check above when saving the creating merchan account response

        $orgnx = $this->organization_model->get($orgnx_id); //=== church_id comes safe

        $this->operation = 'create_merchant_account | ' . $account_type;

        $data['church_id'] = $orgnx_onboard->church_id;
        $church_paysafe    = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $payment_method = $account_type == 'bank' ? $bank_type : 'credit_card';
        $tier_index     = PAYSAFE_PRODUCT_CODE_DEFAULT_INDEX;

        $productCode = $this->PaymentInstance->getProductCodeSettings($orgnx_onboard->currency, $payment_method, $tier_index);

        if ($account_type == 'credit_card') {
            $account_id_save_column = 'account_id';
            $account_id_to_evaluate = $church_paysafe->account_id;
        } elseif ($account_type == 'bank') {
            if ($bank_type == 'ach') {
                $account_id_save_column = 'account_id2';
                $account_id_to_evaluate = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $account_id_save_column = 'account_id3';
                $account_id_to_evaluate = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $account_id_save_column = 'account_id4';
                $account_id_to_evaluate = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $account_id_save_column = 'account_id5';
                $account_id_to_evaluate = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $account_id_save_column = 'account_id6';
                $account_id_to_evaluate = $church_paysafe->account_id6;
            }
        }

        $data['payload'] = [];

        $data['payload']['processingCurrency']                      = strtoupper($orgnx_onboard->currency);
        $data['payload']['currency']                                = strtoupper($orgnx_onboard->currency);
        $data['payload']['region']                                  = $orgnx_onboard->region;
        $data['payload']['legalEntity']                             = $orgnx->legal_name;
        $data['payload']['productCode']                             = $productCode;
        $data['payload']['category']                                = $orgnx_onboard->business_category;
        $data['payload']['phone']                                   = $orgnx->phone_no;
        $data['payload']['url']                                     = $orgnx->website;
        $data['payload']['yearlyVolumeRange']                       = $orgnx_onboard->yearly_volume_range; //LOW – 0–50k //MEDIUM – 50k–100k //HIGH – 100k–250k //VERY_HIGH – 250k+
        $data['payload']['averageTransactionAmount']                = $orgnx_onboard->average_transaction_amount; //cannot be zero
        $data['payload']['merchantDescriptor']['dynamicDescriptor'] = $orgnx_onboard->dynamic_descriptor;
        $data['payload']['merchantDescriptor']['phone']             = $orgnx_onboard->phone_descriptor;

        if ($account_type == 'bank') {
            $data['payload']['users'] = [$church_paysafe->backoffice_username];
        }

        $data['payload']['address'] = [
            'street'  => $orgnx->street_address,
            'street2' => $orgnx->street_address_suite,
            'city'    => $orgnx->city,
            'state'   => $orgnx->state ? $orgnx->state : 'AL',
            'country' => $orgnx->country,
            'zip'     => $orgnx->postal
        ];


        if ($orgnx_onboard->region == 'US') {
            $data['payload']['usAccountDetails'] = [
                'type'             => $orgnx_onboard->business_type,
                'federalTaxNumber' => $orgnx_onboard->federal_tax_number
            ];
        } elseif ($orgnx_onboard->region == 'CA') {
            $data['payload']['caAccountDetails'] = [
                'type'             => $orgnx_onboard->business_type,
                'federalTaxNumber' => $orgnx_onboard->federal_tax_number
            ];
        } elseif ($orgnx_onboard->region == 'EU') {
            $data['payload']['euAccountDetails'] = [
                'type'               => $orgnx_onboard->business_type,
                'registrationNumber' => $orgnx_onboard->registration_number
            ];
        }

        $data['merchant_id']     = $church_paysafe->merchant_id;
        $data['payload']['name'] = $church_paysafe->merchant_name;

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response

        if (!$account_id_to_evaluate) {

            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->create_merchant_account_consolidated($data);
            
            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created account details --- */

                $paysafe_template = !$orgnx->paysafe_template ? $productCode : $orgnx->paysafe_template . ',' . $productCode;

                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $account_id_save_column => $response["response"]->id
                ]);

                $this->db->where('ch_id', $orgnx_id)
                        ->update("church_detail", [
                            'paysafe_template' => $paysafe_template
                ]);
                
                sleep(6); //paysafe says we to wait a while
                
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function create_backoffice_user($orgnx_onboard) {

        $paysafe_environment = $this->PaymentInstance->paysafe_environment;
        //$paysafe_environment = 'dev';

        $this->operation = 'create_backoffice_user';

        $data              = [];
        $data['payload']   = [];
        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if (!$church_paysafe->backoffice_username) {

            $data['account_id'] = $church_paysafe->account_id;

            $upper_letter = chr(rand(65, 90));

            $password            = $upper_letter . bin2hex(openssl_random_pseudo_bytes(16, $cstrong));
            $backoffice_hash     = $this->encryption->encrypt($password);
            $backoffice_email    = $this->session->userdata('email');
            $backoffice_username = $this->session->userdata('user_id') . uniqid();

            $data['payload'] = [
                'userName'         => $backoffice_username,
                'password'         => $password,
                'email'            => $paysafe_environment == 'prd' ? $backoffice_email : chr(rand(65, 90)) . "$backoffice_username@lunarpay.com",
                'recoveryQuestion' => [
                    'questionId' => 1,
                    'answer'     => bin2hex(openssl_random_pseudo_bytes(16, $cstrong))
                ]
            ];

            //d($data);

            $data_logs                        = $data;
            $data_logs['payload']['password'] = '*****';
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $this->checkChurch($church_paysafe, 'check_merchant_linked');
            $this->checkChurch($church_paysafe, 'check_account_linked', false);


            $response = $this->PaymentInstance->create_backoffice_user($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $response_save['userName'] = $response['response']->userName;
                $response_save['email']    = $response['response']->email;

                $data['payload']['recoveryQuestion']['question'] = $response['response']->recoveryQuestion->question;
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            //"user"                         => json_encode($response_save),
                            "backoffice_username"          => $backoffice_username,
                            "backoffice_hash"              => $backoffice_hash,
                            "backoffice_email"             => $backoffice_email,
                            "backoffice_recovery_question" => json_encode($data['payload']['recoveryQuestion'])
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    /* --- Validates if the church belongs to the user and if there is or not a merchant and merchant account linked --- */

    private function checkChurch($church_paysafe, $check_church_session = true) {

        if ($check_church_session) {
            /* --- this function is called twice some times, in the second time is not necessary to look up if the church belongs to the user --- */
            $client_churches = $this->db->select("group_concat(ch_id) church_ids")
                            ->where("client_id", $this->session->userdata("user_id"))
                            ->group_by("client_id")
                            ->get("church_detail")->row();
            $church_ids      = explode(",", $client_churches->church_ids);

            if (!in_array($church_paysafe->church_id, $church_ids)) {
                $errorMessage = 'The company does not belong to the session';
                $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', ['errorMessage' => $errorMessage]);
                throw new Exception($errorMessage);
            }
        }
    }

    // $i = owner index number
    public function create_business_owner($orgnx_onboard, $account_type, $bank_type, $i = '') {

        $this->operation = 'create_business_owner | ' . $account_type;

        $data            = [];
        $data['payload'] = [];

        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $column_to_save     = 'business_owner'. $i .'_id';
            $evaluate           = $church_paysafe->{'business_owner'. $i .'_id'};
        } elseif ($account_type == 'bank') {

            if ($bank_type == 'ach') {
                $data['account_id'] = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $data['account_id'] = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $data['account_id'] = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $data['account_id'] = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $data['account_id'] = $church_paysafe->account_id6;
            }

            $column_to_save = 'business_owner'. $i .'_id2';
            $evaluate       = $church_paysafe->{'business_owner'. $i .'_id2'};
        }

        $data['payload'] = [
            'firstName'   => $orgnx_onboard->{'owner'. $i .'_first_name'},
            'lastName'    => $orgnx_onboard->{'owner'. $i .'_last_name'},
            'jobTitle'    => $orgnx_onboard->{'owner'. $i .'_title'},
            'phone'       => $orgnx_onboard->{'owner'. $i .'_phone'},
            'isApplicant' => $orgnx_onboard->{'owner'. $i .'_is_applicant'} ? true : false,
            'isControlProng' => $orgnx_onboard->{'owner'. $i .'_is_control_prong'} ? true : false,
            'dateOfBirth' => [
                'day'   => date('d', strtotime($orgnx_onboard->{'owner'. $i .'_birth'})),
                'month' => date('n', strtotime($orgnx_onboard->{'owner'. $i .'_birth'})),
                'year'  => date('Y', strtotime($orgnx_onboard->{'owner'. $i .'_birth'}))
            ]
        ];

        if ($orgnx_onboard->region == 'US' && !in_array($orgnx_onboard->business_type, ['NPCORP', 'CHARITY', 'GOV'])) {
            $data['payload']['ssn']         = $orgnx_onboard->{'owner'. $i .'_ssn'};
        }

        //ssn        required        string    This is the SSN of the business owner.
        //Note: The ssn parameter is not required when the type parameter in the usAccountDetails object is set to NPCORP, CHARITY or GOV.
        //This object is included when you create a merchant account.

        $data['payload']['currentAddress'] = [
            'street'  => $orgnx_onboard->{'owner'. $i .'_current_address_line_1'},
            'street2' => $orgnx_onboard->{'owner'. $i .'_current_address_line_2'},
            'city'    => $orgnx_onboard->{'owner'. $i .'_current_city'},
            'state'   => $orgnx_onboard->{'owner'. $i .'_current_state'} ? $orgnx_onboard->{'owner'. $i .'_current_state'} : 'AL',
            'country' => $orgnx_onboard->{'owner'. $i .'_current_country'},
            'zip'     => $orgnx_onboard->{'owner'. $i .'_current_zip'}
        ];

        //d($data['payload']['currentAddress']);

        if ($orgnx_onboard->region != 'US') {
            $data['payload']['currentAddress']['yearsAtAddress'] = $orgnx_onboard->{'years_at_address'.$i};
            if ($orgnx_onboard->years_at_address < 3) {
                $data['payload']['previousAddress'] = [
                    'street'  => $orgnx_onboard->{'owner'. $i .'_previous_address_line_1'},
                    'street2' => $orgnx_onboard->{'owner'. $i .'_previous_address_line_2'},
                    'city'    => $orgnx_onboard->{'owner'. $i .'_previous_city'},
                    'state'   => $orgnx_onboard->{'owner'. $i .'_previous_state'} ? $orgnx_onboard->{'owner'. $i .'_previous_state'} : 'AL',
                    'country' => $orgnx_onboard->{'owner'. $i .'_previous_country'},
                    'zip'     => $orgnx_onboard->{'owner'. $i .'_previous_zip'}
                ];
            }
        }

        if ($orgnx_onboard->region == 'EU') {

            $data['payload']['nationality'] = $orgnx_onboard->{'owner'. $i .'_nationality'};
            $data['payload']['gender']      = $orgnx_onboard->{'owner'. $i .'_gender'};

            $data['payload']['europeanIdCard'] = [
                'number'         => $orgnx_onboard->{'euidcard_number'. $i},
                'countryOfIssue' => $orgnx_onboard->{'euidcard_country_of_issue'. $i},
                'expiryDate'     => [
                    'day'   => date('j', strtotime($orgnx_onboard->{'euidcard_expiry_date'. $i})),
                    'month' => date('n', strtotime($orgnx_onboard->{'euidcard_expiry_date'. $i})),
                    'year'  => date('Y', strtotime($orgnx_onboard->{'euidcard_expiry_date'. $i}))
                ],
                'idNumberLine1'  => $orgnx_onboard->{'euidcard_number_line_1'. $i},
                'idNumberLine2'  => $orgnx_onboard->{'euidcard_number_line_1'. $i},
                'idNumberLine3'  => $orgnx_onboard->{'euidcard_number_line_1'. $i},
            ];
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response

        if (!$evaluate) {

            $data_logs                   = $data;
            $data_logs['payload']['ssn'] = '*****';
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->create_merchant_business_owner_consolidated($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);
            if ($response['error'] == 0) {
                /* --- If success save created account details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save => $response["response"]->id
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function create_bank($bank_type, $orgnx_onboard, $bank_account, $account_type = 'credit_card') {

        $this->operation = 'create_' . $bank_type . '_bank | ' . $account_type;

        $data            = [];
        $data['payload'] = [];

        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $column_to_save     = 'bank_id';
            $evaluate           = $church_paysafe->bank_id;
        } elseif ($account_type == 'bank') {

            if ($bank_type == 'ach') {
                $data['account_id'] = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $data['account_id'] = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $data['account_id'] = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $data['account_id'] = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $data['account_id'] = $church_paysafe->account_id6;
            }

            $column_to_save = 'bank_id2';
            $evaluate       = $church_paysafe->bank_id2;
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {

            if ($bank_type == 'ach') {
                $data['payload'] = [
                    'accountNumber' => $bank_account['ach_account_number'],
                    'routingNumber' => $bank_account['ach_routing_number']
                ];
            } else if ($bank_type == 'sepa') {
                $data['payload'] = [
                    "beneficiaryBankCountry" => $bank_account["sepa_country"],
                    "beneficiaryAccountName" => $bank_account["sepa_beneficiary_name"],
                    "swiftNumber"            => $bank_account["sepa_swift_number"],
                    "ibanNumber"             => $bank_account["sepa_iban_number"]
                ];
            } else if ($bank_type == 'bacs') {
                $data['payload'] = [
                    "beneficiaryBankCountry" => $bank_account["bacs_country"],
                    "beneficiaryAccountName" => $bank_account["bacs_beneficiary_name"],
                    "accountNumber"          => $bank_account["bacs_account_number"],
                    "sortCode"               => $bank_account["bacs_sort_code"]
                ];
            } else if ($bank_type == 'eft') {
                $data['payload'] = [
                    "accountNumber" => $bank_account["eft_account_number"],
                    "transitNumber" => $bank_account["eft_transit_number"],
                    "institutionId" => $bank_account["eft_institution_id"]
                ];
            } else if ($bank_type == 'wire') {
                $data['payload'] = [
                    "accountNumber"           => $bank_account["wire_account_number"],
                    "swiftNumber"             => $bank_account["wire_swift_number"],
                    "beneficiaryCountry"      => $bank_account["wire_beneficiary_country"],
                    "beneficiaryAccountName"  => $bank_account["wire_beneficiary_name"],
                    "beneficiaryAddress"      => $bank_account["wire_beneficiary_address"],
                    "beneficiaryCity"         => $bank_account["wire_beneficiary_city"],
                    "beneficiaryRegion"       => $bank_account["wire_beneficiary_region"],
                    "beneficiaryPostCode"     => $bank_account["wire_beneficiary_post_code"],
                    "beneficiaryBankCountry"  => $bank_account["wire_beneficiary_bank_country"],
                    "beneficiaryBankName"     => $bank_account["wire_beneficiary_bank_name"],
                    "beneficiaryBankAddress"  => $bank_account["wire_beneficiary_bank_address"],
                    "beneficiaryBankCity"     => $bank_account["wire_beneficiary_bank_city"],
                    "beneficiaryBankRegion"   => $bank_account["wire_beneficiary_bank_region"],
                    "beneficiaryBankPostCode" => $bank_account["wire_beneficiary_bank_post_code"]
                ];
            }

            $data_logs = $data;

            //DO NOT save OR log any onboarding bank information in our database
            if (isset($data_logs['payload']['accountNumber']))
                $data_logs['payload']['accountNumber'] = '*****';
            if (isset($data_logs['payload']['routingNumber']))
                $data_logs['payload']['routingNumber'] = '*****';
            if (isset($data_logs['payload']['transitNumber']))
                $data_logs['payload']['transitNumber'] = '*****';
            if (isset($data_logs['payload']['institutionId']))
                $data_logs['payload']['institutionId'] = '*****';
            if (isset($data_logs['payload']['swiftNumber']))
                $data_logs['payload']['swiftNumber']   = '*****';
            if (isset($data_logs['payload']['ibanNumber']))
                $data_logs['payload']['ibanNumber']    = '*****';
            if (isset($data_logs['payload']['sortCode']))
                $data_logs['payload']['sortCode']      = '*****';

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $payment_create_bank_method = 'create_' . $bank_type . '_bank';
            $response                   = $this->PaymentInstance->$payment_create_bank_method($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);
            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save => $response['response']->id,
                            'bank_type'     => strtoupper($bank_type)
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    public function get_terms_conditions($orgnx_onboard, $account_type, $bank_type) {

        $this->operation = 'get_terms_conditions | ' . $account_type;

        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $column_to_save     = 'terms_conditions_1';
            $evaluate           = $church_paysafe->terms_conditions_1;
        } elseif ($account_type == 'bank') {

            if ($bank_type == 'ach') {
                $data['account_id'] = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $data['account_id'] = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $data['account_id'] = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $data['account_id'] = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $data['account_id'] = $church_paysafe->account_id6;
            }

            $column_to_save = 'terms_conditions_2';
            $evaluate       = $church_paysafe->terms_conditions_2;
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->get_terms_conditions($data); //retrieves an html string if success

            if (isset($response['error'])) {
                if ($response['error'] == 0 && isset($response['response']->error)) {
                    $response['error'] = 1;
                }

                $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

                if ($response['error'] == 0) {
                    
                } else {
                    throw new Exception($this->composeError($response));
                }
            } else {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save          => $response['response'],
                            $column_to_save . '_ver' => $response['headers']['x_terms_version'][0],
                ]);
                $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', ['t&c' => 'saved', 'version' => $response['headers']['x_terms_version'][0]]);
            }
        }
    }

    private function accept_terms_conditions($orgnx_onboard, $account_type) {

        $this->operation = 'accept_terms_conditions | ' . $account_type;

        $data              = [];
        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $bank_type = strtolower($orgnx_onboard->bank_type);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $data['payload']    = [
                'version' => $church_paysafe->terms_conditions_1_ver
            ];
            $column_to_save     = 'terms_conditions_acceptance_id';
            $column_to_save2    = 'terms_conditions_meta';
            $evaluate           = $church_paysafe->terms_conditions_acceptance_id;
        } elseif ($account_type == 'bank') {

            if ($bank_type == 'ach') {
                $data['account_id'] = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $data['account_id'] = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $data['account_id'] = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $data['account_id'] = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $data['account_id'] = $church_paysafe->account_id6;
            }

            $data['payload'] = [
                'version' => $church_paysafe->terms_conditions_2_ver
            ];
            $column_to_save  = 'terms_conditions_acceptance_id2';
            $column_to_save2 = 'terms_conditions_meta2';
            $evaluate        = $church_paysafe->terms_conditions_acceptance_id2;
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->accept_terms_conditions($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save  => $response['response']->id,
                            $column_to_save2 => json_encode($response['response'])
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function activation_request($orgnx_onboard, $account_type) {

        $this->operation = 'activation_request | ' . $account_type;

        $data              = [];
        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $bank_type = strtolower($orgnx_onboard->bank_type);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $column_to_save1    = 'activation_request_response';
            $column_to_save2    = 'account_status';
            $column_to_save3    = 'status_reason';
            $evaluate           = $church_paysafe->activation_request_response;
        } elseif ($account_type == 'bank') {

            if ($bank_type == 'ach') {
                $data['account_id'] = $church_paysafe->account_id2;
            } else if ($bank_type == 'eft') {
                $data['account_id'] = $church_paysafe->account_id3;
            } else if ($bank_type == 'sepa') {
                $data['account_id'] = $church_paysafe->account_id4;
            } else if ($bank_type == 'bacs') {
                $data['account_id'] = $church_paysafe->account_id5;
            } else if ($bank_type == 'wire') {
                $data['account_id'] = $church_paysafe->account_id6;
            }

            $column_to_save1 = 'activation_request_response2';
            $column_to_save2 = 'account_status2';
            $column_to_save3 = 'status_reason2';
            $evaluate        = $church_paysafe->activation_request_response2;
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {

            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->activation_request($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update('church_onboard_paysafe', [
                            $column_to_save1 => json_encode($response['response']),
                            $column_to_save2 => $response['response']->account->status,
                            $column_to_save3 => isset($response['response']->account->statusReason) ? $response['response']->account->statusReason : '-',
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    /*
      This is how you create a microdeposit request for an ACH (U.S.) or EFT (Canadian) bank account.Note:
      If the microdepost creation request fails (e.g., due to invalid bank account details),
      Paysafe sends a notification email to the email address that was included in the user creation request.
      You can create only one microdeposit request for each bank account.
      In addition, you can create a microdepost request only for merchant accounts with one of the following statuses:

      PROCESSING DEFERRED APPROVED ENABLED
     */

    private function bank_validation_request($orgnx_onboard, $account_type) {
        $this->operation = 'bank_validation_request | ' . $account_type;

        $data              = [];
        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['bank_id'] = $church_paysafe->bank_id;
            $column_to_save  = 'bank_microdeposit_id';
            $evaluate        = $church_paysafe->bank_microdeposit_id;
        }

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->create_microdeposit($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save => $response['response']->id,
                ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function bank_amount_confirmation($orgnx_onboard, $account_type = 'credit_card') {
        $this->operation = 'bank_amount_confirmation | ' . $account_type;

        $data              = [];
        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['bank_microdeposit_id'] = $church_paysafe->bank_microdeposit_id;
            $column_to_save               = 'bank_status';
            $evaluate                     = $church_paysafe->bank_status_blocked;
        } elseif ($account_type == 'bank') {
            $data['bank_microdeposit_id'] = $church_paysafe->bank_microdeposit_id2;
            $column_to_save               = 'bank_status2';
            $evaluate                     = $church_paysafe->bank_status2_blocked;
        }

        $data['payload'] = [
            'amount' => $orgnx_onboard->validation_amount,
        ];

        $this->checkChurch($church_paysafe, 'check_merchant_linked'); //die on false with response
        $this->checkChurch($church_paysafe, 'check_account_linked', false); //die on false with response

        if (!$evaluate) {
            $data_logs = $data;
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

            $response = $this->PaymentInstance->validate_microdeposit($data);

            if ($response['error'] == 0 && isset($response['response']->error)) {
                $response['error'] = 1;
            }

            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

            if ($response['error'] == 0) {
                /* --- If success save created merchant details --- */
                $this->db->where('id', $church_paysafe->id)
                        ->update("church_onboard_paysafe", [
                            $column_to_save           => $response['response']->status,
                            $column_to_save . '_meta' => json_encode($response['response'])
                                //SENT ERROR FAILED VALIDATED INVALID TXN_ERROR TXN_FAILED
                ]);
            } else {

                //error 8513: your bank account cannot be validated. Please contact support. usuarlly when attempts > 3
                if (isset($response['response']->error->code) && $response['response']->error->code == 8513) {
                    $this->db->where('id', $church_paysafe->id)
                            ->update("church_onboard_paysafe", [
                                $column_to_save              => 'FAILED',
                                $column_to_save . '_blocked' => json_encode($response)
                    ]);
                }
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function composeError($response) {
        $errorMessage = '';
        if (isset($response['response']->error->message)) {
            $errorMessage = '' . str_replace('  ', '', $response['response']->error->message) . '';
            if (isset($response['response']->error->fieldErrors)) {
                foreach ($response['response']->error->fieldErrors as $errorObj) {
                    $errorMessage .= '<p>' . $errorObj->field . ': ' . $errorObj->error . ' </p>';
                }
            }

            if (isset($response['response']->error->details)) {
                foreach ($response['response']->error->details as $detail) {
                    $errorMessage .= '<p>' . $detail . ' </p>';
                }
            }
        } elseif (isset($response['response'])) {
            $errorMessage = $response['response'];
        } else {
            $errorMessage = $response;
        }
        return $errorMessage;
    }

    public function delete_ach_bank() {

        $data = [];

        $data['church_id'] = 5;

        $church_paysafe  = $this->createPaySafeRecordIfNotExists($data['church_id']);
        $data['bank_id'] = $church_paysafe->bank_id;

        $data_logs = $data;
        $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_requests', $data_logs);

        $this->checkChurch($church_paysafe, ''); //die on false with response

        if (!$church_paysafe->bank_id) {
            $response['error']                    = 1;
            $response['response']                 = new stdClass;
            $response['response']->error->message = 'ACH Bank ID not found';
            $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);
            $this->outJson($response);
            die;
        }

        $response = $this->paysafelib->delete_ach_bank($data);

        if ($response['error'] == 0 && isset($response['response']->error)) {
            $response['error'] = 1;
        }

        $this->saveLogs('church_onboard_paysafe', 'id', $church_paysafe, 'merchant_responses', $response);

        if ($response['error'] == 0) {
            /* --- If success save created merchant details --- */
            $this->db->where('id', $church_paysafe->id)
                    ->update("church_onboard_paysafe", [
                        "bank_id" => null
            ]);
        }
        $this->outJson($response);
    }

    public function get_recovery_questions() {
        //$this->load->library('PaySafeCentral');
        //$response = $this->paysafelib->get_recovery_questions();
        $response = '[{"questionId":"1","question":"What is the name of your oldest sibling?"},{"questionId":"2","question":"What is the name of your youngest sibling?"},{"questionId":"3","question":"What is the make and model of the first car you owned?"},{"questionId":"4","question":"What are the last four digits of your bank account number?"},{"questionId":"5","question":"In what city is your bank branch located?"},{"questionId":"6","question":"What is the name of your first pet?"},{"questionId":"7","question":"Who is your mobile provider, and what is your mobile number?"},{"questionId":"8","question":"What is the sum of your year of birth? (e.g., if YOB=1234, sum=1+2+3+4=10)"},{"questionId":"9","question":"In what city and year was your business established? (e.g., Montreal 1999)"},{"questionId":"10","question":"What high school did you graduate from, and in what year? (e.g., Central High 1999)"}]';
        $this->outJson($response, false);
    }

    public function get_bank_details() {
        $response = $this->paysafelib->get_bank_details();
        //$response = '[{"questionId":"1","question":"What is the name of your oldest sibling?"},{"questionId":"2","question":"What is the name of your youngest sibling?"},{"questionId":"3","question":"What is the make and model of the first car you owned?"},{"questionId":"4","question":"What are the last four digits of your bank account number?"},{"questionId":"5","question":"In what city is your bank branch located?"},{"questionId":"6","question":"What is the name of your first pet?"},{"questionId":"7","question":"Who is your mobile provider, and what is your mobile number?"},{"questionId":"8","question":"What is the sum of your year of birth? (e.g., if YOB=1234, sum=1+2+3+4=10)"},{"questionId":"9","question":"In what city and year was your business established? (e.g., Montreal 1999)"},{"questionId":"10","question":"What high school did you graduate from, and in what year? (e.g., Central High 1999)"}]';
        $this->outJson($response);
    }

    public function get_account($account_number = false) {

        $data['church_id'] = 115;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $data['account_id'] = $church_paysafe->account_id;
        $data['account_id'] = $account_number; //1001921620;

        $response = $this->PaymentInstance->get_account($data);

        d($response);
    }

    private function saveLogs($table, $id_field, $object, $field, $data) {
        try {
            if (!array_key_exists($id_field, (array) $object)) {
                throw new Exception('Object var must include the id and must be the same sent in the method');
            }
            if (!array_key_exists($field, (array) $object)) {
                throw new Exception('Object var must include the response_field and must be the same sent in the method');
            }
        } catch (Exception $exc) {
            throw $exc;
        }


        $data['_date']      = date('Y-m-d H:i:s');
        $data['_operation'] = $this->operation;

        $save_resp = [];
        if ($object->{$field}) {
            $save_resp = json_decode($object->{$field});
        }
        $save_resp[] = $data;

        $this->db->where($id_field, $object->{$id_field})
                ->update($table, [
                    $field => json_encode($save_resp)
        ]);
    }

    /* --- get/creates a basic paysafe record if it does not exists --- */

    private function createPaySafeRecordIfNotExists($church_id) {

        $this->load->model('orgnx_onboard_psf_model');
        $this->orgnx_onboard_psf_model->load_secured_fields = true;
        $church_paysafe                                     = $this->orgnx_onboard_psf_model->getByOrg($church_id, $this->session->userdata('user_id'));

        if (!$church_paysafe) { //Keep one paysafe records per church
            $this->orgnx_onboard_psf_model->register([
                "church_id" => $church_id,
            ]);
            $church_paysafe = $this->orgnx_onboard_psf_model->getByOrg($church_id, $this->session->userdata('user_id'));
        }
        return $church_paysafe;
    }
 
    private function outJson($data, $doJson = true) {

        /* --- front end error format ---
         *
         * if error = 0 means all is okay form has been received succesfully
         * if error = 1 you will get a response with this error format
         * {
         * "error": 1,
         * "response": {
         *     "error": {
         *         "code": "5068",
         *         "message": "Either you submitted a request that is missing a mandatory field or the value of a field does not match the format expected.",
         *         "fieldErrors": [{
         *                 "field": "userName",
         *                 "error": "The user name provided already exists."
         *             }, {
         *                 "field": "email",
         *                 "error": "The email provided does not have the correct format."
         *             }],
         *         "links": [{
         *                 "rel": "errorinfo",
         *                 "href": "https:\/\/developer.paysafe.com\/en\/rest-api\/platforms\/account-management\/test-and-go-live\/account-management-errors\/#ErrorCode5068"
         *             }]
         *     }
         * }
         */

        header('Content-Type: application/json');
        echo $doJson ? json_encode($data) : $data;
    }

    private function stepChange($step) {
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
