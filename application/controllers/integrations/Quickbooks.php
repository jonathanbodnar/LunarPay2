<?php

defined('BASEPATH') OR exit('No direct script access allowed');

use QuickBooksOnline\API\DataService\DataService;
use QuickBooksOnline\API\Core\OAuth\OAuth2\OAuth2LoginHelper;
use QuickBooksOnline\API\Facades\Line;
use QuickBooksOnline\API\Facades\Customer;
use QuickBooksOnline\API\Facades\Item;
use QuickBooksOnline\API\Facades\Invoice;
use QuickBooksOnline\API\Facades\Payment;
use QuickBooksOnline\API\Data\IPPPaymentMethod;

class quickbooks extends My_Controller {

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
        $this->load->model('invoice_products_model');
        $this->load->model('Donation_model');
        set_time_limit(0);
        ini_set('max_execution_time', 0);
    }

    private $push_summary         = [
        'push_cust_count'    => 0,
        'push_inv_count'     => 0,
        'push_item_count'    => 0,
        'push_payment_count' => 0,
        'errors'             => [],
    ];
    private $client_id_quickbooks = QUICKBOOKS_OAUTH_CLIENT_ID;
    private $secret_id_quickbooks = QUICKBOOKS_OAUTH_SECRET;

    public function oauthcomplete() {
        if ($this->input->get('code')) {
            $dataService       = DataService::Configure(array(
                        'auth_mode'    => 'oauth2',
                        'ClientID'     => $this->client_id_quickbooks,
                        'ClientSecret' => $this->secret_id_quickbooks,
                        'RedirectURI'  => BASE_URL . 'integrations/quickbooks/oauthcomplete',
                        'scope'        => 'com.intuit.quickbooks.accounting',
                        'baseUrl'      => "development"
            ));
            $OAuth2LoginHelper = $dataService->getOAuth2LoginHelper();
            $accessTokenObj    = $OAuth2LoginHelper->exchangeAuthorizationCodeForToken($this->input->get('code'), $this->input->get('realmId'));
            $accessTokenValue  = $accessTokenObj->getAccessToken();
            $refreshTokenValue = $accessTokenObj->getRefreshToken();

            $data = [
                'access_token'  => $accessTokenValue,
                'refresh_token' => $refreshTokenValue,
                'realmId'       => $this->input->get('realmId'),
            ];

            if (isset($accessTokenValue)) {
                $this->load->model('user_model');
                $save_data = ['quickbooks_oauth' => json_encode($data, true)];
                $this->user_model->update($save_data, $this->session->userdata('user_id'));
            }
            redirect('settings/integrations/quickbooks');
        }
    }

    private function refreshoauthtoken($conn_data = false) {
        if (!$conn_data) {
            $conn_data = $this->getConnData();
        }
        $conn_data_arr = json_decode($conn_data);
        if (!$conn_data_arr || !isset($conn_data_arr->refresh_token)) {
            return ['status' => false, 'message' => 'No connection data found'];
        }
        $RefreshTokenValue = $conn_data_arr->refresh_token;
        $realmId           = $conn_data_arr->realmId;
        $oauth2LoginHelper = new OAuth2LoginHelper($this->client_id_quickbooks, $this->secret_id_quickbooks);
        $accessTokenObj    = $oauth2LoginHelper->refreshAccessTokenWithRefreshToken($RefreshTokenValue);
        $accessTokenValue  = $accessTokenObj->getAccessToken();
        $refreshTokenValue = $accessTokenObj->getRefreshToken();
        if (!isset($refreshTokenValue)) {
            return ['status' => false];
        }
        $data      = [
            'access_token'  => $accessTokenValue,
            'refresh_token' => $refreshTokenValue,
            'realmId'       => $realmId
        ];
        $save_data = ['quickbooks_oauth' => json_encode($data, true)];
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return ['status' => true, 'Token refreshed'];
    }

    public function validatetoken() {
        $dataService          = DataService::Configure(array(
                    'auth_mode'    => 'oauth2',
                    'ClientID'     => $this->client_id_quickbooks,
                    'ClientSecret' => $this->secret_id_quickbooks,
                    'RedirectURI'  => BASE_URL . 'integrations/quickbooks/oauthcomplete',
                    'scope'        => 'com.intuit.quickbooks.accounting',
                    'baseUrl'      => "development"
        ));
        $OAuth2LoginHelper    = $dataService->getOAuth2LoginHelper();
        $authorizationCodeUrl = $OAuth2LoginHelper->getAuthorizationCodeURL();

        $conn_data    = $this->getConnData();
        $response     = $this->refreshoauthtoken($conn_data);
        $dataresponse = [
            'oauth_url'   => $authorizationCodeUrl,
            'conn_status' => $response['status'], //===== true/false
            'message'     => isset($response['message']) ? $response['message'] : ''
        ];

        output_json($dataresponse);
    }

    private function getConnData() {
        $user_id = $this->session->userdata('user_id');
        return $this->user_model->get($user_id, 'id, quickbooks_oauth')->quickbooks_oauth;
    }

    public function disconnect() {
        $save_data['quickbooks_oauth'] = null;
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return output_json(['status' => true, 'message' => 'Logout!']);
    }

    public function push_data() {
        $conn_data     = $this->getConnData();
        $conn_data_arr = json_decode($conn_data);
        $sessiondata   = $this->session->userdata();
        $orgnx_id      = $sessiondata['currnt_org']['orgnx_id'];
        $orgnx_name    = $sessiondata['currnt_org']['orgName'];
        $this->listCustomer();
        $this->listitem();
        $this->pushproducts();
        $this->createpaymentmethod();
        $dataService   = $this->dataServ();
        $data_arr      = [
            'orgnx_id' => $orgnx_id
        ];
        $userarr       = $this->donor_model->getWhere($data_arr, 'id,first_name, last_name, email,phone_code,phone,address,city');
        foreach ($userarr as $donor) {
            $customerObj = Customer::create([
                        "BillAddr"         => [
                            "Line1" => $donor->address,
                            "City"  => $donor->city,
                        ],
                
                        "Notes"            => "Imported from ".COMPANY_NAME,
                        "GivenName"        => $donor->first_name,
                        "FamilyName"       => $donor->last_name,                        
                        "DisplayName"      => $donor->email,
                        "CompanyName"      => $orgnx_name,
                        "PrimaryPhone"     => [
                            "FreeFormNumber" => $donor->phone_code . $donor->phone,
                        ],
                        "PrimaryEmailAddr" => [
                            "Address" => $donor->email
                        ]
            ]);
            $donorid          = $donor->id;
            $emailuser   = $donor->email;
            if (!in_array($emailuser, $this->quickbooks_clients_arr)) {
                $resultingCustomerObj = $dataService->Add($customerObj); // Push data customer
                $error                = $dataService->getLastError();
                if ($error) {
                    $this->import_summary['errors'][] = $error->getResponseBody();
                } else {
                    $customeridquickbooks = $resultingCustomerObj->Id;

                    $update_data = [
                        'id'                 => $donorid,
                        'quickbooks_id_user' => $customeridquickbooks,
                    ];
                    $this->donor_model->update_profile($update_data, $this->session->userdata('user_id'));
                    $this->push_summary['push_cust_count']++;
                    $this->pushInvoice($donorid);
                }
            } else {
                $this->pushInvoice($donorid); 
            }
        }
        $this->pushpayment();
        output_json(['status' => true, 'message' => 'Push completed', 'push_summary' => $this->push_summary]);
    }

    private $quickbooks_clients_arr = [];
    
    private function listCustomer() {
        $dataService      = $this->dataServ();
        $dataService->CreateNewBatch();
        $totalofcustomers = $dataService->Query("SELECT COUNT(*) FROM CUSTOMER");
        //Definir lo maximo posible  en el STARTPOSITION buscar el maximo
        for ($i = 1; $i < $totalofcustomers; $i += 10) {
            $datacustomer = $dataService->Query("SELECT * FROM CUSTOMER STARTPOSITION " . $i . " MAXRESULTS 10");
            foreach ($datacustomer as $customer) {
                if (isset($customer->PrimaryEmailAddr->Address)) {
                    $this->quickbooks_clients_arr [] = $customer->PrimaryEmailAddr->Address;
                }
            }
        }
    }

    private function pushInvoice($donorid) {
        $dataService  = $this->dataServ();
        $data_invoice = $this->invoice_model->get_invoice_quickbooks_not_pushed_by_donor_id($donorid);
        foreach ($data_invoice as $invoice) {
            $idinvoice             = $invoice->id;
            $custumeremail         = $invoice->email;
            $quickbooks_id_user    = $invoice->quickbooks_id_user;
            $data_invoice_products = $this->invoice_products_model->getList($idinvoice);

            if (count($data_invoice_products) > 0) {
                $i         = 1;
                $lineArray = array();
                foreach ($data_invoice_products as $product) {

                    $idproductquickbooks = $product->product_quickbooks_id;
                    $price               = $product->product_inv_price;
                    $quantity            = $product->quantity;

                    $LineObj = Line::create([
                                "Id"                  => $i,
                                "LineNum"             => $i,
                                "Amount"              => ($quantity * $price),
                                "DetailType"          => "SalesItemLineDetail",
                                "SalesItemLineDetail" => [
                                    "ItemRef"   => [
                                        "value" => $idproductquickbooks
                                    ],
                                    "Qty"       => $quantity,
                                    "UnitPrice" => $price,
                                ]
                    ]);

                    $lineArray[] = $LineObj;
                    $i           = $i + 1;
                }
                $theResourceObj = Invoice::create([
                            "Line"        => $lineArray,
                            "CustomerRef" => [
                                "value" => $quickbooks_id_user
                            ],
                            "BillEmail"   => [
                                "Address" => $custumeremail
                            ]
                ]);

                $resultingObj = $dataService->Add($theResourceObj);
                $error        = $dataService->getLastError();
                if ($error) {
                    $this->import_summary['errors'][] = $error->getResponseBody();
                } else {

                    $update_data = [
                        'quickbooks_id' => $resultingObj->Id,
                    ];
                    $this->invoice_model->update_invoice_quickbooks_id($update_data, $idinvoice);
                    $this->push_summary['push_inv_count']++;
                }
            }
        }
    }

    private function pushproducts() {
        $dataService   = $this->dataServ();
        $data_products = $this->product_model->getProductsNotPushedByquickbooks();
        foreach ($data_products as $product) {
            $idproduct             = $product->id;
            $nameproduct           = $product->name;
            $product_quickbooks_id = $product->product_quickbooks_id;
            foreach ($this->quickbooks_item_arr as $itemquickbooks) {
                $itemnamequickbooks = $itemquickbooks['name'];
                $itemidquickbooks   = $itemquickbooks['id'];
                if ($nameproduct == $itemnamequickbooks && $product_quickbooks_id == null) {
                    $update_data = [
                        'product_quickbooks_id' => $itemidquickbooks
                    ];
                    $this->product_model->getupdateProductByquickbooks($update_data, $idproduct);
                }
            }
        }

        $data_products_review = $this->product_model->getProductsNotPushedByquickbooks();
        foreach ($data_products_review as $product_review) {

            $idproduct_review        = $product_review->id;
            $nameproduct_review      = $product_review->name;
            $desproduct_review       = $product_review->name;
            $unitPriceproduct_review = $product_review->price;

            $Item         = Item::create([
                        "Name"             => $nameproduct_review,
                        "Description"      => 'Product import of LunaryPay ' . $desproduct_review,
                        "Active"           => true,
                        "UnitPrice"        => $unitPriceproduct_review,
                        "Type"             => "NonInventory",
                        "IncomeAccountRef" => 1, // Reference to the posting account, 1 Services              
            ]);
            $resultingObj = $dataService->Add($Item);
            $error        = $dataService->getLastError();
            if ($error == false) {
                $idproductquickbooks_review = $resultingObj->Id;
                $update_data                = [
                    'product_quickbooks_id' => $idproductquickbooks_review,
                ];
                $this->product_model->getupdateProductByquickbooks($update_data, $idproduct_review);
                $this->push_summary['push_item_count']++;
            } else {
                $this->import_summary['errors'][] = $error->getResponseBody();
                $product                          = $this->product_model->getProductNamequickbooks($nameproduct_review);
                $idproductquickbooks              = $product->product_quickbooks_id;
                $update_data                      = [
                    'product_quickbooks_id' => $idproductquickbooks,
                ];
                $this->product_model->getupdateProductByquickbooks($update_data, $idproduct_review);
            }
        }
    }

    private $quickbooks_item_arr = [];

    private function listitem() {
        $dataService = $this->dataServ();
        $dataService->CreateNewBatch();
        $totalitem   = $dataService->Query("SELECT COUNT(*) FROM Item");
        $row         = 0;
        for ($i = 0; $i < $totalitem; $i += 9) {
            $dataitem = $dataService->Query("SELECT * FROM Item STARTPOSITION " . $i . " MAXRESULTS 10");
            foreach ($dataitem as $item) {
                $this->quickbooks_item_arr[$row]['name'] = $item->Name;
                $this->quickbooks_item_arr[$row]['id']   = $item->Id;
                $row                                     = $row + 1;
            }
        }
    }

    private function pushpayment() {
        $dataService                = $this->dataServ();
        $data_customer_transactions = $this->Donation_model->getDonationsquickbooks();
        $dataService->CreateNewBatch();
        $this->listpaymentmethod(); 
        foreach ($data_customer_transactions as $transaction) {
            
            $amount               = $transaction->amount;
            $idquickbookscustomer = $transaction->quickbooks_id_user;
            $idquickbooksinvoice  = $transaction->quickbooks_id;
            $src                  = $transaction->src;

            if ($src == 'CC') {
                $namemethod = 'Credit Card-LunarPay';
            } elseif ($src == 'BNK') {
                $namemethod = 'Bank Transfer-LunarPay';
            } elseif ($src == 'Cash') {
                $namemethod = 'Cash'; //  1 Cash
            } elseif ($src == 'Check') {
                $namemethod = 'Check';  // 2  check 
            } else {
                $namemethod = 'Other-LunarPay';
            }
            
            foreach ($this->quickbooks_paymenteethod_arr as $methorefquickbooks) {
               if ( $namemethod == $methorefquickbooks['name'])
               {
                 $methoref= $methorefquickbooks['id'];
               }                               
            }
            
            $dataService->CreateNewBatch();
            $Item                 = Payment::create([
                        "CustomerRef"      =>
                        [
                            "value" => $idquickbookscustomer
                        ],
                        "TotalAmt"         => $amount,
                        "Line"             => [
                            [
                                "Amount"    => $amount,
                                "LinkedTxn" => [
                                    [
                                        "TxnId"   => $idquickbooksinvoice,
                                        "TxnType" => "Invoice"
                                    ]]
                            ]],
                        "PaymentMethodRef" => [
                            "value" => $methoref,
                        ]
            ]);
            $resultingObj         = $dataService->Add($Item);
            $error                = $dataService->getLastError();
            if ($error == false) {
                $trx_fund_upd = ['id' => $transaction->trx_fund_id, 'quickbooks_last_update' => date('Y-m-d H:i:s'), 'quickbooks_pushed' => 'Y'];
                $this->transaction_fund_model->update($trx_fund_upd);
                $this->push_summary['push_payment_count']++;
            } else {
                $this->import_summary['errors'][] = $error->getResponseBody();
            }
        }
    }

    private $quickbooks_paymenteethod_arr = [];

    private function listpaymentmethod() {
        $dataService = $this->dataServ();
        $dataMethod  = $dataService->Query("SELECT * FROM PaymentMethod order by id");
        $row         = 0;
        foreach ($dataMethod as $method) {
            $this->quickbooks_paymenteethod_arr[$row]['name'] = $method->Name;
            $this->quickbooks_paymenteethod_arr[$row]['id']   = $method->Id;
            $row                                              = $row + 1;
        }
    }    
    private $name_method_lunary  = ['Credit Card-LunarPay','Bank Transfer-LunarPay', 'Cash','Check','Other-LunarPay'];
    private function createpaymentmethod() {
        $this->listpaymentmethod();   
    
     foreach ($this->name_method_lunary as $namemethod) {
           $foundmethod = false;
            foreach ($this->quickbooks_paymenteethod_arr as $methodquickbooks) {         
                if ($methodquickbooks['name'] == $namemethod) {                                      
                    $foundmethod = true;
                }
            }            
            if ($foundmethod == false) {
                $dataService           = $this->dataServ();
                $dataPaymentMethod     = [
                    'name' => $namemethod,
                ];
                $method                = new IPPPaymentMethod();
                $method->Name          = $dataPaymentMethod['name'];
                $responsePaymentMethod = $dataService->Add($method); 
                $error                = $dataService->getLastError();
                 if ($error ==true) {
                     $this->import_summary['errors'][] = $error->getResponseBody();                     
                 }
            }
        }
    }

    private function dataServ() {
        $conn_data       = $this->getConnData();
        $conn_data_arr   = json_decode($conn_data);
        $accessTokenKey  = $conn_data_arr->access_token;
        $refreshTokenKey = $conn_data_arr->refresh_token;
        $QBORealmID      = $conn_data_arr->realmId;
        $dataService     = DataService::Configure(array(
                    'auth_mode'       => 'oauth2',
                    'ClientID'        => $this->client_id_quickbooks,
                    'ClientSecret'    => $this->secret_id_quickbooks,
                    'accessTokenKey'  => $accessTokenKey,
                    'refreshTokenKey' => $refreshTokenKey,
                    'QBORealmID'      => $QBORealmID,
                    'baseUrl'         => 'development'
        ));
        return $dataService;
    }
}
