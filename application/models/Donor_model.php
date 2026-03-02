<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Donor_model extends My_Model {

    protected $table = 'account_donor';

    const MAX_PASSWORD_SIZE_BYTES = 4096;

    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id) {
        return checkBelongsToUser([
            ['account_donor.id' => $id, 'id_church', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);
    }

    private function get_from_date(){
        $date_range = $this->input->post('date_range');
        $from_date = null;
        switch ($date_range){
            case 'year':
                $from_date = $lastWeek = date("Y-m-d", strtotime("-1 year"));
                break;
            case 'month':
                $from_date = $lastWeek = date("Y-m-d", strtotime("-1 month"));
                break;
            case 'week':
                $from_date = $lastWeek = date("Y-m-d", strtotime("-1 week"));
                break;
            case 'ytd':
                $from_date = $lastWeek = date("Y-m-d", strtotime("first day of january this year"));
                break;
        }
        return $from_date;
    }

    private function get_max_amount_value($organizations_ids){
        //Getting From Date Filter
        $from_date = $this->get_from_date();

        $this->load->library("Datatables",'','dt1');
        if($from_date) {
            $this->dt1->select("a.id,CONCAT_WS(' ',a.first_name,a.last_name) as name,a.email,
                a.address,a.phone,sum(e.total_amount - e.fee) as net")
                ->from($this->table . ' as a')
                ->join('epicpay_customer_transactions as e', 'e.account_donor_id = a.id and e.total_amount is not null', 'left')
                ->group_by('a.id');
        } else {
            $this->dt1->select("a.id,CONCAT_WS(' ',a.first_name,a.last_name) as name,a.email,
                a.address,a.phone,(a.amount_acum - a.fee_acum) as net")
                ->from($this->table . ' as a');
        }

        //Organizations of User Filter
        $this->dt1->where('a.id_church in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->dt1->where('a.id_church',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        if($campus_id)
            $this->dt1->where('a.campus_id',$campus_id);

        //New Donors Filter
        $new_donors = $this->input->post('new_donors');
        if($new_donors){
            $is_new_donor_before_days = $this->input->post('is_new_donor_before_days');
            //Calc New Donors Date
            $new_donors_date = $lastWeek = date("Y-m-d", strtotime("-".$is_new_donor_before_days." days"));

            $this->dt1->where('a.last_donation_date >=', $new_donors_date);
        }

        //Date Range Filter
        if($from_date)
            $this->dt1->where('e.created_at >=', $from_date);

        //Generating Datatable
        $query = $this->dt1->get_compiled_select($this->table . ' as a');

        $this->dt1->reset_query();

        $result = $this->db->query('select max(t.net) as max_value from ('.$query.') as t')->row();

        return $result && $result->max_value ? $result->max_value : 0;
    }

    public function getDt() {

        //Getting Organization Ids
        $organizations_ids = getOrganizationsIds($this->session->userdata('user_id'));

        //Getting From Date Filter
        $from_date = $this->get_from_date();

        //Getting Max Value
        $max_value = $this->get_max_amount_value($organizations_ids);

        $this->load->library("Datatables");
        if($from_date) {
            $this->datatables->select("a.id,CONCAT_WS(' ',a.first_name,a.last_name) as name,a.email, DATE_FORMAT(a.created_at,'%m/%d/%Y') created_at,
                a.address,a.phone,sum(e.total_amount - e.fee) as net, a.id_church as org_id, a.campus_id as suborg_id, a.business_name")
                ->from($this->table . ' as a')
                ->join('epicpay_customer_transactions as e', 'e.account_donor_id = a.id and e.total_amount is not null '
                    . 'AND ((e.status = "P" AND e.src = "CC") OR e.status_ach = "P" OR (e.status = "P" AND e.manual_trx_type = "DN"))'
                    . '', 'left')
                ->group_by('a.id');
        } else {
            $this->datatables->select("a.id,CONCAT_WS(' ',a.first_name,a.last_name) as name,a.email, DATE_FORMAT(a.created_at,'%m/%d/%Y') created_at,
                a.address,a.phone,(a.amount_acum - a.fee_acum) as net, a.id_church as org_id, a.campus_id as suborg_id, a.business_name")
                ->from($this->table . ' as a');
        }

        //Organizations of User Filter
        $this->datatables->where('a.id_church in ('.$organizations_ids.')');

        //Organizations Filter
        $church_id = (int)$this->input->post('organization_id');
        if($church_id)
            $this->datatables->where('a.id_church',$church_id);

        //Sub Organizations Filter
        $campus_id = (int)$this->input->post('suborganization_id');
        
        $this->datatables->where('a.campus_id',$campus_id ? $campus_id : null);        

        //New Donors Filter
        $new_donors = $this->input->post('new_donors');
        if($new_donors){
            $is_new_donor_before_days = $this->input->post('is_new_donor_before_days');
            //Calc New Donors Date
            $new_donors_date = $lastWeek = date("Y-m-d", strtotime("-".$is_new_donor_before_days." days"));

            $this->datatables->where('a.last_donation_date >=', $new_donors_date);
        }

        //Amount Min and Max Filter
        $max_amount = $this->input->post('max_amount');
        if($max_amount === null){
            $max_amount = (float)$max_value;
            $min_amount = 0;
        }
        else{
            $max_amount = (float)$this->input->post('max_amount');
            $min_amount = (float)$this->input->post('min_amount');
        }


        if($from_date) {
            if ($min_amount == 0)
                $this->datatables->having('net is null or net <='. $max_amount);
            else
                $this->datatables->having('net >= ' . $min_amount . ' and net <=' . $max_amount);
        } else {
            if ($min_amount == 0)
                $this->datatables->where('((a.amount_acum - a.fee_acum) is null or (a.amount_acum - a.fee_acum) <= '. $max_amount.' )');
            else
                $this->datatables->where('(a.amount_acum - a.fee_acum) >= ' . $min_amount . ' and (a.amount_acum - a.fee_acum) <=' . $max_amount);
        }

        //Date Range Filter
        if($from_date)
            $this->datatables->where('e.created_at >=', $from_date);

        //Generating Datatable
        $data = $this->datatables->generate(array('max_value'=>$max_value));

        return $data;
    }

    public function getProfile($id, $client_id = false, $checkClient = true)
    {

        if ($checkClient) {
            $client_id = $client_id ? $client_id : $this->session->userdata('user_id');

            $result = $this->checkBelongsToUser($id, $client_id);
            if ($result !== true) {
                return $result;
            }

            //Getting Organization Ids
            $organizations_ids = getOrganizationsIds($client_id);
        }

        $from_date = date("Y-m-d", strtotime("-1 month"));
        
        $this->db->select("a.id, a.first_name, a.last_name, CONCAT_WS(' ',a.first_name,a.last_name) as name, a.email, a.address,a.phone_code,a.country_code_phone,a.phone, sum(tf.net) as net,
                            a.id_church as org_id, a.campus_id as suborg_id, a.business_name,
                            sum(case when e.created_at >= '" . $from_date . "' then (tf.net) else 0 end) as net_month,
                            min(e.created_at) as first_date, a.state, a.address, a.postal_code, a.city, a.created_at")
            ->from($this->table. ' as a')
            ->join('epicpay_customer_transactions as e','e.account_donor_id = a.id AND '
                    . '((e.status = "P" AND e.src = "CC") OR e.status_ach in ("P") OR (e.status = "P" AND e.manual_trx_type = "DN") OR (e.status = "P" AND e.trx_type = "RE"))' //rest refunds
                . '','left')
            ->join('transactions_funds as tf','tf.transaction_id = e.id', 'left')
            ->group_by('a.id')
            ->where('a.id', $id);

        if ($checkClient) {
            $this->db->where('a.id_church  in (' . $organizations_ids . ')');
        }

        $customer = $this->db->get()
            ->row();

        if($customer) {
            $this->load->model('sources_model');
            $customer->sources = $this->sources_model->getList($customer->id);

            $this->load->model('subscription_model');
            $customer->subscriptions = $this->subscription_model->getList($customer->id);
        }

        return $customer;
    }

    public function get_tags_list() {

        $church_id = $this->input->get('church_id');
        $from_date = date('Y-m-d', strtotime($this->input->get('from')));
        $to_date   = date('Y-m-d', strtotime($this->input->get('to')));

        $fund_id = intval($this->input->get('fund_id'));

        $xdate1 = date_create($from_date);
        $xdate2 = date_create($to_date);
        $diff   = date_diff($xdate1, $xdate2);

        if ($diff->y > 0) {
            return [
                'items'       => [],
                'total_count' => 0,
            ];
            //can't query more than one year
        }

        $all = $this->input->get('all');

        //secure organizations
        $orgnx_ids = getOrganizationsIds($this->session->userdata('user_id'));

        $limit  = 10;
        $offset = ($this->input->post('page') ? $this->input->post('page') - 1 : 0) * $limit;
        $this->db->select('SQL_CALC_FOUND_ROWS trx.account_donor_id id, trx.first_name, trx.last_name, trx.email', false);

        $this->db->where('trx.created_at >=', $from_date);
        $this->db->where('trx.created_at <=', $to_date . ' 23:59:59');
        $this->db->where('trx.trx_type', 'DO');
        $this->db->where('trx.trx_ret_id', null);

        if ($church_id) {
            $this->db->where('trx.church_id', $church_id);
        }

        if ($fund_id) {
            $this->db->join('transactions_funds ff', 'ff.transaction_id = trx.id '
                . 'AND ff.fund_id = ' . $fund_id, 'INNER');
        }

        $this->db->where_in('trx.church_id', $orgnx_ids, false);
        $this->db->where('((trx.status = "P" AND trx.src = "CC") OR trx.status_ach = "P" OR (trx.status = "P" AND trx.manual_trx_type = "DN"))', null, false);

        if ($this->input->post('q')) {
            $this->db->group_start();
            $this->db->or_like('trx.first_name', $this->input->post('q'))
                ->or_like('trx.last_name', $this->input->post('q'))
                ->or_like('trx.email', $this->input->post('q'));
            $this->db->group_end();
        }

        $this->db->group_by('trx.email');

        if (!$all) {
            $this->db->limit($limit, $offset);
        }

        $result = $this->db->get('epicpay_customer_transactions as trx')->result();

        $data = [];
        foreach ($result as $row) {
            $data[] = ['id' => $row->id, 'text' => $row->first_name . ' ' . $row->last_name . ' - ' . ($row->email ? $row->email : 'No email')];
        }

        $total_count = $this->db->query('SELECT FOUND_ROWS() cnt')->row();

        return [
            'items'       => $data,
            'total_count' => $total_count->cnt
        ];
    }
    
    public function getById($id, $orgId = null, $client_id = false) {

        if ($client_id) { //secure organizations
            
            //Getting Organization Ids
            $organizations_ids = getOrganizationsIds($client_id);
            $this->db->where('id_church  in (' . $organizations_ids . ')');
        }

        if($orgId) { //just securing the when we need to get a specific link of an specific organization even when the client_id is validated
            $this->db->where('id_church', $orgId);
        }

        $this->db->where('id', $id);

        return $this->db->get($this->table)->row();
        
    }
    public function get_tags_list_pagination() {
        $limit  = 10; //it must coincide with the limit defined on front end
        $offset = ($this->input->post('page') ? $this->input->post('page') - 1 : 0) * $limit;

        $this->db->select("SQL_CALC_FOUND_ROWS id, CONCAT_WS(' ',first_name,last_name) as name,first_name,last_name, email, business_name", false);

        $church_id = (int)$this->input->post('organization_id');
        $campus_id = (int)$this->input->post('suborganization_id');

        $this->db->where('id_church',$church_id);
        if($campus_id){
            $this->db->where('campus_id',$campus_id);
        } else {
            $this->db->where('campus_id is null');
        }

        if ($this->input->post('q')) {
            $this->db->group_start();
            $this->db->like("CONCAT_WS(' ',first_name,last_name)", $this->input->post('q'));
            $this->db->or_like("email", $this->input->post('q'));
            $this->db->group_end();
        }

        $this->db->limit($limit, $offset);

        $result = $this->db->get($this->table)->result();

        $data = [];
        foreach ($result as $row) {
            $data[] = ['id' => $row->id, 'text' => $row->name .' - '. $row->email, 'first_name' => $row->first_name, 'last_name' => $row->last_name, 'email' => $row->email, 'business_name' => $row->business_name ];
        }

        $total_count = $this->db->query('SELECT FOUND_ROWS() cnt')->row();

        return [
            'items'       => $data,
            'total_count' => $total_count->cnt
        ];
    }

    private function beforeSaveProfile($data){

        if(isset($data['first_name']) && (!isset($data['last_name']) || $data['last_name'] == null)){
            $names = explode(' ', $data['first_name']);
            $count = count($names);
            if($count > 1){
                $data['first_name'] = ucwords(strtolower(trimLR_Duplicates($names[0])));

                $data['last_name'] = '';
                $i = 1;
                for($i = 1; $i < $count; $i++ ){
                    $data['last_name'] .= ucwords(strtolower(trimLR_Duplicates($names[$i]))) . ' ';
                }
                $data['last_name'] = substr($data['last_name'], 0, -1); //remove tha last space
            } else {
                $data['last_name'] = '';
            }

        }

        if(isset($data['first_name']) && $data['first_name']){
            $data['first_name'] = ucwords(strtolower(trimLR_Duplicates($data['first_name'])));
        }
        if(isset($data['last_name']) && $data['last_name']){
            $data['last_name'] = ucwords(strtolower(trimLR_Duplicates($data['last_name'])));
        }
        if(isset($data['city']) && $data['city']){
            $data['city'] = ucwords(strtolower(trimLR_Duplicates($data['city'])));
        }
        if(isset($data['state']) && $data['state']){
            $data['state'] = strtoupper($data['state']);
        }
        if(isset($data['address']) && $data['address']){
            $data['address'] =  ucfirst(trimLR_Duplicates($data['address']));
        }

        if(isset($data['business_name']) && $data['business_name']){
            $data['business_name'] =  ucfirst(trimLR_Duplicates($data['business_name']));
        }
        
        //if phone is sent to this model but there is no value, proceed to overrite it to null - we do this for keeping clean phone fields we want it null always
        if(array_key_exists('phone', $data) && !$data['phone']) {
            $data['phone'] = null;            
        }
        
        //if country_code_phone is sent to this model but there is no value, proceed to overrite it to null
        if(array_key_exists('country_code_phone', $data) && !$data['country_code_phone']) {
            $data['country_code_phone'] = null;            
        }
        
        //if phone_code is sent to this model but there is no value, proceed to overrite it to null
        if(array_key_exists('phone_code', $data) && !$data['phone_code']) {
            $data['phone_code'] = null;            
        }
        
        return $data;
    }

    public $validateFirstName = true;
    public function save($data, $client_id = false) {  
        
        $data['id']   = isset($data['id']) && $data['id'] ? (int) $data['id'] : null;        
        $val_messages    = [];
        if(!$data['id']) {
            if (!isset($data['organization_id']) || !$data['organization_id'])
                $val_messages [] = langx('The Company field is required');
        }

        if ($this->validateFirstName && (!isset($data['first_name']) || !$data['first_name']))
            $val_messages [] = langx('The Name field is required');

        if(!$data['id']) {
            if (!isset($data['email']) || !$data['email'])
                $val_messages [] = langx('The Email field is required');
            else if($data['email'] && !filter_var($data['email'],FILTER_VALIDATE_EMAIL) )
                $val_messages [] = langx('Invalid Email');
        }

        if(isset($data['phone']) && $data['phone'] && (!is_numeric($data['phone']) || strlen($data['phone']) > 15))
            $val_messages [] = langx('Invalid Phone Number');

        if (empty($val_messages)) {
            $client_id = $client_id ? $client_id : $this->session->userdata('user_id');

            if($data['id']) {
                $result = $this->checkBelongsToUser($data['id'], $client_id);
                if ($result !== true) {
                    throw new Exception('Invalid User');
                }

                $data['organization_id'] = $this->get($data['id'])->id_church;
            }

			
            // ---- Validating that the user sends an organization that belongs to him
            $orgnx_ids = getOrganizationsIds($client_id ? $client_id : $this->session->userdata('user_id'));

            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];

            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }
            // ----
            //Repeated Email Validation
			
            if (!$data['id']) {
                $user_repeated_email = $this->donor_model->getLoginData($data['email'], $data['organization_id']);
                if ($user_repeated_email) {
                    throw new Exception('Email has already been registered, please enter a different one.' . ' ' . $data['email']);
                }
            }


            //Repeated Phone Validation
            if (isset($data['phone']) && $data['phone_country_code']) {
                $user_repeated_phone = $this->donor_model->getLoginData(null, $data['organization_id'], $data['phone'], $data['phone_country_code']);
                if ($user_repeated_phone) {
                    if (!$data['id'] || $data['id'] != $user_repeated_phone->id)
                        throw new Exception('Phone has already been registered, please enter a different one.');
                }
            }

            if(!$data['id']) { // Create Donor
                $campus_id = isset($data['suborganization_id']) && $data['suborganization_id'] ? (int) $data['suborganization_id'] : null;
                $save_data = [
                    'id_church'          => $data['organization_id'],
                    'campus_id'          => $campus_id,
                    'first_name'         => isset($data['first_name']) ? $data['first_name'] : null,
                    'last_name'          => isset($data['last_name']) ? $data['last_name'] : null,
                    'email'              => $data['email'],
                    'country_code_phone' => isset($data['country_code']) ? $data['country_code'] : 'US',
                    'phone_code'         => isset($data['phone_country_code']) ? $data['phone_country_code'] : null,
                    'phone'              => isset($data['phone']) ? $data['phone'] : null,
                    'address'            => isset($data['address']) ? $data['address'] : null,
                    'business_name'      => isset($data['business_name']) ? $data['business_name'] : null,
                    'created_from'       => isset($data['created_from']) ? $data['created_from'] : uri_string(),
                    'stripe_customer_id' => isset($data['stripe_customer_id']) ? $data['stripe_customer_id'] : null,
                    'metadata'           => isset($data['metadata']) ? json_encode($data['metadata']) : null,
                ];
				

                $save_data = $this->beforeSaveProfile($save_data);
                $this->db->insert($this->table, $save_data);

                $name = $save_data['last_name'] ? $save_data['first_name'] . ' ' .$save_data['last_name'] : $save_data['first_name'];

                return [
                    'status'  => true,
                    'message' => langx('Customer Created'),
                    'data' => ['id' => $this->db->insert_id(), 'name' => $name, 'first_name' => $save_data['first_name'], 'last_name' => $save_data['last_name']]
                ];
            } else { //Update Donor
                $save_data = [
                    'first_name'         => $data['first_name'],
                    'last_name'          => $data['last_name'],
                    'country_code_phone' => $data['country_code'],
                    'phone_code'         => $data['phone_country_code'],
                    'phone'              => $data['phone'],
                    'address'            => $data['address'],
                    'business_name'      => $data['business_name']
                ];

                $this->db->where('id', $data['id']);
                $save_data = $this->beforeSaveProfile($save_data);
                $this->db->update($this->table, $save_data);

                return [
                    'status'  => true,
                    'message' => langx('Customer Updated')
                ];
            }
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }

    public function update_profile($data, $client_id = false) {
        
        $donor_id  = $data['id'];
        $client_id = $client_id ? $client_id : $this->session->userdata('user_id');
        
        $result    = $this->checkBelongsToUser($donor_id, $client_id);
        
        if ($result !== true) {
            return $result;
        }
        
        $this->db->where('id', $donor_id);
        $data = $this->beforeSaveProfile($data);
        $this->db->update($this->table, $data);
        return true;
    }

    // created_from = 'R' => Registration
    public function register($data){
        $data = $this->beforeSaveProfile($data);
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function getLoginData($email,$church_id,$phone = null,$phone_code = null, $is_full_phone = false){
       
        $donor = null;
        $this->db->select('id,first_name,email,id_church,campus_id,password')
            ->from($this->table);
        if($email) {
            $this->db->where('email', $email)
                ->where('id_church', $church_id);
            $donor = $this->db->get()->row();
        }

        if($phone && !$donor){
            $phone = preg_replace("/[^0-9]/", "", $phone );
            $this->db->where('id_church',$church_id);
            if(!$is_full_phone) {
                $this->db->where('phone',$phone)
                    ->where('phone_code',$phone_code);
            } else {
                $this->db->where('CONCAT_WS("",phone_code,phone)',$phone);
            }
            $donor = $this->db->get()->row();
        }

        return $donor;
    }

    public function is_logged($donor_id,$church_id,$campus_id){
        $this->db->where('id', $donor_id)->where('id_church',$church_id)->from($this->table);

        if($campus_id)
            $this->db->where('campus_id',$campus_id);

        return $this->db->get()->row();
    }

    public function get($where_or_id, $select = false, $row = true,$client_id = null) {
		
        if($client_id){
			//Getting Organization Ids
            $organizations_ids = getOrganizationsIds($client_id);
            $this->db->where('id_church  in ('.$organizations_ids.')');
        }

        if ($select) {
            $this->db->select($select);
        }
        if(is_numeric($where_or_id)){ //evaluate as id
            $this->db->where('id', $where_or_id);
        }else{
            $this->db->where($where_or_id); //evaluate as where clausule
        }

        if ($row) {
            return $this->db->get($this->table)->row();
        }
        return $this->db->get($this->table)->result();
    }
	
	
    public function getAllByStripe() {
        $client_id         = $this->session->userdata('user_id');
        $organizations_ids = getOrganizationsIds($client_id);
        
        $this->db->select('id, stripe_customer_id');
        $this->db->where("stripe_customer_id IS NOT NULL", null, false);
        $this->db->where('id_church  in (' . $organizations_ids . ')');
        
        $data = $this->db->get($this->table)->result();
        return $data;
    }

    public function getByStripeEmail($email) {
      
        $this->db->select('id, stripe_customer_id, email');
        $this->db->where('stripe_customer_id IS NOT NULL', null, false);
        $this->db->where('email', $email);
        $data = $this->db->get($this->table)->row();
        return $data;
    }

     public function getByEmail($email, $orgId = null, $client_id = false) {

        if ($client_id) { //secure organizations
            
            //Getting Organization Ids
            $organizations_ids = getOrganizationsIds($client_id);
            $this->db->where('id_church  in (' . $organizations_ids . ')');
        }

        if($orgId) { //just securing the when we need to get a specific link of an specific organization even when the client_id is validated
            $this->db->where('id_church', $orgId);
        }

        $this->db->where('email', $email);

        return $this->db->get($this->table)->row();
        
    }

    public function updateDonationAcum($data, $id_is_secure = true){

        if (!$id_is_secure) {
            //When the id needs to be validated
        } else {
            //id is secure, comes from a session or is validated outside the model, example chat donations, it comes from a session
        }
        
        $donor_id = $data['id'];
        $donor    = $this->get(['id' => $donor_id], ['amount_acum', 'fee_acum', 'net_acum']);

        if ($donor) {
            $save_data = [
                'amount_acum' => $data['amount_acum'] + $donor->amount_acum,
                'fee_acum'    => $data['fee_acum'] + $donor->fee_acum,
                'net_acum'    => $data['net_acum'] + $donor->amount_acum,
            ];
            $this->db->where('id', $donor_id)->update($this->table, $save_data);
        }

        return true;
    }

    //===== get last donors
    public function getNewDonorsZapierPoll($user_id){

        $from = '2020-09-18';
        $orgnx_ids = getOrganizationsIds($user_id);
        $data = $this->db->select('dnr.id, dnr.email, dnr.first_name, dnr.last_name, dnr.phone, '
            . 'DATE(dnr.created_at) as created_at')
            ->where('dnr.id_church in (' . $orgnx_ids . ')')
            ->where("dnr.created_at >= '$from'", null, false)
            ->order_by('dnr.id', 'desc')
            ->limit(25, 0)
            ->get($this->table . ' dnr')->result();

        return $data;
    }

    public function forgotten_password($email,$church_id,$forgotten_back_url)
    {
        $CI = CI_Controller::get_instance();
        $CI->load->model('ion_auth_model');

        // Retrieve user information
        $user = $this->getLoginData($email,$church_id);

        if($user)
        {
            // Generate code
            $code = false;

            // Generate random token: smaller size because it will be in the URL
            $token = $CI->ion_auth_model->_generate_selector_validator_couple(20, 80);

            $update = [
                'forgotten_back_url'          => $forgotten_back_url,
                'forgotten_password_selector' => $token->selector,
                'forgotten_password_code'     => $token->validator_hashed,
                'forgotten_password_time'     => time()
            ];

            $this->db->update($this->table, $update, ['email' => $email, 'id_church' => $church_id]);

            if ($this->db->affected_rows() === 1) {
                $code = $token->user_code;
            } else {
                $code = FALSE;
            }

            if ($code)
            {
                return [
                    'identity'                => $email,
                    'forgotten_password_code' => $code,
                    'user'                    => $user
                ];
            }
        }
        return FALSE;
    }

    public function forgotten_password_check($code)
    {
        $user = $this->get_user_by_forgotten_password_code($code);

        if (!is_object($user))
        {
            return FALSE;
        }
        else
        {
            if ($this->config->item('forgot_password_expiration', 'ion_auth') > 0)
            {
                //Make sure it isn't expired
                $expiration = $this->config->item('forgot_password_expiration', 'ion_auth');
                if (time() - $user->forgotten_password_time > $expiration)
                {
                    //it has expired
                    $email = $user->email;
                    $church_id = $user->id_church;
                    $this->clear_forgotten_password_code($email,$church_id);
                    return FALSE;
                }
            }
            return $user;
        }
    }

    public function reset_password($identity,$church_id, $new) {
        if (!$this->identity_check($identity,$church_id)) {
            return FALSE;
        }
        $return = $this->_set_password_db($identity,$church_id, $new);
        return $return;
    }

    protected function identity_check($identity,$church_id) {
        if (empty($identity)) {
            return FALSE;
        }

        return $this->db->where('email', $identity)->where('id_church', $church_id)
                ->limit(1)
                ->count_all_results($this->table) > 0;
    }

    protected function _set_password_db($identity, $church_id, $password) {
        $CI = CI_Controller::get_instance();
        $CI->load->model('ion_auth_model');

        $hash = $CI->ion_auth_model->hash_password($password, $identity);

        if ($hash === FALSE) {
            return FALSE;
        }

        // When setting a new password, invalidate any other token
        $data = [
            'password'                    => $hash,
            'forgotten_back_url'          => NULL,
            'forgotten_password_selector' => NULL,
            'forgotten_password_code'     => NULL,
            'forgotten_password_time'     => NULL
        ];

        $this->db->update($this->table, $data, ['email' => $identity,'id_church' => $church_id]);

        return $this->db->affected_rows() == 1;
    }

    protected function clear_forgotten_password_code($identity, $church_id) {

        if (empty($identity)) {
            return FALSE;
        }

        $data = [
            'forgotten_password_selector' => NULL,
            'forgotten_password_code' => NULL,
            'forgotten_password_time' => NULL
        ];

        $this->db->update($this->table , $data, ['email' => $identity, 'id_church' => $church_id]);

        return TRUE;
    }

    protected function get_user_by_forgotten_password_code($user_code) {
        $CI = CI_Controller::get_instance();
        $CI->load->model('ion_auth_model');

        // Retrieve the token object from the code
        $token = $CI->ion_auth_model->_retrieve_selector_validator_couple($user_code);

        if ($token) {
            // Retrieve the user according to this selector
            $user = $this->db->from($this->table)->where('forgotten_password_selector', $token->selector)->get()->row();

            if ($user) {
                // Check the hash against the validator
                if ($CI->ion_auth_model->verify_password($token->validator, $user->forgotten_password_code)) {
                    return $user;
                }
            }
        }

        return FALSE;
    }

    public function changeStatusSmsChat($user_id,$donor_id,$status){
        $result  = $this->checkBelongsToUser($donor_id, $user_id);
        if ($result !== true) {
            return $result;
        }

        $this->db->where("id",$donor_id)
            ->update($this->table,['status_chat' => $status]);

        return true;
    }    
     public function getWhere(array $where_arr, $select= false) {
         
        $where = ['id_church' => $where_arr['orgnx_id']];
        if($select) {
            $this->db->select($select);
        } 
        $this->db->where($where);
        return $this->db->get($this->table)->result();
    }
}

