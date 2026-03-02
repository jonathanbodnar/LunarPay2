<?php

defined('BASEPATH') OR exit('No direct script access allowed');

use Dompdf\Dompdf;

function labelFtsStatus($fts_status_id) { //only used for tracking fts ach status changes
    
    $label = null;
    if($fts_status_id) {
        $label = isset(FORTIS_STATUS_LABELS[$fts_status_id]) ? FORTIS_STATUS_LABELS[$fts_status_id] : $fts_status_id . ' - Unknown'; 
    } else {
        $label = 'Unknown';
    }
    
    return $label;
}

class Donation_model extends CI_Model {

    private $table = 'epicpay_customer_transactions';
    
    public $valAsArray = false; //for getting validation errors as array or a string, false = string
    
    public function __construct() {
        parent::__construct();
    }

    //$invoice must hold $invoice->id and $invoice->church_id 
    public function getByInvoice($invoice){
        
        $result = $this->db->select("tr.id, tr.first_name, tr.last_name, tr.email, tr.receipt_file_uri_hash, " //receipt_file_uri_hash allows to know if there is a existing receipt
                .'CONCAT_WS("", "' . BASE_URL_FILES . 'files/get/payment_receipts/", tr.receipt_file_uri_hash) as _receipt_file_url, '
                . 'tr.trx_type, tr.paysafeRef, tr.src, tr.created_at, tr.sub_total_amount, tr.total_amount, tr.fee, tr.epicpay_transaction_id')
                ->where('tr.invoice_id', $invoice->id)->where('tr.church_id', $invoice->church_id)->where('tr.status', 'P')
                ->order_by('tr.id', 'desc')
                ->get($this->table . ' as tr')->result();
        
        return $result;
    }

    //$xids can be an int or an array
    public function getByIds($xids, $includeFailed = false) {

        if($includeFailed) {
            $this->db->where("(tr.status = 'P' OR tr.status = 'N')", null, false);
        } else {
            $this->db->where('tr.status', 'P');
        }
        is_array($xids) ? $this->db->where_in('tr.id', $xids) : $this->db->where('tr.id', $xids);

        $this->db->select("tr.id, tr.first_name, tr.last_name, tr.email, tr.customer_subscription_id, "
                        . 'CONCAT_WS("", "' . BASE_URL_FILES . 'files/get/payment_receipts/", tr.receipt_file_uri_hash) as _receipt_file_url, '
                        . 'tr.trx_type, tr.paysafeRef, tr.src, tr.created_at, tr.sub_total_amount, tr.total_amount, tr.fee, tr.status');
                

        $result = $this->db->order_by('tr.id', 'desc')
                ->get($this->table . ' as tr')->result();

        return $result;
    }

