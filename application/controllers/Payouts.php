<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Payouts extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);
    }

    public function index() {
        $this->load->model('organization_model');

        $this->template_data['title'] = langx("payouts");

        if ($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_EPICPAY_SHORT) {
            $this->template_data['organizations'] = $this->organization_model->getList(['ch_id', 'church_name'], 'ch_id ASC');
            $view                                 = $this->load->view('payout/payout', ['view_data' => $this->template_data], true);
        } else if ($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
            
            $this->load->model('orgnx_onboard_psf_model');
            $user_id = $this->session->userdata('user_id');
            $backoffice_user = $this->orgnx_onboard_psf_model->getBackofficeUser($user_id);
            
            $this->template_data['backoffice_url'] = PAYSAFE_NETBANX_URL;
            $this->template_data['email']          = $backoffice_user && $backoffice_user->backoffice_email ? $backoffice_user->backoffice_email : null;
            $view                                  = $this->load->view('payout/payout_psf', ['view_data' => $this->template_data], true);
        } else if ($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_FORTIS_SHORT) {
            
            $this->template_data['organizations'] = $this->organization_model->getList(['ch_id', 'church_name'], 'ch_id ASC');
            $view                                 = $this->load->view('payout/payout_fts', ['view_data' => $this->template_data], true);
        }

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }
    
    public function get_dt() {

        require_once 'application/controllers/extensions/Payments.php';

        $church_id = $this->session->userdata('currnt_org')['orgnx_id'];
        $user_id   = $this->session->userdata('user_id');
        //$churchid = 344;

        $requestBody['month'] = $_POST['month'];
       
        $response = ['draw' => 0, "recordsTotal" => 0, 'recordsFiltered' => 0, 'data' => []];

        if ($church_id == 0) {
            echo json_encode($response);
            die;
        }

        $result = Payments::getPayouts($church_id, $user_id, $requestBody);

        $dtDraw = intval($this->input->post("draw"));

        $data = $result["result"]->data;

        $dtTotal = count($data);

        usort($data, "custom_sort_desc_created_ts");

        $response = ['draw' => $dtDraw, "recordsTotal" => $dtTotal, 'recordsFiltered' => $dtTotal, 'data' => $data];

        echo json_encode($response);
    }

    //when type is bank the the payoutid contains the transaction id
    public function detail($payoutId, $type = 'cc')
    {

        require_once 'application/controllers/extensions/Payments.php';

        $userId = $this->session->userdata('user_id');
        $orgId = $this->session->userdata('currnt_org')['orgnx_id'];

        $payout = Payments::getPayout($orgId, $userId, $payoutId, $type);
        
        if(!$payout) {
            show_404();
        }
        
        $trnxs = null;
        if ($type == 'cc') {
            $trnxs = Payments::getPayoutCcTransactions($orgId, $userId, $payoutId);
        } else if ($type == 'bank') {
            $trnxs = Payments::getPayoutBankTransaction($orgId, $userId, $payoutId);
        }

        $this->template_data['payout'] = $payout['response']->data;
        $this->template_data['trxns'] = $trnxs['response']->list;
        
        $view = $this->load->view('payout/detail_fts', ['view_data' => $this->template_data], true);
        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);
         
    }
}
