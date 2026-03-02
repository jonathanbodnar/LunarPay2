<?php

defined('BASEPATH') OR exit('No direct script access allowed');
function accounts_GetAffiliatePayments($parent_id, $month, $year, $filter_by_date) {
    $CI     = & get_instance();
    $CI->db->select('sum(amount) paid')
        ->where('p.user_id', $parent_id);
    
    if($filter_by_date) {
        $CI->db->where('month(p.date_month_covered)', $month)->where('year(p.date_month_covered)', $year);
    }
        
    $result = $CI->db->get('payment_affiliates p')->row();
    
    return round($result->paid, 2);    
}

function accounts_GetAffiliateEarnings($affiliate_user_id, $month, $year, $filter_by_date) {
    
    $date_start = date('Y-m-01', strtotime($year . '-' . $month)); // --- Y-m-01 sets the first day of the month
    $date_end   = date('Y-m-t', strtotime($year . '-' . $month)); // --- Y-m-t sets the last day of the month

    $CI     = & get_instance();
    
    // --- let's leave this here for debugging: 
    // --- $result = $CI->db->select('r.*, ch.church_name, t.total_amount')    
    
    $result = $CI->db->select('sum(t.total_amount) total_amount, count(t.id) trxn_count')
            ->where('r.user_id IS NOT NULL', null, false) // --- refferals registered on the system
            ->where('r.parent_id', $affiliate_user_id) // --- reach affiliate's refferals
            ->join('church_detail ch', 'ch.client_id = r.user_id', 'inner')  // --- reach all orgnatizations from each referral
            ->join('epicpay_customer_transactions t', 't.church_id = ch.ch_id ' // --- reach transactions from each organization
                    . 'AND ((t.status = "P" AND t.src = "CC") OR t.status_ach = "P") ' // --- it is a "P" processed status, in other words, a success payment.
                    . 'AND t.trx_type = "DO" ' // --- positive transaction
                    . 'AND t.trx_ret_id IS NULL ' // --- it does NOT have been refunded
                    . 'AND t.manual_trx_type IS NULL '
                    . ($filter_by_date ? "AND date(t.created_at) >= '$date_start' AND date(t.created_at) <= '$date_end'" : "") // --- it is not a manual transaction, it is a transaction using the payment processor
                    . '', 'inner')
            ->get('referals r')
            ->row();

    $total_amount = isset($result->total_amount) && $result->total_amount ? $result->total_amount : 0;
    
    // ---- when the affiliates reaches one million we need to trigger here a new configuration for giving him 0.004 // we will be doing this later    
    
    $starting_percent = 0.002; // --- this is 0.2%
    $affiliate_earnings = round($total_amount * $starting_percent, 2);    
    
    return $affiliate_earnings;
}

function accounts_statusData($status) {
    $total_statuses = count(STATUSES);
    
    $index = $status - 1;

    $data = [
        'status' => $status,
        'title' => STATUSES[$index]['title'],
        'per' => round(($status / $total_statuses) * 100, 0),
        'step' => "$status/$total_statuses",
        'color' => STATUSES[$index]['color']
    ];

    return json_encode($data);
}


function accounts_ucWordsStrToLower($church_name) {
    return ucwords(strtolower($church_name));
}

class Accounts_model extends CI_Model {

    private $table = 'users';

    public function __construct() {
        parent::__construct();
    }
    
