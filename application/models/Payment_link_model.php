<?php

defined('BASEPATH') OR exit('No direct script access allowed');
function paStatusAsHtmlString($invoiceStatus) {
    return Payment_link_model::LINK_STATUS_STRING_HTML[$invoiceStatus];
}
function paCreateLink($hash){
    return Payment_link_model::PAYMENT_LINK_URL.$hash;
}

function paCoverFeeAsString($value) {
    return $value ? 'Yes' : 'No';
}

function paCreator($customer_email) {
    if($customer_email) {
        return $customer_email;
    } else {
        return 'Admin';
    }    
}

class Payment_link_model extends CI_Model {

    private $table = 'payment_links';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string
    const HASH_SIZE = 128; 
    const PAYMENT_LINK_URL= CUSTOMER_APP_BASE_URL.'c/portal/payment_link/';
    
    const LINK_ACTIVE   = 1;
    const LINK_DEACTIVATED   =  0;
    
    const LINK_STATUS_STRING = [//For presenting to the final user*
        Payment_link_model::LINK_ACTIVE  => 'ACTIVE',
        Payment_link_model::LINK_DEACTIVATED => 'DEACTIVATED',
    ];
    
    const LINK_STATUS_STRING_HTML = [//For presenting to the final user as html badge
        Payment_link_model::LINK_ACTIVE  => '<span class="badge badge-primary " style="width: 60px">Active</span>',
        Payment_link_model::LINK_DEACTIVATED => '<span class="badge badge-secondary" style="width: 60px">Deactivated</span>',
    ];

    public function __construct() {
        parent::__construct();
    }

    private function beforeSave($data){
        return $data;
    }

