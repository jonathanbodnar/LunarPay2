<?php

require_once 'application/libraries/gateways/PaymentsProvider.php';

class Payments {

    //@userId can be the email when the request is from an anonymous user.
    public static function process($request, $payment, $userId, $isAnonymous = false) {      
       
        $CI = & get_instance();
        
        $church    = $CI->db->where('ch_id', $request->church_id)->get('church_detail')->row();
        $dash_user = $CI->db->where('id', $church->client_id)->select('id, email, payment_processor,slack_oauth,slack_channel,slack_status')->get('users')->row();
        
        //$isAnonymous = false;

        $paymentData = [
            'amount'             => (int) ((string) ($request->amount * 100)), /* --- bcmul should used here we need to install this on servers (aws and ssdnodes) --- */
            'currency'           => 'usd',
            'method'             => $request->payment_method,
            'transaction_type'   => 'Sale',
            'client_customer_id' => $isAnonymous ? null : $userId,
        ];

        $processor_template = null;

        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance    = PaymentsProvider::getInstance();
        $PaymentInstance->setMainUserId($dash_user->id);

        $PaymentInstance->setAgentCredentials($church->ch_id);

        $processor_template = $church->fortis_template;

        $paymentData['bank_type'] = $payment->bank_type;
        $paymentData['created_user_id'] = isset($payment->created_user_id) && $payment->created_user_id ? $payment->created_user_id : null;
        $paymentData['last_digits'] =  isset($payment->last_digits) && $payment->last_digits ? $payment->last_digits : null;
        $paymentData['wallet_id'] = isset($payment->wallet_id) ? $payment->wallet_id : null;

        $paymentData['fts_event'] = null;
        if (isset($request->fts_transaction_response)) { //fts event is not used from payment triggered from subscription
            $paymentData['fts_event'] = $request->fts_transaction_response; //$paymData['fts_event'] used for storing the event when recording the wallet/source in the db            
        }
        $paymentData['account_holder_name'] = isset($payment->account_holder_name) ? $payment->account_holder_name : null;
        $paymentData['src_account_type'] = isset($payment->src_account_type) ? $payment->src_account_type : null;
        $paymentData['card_exp_date'] = isset($payment->card_exp_date) ? $payment->card_exp_date : null;

        $donor_account = null;
        if($isAnonymous){
            $donor_account = new stdClass();
            $donor_account->email      = $userId;
            $donor_account->first_name = $payment->first_name;
            $donor_account->last_name  = $payment->last_name;
        } else {
            $CI->load->model('donor_model');
            $donor_account = $CI->donor_model->get(['id' => $userId], ['email', 'first_name', 'last_name']);

            if (!$donor_account || !$donor_account->email) {
                return ['status' => false, 'message' => 'Email not found'];
            }            
        }

        $CI->load->model('transaction_fund_model', 'trnx_funds');
        $fund_data = $request->fund_data;
        
        $valTrxnOrgnx = $CI->trnx_funds->validateTransactionFundsBelongToOrgnx($fund_data, $request->church_id, $request->campus_id);
                
        if($valTrxnOrgnx['error']) {
            return ['status' => false, 'message' => $valTrxnOrgnx['message']];
        }

        $userEmail = $donor_account->email;

        if (in_array($request->church_id, TEST_ORGNX_IDS)) {
            $PaymentInstance->setTesting(true);
        }

        $walletInfo = null;
        
        if ($paymentData['method'] == 'wallet') {
            $payment->first_name  = $donor_account->first_name;
            $payment->last_name   = $donor_account->last_name;
            $payment->postal_code = null;

            $walletInfo   = $CI->db->where(['id' => $payment->wallet_id, 'church_id' => $request->church_id, 'account_donor_id' => $userId])->get('epicpay_customer_sources')->row();
        }
        $customerData = [
            'church_id'        => $request->church_id,
            'account_donor_id' => !$isAnonymous ? $userId : null,
            'customer_address' => [
                'email'       => $userEmail,
                'first_name'  => $payment->first_name,
                'last_name'   => $payment->last_name,
                'postal_code' => $payment->postal_code,
            ],
            'billing_address'  => [
                'email'       => $userEmail,
                'first_name'  => $payment->first_name,
                'last_name'   => $payment->last_name,
                'postal_code' => $payment->postal_code,
            ],
        ];
    
        $customerData['paysafe_billing_address'] = [
            'street'  => isset($payment->street) ? $payment->street : null,
            'street2' => isset($payment->street2) ? $payment->street2 : null,
            'city'    => isset($payment->city) ? $payment->city : null,
            'country' => isset($payment->country) ? $payment->country : null,
            'zip'     => isset($payment->postal_code) ? $payment->postal_code : null
        ];

        if ($payment->bank_type == 'ach') {
            $customerData['paysafe_billing_address']['country'] = 'US';
            $customerData['paysafe_billing_address']['state'] = $payment->state;
        }

        $transactionData = [
            'customer_id'              => 0,
            'customer_source_id'       => 0,
            'church_id'                => $request->church_id,
            'campus_id'                => ( (isset($request->campus_id) && $request->campus_id) ? $request->campus_id : null ),
            'account_donor_id'         => !$isAnonymous ? $userId : null,
            'total_amount'             => $request->amount,
            // When creating a new customer using Fortis, the name may not be available initially. 
            // We retrieve the name from the payment information as a fallback. 
            // The name will be updated later only if the payment source is successfully saved.
            'first_name'               => !empty($donor_account->first_name) ? $donor_account->first_name : $payment->first_name, 
            'last_name'                => !empty($donor_account->first_name) ? $donor_account->last_name : $payment->last_name,  //yes !empty($donor_account->first_name) 
            ////////////////////////////////
            'email'                    => $userEmail,
            'zip'                      => $payment->postal_code,
            'giving_source'            => $request->screen,
            //'giving_type'        => $request->fund_id,
            'template'                 => $processor_template,
            'is_fee_covered'           => $payment->cover_fee,
            'campaign_id'              => isset($request->campaign_id) && $request->campaign_id ? $request->campaign_id : null,
            'customer_subscription_id' => isset($request->from_subscription_id) && $request->from_subscription_id ? $request->from_subscription_id : null,
            'invoice_id'               => isset($request->invoice) && $request->invoice ? $request->invoice->id : null,
            'payment_link_id'          => isset($request->paymentLink) && $request->paymentLink ? $request->paymentLink->id : null,
            //if payment is done using a wallet take the src_account_type from the wallet
            'src_account_type'        => isset($walletInfo->src_account_type) ? $walletInfo->src_account_type : (isset($paymentData['src_account_type']) ? $paymentData['src_account_type'] : null)
        ];

        if ($paymentData['method'] == 'credit_card') {
            $transactionData['src'] = "CC";
            $paymentData['credit_card'] = [                    
                'card_holder_name' => $payment->first_name . ' ' . $payment->last_name,
            ];                      

        } else if ($paymentData['method'] == 'wallet') {
            if ($walletInfo) {
                $paymentData['wallet'] = [
                    'wallet_id'             => $walletInfo->epicpay_wallet_id,
                    'postal_code'           => $walletInfo->postal_code,
                    'processor_customer_id' => $walletInfo->epicpay_customer_id
                ];

                if ($walletInfo->source_type == 'card') {
                    $transactionData['src'] = "CC";
                    if (isset($request->wallet_update) && $request->wallet_update->execute == "1") {
                        die('update wallet pending / update wallet not implemented yet');
                        // $updWalletResp = $this->updateWallet($request, $userEmail, $walletInfo);
                        // if ($updWalletResp["error"] === "validation_error") {
                        //     return ['status' => 'validation_error', 'reason' => $updWalletResp["message"]];
                        // }
                    }
                } else if ($walletInfo->source_type == 'bank') {
                    $transactionData['src'] = "BNK";
                    $paymentData['sec_code'] = 'WEB';
                } else if ($walletInfo->source_type == 'ETH') {
                    $transactionData['src'] = "ETH";
                }

                $transactionData['customer_id']        = $walletInfo->customer_id;
                $transactionData['customer_source_id'] = $walletInfo->id;                
            }
            
        } else if ($paymentData['method'] == 'bank_account') {
            $transactionData['src'] = "BNK";
            $paymentData['method']   = 'echeck';
            $paymentData['sec_code'] = 'WEB';
            if ($paymentData['bank_type'] == 'ach') {
                $paymentData['bank_account'] = [ //verifyx fortis - very the payment data, is being used?
                    'account_type'        => $payment->account_type,
                    'routing_number'      => $payment->routing_number,
                    'account_number'      => $payment->account_number,
                    'account_holder_name' => $payment->first_name . ' ' . $payment->last_name,
                ];
            }             
        } else if ($paymentData['method'] == 'eth') {
            $transactionData['src'] = "ETH";            
            $paymentData['eth'] = [
                'single_use_token'    => $payment->single_use_token,
                'account_number'      => $payment->account_number,                
                'account_holder_name' => $payment->first_name . ' ' . $payment->last_name,
            ];
        }

        if ($paymentData['method'] != 'wallet') {
            if ($payment->save_source == 'Y' || $request->recurring != 'one_time') { //verifyx if this change affects epicpay
                $customerData['is_saved'] = 'Y';
            } else {
                $customerData['is_saved'] = 'N';
            }

            $ftsAction = isset($paymentData['fts_event']->{'@action'}) ? $paymentData['fts_event']->{'@action'} : null;
            
            if ($customerData['is_saved'] == 'Y' && $ftsAction !== 'ticket') { //when ftsAction is ticket and the payment option is saved the card will be saved after the transaction is done                
                $customerInfo = $PaymentInstance->createCustomer($customerData, $paymentData);
                if ($customerInfo['error'] == 1) {
                    return ['status' => false, 'message' => 'Could not create profile/source | ' . $customerInfo['message']];
                }
                if (isset($customerInfo['source'])) {
                    $transactionData['customer_id']        = $customerInfo['customer']['id'];
                    $transactionData['customer_source_id'] = $customerInfo['source']['id'];
                    $paymentData['wallet'] = [
                        'wallet_id'             => $customerInfo['source']['epicpay_id'],
                        'processor_customer_id' => $customerInfo['customer']['epicpay_id']
                    ];

                    if($ftsAction === 'tokenization') {
                        $paymentData['method'] = 'wallet'; //when tokenization is performed in the fts frontend we force the method to be wallet at this point to use the wallet in the transaction
                    }                    
                    unset($paymentData['credit_card']);
                    unset($paymentData['bank_account']);
                }
            }
        }

        $trx                 = new stdClass();
        $trx->total_amount   = $request->amount;
        $trx->template       = $processor_template;
        $trx->src            = $transactionData['src'];
        $trx->is_amex        = isset($paymentData['src_account_type']) && $paymentData['src_account_type'] === 'amex' ? true : false;
        $productsWithRequest = null;

        if (isset($transactionData['payment_link_id'])) {
            $productsWithRequest = $request->paymentLink->_products_with_request;
        }        
        
        $transactionData['fee'] = getFortisFee($trx);
        if($transactionData['invoice_id'] || $transactionData['payment_link_id']) {
            $fund_data = setMultiFundDistrFeeNotCovered($fund_data, $transactionData);                
            //for invoices and payment links, the amount is already calculated covering or not covering the fee on PL_recalcProductsWithRequest, so here always use feeNotCovered
        } 
        //else {
            //$fund_data = $payment->cover_fee ?  setMultiFundDistrFeeCovered($fund_data, $transactionData) :
            //setMultiFundDistrFeeNotCovered($fund_data, $transactionData);            
        //}
        
        //continue with payment links and subscriptions

        $transactionData['sub_total_amount'] = $transactionData['total_amount'] - $transactionData['fee'];

        if ($request->recurring == 'one_time') {                               
            $result = $PaymentInstance->createTransaction($transactionData, $customerData, $paymentData, $fund_data, $productsWithRequest, $isAnonymous);

            if ($result['error'] == 1) {                
                return ['status' => false, 'message' => $result['message'], 'trxn_id' => $result['trxId']];
            }

            $transactionData["trxId"] = $result["trxId"];
            $CI->load->helper('emails');

            if (isset($transactionData['invoice_id']) && $transactionData['invoice_id']) {
                $CI->load->model('invoice_model');

                //verfix rebuild getbyhash and getbyid use just one method, check this for invoices too
                //we reload the invoice for getting transactions object, we need them when sending the email                
                $invoice = $CI->invoice_model->getById($transactionData['invoice_id'], $dash_user->id);

                $CI->invoice_model->markInvoiceAs($transactionData['invoice_id'], Invoice_model::INVOICE_PAID_STATUS);

                $invoice->datePaid = date("F j, Y");
                $invoice->TransactionId = $transactionData["trxId"];
                sendInvoiceEmail($invoice, 'paid');

                $invoice->user_to = $dash_user->email;
                sendPaymentNotificationToAdmin('invoice', $invoice);
            } else if (isset($transactionData['payment_link_id']) && $transactionData['payment_link_id']) {
                $CI->load->model('payment_link_model');

                //we reload the $paymentLink for getting transactions object and add some other data needed from request, we need them when sending the email                                
                $paymentLink = $CI->payment_link_model->getByHash($request->paymentLink->hash, $includeTrxnId = $transactionData["trxId"]);

                $paymentLink->_customer = $donor_account; //customer is not part of the paymentLink, we added it here for the email purposes only
                $paymentLink->_total_amount = $transactionData['total_amount'];
                $paymentLink->_fee = $transactionData['fee'];
                $paymentLink->_is_fee_covered = $transactionData['is_fee_covered'];
                $paymentLink->_date_paid = date("F j, Y");
                $paymentLink->_transaction_id = $transactionData["trxId"];

                sendPaymentLinkEmail($paymentLink);
                //sendPaymentNotificationToAdmin('paymentLink', $request->paymentLink);

            } else {
                //sendDonationEmail($transactionData, false, $fund_data);
            }
            //Send message slack  E= ennable, D=Disable
            if ($dash_user->slack_status == 'E') {
                $messageslack      = 'You have received a payment from: ' . $donor_account->first_name . ' ' . $donor_account->last_name .
                    ', Email: ' . $userEmail . ', Amount: $' . $request->amount . ', Date: ' . date("m/d/Y");
                $CI->load->helper('slack');
                sendSlackMessage($dash_user->slack_oauth, $dash_user->slack_channel, $messageslack);
            }

            return ['status' => true, 'message' => 'Payment Processed!', 'trxn_id' => $result["trxId"]];
        } else {            
            $paymentData['frequency'] = $request->recurring;                         

            $paymentData['trial_days'] = isset($payment->trial_days) && $payment->trial_days ? $payment->trial_days : null;

            if($paymentData['trial_days']) {
                $nextPaymentDate = date('Y-m-d', strtotime('+' . $paymentData['trial_days'] . ' days', strtotime(date('Y-m-d'))));
            } else {
                if ($request->recurring == Product_model::PERIODICALLY_CUSTOM) {
                    $customdate              = json_decode($request->paymentLink->_products_with_request[0]->custom_date);
                    $nextPaymentDate         = date('Y-m-d', strtotime($request->recurring_date = $customdate[0]->date));
                } else {    
                    if ($request->paymentLink->_products_with_request[0]->start_subscription == 'E' && isset($request->paymentLink->_products_with_request[0]->start_date_input)) {
                        $nextPaymentDate = date('Y-m-d', strtotime($request->paymentLink->_products_with_request[0]->start_date_input));
                    } else {
                        $nextPaymentDate = date('Y-m-d', strtotime($request->recurring_date));
                    }
                }    
            }
            
            $paymentData['next_payment_date'] = $nextPaymentDate;            

            $transactionData['white_label_tag'] = isset($request->white_label_tag) && $request->white_label_tag ? $request->white_label_tag : null;
            //productsWithRequest when subscription only will hold one product
            $result = $PaymentInstance->createSubscription($transactionData, $customerData, $paymentData, $fund_data, isset($request->paymentLink) ? $request->paymentLink : null);

            return [ //payment info will retrieve payment information if the subscription generated a payment
                'status' => $result['error'] == 0 ? true : false, 
                'message' => $result['message'], 
                'payment_info' => $result['payment_info']
            ]; 
            
        }
    }
    public static function refund($transaction_id, $user_id) {
        $result = checkBelongsToUser([
            ['epicpay_customer_transactions.id' => $transaction_id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);

        if ($result !== true) {
            return $result;
        }

        $CI = & get_instance();
        
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance = PaymentsProvider::getInstance();

        $trnx = $CI->db->select('church_id')->where('id', $transaction_id)->get('epicpay_customer_transactions')->row();
        if(!$trnx) {
            return ['status' => false, 'message' => 'Unexpected error ! Transaction not found'];
        }

        $PaymentInstance->setAgentCredentials($trnx->church_id);

        $result = $PaymentInstance->refundTransaction($transaction_id);

        if ($result['error'] == 1) {
            return ['status' => false, 'message' => $result['message']];
        }

        return ['status' => true, 'message' => 'Refund successfully processed'];
    }

    //for now we can move the transaction from success to failed not viceversa
    public static function toggle_bank_trxn_status($transaction_id, $user_id) {

        $result = checkBelongsToUser([
            ['epicpay_customer_transactions.id' => $transaction_id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);

        if ($result !== true) {
            return $result;
        }

        $CI = & get_instance();

        ////////////
        //$dash_user = $CI->db->where('id', $user_id)->select('id, email, payment_processor')->get('users')->row();        
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        
        $PaymentInstance = PaymentsProvider::getInstance();

        ///////////

        $trnx = $CI->db->select('church_id')->where('id', $transaction_id)->get('epicpay_customer_transactions')->row();
        if (in_array($trnx->church_id, TEST_ORGNX_IDS)) {
            $PaymentInstance->setTesting(true);
        }
        $result = $PaymentInstance->setAsFailed($transaction_id);

        if ($result['error'] == 1) {
            return ['status' => false, 'message' => $result['message']];
        }

        return ['status' => true, 'message' => 'Status successfully processed'];
    }

    public static function stopSubscription($subscription_id, $user_id = false, $donor_id = false) {

        $CI = & get_instance();

        if ($user_id) {
            //$dash_user = $CI->db->where('id', $user_id)->select('id, email, payment_processor')->get('users')->row();
        } elseif ($donor_id) {
            $donor     = $CI->db->select('id_church')->where('id', $donor_id)->get('account_donor')->row();
            $church    = $CI->db->where('ch_id', $donor->id_church)->get('church_detail')->row();
            //$dash_user = $CI->db->where('id', $church->client_id)->select('id, email, payment_processor')->get('users')->row();
        } else {
            return ['status' => false, 'message' => 'Bad request'];
        }
        
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance = PaymentsProvider::getInstance();
        
        $result = $PaymentInstance->stopCustomerSubscription($subscription_id, $user_id, $donor_id);

        if ($result['error'] == 1) {
            return ['status' => false, 'message' => $result['message']];
        }

        return ['status' => true, 'message' => 'Subscription canceled'];
    }

    public static function addPaymentSource($orgId, $customerId, $ftsData) {

        require_once 'application/controllers/extensions/Payments/SourceDataBuilder.php';

        $CI        = & get_instance();
        $church    = $CI->db->where('ch_id', $orgId)->get('church_detail')->row();
        $dash_user = $CI->db->where('id', $church->client_id)->select('id, email, payment_processor')->get('users')->row();
        
        $CI->load->model('donor_model');
        $customer = $CI->donor_model->get(['id' => $customerId], ['id', 'email', 'first_name', 'last_name', 'id_church']);
    
        if(!$customer) {
            return ['status' => false, 'message' => 'Customer not found'];
        }

        $first_name = null;
        $last_name = null;
        if (empty($customer->first_name)) { //verifyx that when name not provided, it must take the one from the event
            $splittedFullName = splitFirstAndLastName($ftsData->account_holder_name ?? '');            
            $first_name  = $splittedFullName['first_name'];
            $last_name   = $splittedFullName['last_name'];
        } else {
            $first_name  = $customer->first_name;
            $last_name   = $customer->last_name;
        }
        
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance    = PaymentsProvider::getInstance();        
        $PaymentInstance->setAgentCredentials($orgId);

        $customerData = [
            'customer_address' => [
                'email' => $customer->email,
                'first_name' => $first_name,
                'last_name' => $last_name,
                'postal_code' => null
            ],
            'church_id' => $orgId,
            'account_donor_id' => $customerId,
            'is_saved' => 'Y',
        ];
                
        $paymentData = [
            'created_user_id' => $ftsData->created_user_id,
            'wallet_id' => $ftsData->id,
            'account_holder_name' => $ftsData->account_holder_name,
            'method' => 'credit_card',
            'card_exp_date' => $ftsData->exp_date,
            'src_account_type' => $ftsData->account_type,            
            'last_digits' => $ftsData->last_four,
            'fts_event' => $ftsData,
        ];

        $result = $PaymentInstance->createCustomer($customerData, $paymentData);
      
        if ($result['error'] == 0) {
            return ['status' => true, 'message' => 'Payment source added'];
        } else {
            return ['status' => false, 'message' => $result['message']];
        }
    }

//------ donor_id must come safe !!
//------ if donor id is not safe we can send the orngx_id to secure data, orgnx_id must come safe as well
    public static function removePaymentSource($source_id, $donor_id, $orgnx_id = null) {

        $CI     = & get_instance();
        
        if($donor_id) {
            $CI->db->where('account_donor_id', $donor_id); //securing the query
        } elseif($orgnx_id) {
            $CI->db->where('church_id', $orgnx_id); //securing the query
        } else {
            return ['status' => false, 'message' => 'An error ocurred, bad request'];
        }

        $source = $CI->db->where('id', $source_id)->get('epicpay_customer_sources')->row();
        $donor_id = $donor_id ? $donor_id : $source->account_donor_id; //sometimes donor_id is not provided so we need to load it from the source! 

        if (!$source) {
            return ['status' => false, 'message' => 'An error ocurred, no source found'];
        }
            
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance = PaymentsProvider::getInstance();
        $PaymentInstance->setAgentCredentials($source->church_id);
       
        $result = $PaymentInstance->deleteCustomerSource($source_id, $donor_id);

        if ($result['error'] == 0) {
            return ['status' => true, 'message' => 'Payment source removed'];
        } else {
            return ['status' => false, 'message' => $result['message']];
        }
    }

    public static function getPayout($church_id, $user_id, $payout_id, $type) {

        $result = checkBelongsToUser([['church_detail.ch_id' => $church_id, 'client_id', 'users.id', $user_id]]);

        if ($result !== true) {
            return $result;
        }

        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();

        return $PaymentInstance->getPayout($church_id, $payout_id, $type);

    }

    public static function getPayouts($church_id, $user_id, $requestBody) {

        $result = checkBelongsToUser([['church_detail.ch_id' => $church_id, 'client_id', 'users.id', $user_id]]);

        if ($result !== true) {
            return $result;
        }

        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();

        $data['result'] = new stdClass();
        $data['result']->data = $PaymentInstance->getPayouts($church_id, $requestBody);

        return $data;
    }

    public static function getPayoutCcTransactions($orgId, $userId, $payoutId) {
        
        $result = checkBelongsToUser([['church_detail.ch_id' => $orgId, 'client_id', 'users.id', $userId]]);

        if ($result !== true) {
            return $result;
        }

        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();
        
        return $PaymentInstance->getPayoutCcTransactions($orgId, $payoutId);
        
    }

    public static function getPayoutBankTransaction($orgId, $userId, $payoutId) {
        
        $result = checkBelongsToUser([['church_detail.ch_id' => $orgId, 'client_id', 'users.id', $userId]]);

        if ($result !== true) {
            return $result;
        }

        PaymentsProvider::init();
        $PaymentInstance = PaymentsProvider::getInstance();
        
        return $PaymentInstance->getPayoutBankTransaction($orgId, $payoutId);
        
    }

    private static function formatExpDate($exp_date, $dash_user) {
        $exp = explode('/', $exp_date);

        if (count($exp) !== 2) {
            return['status' => false, 'message' => 'Invalid Expiration Date'];
        }

        if (strlen($exp[0]) == 1) {
            $exp[0] = "0" . $exp[0];
        }

        //this is with epicpay, but need to be checked with fortis
        if (strlen($exp[1]) == 4) {
            $exp[1] = substr($exp[1], -2);
            if (!isset($exp[0]) || !$exp[0] || strlen($exp[0]) != 2) {
                return['status' => false, 'message' => 'Invalid Expiration Date'];
            }
        }
        return $exp;
    }

    public static function update_expiration_date($source_id, $postal_code, $exp_date, $holder_name = null, $street = null, $street2 = null, $city = null, $country = null) {
        $CI = & get_instance();
        $CI->load->model('donor_model');

        $source = $CI->db->where('id', $source_id)
                        ->where('is_active', 'Y')->where('is_saved', 'Y')
                        ->where_in('status', ['P', 'U'])
                        ->get('epicpay_customer_sources')->row();

        if (!$source) {
            return ['status' => false, 'message' => 'Source not found'];
        }

        $church    = $CI->db->where('ch_id', $source->church_id)->get('church_detail')->row();
        $dash_user = $CI->db->where('id', $church->client_id)->select('id, email, payment_processor')->get('users')->row();

        $result = PAYMENTS::formatExpDate($exp_date, $dash_user);

        if (isset($result['status']) && $result['status'] == false) {
            return $result;
        }

        $exp = $result;

        $walletdata = [];

        if ($dash_user->payment_processor === PROVIDER_PAYMENT_EPICPAY_SHORT) {
            PaymentsProvider::init();
            //if (!isset($postal_code) || !$postal_code) {
            //return ['status' => false, 'message' => 'Postal Code is required'];
            //}

            $walletdata["exp_month"] = $exp[0];
            $walletdata["exp_year"]  = $exp[1];

            $account_donor = $CI->db->where('id', $source->account_donor_id)->get('account_donor')->row();

            $names = explode(' ', $source->name_holder);
            $fname = isset($names[0]) && $names[0] ? $names[0] : null;
            $lname = isset($names[1]) && $names[1] ? $names[1] : null;

            $walletdata["account_holder_name"]            = $source->name_holder;
            $walletdata["billing_address"]["first_name"]  = $fname;
            $walletdata["billing_address"]["last_name"]   = $lname;
            $walletdata["billing_address"]["postal_code"] = $postal_code;
            $walletdata["billing_address"]["email"]       = $account_donor->email;
        }

        $PaymentInstance = PaymentsProvider::getInstance();

        $response = $PaymentInstance->processUpdateWallet($source, $walletdata);

        return [
            'status'  => $response['error'] ? false : true,
            'message' => $response['error'] ? $response['message'] : 'Source successfully updated'];
    }

    //church_id sent for determining which payment provider to use
    public static function getSingleUseTokenEncodedApiKey($payment_processor, $church_id) {
        return [
            'status' => false
        ];        
    }
    
    //church_id sent for determining which payment provider to use
    public static function getEnvironment($payment_processor, $church_id) {
        PaymentsProvider::init(PROVIDER_PAYMENT_FORTIS);
        $PaymentInstance = PaymentsProvider::getInstance();
        
        if (in_array($church_id, TEST_ORGNX_IDS)) {
            
            $PaymentInstance->setTesting(true);
        }
        
        $template = $PaymentInstance->getMerchantPricingTemplate($church_id);

        $CI = & get_instance();
        $CI->load->helper('fortis');
        return [
            'status'           => true,
            'envTest' => $PaymentInstance->getTesting(),
            'pricing_tpl' => getFortisTplParams($template)
        ];        
    }

    static function buildInvoiceDataPayment($invoice) {
          
        $CI = & get_instance();
        $CI->load->model('fund_model');        
        $CI->load->model('sources_model');
        $CI->load->model('donor_model');

        $customerId = $invoice->donor_id;
        $walletId = $invoice->payment_method_id;
        $orgId = $invoice->church_id;
        $campusId = $invoice->campus_id;

        $source = $CI->sources_model->getOne($customerId, $walletId, [
            'id', 
            'epicpay_wallet_id', 
            'epicpay_customer_id', 
            'name_holder',
            'src_account_type',
            'source_type'
        ]);

        $totalAmount = 0;

        if ($invoice->cover_fee) {
            if ($source['source_type'] === 'card') {                
                if ($source['src_account_type'] == 'amex') {
                    $totalAmount = $invoice->total_amount + $invoice->fee_when_amex;
                } else {
                    $totalAmount = $invoice->total_amount + $invoice->fee;
                }
            } else {
                $totalAmount = $invoice->total_amount + $invoice->fee_when_ach;
            }
        } else {
            $totalAmount = $invoice->total_amount;
        }

        $customer =$CI->donor_model->get($customerId, ['id', 'first_name', 'last_name'], true);

        $firstName = $customer->first_name;
        $lastName = $customer->last_name;

        $mainfund   = $CI->fund_model->getFirstOrgFund($orgId, $campusId);
        $fund_data = [['fund_id' => $mainfund->id, 'fund_amount' => $totalAmount]];        
        
        $request = new stdClass();
        $request->screen = 'dashboard';
        $request->church_id = $orgId;
        $request->campus_id = $campusId;
        $request->amount = $totalAmount;
        $request->invoice = $invoice;
        $request->fund_data = $fund_data;
        $request->payment_method = 'wallet';
        $request->recurring = 'one_time';

        $payment = new stdClass();
        $payment->bank_type = null;
        $payment->wallet_id = $source['id'];
        $payment->account_holder_name = $source['name_holder'];
        $payment->first_name = $firstName;
        $payment->last_name = $lastName;            
        $payment->created_user_id = $source['epicpay_customer_id'];
        $payment->postal_code = null;
        $payment->cover_fee = $invoice->cover_fee ? 1 : 0;
        $payment->src_account_type = $source['src_account_type'];
        
        $result = [
            "request" => $request,
            "payment" => $payment
        ];

        return $result;
        
    }


}
