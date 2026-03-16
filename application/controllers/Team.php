<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require_once 'application/controllers/extensions/Payments.php';

class Team extends My_Controller {

    public $data             = [];
    private $passSizeBin2Hex = 9;

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();
    }

    public function get_dt() {
        $this->load->model('user_model');
        output_json($this->user_model->getTeamDt(), true);
    }

    private function get_from_name_ForEmailingTeamMemberCredentials() {
        $this->load->model('organization_model');
        $orngx = $this->organization_model->getList(false, 'ch_id desc');

        $from_name = null;
        if ($orngx && $orngx[0]["church_name"]) {
            $from_name = ucwords(strtolower($orngx[0]['church_name'])) . ' | ' . $this->session->userdata('email');
            $from_name = preg_replace('/\s\s+/', ' ', $from_name); //===== remove more than one space
        } else {
            $from_name = $this->session->userdata('email');
        }

        return $from_name;
    }

    private function beautyPass($string) {
        //Upercase lowercase randomnly
        $i = 0;
        while ($i < strlen($string)) {
            $tmp        = $string[$i];
            if (rand() % 2 == 0)
                $tmp        = strtoupper($tmp);
            else
                $tmp        = strtolower($tmp);
            $string[$i] = $tmp;
            $i++;
        }

        return $string;
    }

    public function save_member() {
        if ($this->input->post()) {

            $this->load->library('form_validation');
            $this->lang->load('auth');

            $tables                        = $this->config->item('tables', 'ion_auth');
            $identity_column               = $this->config->item('identity', 'ion_auth');
            $this->data['identity_column'] = $identity_column;

            $user_id = $this->input->post('id');

            $this->form_validation->set_rules('first_name', $this->lang->line('create_user_validation_fname_label'), 'trim|required');
            $this->form_validation->set_rules('last_name', $this->lang->line('create_user_validation_lname_label'), 'trim|required');
            if ($identity_column !== 'email') {
                $this->form_validation->set_rules('identity', $this->lang->line('create_user_validation_identity_label'), 'trim|required|is_unique[' . $tables['users'] . '.' . $identity_column . ']');
                $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email');
            } else {
                if (!$user_id) {
                    $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email|is_unique[' . $tables['users'] . '.email]');
                } else {
                    $this->form_validation->set_rules('email', $this->lang->line('create_user_validation_email_label'), 'trim|required|valid_email');
                }
            }

            $this->form_validation->set_rules('phone', $this->lang->line('create_user_validation_phone_label'), 'trim');

            if ($this->form_validation->run() === TRUE) {
                $email    = strtolower($this->input->post('email'));
                $identity = ($identity_column === 'email') ? $email : $this->input->post('identity');

                $additional_data = [
                    'first_name'  => $this->input->post('first_name'),
                    'last_name'   => $this->input->post('last_name'),
                    'phone'       => $this->input->post('phone'),
                    'permissions' => $this->input->post('permissions') ? implode(',', array_keys($this->input->post('permissions'))) : null,
                    'parent_id'   => $this->session->userdata('user_id')
                ];

                $groups = [3]; //===== team1

                if (!$user_id) {//===== create mode
                    $password = $this->beautyPass(bin2hex(openssl_random_pseudo_bytes($this->passSizeBin2Hex)));
                    $user_id  = $this->ion_auth->register($identity, $password, $email, $additional_data, $groups);
                    if ($user_id) {

                        $from_name = $this->get_from_name_ForEmailingTeamMemberCredentials();

                        require_once 'application/libraries/email/EmailProvider.php';
                        //CODEIGNITER_SMTP_USER constant should be ranamed with a generalistic name
                        $email_response = EmailProvider::getInstance()->sendEmail(CODEIGNITER_SMTP_USER, COMPANY_NAME, $email, ''
                                . "Invitation as team member by $from_name", ''
                                . "You have been invited as team member by $from_name<br><br>"
                                . "Account access:<br><br>"
                                . "Username: <strong>$email</strong><br>"
                                . "Password: <strong>$password</strong><br><br>"
                                . 'Sign in by clicking here: <a href="' . BASE_URL . '">' . BASE_URL . '</a><br><br>'
                                . FOOTER_TEXT);

                        output_json([
                            'status'        => true,
                            'message'       => $this->ion_auth->messages(),
                            'email_message' => '<p>' . ($email_response['status'] ? ('Invitation sent to ' . $email) : 'An error occurred attempting to send the invitation') . '</p>'
                        ]);
                        return;
                    }
                } else {//===== update mode
                    //ion_auth expects user_id (team member) is a safe value, as it does not come from the session but from a post it could be hacked
                    //so we will validate if the id belongs to the main user account
                    
                    $this->load->model('user_model');
                    $memberIds = $this->user_model->getAllTeamMembersIds($this->session->userdata('user_id'));
                    
                    if(!in_array($user_id, $memberIds)) {
                        output_json([
                            'status'        => false,
                            'message'       => '<p>Bad request</p>'
                        ]);
                        return;
                    }
                    
                    if ($this->ion_auth->update($user_id, $additional_data)) {
                        
                        //always that the team member is updated, proceed to logout him
                        
                        $this->user_model->setForceLogout($user_id, 1);
                        
                        output_json([
                            'status'        => true,
                            'message'       => $this->ion_auth->messages(),
                            'email_message' => ''
                        ]);
                        return;
                    }
                }
            }
            output_json([
                'status'  => false,
                'message' => (validation_errors() ? validation_errors() : $this->ion_auth->errors())
            ]);
        }
    }

    public function resend_invitation() {

        $this->load->model('ion_auth_model');

        $this->load->model('user_model');
        $id = $this->input->post('id');

        $main_user_id = $this->session->userdata('user_id');

        $user = $this->user_model->getTeamMember($id, $main_user_id);
        if (!$user) {
            return ['status' => false, 'message' => 'Bad request'];
        }

        $password = $this->beautyPass(bin2hex(openssl_random_pseudo_bytes($this->passSizeBin2Hex)));

        $this->ion_auth_model->reset_password($user->email, $password);

        $from_name = $this->get_from_name_ForEmailingTeamMemberCredentials();

        require_once 'application/libraries/email/EmailProvider.php';
        
        $email_response = EmailProvider::getInstance()->sendEmail(CODEIGNITER_SMTP_USER, COMPANY_NAME, $user->email, ''
                . "Invitation as team member by $from_name", ''
                . "You have been invited as team member by $from_name<br><br>"
                . "Account access:<br><br>"
                . "Username: <strong>$user->email</strong><br>"
                . "Password: <strong>$password</strong><br><br>"
                . 'Sign in by clicking here: <a href="' . BASE_URL . '">' . BASE_URL . '</a><br><br>'
                . FOOTER_TEXT);

        output_json([
            'status'        => true,
            'message'       => $this->ion_auth->messages(),
            'email_message' => '<p>' . ($email_response['status'] ? ('Credentials has been reset and sent to ' . $user->email) : 'An error occurred attempting to send the invitation') . '</p>'
        ]);
    }

    public function get_member() {

        $this->load->model('user_model');
        $user_id = $this->input->post('id');

        $main_user_id = $this->session->userdata('user_id');

        $user = $this->user_model->getTeamMember($user_id, $main_user_id);

        output_json([
            'user'        => $user,
            'user_groups' => []
        ]);
    }
    
    public function delete_user() {

        $this->load->model('ion_auth_model');
        $team_member_id = $this->input->post('id');
        $parent_id      = $this->session->userdata('user_id');
        $result         = $this->ion_auth_model->delete_user($team_member_id, $parent_id);

        output_json($result);
    }

}