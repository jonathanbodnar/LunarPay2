<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Funds extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

        $this->load->model('fund_model');
    }

    public function index($organization, $sub_organization = null, $create = null) {
        $this->template_data['title']       = langx("funds");
        //Getting Organizations
        $this->template_data['organization_id'] = (int)$organization;
        $this->template_data['sub_organization_id'] = (int)$sub_organization;
        $this->template_data['create'] = $create;

        if(!$sub_organization){
            $this->load->model('organization_model');
            $organization = $this->organization_model->get($organization,'church_name',false,$this->session->userdata('user_id'));
            if($organization){
                $this->template_data['org_name'] = $organization->church_name;
            } else {
                show_404();
            }
        } else {
            $this->load->model('suborganization_model');
            $sub_organization = $this->suborganization_model->get($sub_organization,$this->session->userdata('user_id'));
            if($sub_organization){
                $this->template_data['org_name'] = $sub_organization->name;
            } else {
                show_404();
            }
        }

        $view                               = $this->load->view('fund/fund', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_funds_dt() {
        output_json($this->fund_model->getDt(), true);
    }

    public function get_fund() {

        $id              = $this->input->post('id');
        $fund = $this->fund_model->get($id);

        output_json([
            'fund' => $fund
        ]);
    }
    
    public function get_fund_with_orgn_data() {

        $id              = $this->input->post('id');
        $fund = $this->fund_model->getWithOrgnData($id);

        output_json([            
            'fund' => $fund
        ]);
    }

    public function get_funds_list() {
        output_json($this->fund_model->getList());
    }

    public function get_tag_list() {
        $data = $this->fund_model->getList($this->input->post('organization_id'),$this->input->post('suborganization_id'),'id, name as text');
        $values = array_column($data,'id');
        output_json(['data' => $data , 'values' => $values]);
    }

    public function save_fund() { //if in the future we need a 3rd party system to save funds let's refactorize all these code and centralize things in the model
        if ($this->input->post()) {
            
            $fund_id = (int) $this->input->post('id');

            $this->form_validation->set_rules('fund_name', langx('fund_name'), 'trim|required');
            if ($fund_id == 0){
                $this->form_validation->set_rules('organization_id', langx('company'), 'required');
            }

            //Check if it'has been changed
            $fund_name = ucwords(strtolower(trimLR_Duplicates($this->input->post('fund_name'))));            
            $fund_name_changed = true;
            if ($fund_id){
                $current_fund = $this->db->from('funds')->where('id', $fund_id)->get()->row();
                if($fund_name == ucwords(strtolower(trimLR_Duplicates($current_fund->name)))){
                    $fund_name_changed = false;
                }
            }

            if($fund_name_changed) {
                //Validate Repeated Fund Name
                $this->db->from('funds')->where('name', $fund_name)->where('church_id', $this->input->post('organization_id'));
                if ($this->input->post('suborganization_id')) {
                    $this->db->where('campus_id', $this->input->post('suborganization_id'));
                } else {
                    $this->db->where('campus_id is null');
                }
                $repeated_fund = $this->db->get()->row();
                if ($repeated_fund) {
                    output_json([
                        'status' => false,
                        'message' => '<p>There is already a fund with that name on this organization</p>'
                    ]);
                    return;
                }
            }

            if ($this->form_validation->run() === TRUE || $fund_id > 0) {

                $church_id = (int)$this->input->post('organization_id');
                $campus_id = (int)$this->input->post('suborganization_id');

                $is_active = $this->input->post('fund_active') == 'active' ? 1 : 0;

                $data = array(
                    'id'            => $fund_id,
                    'name'          => $fund_name,
                    'church_id'     => $church_id,
                    'campus_id'     => $campus_id,
                    'is_active'     => $is_active,
                    'description'   => $this->input->post('description') ? $this->input->post('description') : null
                );

                $user_id = $this->session->userdata('user_id');
                $this->load->model('chat_setting_model');
                if (!$fund_id) {//===== create mode
                    $data['created_at'] = date('Y-m-d H:i:s');
                    $fund_id = $this->fund_model->register($data);
                    if ($fund_id) {

                        //Automatically adding to Widget Conduit Funds
                        if($is_active) {
                            $this->chat_setting_model->addAutomaticallyToConduitFund($user_id,$church_id,$campus_id,$fund_id);
                        }

                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('register_success'), langx('fund'))
                        ]);
                        return;
                    }
                } else {//===== update mode
                    //Disable Organization (Church) Update
                    unset($data['church_id']);
                    unset($data['campus_id']);
                    $result = $this->fund_model->update($data);
                    if ($result === TRUE) {

                        if(!$this->input->post('fund_active')){


                            $this->load->model('chat_setting_model');
                            $this->load->model('page_model');

                            //Removing Conduit Funds from Main Widget
                            $chatSetting = $this->chat_setting_model->getChatSetting($user_id,$church_id,$campus_id);

                            if($chatSetting) {
                                $main_conduit_funds = json_decode($chatSetting->conduit_funds);
                                //Checking fund id on conduit funds and getting key to unset it
                                if($main_conduit_funds && ($key = array_search($fund_id, $main_conduit_funds)) !== false) {
                                    unset($main_conduit_funds[$key]);
                                    $this->chat_setting_model->save(['id'=>$chatSetting->id,'conduit_funds' => json_encode(array_values($main_conduit_funds))]);
                                }
                            }

                            //Removing Conduit Funds from Pages
                            $pages = $this->page_model->getList($user_id,$church_id,$campus_id,true);
                            foreach ($pages as $page){
                                $page_conduit_funds = json_decode($page->conduit_funds);

                                //Checking fund id on conduit funds and getting key to unset it
                                if($page_conduit_funds && ($key = array_search($fund_id, $page_conduit_funds)) !== false) {
                                    unset($page_conduit_funds[$key]);
                                    $this->page_model->save(['id'=>$page->id,'conduit_funds' => json_encode(array_values($page_conduit_funds))]);
                                }
                            }
                        }

                        output_json([
                            'status'  => true,
                            'message' => sprintf(langx('update_success'), langx('fund'))
                        ]);
                        return;
                    }else{
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

    public function delete_fund() {
        if ($this->input->post()) {
            
            $fund_id = (int) $this->input->post('id');

            //Last Fund can't be deleted
            $fund = $this->fund_model->get($fund_id);
            $fund_list = $this->fund_model->getList($fund->church_id,$fund->campus_id);
            if($fund->is_active == 1 && count($fund_list) == 1){
                output_json([
                    'status'  => false,
                    'message' => "Removing all funds is not allowed, we need to keep at least one"
                ]);
                return;
            }

            //Validation Fund
            $fund_donations = $this->db->select('count(tf.net) count_donations')
                ->where('tf.fund_id', $fund_id)
                ->from('transactions_funds tf')->get()->row();

            if($fund_donations){
                if($fund_donations->count_donations > 0) {
                    output_json([
                        'status'  => false,
                        'message' => "This Fund can't be deleted"
                    ]);
                    return;
                }
            }

            $result = $this->fund_model->delete($fund_id);

            if($result == true){
                $user_id = $this->session->userdata('user_id');

                $this->load->model('chat_setting_model');
                $this->load->model('page_model');
                $this->chat_setting_model->removeAutomaticallyFromConduitFund($user_id,$fund->church_id,$fund->campus_id,$fund_id);
                $this->page_model->removeAutomaticallyFromConduitFund($user_id,$fund->church_id,$fund->campus_id,$fund_id);
                
                output_json([
                    'status'  => true,
                    'message' => sprintf(langx('deleted_success'), langx('fund'))
                ]);
                return;
            } else {
                output_json([
                    'status'  => false,
                    'message' => $result
                ]);
                return;
            }
        }
    }

    public function active_fund() {
        if ($this->input->post()) {

            $fund_id = (int) $this->input->post('id');
            $active = (int) $this->input->post('active');
            $user_id = $this->session->userdata('user_id');

            $fund = $this->fund_model->get($fund_id);

            if(!$active){
                $fund_list = $this->fund_model->getList($fund->church_id,$fund->campus_id);
                if(count($fund_list) == 1){
                    output_json([
                        'status'  => false,
                        'message' => "Inactivating all funds is not allowed, we need to keep at least one"
                    ]);
                    return;
                }
            }

            $result = $this->fund_model->active($fund_id,$active,$user_id);

            if($result == true) {
                //Automatically adding to Widget Conduit Funds
                $this->load->model('chat_setting_model');
                if($active) {
                    $this->chat_setting_model->addAutomaticallyToConduitFund($user_id,$fund->church_id,$fund->campus_id,$fund_id);
                } else {
                    $this->load->model('page_model');
                    $this->chat_setting_model->removeAutomaticallyFromConduitFund($user_id,$fund->church_id,$fund->campus_id,$fund_id);
                    $this->page_model->removeAutomaticallyFromConduitFund($user_id,$fund->church_id,$fund->campus_id,$fund_id);
                }
                output_json([
                    'status'  => true,
                    'message' => sprintf(langx($active == 1 ? 'Fund has been activated' : 'Fund has been inactivated'), langx('fund'))
                ]);
                return;
            } else {
                output_json([
                    'status'  => false,
                    'message' => $result
                ]);
                return;
            }
        }
    }

}