    public function getDt($user_id = null) {

        if($this->input->post('_deferLoading')) { //if _deferLoading, we don't load anything.
            return '{"draw":0,"recordsTotal":0,"recordsFiltered":0,"data":[],"include":{"total_given_labels":[],"total_given_values":[],"number_gifts_labels":[],"number_gifts_values":[],"new_donors_labels":[],"new_donors_values":[]}}';
        }

        $this->load->helper('money');

        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');

        //Getting Total Given Chart
        $total_given = $this->getTotalGivenChart($user_id);

        //Getting Number Gift Chart
        $number_gift = $this->getNewGiftChart($user_id);

        //Getting New Donors Chart
        $new_donors = $this->getNewDonorsChart($user_id);

        $organizations_ids = getOrganizationsIds($user_id);

        $this->load->library("Datatables"); //WHEN USING "CASE WHEN" IF YOU ACTIVE THE SEARCH OPTION IT IS IMPORTANT TO PUT THE SUBSQL IN ONE LINE, OTHERWISE SEARCH FILTERS WONT WORK OKAY
        $this->datatables->select("tr.id, ROUND(sum(tf.amount), 2) as amount, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as net,
                DATE_FORMAT(tr.created_at,'%m/%d/%Y') created_at_formatted, tr.created_at, CONCAT_WS(' ',tr.first_name, tr.last_name) as name ,tr.email, tr.giving_source,
                (case when tr.src = 'CC' then 'Card' when tr.src = 'BNK' then 'Bank' else tr.src end) as method, 
                (case 
                    WHEN tr.manual_trx_type = 'DE' THEN 'Deposit' 
                    WHEN tr.manual_trx_type = 'DN' THEN 'Manual' 
                    WHEN tr.manual_trx_type = 'WD' THEN 'Withdraw' 
                    ELSE tr.manual_trx_type end) as manual_trx_type,
                
                tr.status, 
                tr.fts_status_id,
                tr.transaction_detail,
                tr.epicpay_transaction_id,
                    tr.customer_subscription_id as subscription, tr.status_ach, tr.src, GROUP_CONCAT(f.name SEPARATOR ', ') as fund, 
                    sub.created_at subcreated_at, sub.start_on substart_on, sub.frequency subfrequency, sub.status substatus, 
                    tr.trx_ret_id, tr.trx_retorigin_id, tr.manual_failed, tr.is_fee_covered,
                    (CASE 
                        WHEN tr.trx_type = 'DO' THEN 'Donation' 
                        WHEN tr.trx_type = 'RE' AND tr.manual_failed = 1 THEN 'Recovered' 
                        WHEN tr.trx_type = 'RE' THEN 'Refunded' END) as trx_type
                    ")
             ->from($this->table.' as tr')
             ->join('account_donor as ad','ad.id = tr.account_donor_id', 'left')
             ->join('transactions_funds as tf','tf.transaction_id = tr.id','left')
             ->join('funds as f','f.id = tf.fund_id','left')
             ->join('epicpay_customer_subscriptions as sub','sub.id = tr.customer_subscription_id','left')
             ->add_column('giving_source', '$1', 'ucfirst(giving_source)')
             ->add_column('_fts_status', '$1', 'labelFtsStatus(fts_status_id)')
             ->edit_column('_fts_status', '$1', 'labelFtsStatus(fts_status_id)')             
             ->edit_column('amount', '$1', 'amountToCurrency(amount)')
             ->edit_column('fee', '$1', 'amountToCurrency(fee)')
             ->edit_column('net', '$1', 'amountToCurrency(net)')
             ->group_by('tr.id')
             ->where("(tr.status = 'P' OR tr.status_ach = 'N')", null, false);

        //Organizations of User Filter
        $this->datatables->where('tr.church_id in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->datatables->where('tr.church_id',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id)
        {
        $this->datatables->where('tr.campus_id',$campus_id);}
        else {
            $this->datatables->where('tr.campus_id',null);
        }
            
        //Funds Filter
        $fund_id = (int)$this->input->post('fund_id');
        if($fund_id)
            $this->datatables->where('tf.fund_id',$fund_id);

        //Method Filter
        $method = $this->input->post('method');
        if($method)
            $this->datatables->where('tr.src',$method);
        
        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->datatables->where('sub.frequency', $freq);

        //$data = $this->datatables->generate();
        $data = $this->datatables->generate(
            [
                "total_given_labels"  => $total_given['labels'],
                "total_given_values"  => $total_given['values'],
                "number_gifts_labels" => $number_gift['labels'],
                "number_gifts_values" => $number_gift['values'],
                "new_donors_labels"   => $new_donors['labels'],
                "new_donors_values"   => $new_donors['values'],
            ]);

        return $data;
    }

     public function getCustomerDt($user_id = null,$customer_id=null) {

        $customer_id = $this->input->post('customer_id');      
        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');

        //Getting New Donors Chart
        $new_donors = $this->getNewDonorsChart($user_id);

        $organizations_ids = getOrganizationsIds($user_id);

        $this->load->library("Datatables"); //WHEN USING "CASE WHEN" IF YOU ACTIVE THE SEARCH OPTION IT IS IMPORTANT TO PUT THE SUBSQL IN ONE LINE, OTHERWISE SEARCH FILTERS WONT WORK OKAY
        $this->datatables->select("tr.id, ROUND(sum(tf.amount), 2) as amount, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as net,
                DATE_FORMAT(tr.created_at,'%m/%d/%Y') created_at_formatted, tr.created_at, CONCAT_WS(' ',tr.first_name, tr.last_name) as name ,tr.email, tr.giving_source,
                (case when tr.src = 'CC' then 'Card' when tr.src = 'BNK' then 'Bank' else tr.src end) as method, 
                (case WHEN tr.manual_trx_type = 'DE' THEN 'Deposit' WHEN tr.manual_trx_type = 'DN' THEN 'Manual' WHEN tr.manual_trx_type = 'WD' THEN 'Withdraw' ELSE tr.manual_trx_type end) as manual_trx_type,
                tr.status, tr.transaction_detail,tr.customer_subscription_id as subscription, tr.status_ach, tr.src, GROUP_CONCAT(f.name SEPARATOR ', ') as fund, 
                sub.created_at subcreated_at, sub.start_on substart_on, sub.frequency subfrequency, sub.status substatus, 
                tr.trx_ret_id, tr.trx_retorigin_id, tr.manual_failed, tr.is_fee_covered,
                (CASE WHEN tr.trx_type = 'DO' THEN 'Donation' WHEN tr.trx_type = 'RE' AND tr.manual_failed = 1 THEN 'Recovered' WHEN tr.trx_type = 'RE' THEN 'Refunded' END) as trx_type, 
                epicpay_transaction_id, tr.fts_status_id
                ")               
             ->from($this->table.' as tr')
             ->join('account_donor as ad','ad.id = tr.account_donor_id', 'left')
             ->join('transactions_funds as tf','tf.transaction_id = tr.id','left')
             ->join('funds as f','f.id = tf.fund_id','left')
             ->join('epicpay_customer_subscriptions as sub','sub.id = tr.customer_subscription_id','left')
             ->add_column('giving_source', '$1', 'ucfirst(giving_source)')
             ->add_column('_fts_status', '$1', 'labelFtsStatus(fts_status_id)')
             ->group_by('tr.id')
             ->where('`tr`.`account_donor_id` ',$customer_id )
             ->where("(tr.status = 'P' OR tr.status_ach = 'N') ", null, false);

        //Organizations of User Filter
        $this->datatables->where('tr.church_id in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->datatables->where('tr.church_id',$church_id);

        //Sub Organizations Filter
        
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id){
            $this->datatables->where('tr.campus_id',$campus_id);        
        }else{
            $this->datatables->where('tr.campus_id',null);        
        }
        
        $data = $this->datatables->generate($new_donors);
        return $data;    
        
    }   
    
    public function getTotalGivenChart($user_id = null) {

        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');
        $organizations_ids = getOrganizationsIds($user_id);

        //we don't sum manual transactions that are not donations
        $this->db->select("DATE_FORMAT(tr.created_at,'%b-%Y') as date,sum(tf.net) as net")
            ->from($this->table.' as tr')
            ->join('epicpay_customer_subscriptions sub', 'sub.id = tr.customer_subscription_id', 'LEFT')
            ->join('account_donor as ad','ad.id = tr.account_donor_id')
            ->join('transactions_funds as tf','tf.transaction_id = tr.id','left')
            ->join('funds as f','f.id = tf.fund_id','left')
            ->group_by("DATE_FORMAT(tr.created_at,'%b-%Y')")
            ->where('((tr.status = "P" AND tr.src = "CC") OR tr.status_ach in ("P") '
                    . 'OR (tr.status = "P" AND tr.trx_type = "RE") '
                    . 'OR (tr.status = "P" AND tr.manual_trx_type = "DN"))', null, false) //rest refunds
            ->order_by("tr.created_at","asc");

        
        //Organizations of User Filter
        $this->db->where('tr.church_id in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->db->where('tr.church_id',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id)
            $this->db->where('tr.campus_id',$campus_id);

        //Funds Filter
        $fund_id = (int)$this->input->post('fund_id');
        if($fund_id)
            $this->db->where('tf.fund_id',$fund_id);

        //Method Filter
        $method = $this->input->post('method');
        if($method)
            $this->db->where('tr.src',$method);
        
        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->db->where('sub.frequency', $freq);

        $data = $this->db->get()->result_array();

        $data_labels = [];
        $data_values = [];
        $last_date = null;
        foreach ($data as $data_item){
            if($last_date) { //===== if there is not data found for a month we create the value with "0"
                $next_date = date('M-Y', strtotime("+1 months", strtotime($last_date)));
                while($next_date !== $data_item['date']){
                    $data_labels[] = $next_date;
                    $data_values[] = 0;
                    $next_date = date('M-Y', strtotime("+1 months", strtotime($next_date)));
                }
            }
            $data_labels[] = $data_item['date'];
            $data_values[] = $data_item['net'] && $data_item['net'] > 0 ? $data_item['net'] : 0;
            $last_date    = $data_item['date'];
        }

        return ["labels"=>$data_labels,'values'=>$data_values];
    }

    public function getNewGiftChart($user_id = null) {
        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');
        $organizations_ids = getOrganizationsIds($user_id);

        $this->db->select("DATE_FORMAT(tr.created_at,'%b-%Y') as date,count(tr.id) as count")
            ->from($this->table.' as tr')
            ->join('epicpay_customer_subscriptions sub', 'sub.id = tr.customer_subscription_id', 'LEFT')
            ->join('account_donor as ad','ad.id = tr.account_donor_id')
            ->join('transactions_funds as tf','tf.transaction_id = tr.id','left')
            ->join('funds as f','f.id = tf.fund_id','left')
            ->group_by("DATE_FORMAT(tr.created_at,'%b-%Y')")
            ->where('((tr.status = "P" AND tr.src = "CC") OR tr.status_ach in ("P") OR (tr.status = "P" AND tr.manual_trx_type = "DN")) '
                    . 'AND tr.trx_type = "DO" AND tr.trx_ret_id IS NULL', null, false)
            ->order_by("tr.created_at","asc");
        
        //Organizations of User Filter
        $this->db->where('tr.church_id in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->db->where('tr.church_id',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id)
            $this->db->where('tr.campus_id',$campus_id);

        //Funds Filter
        $fund_id = (int)$this->input->post('fund_id');
        if($fund_id)
            $this->db->where('tf.fund_id',$fund_id);

        //Method Filter
        $method = $this->input->post('method');
        if($method)
            $this->db->where('tr.src',$method);
        
        //Frequency Filter
        $freq = $this->input->post('freq');
        if ($freq)
            $this->db->where('sub.frequency', $freq);

        $data = $this->db->get()->result_array();

        $data_labels = [];
        $data_values = [];
        $last_date = null;
        foreach ($data as $data_item){
            if($last_date) {
                $next_date = date('M-Y', strtotime("+1 months", strtotime($last_date)));
                while($next_date !== $data_item['date']){
                    $data_labels[] = $next_date;
                    $data_values[] = 0;
                    $next_date = date('M-Y', strtotime("+1 months", strtotime($next_date)));
                }
            }
            $data_labels[] = $data_item['date'];
            $data_values[] = $data_item['count'] ? $data_item['count'] : 0;
            $last_date    = $data_item['date'];
        }

        return ["labels"=>$data_labels,'values'=>$data_values];
    }

    public function getNewDonorsChart($user_id = null) {
        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');
        $organizations_ids = getOrganizationsIds($user_id);
        $this->db->select("DATE_FORMAT(tr.min_date,'%b-%Y') as date, count(*) as count")
            ->from('account_donor as ad')
            ->join('(select account_donor_id as ac_id , min(created_at) as min_date
                            from epicpay_customer_transactions 
                        WHERE ((status = "P" AND src = "CC") OR status_ach in ("P","W") OR (status = "P" AND manual_trx_type = "DN")) 
                        AND trx_type = "DO" AND trx_ret_id IS NULL
                        group by account_donor_id
                    ) tr ','tr.ac_id = ad.id')
            ->group_by("DATE_FORMAT(tr.min_date,'%b-%Y')")
            ->order_by("tr.min_date","asc");

        //Organizations of User Filter
        $this->db->where('ad.id_church in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->db->where('ad.id_church',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id)
            $this->db->where('ad.campus_id',$campus_id);

        $data = $this->db->get()->result_array();

        $data_labels = [];
        $data_values = [];
        $last_date = null;
        foreach ($data as $data_item){
            if($last_date) {
                $next_date = date('M-Y', strtotime("+1 months", strtotime($last_date)));
                while($next_date !== $data_item['date']){
                    $data_labels[] = $next_date;
                    $data_values[] = 0;
                    $next_date = date('M-Y', strtotime("+1 months", strtotime($next_date)));
                }
            }
            $data_labels[] = $data_item['date'];
            $data_values[] = $data_item['count'] ? $data_item['count'] : 0;
            $last_date    = $data_item['date'];
        }

        return ["labels"=>$data_labels,'values'=>$data_values];
    }

    //==== used for loading donation on profile/widget side
    public function getLimitedList($donor_id, $offset = 0, $limit = false) {        
        
        $limit = $limit === false ? 3 : $limit;

        $this->load->model('transaction_fund_model', 'funds');
        
        $this->db->select('SQL_CALC_FOUND_ROWS t.id, t.account_donor_id, t.church_id, t.campus_id, t.manual_trx_type, '
                        . 'DATE_FORMAT(t.created_at, "%m/%d/%Y") as created_at, t.status, t.status_ach, total_amount, t.fee, t.sub_total_amount as net, '
                        . 'GROUP_CONCAT(f.name SEPARATOR ", ") funds_name, scs.last_digits, if(t.src = "BNK", "Bank",if(t.src = "CC", "Card","")) payment_method '
                        
                        . '', false)
                ->join('epicpay_customer_sources scs', 'scs.id = t.customer_source_id', 'left')
                ->join('transactions_funds tf', 'tf.transaction_id = t.id', 'INNER')
                ->join('funds f', 'f.id = tf.fund_id', 'INNER')                
                ->where('((t.status = "P" AND t.src = "CC") OR (t.status_ach in ("P","W")) OR (t.status = "P" AND t.manual_trx_type = "DN"))')                
                ->where('t.trx_type', 'DO')->where('t.trx_ret_id', null)
                ->where('t.account_donor_id', $donor_id)                                                
                ->group_by('t.id')
                ->limit($limit, $offset)
                ->order_by('t.id', 'DESC');
                

        $result['rows']= $this->db->get($this->table . ' t')->result_array();
        
        $found_rows = $this->db->query('SELECT FOUND_ROWS() total')->row_array();
                
        foreach($result['rows'] as &$row){
            $row['trnx_funds']['rows'] = $this->funds->getByTransaction($row['id']);
        }
        
        $result['offset'] = $offset + $limit;        
        $result['has_more'] = $result['offset'] < $found_rows['total'] ? true : false;
        $result['total'] = $found_rows['total'];
        
        return $result;
    }

    //Used from widget
    //No Subscription Donation
    //No Batch Donation, no applied => OR (tr.status = "P" AND tr.batch_id IS NOT NULL) | credit card and bank donations only
    public function getLastDonation($donor_id) {

        $this->db->select('SQL_CALC_FOUND_ROWS t.id, t.account_donor_id, t.church_id, t.campus_id, t.is_fee_covered, t.customer_source_id, '
                        . 'DATE_FORMAT(t.created_at, "%m/%d/%Y") as created_at, t.status, t.status_ach, total_amount, t.fee, t.sub_total_amount as net, '
                        //transaction funds data
                        . 'GROUP_CONCAT(tf.fund_id ORDER BY tf.id ASC) fund_ids, GROUP_CONCAT(tf.amount ORDER BY tf.id ASC) fund_amounts, '
                        . 'GROUP_CONCAT(tf.net ORDER BY tf.id ASC) fund_nets, '
                        ///////////////////////
                        . 'GROUP_CONCAT(f.name SEPARATOR ", ") funds_name, scs.last_digits, if(t.src = "BNK", "Bank",if(t.src = "CC", "Card","")) payment_method '
                        . ', t.customer_source_id as source_id, scs.status as source_status, scs.exp_year as source_exp_year, scs.exp_month as source_exp_month, scs.is_active as source_is_active, scs.is_saved as source_is_saved'
                        . '', false)
                ->join('epicpay_customer_sources scs', 'scs.id = t.customer_source_id', 'left')
                ->join('transactions_funds tf', 'tf.transaction_id = t.id', 'INNER')
                ->join('funds f', 'f.id = tf.fund_id', 'INNER')
                ->where('((t.status = "P" AND t.src = "CC") OR t.status_ach = "P")', null, false)
                ->where('t.trx_type', 'DO')->where('t.trx_ret_id', null)
                ->where('t.account_donor_id', $donor_id)
                ->where('customer_subscription_id is null')
                ->group_by('t.id')
                ->limit(1, 0)
                ->order_by('t.id', 'DESC');

        $result = $this->db->get($this->table . ' t')->row();

        return $result;
    }
    
    public function getStatement($donor_id, $church_id = false, $dateFrom, $dateTo, $fund_id = false) {

        $fund_id = $fund_id ? intval($fund_id) : false;

        $this->db->select('sct.*, GROUP_CONCAT(f.name SEPARATOR ", ") funds_name, scs.source_type, scs.last_digits, sct.account_donor_id, '
                        . 'ch.church_name, ca.name campus_name, NULL as request_data, NULL as request_response', false)
                ->where('((sct.status = "P" AND sct.src = "CC") OR sct.status_ach = "P" OR (sct.status = "P" AND sct.manual_trx_type = "DN"))', null, false)
                ->where('sct.trx_type', 'DO')->where('sct.trx_ret_id', null)
                ->where('sct.account_donor_id', $donor_id);

        if ($church_id) {
            $this->db->where('sct.church_id', $church_id);
        }

        $this->db->where('sct.created_at between \'' . date('Y-m-d', strtotime($dateFrom)) . '\' AND \'' . date('Y-m-d', strtotime($dateTo)) . ' 23:59:59\'', null, false)
                ->join('epicpay_customers sc', 'sc.id = sct.customer_id', 'left')
                ->join('epicpay_customer_sources scs', 'scs.id = sct.customer_source_id', 'left')
                ->join('transactions_funds tf', 'tf.transaction_id = sct.id ' . ($fund_id ? 'AND tf.fund_id = ' . $fund_id : ''), 'inner')
                ->join('funds f', 'f.id = tf.fund_id', 'left')
                ->join('church_detail ch', 'ch.ch_id = sct.church_id', 'left')
                ->join('campuses ca', 'ca.id = sct.campus_id', 'left')
                ->group_by('sct.id')
                ->order_by('sct.created_at', 'desc');

        $data = $this->db->get('epicpay_customer_transactions sct')->result();

        return $data;
    }
    
    public function getEmailsToPlanningCenter(){
        $org_ids = getOrganizationsIds($this->session->userdata('user_id'));
        $data = $this->db->select('trx.account_donor_id, trx.email, trx.first_name, trx.last_name')
                ->join('transactions_funds tf', 'tf.transaction_id = trx.id', 'inner')
                ->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P") OR (trx.status = "P" AND trx.manual_trx_type = "DN")', null, false)
                ->where('trx.trx_type', 'DO')
                //->where('trx.trx_ret_id', null)
                ->where('tf.plcenter_pushed IS NULL', null, false)
                ->where('trx.church_id in (' . $org_ids . ')')
                ->group_by('trx.email')
                ->get($this->table . ' trx')->result();
        
        return $data;
    }
    
    public function getDonationsToPlanningCenter($email) {
        $org_ids = getOrganizationsIds($this->session->userdata('user_id'));
        $data = $this->db->select('trx.account_donor_id, trx.src, trx.email, trx.first_name, trx.last_name, tf.net, tf.amount, tf.fee, tf.id trx_fund_id, '
                . 'f.name as fund_name, f.id as fund_id, trx.church_id, trx.campus_id, trx.created_at, trx.trx_ret_id')
                ->join('transactions_funds tf', 'tf.transaction_id = trx.id', 'inner')
                ->join('funds f', 'f.id = tf.fund_id', 'inner')
                ->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P" OR (trx.status = "P" AND trx.manual_trx_type = "DN"))', null, false)
                ->where('trx.trx_type', 'DO')
                //->where('trx.trx_ret_id', null)
                ->where('tf.plcenter_pushed IS NULL', null, false)
                ->where('trx.email', $email)                
                ->where('trx.church_id in (' . $org_ids . ')')
                ->get($this->table . ' trx')->result();
        
        return $data;
    }
    
    //===== get last donations
    public function getDonationsZapierPoll($user_id) {
        $orgnx_ids = getOrganizationsIds($user_id);

        $from = '2020-09-18';
        $data = $this->db->select(''
                                . 'trx.id, trx.email, trx.first_name, trx.last_name, dnr.phone, '
                                . 'trx.total_amount, trx.fee, trx.sub_total_amount as net, '
                                . 'if(trx.is_fee_covered = 1, "Yes", "No") as is_fee_covered, '
                                . 'GROUP_CONCAT(f.name SEPARATOR ", ") funds, trx.src, '
                                . 'if(trx.src = "BNK", "ACH", if(trx.src = "CC", "Card","")) payment_method, '
                                //. 'trx.church_id, trx.campus_id'
                                . 'DATE(trx.created_at) as created_at')
                        ->join('transactions_funds tf', 'tf.transaction_id = trx.id', 'inner')
                        ->join('funds f', 'f.id = tf.fund_id', 'inner')
                        ->join('account_donor dnr', 'dnr.id = trx.account_donor_id', 'left') //We could put a inner join, all transactions must have a donor even if is anonymous
                        ->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P" OR (trx.status = "P" AND trx.manual_trx_type = "DN"))', null, false)
                        ->where('trx.trx_type', 'DO')->where('trx.trx_ret_id', null)
                        ->where('trx.church_id in (' . $orgnx_ids . ')')
                        ->where("trx.created_at >= '$from'", null, false)
                        ->group_by('trx.id')
                        ->limit(25, 0)
                        ->order_by('trx.id', 'desc')
                        ->get($this->table . ' trx')->result();

        return $data;
    }
    
    public function churchHasTrxnSimple($church_id) { //church_id must comes secure
        //no matter getting unsuccess transactions
        
        $data = $this->db->select('id')
                ->where('church_id', $church_id)
                ->get($this->table)->result();
        
        return $data ? true : false;
        
    }
    
    //
    private $available_methods    = ['CC', 'BNK', 'Cash', 'Check'];
    private $available_operations = ['DE', 'WD', 'DN']; //deposit // withdraw // donation

    public function save_transaction($data, $user_id = false) {
        
        $val_messages    = [];
        if (!isset($data['organization_id']) || !$data['organization_id'])
            $val_messages [] = langx('The Company field is required');

        if (!isset($data['operation']) || !$data['operation'] || !in_array($data['operation'], $this->available_operations))
            $val_messages [] = langx('The Operation field is required');

        if (!isset($data['fund_id']) || !$data['fund_id'])
            $val_messages [] = langx('The Fund field is required');

        if (!isset($data['amount']) || !$data['amount'] || $data['amount'] <= 0)
            $val_messages [] = langx('A Valid positive Amount is required');

        if (!isset($data['date']) || isValidDate($data['date']) == false)
            $val_messages [] = langx('A Valid Date is required');
        
        if ($data['operation'] == 'DN') { //if it is a transaction related to a donation, do not make transaction detail required
            if (!isset($data['account_donor_id']) || !$data['account_donor_id'])
                $val_messages [] = langx('The Donor field is required');
            
        } else {
            if (!isset($data['transaction_detail']) || !$data['transaction_detail'])
                $val_messages [] = langx('The Transaction detail field is required');            
            
        }
        
        if (!isset($data['method']) || !$data['method'] || !in_array($data['method'], $this->available_methods))
            $val_messages [] = langx('The Method field is required');

        if (empty($val_messages)) {
            
           $this->load->model('donor_model');

           $user_id =  $user_id ? $user_id : $this->session->userdata('user_id');
            
            // ---- Validating that the user sends an organization that belongs to him            
            $orgnx_ids     = getOrganizationsIds($user_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }
            // ----

            if(in_array($data['operation'], ['WD'])) { //withdrawal
                $data['amount'] = $data['amount'] * -1;
            }
                        
            $save_data = [
                'church_id'          => $data['organization_id'],
                'campus_id'          => isset($data['suborganization_id']) && $data['suborganization_id'] ? $data['suborganization_id'] : null,
                'total_amount'       => $data['amount'],
                'sub_total_amount'   => $data['amount'],
                'fee'                => 0,
                'src'                => $data['method'],
                'transaction_detail' => isset($data['transaction_detail']) && $data['transaction_detail'] ? $data['transaction_detail'] : null,
                'zip'                => '-',
                'giving_source'      => 'dashboard', //chat, sms ...
                'status'             => isset($data['status']) && $data['status'] ? $data['status'] : 'P',
                'created_at'         => date('Y-m-d', strtotime($data['date'])),
                'updated_at'         => date('Y-m-d H:i:s'),
                'is_fee_covered'     => 0,
                'from_domain'        => base_url(),
                'trx_type'           => $data['operation'] == 'DN' ? 'DO' : null,
                'manual_trx_type'    => $data['operation'],
                'account_donor_id'   => isset($data['account_donor_id']) && $data['account_donor_id'] ? $data['account_donor_id'] : null,
                'batch_id'           => isset($data['batch_id']) && $data['batch_id'] ? $data['batch_id'] : null,
                'first_name'         => isset($data['first_name']) && $data['first_name'] ? $data['first_name'] : null,
                'last_name'          => isset($data['last_name']) && $data['last_name'] ? $data['last_name'] : null,
                'email'              => isset($data['email']) && $data['email'] ? $data['email'] : null,
                'batch_id'           => isset($data['batch_id']) && $data['batch_id'] ? $data['batch_id'] : null,
                'batch_committed'    => isset($data['batch_committed']) && $data['batch_committed'] ? $data['batch_committed'] : null,
            ];
            
            if (isset($data['account_donor_id']) && $data['account_donor_id']) {
                
                if(isset($data['batch_id']) && isset($data['status']) && $data['batch_id'] && $data['status']) {
                    //if it is a transaction from a batch with status = 'N' it means that it is an uncommitted transaction
                    //in that case we don't update account_donor accumulators, we will when the batch to be committed
                } else {
                    $donationAcumData = ['id' => $data['account_donor_id'], 'amount_acum' => $data['amount'], 'fee_acum' => 0, 'net_acum' => $data['amount']];
                    $this->donor_model->updateDonationAcum($donationAcumData); //add money to the donor accumulator
                }
                
                $accountDonor            = $this->donor_model->get($data['account_donor_id'], ['first_name', 'last_name', 'email'], true, $user_id);
                
                if(!$accountDonor) {
                    throw new Exception('Invalid account donor');
                }
                
                $save_data['first_name'] = $accountDonor->first_name;
                $save_data['last_name']  = $accountDonor->last_name;
                $save_data['email']      = $accountDonor->email;
            }

            $this->db->insert($this->table, $save_data);

            $trxId = $this->db->insert_id();

            $this->load->model('transaction_fund_model', 'trnx_funds');
            $trnxFundData = [
                'transaction_id' => $trxId,
                'fund_id'        => $data['fund_id'],
                'amount'         => $data['amount'],
                'fee'            => 0,
                'net'            => $data['amount']
            ];

            $this->trnx_funds->register($trnxFundData);

            if(isset($data['send_email'])){
                $save_data["trxId"] = $trxId;
                $this->load->helper('emails');
                sendDonationEmail($save_data,false,$data['fund_id']);
            }
            
            return [
                'status'  => true,
                'message' => langx('Transaction processed')
            ];
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages 
        ];
    }

    public function get_transaction_by_fts_id($client_app_id, $transaction_id) {
        $trxn = $this->db->where('church_id', $client_app_id)
                ->where('epicpay_transaction_id', $transaction_id)
                ->get($this->table)->row();

        return $trxn;
    }

    //for now used only for bank transactions updates
    public function update_fts_transaction_status($client_app_id, $transaction_id, $status_id)
    {
    
        $trxn = $this->get_transaction_by_fts_id($client_app_id, $transaction_id);

        //update customer accumulator back as the transaction is declined or voided or charged back even if is a refund
        if ($trxn->src === 'BNK') {

            $save_data = [
                'fts_status_id' => $status_id,
                'updated_at'    => date('Y-m-d H:i:s')
            ];
    
            if(in_array($status_id, [
                FORTIS_STATUS_DECLINED,
                FORTIS_STATUS_VOIDED,
                FORTIS_STATUS_CHARGED_BACK,
                FORTIS_STATUS_SETTLED
            ])) {
                $save_data['status_ach'] = 'P';
            } else {
                //if the status is other just keep the status_ach as it is
            }
    
            $this->db
                ->where('church_id', $client_app_id)
                ->where('epicpay_transaction_id', $transaction_id)
                ->update($this->table, $save_data);
    

            if (in_array($status_id, [
                FORTIS_STATUS_DECLINED,
                FORTIS_STATUS_VOIDED,
                FORTIS_STATUS_CHARGED_BACK
            ])) { //IF DECLINED, VOIDED OR CHARGEBACK we restore back the customer accumulator
                $this->load->model('donor_model');
                $donationAcumData = [
                    'id'          => $trxn->account_donor_id,
                    'amount_acum' => $trxn->total_amount * -1,
                    'fee_acum'    => 0,
                    'net_acum'    => $trxn->sub_total_amount * -1
                ];
                $this->donor_model->updateDonationAcum($donationAcumData);
            }
        }
    }


    // --- $data['transaction_id']
    public function remove_transaction($data, $user_id = false) {

        $val_messages    = [];
        if (!isset($data['transaction_id']) || !$data['transaction_id'])
            $val_messages [] = langx('The Transaction Id field is required');


        $trxn_id = $data['transaction_id'];
        $user_id = $user_id ? $user_id : $this->session->userdata('user_id');

        $orgxn_ids = getOrganizationsIds($user_id);

        $transaction = $this->db->where('id', $trxn_id)
                        ->where('church_id in (' . $orgxn_ids . ')') //securing, transactions from the user are allowed only
                        ->where('manual_trx_type is not null', null, false) //not null manual_trx_type transactins are allowed to remove aonly
                        ->select('id, church_id, batch_id, status, account_donor_id, total_amount, sub_total_amount')->get($this->table)->row();
        
        if(!$transaction) // transaction must exists            
            throw new Exception('Invalid transaction');
        
        
        $this->db->where('id', $trxn_id)
                ->where('church_id in (' . $orgxn_ids . ')') //securing, transactions from the user are allowed only
                ->where('manual_trx_type is not null', null, false) //not null manual_trx_type transactions are allowed to remove aonly
                ->delete($this->table); // remove it as the transaction clearly exist
        
        $this->load->model('transaction_fund_model', 'trnx_funds');
        $this->trnx_funds->remove_transaction($data); //transaction_id at this point is secure, belongs to the user
        
        
        if($transaction->batch_id && $transaction->status == 'N') {
            //do not update donor accumulator if is a transaction from a batch not commited
        } else { //update donor accumulator
            
            $this->load->model('donor_model');
            $donationAcumData = [
                'id'          => $transaction->account_donor_id,
                'amount_acum' => $transaction->total_amount * -1,
                'fee_acum'    => 0,
                'net_acum'    => $transaction->sub_total_amount * -1
            ];
            $this->donor_model->updateDonationAcum($donationAcumData);
        }

        return [
            'status'  => true,
            'message' => langx('Transaction removed')
        ];
    }
    
    // --- It gets the main transaction data but also with invoices, products and product_paid information
    // --- Useful for creating customer's receipts.
    // --- righ now is private as it is being used from the donation_model only, anyway we can reuse this method in the future, just turn it as public
    // --- The function is made public for use in the transaction view.
    public function getTransactionFullPackage($trxn_id) {

        $trxn = $this->db->select("t.id,scs.id as scsid,t.customer_subscription_id,t.first_name, t.last_name,t.account_donor_id, t.email, t.total_amount, t.invoice_id, t.payment_link_id, t.church_id, t.campus_id, ch.client_id,
                t.created_at,t.is_fee_covered,t.fee,t.sub_total_amount,t.manual_trx_type,t.src,t.trx_type,t.status_ach,t.status,t.trx_ret_id,sub.status substatus,t.src,t.manual_failed,t.status_ach,
                t.giving_source,t.receipt_file_uri_hash,t.invoice_id,
                (CASE WHEN t.giving_source = 'invoice' THEN 'Invoice' WHEN t.giving_source = 'payment link' THEN 'Payment Link' WHEN t.giving_source ='Dashboard' THEN 'Dashboard' end) as  source ,
                (CASE WHEN t.trx_type = 'DO' THEN 'Donation' WHEN t.trx_type = 'RE' AND t.manual_failed = 1 THEN 'Recovered' WHEN t.trx_type = 'RE' THEN 'Refunded' END) as trx_type,
                (case when t.src = 'CC' then 'Card' when t.src = 'BNK' then 'Bank' else t.src end) as method, t.src_account_type as tsrc_account_type,
                CONCAT_WS('','" . BASE_URL_FILES . "files/get/payment_receipts/',t.receipt_file_uri_hash) as _receipt_file_url, 
                (CASE WHEN t.manual_trx_type = 'DE' THEN 'Deposit' WHEN t.manual_trx_type = 'DN' THEN 'Manual' WHEN t.manual_trx_type = 'WD' THEN 'Withdraw' ELSE t.manual_trx_type end) as manual_trx_type,
                scs.exp_month,scs.exp_year,scs.last_digits, t.epicpay_transaction_id, t.fts_status_id, t.src_account_type, ad.business_name, ad.address")
                        ->join('church_detail ch', 'ch.ch_id = t.church_id', 'inner') //for getting the client_id
                        ->join('epicpay_customer_subscriptions as sub', 'sub.id = t.customer_subscription_id', 'left')
                        ->join('epicpay_customer_sources scs', 'scs.id = t.customer_source_id', 'left')
                        ->join('account_donor ad', 'ad.id = t.account_donor_id', 'left')
                        ->where('t.id', $trxn_id)
                        ->get($this->table . ' t')->row();

        if(!$trxn) {
            throw new Exception(langx('Invalid request, transaction not found'));
        }

        $trxn->invoice = null;
        $trxn->payment_link = null;
        if ($trxn->invoice_id) {
            $this->load->model('invoice_model');
            $trxn->invoice = $this->invoice_model->getById($trxn->invoice_id, $trxn->client_id);
        } elseif ($trxn->payment_link_id) {
            $this->load->model('payment_link_model');
            $trxn->paymentLink = $this->payment_link_model->getById($trxn->payment_link_id, $trxn->client_id, $includeTransactionId = $trxn_id);            
        }

        $this->load->model('orgnx_onboard_fts_model');
        $onboard_fts = $this->orgnx_onboard_fts_model->getByOrg($trxn->church_id, $trxn->client_id, 'merchant_state, merchant_city, merchant_postal_code, merchant_address_line_1');
        $trxn->organization = new stdClass();
        $trxn->organization->onboard = $onboard_fts;

        $trxn->_fts_status = labelFtsStatus($trxn->fts_status_id);

        $this->load->model('chat_setting_model');
        $trxn->branding = $this->chat_setting_model->getChatSettingByChurch($trxn->church_id, $trxn->campus_id);

        return $trxn;
    }
    
    public function createReceiptPdf($trxn_id) {
                
        $trxnFull = $this->getTransactionFullPackage($trxn_id);     
        
        $this->load->library('external-storage/ExternalStorageProvider');        
        $extStorage = ExternalStorageProvider::init();            

        $logo_base64 = '';        
        if ($trxnFull->branding->logo) {//Converting image to base64 src
            $logoArr     = explode('?', $trxnFull->branding->logo); //remove ? char when the logo has a version like .png?v=2020...

            $readEndpoint = ExternalStorageProvider::$READ_ENPOINT;            
            $logoUrl = $readEndpoint . $logoArr[0];

            // Get the file content
            $imagedata = @file_get_contents($logoUrl);

            if($imagedata) {
                // Get MIME type from the HTTP headers
                $headers =  @get_headers($logoUrl, 1);
                $mimeType = isset($headers['Content-Type']) ? $headers['Content-Type'] : 'application/octet-stream';
                // Generate base64-encoded string
                $base64 = base64_encode($imagedata);
                $logo_base64 = 'data:' . $mimeType . ';base64,' . $base64;
            }
        }

        $this->load->use_theme();
        $trxnFull->branding->logo_base64 = $logo_base64;        
        $pdf  = new Dompdf();
        $html = $this->load->view('donation/customer_receipt_pdf_tpl', ['trxnFull' => $trxnFull], true);
        $pdf->setPaper("Letter", "portrait");
        $pdf->loadHtml($html);
        $pdf->render();       

        $pdfOutput = $pdf->output(); // Get the PDF content as a string

        //echo $html; die; // --- let's keep it for debugin'

        $hashSize = 128;
        $bytes = openssl_random_pseudo_bytes($hashSize / 2, $cstrong);
        $fileNameHash  = bin2hex($bytes);
        $fileName = 'RECEIPT_' . $trxnFull->id . '_' . $fileNameHash. '.pdf';
        
        $this->load->helper('crypt');        
        $pdfOutPutEnc = encryptContent($pdfOutput, $_ENV['APP_ENCRYPTION_KEY']);
        $fileName .= '.' . ENCRYPTED_FILE_EXTENSION;
        
        $extStorage->uploadBody('payment_receipts', $fileName, $pdfOutPutEnc, 'application/pdf');
        
        $file_uri_hash = $fileName;        

        return $file_uri_hash;
    }
    
    public function getDonationsToFreshbooks($idinvoice = null) {
         $org_ids = getOrganizationsIds($this->session->userdata('user_id'));
        $data = $this->db->select('trx.account_donor_id, trx.src, trx.email, trx.first_name, trx.last_name, tf.net, tf.amount, tf.fee, tf.id trx_fund_id, '
                . 'f.name as fund_name, f.id as fund_id, trx.church_id, trx.campus_id, trx.created_at, trx.trx_ret_id')
                ->join('transactions_funds tf', 'tf.transaction_id = trx.id', 'inner')
                ->join('funds f', 'f.id = tf.fund_id', 'inner')
                ->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P" OR (trx.status = "P" AND trx.manual_trx_type = "DN"))', null, false)
                ->where('trx.trx_type', 'DO')
                //->where('trx.trx_ret_id', null)
                ->where('tf.freshbooks_pushed IS NULL', null, false)
                ->where('trx.invoice_id', $idinvoice)                
                ->where('trx.church_id in (' . $org_ids . ')')
                ->get($this->table . ' trx')->result();        
        return $data;    
}
public function getDonationsquickbooks() {
        $org_ids = getOrganizationsIds($this->session->userdata('user_id'));
        $data = $this->db->select('trx.account_donor_id, trx.src, trx.email, trx.first_name, trx.last_name, tf.net, tf.amount, tf.fee, tf.id trx_fund_id, '
                . 'f.name as fund_name, f.id as fund_id, trx.church_id, trx.campus_id, trx.created_at, trx.trx_ret_id,trx.invoice_id,a.quickbooks_id_user,i.quickbooks_id')
                ->join('transactions_funds tf', 'tf.transaction_id = trx.id', 'inner')
                ->join('funds f', 'f.id = tf.fund_id', 'inner')
                ->join('account_donor a', 'trx.account_donor_id = a.id', 'inner')
                ->join('invoices i', 'trx.invoice_id = i.id', 'inner')
                ->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P" OR (trx.status = "P" AND trx.manual_trx_type = "DN"))', null, false)
                ->where('trx.trx_type', 'DO')
                //->where('trx.trx_ret_id', null)
                ->where('tf.quickbooks_pushed IS NULL', null, false)                           
                ->where('trx.invoice_id is not NULL', null, false)  
                ->where('trx.church_id in (' . $org_ids . ')')
                ->get($this->table . ' trx')->result();        
        return $data;    
    }

    public function getLastTrxnBySubscription($subscription_id) {
        
        $this->db->where('customer_subscription_id', $subscription_id)
                ->order_by('created_at', 'desc');
        return $this->db->get($this->table)->row();

    }
    
    
}