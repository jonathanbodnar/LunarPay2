<?php

//for now we need to keep synced Getting_started.php with Paysafe.php, if you make a change here you have to do it there too

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Paysafe extends My_Controller {

    function __construct() {
        parent::__construct();

        PaymentsProvider::init(PROVIDER_PAYMENT_PAYSAFE);
        $this->PaymentInstance = PaymentsProvider::getInstance();

        $this->load->model('organization_model');
        $this->load->model('orgnx_onboard_psf_model');

        display_errors();

        die;
    }

    public function get_organization_all() {

        $id           = $this->input->post('id');
        $organization = $this->organization_model->get($id);
        $this->load->model('orgnx_onboard_psf_model');

        $user_id       = $this->session->userdata('user_id');
        $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($id, $user_id);

        $onboarding_status = $this->getOnboardingStatus(null, $orgnx_onboard);

        output_json([
            'organization'      => $organization,
            'onboard'           => $orgnx_onboard,
            'onboarding_status' => $onboarding_status
        ]);
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

            $step      = $this->input->post('step');
            $user_id   = $this->session->userdata('user_id');
            $is_closed = (int) $this->input->post('is_closed');

            if ($step == 1) {
                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[dba_name]', langx('company_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[legal_name]', langx('legal_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[region]', langx('region'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[business_category]', langx('business_category'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                    //$this->form_validation->set_rules('step' . $step . '[email]', langx('email'), 'trim|required|valid_email');
                    $this->form_validation->set_rules('step' . $step . '[yearlyVolumeRange]', langx('yearly_volume_range'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[averageTransactionAmount]', langx('average_transaction_amount'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[processing_currency]', langx('processing_currency'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[dynamicDescriptor]', langx('dynamic_descriptor'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[phoneDescriptor]', langx('phone_descriptor'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[businessType]', langx('business_type'), 'trim|required');

                    if ($_POST['step' . $step]['region'] === 'EU') {
                        $this->form_validation->set_rules('step' . $step . '[federalTaxNumber]', langx('tax_identification_number'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[registrationNumber]', langx('registration_number'), 'trim|required');
                    } else {
                        $this->form_validation->set_rules('step' . $step . '[federalTaxNumber]', langx('federal_tax_number'), 'trim|required');
                    }

                    $this->form_validation->set_rules('step' . $step . '[website]', langx('website'), 'callback_website_check');
                }
                $form = $_POST['step' . $step];

                if ($this->form_validation->run() === TRUE || $is_closed) {

                    $data = [
                        'ch_id'       => $organization_id,
                        'church_name' => preg_replace('/\s\s+/', ' ', $form['dba_name']),
                        'legal_name'  => $form['legal_name'],
                        'phone_no'    => $form['phone_number'],
                        //'email'       => $form['email'],
                        'website'     => $form['website'],
                        'tax_id'      => $form['federalTaxNumber'],
                    ];

                    $psf_data = [
                        'merchant_name'              => $data['church_name'],
                        'region'                     => $form['region'],
                        'business_category'          => $form['business_category'],
                        'yearly_volume_range'        => $form['yearlyVolumeRange'],
                        'average_transaction_amount' => $form['averageTransactionAmount'],
                        'currency'                   => $form['processing_currency'],
                        'dynamic_descriptor'         => $form['dynamicDescriptor'],
                        'phone_descriptor'           => $form['phoneDescriptor'],
                        'business_type'              => $form['businessType'],
                        'federal_tax_number'         => $form['federalTaxNumber'],
                        'registration_number'        => $_POST['step' . $step]['region'] === 'EU' ? $form['registrationNumber'] : null
                    ];

                    if (!$organization_id) {//===== create mode
                        $organization_id = $this->organization_model->register($data);

                        if ($organization_id) {
                            
                            //if church_bame is empty it does not create the slug
                            $this->organization_model->setSlug($organization_id);
                            
                            $psf_data['church_id'] = $organization_id;
                            $this->orgnx_onboard_psf_model->register($psf_data);
                            
                            //fund and chat_setting_model data should be created on organization_model, when creating an organization this required
                            //so we can centralize and create better code, search in code => #organization_model->register
                            
                            $this->load->model('fund_model');
                            $data_fund             = [
                                'name'       => 'General',
                                'church_id'  => $organization_id,
                                'created_at' => date('Y-m-d H:i:s')
                            ];

                            $this->fund_model->register($data_fund);

                            $this->load->model('chat_setting_model');

                            $data_chat_setting = [
                                'id'                => 0,
                                'client_id'         => $this->session->userdata('user_id'),
                                'church_id'         => $organization_id,
                                'suggested_amounts' => '["10","30","50","100"]',
                                'theme_color'       => '#000000',
                                'button_text_color' => '#ffffff',
                                'domain'            => $form['website']
                            ];
                            $this->chat_setting_model->save($data_chat_setting);
                            /////////////////////////////

                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('register_success'), langx('company'))]);
                            return;
                        }
                    } else {//===== update mode
                        $result           = $this->organization_model->update($data);
                        $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id']);

                        $psf_data['id']        = $ornx_onboard_psf->id;
                        $psf_data['church_id'] = $organization_id;

                        $this->orgnx_onboard_psf_model->update($psf_data, $user_id);

                        if ($result === TRUE) {
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company'))]);
                            return;
                        } else {
                            output_json($result);
                            return;
                        }
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 2) {

                $form = $_POST['step' . $step];

                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[country]', langx('country'), 'trim|required');
                    if ($form['country'] === 'US' || $form['country'] === 'CA') {
                        $this->form_validation->set_rules('step' . $step . '[state_province]', langx('state'), 'trim|required');
                    }
                    $this->form_validation->set_rules('step' . $step . '[city]', langx('city'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[postal_code]', langx('postal_code'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[address_line_1]', langx('address_line_1'), 'trim|required');

                    /*
                      $this->form_validation->set_rules('step' . $step . '[trading_country]', langx('trading_country'), 'trim|required');
                      $this->form_validation->set_rules('step' . $step . '[trading_state_province]', langx('trading_state'), 'trim|required');
                      $this->form_validation->set_rules('step' . $step . '[trading_city]', langx('trading_city'), 'trim|required');
                      $this->form_validation->set_rules('step' . $step . '[trading_postal_code]', langx('trading_postal_code'), 'trim|required');
                      $this->form_validation->set_rules('step' . $step . '[trading_address_line_1]', langx('trading_address_line_1'), 'trim|required');
                     */
                }

                if ($this->form_validation->run() === TRUE || $is_closed) {



                    if ($organization_id) {//===== update mode
                        $data = [
                            'ch_id'                => $organization_id,
                            'city'                 => $form['city'],
                            'street_address'       => $form['address_line_1'],
                            'street_address_suite' => $form['address_line_2'],
                            'postal'               => $form['postal_code'],
                            'country'              => $form['country']
                        ];
                        if ($form['country'] === 'US' || $form['country'] === 'CA') {
                            $data['state'] = $form['state_province'];
                        }

                        $result = $this->organization_model->update($data);

                        /*
                          $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id']);
                          $psf_data         = [
                          'id'                     => $ornx_onboard_psf->id,
                          'church_id'              => $organization_id,
                          'trading_state'          => $form['trading_state_province'],
                          'trading_city'           => $form['trading_city'],
                          'trading_address_line_1' => $form['trading_address_line_1'],
                          'trading_address_line_2' => $form['trading_address_line_2'],
                          'trading_zip'            => $form['trading_postal_code'],
                          'trading_country'        => $form['trading_country']
                          ];

                          $this->orgnx_onboard_psf_model->update($psf_data, $user_id);
                         */
                        if ($result === TRUE) {
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company'))]);
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

                //using imask in the front end, it sends "__/__/____" when empty so we use isValidDate own function for validating dates
                $_POST['step' . $step]['date_of_birth'] = isValidDate($_POST['step' . $step]['date_of_birth']) ? $_POST['step' . $step]['date_of_birth'] : null;
                $_POST['step' . $step]['eu_xpry_date']  = isValidDate($_POST['step' . $step]['eu_xpry_date']) ? $_POST['step' . $step]['eu_xpry_date'] : null;
                
                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[first_name]', langx('first_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[last_name]', langx('last_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[title]', langx('title'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[business_owner_is_european]', langx('business_owner_is_european'), 'trim|required');
                    
                    $this->form_validation->set_rules('step' . $step . '[date_of_birth]', langx('date_of_birth'), 'trim|required');

                    if ($_POST['step1']['region'] == 'US' && !in_array($_POST['step1']['businessType'], ['NPCORP', 'CHARITY', 'GOV'])) {
                        $this->form_validation->set_rules('step' . $step . '[ssn]', langx('ssn'), 'trim|required');
                    }

                    $this->form_validation->set_rules('step' . $step . '[owner_current_country]', langx('country'), 'trim|required');

                    if (in_array($_POST['step3']['owner_current_country'], ['US', 'CA'])) {
                        $this->form_validation->set_rules('step' . $step . '[owner_current_state_province]', langx('state'), 'trim|required');
                    }

                    $this->form_validation->set_rules('step' . $step . '[owner_current_city]', langx('city'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_current_postal_code]', langx('postal_code'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[owner_current_address_line_1]', langx('address_line'), 'trim|required');

                    if ($_POST['step1']['region'] != 'US') {
                        $this->form_validation->set_rules('step' . $step . '[years_at_address]', langx('years_at_address'), 'trim|required');
                    }

                    if ($_POST['step1']['region'] != 'US' && $_POST['step3']['years_at_address'] < 3 && $_POST['step3']['years_at_address'] != "") {
                        $this->form_validation->set_rules('step' . $step . '[years_at_address]', langx('years_at_address'), 'trim|required');

                        $this->form_validation->set_rules('step' . $step . '[owner_previous_country]', langx('owner_previous_country'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner_previous_state_province]', langx('owner_previous_state'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner_previous_city]', langx('owner_previous_city'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner_previous_postal_code]', langx('owner_previous_postal_code'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner_previous_address_line_1]', langx('owner_previous_address_line'), 'trim|required');
                    }

                    if ($_POST['step3']['business_owner_is_european'] == 'Yes') {
                        $this->form_validation->set_rules('step' . $step . '[nationality]', langx('business_owner_nationality'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[owner_gender]', langx('owner_gender'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[euidcard_number]', langx('identity_card_number'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[euidcard_country_issue]', langx('identity_card_country_of_issue'), 'trim|required');
                        
                        $this->form_validation->set_rules('step' . $step . '[eu_xpry_date]', langx('identity_card_expirty_date'), 'trim|required');
                        
                        $this->form_validation->set_rules('step' . $step . '[id_number_line_1]', langx('identity_card_id_number_line_1'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[id_number_line_2]', langx('identity_card_id_number_line_2'), 'trim|required');
                        $this->form_validation->set_rules('step' . $step . '[id_number_line_3]', langx('identity_card_id_number_line_3'), 'trim|required');
                    }

                    if (time() < strtotime('+18 years', strtotime($_POST['step3']['date_of_birth']))) {
                        output_json(['status' => false, 'message' => '<p>Date of Birth must be > 18 Years</p>']);
                        return;
                    }
                }

                if ($this->form_validation->run() === TRUE || $is_closed) {

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
                            'owner_birth'                   => isValidDate($form['date_of_birth']) ? date('Y-m-d', strtotime($form['date_of_birth'])) : null,
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
                            'euidcard_expiry_date'          => isValidDate($form['eu_xpry_date']) ? date('Y-m-d', strtotime($form['eu_xpry_date'])) : null,
                            'euidcard_number_line_1'        => $form['id_number_line_1'],
                            'euidcard_number_line_2'        => $form['id_number_line_2'],
                            'euidcard_number_line_3'        => $form['id_number_line_3']
                        ];

                        $result = $this->orgnx_onboard_psf_model->update($psf_data, $user_id);

                        $onboarding_status = $this->getOnboardingStatus($organization_id);


                        if ($result === TRUE) {
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
            } elseif ($step == 4) {

                $ornx_onboard_psf  = $this->orgnx_onboard_psf_model->getByOrg($organization_id, $user_id, ['id', 'backoffice_username', 'bank_type']);
                $onboarding_status = $this->getOnboardingStatus($organization_id);
                //account already created skip validation               
                if (!$onboarding_status['bank_account_created_1'] || !$onboarding_status['bank_account_created_1']) {
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
                        if ($is_closed) {
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company'))]);
                            return;
                        }

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
                        output_json(['status' => true, 'ch_id' => $organization_id, 'message' => $resp['message'], 'onboard_id' => $ornx_onboard_psf->id, 'onboarding_status' => $onboarding_status]);
                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 5) {
                if ($organization_id) { //===== update mode
                    $resp = $this->termsAndValidationsRequestProcessorOnboarding($organization_id);

                    $onboarding_status = $this->getOnboardingStatus($organization_id);
                    if ($resp['error']) {
                        output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                        return;
                    }
                    output_json(['status' => true, 'ch_id' => $organization_id, 'message' => $resp['message'], 'onboarding_status' => $onboarding_status]);
                } else {
                    output_json(['status' => false, 'message' => 'Invalid request']);
                }
            } elseif ($step == 6) {
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
                            output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                            return;
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

    private function getOnboardingStatus($orgnx_id = null, $orgnx_onboard = null) {
        $user_id = $this->session->userdata('user_id');

        if ($orgnx_id) {
            $orgnx_onboard = $this->orgnx_onboard_psf_model->getByOrg($orgnx_id, $user_id); //church_id comes safe
        }

        if (!$orgnx_onboard) {
            return [
                'microddeposit_created'       => false,
                'microdeposit_validation'     => null,
                'bank_status_blocked'         => false,
                'account_status_credit_card'  => null,
                'account_status_direct_debit' => null,
                'bank_account_created_1'      => false,
                'bank_account_created_2'      => false,
                'terms_conditions_acceptance' => false,
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
            $this->create_bank($bank_type, $orgnx_onboard, $bank_account, 'credit_card', null); //bank type not needed when creating the credit card bank account

            $this->create_merchant_account($orgnx_id, $orgnx_onboard, 'bank', $bank_type); //backoffice user is attached from the first account id
            $this->create_business_owner($orgnx_onboard, 'bank', $bank_type);
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
        
        $orgnx           = $this->organization_model->get($orgnx_id); //=== church_id comes safe

        $this->operation = 'create_merchant_account | ' . $account_type;

        $data['church_id'] = $orgnx_onboard->church_id;
        $church_paysafe    = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $payment_method = $account_type == 'bank' ? $bank_type : 'credit_card';
        $tier_index = PAYSAFE_PRODUCT_CODE_DEFAULT_INDEX;
        
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
            sleep(6);

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
                             'paysafe_template'      => $paysafe_template
                 ]);
            } else {
                throw new Exception($this->composeError($response));
            }
        }
    }

    private function create_backoffice_user($orgnx_onboard) {

        $paysafe_environment = $this->PaymentInstance->paysafe_environment;
        //$paysafe_environment = 'dev'

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
                'email'            => $paysafe_environment == 'prd' ? $backoffice_email : chr(rand(65, 90)) . "$backoffice_username@chatgive.com",
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

    public function create_business_owner($orgnx_onboard, $account_type, $bank_type) {

        $this->operation = 'create_business_owner | ' . $account_type;

        $data            = [];
        $data['payload'] = [];

        $data['church_id'] = $orgnx_onboard->church_id;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        if ($account_type == 'credit_card') {
            $data['account_id'] = $church_paysafe->account_id;
            $column_to_save     = 'business_owner_id';
            $evaluate           = $church_paysafe->business_owner_id;
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

            $column_to_save = 'business_owner_id2';
            $evaluate       = $church_paysafe->business_owner_id2;
        }

        $data['payload'] = [
            'firstName'   => $orgnx_onboard->owner_first_name,
            'lastName'    => $orgnx_onboard->owner_last_name,
            'jobTitle'    => $orgnx_onboard->owner_title,
            'phone'       => $orgnx_onboard->owner_phone,
            'isApplicant' => true,
            'dateOfBirth' => [
                'day'   => date('d', strtotime($orgnx_onboard->owner_birth)),
                'month' => date('n', strtotime($orgnx_onboard->owner_birth)),
                'year'  => date('Y', strtotime($orgnx_onboard->owner_birth))
            ]
        ];

        if ($orgnx_onboard->region == 'US' && !in_array($orgnx_onboard->business_type, ['NPCORP', 'CHARITY', 'GOV'])) {
            $data['payload']['ssn'] = $orgnx_onboard->owner_ssn;
        }

        //ssn        required        string    This is the SSN of the business owner.
        //Note: The ssn parameter is not required when the type parameter in the usAccountDetails object is set to NPCORP, CHARITY or GOV. 
        //This object is included when you create a merchant account.

        $data['payload']['currentAddress'] = [
            'street'  => $orgnx_onboard->owner_current_address_line_1,
            'street2' => $orgnx_onboard->owner_current_address_line_2,
            'city'    => $orgnx_onboard->owner_current_city,
            'state'   => $orgnx_onboard->owner_current_state ? $orgnx_onboard->owner_current_state : 'AL',
            'country' => $orgnx_onboard->owner_current_country,
            'zip'     => $orgnx_onboard->owner_current_zip
        ];

        //d($data['payload']['currentAddress']);

        if ($orgnx_onboard->region != 'US') {
            $data['payload']['currentAddress']['yearsAtAddress'] = $orgnx_onboard->years_at_address;
            if ($orgnx_onboard->years_at_address < 3) {
                $data['payload']['previousAddress'] = [
                    'street'  => $orgnx_onboard->owner_previous_address_line_1,
                    'street2' => $orgnx_onboard->owner_previous_address_line_2,
                    'city'    => $orgnx_onboard->owner_previous_city,
                    'state'   => $orgnx_onboard->owner_previous_state ? $orgnx_onboard->owner_previous_state : 'AL',
                    'country' => $orgnx_onboard->owner_previous_country,
                    'zip'     => $orgnx_onboard->owner_previous_zip
                ];
            }
        }

        if ($orgnx_onboard->region == 'EU') {

            $data['payload']['nationality'] = $orgnx_onboard->owner_nationality;
            $data['payload']['gender']      = $orgnx_onboard->owner_gender;

            $data['payload']['europeanIdCard'] = [
                'number'         => $orgnx_onboard->euidcard_number,
                'countryOfIssue' => $orgnx_onboard->euidcard_country_of_issue,
                'expiryDate'     => [
                    'day'   => date('j', strtotime($orgnx_onboard->euidcard_expiry_date)),
                    'month' => date('n', strtotime($orgnx_onboard->euidcard_expiry_date)),
                    'year'  => date('Y', strtotime($orgnx_onboard->euidcard_expiry_date))
                ],
                'idNumberLine1'  => $orgnx_onboard->euidcard_number_line_1,
                'idNumberLine2'  => $orgnx_onboard->euidcard_number_line_1,
                'idNumberLine3'  => $orgnx_onboard->euidcard_number_line_1,
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

    public function terms_conditions($onboard_id = false, $acc_index = false) {
        $acc_index = 'we_can_remove_this_var_from_the_view_and_here'; //check getting_started and organizationz/modal view for removal
        if ($onboard_id) {
            $user_id          = $this->session->userdata('user_id');
            $ornx_onboard_psf = $this->orgnx_onboard_psf_model->getById($onboard_id, $user_id, ['terms_conditions_1', 'terms_conditions_2']);

            $this->load->use_theme();
            $view['content'] = $this->load->view('organization/terms_conditions_psf', ['credit_card_tc' => $ornx_onboard_psf->terms_conditions_1, 'direct_debit_tc' => $ornx_onboard_psf->terms_conditions_2], true);
            $this->load->view('main_clean', $view);
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
        die;
        $data['church_id'] = 5;

        $church_paysafe = $this->createPaySafeRecordIfNotExists($data['church_id']);

        $data['account_id'] = $church_paysafe->account_id;
        $data['account_id'] = $account_number; //1001921620;

        $response = $this->PaymentInstance->get_account($data);

        d($response);
    }
    
    public function get_microdeposit($microdeposit_id = false) {
        
        die;
        if(!$microdeposit_id) {
            die("microdeposit required");
        }
        
        $data['microdeposit_id'] = $microdeposit_id;
        
        $response = $this->PaymentInstance->get_microdeposit($data);
        
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

    public function send_backoffice_credentials() {
        $user_id         = $this->session->userdata('user_id');
        $backoffice_user = $this->orgnx_onboard_psf_model->getBackofficeUser($user_id);

        if (!isset($backoffice_user->backoffice_email) || !$backoffice_user->backoffice_email) {
            output_json([
                'status'  => false,
                'message' => 'An error occurred, email not found'
            ]);
            return;
        }

        $from    = $this->config->item('admin_email', 'ion_auth');
        $to      = $backoffice_user->backoffice_email;
        $subject = PAYSAFE_NETBANX_EMAIL_SUBJECT;

        $this->load->library('encryption');
        $encryptPhrase = $this->config->item('pty_epicpay_encrypt_phrase');
        $this->encryption->initialize(['cipher' => 'aes-256', 'mode' => 'ctr', 'key' => $encryptPhrase]);

        $this->load->use_theme();
        $message = $this->load->view('email/backoffice_credentials_psf', [
            'username'       => $backoffice_user->backoffice_username,
            'password'       => $this->encryption->decrypt($backoffice_user->backoffice_hash),
            'backoffice_url' => PAYSAFE_NETBANX_URL
                ], TRUE);

        require_once 'application/libraries/email/EmailProvider.php';        
        $status = EmailProvider::getInstance()->sendEmail($from, COMPANY_NAME, $to, $subject, $message);

        output_json([
            'status' => $status ? true : false
        ]);
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

    /*     * ************************************************* */
    /*     * ************************************************* */
    /*     * ************************************************* */
}