    public function getAfiliateDT(){
        //todo add filter for date according payments                
        $this->load->library("Datatables");
        
        //sanitize against sql injection
        $filter['year']  = intval($this->input->post('year'));
        $filter['month'] = intval($this->input->post('month'));        
        $filter['filter_by_date'] = intval($this->input->post('filter_by_date'));
        
        //make data test
        $this->datatables->select("usr.zelle_account_id,usr.zelle_social_security, ref.parent_id, usr.first_name, usr.last_name, usr.email, "
                . "count(usr.id) as total_ref, "                
                . "'$filter[filter_by_date]' as _filter_by_date, '$filter[year]' as _year, '$filter[month]' as _month"
                . "")
        ->where('usr.referral_code !=', null)        
        ->join('referals ref', 'ref.parent_id = usr.id and ref.date_register IS NOT NULL', 'inner')
        ->group_by('usr.id') //<= Important
        ->from($this->table . ' usr');
        $this->datatables->add_column('_earnings', '$1', 'accounts_GetAffiliateEarnings(parent_id, _month, _year, _filter_by_date)'); 
        $this->datatables->add_column('_pay', '$1', '');
        $this->datatables->add_column('_paid', '$1', 'accounts_GetAffiliatePayments(parent_id, _month, _year, _filter_by_date)');
        $this->datatables->add_column('_amount_remain', '$1', '0'); 
        return $this->datatables->generate();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $this->datatables->select(
                        'usr.id, org.ch_id, p.id as psf_id, username, usr.email, usr.phone, CONCAT_WS(" ", usr.first_name, usr.last_name) as full_name, '
                        . 'date(org.created_at) as created_on, org.church_name, '
                        . 'org.ch_id, org.epicpay_verification_status, cst.install_status, trx.id as trxs_exists, '
                        . 'if(p.app_status is null, p.app_status, "_NOTSENT") as account_status, '
                        . '"" as account_status2, '
                        . '"" as bank_status, '
                        . 'p.app_status, '
                        . 'CONCAT_WS("<br>", "") as account_ids, org.website, '
                        . 'org.todo_notes, org.todo_action_required_by, org.todo_reference_date, if(org.todo_action_required_by is null, concat("1", org.todo_reference_date), concat("2", org.todo_reference_date)) as todo_order_ctrl, '
                        //=======
                        . '
                        IF(org.legal_name > "",' . // Checking organization is created (org.legal_name > "" if is not null or not an empty string - if there is not legal name the user has not passed the first onboarding step)
                            'IF(p.app_status is not null,'.
                                'IF(p.app_status not like "FORM_ERROR",'.
                                    'IF(p.app_status not like "BANK_INFORMATION_SENT",'.                                        
                                        'IF(trx.id is not null,'. 
                                            '6,'.  //Active + Collecting
                                        '5),'.   //Active                                       
                                    '4),'. 
                                '3),'.
                            '2),'.
                        '1) as status_index'
                        , false)
                        //=======
                ->join('church_detail as org', 'org.client_id = usr.id AND org.trash = 0', 'left')
                ->join('church_onboard_fortis as p', 'p.church_id = org.ch_id', 'left')
                ->join('chat_settings as cst', 'cst.church_id = org.ch_id', 'left')
                ->join('epicpay_customer_transactions trx', 'trx.church_id = org.ch_id '
                        . 'AND trx.status = "P" AND trx.trx_type = "DO"', 'LEFT'); //if the processor received a donation 'P'
                
                if(defined('SYSTEM_ENVIRONMENT') && SYSTEM_ENVIRONMENT == 'live') {
                
                    //For testing purposes there is an organization that was onboarded on live environment using the dev paysafe api, 
                    //its Test 20210608 Appchatgivecom (dev api) church_id = 170, account_id = 1002092870
                    //omitting churh_id = 170
                    $this->datatables->where('org.ch_id not in (170)', null, false);
                }
        
                $this->datatables->group_by('usr.id, org.ch_id')->from($this->table . ' as usr'); 
        
        
        /*
         // this "where" do not find the status index akay when several when a user has several orgs, this is because of the group by, it does not caches the relative value
        if ($this->input->post('status') && $this->input->post('status') > 0) {
            $this->datatables->where(''
                    . '('
                    //=======
                    . 'IF(org.legal_name > "",'. // Checking organization is created (org.legal_name > "" if is not null or not an empty string - if there is not legal name the user has not passed the first onboarding step)
                        'IF(p.account_status is not null OR p.account_status2 is not null,'. // Checking In Progress
                            'IF(p.account_status like "enabled" AND p.account_status2 like "enabled",'. // Checking Verified
                                'IF(cst.install_status like "C",'. // Checking is Installed
                                    'IF(trx.id is not null,'. // Checking is Collecting
                                        '6,'. // Colling status with all conditions okay
                                    '5),'. // Installed if is not collecting
                                '4),'. // Verified if is not installed
                            '3),'.// Organization In Progress
                        '2),'.// Organization Created
                    '1)'// User Just created
                    //=======
                    . ') = ' . intval($this->input->post('status'))
                    . '', null, false);
        }
        */
        
        $this->datatables->add_column('acc_status', '$1', 'accounts_statusData(status_index)');
        $this->datatables->edit_column('church_name', '$1', 'accounts_ucWordsStrToLower(church_name)');
        
        //manual filtering
        if ($this->input->post('status') && $this->input->post('status') > 0) {
            $raw_data = $this->datatables->where('org.trash', 0);
            $raw_data = $this->datatables->generate([], null); //generate no json data & without pagging
            $data_filtered = [];
            foreach($raw_data['aaData'] as $row) {
                if($row['status_index'] == $this->input->post('status')) {
                    $data_filtered[] = $row;
                }
            }
            
            $raw_data['aaData'] = $data_filtered;
            $raw_data['recordsTotal'] = 0;
            
            $data = json_encode($raw_data);
        } else {
            $data = $this->datatables->generate();
        }
        
        return $data;
    }

// ->join('payment_affiliates p', 'p.user_id = usr.id', 'left')
    public function getStatusesData() {
        $this->db->select(
                                'usr.id, username, usr.email, usr.phone, CONCAT(usr.first_name, " ", usr.last_name) as full_name, '
                                . 'date(org.created_at) as created_on, org.church_name, '
                                . 'org.ch_id, org.epicpay_verification_status, cst.install_status, trx.id as trxs_exists, '
                                . 'count(usr.id) as cnt_category, '
                                //=======
                                . 'IF(org.legal_name > "",' . // Checking organization is created (org.legal_name > "" if is not null or not an empty string - if there is not legal name the user has not passed the first onboarding step)
                                    'IF(p.app_status is not null,'.
                                        'IF(p.app_status not like "FORM_ERROR",'.
                                            'IF(p.app_status not like "BANK_INFORMATION_SENT",'.                                        
                                                'IF(trx.id is not null,'. 
                                                    '6,'.  //Active + Collecting
                                                '5),'.   //Active                                       
                                            '4),'. 
                                        '3),'.
                                    '2),'.
                                '1) as status_index'// User Just created
                                //=======
                                . '', false)
                        ->join('church_detail as org', 'org.client_id = usr.id AND org.trash = 0', 'left')
                        ->join('church_onboard_fortis as p', 'p.church_id = org.ch_id', 'left')
                        ->join('chat_settings as cst', 'cst.church_id = org.ch_id', 'left')
                        ->join('epicpay_customer_transactions trx', 'trx.church_id = org.ch_id '
                                . 'AND trx.status = "P" AND trx.trx_type = "DO"', 'LEFT'); //if the processor received a donation 'P'
       
        $data = $this->db->group_by('usr.id, org.ch_id')->get($this->table . ' as usr')->result();

        $new_data = [];

        $new_data[] = 0;
        $new_data[] = 0;
        $new_data[] = 0;
        $new_data[] = 0;
        $new_data[] = 0;
        $new_data[] = 0;

        foreach ($data as $row) {
            $new_data[$row->status_index - 1] ++;
        }

        return $new_data;
    }

    public function get($id, $select = false) {
        if ($select) {
            $this->db->select($select);
        }
        $row = $this->db->where('id', $id)->from($this->table)->get()->row();
        return $row;
    }

    public function getByEmail($email, $select = false) {
        if ($select) {
            $this->db->select($select);
        }
        $row = $this->db->where('email', $email)->from($this->table)->get()->row();
        return $row;
    }

    public function update($data, $user_id) {

        $this->db->where('id', $user_id);
        $this->db->update($this->table, $data);
        return true;
    }

}
