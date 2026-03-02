<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Paysafecron extends CI_Controller {

    function __construct() {
        parent::__construct();
        display_errors();
        die;
    }

    //send subscription id for firing a payment of a subscription in particular
    public function process_recurrent_transactions($_sub_id = null, $simulate_date = null) {
        
        $subId = intval($_sub_id);
        
        if($_sub_id !== NULL && !$subId) {
            output_json(['status' => false, 'message' => 'bad_request']);
            return;
        }

        $valida = validateBearerToken(CRON_AUTH_TOKEN);
        if ($valida['error']) {
            output_json($valida);
            return;
        }
        
        require_once 'application/controllers/extensions/Payments.php';
        $this->load->model('product_model');
        $this->load->helper('payment_links');
        
        $today = $simulate_date ? $simulate_date : date('Y-m-d');
        //$today = '2022-12-31';

        $attemps_before_sub_suspension = 4; //-----when never has been a success payment
        $subs                          = $this->db->query(''
                        . 'SELECT * FROM epicpay_customer_subscriptions '
                        . 'WHERE TRUE '
                        . 'AND ispaysafe = 1 '
                        . 'AND status = "A" '
                        . "AND next_payment_on = '$today' "
                        . ($subId ? "AND id = $subId" : '')
                        . '')->result();
      
        $summary['count'] = count($subs);
        $pResults = [];
                
        foreach ($subs as $sub) {                        
            $frequency = $sub->frequency; 
            $save_data                    = [];
            
            $stopCustomSubscription = null; //the flag that allow us to know if we need to stop the custom subscription            
            
            if( $frequency != Product_model::PERIODICALLY_CUSTOM && !array_key_exists($frequency, Product_model::PERIODICALLY_TIME_DISTANCE )) {
                log_custom(LOG_CUSTOM_INFO, "paysafecron process_recurrent_transactions (subId=$subId) frequency error: " . $frequency);                
                continue;
            }          
                    
            $orgnx = null;
            if ($frequency == Product_model::PERIODICALLY_CUSTOM) {
                $this->load->model('organization_model');
                $orgnx = $this->organization_model->get($sub->church_id, 'ch_id, paysafe_template, client_id');
                
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
                $new_next_payment = date('Y-m-d', strtotime("$dist $today"));
            }
            

           
            $save_data['next_payment_on'] = $new_next_payment;
            
            $request = new stdClass();
            $request->church_id      = $sub->church_id;
            $request->campus_id      = $sub->campus_id;            
            $request->amount         = $sub->amount; // when this is a custom subscription, the subscription amount will be dynamic, the amount will be changing from payment to payment, the new amount will be read from the next date payment
            $request->payment_method = 'wallet';
            $request->screen         = $sub->giving_source;
            $request->recurring      = 'one_time';
            
            
            if($sub->payment_link_products_id) { //if subscription is from a payment_link_model we need to provide the paymentLink object
                
                $this->load->model('payment_link_product_paid_model');
                $productsPaid = $this->payment_link_product_paid_model->getListBy('subscription', $sub->id);
                
                $subscriptionProductPaid = $productsPaid['data'][0]; //always expecting productsPaid to be an array with one record | PL_recalcProductsWithRequest receives always an array
                
                //adding the _products_with_request to the paymentLink object | required for perfom the transaction | req is request (rebuild the original request done by the customer)
                //we expect to get only one product (one product per subscription) | anyway we receive an array                                
                $reqProducts         = [(object) ['link_product_id' => $sub->payment_link_products_id, 'qty' => $subscriptionProductPaid->qty_req]];                
                $productsWithRequest = PL_recalcProductsWithRequest($reqProducts, $convertToOnetime = true); // $convertToOnetime = true preparing subscription product into a one time product just for performing the payment process.
                
                if ($frequency == Product_model::PERIODICALLY_CUSTOM){
                    $productsWithRequest['_products'][0]->product_price=$sub->amount;
                }
                        
                //******* just getting the paymentLink, first getting the simple and next building the complex one                
                $this->load->model('payment_link_model');
                $paymentLinkSimple = $this->payment_link_model->getWhere(['id' => $subscriptionProductPaid->payment_link_id], $row = true, 'hash');                                
                $request->paymentLink = $this->payment_link_model->getByHash($paymentLinkSimple->hash); //getByHash gets the full Object, we need it //adding the paymentLink to the request
                //*******
                
                $request->paymentLink->_products_with_request = $productsWithRequest['_products'];                
            }
            
            ///////// Build the fund_data setup
            $this->load->model('transaction_fund_model', 'trnx_funds');
            $trnx_funds = $this->trnx_funds->getBySubscription($sub->id);

            $recalc_fund_data = []; // next payment amount for custom subscriptions
            $fund_data = [];
            if ($sub->is_fee_covered) {
                foreach ($trnx_funds as $tfund) { //it's a one loop cycle
                    $fund_data [] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $tfund['net']];
                    if ($frequency == Product_model::PERIODICALLY_CUSTOM && $stopCustomSubscription === false) { //if no stop then we need to calculate the next amount to be paid
                        $trx                 = new stdClass();
                        $trx->total_amount      = $save_data['amount'];
                        $trx->template          = $orgnx->paysafe_template; //$church->paysafe_template
                        $trx->src               = $sub->src;
                        
                        $transactionData['fee'] = getPaySafeFee($trx);
                        $transactionData['total_amount'] = $save_data['amount'];
                        
                        $recalc_fund_data [] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $trx->total_amount];                        
                    }
                }
                $recalc_fund_data = $recalc_fund_data ? setMultiFundDistrFeeCovered($recalc_fund_data, $transactionData) : [];
            } else {
                foreach ($trnx_funds as $tfund){  //it's a one loop cycle
                    $fund_data [] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $tfund['amount']];                    
                    if ($frequency == Product_model::PERIODICALLY_CUSTOM &&  $stopCustomSubscription === false) { //if no stop then we need to calculate the next amount to be paid
                        $trx                 = new stdClass();
                        $trx->total_amount      = $save_data['amount'];
                        $trx->template          = $orgnx->paysafe_template; //$church->paysafe_template
                        $trx->src               = $sub->src;
                        
                        $transactionData['fee'] = getPaySafeFee($trx);
                        $transactionData['total_amount'] = $save_data['amount'];

                        $recalc_fund_data [] = ['fund_id' => $tfund['fund_id'], 'fund_amount' => $trx->total_amount];                        
                    }
                }                
                $recalc_fund_data = $recalc_fund_data ? setMultiFundDistrFeeNotCovered($recalc_fund_data, $transactionData) : [];
            }
            
            $request->fund_data = $fund_data;

            $request->from_subscription_id = $sub->id;

            $payment                        = new stdClass();
            $payment->cover_fee             = $sub->is_fee_covered;
            $payment->wallet_id             = $sub->customer_source_id;
            $payment->success_trxns = $sub->success_trxns;

            $donorId = $sub->account_donor_id;

            $this->load->model('sources_model');
            $src                = $this->sources_model->getOne($donorId, $payment->wallet_id, ['id', 'bank_type'], true);
            $payment->bank_type = $src->bank_type;
           
            $pResult = Payments::process($request, $payment, $donorId);
            
            $pResults [] = $pResult;
            
            $summary['subs_success'] = [];
            $summary['subs_failed']  = [];

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
                $summary['subs_failed'][] = ['request' => $request, 'payment' => $payment, 'donorId' => $donorId, 'result' => $pResult];
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
        
        log_custom(LOG_CUSTOM_INFO, "paysafecron process_recurrent_transactions cron log (subId=$subId): " . json_encode($summary));
        output_json(['summary' => $summary, 'pResults' => $pResults]);
    }

}
