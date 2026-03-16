<?php

defined('BASEPATH') OR exit('No direct script access allowed');

//My_Controller is used as base for the dashboard controllers

class My_Controller extends CI_Controller {
  
    public function __construct() {
        parent::__construct();
        
        $this->load->model('setting_model');          
              
        if(CURRENT_SYSTEM !== 'DASHBOARD' && !IS_DEVELOPER_MACHINE) { 
            //MY_Controller is the main parent class for all dashboard controllers
            //If current system is not dashboard trying to use dashboard controllers we just don't let the user to continue
            //show_404();
            //die;
        }
        //======= if is a team member do permissions validations
        if ($this->session->userdata('is_child') === TRUE) {

            $current_endpoint = $this->router->fetch_class() . '/' . $this->router->fetch_method();
            
            if (!$this->input->is_ajax_request()) { //if the call is not an ajax request we can logout the user, (when he is set for logout)
                $this->load->model('user_model');
                
                $force_logout = $this->user_model->getForceLogout($this->session->userdata('child_id'));
                if ($force_logout) { //put back setForceLogout to null again, logout the user and refresh for sending him back to the login page                    
                    //force logout is set to null when team member logs in (auth/login)
                    $this->ion_auth->logout();
                    redirect('/', 'refresh');
                    return;
                } else if ($current_endpoint == 'getting_started_fts/index') { 
                    //if is team member and is not an ajax request and is not forced to logout avoid loadging getting_started
                    //it's a page for the admin only                    
                    redirect(BASE_URL . 'dashboard/myprofile', 'refresh');
                    return;
                }
            }
           
            $allow            = true;
            $permissions_arr  = $this->session->userdata('permissions');
            
            if ($this->setting_model->getItem('SYSTEM_LETTER_ID') == 'L') {
                $name_module_tree = MODULE_TREE;
            }
            if ($this->setting_model->getItem('SYSTEM_LETTER_ID') == 'H') {
                $name_module_tree = MODULE_TREE_COACH;
            }
            
            foreach ($name_module_tree as $row) {
                foreach ($row['endpoints'] as $endpoint) { //===== loop through endpoints that need observance                    
                    if (strtolower($endpoint) == strtolower($current_endpoint)) { //===== endpoint need to be observed
                        $allow = false;
                        foreach ($permissions_arr as $permission_id) {
                            if ($permission_id == $row['id']) {
                                $allow = true;
                            }
                        }
                    }
                }
            }    
                        
            if ($allow === FALSE) {
                if ($current_endpoint == 'organizations/index') { //==== if routes default controller is changed, we need to change it here
                    redirect(BASE_URL . 'dashboard/myprofile', 'refresh');
                }
                show_error('Unauthorized access, contact your team administrator', 403);
            }
        }
    }

}
