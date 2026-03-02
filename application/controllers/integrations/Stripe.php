<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Stripe extends My_Controller {

    private $access_token     = null;
    private $client_id_stripe = STRIPE_OAUTH_CLIENT_ID;
    private $secret_id_stripe = STRIPE_OAUTH_SECRET;

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            die;
        }
        $this->load->model('user_model');
        $this->load->model('organization_model');
        $this->load->model('donation_model');
        $this->load->model('transaction_fund_model');
        $this->load->model('donor_model');
        $this->load->helper('planncenter');
        $this->load->model('invoice_model');
        $this->load->model('product_model');
        set_time_limit(0);
        ini_set('max_execution_time', 0);
    }
 
    //summary report after import completed
    private $import_summary = [
        'downloaded_cust_count' => 0,
        'downloaded_inv_count'  => 0,
        'downloaded_prod_count' => 0,
        'errors'                => [],
    ];
    
    private $customerCh = null;
    
    public function import_data() {
        $conn_data        = $this->getConnData();
        $conn_data_decode = json_decode($conn_data);
        $access_token     = $conn_data_decode->access_token;
        $this->getCustomers($access_token, 0);
        $this->getInvoices($access_token, 0);
        $this->stripeDataMap();
        
        output_json(['status' => true, 'message' => 'Download completed', 'import_summary' => $this->import_summary]);
    }

    //$limit holds the pagination size on stripe side
    private function getCustomers($access_token, $starting_after, $limit = 100) {
        if ($starting_after) {
            $params = '?starting_after=' . $starting_after . '&limit=' . $limit;
        } else {
            $params = '?limit=' . $limit;
        }
        
        $url = 'https://api.stripe.com/v1/customers' . $params;
        
        if (!$this->customerCh) {
            $this->customerCh  = curl_init();
            $request_headers[] = 'Content-Type: application/json';
            $request_headers[] = "Authorization: Bearer " . $access_token;
            curl_setopt($this->customerCh, CURLOPT_HTTPHEADER, $request_headers);
            curl_setopt($this->customerCh, CURLOPT_CUSTOMREQUEST, "GET");
            curl_setopt($this->customerCh, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($this->customerCh, CURLOPT_FOLLOWLOCATION, 1);
        }
        curl_setopt($this->customerCh, CURLOPT_URL, $url);
        $result          = curl_exec($this->customerCh);
        $result_stripe   = $result;
        $customersStripe = json_decode($result_stripe, true);
        $lastIndex       = count($customersStripe['data']) - 1;
        $customersLast   = $customersStripe['data'][$lastIndex];
        $lastCustomerId  = $customersLast['id'];        
        $sessiondata     = $this->session->userdata();
        $orgnx_id        = $sessiondata['currnt_org']['orgnx_id'];
        
        if (isset($customersStripe['data']) && $customersStripe['data']) {
            foreach ($customersStripe['data'] as $stripeCustomer) {
                
                $customerExists = $this->donor_model->getByStripeEmail($stripeCustomer['email']);
                
                if (!$customerExists) {
                    
                    $dataCustomer = [
                        'email'              => $stripeCustomer['email'],
                        'organization_id'    => $orgnx_id,                        
                        'first_name'         => $stripeCustomer['name'] ? $stripeCustomer['name'] : $stripeCustomer['email'],
                        'stripe_customer_id' => json_encode([$stripeCustomer['id']]),
                    ];
                    
                    try {
                        $response = $this->donor_model->save($dataCustomer);
                        if($response['status']) {
                            $this->import_summary['downloaded_cust_count'] ++;
                        } else {
                            $this->import_summary['errors'][] = $response['errors'];
                            continue;
                        }
                    } catch (Exception $exc) {
                        $this->import_summary['errors'][] = $exc->getMessage();
                        continue;
                    }
                    
                } else {                    
                    
                    $new_stripe_id_arr = json_decode($customerExists->stripe_customer_id);
                    if (!in_array($stripeCustomer['id'], $new_stripe_id_arr)) {
                        $new_stripe_id_arr[] = $stripeCustomer['id'];
                        $update_data         = [
                            'id'                 => $customerExists->id,
                            'stripe_customer_id' => json_encode($new_stripe_id_arr),
                            'email'              => $customerExists->email
                        ];
                      
                        $this->donor_model->update_profile($update_data);                       
                    }
                }
            }
        }
        
        if ($customersStripe['has_more']) {
            $this->getCustomers($access_token, $lastCustomerId);
        }        
    }
    
    private  $stripe_invoices_arr = [];
    
    //$limit holds the pagination size on stripe side
    private function getInvoices($access_token, $starting_after, $limit = 100) {
        if ($starting_after) {
            $params = '?starting_after=' . $starting_after . '&limit=' . $limit;
        } else {
            $params = '?limit=' . $limit;
        }
        $url               = 'https://api.stripe.com/v1/invoices' . $params;
        $ch                = curl_init();
        $request_headers[] = 'Content-Type: application/json';
        $request_headers[] = "Authorization: Bearer " . $access_token;
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_URL, $url);
        $result            = curl_exec($ch);
        curl_close($ch);
        $invoicearr        = json_decode($result, true);
        $lastIndex         = count($invoicearr['data']) - 1;
        $invoiceLast       = $invoicearr['data'][$lastIndex];
        $lastinvoceId      = $invoiceLast['id'];
        if (isset($invoicearr['data']) && $invoicearr['data']) {
            foreach ($invoicearr['data'] as $invoice) {
                $this->stripe_invoices_arr[] = $invoice;
            }
        }
        if ($invoicearr['has_more']) {
            $this->getInvoices($access_token, $lastinvoceId);
        }
    }
    private function stripeDataMap() {
        $sessiondata          = $this->session->userdata();
        $orgnx_id             = $sessiondata['currnt_org']['orgnx_id'];
        $localStripeCustomers = $this->donor_model->getAllByStripe(); //it gets all customers linked with organizations of the current session
        foreach ($localStripeCustomers as $localCustomer) {
            $stripeCustomerIdsArr = json_decode($localCustomer->stripe_customer_id);
            foreach ($stripeCustomerIdsArr as $stripeCustomerId) {
                foreach ($this->stripe_invoices_arr as $invoice) {
                    
                    $result_save_products_arr = [];
                    $products_id              = [];
                    $products_quantity        = [];
                    
                    if ($invoice['customer'] == $stripeCustomerId) {

                        $stripeInvId = $invoice['id'];

                        foreach ($invoice['lines']['data'] as $lines) {
                            $product_stripe_id = $lines['price']['product'];
                            $billing_period    = '';
                            if ($lines['price']['type'] == 'one_time') {
                                $recurrence = 'O';
                            } else if ($lines['price']['type'] == 'recurring') {
                                $recurrence     = 'R';
                                $interval       = $lines['price']['recurring']['interval'];
                                if ($interval == 'month')
                                    $billing_period = 'monthly';
                                else if ($interval == 'year')
                                    $billing_period = 'yearly';
                                else if ($interval == 'week')
                                    $billing_period = 'weekly';
                                else if ($interval == 'day')
                                    $billing_period = 'daily';
                            }

                            $product_exists = $this->product_model->getProductByStripeId($product_stripe_id);

                            if (isset($product_exists['id'])) {
                                $id_product = $product_exists['id'];
                            } else {
                                $id_product = null;
                            }
                            $save_data_product = [
                                'id'                => $id_product,
                                'organization_id'   => $orgnx_id,                                
                                'product_name'      => $lines['description'],
                                'price'             => round($lines['price']['unit_amount'] / 100, 2),
                                'recurrence'        => $recurrence,
                                'billing_period'    => $billing_period,
                                'product_stripe_id' => $product_stripe_id,
                            ];

                            $result_save_products_arr[] = $this->product_model->save($save_data_product, $this->session->userdata('user_id'));
                            $products_quantity_arr[]    = $lines['quantity'];
                        }
                        foreach ($result_save_products_arr as $products_id_row) {
                            $products_id[] = ($products_id_row['data']['id']);
                        }
                        foreach ($products_quantity_arr as $products_quantity_row) {
                            $products_quantity[] = $products_quantity_row;
                        }

                        $invoce_exists = $this->invoice_model->get_invoice_stripe($stripeInvId);
                        if (isset($invoce_exists['hash'])) {
                            $hash = $invoce_exists['hash'];
                        } else {
                            $hash = null;
                        }

                        $created_at   = $invoice['created'];
                        $due_date     = $invoice['due_date'] ? $invoice['due_date'] : $invoice['created'];
                        $finalized_at = $invoice['status_transitions']['finalized_at'] ? $invoice['status_transitions']['finalized_at'] : null;
                        $memo         = $invoice['description'];
                        $footer       = $invoice['footer'];
                        $total        = $invoice['total'];

                        $status = null;
                        
                        //draft, open, paid, uncollectible, or void
                        if ($invoice['status'] == 'draft') {
                            $status = Invoice_model::INVOICE_DRAFT_STATUS;
                        } elseif ($invoice['status'] == 'open') {
                            $status = Invoice_model::INVOICE_DRAFT_STATUS; //lets mark it as draft
                        } elseif ($invoice['status'] == 'paid') {
                            $status = Invoice_model::INVOICE_PAID_STATUS;
                        } elseif (in_array($invoice['status'], ['uncollectible', 'void'])) {
                            $status = Invoice_model::INVOICE_CANCELED_STATUS;
                        }
                        
                        $save_data = [
                            'hash'             => $hash,
                            'organization_id'  => $orgnx_id,
                            'account_donor_id' => $localCustomer->id,
                            'memo'             => $memo ? $memo : '',
                            'footer'           => $footer ? $footer : '',
                            'total_amount'     => round($total / 100, 2),
                            'status'           => $status,
                            'payment_options'  => ["CC", "BANK"],
                            'command'          => 'save_only',
                            'created_at'       => date('Y-m-d H:i:s', $created_at),
                            'due_date'         => date('Y-m-d H:i:s', $due_date),
                            'finalized'        => date('Y-m-d H:i:s', $finalized_at),
                            'stripe_id'        => $stripeInvId,
                            'product_id'       => $products_id,
                            'quantity'         => $products_quantity,
                        ];

                        $stripe_import = true;
                        $this->invoice_model->save($save_data, $this->session->userdata('user_id'), $stripe_import);                        
                    }
                }
            }
        }
    }

    public function oauthcomplete() {
        if ($this->input->get('code')) {
            $post         = 'client_secret=' . $this->secret_id_stripe . '&grant_type=authorization_code&code=' . $this->input->get('code');
            $ch           = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://connect.stripe.com/oauth/token");
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            $result       = curl_exec($ch);
            curl_close($ch);
            $result_array = (json_decode($result, true));
            if (isset($result_array['access_token'])) {
                $this->load->model('user_model');
                $save_data = ['stripe_oauth' => $result];
                $this->user_model->update($save_data, $this->session->userdata('user_id'));

                $conn_data = $this->getConnData();
                $conn_data = json_decode($conn_data);
            }
            redirect('settings/integrations/stripe');
        }
    }

    public function validatetoken() {
        $redirect     = BASE_URL . 'integrations/stripe/oauthcomplete';
        $conn_data    = $this->getConnData();
        $response     = $this->refreshoauthtoken($conn_data);
        $dataresponse = [
            'oauth_url'   => 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=' . $this->client_id_stripe . '&scope=read_write&redirect_uri=' . $redirect,
            'conn_status' => $response['status'], //===== true/false
            'message'     => isset($response['message']) ? $response['message'] : ''
        ];

        output_json($dataresponse);
    }

    private function getConnData() {
        $user_id = $this->session->userdata('user_id');
        return $this->user_model->get($user_id, 'id, stripe_oauth')->stripe_oauth;
    }

    public function disconnect() {
        $save_data['stripe_oauth'] = null;
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return output_json(['status' => true, 'message' => 'Logout!']);
    }

    private function refreshoauthtoken($conn_data = false) {
        if (!$conn_data) {
            $conn_data = $this->getConnData();
        }
        $conn_data = json_decode($conn_data);
        if (!$conn_data || !isset($conn_data->refresh_token)) {
            return ['status' => false, 'message' => 'No connection data found'];
        }
        $refresh_token = $conn_data->refresh_token;
        $post          = 'client_secret=' . $this->secret_id_stripe . '&grant_type=refresh_token&refresh_token=' . $refresh_token;
        $ch            = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://connect.stripe.com/oauth/token");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result        = curl_exec($ch);
        curl_close($ch);
        $resultstripe  = (json_decode($result, true));

        if (!isset($resultstripe['access_token'])) {
            return ['status' => false];
        }
        $save_data = ['stripe_oauth' => $result];
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return ['status' => true, 'Token refreshed'];
    }

}