    public function getDt() {
        
        $this->load->model('product_model');        
        $user_id  = $this->session->userdata('user_id');
        $orgnx_id = $this->input->post('organization_id');
        $suborgnx_id = $this->input->post('sub_organization_id');
        $this->load->library("Datatables");   
        
        if ($orgnx_id) {
            $this->datatables->where('l.church_id', $orgnx_id ); //chrus = organization campus= sub
        }
        
        if ($suborgnx_id) {
            $this->datatables->where('l.campus_id', $suborgnx_id);
        } else {
            $this->datatables->where('l.campus_id', null);
        }
        
        $this->datatables->select("l.client_id AS client_id, count(0) AS product_total,l.id AS id,l.hash as _link_url,
        l.status, l.created_at,1 AS options,DATE_FORMAT(l.created_at, '%m/%d/%Y') as created_at_formatted, l.cover_fee,
        l.customer_email as creator")

        ->where('l.client_id', $user_id)
        ->where('l.status', 1)
        ->where('l.is_internal', null)
        ->from('payment_links l') 
        ->join('payment_link_products pl', 'pl.payment_link_id = l.id','inner')
        ->join('products p', 'p.id = pl.product_id','left')
        ->group_by("l.id");
      
        $this->datatables->edit_column('status', '$1', 'paStatusAsHtmlString(status)');  
        $this->datatables->add_column('_link_url', '$1', 'paCreateLink(_link_url)');
        $this->datatables->add_column('_creator', '$1', 'paCreator(creator)'); 
        $this->datatables->edit_column('cover_fee', '$1', 'paCoverFeeAsString(cover_fee)');  
        
        //$data = $this->datatables->generate();        
       $data = $this->datatables->generate(
            [
                "var_config"  => ['product_model' => $this->product_model->getConstants()]
            ]);
        
        return $data;
    }

    public function remove($id, $user_id) {
        $link = $this->get($id, $user_id);
        if (!$link) { 
            return ['status' => false, 'message' => ''];
        }
        $this->db->where('id', $id)  
        ->where('client_id', $user_id)
        ->update($this->table, ['status' => 0]);
        return ['status' => true, 'message' => 'Link removed'];
    }

    public function get($id, $user_id = null) {
        $this->db->select("l.client_id")
        ->where('l.client_id', $user_id)
        ->where('l.id', $id)
            ->where('l.status',1)
            ->from($this->table. ' l')
        ->join('church_detail c', 'c.ch_id = l.church_id');
        return $this->db->get()->row();
    }

    //This function is called for customer api //$includeTrxnIds can be an int or an array
    public function getByHash($hash, $includeTrxnIds = null) {
                
        $paymentLink = $this->db->select('id, church_id, campus_id, payment_methods, hash, cover_fee, trial_days, post_purchase_link, show_post_purchase_link')
            ->where('hash', $hash)->where('status', 1)
            ->get($this->table.' as pl')->row();

        if ($paymentLink) {

            $this->load->model('donation_model');
            $this->load->model('payment_link_product_model');

            $products = $this->payment_link_product_model->getList($paymentLink->id);

            $paymentLink->products = $products ? $products : [];
            
            $paymentLink->payments = [];

            if($includeTrxnIds) { //including transaction id will retrieve products_paid, thats products with qtys and prices defined at the moment of the payment
                $this->load->model('payment_link_product_paid_model');
                $productsPaid = $this->payment_link_product_paid_model->getListBy('transaction', $includeTrxnIds);
                
                $paymentLink->products_paid = $productsPaid ? $productsPaid : [];

                $includeFailed = true;
                $payments = $this->donation_model->getByIds($includeTrxnIds, $includeFailed);
                $paymentLink->payments = $payments ? $payments : [];
            }
            
            // ---- get organization, suborganization, an customer data all from an invoice. All data in one package
            $this->load->model('organization_model');
            $paymentLink->organization = $this->organization_model->get($paymentLink->church_id, 
                    'ch_id, client_id, church_name as name, phone_no, website, street_address, street_address_suite, city, state, postal, fortis_template');                    
            
            $this->load->helper('fortis'); //check if fees_template are being used some where
            $paymentLink->organization->fees_template = $paymentLink->organization->fortis_template ? getFortisTplParams($paymentLink->organization->fortis_template) : null;
           
            $this->load->model('orgnx_onboard_psf_model');
            $onboard = $this->orgnx_onboard_psf_model->getByOrg($paymentLink->organization->ch_id, $paymentLink->organization->client_id, 'region');
            
            $paymentLink->organization->region = $onboard ? $onboard->region : null;
            
            $this->load->model('suborganization_model');
            $paymentLink->suborganization = $this->suborganization_model->get($paymentLink->campus_id, false, 'name, phone as phone_no');
            
        }

        return $paymentLink;
    }

    public function getByHashSimple($hash, $orgId = null, $client_id = false) {
        $client_id = $client_id ? $client_id : $this->session->userdata('user_id');
        $orgnx_ids     = getOrganizationsIds($client_id);

        if($orgId) { //just securing the when we need to get a specific link of an specific organization even when the client_id is validated
            $this->db->where('pl.church_id', $orgId);
        }
            
        $link = $this->db->select('pl.id, pl.created_at, pl.church_id, pl.campus_id, pl.hash, pl.status, pl.payment_methods, cover_fee,
                                   pl.customer_email as creator, is_internal, trial_days, post_purchase_link, show_post_purchase_link')                
                ->where('pl.hash', $hash)
                ->where_in('pl.church_id', explode(',', $orgnx_ids))
                ->where('pl.status', 1)
                ->get($this->table . ' pl')->row();
        return $link;
    }

    //include_trxn_ids can be an int or an array
    public function getById($id, $client_id = false, $include_trxn_ids = false) {

        $client_id = $client_id ? $client_id : $this->session->userdata('user_id');
        $orgnx_ids     = getOrganizationsIds($client_id);
            
        $link = $this->db->select('pl.id, pl.created_at, pl.church_id, pl.campus_id, pl.hash, pl.status, pl.payment_methods, cover_fee,
                                   pl.customer_email as creator, is_internal, trial_days, post_purchase_link, show_post_purchase_link')                
                ->where('pl.id', $id)
                ->where_in('pl.church_id', explode(',', $orgnx_ids))
                ->where('pl.status', 1)
                ->get($this->table . ' pl')->row();
        
        if ($link) {
            $link->_creator = paCreator($link->creator);
            $link->_link_url = paCreateLink($link->hash);
            $link->_status = paStatusAsHtmlString($link->status);
            $this->load->model('payment_link_product_model');
            $products = $this->payment_link_product_model->getList($link->id);            
            $link->products =  $products ? $products : [];
            
            if ($include_trxn_ids) {
                $this->load->model('payment_link_product_paid_model');
                $products_paid       = $this->payment_link_product_paid_model->getListBy('transaction', $include_trxn_ids);
                $link->products_paid = $products_paid ? $products_paid : [];
            }

            $this->load->model('organization_model');
            $link->organization = $this->organization_model->get($link->church_id, 
                    'ch_id, client_id, church_name as name, phone_no, website, street_address, street_address_suite, city, state, postal, paysafe_template');
            
            $this->load->model('suborganization_model');
            $link->suborganization = $this->suborganization_model->get($link->campus_id, false, 'name, phone as phone_no');
        }
         
        return $link;
    }
    
    public function getWhere($where, $row = false, $select = false) {
        if($select) {
            $this->db->select($select);
        } 
        
        $this->db->where($where);
        
        if($row) {
            return $this->db->get($this->table)->row();
        }
        
        return $this->db->get($this->table)->result();
        
    }
    
    public function save($data, $client_id = false) {
        $val_messages    = [];
       
        if(!isset($data['products'])){
            $val_messages [] = langx('At least one Product is required to create a payment link');
        }

        if(isset($data['trial_days'])) {
            if(!is_numeric($data['trial_days'])) {
                $val_messages [] = langx('The trial days must be a numeric value');
            } else if($data['trial_days'] < 0) {
                $val_messages [] = langx('The trial days must be a positive value');
            }            
        }

        // Validate post purchase link contains https
        if(isset($data['show_post_purchase_link']) && $data['show_post_purchase_link'] && isset($data['post_purchase_url']) && !empty($data['post_purchase_url'])) {
            if(!str_starts_with($data['post_purchase_url'], 'https://')) {
                $val_messages [] = langx('Post purchase link must use HTTPS');
            }
        }

        if(count($val_messages)==0){
            if (!isset($data['organization_id']) || !$data['organization_id']){
                throw new Exception('The Company field is required');
            }
            $client_id = $client_id ? $client_id : $this->session->userdata('user_id');
            $orgnx_ids     = getOrganizationsIds($client_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }

            $hash = uniqid();
            $this->db->trans_start();
                $this->db->insert($this->table, array(
                    'client_id'=>$client_id,
                    'hash'=>$hash,
                    'church_id'=>$data['organization_id'],
                    'status'=>1,
                    'campus_id'=>isset($data['suborganization_id']) && $data['suborganization_id'] ? $data['suborganization_id'] : null,
                    'payment_methods'=> json_encode($data['payment_options']),
                    'cover_fee' => isset($data['cover_fee']) && $data['cover_fee'] ? 1 : null,
                    'customer_id' => !empty($data['customer_id']) ? $data['customer_id'] : null,
                    'customer_email' => !empty($data['customer_email']) ? $data['customer_email'] : null,
                    'is_internal' => isset($data['is_internal']) && $data['is_internal'] ? 1 : null,
                    'trial_days' => isset($data['trial_days']) ? $data['trial_days'] : null,
                    'show_post_purchase_link' => isset($data['show_post_purchase_link']) ? 1 : null,
                    'post_purchase_link' => isset($data['post_purchase_url']) ? $data['post_purchase_url'] : null,
                    'created_at'=>date('Y-m-d H:i:s')
                ));                
                $payment_link_id = $this->db->insert_id();   
                $this->load->model('payment_link_product_model');
                foreach ($data['products'] as $value) {
                    $this->payment_link_product_model->save(array(
                        'payment_link_id'=>$payment_link_id,
                        'product_id'=>$value['product_id'],
                        'product_name'=>$value['product_name'],
                        'product_price'=>$value['product_price'],
                        'qty'=>$value['quantity'],
                        'is_editable'=> isset($value['editable']) && $value['editable']=='true' ? 1 : 0
                    ));
                }
            $this->db->trans_complete();
            if ($this->db->trans_status() === FALSE) {
                throw new Exception('Database transaction error');
            }
            return [
                'status'       => true,
                'message'      => langx('Link Created'),
                'link'         => paCreateLink($hash),
                'hash'         => $hash
            ];
        }else {
            return [
                'status'  => false,
                'message' => langx('Validation error found'),
                'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
            ];
        }
    }
    
    public function update($data, $client_id = false) {
        $client_id = $client_id ? $client_id : $this->session->userdata('user_id');
        
        return [
            'status'       => true,
            'message'      => langx('Payment link updated'),
        ];

    }
}
 


 