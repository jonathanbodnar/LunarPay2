<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function suGetTrialText($trial_days, $created_at) {
    if ($trial_days === null || $trial_days <= 0) {
        return ''; // No trial
    }

    $created_ts = strtotime($created_at);
    if ($created_ts === false) {
        return ''; // Invalid date
    }

    // Make trial end at the END of the last trial day
    $trial_end_ts = strtotime("+{$trial_days} days 23:59:59", $created_ts);

    $now_ts = time();
    // Simulate now + 2 days
    //$now_ts = time() + (3* 86400);
    
    if ($now_ts <= $trial_end_ts) {
        return 'Trial Active';
    } else {
        return 'Trial Finished';
    }
}

class Subscription_model extends CI_Model {

    private $table = 'epicpay_customer_subscriptions';
    public $valAsArray   = false; //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    public function getDt($user_id = null) {
        
        //Getting Organization Ids
        $user_id = $user_id ? $user_id : $this->session->userdata('user_id');
        
        $user = $this->db->select('payment_processor')->where('id', $user_id)->get('users')->row();

        $organizations_ids = getOrganizationsIds($user_id);

        $subs_data['monthly'] = $this->getSubsTotals($organizations_ids, 'month');
        $subs_data['all']     = $this->getSubsTotals($organizations_ids, 'all');
        $subs_data['count']   = $this->getSubsCount($organizations_ids);

        $this->load->library("Datatables");
        $this->datatables->select("sub.id, IF(sub.frequency = 'Custom', plp.product_price, sub.amount) as amount, ROUND(sum(tf.net), 2) as given, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as trxs_net, 
                count(DISTINCT trx.id) trxs_count, group_concat(DISTINCT f.name ORDER BY tf2.id ASC SEPARATOR ', ') as fund,                 
                CONCAT_WS(' ',sub.first_name,sub.last_name) as name, sub.email, DATE_FORMAT(sub.start_on, '%m/%d/%Y') as start_on, sub.trial_days,
                sub.frequency,  
                (CASE 
                    WHEN sub.src = 'CC' then 'Card' 
                    WHEN sub.src = 'BNK' then 'ACH' else '' 
                END) as method, 
                sub.src, DATE_FORMAT(sub.created_at, '%m/%d/%Y') as _created_at, sub.created_at, 
                sub.start_on substart_on, sub.frequency subfrequency,                 
                (CASE
                    WHEN sub.status = 'A' then 'Active'
                    WHEN sub.status = 'D' then 'Canceled'
                END) as status_text, sub.status, sub.trial_days
                    ")
                ->from($this->table . ' as sub')
                //->join('account_donor as ad', 'ad.id = sub.account_donor_id', 'LEFT')
                ->join('epicpay_customer_transactions trx', ''
                        . 'trx.customer_subscription_id = sub.id AND'
                        . '((trx.status = "P" AND trx.src = "CC") OR trx.status_ach in ("P") OR (trx.status = "P" AND trx.trx_type = "RE"))', 'LEFT') //rest refunds
                ->join('transactions_funds as tf', 'tf.transaction_id = trx.id', 'LEFT') //used for detailed sum
                ->join('transactions_funds as tf2', 'tf2.subscription_id = sub.id', 'LEFT') // used for reaching fund's names from subscription, if we reach directly from tf we wont get the fund_ids when the subscription does not have transactions
                ->join('funds as f', 'f.id = tf2.fund_id', 'LEFT')
                ->join('payment_link_products plp', 'plp.id = sub.payment_link_products_id', 'LEFT')
                ->where_in('sub.status', ['A', 'D'])
                ->group_by('sub.id');
            
                $this->datatables->add_column('_trial_text', '$1', 'suGetTrialText(trial_days, created_at)');



        if($user->payment_processor == PROVIDER_PAYMENT_EPICPAY_SHORT){
            $this->load->helper('epicpay_helper');
            $this->datatables->edit_column('frequency', '$1', 'getEpicpayFreqLabel(frequency)');
        }elseif($user->payment_processor == PROVIDER_PAYMENT_PAYSAFE_SHORT){
            $this->load->helper('paysafe_helper');            
            $this->datatables->edit_column('frequency', '$1', 'getPaysafeFreqLabel(frequency)');
        }elseif($user->payment_processor == PROVIDER_PAYMENT_FORTIS_SHORT){
            $this->load->helper('fortis_helper');            
            $this->datatables->edit_column('frequency', '$1', 'getFortisFreqLabel(frequency)');
        }
        
        //Organizations of User Filter
        $this->datatables->where('sub.church_id in (' . $organizations_ids . ')');

        //Organizations Filter
        $church_id = (int) $this->input->post('organization_id');
        if ($church_id)
            $this->datatables->where('sub.church_id', $church_id);

        //Sub Organizations Filter
        $campus_id = (int) $this->input->post('suborganization_id');
        if ($campus_id)
            $this->datatables->where('sub.campus_id', $campus_id);

        //Funds Filter
        $fund_id = (int) $this->input->post('fund_id');
        if ($fund_id)
            $this->datatables->where('tf2.fund_id = ' . $fund_id);            

        //Method Filter        
        if ($this->input->post('method'))
            $this->datatables->where('sub.src', $this->input->post('method'));

        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->datatables->where('sub.frequency', $freq);

        //$data = $this->datatables->generate();
        $data = $this->datatables->generate([
            "subs_data" => $subs_data
        ]);

        return $data;
    }

