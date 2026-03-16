<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Organizations extends My_Controller
{

    public $data = [];

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

        $this->load->model('organization_model');
    }

    public function index()
    {

        //on PSF Checking if exist church_onboard_paysafe.account_id
        $this->load->model('ion_auth_model');
        $this->load->model('user_model'); //for loading getting starter steps
        if ($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
            $this->load->model('orgnx_onboard_psf_model');

            $withChatIsInstalled = false;
            $orgnx_completed = $this->orgnx_onboard_psf_model->checkOrganizationPSFIsCompleted($this->session->userdata('user_id'), $withChatIsInstalled);

            if (!$orgnx_completed) {
                $this->load->helper('url');
                redirect('/getting_started', 'refresh');
            }
        } elseif ($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_FORTIS_SHORT) {
            $this->load->model('orgnx_onboard_fts_model');

            $withChatIsInstalled = false;
            $orgnx_completed = $this->orgnx_onboard_fts_model->checkOrganizationIsCompleted($this->session->userdata('user_id'), $withChatIsInstalled);

            if (!$orgnx_completed) {
                $this->load->helper('url');
                redirect('/getting_started', 'refresh');
            }
        }

        $this->template_data['title'] = langx("Companies");

        $this->load->model('localization_model');
        $this->template_data['us_states'] = $this->localization_model->getUsStates();

        $organizations = $this->organization_model->getList();
        $this->template_data['organizations'] = $organizations;

        if ($this->session->userdata('payment_processor_short') === PROVIDER_PAYMENT_EPICPAY_SHORT) {
            $pview = 'organization';
        } elseif ($this->session->userdata('payment_processor_short') === PROVIDER_PAYMENT_PAYSAFE_SHORT) {
            $pview = 'organization_psf';
        } elseif ($this->session->userdata('payment_processor_short') === PROVIDER_PAYMENT_FORTIS_SHORT) {
            $pview = 'organization_fts';
        } else {
            throw new Exception('Invalid payment_processor');
        }

        $view                         = $this->load->view('organization/' . $pview, ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);
    }

    public function get_organizations_dt()
    {
        output_json($this->organization_model->getDt(), true);
    }

    public function get_organizations_list()
    {
        output_json($this->organization_model->getList(false, 'ch_id asc'));
    }

    public function get_organization()
    {

        $id           = $this->input->post('id');
        $organization = $this->organization_model->get($id);

        output_json([
            'organization' => $organization
        ]);
    }

    public function get_organization_all()
    {

        $id           = $this->input->post('id');
        $organization = $this->organization_model->get($id);
        $this->load->model('orgnx_onboard_model');

        $user_id       = $this->session->userdata('user_id');
        $orgnx_onboard = $this->orgnx_onboard_model->getByOrg($id, $user_id);

        output_json([
            'organization' => $organization,
            'onboard'      => $orgnx_onboard
        ]);
    }

    public function save_organization()
    {
        if ($this->input->post()) {

            $organization_id = (int) $this->input->post('id');

            $this->form_validation->set_rules('organization_name', langx('company_name'), 'trim|required');
            $this->form_validation->set_rules('phone_number', langx('phone_number'), 'trim|required');
            $this->form_validation->set_rules('website', langx('website'), 'trim|required');
            $this->form_validation->set_rules('city', langx('city'), 'trim|required');
            $this->form_validation->set_rules('state', langx('state'), 'trim|required');
            $this->form_validation->set_rules('street_address', langx('street_address'), 'trim|required');
            $this->form_validation->set_rules('postal', langx('postal'), 'trim|required');
            if ($this->form_validation->run() === TRUE) {

                $data = array(
                    'ch_id'          => $organization_id,
                    'church_name'    => $this->input->post('organization_name'),
                    'phone_no'       => $this->input->post('phone_number'),
                    'website'        => $this->input->post('website'),
                    'state'          => $this->input->post('state'),
                    'city'           => $this->input->post('city'),
                    'street_address' => $this->input->post('street_address'),
                    'postal'         => $this->input->post('postal'),
                );

                if (!$organization_id) { //===== create mode
                    $organization_id = $this->organization_model->register($data);
                    if ($organization_id) {

                        //fund and chat_setting_model data should be created on organization_model, when creating an organization this required
                        //so we can centralize and create better code, search in code => #organization_model->register

                        $data_fund = [
                            'name'       => 'General',
                            'church_id'  => $organization_id,
                            'created_at' => date('Y-m-d H:i:s')
                        ];

                        $this->load->model('fund_model');
                        $this->fund_model->register($data_fund);
                        ////////////////////

                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('register_success'), langx('company'))
                        ]);
                        return;
                    }
                } else { //===== update mode
                    $result = $this->organization_model->update($data);
                    if ($result === TRUE) {
                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('update_success'), langx('company'))
                        ]);
                        return;
                    } else {
                        output_json($result);
                        return;
                    }
                }
            }
            output_json([
                'status'  => false,
                'message' => validation_errors()
            ]);
        }
    }

    public function save_onboarding()
    {
        if ($this->input->post()) {

            $organization_id = (int) $this->input->post('id');

            $step      = $this->input->post('step');
            $user_id   = $this->session->userdata('user_id');
            $is_closed = (int)$this->input->post('is_closed');

            if ($step == 1) {
                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[dba_name]', langx('church_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[business_category]', langx('business_category'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[business_type]', langx('business_type'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[business_description]', langx('business_description'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[email]', langx('email'), 'trim|required|valid_email');
                    $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[website]', langx('website'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[state_province]', langx('state'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[city]', langx('city'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[postal_code]', langx('postal_code'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[address_line_1]', langx('address_line'), 'trim|required');
                }
                $form = $_POST['step' . $step];

                if ($this->form_validation->run() === TRUE || $is_closed) {

                    if (!$is_closed) {
                        //validate domain
                        $form['website'] = strpos($form['website'], 'http') !== 0 ? 'http://' . $form['website'] : $form['website'];
                        $url_split       = explode('.', $form['website']);

                        if (filter_var($form['website'], FILTER_VALIDATE_URL) === false || count($url_split) < 2) {
                            output_json(['status' => false, 'message' => '<p>A valid website is required</p>']);
                            return;
                        }

                        $disallowed = ['http://', 'https://'];
                        foreach ($disallowed as $d) {
                            if (strpos($form['website'], $d) === 0) {
                                $form['website'] = str_replace($d, '', $form['website']);
                            }
                        }
                    }
                    ///////////////

                    $data = [
                        'ch_id'                => $organization_id,
                        'church_name'          => preg_replace('/\s\s+/', ' ', $form['dba_name']),
                        'legal_name'           => $form['legal_name'],
                        'phone_no'             => $form['phone_number'],
                        'website'              => $form['website'],
                        'state'                => $form['state_province'],
                        'city'                 => $form['city'],
                        'street_address'       => $form['address_line_1'],
                        'street_address_suite' => $form['address_line_2'],
                        'postal'               => $form['postal_code'],
                        'email'                => $form['email'],
                    ];

                    $ep_onboard_data = [
                        'business_category'    => $form['business_category'],
                        'business_type'        => $form['business_type'],
                        'business_description' => $form['business_description']
                    ];

                    $this->load->model('orgnx_onboard_model');

                    if (!$organization_id) { //===== create mode
                        $organization_id = $this->organization_model->register($data);
                        if ($organization_id) {
                            $ep_onboard_data['church_id'] = $organization_id;
                            $this->orgnx_onboard_model->register($ep_onboard_data);
                            $data_fund = [
                                'name'       => 'General',
                                'church_id'  => $organization_id,
                                'created_at' => date('Y-m-d H:i:s')
                            ];

                            $this->load->model('fund_model');
                            $this->fund_model->register($data_fund);

                            $this->load->model('chat_setting_model');

                            $data_chat_setting = [
                                'id'                => 0,
                                'client_id'         => $this->session->userdata('user_id'),
                                'church_id'         => $organization_id,
                                'suggested_amounts' => '["10","30","50","100"]',
                                'theme_color'       => '#000000',
                                'button_text_color' => '#ffffff'
                            ];
                            $this->chat_setting_model->save($data_chat_setting);


                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('register_success'), langx('company'))]);
                            return;
                        }
                    } else { //===== update mode
                        $result        = $this->organization_model->update($data);
                        $orgnx_onboard = $this->orgnx_onboard_model->getByOrg($organization_id, $user_id, ['id']);

                        $ep_onboard_data['id']        = $orgnx_onboard->id;
                        $ep_onboard_data['church_id'] = $organization_id;

                        $this->orgnx_onboard_model->update($ep_onboard_data, $user_id);

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

                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[ownership_type]', langx('ownership_type'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[fed_tax_id]', langx('fed_tax_id'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[swiped_percent]', langx('swiped_percent'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[keyed_percent]', langx('keyed_percent'), 'trim|required');

                    $this->form_validation->set_rules('step' . $step . '[ecommerce_percent]', langx('ecommerce_percent'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[cc_monthly_volume_range]', langx('cc_monthly_volume_range'), 'callback_major0');
                    $this->form_validation->set_rules('step' . $step . '[cc_avg_ticket_range]', langx('cc_avg_ticket_range'), 'callback_major0');
                    $this->form_validation->set_rules('step' . $step . '[cc_high_ticket]', langx('cc_high_ticket'), 'callback_greater_than_0');
                    $this->form_validation->set_rules('step' . $step . '[ec_monthly_volume_range]', langx('ec_monthly_volume_range'), 'callback_major0');
                    $this->form_validation->set_rules('step' . $step . '[ec_avg_ticket_range]', langx('ec_avg_ticket_range'), 'callback_major0');
                    $this->form_validation->set_rules('step' . $step . '[ec_high_ticket]', langx('ec_high_ticket'), 'callback_greater_than_0');
                }

                if ($this->form_validation->run() === TRUE || $is_closed) {

                    $form = $_POST['step' . $step];

                    $fex_tax_id = explode('-', $form['fed_tax_id']);
                    if (!$is_closed) {
                        if (isset($fex_tax_id[0]) && isset($fex_tax_id[1]) && count($fex_tax_id) == 2 && strlen($fex_tax_id[0]) == 2 && strlen($fex_tax_id[1]) == 7) {
                            //tax id okay
                        } else {
                            output_json(['status' => false, 'message' => '<p>FEX Tax ID must have 00-0000000 Format</p>']);
                            return;
                        }
                    }
                    $percent_total = $form['swiped_percent'] + $form['keyed_percent'] + $form['ecommerce_percent'];

                    if (!$is_closed) {
                        if ($percent_total != 100) {
                            output_json(['status' => false, 'message' => '<p>Percentages must equal 100</p>']);
                            return;
                        }
                    }

                    $this->load->model('orgnx_onboard_model');

                    if ($organization_id) { //===== update mode
                        $data = [
                            'ch_id'  => $organization_id,
                            'tax_id' => $form['fed_tax_id'],
                        ];

                        $result = $this->organization_model->update($data);

                        $orgnx_onboard   = $this->orgnx_onboard_model->getByOrg($organization_id, $user_id, ['id']);
                        $ep_onboard_data = [
                            'id'                      => $orgnx_onboard->id,
                            'church_id'               => $organization_id,
                            'ownership_type'          => $form['ownership_type'],
                            'swiped_percent'          => $form['swiped_percent'],
                            'keyed_percent'           => $form['keyed_percent'],
                            'ecommerce_percent'       => $form['ecommerce_percent'],
                            'cc_monthly_volume_range' => $form['cc_monthly_volume_range'],
                            'cc_avg_ticket_range'     => $form['cc_avg_ticket_range'],
                            'cc_high_ticket'          => $form['cc_high_ticket'],
                            'ec_monthly_volume_range' => $form['ec_monthly_volume_range'],
                            'ec_avg_ticket_range'     => $form['ec_avg_ticket_range'],
                            'ec_high_ticket'          => $form['ec_high_ticket']
                        ];

                        $this->orgnx_onboard_model->update($ep_onboard_data, $user_id);

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
                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[first_name]', langx('first_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[last_name]', langx('last_name'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[date_of_birth]', langx('date_of_birth'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[phone_number]', langx('phone_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[ssn]', langx('ssn'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[title]', langx('title'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[ownership_percent]', langx('ownership_percent'), 'callback_between_0_100');
                    $this->form_validation->set_rules('step' . $step . '[state_province]', langx('state_province'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[city]', langx('city'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[postal_code]', langx('postal_code'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[address_line_1]', langx('address_line'), 'trim|required');
                }
                if ($this->form_validation->run() === TRUE || $is_closed) {

                    $form = $_POST['step' . $step];

                    $this->load->model('orgnx_onboard_model');

                    if ($organization_id) { //===== update mode                        
                        $user_id       = $this->session->userdata('user_id');
                        $orgnx_onboard = $this->orgnx_onboard_model->getByOrg($organization_id, $user_id, ['id']);

                        $ep_onboard_data = [
                            'id'                     => $orgnx_onboard->id,
                            'church_id'              => $organization_id,
                            'sign_first_name'        => $form['first_name'],
                            'sign_last_name'         => $form['last_name'],
                            'sign_date_of_birth'     => $form['date_of_birth'],
                            'sign_phone_number'      => $form['phone_number'],
                            'sign_ssn'               => $form['ssn'],
                            'sign_title'             => $form['title'],
                            'sign_ownership_percent' => $form['ownership_percent'],
                            'sign_state_province'    => $form['state_province'],
                            'sign_city'              => $form['city'],
                            'sign_postal_code'       => $form['postal_code'],
                            'sign_address_line_1'    => $form['address_line_1'],
                            'sign_address_line_2'    => $form['address_line_2']
                        ];

                        $this->orgnx_onboard_model->update($ep_onboard_data, $user_id);
                        output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company'))]);

                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            } elseif ($step == 4) {
                if (!$is_closed) {
                    $this->form_validation->set_rules('step' . $step . '[routing_number]', langx('routing_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[account_number]', langx('account_number'), 'trim|required');
                    $this->form_validation->set_rules('step' . $step . '[account_holder_name]', langx('account_holder_name'), 'trim|required');
                }
                if ($this->form_validation->run() === TRUE || $is_closed) {

                    $form = $_POST['step' . $step];

                    $this->load->model('orgnx_onboard_model');

                    if ($organization_id) { //===== update mode                        
                        $user_id       = $this->session->userdata('user_id');
                        $orgnx_onboard = $this->orgnx_onboard_model->getByOrg($organization_id, $user_id, ['id', 'processor_response']);

                        $ep_onboard_data = [
                            'id'                   => $orgnx_onboard->id,
                            'church_id'            => $organization_id,
                            'routing_number_last4' => $form['routing_number'], //4 digit validation on model
                            'account_number_last4' => $form['account_number'], //4 digit validation on model
                            'account_holder_name'  => $form['account_holder_name'],
                        ];

                        if ($is_closed) {
                            unset($ep_onboard_data['routing_number_last4']);
                            unset($ep_onboard_data['account_number_last4']);
                        }

                        $this->orgnx_onboard_model->update($ep_onboard_data, $user_id);

                        if ($is_closed) {
                            output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company'))]);
                            return;
                        }

                        $bank_account = [
                            'routing_number'      => $form['routing_number'],
                            'account_number'      => $form['account_number'],
                            'account_holder_name' => ucwords(strtolower(trim($form['account_holder_name'])))
                        ];

                        $resp = $this->doProcessorOnboarding($organization_id, $bank_account);

                        if ($orgnx_onboard->processor_response) {
                            $save_response   = json_decode($orgnx_onboard->processor_response);
                            $save_response[] = $resp;
                            $save_response   = json_encode($save_response);
                        } else {
                            $save_response = json_encode([$resp]);
                        }

                        $ep_onboard_data2 = [
                            'id'                 => $orgnx_onboard->id,
                            'church_id'          => $organization_id,
                            'processor_response' => $save_response
                        ];
                        $this->orgnx_onboard_model->update($ep_onboard_data2, $user_id);

                        if (!$resp['status']) {
                            output_json(['status' => false, 'message' => '<p>' . $resp['message'] . '</p>']);
                            return;
                        }

                        output_json(['status' => true, 'ch_id' => $organization_id, 'message' => sprintf(langx('update_success'), langx('company')), 'result' => $resp['result']]);

                        return;
                    } else {
                        output_json(['status' => false, 'message' => 'Invalid request']);
                    }
                }
                output_json(['status' => false, 'message' => validation_errors()]);
            }
        }
    }

    private function doProcessorOnboarding($orgnx_id, $bank_account)
    {

        $user_id       = $this->session->userdata('user_id');
        $orgnx         = $this->organization_model->get($orgnx_id); //=== church_id comes safe
        $orgnx_onboard = $this->orgnx_onboard_model->getByOrg($orgnx_id, $user_id);

        require_once 'application/libraries/gateways/PaymentsProvider.php';
        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();

        $merchantData = [
            'client_app_id'           => $orgnx->ch_id,
            'email'                   => $orgnx->email,
            'dba_name'                => $orgnx->church_name,
            'template_id'             => $orgnx->epicpay_template,
            'website'                 => $orgnx->website,
            'fed_tax_id'              => $orgnx->tax_id,
            'business_category'       => $orgnx_onboard->business_category,
            'business_type'           => $orgnx_onboard->business_type,
            'business_description '   => $orgnx_onboard->business_description,
            'ownership_type'          => $orgnx_onboard->ownership_type,
            'cc_average_ticket_range' => $orgnx_onboard->cc_avg_ticket_range,
            'cc_monthly_volume_range' => $orgnx_onboard->cc_monthly_volume_range,
            'cc_high_ticket'          => $orgnx_onboard->cc_high_ticket,
            'ec_average_ticket_range' => $orgnx_onboard->ec_avg_ticket_range,
            'ec_monthly_volume_range' => $orgnx_onboard->ec_monthly_volume_range,
            'ec_high_ticket'          => $orgnx_onboard->ec_high_ticket,
            'swiped_percent'          => (int) $orgnx_onboard->swiped_percent,
            'keyed_percent'           => (int) $orgnx_onboard->keyed_percent,
            'ecommerce_percent '      => (int) $orgnx_onboard->ecommerce_percent,
            'location'                => [
                'address_line_1' => $orgnx->street_address,
                'address_line_2' => $orgnx->street_address_suite,
                'city'           => $orgnx->city,
                'state_province' => $orgnx->state,
                'postal_code'    => $orgnx->postal,
                'phone_number'   => $orgnx->phone_no,
            ],
            'primary_principal'       => [
                'first_name'        => $orgnx_onboard->sign_first_name,
                'last_name'         => $orgnx_onboard->sign_last_name,
                'date_of_birth'     => $orgnx_onboard->sign_date_of_birth,
                'phone_number'      => $orgnx_onboard->sign_phone_number,
                'ssn'               => $orgnx_onboard->sign_ssn,
                'ownership_percent' => $orgnx_onboard->sign_ownership_percent,
                'title'             => $orgnx_onboard->sign_title,
                'state_province'    => $orgnx_onboard->sign_state_province,
                'city'              => $orgnx_onboard->sign_city,
                'postal_code'       => $orgnx_onboard->sign_postal_code,
                'address_line_1'    => $orgnx_onboard->sign_address_line_1,
                'address_line_2'    => $orgnx_onboard->sign_address_line_2,
            ],
            'bank_account'            => [
                'routing_number'      => $bank_account['routing_number'],
                'account_number'      => $bank_account['account_number'],
                'account_holder_name' => $bank_account['account_holder_name'],
            ]
        ];

        if ($orgnx->legal_name) {
            $merchantData['legal_name'] = $orgnx->legal_name; //=== optional 
        }

        if (EPICPAY_ONBOARD_FORM_TEST) {
            $merchantData['is_test'] = 'true';
        }

        $merchantData['app_complete_endpoint'] = base_url() . 'epicpay/merchant_appcomplete/' . $orgnx->ch_id;
        $merchantData['app_delivery']          = 'link_full_page';
        $response                              = $PaymentInstance->onboardMerchant($merchantData);
        return $response;
    }

    public function onboard_review($church_id)
    {
        $this->load->model('orgnx_onboard_model');
        $this->template_data['title']      = langx("Company and bank information review");
        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $user_id                           = $this->session->userdata('user_id');
        $orgnx_onboard                     = $this->orgnx_onboard_model->getByOrg($church_id, $user_id, ['id', 'processor_response']);
        $processor_responses               = json_decode($orgnx_onboard->processor_response);

        if (!$processor_responses) {
            throw new Exception('Invalid request');
        }

        $this->template_data['processor_response'] = end($processor_responses); //get the last response
        $view                                      = $this->load->view('organization/onboard_review', ['view_data' => $this->template_data], true);
        $this->template_data['content']            = $view;
        $this->load->view('main', $this->template_data);
        https: //mpa.epicpay.com/EzApp/CompleteApp/33e992ee0dd34a869685ce96ccb6e0d3
    }

    public function major0($str)
    {
        if ($str == 0 || $str == '') {
            $this->form_validation->set_message('major0', 'The {field} is required');
            return FALSE;
        } else {
            return TRUE;
        }
    }

    public function between_0_100($str)
    {
        if ($str < 0 || $str > 100 || !is_numeric($str)) {
            $this->form_validation->set_message('between_0_100', 'The {field} must be between 0 and 100');
            return FALSE;
        } else {
            return TRUE;
        }
    }

    public function greater_than_0($str)
    {
        if ($str <= 0 || !is_numeric($str)) {
            $this->form_validation->set_message('greater_than_0', 'The {field} must be greater than 0');
            return FALSE;
        } else {
            return TRUE;
        }
    }

    public function remove()
    {

        $ch_id   = $this->input->post("ch_id");
        $user_id = $this->session->userdata('user_id');
        $result  = $this->organization_model->remove($ch_id, $user_id);
        output_json([
            'status'  => $result['status'],
            'message' => $result['message']
        ]);
    }

    public function verify()
    {

        if ($this->input->post()) {
            $params    = $this->input->post();
            $church_id = isset($params['church_id']) ? $params['church_id'] : 0;

            $church = $this->db->where('ch_id', $church_id)
                ->where('client_id', $this->session->userdata('user_id'))
                ->get('church_detail')->row();

            if (empty($church)) {
                echo json_encode(['status' => false, 'message' => 'Invalid church']);
                die;
            }

            $client = $this->db->where('id', $this->session->userdata('user_id'))->get('users')->row();

            if (empty($client) || strlen($client->first_name) == 0 || strlen($client->first_name) == 0) {
                output_json(['status' => false, 'message' => 'Please update your first and last name']);
                return;
            }

            $agentData = [
                'church_id'        => $church_id,
                'church_name'      => $church->church_name,
                'email'            => $client->email,
                'phone_number'     => $church->phone_no,
                'first_name'       => $client->first_name,
                'last_name'        => $client->last_name,
                'epicpay_template' => $church->epicpay_template
            ];

            require_once 'application/libraries/gateways/PaymentsProvider.php';
            PaymentsProvider::init();
            $PaymentInstance = PaymentsProvider::getInstance();

            $PaymentInstance->setTesting(true);

            $response = $PaymentInstance->createAgent($agentData);

            if ($response['error'] == 0) {
                output_json(['status' => true, 'url' => $response['response']->result->app_link]);
            } else {
                output_json(['status' => false, 'message' => json_encode($response['response'])]);
            }
        }
    }
}
