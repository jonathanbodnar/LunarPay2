<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Freshbooks extends My_Controller {

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
        $this->load->model('Invoice_products_model');
        $this->load->model('Donation_model');
        set_time_limit(0);
        ini_set('max_execution_time', 0);
    }

    private $push_summary         = [
        'push_cust_count'    => 0,
        'push_inv_count'     => 0,
        'push_payment_count' => 0,
        'errors'             => [],
    ];
    private $client_id_freshbooks = FRESHBOOKS_OAUTH_CLIENT_ID;
    private $secret_id_freshbooks = FRESHBOOKS_OAUTH_SECRET;

    public function oauthcomplete() {
        if ($this->input->get('code')) {

            $post         = 'client_id=' . $this->client_id_freshbooks . '&client_secret=' . $this->secret_id_freshbooks . '&grant_type=authorization_code&client_credentials grant type&code=' . $this->input->get('code') .
                    "&redirect_uri=" . BASE_URL . "integrations/freshbooks/oauthcomplete";
            $ch           = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://api.freshbooks.com/auth/oauth/token");
            curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            $result       = curl_exec($ch);
            curl_close($ch);
            $result_array = (json_decode($result, true));
            if (isset($result_array['access_token'])) {
                $this->load->model('user_model');
                $save_data     = ['freshbooks_oauth' => $result];
                $this->user_model->update($save_data, $this->session->userdata('user_id'));                
                $conn_data     = $this->getConnData();
                $conn_data     = json_decode($conn_data);                
            }
            redirect('settings/integrations/freshbooks');
        }
    }

    public function validatetoken() {
        $redirect     = BASE_URL . 'integrations/freshbooks/oauthcomplete';        
        $conn_data    = $this->getConnData();
        $response     = $this->refreshoauthtoken($conn_data);
        $dataresponse = [
            'oauth_url'   => 'https://auth.freshbooks.com/oauth/authorize/?response_type=code&redirect_uri=' . $redirect . '&client_id=' . $this->client_id_freshbooks,
            'conn_status' => $response['status'], //===== true/false
            'message'     => isset($response['message']) ? $response['message'] : ''
        ];
        output_json($dataresponse);
    }

    private function getConnData() {
        $user_id = $this->session->userdata('user_id');
        return $this->user_model->get($user_id, 'id, freshbooks_oauth')->freshbooks_oauth;
    }

    private function refreshoauthtoken($conn_data = false) {
        if (!$conn_data) {
            $conn_data = $this->getConnData();
        }
        $conn_data = json_decode($conn_data);
        if (!$conn_data || !isset($conn_data->refresh_token)) {
            return ['status' => false, 'message' => 'No connection data found'];
        }
        $refresh_token    = $conn_data->refresh_token;
        $post             = 'grant_type=refresh_token&client_id=' . $this->client_id_freshbooks . '&refresh_token=' . $refresh_token . '&client_secret=' . $this->secret_id_freshbooks .
                "&redirect_uri=" . BASE_URL . "integrations/freshbooks/oauthcomplete";
        $ch               = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.freshbooks.com/auth/oauth/token");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result           = curl_exec($ch);
        curl_close($ch);
        $resultfreshbooks = (json_decode($result, true));
        if (!isset($resultfreshbooks['access_token'])) {
            return ['status' => false];
        }
        $save_data = ['freshbooks_oauth' => $result];
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return ['status' => true, 'Token refreshed'];
    }

    public function disconnect() {
        $save_data['freshbooks_oauth'] = null;
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return output_json(['status' => true, 'message' => 'Logout!']);
    }

    public function push_data() {
        $sessiondata      = $this->session->userdata();
        $orgnx_id         = $sessiondata['currnt_org']['orgnx_id'];
        $orgnx_name       = $sessiondata['currnt_org']['orgName'];
        $conn_data        = $this->getConnData();
        $conn_data_decode = json_decode($conn_data);
        $access_token     = $conn_data_decode->access_token;
        $accointid        = $this->myaccounts($access_token);
        $result = $this->listclient($access_token, $accointid, 5, 1);
        
        if(isset($result['status']) && !$result['status']){
            output_json($result);
            return;
        }
        
        $data_arr         = [
            'orgnx_id' => $orgnx_id
        ];
        $userarr          = $this->donor_model->getWhere($data_arr, 'id,first_name, last_name, email,phone_code,phone,address');
        foreach ($userarr as $datauser) {
            $data      = [
                'client' => [
                    'fname'        => $datauser->first_name,
                    'lname'        => $datauser->last_name,
                    'email'        => $datauser->email,
                    'organization' => $orgnx_name,
                    'home_phone'   => $datauser->phone_code . $datauser->phone,
                    'p_street'     => $datauser->address
                ]
            ];
            $id        = $datauser->id;
            $emailuser = $datauser->email;

            if (!in_array($emailuser, $this->freshbooks_clients_arr)) {
                $string_body     = json_encode($data);
                $ch              = curl_init();
                $request_headers = [
                    'Authorization: Bearer ' . $access_token,
                    'Content-Type:application/json',
                    'Content-Length: ' . strlen($string_body),
                ];
                curl_setopt($ch, CURLOPT_URL, 'https://api.freshbooks.com/accounting/account/' . $accointid . '/users/clients');
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                curl_setopt($ch, CURLOPT_POSTFIELDS, $string_body);
                curl_setopt($ch, CURLOPT_HEADER, FALSE);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                $result          = curl_exec($ch);
                curl_close($ch);
                $clientarr       = json_decode($result, true);
                if (isset($clientarr['response']['errors'])) {
                    $this->push_summary['errors'][] = $clientarr['response']['errors']['0']['message'];
                } else {
                    $this->push_summary['push_cust_count']++;
                    $useridfreshbooks = $clientarr['response']['result']['client']['userid'];
                    $update_data      = [
                        'id'                 => $id,
                        'freshbooks_id_user' => $useridfreshbooks,
                    ];
                    $this->donor_model->update_profile($update_data, $this->session->userdata('user_id'));
                    $this->pushinvoice($access_token, $accointid, $id);
                }
            } else {
                $this->pushinvoice($access_token, $accointid, $id);
            }
        }
        output_json(['status' => true, 'message' => 'Push completed', 'push_summary' => $this->push_summary]);
    }
    private function myAccounts($access_token) {
        $url               = 'https://api.freshbooks.com/auth/api/v1/users/me';
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
        $result_array      = (json_decode($result, true));
        foreach ($result_array as $itemsaccount) {
            $accountid_arr = ($itemsaccount['roles']);
            foreach ($accountid_arr as $rowaccountid) {
                $accountid = $rowaccountid['accountid'];
            }
        }
        return $accountid;
    }
    private $freshbooks_clients_arr = [];
    private function listClient($access_token, $accointid, $perpage, $page) {
        if ($page == 1) {
            $params = '?per_page=' . $perpage . '&page=' . 1;
        } else {
            $params = '?per_page=' . $perpage . '&page=' . $page;
        }
        $url               = 'https://api.freshbooks.com/accounting/account/' . $accointid . '/users/clients' . $params;
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
        $result_array      = (json_decode($result, true));
        
        //d($result_array);
        
        if(isset($result_array['response']['errors']) && count($result_array['response']['errors'])) {
            return ['status' => false, 'message' => json_encode($result_array['response']['errors'])];            
        }
        if ($result_array['response']['result']['pages'] != 0) {
            foreach ($result_array['response']['result']['clients'] as $incliente) {
                $this->freshbooks_clients_arr[] = $incliente['email'];
            }
            if ($result_array['response']['result']['page'] != $result_array['response']['result']['pages']) {
                $page = $page + 1;
                $this->listclient($access_token, $accointid, 5, $page);
            }
        } 
    }

    private function pushInvoice($access_token, $accointid, $id) {
        $sessiondata  = $this->session->userdata();
        $orgnx_name   = $sessiondata['currnt_org']['orgName'];
        $data_invoice = $this->invoice_model->get_invoice_freshbooks_by_donor_id($id);
        if (isset($data_invoice)) {
            foreach ($data_invoice as $invoice) {
                
                $id_invoice            = $invoice->id;
                $status_invoice        = $invoice->status;
                if ($status_invoice == Invoice_model::INVOICE_DRAFT_STATUS) {
                    $status = 1; // "draft" status on freshbooks side                
                } elseif ($status_invoice == Invoice_model::INVOICE_PAID_STATUS) {
                    $status = 2; // "paid" status on freshbooks side //freshbooks documentation is not okay, it says paid = 4
                } elseif ($status_invoice == Invoice_model::INVOICE_UNPAID_STATUS || $status_invoice == Invoice_model::INVOICE_DUE_STATUS) {
                    $status = 1; // "draft" status on freshbooks side
                }
                
                $data_invoice_products = $this->Invoice_products_model->getList($id_invoice);

                $lines_arr = [];
                foreach ($data_invoice_products as $invoice_product) {
                    $lines_arr[] = ['amount'    => [
                            'code' => "USD"
                        ],
                        'name'      => $invoice_product->product_name,
                        'qty'       => $invoice_product->quantity,
                        'type'      => 0,
                        'unit_cost' => [
                            'amount' => $invoice_product->product_inv_price,
                            'code'   => "USD"
                        ],
                    ];
                }
                $freshbooks_id_user = $invoice->freshbooks_id_user;
                $datainvoicepush    = ['invoice' => [
                        'due_offset_days'   => 30,
                        'sender_name'       => null,
                        'invoiceid'         => null,
                        'invoice_client_id' => null,
                        'language'          => 'en',
                        'last_order_status' => null,
                        'city'              => '',
                        'country'           => 'United States',
                        'create_date'       => $invoice->created_at,
                        'currency_code'     => 'USD',
                        'discount_value'    => 0,
                        'notes'             => $invoice->memo,
                        'status'            => $status,
                        'organization'      => $orgnx_name,
                        'lines'             => $lines_arr,
                        'customerid'        => $freshbooks_id_user
                    ]
                ];
                $string_body        = json_encode($datainvoicepush, true);
                $ch                 = curl_init();
                $request_headers    = [
                    'Authorization: Bearer ' . $access_token,
                    'Content-Type:application/json',
                    'Content-Length: ' . strlen($string_body),
                ];
                curl_setopt($ch, CURLOPT_URL, 'https://api.freshbooks.com/accounting/account/' . $accointid . '/invoices/invoices');
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
                curl_setopt($ch, CURLOPT_POSTFIELDS, $string_body);
                curl_setopt($ch, CURLOPT_HEADER, FALSE);
                curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                $result             = curl_exec($ch);
                curl_close($ch);
                $result_invoice_arr = json_decode($result, true);
                if (isset($result_invoice_arr['response']['errors'])) {
                    $this->push_summary['errors'][] = $result_invoice_arr['response']['errors']['0']['message'].'-'.$id_invoice.'|' ;
                } else {
                    $update_data  = [
                        'freshbooks_id' => $result_invoice_arr['response']['result']['invoice']['invoiceid'],
                    ];
                    $this->invoice_model->update_invoice_freshbooks_id($update_data, $id_invoice);
                    $donation_arr = $this->Donation_model->getDonationsToFreshbooks($id_invoice);
                    $this->pushpaymentwithinvoice($donation_arr, $access_token, $accointid, $result_invoice_arr['response']['result']['invoice']['invoiceid']);
                    $this->push_summary['push_inv_count']++;
                }
            }
        }
    }

    private function pushpaymentwithinvoice($donation_arr, $access_token, $accointid, $idinvoicefreshbooks) {
        foreach ($donation_arr as $donation) {
            $src = $donation->src;
            if ($src == 'CC') {
                $src = 'Credit Card';
            } elseif ($src == 'BNK') {
                $src = 'Bank Transfer';
            } elseif ($src == 'Cash') {
                $src = 'Cash';
            } elseif ($src == 'Check') {
                $src = 'Check';
            } else {
                $src = 'Other';
            }

            $data_payment = [
                'payment' => [
                    'invoiceid' => $idinvoicefreshbooks,
                    'amount'    => [
                        'amount' => $donation->amount,
                    ],
                    'date'      => $donation->created_at,
                    'type'      => $src,
                ],
            ];
            $result       = ($this->curlFreshbooks($access_token, 'https://api.freshbooks.com/accounting/account/' . $accointid . '/payments/payments', $data_payment, 'POST'));
            $result_payment = json_decode($result, true);
            
            if (isset($result_payment['response']['errors'])) {
                $this->push_summary['errors'][] = $result_payment['response']['errors']['0']['message'];
            } else {
                $trx_fund_upd = ['id' => $donation->trx_fund_id, 'freshbooks_last_update' => date('Y-m-d H:i:s'), 'freshbooks_pushed' => 'Y'];
                $this->transaction_fund_model->update($trx_fund_upd);
                $this->push_summary['push_payment_count']++;
            }
        }
    }

    private function curlFreshbooks($access_token, $url_freshbooks, $data, $type) {
        $ch              = curl_init();
        $string_body     = json_encode($data, true);
        $request_headers = [
            'Authorization: Bearer ' . $access_token,
            'Content-Type:application/json',
            'Content-Length: ' . strlen($string_body),
        ];

        curl_setopt($ch, CURLOPT_URL, $url_freshbooks);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $type);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $string_body);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $result = curl_exec($ch);
        curl_close($ch);
        return $result;
    }

}