    private function getSubsTotals($orgnx_ids, $type) {

        $this->db->select("sum(tf.net) as total, max(tr.sub_total_amount) as max_net, max(tf.net) as max_net_fund")
                ->join($this->table . ' as sub', 'sub.id = tr.customer_subscription_id', 'INNER')
                ->join('transactions_funds as tf', 'tf.transaction_id = tr.id', 'INNER')
                ->where('((tr.status = "P" AND tr.src = "CC") OR tr.status_ach in ("P") '
                        . 'OR (tr.status = "P" AND tr.trx_type = "RE"))', null, false); //rest refunds

        if ($type == 'month') {
            $this->db->where('sub.frequency', 'month');
        } elseif ($type == 'all') {
            //==== ALl
        }

        //Organizations of User Filter
        $this->db->where('tr.church_id in (' . $orgnx_ids . ')');

        //Organizations Filter
        $church_id = (int) $this->input->post('organization_id');
        if ($church_id)
            $this->db->where('tr.church_id', $church_id);

        //Sub Organizations Filter
        $campus_id = (int) $this->input->post('suborganization_id');
        if ($campus_id)
            $this->db->where('tr.campus_id', $campus_id);

        //Funds Filter
        $fund_id = (int) $this->input->post('fund_id');
        if ($fund_id)
            $this->db->where('tf.fund_id', $fund_id);

        //Method Filter
        $method = $this->input->post('method');
        if ($method)
            $this->db->where('tr.src', $method);

        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->db->where('sub.frequency', $freq);

        $data = $this->db->get('epicpay_customer_transactions as tr')->row();

        $result            = [];
        $result['total']   = '0.00';
        $result['max_net'] = '0.00';
        $result['max_net_fund'] = '0.00';
        
        if (isset($data->total) && $data->total) {
            $result['total'] = number_format($data->total, 2, '.', '');
        }

        if (!$fund_id) {
            if (isset($data->max_net) && $data->max_net) {
                $result['max_net'] = number_format($data->max_net, 2, '.', '');
            } 
        } else {
            if (isset($data->max_net_fund) && $data->max_net_fund) {
                $result['max_net'] = number_format($data->max_net_fund, 2, '.', '');
            }
        }

        return $result;
    }

    private function getSubsCount($orgnx_ids) {

        $this->db->select('count(DISTINCT sub.id) as total, DATE_FORMAT(min(sub.start_on), "%m/%d/%Y") as since')
                ->join('transactions_funds tf', 'tf.subscription_id = sub.id', 'LEFT')
                ->where('sub.status', 'A');

        //Organizations of User Filter
        $this->db->where('sub.church_id in (' . $orgnx_ids . ')');

        //Organizations Filter
        $church_id = (int) $this->input->post('organization_id');
        if ($church_id)
            $this->db->where('sub.church_id', $church_id);

        //Sub Organizations Filter
        $campus_id = (int) $this->input->post('suborganization_id');
        if ($campus_id)
            $this->db->where('sub.campus_id', $campus_id);

        //Funds Filter
        $fund_id = (int) $this->input->post('fund_id');
        if ($fund_id)
            $this->db->where('tf.fund_id', $fund_id);

        //Method Filter
        
        if ($this->input->post('method'))
            $this->db->where('sub.src', $this->input->post('method'));

        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->db->where('sub.frequency', $freq);

        $data = $this->db->get($this->table . ' as sub')->row();

        $result          = [];
        $result['count'] = 0;
        $result['since'] = '-';

        if (isset($data->total) && $data->total) {
            $result['count'] = $data->total;
        }

        if (isset($data->since) && $data->since) {
            $result['since'] = $data->since;
        }

        return $result;
    }

