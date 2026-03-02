<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Fortiscron extends CI_Controller {

    function __construct() {
        parent::__construct();
        display_errors();
    }

    //send subscription id for firing a payment of a subscription in particular
    public function process_recurrent_transactions($_sub_id = null, $simulate_date = null) {
        
        $subId = intval($_sub_id);
        
        if($_sub_id !== NULL && !$subId) {
            output_json(['status' => false, 'message' => 'bad_request']);
            return;
        }

        if (!IS_DEVELOPER_MACHINE) {
            $valida = validateBearerToken(CRON_AUTH_TOKEN);
            if ($valida['error']) {
                output_json($valida);
                return;
            }
        }
        
        require_once 'application/controllers/extensions/Payments.php';
        $this->load->model('product_model');
        $this->load->helper('payment_links');
        
        $attemps_before_sub_suspension = 4; //-----when never has been a success payment

        $today = $simulate_date ? $simulate_date : date('Y-m-d');
        
        $startOfDay = "$today 00:00:00";
        $endOfDay = "$today 23:59:59";

        $q = ''
            . 'SELECT * FROM epicpay_customer_subscriptions '
            . 'WHERE TRUE '
            . 'AND status = "A" '
            . "AND next_payment_on BETWEEN '$startOfDay' AND '$endOfDay' "
            . ($subId ? "AND id = $subId" : '')
            . '';
                                
        $subs                          = $this->db->query($q)->result();

        $summary['count'] = count($subs);
        $summary['subs_success'] = [];
        $summary['subs_failed']  = [];

        $pResults = [];
                
        foreach ($subs as $sub) {                        
            $frequency = $sub->frequency; 
            $save_data                    = [];
            
            $stopCustomSubscription = null; //the flag that allow us to know if we need to stop the custom subscription            
            
            if( $frequency != Product_model::PERIODICALLY_CUSTOM && !array_key_exists($frequency, Product_model::PERIODICALLY_TIME_DISTANCE )) {
                log_custom(LOG_CUSTOM_INFO, "fortiscron process_recurrent_transactions (subId=$subId) frequency error: " . $frequency);                
                continue;
            }          
                    
            $this->load->model('organization_model');
            $orgnx = $this->organization_model->get($sub->church_id, 'ch_id, fortis_template, client_id');
            if ($frequency == Product_model::PERIODICALLY_CUSTOM) {
                $currentpaymentdate  = $sub->next_payment_on;
                $new_next_payment =$currentpaymentdate;
                $this->load->model('payment_link_product_model');
                $products        = $this->payment_link_product_model->get($sub->payment_link_products_id);
                $custom_date_arr = json_decode($products->custom_date);
                
                for ($x = 0; $x < count($custom_date_arr); $x++) {                    
                    if (date('Y-m-d', strtotime($custom_date_arr[$x]->date)) == $currentpaymentdate) {     
                        if ($x != (count($custom_date_arr))-1 ){   
                            $new_next_payment = date('Y-m-d', strtotime($custom_date_arr[$x + 1]->date));  
                            $save_data['amount'] = $custom_date_arr[$x + 1]->amount; //find the amount to be paid in the next payment (not the current, the current is on $sub->amount)
                        }
                    }
                }                
                $stopCustomSubscription = !isset($save_data['amount']) || !$save_data['amount'] ? true : false;
            } else {
                $dist             = Product_model::PERIODICALLY_TIME_DISTANCE[$frequency];
                $new_next_payment = date('Y-m-d 23:59:59', strtotime("$dist $today"));
            }
            
            $save_data['next_payment_on'] = $new_next_payment;

            $this->db->where('id', $sub->id)->update('epicpay_customer_subscriptions', ['next_payment_on' => $new_next_payment]); //saving here, because the when payment done, payments will send a webhhook, that reads next payment on
            
            $request = new stdClass();
            $request->church_id      = $sub->church_id;
            $request->campus_id      = $sub->campus_id;            
            $request->amount         = $sub->amount; // when this is a custom subscription, the subscription amount will be dynamic, the amount will be changing from payment to payment, the new amount will be read from the next date payment
            $request->payment_method = 'wallet';
            $request->screen         = $sub->giving_source;
            $request->recurring      = 'one_time';

            $payment                        = new stdClass();
            $payment->cover_fee             = $sub->is_fee_covered;
            $payment->wallet_id             = $sub->customer_source_id;
            $payment->success_trxns = $sub->success_trxns;

            $donorId = $sub->account_donor_id;

            $this->load->model('sources_model');
            $src                = $this->sources_model->getOne($donorId, $payment->wallet_id, ['id', 'bank_type', 'source_type', 'src_account_type'], true, null, false); //ensure active false
            
            $paymentMethod = null;
            if($src->source_type === 'card') {
                $paymentMethod = 'cc';
                if($src->src_account_type === 'amex') {
                    $paymentMethod .= '_amex';
                }
            } else {
                $paymentMethod = 'ach';
            }


            $payment->bank_type = $src->bank_type;
            $payment->src_account_type = $src->src_account_type;
            
            $paymentMethods = null;
            if($sub->payment_link_products_id) { //if subscription is from a payment_link_model we need to provide the paymentLink object
                
                $this->load->model('payment_link_product_paid_model');
                $productsPaid = $this->payment_link_product_paid_model->getListBy('subscription', $sub->id);
                
                $subscriptionProductPaid = $productsPaid['data'][0]; //always expecting productsPaid to be an array with one record | PL_recalcProductsWithRequest receives always an array
                
                //adding the _products_with_request to the paymentLink object | required for perfom the transaction | req is request (rebuild the original request done by the customer)
                //we expect to get only one product (one product per subscription) | anyway we receive an array                                
                $reqProducts         = [(object) ['link_product_id' => $sub->payment_link_products_id, 'qty' => $subscriptionProductPaid->qty_req]];

                $feeObject = (object) ['coverFee' => $sub->is_fee_covered, 'paymentMethod' => $paymentMethod, 'orgId' => $sub->church_id, 'processorShort' => PROVIDER_PAYMENT_FORTIS_SHORT];
                $productsWithRequest = PL_recalcProductsWithRequest($reqProducts, $convertToOnetime = true, $feeObject); // $convertToOnetime = true preparing subscription product into a one time product just for performing the payment process.
                
                if ($frequency == Product_model::PERIODICALLY_CUSTOM){
                    $productsWithRequest['_products'][0]->product_price=$sub->amount;
                }
                        
                //******* just getting the paymentLink, first getting the simple and next building the complex one                
                $this->load->model('payment_link_model');
                $paymentLinkSimple = $this->payment_link_model->getWhere(['id' => $subscriptionProductPaid->payment_link_id], $row = true, 'hash');                                
                $request->paymentLink = $this->payment_link_model->getByHash($paymentLinkSimple->hash); //getByHash gets the full Object, we need it //adding the paymentLink to the request
                //*******
                
                $request->paymentLink->_products_with_request = $productsWithRequest['_products'];
                $paymentMethods = $request->paymentLink->payment_methods ? json_decode($request->paymentLink->payment_methods) : ['CC', 'BANK'];
            }

            ///////// Build the fund_data setup
            $this->load->model('transaction_fund_model', 'trnx_funds');
            $trnx_funds = $this->trnx_funds->getBySubscription($sub->id);

            $recalc_fund_data = []; // next payment amount for custom subscriptions
            $fund_data = [];
            foreach ($trnx_funds as $tfund) {  //it's a one loop cycle
                $fund_data[] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $tfund['amount']];
                if ($frequency == Product_model::PERIODICALLY_CUSTOM && $stopCustomSubscription === false) { //if no stop then we need to calculate the next amount to be paid
                    $trx                 = new stdClass();
                    $trx->total_amount      = $save_data['amount'];
                    $trx->template          = $orgnx->fortis_template;
                    $trx->src               = $sub->src;

                    $transactionData['fee'] = getFortisFee($trx);
                    $transactionData['total_amount'] = $save_data['amount'];

                    $recalc_fund_data[] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $trx->total_amount];
                }
            }
            
            $recalc_fund_data = $recalc_fund_data ? setMultiFundDistrFeeNotCovered($recalc_fund_data, $transactionData) : [];
                        
            $request->fund_data = $fund_data;

            $request->from_subscription_id = $sub->id;
            
            $invoiceObj = $this->createInvoice($sub, $donorId, $paymentMethods, $orgnx->client_id);
            
            if($invoiceObj) {
                $request->invoice = $invoiceObj;   
            }

            $pResult = Payments::process($request, $payment, $donorId);
            
            $pResults [] = $pResult;
            
            if ($pResult['status']) {
               
                // -------- success payment
                $save_data['success_trxns'] = $sub->success_trxns ? ($sub->success_trxns + 1) : 1;

                //*****
                $summary['subs_success'][] = ['request' => $request, 'payment' => $payment, 'donorId' => $donorId, 'trxn_id' => $pResult['trxn_id']];
            } else {
                // -------- fail payment
                $save_data['fail_trxns'] = $sub->fail_trxns ? ($sub->fail_trxns + 1) : 1;

                // -------- if never has been a success payment and attempts are reached suspend subscription
                if (!$sub->success_trxns && $save_data['fail_trxns'] == $attemps_before_sub_suspension) {
                    $save_data['status'] = 'D';
                    // ------- we can do something here, send an email to the donor or trigger a notification to system administrator
                }

                //***** for logs only
                $summary['subs_failed'][] = ['request' => $request, 'payment' => $payment, 'donorId' => $donorId, 'result' => $pResult, 'trxn_id' => $pResult['trxn_id']];
            }
           
            if($recalc_fund_data) { //rotating, only for custom products                
                $trnx_fund = ['amount' => $recalc_fund_data[0]['_fund_amount'], 'fee' => $recalc_fund_data[0]['_fund_fee'], 'net' => $recalc_fund_data[0]['_fund_sub_total_amount']];
                $this->trnx_funds->updateBySubscription($sub->id, $trnx_fund);
            }  
            
            if($stopCustomSubscription === true) {
                Payments::stopSubscription($subId, $orgnx->client_id);
                unset($save_data['amount']); //we don't want to write null on the subscription amount                
            }
                    
            $this->db->where('id', $sub->id)->update('epicpay_customer_subscriptions', $save_data);
        }
        
        if(!IS_DEVELOPER_MACHINE){
            log_custom(LOG_CUSTOM_INFO, "fortissafecron process_recurrent_transactions cron log (subId=$subId): " . json_encode($summary));
        }
        output_json(['summary' => $summary, 'pResults' => $pResults], false, false ,false, true);
    }

    private function createInvoice($sub, $donorId, $paymentMethods, $client_id) {
        ///////// create the invoice
        $this->load->model('payment_link_product_model');
        $paymentLinkProduct = $this->payment_link_product_model->get($sub->payment_link_products_id, '*');
        
        $this->load->model('invoice_model');
        $invoiceData = [
            'organization_id' => $sub->church_id,
            'suborganization_id' => $sub->campus_id,
            'account_donor_id' => $donorId,
            'payment_options' => $paymentMethods ? $paymentMethods : ['CC', 'BANK'],
            'due_date' => date('Y-m-d'),
            'subscription_id' => $sub->id,
            'command' => 'save_from_subscription',
            'product_id' => [
                '1' => $paymentLinkProduct->id // verifyx get this from the original amount no an amount that can be changed, put this amount in this modeñ
            ],
            'quantity' => [
                '1' => $paymentLinkProduct->qty // verifyx the same here.
            ],
            "memo" => "Invoice generated from subscription #" . $sub->id,
            "footer" => "",
            "tags" => "Subscription #" . $sub->id,
            "cover_fee" => $sub->is_fee_covered
            
        ];
        
        $this->load->use_theme();
        $result = $this->invoice_model->save($invoiceData, $client_id);
        $invoiceObj = null;
        if(isset($result['data']['id']) && $result['data']['id']) {
            $invoiceObj = new stdClass();
            $invoiceObj->id = $result['data']['id'];
            $invoiceObj->subscription_id = $sub->id; //not needed remove it verifyx
        }
        return $invoiceObj;
    }
    
    /* Check for status changes triggered by time-based events, such as:
        unpaidPeriodEnds (end of grace period), trialPeriodEnds, accessPeriodEnds
    */
            
    public function fire_subscriptions_webhook() {
        
        if (!IS_DEVELOPER_MACHINE) {
            $valida = validateBearerToken(CRON_AUTH_TOKEN);
            if ($valida['error']) {
                output_json($valida);
                return;
            }
        }
        
        $this->load->model('subscription_model');        
        $subs = $this->subscription_model->getAllBasedOnTimeChange();

        $this->load->library('WebhookService');
        $webhookService = new WebhookService();

        $this->load->model('organization_model');        

        foreach($subs as $subscription) {
            $orgnx = $this->organization_model->get($subscription->church_id); //verifyx optimize
            
            if (!$orgnx) {
                log_custom(LOG_CUSTOM_ERROR, "fire_subscriptions_webhook error: Organization not found for church_id: " . $subscription->church_id);
                continue;
            }

            $sendData = [
                'account_donor_id' => $subscription->account_donor_id,
                'id' => $subscription->id,
                'payment_link_products_id' => $subscription->payment_link_products_id,
                'frequency' => $subscription->frequency,
                'amount' => $subscription->amount,
                'start_on' => $subscription->start_on,
                'next_payment_on' => $subscription->next_payment_on,
                'email' => $subscription->email,
                'first_name' => $subscription->first_name,
                'last_name' => $subscription->last_name,
                'status' => $subscription->status,
                'c_status' => $subscription->c_status,
                'trial_ends_at' => $subscription->trial_ends_at,
                'ends_at' => $subscription->ends_at,
                'trial_status' => $subscription->trial_status,
                'last_transaction_id' => $subscription->last_transaction_id,
                'access_period_status' => $subscription->access_period_status,
                'created_as_trial' => $subscription->created_as_trial,
                'webhook_sent_log' => $subscription->webhook_sent_log
            ];

            // Send webhook for subscription created event
            $webhookService->sendSubscription($orgnx->client_id, $sendData, 'subscription_updated');            
        }

        
        log_custom(LOG_CUSTOM_INFO, "fortissafecron fire_subscriptions_webhook cron log: " . json_encode($subs));
        

        output_json(['status' => true, 'message' => 'ok', 'data' => $subs], false, false ,false, true);
        
    }

}
