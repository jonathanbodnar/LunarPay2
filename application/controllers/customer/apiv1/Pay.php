<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Pay extends CI_Controller {

    private $session_id = null;
    private $is_customer_request = TRUE;

    private $mapPayOpts = ['credit_card' => 'CC', 'bank_account' => 'BANK', 'eth' => 'ETH'];

    private $isFortis = false;

    public function __construct() {

        parent::__construct();
        
         //when accessing the api as merchant all endpoints are secured
        $this->load->library('merchant_api_20221028');         
        
        if ($this->merchant_api_20221028->isMerchantRequest()['status']) {
            $this->is_customer_request = FALSE; // it means the request comes from a merchant
            $result                    = $this->merchant_api_20221028->validaAccessToken();
                        
            if($result['status'] === false) {
                output_json_api($result, 0, REST_Controller_Codes::HTTP_OK);
                die;
            }
            
            $this->orgnx_id    = $result['data']->church_id;
            $this->suborgnx_id = $result['data']->campus_id;
            $this->client_id   = $result['data']->organization->client_id;  
            
        }
        //==================================================
        
        //when accessing the api as a customer
        
        if ($this->is_customer_request === TRUE) { //is customer request
            $this->load->model('api_session_model');
            $this->load->library('widget_api_202107');

            $action = $this->router->method;

            /* ------- NO ACCESS_TOKEN METHODS ------- */
            $free = ['invoice', 'create_fortis_transaction_intention', 'create_fortis_ticket_intention']; //method some times needs token validation
            /* ------- ---------------- ------ */

            if($action === 'payment_link') { //hibrid endpoint
                $input_json = @file_get_contents('php://input');
                $input      = json_decode($input_json);
                                
                //treat it as secured endpoint - verifyx
                if (isset($input->data_payment->wallet_id) || (isset($input->save_source) && $input->save_source)) {                   
                    $result = $this->widget_api_202107->validaAccessToken(); 
                    
                    if ($result['status'] === false) {
                        output_json_api(['errors' => $result['code'], 'details' => $result], 1, $result['http_code']);
                        exit;
                    }
                    $this->session_id = $result['current_access_token'];
                }
            } else if (!in_array($action, $free)) { //restrict endpoint when method/action is not in the free array OR
                //restrict - validate access token, if it does not match cut the flow
                $result = $this->widget_api_202107->validaAccessToken();
                if ($result['status'] === false) {
                    output_json_custom($result);
                    die;
                }                
            }

        }
    }
    
   /* public function update_csrf()
    {
        $data['csrf_hash'] = $this->security->get_csrf_hash();
        echo json_encode($data);
    }maybe we will need this later*/

    //post
    public function invoice($hash = 0) {

        try {
            $input_json = @file_get_contents('php://input');
            $input      = json_decode($input_json);
            
            $this->load->model('invoice_model');
            $this->invoice_model->valAsArray = true;

            $invoice            = $this->invoice_model->getByHash($hash);
            
            if (empty($invoice)) {
                output_json_api(['errors' => [langx('Invoice not found')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            if ($invoice->status == Invoice_model::INVOICE_PAID_STATUS) {
                output_json_api(['errors' => [langx('Invoice already paid')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }

            $ftsData = null;
            if(isset($input->payment_processor) && $input->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT) {
                $this->isFortis = true;
                $ftsData = $input->fts_event->data;
                $input->data_payment = new stdClass;
                $input->data_payment->postal_code = null;
                $input->data_payment->single_use_token = null;
                $input->data_payment->region = null;
                $input->data_payment->is_cover_fee = $invoice->cover_fee ? 1 : 0;

                $input->payment_method = null;

                if ($ftsData->{'@action'} === 'ticket') {
                    $input->payment_method = 'credit_card';
                } else {
                    if ($ftsData->payment_method == 'cc') {
                        $input->payment_method = 'credit_card';
                    } elseif ($ftsData->payment_method == 'ach') {
                        $input->payment_method = 'bank_account';
                    }
                }    
            }

            $mappedPaymentMethod = isset($this->mapPayOpts[$input->payment_method]) ? $this->mapPayOpts[$input->payment_method] : null;
            $payment_options = json_decode($invoice->payment_options);                        
            if(!in_array($mappedPaymentMethod, $payment_options)) {
                output_json_api(['errors' => [langx('Invalid request, payment method unavailable')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            $donorId            = $invoice->donor_id;
            $request            = new stdClass();
            $request->screen    = 'invoice';
            $request->church_id = $invoice->church_id;
            $request->campus_id = $invoice->campus_id;
            $request->from_subscription_id = $invoice->subscription_id;

            $request->amount    = $invoice->total_amount;

            $paymentMethodSelected = $input->payment_method_selected;

            if ($invoice->cover_fee) {
                $feeObject = (object) [
                    'coverFee' => $invoice->cover_fee, 
                    'paymentMethod' => $paymentMethodSelected,
                    'orgId' => $invoice->church_id, 
                    'processorShort' => PROVIDER_PAYMENT_FORTIS_SHORT
                ];

                $this->load->helper('fortis');
                $request->amount = adjustAmountUpwardWithFees($feeObject, $request->amount);                
            } else {
                $request->amount = $invoice->total_amount;
            }
            
            //diagase que fue covered pero tratese como no covered
            $request->invoice   = $invoice;

            $request->fts_transaction_response = $ftsData;
            
            $church_id = $invoice->church_id;
            $campus_id = $invoice->campus_id;

            $packResult = $this->buildPaymentPackage($input, $request, $church_id, $campus_id, null); //errors handled via exceptions

            require_once 'application/controllers/extensions/Payments.php';
            
            $pResult = Payments::process($packResult['request'], $packResult['payment'], $donorId, );

            $error = 0;
            if($pResult['status'] === false) {
                $error = 1;
                $pResult['errors'] = [$pResult['message']];
                unset($pResult['message']);
            } else {
                $invoiceUpdated     = $this->invoice_model->getByHash($hash); 
                $pResult['invoice'] = $invoiceUpdated; //return an updated invoice
            }
            output_json_api($pResult, $error, REST_Controller_Codes::HTTP_OK); 
        } catch (Exception $ex) {

            output_json_api(['errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_BAD_REQUEST);
        }
    }
                            
    public function payment_link($hash = 0) {

        try {
            $input_json = @file_get_contents('php://input');
            $input      = json_decode($input_json);

            $this->load->model('payment_link_model');
            $this->payment_link_model->valAsArray = true;
            
            $paymentLink = $this->payment_link_model->getByHash($hash);
            
            if (empty($paymentLink)) {
                output_json_api(['errors' => [langx('Link not found')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            
            $ftsData = null;
            $this->isFortis = isset($input->payment_processor) && $input->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT ? true : false;
                
            $isWallet = null;
            if (!isset($input->data_payment->wallet_id)) { //when a payment is done with a source (cc, bank, crypto) input->payment_method comes with a string
                $isWallet = false;
                if($this->isFortis) {
                    $ftsData = isset($input->fts_event->data) ? $input->fts_event->data : null;

                    $input->data_payment = new stdClass;
                    $input->data_payment->postal_code = null; 
                    $input->data_payment->single_use_token = null; 
                    $input->data_payment->region = null; 

                    $input->payment_method = null;

                    if($ftsData->{'@action'} === 'ticket') {
                        $input->payment_method = 'credit_card';
                        
                    } else {
                        if ($ftsData->payment_method == 'cc') {
                            $input->payment_method = 'credit_card';
                        } elseif ($ftsData->payment_method == 'ach') {
                            $input->payment_method = 'bank_account';
                        }
                    }
                    
                }

                $mappedPaymentMethod = isset($this->mapPayOpts[$input->payment_method]) ? $this->mapPayOpts[$input->payment_method] : null;                                
                $payment_options = json_decode($paymentLink->payment_methods); 
                if(!in_array($mappedPaymentMethod, $payment_options)) {
                    output_json_api(['errors' => [langx('Invalid request, payment method unavailable')]], 1, REST_Controller_Codes::HTTP_OK);
                    return;
                }                
            } else { //when a payment is done using a wallet $input->payment_method comes with an integer
                $isWallet = true;
                if($this->is_customer_request) {
                    $input->username = $this->api_session_model->getValue($this->session_id,'identity');                    
                } else {
                    $input->username = isset($input->username) ? $input->username : null;
                }              
            }
            
            if(!filter_var($input->username,FILTER_VALIDATE_EMAIL)){
                output_json_api(['errors' => [langx('Invalid request, email/username is required')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }

            $this->load->model('donor_model');
            $this->donor_model->valAsArray = true; //get validation errors as array, not a string            
            $customerAcc                   = $this->donor_model->getLoginData($input->username, $paymentLink->church_id);

            if (!$this->is_customer_request && !$customerAcc) { //merchant request
                output_json_api(['errors' => [langx('Invalid request, Email/username not found')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }

            $isAnonymous = false;
            if (!$customerAcc) {                
                $isAnonymous = true;
            }

            $input->data_payment->is_cover_fee = $paymentLink->cover_fee ? 1 : 0;
            $input->data_payment->trial_days = $paymentLink->trial_days ? $paymentLink->trial_days : null;

            $donorId              = $customerAcc ? $customerAcc->id : null;
            $request              = new stdClass();
            $request->screen      = 'payment link';
            $request->church_id   = $paymentLink->church_id;
            $request->campus_id   = $paymentLink->campus_id;
            $request->paymentLink = $paymentLink;

            $request->fts_transaction_response = $ftsData;
            
            $reqProducts = $input->products;

            $this->load->helper('payment_links');            
            PL_checkProductsIntegrity($paymentLink, $reqProducts); //check the customer send safe product data
        
            require_once 'application/controllers/extensions/Payments.php';
            //just calculate the total amount using the quantities provided by the customer and fusion products data comming from the request with the data in the database
            $paymentMethodSelected = null;
            
            $walletObj = null; //used for building the package when wallet involved
            
            if($isWallet) {
                $this->load->model('sources_model');
                $walletObj = $this->sources_model->getOne($customerAcc->id, $input->data_payment->wallet_id, 'id, bank_type, source_type, src_account_type', true);
                if($walletObj->source_type === 'card') {
                    $paymentMethodSelected = $walletObj->src_account_type === 'amex' ? 'cc_amex' : 'cc';
                } else {
                    $paymentMethodSelected = 'ach';
                }
            } else {
                $paymentMethodSelected = $input->payment_method_selected;                 
            }
            
            $feeObject = (object) ['coverFee' => $paymentLink->cover_fee, 'paymentMethod' => $paymentMethodSelected, 'orgId' => $paymentLink->church_id, 'processorShort' => PROVIDER_PAYMENT_FORTIS_SHORT];
            $productsWithRequest = PL_recalcProductsWithRequest($reqProducts, $converOneTime = false, $feeObject);
            $subscriptionExists = PL_checkSubscriptionExists($productsWithRequest['_products']);

            $includeTrnxIds = []; //an array of transactions ids, transactions done in this process
            
            $error = 0;
            if ($productsWithRequest['countProductsOneTime'] > 0) { //if there is no products one time do not attempt to process a payment, proceed to see if there are any subscription
                
                $request->amount = $productsWithRequest['totalAmountOneTime'];
                
                $request->paymentLink->_products_with_request = $productsWithRequest['_products'];

                $input->data_payment->country = $request->paymentLink->organization->region;
                
                if($subscriptionExists && !$isWallet) {
                    $input->save_source = '1'; //when dealing with a one time product but in the request we got a subscription we need to force the one time payment to save the source
                }
                
                $packResult = $this->buildPaymentPackage($input, $request, $paymentLink->church_id, $paymentLink->campus_id, $walletObj);
                
                if (isset($packResult['error']) && $packResult['error']) {
                    output_json_api(['errors' => [$packResult['message']]], 1, $packResult['http_code']);
                    return;
                }

                if ($isAnonymous) {
                    $donorId = $input->username;
                } else {
                    if (!$this->isFortis) {
                        $result = $this->widget_api_202107->checkBearerToken();
                        if ($result['status']) {
                            $packResult['payment']->save_source = 'Y';
                        } else {
                            $packResult['payment']->save_source = 'N';
                        }
                    }
                }

                $pResult = Payments::process($packResult['request'], $packResult['payment'], $donorId, $isAnonymous);
                
                if ($pResult['status'] === false) {
                    $error             = 1;
                    $pResult['errors'] = [$pResult['message']];
                    unset($pResult['message']);
                    output_json_api($pResult, $error, REST_Controller_Codes::HTTP_OK);
                    return;
                }
                
                $includeTrnxIds [] = $pResult['trxn_id'];
            }

            //process recurrent products | create subscriptions
              
            $subsResponse = []; //subscription Ids
            $subTrnxIds = []; //transaction Ids of each subscription / when not trial                      
            if ($subscriptionExists) {                                                                
                foreach ($productsWithRequest['_products'] as $_product) {                                        
                    $request->paymentLink->_products_with_request = [];
                                                          
                    if ($_product->recurrence == Product_model::RECURRENCE_PERIODICALLY ||$_product->recurrence == Product_model::RECURRENCE_CUSTOM ) {

                        if ($_product->recurrence == Product_model::RECURRENCE_CUSTOM) {
                            $custom_date_arr = json_decode($_product->custom_date);
                            $request->amount = $custom_date_arr[0]->amount;
                        } else {
                            $request->amount                         = $_product->_sub_total;
                        }
                        
                        $input->data_payment->recurring          = $_product->billing_period;
                        $input->data_payment->is_recurring_today = true;
                        
                        $request->paymentLink->_products_with_request [] = $_product; //productsWithRequest when subscription only will hold one product | it is a recurrent/susbscription product                        
                        $packResult                                      = $this->buildPaymentPackage($input, $request, $paymentLink->church_id, $paymentLink->campus_id, $walletObj);                                               
                      
                        $pResultSub = Payments::process($packResult['request'], $packResult['payment'], $donorId, $isAnonymous);
                        $pResult = $pResultSub;                      
                        if ($pResultSub['status'] === false) {
                            $error         = 1;
                            $pResult['errors'] = [$pResult['message']];
                            unset($pResult['message']);
                            output_json_api($pResult, $error, REST_Controller_Codes::HTTP_OK);
                            return;
                        }
                        
                        //if ($pResultSub['payment_info']['payment_done']) {
                            $subTrnxIds []   = $pResultSub['payment_info']['trxn_id'];
                            $subsResponse [] = $pResultSub;
                        //}
                    }                   
                }
                unset($pResult['payment_info']);
            }

            if (isset($pResult['trxn_id'])) { //for recovering the payment link with 
                $includeTrnxIds [] = $pResult['trxn_id'];
            }
            
            if($subTrnxIds) {
                $includeTrnxIds = array_merge_recursive($includeTrnxIds, $subTrnxIds); //concat arrays wihout taking care of keys, it only appends the new array to the end                
            }
            
            $pResult['subscriptions'] = $subsResponse;
            
            $paymentLinkUpdated      = $this->payment_link_model->getByHash($hash, $includeTrnxIds);            
            $pResult['payment_link'] = $paymentLinkUpdated; //return an updated paymentLink
            
            output_json_api($pResult, $error, REST_Controller_Codes::HTTP_OK);                        
            
        } catch (Exception $ex) {                        
            output_json_api(['status' => false, 'errors' => [$ex->getMessage()]], 1, REST_Controller_Codes::HTTP_OK);
        }
    }

    private function buildPaymentPackage($input, $request, $church_id, $campus_id, $walletObj) {        
        
        $data_payment = (array) $input->data_payment;

        //though lunarPay does not use funds, the architecture and current payment process requires at least one, we load the org's default one
        $this->load->model('fund_model');
        $campus_id = $campus_id ? $campus_id : null;
        $mainfund           = $this->fund_model->getFirstOrgFund($church_id, $campus_id);
        $request->fund_data = [['fund_id' => $mainfund->id, 'fund_amount' => $request->amount]];

        //setting payment method it can be card, bank | or a wallet
        if (isset($input->data_payment->wallet_id)) {
            $wallet_id = $input->data_payment->wallet_id;
            $request->payment_method = 'wallet';
        } else if (array_key_exists($input->payment_method, $this->mapPayOpts)) {
            //that's okay continue ...             
            $request->payment_method = $input->payment_method;
        } else {
            throw new Exception(langx('bad request'));
        }

        // -----------

        $bank_type = null;

        if (isset($data_payment['bank_type']) && $data_payment['bank_type']) {
            $bank_type = $data_payment['bank_type'];
        } elseif (isset($wallet_id)) {
           if(!$walletObj) {
                throw new Exception(langx('bad request, payment method provided not found'));
            }
            $bank_type = $walletObj->bank_type;
        }

        $payment            = new stdClass();
        $payment->bank_type = $bank_type;
        $payment->wallet_id = null;
        $payment->trial_days = isset($data_payment['trial_days']) ? $data_payment['trial_days'] : null;

        $save_source = null;

        if ($this->isFortis) {
            $payment->fts_event = isset($input->fts_event) && $input->fts_event ? $input->fts_event : null; //fts_event is provided for payment links
            $save_source = isset($input->save_source) && $input->save_source ? 'Y' : 'N';
        } else {
            if ($bank_type == 'sepa') {
                $save_source = 'Y'; // if sepa used as payment method, source saving is mandatory | bacs is not included as it is used with a token only
            } else {
                $save_source = isset($save_source) && strtolower($save_source) == '1' ? 'Y' : 'N';
            }
        }

        // ---------

        $request->recurring = isset($data_payment['recurring']) ? $data_payment['recurring'] : 'one_time';        
        
        if ($request->recurring != 'one_time') {            
            $request->recurring_date = $data_payment['is_recurring_today'] ? date('Y-m-d') : $data_payment['recurrent_date'];            
            $save_source = 'Y'; //when a subscription is created the source must be saved
            
            if (!$this->is_customer_request) {
                if (empty($input->white_label_tag)) {
                    throw new Exception(langx('bad request, a white_label_tag is required, 0 value or empty strings are not valid'));
                }
                $request->white_label_tag = $input->white_label_tag;
            }
        }

        if ($request->payment_method != 'wallet') {
            
            if($this->isFortis) {
                $splittedFullName = splitFirstAndLastName($input->fts_event->data->account_holder_name ?? '');
                
                $payment->account_holder_name = $input->fts_event->data->account_holder_name;
                $payment->first_name  = $splittedFullName['first_name'];
                $payment->last_name   = $splittedFullName['last_name'];
                $payment->postal_code = null;

                $payment->created_user_id = $input->fts_event->data->created_user_id;

                if(isset($input->fts_event->data->{'@action'}) && $input->fts_event->data->{'@action'} == 'tokenization') {
                        
                    $payment->src_account_type = $input->fts_event->data->account_type; //visa, amex, savings, checking, etc ...
                    if($save_source === 'Y') {

                        $payment->wallet_id = $input->fts_event->data->id;
                        $payment->last_digits = $input->fts_event->data->last_four;
                        

                        if($input->fts_event->data->payment_method == 'cc') {
                            $payment->card_exp_date = $input->fts_event->data->exp_date;                            
                        }                         
                    }
                } else if(isset($input->fts_event->data->{'@action'}) && $input->fts_event->data->{'@action'} == 'ticket') { //ticket from cc one time
                    $payment->src_account_type = $input->payment_method_selected === 'cc_amex' ? 'amex' : null; //we need it here for calculating fees  
                    /*
                    *DO NOTHING HERE:
                    *src_account_type, wallet_id, last_digits, card_exp_date will be set after the payment is perfomed, this is after the ticket is used
                    */
                } else { //this is the ach flow     
                    if ($save_source === 'Y') {
                        $payment->wallet_id = $input->fts_event->data->saved_account->id;
                        $payment->last_digits = $input->fts_event->data->saved_account->last_four;

                        if ($input->fts_event->data->saved_account->payment_method == 'cc') {
                            $payment->card_exp_date     = $input->fts_event->data->saved_account->exp_date;
                        }
                        $payment->src_account_type = $input->fts_event->data->saved_account->account_type; //visa, etc ...                        
                    } else {
                        $payment->src_account_type = isset($input->fts_event->data->account_type) ? $input->fts_event->data->account_type : null; //visa, etc ...; //visa, etc ...                    
                    }
                }
            } else {
                $payment->first_name  = ucfirst(strtolower(isset($data_payment['first_name']) ? $data_payment['first_name'] : null));
                $payment->last_name   = ucfirst(strtolower(isset($data_payment['last_name'])) ? $data_payment['last_name'] : null);                
                $payment->postal_code = $data_payment['postal_code'];
            }

            $payment->save_source = $save_source;
        } else {
            $payment->src_account_type = $walletObj->src_account_type;
        }

        if ($request->payment_method == 'credit_card') {
            if(!$this->isFortis) {
                $payment->single_use_token = $data_payment['single_use_token'];
            }
            
        } elseif ($request->payment_method == 'bank_account') {
            if($this->isFortis) {                
                
            } else if ($bank_type) {
                if ($bank_type == 'ach') {
                    $payment->routing_number = $data_payment['routing_number'];
                    $payment->account_number = $data_payment['account_number'];
                    $payment->account_type   = $data_payment['account_type'];
                } elseif ($bank_type == 'eft') {
                    $payment->account_number = $data_payment['account_number'];
                    $payment->transit_number = $data_payment['transit_number'];
                    $payment->institution_id = $data_payment['institution_id'];
                } elseif ($bank_type == 'sepa') {
                    $payment->iban              = $data_payment['iban'];
                    $payment->mandate_reference = $data_payment['mandate'];
                }
            } else {
                $payment->routing_number = $data_payment['routing_number'];
                $payment->account_number = $data_payment['account_number'];
                $payment->account_type   = $data_payment['account_type'];
            }
        } elseif ($request->payment_method == 'eth') {
            //alexey put here special values coming from the front end according with what is needed, they come on data_payment
            $payment->single_use_token = 'token-abc'; //$data_payment['routing_number'];
            $payment->account_number = '123';         //$data_payment['routing_number'];    
            
        } elseif ($request->payment_method == 'wallet') {
            $payment->wallet_id = $wallet_id;
        }

        $payment->street  = isset($data_payment['street']) ? $data_payment['street'] : null;
        $payment->street2 = isset($data_payment['street2']) ? $data_payment['street2'] : null;
        $payment->city    = isset($data_payment['city']) ? $data_payment['city'] : null;
        $payment->country = isset($data_payment['country']) ? $data_payment['country'] : null;

        if ($bank_type == 'ach') {
            $payment->state = isset($data_payment['state']) ? $data_payment['state'] : null;
        }

        $payment->cover_fee = isset($data_payment['is_cover_fee']) && (strtolower($data_payment['is_cover_fee']) == 'yes' || $data_payment['is_cover_fee'] === 1) ? 1 : 0;
        
        return ['request' => $request, 'payment' => $payment];
    }

    public function create_fortis_transaction_intention($orgId)
    {
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);
                
        $data = [];

        require_once 'application/libraries/gateways/PaymentsProvider.php';
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance    = PaymentsProvider::getInstance();        
        $PaymentInstance->setAgentCredentials($orgId);
        $productTransactionIds = $PaymentInstance->getProductTransactionIds($orgId);

        if ($input->action === 'sale') {
            if (!isset($input->amount) || !is_numeric($input->amount) || $input->amount < 0 || $input->amount === '') {
                output_json_api(['errors' => [langx('invalid request, amount is required')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }
            $data['amount'] = amountToInteger($input->amount);
            $data['save_account'] = isset($input->save_source) && $input->save_source ? true : false;

        } elseif ($input->action === 'tokenization') {
            //no more data required
        } else {
            output_json_api(['errors' => [langx('invalid request, action is required')]], 1, REST_Controller_Codes::HTTP_OK);
            return;
        }

        $methods = [];
        if (isset($input->payment_method)) {
            if ($input->payment_method === 'cc' || $input->payment_method === 'cc_amex') {
                array_push($methods, [
                    'type' => 'cc',
                    'product_transaction_id' => $productTransactionIds['cc_product_transaction_id']
                ]);
            } else if ($input->payment_method === 'ach') {
                array_push($methods, [
                    'type' => 'ach',
                    'product_transaction_id' => $productTransactionIds['ach_product_transaction_id']
                ]);
            } else {
                output_json_api(['errors' => [langx('invalid request, payment method is required')]], 1, REST_Controller_Codes::HTTP_OK);
                return;
            }

            $data['methods'] = $methods;
        } else {
            array_push($methods, [
                'type' => 'cc',
                'product_transaction_id' => $productTransactionIds['cc_product_transaction_id']
            ]);
        
            // array_push($methods, [
            //     'type' => 'ach',
            //     'product_transaction_id' => $productTransactionIds['ach_product_transaction_id']
            // ]);

            $data['methods'] = $methods;

        }
        $data['action'] = $input->action; //sale or tokenization

        $result = $PaymentInstance->createTransactionIntention($data);
        
        if ($result['status'] === true) {
            output_json_api($result, 0, REST_Controller_Codes::HTTP_OK);            
        } else {
            output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
        }
        
    }
    
     public function create_fortis_ticket_intention($orgId)
    {
     require_once 'application/libraries/gateways/PaymentsProvider.php';
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance    = PaymentsProvider::getInstance();        
        $PaymentInstance->setAgentCredentials($orgId);
        $result = $PaymentInstance->createTicketIntention();
        
        if ($result['status'] === true) {
            output_json_api($result, 0, REST_Controller_Codes::HTTP_OK);            
        } else {
            output_json_api($result, 1, REST_Controller_Codes::HTTP_OK);
        }
        
    }
}