    public function getList($donor_id) {
        $this->db->select('s.id, s.account_donor_id, s.church_id, s.campus_id, s.amount, s.frequency, s.is_fee_covered, s.next_payment_on, '
                        .'"" as name, lppp.product_name as product_name, '
                        . 'DATE_FORMAT(s.start_on, "%m/%d/%Y") as start_on, DATE_FORMAT(s.created_at, "%m/%d/%Y") as created_at, '
                        . 'DATE_FORMAT(s.updated_at, "%m/%d/%Y") as updated_at, DATE_FORMAT(s.cancelled_at, "%m/%d/%Y") as cancelled_at,'
                        . 'GROUP_CONCAT(f.name SEPARATOR ", ") funds_name, s.white_label_tag, '
                        . 'scs.last_digits, if(scs.source_type = "bank", "Bank",if(scs.source_type = "card", "Card","")) payment_method, '
                        . 'scs.src_account_type, scs.last_digits, scs.name_holder'
                        . '')
                ->join('epicpay_customer_sources scs', 'scs.id = s.customer_source_id', 'LEFT')
                ->join('payment_link_products_paid lppp', 'lppp.subscription_id = s.id', 'LEFT')
                ->join('transactions_funds tf', 'tf.subscription_id = s.id', 'INNER')
                ->join('funds f', 'f.id = tf.fund_id', 'INNER')
                ->where('s.status', 'A')->where('s.account_donor_id', $donor_id)
                ->group_by('s.id')
                ->order_by('s.id', 'DESC');

        $row = $this->db->get($this->table . ' s')->result_array();

        return $row;
    }

    //===== get last subscriptions
    public function getNewSubscriptionsZapierPoll($user_id) {

        $orgnx_ids = getOrganizationsIds($user_id);

        $from = '2020-09-21';
        $data = $this->db->select(''
                                . 'sub.id, sub.email, sub.first_name, sub.last_name, dnr.phone, '
                                . 'sum(tf.amount) as amount, sum(tf.fee) as fee, sum(tf.net) as net, '
                                . 'sub.frequency, DATE_FORMAT(sub.start_on, "%Y-%m-%d") as starts_on, '
                                . 'if(sub.is_fee_covered = 1, "Yes", "No") as is_fee_covered, '
                                . 'GROUP_CONCAT(f.name SEPARATOR ", ") funds, sub.src, '
                                . 'if(sub.src = "BNK", "ACH", if(sub.src = "CC", "Card","")) payment_method, '
                                //. 'trx.church_id, trx.campus_id'
                                . 'DATE(sub.created_at) as created_at')
                        ->join('transactions_funds tf', 'tf.subscription_id = sub.id', 'inner')
                        ->join('funds f', 'f.id = tf.fund_id', 'inner')
                        ->join('account_donor dnr', 'dnr.id = sub.account_donor_id', 'left') //We could put a inner join, all transactions must have a donor even if is anonymous
                        ->where('sub.status', 'A')
                        ->where('sub.church_id in (' . $orgnx_ids . ')')
                        ->where("sub.created_at >= '$from'", null, false)
                        ->group_by('sub.id')
                        ->limit(25, 0)
                        ->order_by('sub.id', 'desc')
                        ->get($this->table . ' sub')->result();

        return $data;
    }
    
     public function getIdSubscriptions($id) {
         
        $this->db->select('sub.id,  sub.customer_id,  sub.customer_source_id,  sub.church_id,  sub.campus_id,  sub.account_donor_id,  sub.first_name,  sub.last_name,'
                        . 'IF(sub.frequency = "Custom", plp.product_price, sub.amount) as amount, ROUND(sum(tf.net), 2) as given, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as trxs_net,'    
                        . 'sub.email,  sub.zip,  sub.giving_source,  sub.giving_type,  sub.tags,  sub.frequency,  sub.start_on,  sub.next_payment_on,  sub.multi_transaction_data,  '
                        . 'CONCAT_WS(" ",sub.first_name,sub.last_name) as name,sub.email, DATE_FORMAT(sub.start_on, "%m/%d/%Y") as start_on,'
                        . 'sub.multi_transaction_data_bkup,  sub.amount,  sub.request_data, '
                        . '(CASE WHEN sub.src = "CC" then "Card"  WHEN sub.src = "BNK" then "ACH" else "" END) as method,'
                        . 'sub.request_response,  sub.request_response_update,  sub.stopsub_request,  sub.stopsub_response,  sub.epicpay_customer_id,  sub.epicpay_wallet_id,  '
                        . 'sub.epicpay_subscription_id,sub.epicpay_template,  sub.src,  sub.is_fee_covered,  sub.status,  sub.migrated,  sub.created_at,  sub.updated_at,  sub.cancelled_at,'
                        . 'sub.from_stripemigration_sid,  sub.done_temp,  sub.campaign_id,  sub.ispaysafe,  sub.success_trxns,  sub.fail_trxns,'
                        . 'sub.payment_link_products_id,  sub.white_label_tag, DATE_FORMAT(sub.start_on, "%m/%d/%Y") as start_on,'
                        . 'count(DISTINCT trx.id) trxs_count,(CASE WHEN sub.status = "A" then "Active"  WHEN sub.status = "D" then "Canceled" END) as status_text,'
                        . 'DATE_FORMAT(sub.created_at, "%m/%d/%Y") as created_at,sub.status, sub.trial_days')                      
                        ->join('epicpay_customer_transactions trx', ''
                        . 'trx.customer_subscription_id = sub.id AND'
                        . '((trx.status = "P" AND trx.src = "CC") OR trx.status_ach in ("P") OR (trx.status = "P" AND trx.trx_type = "RE"))', 'LEFT')                        
                        ->join('transactions_funds as tf', 'tf.transaction_id = trx.id', 'LEFT') //used for detailed sum
                        ->join('transactions_funds as tf2', 'tf2.subscription_id = sub.id', 'LEFT') // used for reaching fund's names from subscription, if we reach directly from tf we wont get the fund_ids when the subscription does not have transactions
                        ->join('funds as f', 'f.id = tf2.fund_id', 'LEFT')
                        ->join('payment_link_products plp', 'plp.id = sub.payment_link_products_id', 'LEFT')
                ->where('sub.id ', $id)
                ->where_in('sub.status', ['A', 'D'])
                ->from($this->table . ' sub');
        $data = $this->db->get()->row();
        
        return $data;  
    }

