<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();
        $this->load->library(['ion_auth', 'form_validation']);
        $this->load->helper(['url']);
        
        $this->form_validation->set_error_delimiters($this->config->item('error_start_delimiter', 'ion_auth'), $this->config->item('error_end_delimiter', 'ion_auth'));

        $this->lang->load('auth');
        $this->load->use_theme();        
    }

    public function index() {

        if (!$this->ion_auth->logged_in()) {
            // redirect them to the login page
            redirect('auth/login', 'refresh');
        } else if (!$this->ion_auth->is_admin()) { // remove this elseif if you want to enable this for non-admins
            // redirect them to the home page because they must be an administrator to view this
            show_error('You must be an administrator to view this page.');
        } else {
            $this->data['title'] = $this->lang->line('index_heading');

            // set the flash data error message if there is one
            $this->data['message'] = (validation_errors()) ? validation_errors() : $this->session->flashdata('message');

            //list the users
            $this->data['users'] = $this->ion_auth->users()->result();

            //USAGE NOTE - you can do more complicated queries like this
            //$this->data['users'] = $this->ion_auth->where('field', 'value')->users()->result();

            foreach ($this->data['users'] as $k => $user) {
                $this->data['users'][$k]->groups = $this->ion_auth->get_users_groups($user->id)->result();
            }

            $this->_render_page('auth' . DIRECTORY_SEPARATOR . 'index', $this->data);
        }
    }

    public function access($token = false, $opt = false) {
        if ($token){
            $this->ion_auth->directaccess($token, $opt);
        }
        redirect(base_url(), 'refresh');
        
    }
    
    public function generate_hash(){
        $bytes                     = openssl_random_pseudo_bytes(48, $cstrong);
        echo '<pre>' . bin2hex($bytes) . '</pre>';
    }

    public function login() {
        if ($this->input->post()) {
            $this->form_validation->set_rules('identity', str_replace(':', '', $this->lang->line('login_identity_label')), 'required');
            $this->form_validation->set_rules('password', str_replace(':', '', $this->lang->line('login_password_label')), 'required');

            if ($this->form_validation->run() === TRUE) {
                $remember = (bool) $this->input->post('remember');

                if ($this->ion_auth->login($this->input->post('identity'), $this->input->post('password'), $remember)) {
                    
                    if($this->session->userdata('is_child') === TRUE) {
                        //When a team member is forced to logout we are reseting the force logout field when he logs in again
                        $this->load->model('user_model');
                        $this->user_model->setForceLogout($this->session->userdata('child_id'), null);                    
                    }
                    
                    output_json([
                        'status'  => true,
                        'message' => $this->ion_auth->messages()
                    ]);
                    return;
                } else {
                    output_json([
                        'status'  => false,
                        'message' => $this->ion_auth->errors()
                    ]);
                    return;
                }
            } else {
                output_json([
                    'status'  => false,
                    'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
                ]);
                return;
            }
        }
        $this->data['identity'] = [
            'name'  => 'identity',
            'id'    => 'identity',
            'type'  => 'text',
            'value' => $this->form_validation->set_value('identity'),
        ];

        $this->data['password'] = [
            'name' => 'password',
            'id'   => 'password',
            'type' => 'password',
        ];
        $this->load->view('auth/login');
    }

    /**
     * Register
     */
    public function register() {
        if(!empty($this->input->get('ref'))){
            $this->session->set_userdata('ref_code', $this->input->get('ref'));
        }
        if ($this->input->post()) {

            $result = validateRecaptcha($this->input->post('recaptchaToken'), 'registration');
            if($result['status'] == false) {
                output_json([
                    'status'  => false,
                    'message' => 'An error ocurred'
                ]);
                return;
            }
            
            $identity_column               = $this->config->item('identity', 'ion_auth');
            $this->data['identity_column'] = $identity_column;

            $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email');
            $this->form_validation->set_rules('password', $this->lang->line('create_user_validation_password_label'), 'required|min_length[' . $this->config->item('min_password_length', 'ion_auth') . ']');
            $this->form_validation->set_rules('full_name', $this->lang->line('create_user_validation_full_name_label'), 'trim|required');
            $this->form_validation->set_rules('phone', $this->lang->line('create_user_validation_phone_label'), 'trim|required');
            $this->form_validation->set_rules('company', $this->lang->line('create_user_validation_company_label'), 'trim|required');

            if ($this->form_validation->run() === TRUE) {
                $email    = strtolower($this->input->post('email'));
                $identity = strtolower($this->input->post('email'));
                $password = $this->input->post('password');

                //===== remove more than one space
                $full_name_arr = explode(' ', preg_replace('/\s\s+/', ' ', $this->input->post('full_name')));
                
                $first_name =  $full_name_arr[0];
                $last_name =  isset($full_name_arr[1]) ? $full_name_arr[1] : '';
                $last_name .=  isset($full_name_arr[2]) ? ' ' . $full_name_arr[2] : '';
                $last_name .=  isset($full_name_arr[3]) ? ' ' . $full_name_arr[3] : '';
                
                $additional_data = [
                    'first_name' => $first_name,
                    'last_name'  => $last_name,
                    'company'    => $this->input->post('company'),
                    'phone'      => $this->input->post('phone'),
                ];
                
                $user_id = $this->ion_auth->register($identity, $password, $email, $additional_data);
                if ($user_id) {

                    $this->load->model('organization_model');
                    
                    $org_data = [
                        'client_id'   => $user_id,
                        'church_name' => $this->input->post('company'),
                        'created_at'  => date('Y-m-d H:i:s')
                    ];
                    $organization_id = $this->organization_model->register($org_data, $user_id);
                    $this->ion_auth_model->setUserCurrentOrganization($organization_id, 'org');
                    
                    //chat_setting_model data should be created on organization_model, when creating an organization this required
                    //so we can centralize and create better code, search in code => #organization_model->register
                    //also fund_model

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

                    $data_fund = ['name' => 'General', 'church_id'  => $organization_id, 'created_at' => date('Y-m-d H:i:s')];
                    $this->load->model('fund_model');
                    $this->fund_model->register($data_fund);
                    /////////////////
                    
                    //require_once 'application/libraries/email/EmailProvider.php';
                    //EmailProvider::getInstance()->sendEmail('noreply@chatgive.com', 'Chatgive', $email, 'Success registration for app.chatgive.com', 'Thank you for registering ...');
                                        
                    $notifyData = [
                        "first_name"      => $additional_data['first_name'],
                        "last_name"       => $additional_data['last_name'],
                        "email"           => $email,
                        'phone'           => $additional_data['phone'],
                        'organization'    => $additional_data['company'],
                        'organization_id' => $organization_id
                    ];
                    
                    $this->load->helper('admin_notifier');
                    AdminNotifier::onUserRegistration($notifyData, ['juan@lunarpay.com']);

                    if(!empty($this->session->userdata('ref_code'))){//process referrals
                            $this->ion_auth->process_referrals(array('referral_code'=>$this->session->userdata('ref_code'),'user_id'=>$user_id,'email'=>$email,'full_name'=>$notifyData['first_name'].' '.$notifyData['last_name']));
                    }
           
                    output_json([
                        'status'  => true,
                        'message' => $this->ion_auth->messages()
                    ]);
                    return;
                }
            }
            output_json([
                'status'  => false,
                'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
            ]);
        } else {
            $this->load->view('auth/registration');
        }
    }

    /**
     * Register
     */
    public function forgot_password() {
        if ($this->input->post()) {
            $this->form_validation->set_rules('identity', $this->lang->line('forgot_password_validation_email_label'), 'required|valid_email');
            if ($this->form_validation->run() === TRUE) {
                $identity_column = $this->config->item('identity', 'ion_auth');
                $identity = $this->ion_auth->where($identity_column, $this->input->post('identity'))->users()->row();

                if (empty($identity)) {

                    if ($this->config->item('identity', 'ion_auth') != 'email') {
                        $this->ion_auth->set_error('forgot_password_identity_not_found');
                    } else {
                        $this->ion_auth->set_error('forgot_password_email_not_found');
                    }

                    output_json([
                        'status'  => false,
                        'message' => $this->ion_auth->errors()
                    ]);
                    return;
                }

                // run the forgotten password method to email an activation code to the user
                $data_forgotten = $this->ion_auth->forgotten_password($identity->{$this->config->item('identity', 'ion_auth')});

                $message = $this->load->view($this->config->item('email_templates', 'ion_auth') . $this->config->item('email_forgot_password', 'ion_auth'), $data_forgotten, TRUE);
                $from    = $this->config->item('admin_email', 'ion_auth');
                $to      = $data_forgotten['user']->email;
                $subject = $this->config->item('site_title', 'ion_auth') . ' - ' . $this->lang->line('email_forgotten_password_subject');

                require_once 'application/libraries/email/EmailProvider.php';               
                $email_data = EmailProvider::getInstance()->sendEmail($from, COMPANY_NAME , $to, $subject, $message);

                if ($email_data['status']){
                    output_json([
                        'status'  => true,
                        'message' => $this->ion_auth->messages()
                    ]);
                    return;
                } else {
                    output_json([
                        'status'  => false,
                        'message' => $this->ion_auth->errors()
                    ]);
                    return;
                }
            } else {
                output_json([
                    'status'  => false,
                    'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
                ]);
                return;
            }
        } else {
            $this->load->view('auth/forgot_password');
        }
    }

    public function reset_password($code = NULL) {
        if ($this->input->post()) {
                $this->form_validation->set_rules('new', $this->lang->line('reset_password_validation_new_password_label'), 'required|min_length[' . $this->config->item('min_password_length', 'ion_auth') . ']|matches[new_confirm]');
                $this->form_validation->set_rules('new_confirm', $this->lang->line('reset_password_validation_new_password_confirm_label'), 'required');

                if ($this->form_validation->run() === TRUE) {
                    $code = $this->input->post('code');
                    $user = $this->ion_auth->forgotten_password_check($code);
                    $identity = $user->{$this->config->item('identity', 'ion_auth')};

                    // do we have a valid request?
                    if (!$user) {
                        $this->ion_auth->clear_forgotten_password_code($identity);
                        show_404();
                    } else {
                        // finally change the password
                        $change = $this->ion_auth->reset_password($identity, $this->input->post('new'));

                        if ($change) {
                            output_json([
                                'status'  => true,
                                'message' => $this->ion_auth->messages()
                            ]);
                            return;
                        } else {
                            output_json([
                                'status'  => false,
                                'message' => $this->ion_auth->errors()
                            ]);
                            return;
                        }
                    }
                } else {
                    output_json([
                        'status'  => false,
                        'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
                    ]);
                    return;
                }

        } else {
            if (!$code) {
                show_404();
            }
            $user = $this->ion_auth->forgotten_password_check($code);
            if ($user) {
                $this->load->view('auth/reset_password', ['code' => $code]);
            } else {
                redirect("auth/forgot_password", 'refresh');
            }
        }
    }

    /**
     * Log the user out
     */
    public function logout() {
        $this->data['title'] = "Logout";

        // log the user out
        $this->ion_auth->logout();

        // redirect them to the login page
        redirect('auth/login', 'refresh');
    }
    
    public function get_orgnx_tree() {
        // ---- load tree organizations/suborganizations
        $this->load->model('organization_model');

        $orgnxTree = $this->organization_model->getUserOrganizationsTree();
        output_json($orgnxTree);
    }

    public function set_current_user_orgnx() {
        try {            
            $xorgnx_id = $this->input->post('xorgnx_id'); //it can be an org or suborg
            $type = $this->input->post('type'); //can be org or sub
            $this->ion_auth_model->setUserCurrentOrganization($xorgnx_id, $type);
            output_json(['status' => true, 'debug_data' => ($this->session->userdata())]);
        } catch (Exception $ex) {
            output_json(['status' => false, 'error' => $ex->getMessage(), 'exception' => true]);
        }
        
        
    }

}