    public function update($id, $data) {
        
        $this->db->where('id', $id);
        $this->db->update($this->table, $data);
    }

    /**
     * Get subscription by ID with security validation
     * @param int $id - Subscription ID
     * @param int $orgId - Organization ID (optional, for additional security)
     * @param int $client_id - Client ID for organization validation
     * @return object|null - Subscription data or null if not found
     */
    public function getById($id, $orgId = null, $client_id = false) {

        if ($client_id) { //secure organizations
            
            //Getting Organization Ids
            $organizations_ids = getOrganizationsIds($client_id);
            $this->db->where('church_id in (' . $organizations_ids . ')');
        }

        if($orgId) { //just securing the when we need to get a specific subscription of a specific organization even when the client_id is validated
            $this->db->where('church_id', $orgId);
        }

        $this->db->where('id', $id);

        $subscription =  $this->db->get($this->table)->row();
        if($subscription) {
            $this->load->model('payment_link_product_model');
            $subscription->_product = $this->payment_link_product_model->get($subscription->payment_link_products_id);            
        }

        return $subscription;
        
    }
    
    public function updateSubscriptionStatus($subscriptionId, $creation = false) {
        
        // Get the subscription from database
        $subscription = $this->db->where('id', $subscriptionId)->get($this->table)->row();
        $old_c_status = $subscription->c_status;
        
        if (!$subscription) {
            return null;
        }
        
        // Calculate the status fields using existing logic
        $subscription = $this->findStatusChangesAndTrialInfo($subscription);
        
        // Prepare update data with calculated fields
        $updateData = [
            'c_status' => $subscription->c_status,
            'trial_status' => $subscription->trial_status,
            'access_period_status' => $subscription->access_period_status,
            'trial_ends_at' => $subscription->trial_ends_at,
            'ends_at' => $subscription->ends_at,
            'created_as_trial' => $subscription->created_as_trial ? 1 : 0,
            'last_transaction_id' => $subscription->last_transaction_id,
            'status_calculated_at' => date('Y-m-d H:i:s'),
            'last_unpaid_log_at' => $old_c_status !== 'unpaid' && $subscription->c_status === 'unpaid' 
                ? date('Y-m-d H:i:s') : $subscription->last_unpaid_log_at,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        // Update the subscription with calculated fields
        $this->db->where('id', $subscriptionId);
        $this->db->update($this->table, $updateData);
        
        // Return the updated subscription object
        return $subscription;
    }

    /** 
 * Used to update status from the dashboard, customer actions, or cron job payments (e.g., subscription payments).
 * Not used for subscription status updates that depend on time-based changes — in that case review: fire_subscriptions_webhook
 
     * Enriches the subscription object with calculated status and timing information.
     *
     * Determines whether the subscription is on trial, active, unpaid, or cancelled,
     * and sets the appropriate status flags based on trial dates, payment activity,
     * and cancellation state.
     *
     * Useful for consistent handling of subscription state across the system.
     * c_statuses: on_trial | active | unpaid | cancelled
    */
    private function findStatusChangesAndTrialInfo($subscription) {

        $this->load->model('donation_model');

        $current_date = date('Y-m-d 23:59:59');
        //$current_date = date('2025-09-01 23:59:59');
        
        $next_payment_on = $subscription->next_payment_on;
        
        $trial_end_date = null;
        
        $subscription->next_payment_on = $next_payment_on;
        
        $subscription->trial_ends_at = null;
        $subscription->c_status = null;
        $subscription->ends_at = null; //it is the date the sub will totally end and be considered as closed
        
        $subscription->trial_status = null; // null | 'active' | 'ended';
        $subscription->access_period_status = 'active';  // null | 'active' | 'ended';
        
        $subscription->created_as_trial = $subscription->trial_days && $subscription->trial_days > 0;

        $subscription->current_date = $current_date;

        $lastTraxn = $this->donation_model->getLastTrxnBySubscription($subscription->id);

        $subscription->last_transaction_id = $lastTraxn ? $lastTraxn->id : null;
                
        if($subscription->created_as_trial) {
            $trial_start_date = $subscription->created_at;

            $trial_end_timestamp = strtotime($trial_start_date . ' +' . $subscription->trial_days . ' days');
            $trial_end_date = date('Y-m-d 23:59:59', $trial_end_timestamp);

            $subscription->trial_ends_at = $trial_end_date;

            $subscription->trial_status = 'ended';
            if ($current_date <= $trial_end_date) {
                
                if($subscription->status == 'A') {                    
                    if(!$lastTraxn) {                        
                        $subscription->c_status = 'on_trial'; // if now <= trial_end_date and there is no a transaction we consider it on trial
                        $subscription->trial_status = 'active';
                        log_custom(LOG_CUSTOM_DEBUG, "Flow 1: Subscription on trial, no payment yet. 
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
                       
                        return $subscription;

                    } else if($lastTraxn->status === 'P') {                                                
                        $subscription->c_status = 'active'; // if now <= trial_end_date and there is a transaction we consider it active                        
                        $subscription->trial_status = 'ended'; // Trial ended early due to payment — now considered active. This switch ocurrs in the day of the trial end date.
                        
                        log_custom(LOG_CUSTOM_DEBUG, "Flow 2: Becomes active, trial ended, success payment found. 
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
                        
                        return $subscription;

                    } else {                         
                        $subscription->c_status = 'unpaid';
                        $subscription->trial_status = 'active'; //if unpaid lets wait, trial status will be auto ended by the cron when the current date hast past the trial end date
                        log_custom(LOG_CUSTOM_DEBUG, "Flow 3: Becomes unpaid, trial still active, failed payment found. 
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
                        
                        return $subscription;
                    }
                }
                
            } 
        } 

        // != from on_trial, it may be created as on_trial (trial time over) or not, treated as normal
        if($subscription->status == 'A'){                
            if($lastTraxn && $lastTraxn->status === 'P') {
                //current_date need to be modified for tests
                $subscription->c_status = 'active';
                log_custom(LOG_CUSTOM_DEBUG, "Flow 4: Confirm active, payment found, new transaction_id
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
                
            } else {                
                $subscription->c_status = 'unpaid';
                log_custom(LOG_CUSTOM_DEBUG, "Flow 5: Trying to Confirm active. " . (!$lastTraxn ? "No payment found." : "Payment failed found.") . "
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
            }
        } else if ($subscription->status == 'D') {
            $subscription->c_status = 'cancelled'; // for created_as_trial or no trial

            if($subscription->created_as_trial) { 
                
                if(!$lastTraxn) { // it was cancelled on trial and without payment
                    $subscription->ends_at = $subscription->trial_ends_at;
                    $subscription->access_period_status = 'ended'; // if cancelled the access period is over
                    $subscription->trial_status = 'ended'; // if cancelled the trial is over 

                    log_custom(LOG_CUSTOM_DEBUG, "Flow 6: Cancelled, trial, no payment, access period also ended
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            access_period_status $subscription->access_period_status,
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");
                    
                    return $subscription;
                    
                }                     
                //$ends_at = $trial_end_date;                
            }  
               
            // if no trial ends_at is the same as next payment
            $subscription->ends_at = $subscription->next_payment_on;
          
            // Wait for the webhook to update access_period_status
            log_custom(LOG_CUSTOM_DEBUG, "Flow 7: Cancelled, trial or normal, waiting for access period to end
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            access_period_status $subscription->access_period_status,
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");

        } else {
            throw new Exception('Invalid subscription status');
        }               
        
        return $subscription;
    }

    public function getAllBasedOnTimeChange() {
        
        // Joins amc → cd → s: one client has many churches, one church has many subscriptions.
        // Returns all subscriptions across all clients and churches without duplicates.
        // It will return all subscriptions that have a webhook configured for subscription updates

        $this->db->select('
                s.id, s.account_donor_id, s.church_id, s.campus_id, s.payment_link_products_id, s.status, s.frequency, s.amount,
                s.start_on, s.next_payment_on, s.email, s.first_name, s.last_name, s.trial_days, s.created_at, s.updated_at,
                s.webhook_closed, s.webhook_last_state_sent, s.webhook_sent_log, s.last_transaction_id, 
                s.c_status, s.trial_status, s.access_period_status, s.trial_ends_at, s.ends_at, s.created_as_trial, s.status_calculated_at, last_unpaid_log_at
            ');

        $this->db->join('church_detail cd', 'cd.client_id = amc.client_id', 'INNER');
        $this->db->join('epicpay_customer_subscriptions s', 's.church_id = cd.ch_id', 'INNER');

        $this->db->where("JSON_EXTRACT(amc.webhook_config, '$.subscription_updated') IS NOT NULL", null, false); 
        $this->db->where('s.webhook_closed', 0);
        $this->db->where_in('s.status', ['D', 'A']);
        $this->db->where('s.c_status IS NOT NULL', null, false);
      
        $this->db->order_by('s.id', 'ASC');
        
        $subscriptionsWh = [];
        
        $subscriptions = $this->db->get('api_merchant_credentials amc')->result();
        
        $today = date('Y-m-d 23:59:59');
        //$today = date('2025-09-01 23:59:59');

        $this->load->library('gateways/FortisLib'); //stop subscription

        foreach ($subscriptions as &$subscription) {

            $stopSubscription = false;

            $updSub = [];
            
            if ( // trial ended without any payment (no success, no failure). //No common case
                // a payment is expected the day before the trial ends — if received, c_status is set to 'active' or 'unpaid' 
                // so this condition is not evaluated
                $subscription->status === 'A' &&         
                $subscription->c_status === 'on_trial' &&
                $subscription->access_period_status === 'active' &&
                $subscription->trial_status === 'active' &&
                strtotime($today) > strtotime($subscription->trial_ends_at)
            ) {
                
                $subscription->c_status = 'cancelled'; 
                $subscription->access_period_status = 'ended';
                $subscription->trial_status = 'ended';
                
                $updSub['c_status'] = 'cancelled';
                $updSub['access_period_status'] = 'ended';
                $updSub['trial_status'] = 'ended';
                
                $stopSubscription = true; 

                log_custom(LOG_CUSTOM_DEBUG, "Trigger WH Flow 1: On trial, trial period ends
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            access_period_status $subscription->access_period_status,                             
                            ends_at $subscription->ends_at,
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");

            } else if ( // unpaid period ends
                    $subscription->c_status === 'unpaid' &&
                    $subscription->access_period_status === 'active'                    
                ) {
                   
                    $graceDays = 2; //grace days before cancelling an unpaid subscription
                    $graceEnd = date('Y-m-d H:i:s', strtotime("+$graceDays days", strtotime($subscription->last_unpaid_log_at)));

                    if(strtotime($today) > strtotime($graceEnd)){
    
                        $subscription->c_status = 'cancelled';
                        $subscription->access_period_status = 'ended';
        
                        $updSub['c_status'] = 'cancelled';
                        $updSub['access_period_status'] = 'ended';
                        
                        log_custom(LOG_CUSTOM_DEBUG, "Trigger WH Flow 2: Unpaid, grace period ends, close all.
                            Subscription {$subscription->id} 
                            c_status $subscription->c_status 
                            access_period_status $subscription->access_period_status
                            ends_at $subscription->ends_at
                            trial_status $subscription->trial_status
                            trial_ends_at $subscription->trial_ends_at
                            last_transaction_id $subscription->last_transaction_id
                            last_unpaid_log_at $subscription->last_unpaid_log_at");

                        $stopSubscription = true;
                    
                    }   
    
            } else if ( // active, excluding unpaid (this is not a common case where payment wasn't triggered by cron — though cron is always expected to run)
                $subscription->c_status === 'active' &&
                $subscription->access_period_status === 'active' &&
                strtotime($today) > strtotime($subscription->next_payment_on) //next_payment_on is updated by the cron
            ) {
                // this is too aggresive, let's the subscription live, lets log only
                // $subscription->c_status = 'cancelled';
                // $subscription->access_period_status = 'ended';

                // $updSub['c_status'] = 'cancelled';
                // $updSub['access_period_status'] = 'ended';
                
                log_custom(LOG_CUSTOM_DEBUG, "Trigger WH Flow 3 error: active payment was not triggered, check next_payment_on should changed.
                    Subscription {$subscription->id} 
                    c_status $subscription->c_status 
                    access_period_status $subscription->access_period_status
                    ends_at $subscription->ends_at
                    trial_status $subscription->trial_status
                    trial_ends_at $subscription->trial_ends_at
                    last_transaction_id $subscription->last_transaction_id
                    last_unpaid_log_at $subscription->last_unpaid_log_at");

                // $stopSubscription = true;

            } else if ( //access period ends
                $subscription->c_status === 'cancelled' &&
                $subscription->access_period_status === 'active' &&
                strtotime($today) > strtotime($subscription->next_payment_on)
            ) {
                $subscription->access_period_status = 'ended';
                $updSub['access_period_status'] = 'ended';

                log_custom(LOG_CUSTOM_DEBUG, "Trigger WH Flow 4: Cancelled, access period ends
                            Subscription {$subscription->id}, 
                            c_status $subscription->c_status, 
                            access_period_status $subscription->access_period_status,                             
                            ends_at $subscription->ends_at,
                            trial_status $subscription->trial_status,
                            trial_ends_at $subscription->trial_ends_at,
                            last_transaction_id $subscription->last_transaction_id");


                $stopSubscription = true;
            }
            
            if($updSub) {
                $updSub['updated_at'] = date('Y-m-d H:i:s');
                $this->db->update($this->table, $updSub, ['id' => $subscription->id]);                
            }

            if($stopSubscription) {                
                $fortisLib = new FortisLib();
                $fortisLib->stopCustomerSubscription($subscription->id, false, false, false); // last false means do not send webhook
            }

            $lastSent = json_decode($subscription->webhook_last_state_sent ?? '{}', true);

            $sendWh = (
                ($lastSent['c_status'] ?? null) !== $subscription->c_status ||
                ($lastSent['trial_status'] ?? null) !== $subscription->trial_status ||
                ($lastSent['access_period_status'] ?? null) !== $subscription->access_period_status
            );

            if ($sendWh) { // change detected, send webhook
                $subscriptionsWh[] = $subscription; // Add to response if c_status changed
            }
        }
        
        return $subscriptionsWh;

    }

    /**
     * Creates a subscription from admin tools, like the dashboard or an api.
     *
     * There is an existing subscription flow which is tightly coupled with the payment link structure and data.
     * This means the current subscriptions depend on a valid payment link context to process correctly.
     *
     * To support subscriptions initiated internally (from dashboard or tools) without going through
     * the public payment link flow we have created the create_internal_subscription method which will generate a dummy payment link object.
     * 
     * Key points:
     * - The dummy payment link is used internally to store the necessary data and keep the logic for the subscription flow.
     * - The dummy payment link is not intended for public use.
     * - It enables reuse of the existing subscription logic without requiring refactoring or significant changes.
     * - Ultimately, the goal is to create a recurring payment subscription linked to products and paid products, which are already managed within the payment link structure.
     */
    
    public function createInternal($data, $clientId = null) {

        $this->load->model('payment_link_model');
        $this->load->model('sources_model');
        $this->load->model('fund_model');
        $this->load->helper('payment_links');

        $customerSent = false;
        $val_messages = [];
        if(!isset($data['account_donor_id']) || !$data['account_donor_id']) {
            $val_messages [] = langx('The customer is required');           
        } else {
            $customerSent = true;
        }

        if(!isset($data['payment_options']) || !$data['payment_options']) {
            $val_messages [] = langx('At least one payment option is required');
        }

        if(!isset($data['products']) || !$data['products']) {
            $val_messages [] = langx('At least one product is required');            
        }

        if((!isset($data['payment_method_id']) || !$data['payment_method_id']) && $customerSent) {
            $val_messages [] = langx('A payment method is required, please add one from the customer profile');            
        }
        
        
        if(isset($data['trial_days'])) {
            if(!is_numeric($data['trial_days'])) {
                $val_messages [] = langx('The trial days must be a numeric value');
            } else if($data['trial_days'] < 0) {
                $val_messages [] = langx('The trial days must be a positive value');
            }            
        }
        
        if($val_messages) {
            $val_messages = array_map(fn($message) => '<p>' . $message . '</p>', $val_messages);
            return ['status' => false, 'errors' => $val_messages];        
        }       
        
        $data['is_internal'] = 1;
        
        $paymentLinkResponse = $this->payment_link_model->save($data);

        if($paymentLinkResponse['status'] === false) {
            $message = $paymentLinkResponse['errors'] ? $paymentLinkResponse['errors'] : $paymentLinkResponse['message'];
            throw new Exception(strip_tags($message));            
        }

        $paymentLink = $this->payment_link_model->getByHash($paymentLinkResponse['hash']);
        
        $customerId = $data['account_donor_id'];        
        $walletId = $data['payment_method_id'];
        $clientId = $clientId ? $clientId : $this->session->userdata('user_id');
        $orgId = $data['organization_id'];
        $subOrgId = isset($data['suborganization_id']) && $data['suborganization_id'] ? $data['suborganization_id'] : null;
        $coverFee = $paymentLink->cover_fee ? 1 : 0;

        $walletObj = $this->sources_model->getOne($customerId, $walletId, [
            'id', 
            'epicpay_customer_id', 
            'name_holder', 
            'bank_type', 
            'source_type', 
            'src_account_type'], true, $clientId);
        
        if($walletObj->source_type === 'card') {
            $paymentMethodSelected = $walletObj->src_account_type === 'amex' ? 'cc_amex' : 'cc';
        } else {
            $paymentMethodSelected = 'ach';
        }

        $reqProducts = [];
        foreach ($paymentLink->products as $product) {
            $reqProducts[] = (object)[
                'link_product_id'   => $product->id,
                'qty'               => $product->qty,
                //'start_date_input'  => '2025-07-01', // or $product->start_date_input if dynamic verifyx
            ];
        }

        $feeObject = (object) ['coverFee' => $paymentLink->cover_fee, 'paymentMethod' => $paymentMethodSelected, 'orgId' => $paymentLink->church_id, 'processorShort' => PROVIDER_PAYMENT_FORTIS_SHORT];
        $productsWithRequest = PL_recalcProductsWithRequest($reqProducts, $converOneTime = false, $feeObject);
        $subscriptionExists = PL_checkSubscriptionExists($productsWithRequest['_products']);

        if(!$subscriptionExists) {
            throw new Exception(langx('Please add at least one recurring product to the current subscription'));
        }

        require_once 'application/controllers/extensions/Payments.php';
        
        $request = new stdClass();
        $request->paymentLink = $paymentLink;
        $request->church_id = $orgId;
        $request->campus_id = $subOrgId;        
        $request->payment_method = 'wallet';
        $request->screen = 'dashboard';
        $request->cover_fee = $coverFee;
        
        // ----

        $payment = new stdClass();
        $payment->bank_type = null;
        $payment->wallet_id = $walletObj->id;
        $payment->account_holder_name = $walletObj->name_holder;
        $payment->created_user_id = $walletObj->epicpay_customer_id;
        //$payment->postal_code = null;
        $payment->cover_fee = $coverFee;
        $payment->src_account_type = $walletObj->src_account_type;
        $payment->trial_days = $paymentLink->trial_days;

        $mainfund   = $this->fund_model->getFirstOrgFund($orgId, $subOrgId);

        $includeTrnxIds = []; //an array of transactions ids, transactions done in this process
        $pResult = []; //payment result
            
        if ($productsWithRequest['countProductsOneTime'] > 0) { //if there is no products one time do not attempt to process a payment, proceed to see if there are any subscription
            $amount = $productsWithRequest['totalAmountOneTime'];
            $request->amount = $amount;            
            $request->paymentLink->_products_with_request = $productsWithRequest['_products'];
            $request->recurring = 'one_time';

            $fund_data = [['fund_id' => $mainfund->id, 'fund_amount' => $amount]];
            $request->fund_data = $fund_data;

            
            $packResult = [
                "request" => $request,
                "payment" => $payment
            ];
            
            $pResult = Payments::process($packResult['request'], $packResult['payment'], $customerId);

            $includeTrnxIds [] = $pResult['trxn_id'];
            
            if($pResult['status'] === false) {
                return [ //break any other payment here.
                    'one_time_payment' => $pResult,
                    'subscriptions' => [],
                    'tranx_ids' => $includeTrnxIds,
                    'message' => langx('Flow finalized with error on one time payment'),
                    'status' => true
                ];
            }
            
            
        }

        $subsResponse = []; //subscription Ids
        $subTrnxIds = []; //transaction Ids of each subscription / when not trial                      
        if ($subscriptionExists) {
            foreach ($productsWithRequest['_products'] as $_product) {
                $request->paymentLink->_products_with_request = [];
                if ($_product->recurrence == Product_model::RECURRENCE_PERIODICALLY || $_product->recurrence == Product_model::RECURRENCE_CUSTOM) {
                    $amount = $_product->_sub_total;
                    $startDate  = date('Y-m-d');

                    $request->paymentLink->_products_with_request = [$_product]; //it receives an array of one product
                    $request->recurring_date = $startDate; //it is nextPaymentDate           

                    $request->recurring = $_product->billing_period;
                    $fund_data = [['fund_id' => $mainfund->id, 'fund_amount' => $amount]];
                    $request->fund_data = $fund_data;

                    $request->amount = $amount;

                    $packResult = [
                        "request" => $request,
                        "payment" => $payment
                    ];
                    $pResultSub = Payments::process($packResult['request'], $packResult['payment'], $customerId);

                    if($pResultSub['status'] === false) {
                        $xTrxns = array_merge_recursive($includeTrnxIds, [$pResultSub['payment_info']['trxn_id']]);
                        return [ //break any other payment here.
                            'one_time_payment' => $pResult,
                            'subscriptions' => [$pResultSub],
                            'tranx_ids' => $xTrxns,
                            'message' => langx('Flow finalized with error on subscription payment'),
                            'status' => true
                        ];
                    }

                    $subTrnxIds []   = $pResultSub['payment_info']['trxn_id'];
                    $subsResponse [] = $pResultSub;
                }
            }
        }

        if($subTrnxIds) {
            $includeTrnxIds = array_merge_recursive($includeTrnxIds, $subTrnxIds); //concat arrays wihout taking care of keys, it only appends the new array to the end                
        }

        $finalResult = [
            'one_time_payment' => $pResult,
            'subscriptions' => $subsResponse,
            'tranx_ids' => $includeTrnxIds,
            'message' => langx('Flow finalized'),
            'status' => true

        ];

        return $finalResult;
    }
}
