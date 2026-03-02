<?php

defined('BASEPATH') OR exit('No direct script access allowed');
function fuSumAmount($fund_id) {
    $CI     = & get_instance();
    $result = $CI->db->select('sum(tf.net) amount')
            ->where('tf.fund_id', $fund_id)
            ->where('tf.transaction_id is not null') //====we don't want to query transactions_funds linked to subscriptions
            ->join('epicpay_customer_transactions as t','t.id = tf.transaction_id 
                    AND ((t.trx_type = "DO" AND ((t.status = "P" AND t.src = "CC") OR t.status_ach = "P")) 
                    OR (t.trx_type = "RE" AND t.status = "P") OR (t.status = "P" AND t.manual_trx_type IS NOT NULL))'
                    ,'inner')
            ->get('transactions_funds tf')->row();
    
    return $result->amount ? $result->amount : 0;
}
function fuCountDonations($fund_id) {
    $CI     = & get_instance();
    $result = $CI->db->select('count(tf.net) count_donations')
            ->where('tf.fund_id', $fund_id)
            ->get('transactions_funds tf')->row();

    return $result->count_donations ? $result->count_donations : 0;
}
class Fund_model extends CI_Model {

    private $table = 'funds';

    public function __construct() {
        parent::__construct();
    }

    private function checkBelongsToUser($id, $user_id) {
        return checkBelongsToUser([
            ['funds.id' => $id, 'church_id', 'church_detail.ch_id'],
            ['church_detail.ch_id' => '?', 'client_id', 'users.id', $user_id],
        ]);
    }

    public function getDt($user_id = null) {
        //Getting Organization Ids
        $user_id = $user_id ? $user_id :$this->session->userdata('user_id');
        $organizations_ids = getOrganizationsIds($user_id);

        $this->load->library("Datatables");
        $this->datatables->select("f.id,f.name,f.description, f.is_active,
                    cd.church_name as organization, f.church_id, f.campus_id,
                    c.name as suborganization")
                ->from($this->table.' as f')
                ->join('church_detail as cd','cd.ch_id = f.church_id AND cd.trash = 0')
                ->join('campuses as c','c.id = f.campus_id','left');
                
        //Organizations of User Filter
        $this->datatables->where('f.church_id  in ('.$organizations_ids.')');

        $church_id = (int) $this->input->post('organization_id');
        if ($church_id)
            $this->datatables->where('f.church_id', $church_id);

        $campus_id = (int) $this->input->post('suborganization_id');
        if ($campus_id)
            $this->datatables->where('f.campus_id', $campus_id);
        else
            $this->datatables->where('f.campus_id', null);
        
        $this->datatables->add_column('amount', '$1', 'fuSumAmount(id)');
        $this->datatables->add_column('count_donations', '$1', 'fuCountDonations(id)');

        $data = $this->datatables->generate();
        return $data;
    }

    public function getList($church_id = null, $campus_id = null, $select = null){
        
        if (!$church_id)
            $church_id = (int) $this->input->post('organization_id');

        if (!$campus_id)
            $campus_id = (int) $this->input->post('suborganization_id');

        $get_all = false;
        if($church_id == null && $campus_id == null){
            if(!$this->input->post('get_all')){
                return [];
            }else{
                $get_all = true;
            }
        }
        
        //Getting Organization Ids
        $organizations_ids = getOrganizationsIds($this->session->userdata('user_id'));

        //Organizations of User Filter
        if($organizations_ids)
            $this->db->where('f.church_id  in ('.$organizations_ids.')');

        if ($church_id)
            $this->db->where('f.church_id', $church_id);

        if ($campus_id)
            $this->db->where('f.campus_id', $campus_id);
        else
            $this->db->where('f.campus_id', null);
        
        if($get_all){
            $this->db->join('church_detail ch', 'ch.ch_id = f.church_id and ch.trash = 0', 'INNER');
            $this->db->join('campuses ca', 'ca.id = f.campus_id', 'LEFT');
            
            if(!$select){
                $this->db->select('f.id, if(f.campus_id is null, CONCAT_WS(" - ORGN ", f.name, ch.church_name), CONCAT_WS(" - SUB ", f.name, ca.name)) as name', FALSE);
            }
        }

        $this->db->where('f.is_active', 1);

        if($select){
            $this->db->select($select);
        }
        
        $result = $this->db->get($this->table . ' f')->result_array();

        return $result;
    }

    //====== it will retrieve a list of funds of the church or campus, 
    //====== it won't retrieve the funds of the campuses when the query is from a church
    public function getListSimple($church_id, $campus_id = null, $result_object = false){

        if ($church_id)
            $this->db->where('f.church_id', $church_id);

        if ($campus_id)
            $this->db->where('f.campus_id', $campus_id);
        else
            $this->db->where('f.campus_id', null);

        $this->db->where('f.is_active', 1);

        if($result_object) {
            $result = $this->db->get($this->table . ' f')->result_object();
        } else {
            $result = $this->db->get($this->table . ' f')->result_array();
        }

        return $result;
    }

    public function register($data) {

        unset($data['id']);
        
        $data['name'] = ucwords(strtolower(trimLR_Duplicates($data['name'])));
        
        $data['campus_id'] = isset($data['campus_id']) && $data['campus_id'] ? $data['campus_id'] : null;
        
        if (!isset($data['created_at']) || !$data['created_at']) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($data) {
        $fund_id = $data['id'];
        
        //if(isset($data['name'])) {
            //Before uncommenting this check data handling comming from the controller, why in the controller is there a $fund_name_changed variable?
            //$data['name'] = ucwords(strtolower(trimLR_Duplicates($data['name'])));
        //}
        
        $user_id = $this->session->userdata('user_id');
        $result  = $this->checkBelongsToUser($fund_id, $user_id);

        if ($result !== true) {
            return $result;
        }

        $this->db->where('id', $fund_id);
        $this->db->update($this->table, $data);
        return true;
    }
    
    //this is for getting started only
    //we will reset if and only if there are no transactions
    //process is: we remove all existing funds and create the new ones
    public function resetFunds($fundsNew, $church_id) {

        $user_id = $this->session->userdata('user_id');

        $userOrgIdsString = getOrganizationsIds($user_id); //gets a string
        $userOrgIds       = explode(',', $userOrgIdsString); //convert to array

        $return_ids = [];
        if ($church_id && in_array($church_id, $userOrgIds)) { //securing church_id, if false do nothing
            $this->load->model('donation_model');
            $hasTrxn = $this->donation_model->churchHasTrxnSimple($church_id);
            //check do not deleting if we send and existing
            if (!$hasTrxn) {

                //delete all funds
                $this->db->where('church_id', $church_id)->delete($this->table); //church_id is secured

                foreach ($fundsNew as $fundNew) {

                    $insert_data = [
                        'name'       => $fundNew,
                        'church_id'  => $church_id, //church_id is secured
                        'created_at' => date('Y-m-d H:i:s')
                    ];

                    $return_ids[] = $this->register($insert_data); //church_id is secure
                }
            }
        }

        return $return_ids;
    }

    public function delete($id) {

        $user_id = $this->session->userdata('user_id');
        $result  = $this->checkBelongsToUser($id, $user_id);

        if ($result !== true) {
            return $result;
        }

        $this->db->where('id', $id);
        $this->db->delete($this->table);
        return true;
    }

    public function active($id,$active,$user_id) {
        $result  = $this->checkBelongsToUser($id, $user_id);

        if ($result !== true) {
            return $result;
        }

        $this->db->where('id', $id);
        $this->db->update($this->table,['is_active' => $active]);
        return true;
    }

    public function get($id, $church_id = false, $campus_id = false) {
        
        //we can provide church_id and campus_id for forcing protection getting the fund
        
        if($church_id) {
            $this->db->where('church_id', $church_id);
        }
        
        if($campus_id) {
            $this->db->where('campus_id', $campus_id);
        }
        
        return $this->db->where('id', $id)->from($this->table)->get()->row();
    }
    
    public function getWithOrgnData($id) {
        
        $data = $this->db->select('f.*, ch.church_name, ca.name as campus_name')
                ->where('f.id', $id)
                ->join('church_detail ch', 'ch.ch_id = f.church_id', 'left')
                ->join('campuses ca', 'ca.id = f.campus_id', 'left')
                ->get($this->table . ' as f')->row();
        
        // ---- verifyx ---- somebody could scan church names
        // ----------------- just confirming the church id returned in the fund exists inside the user organizations
        
        $user_id = $this->session->userdata('user_id');
        $userOrgIdsString = getOrganizationsIds($user_id); //gets a string
        
        if($data && in_array($data->church_id, explode(',', $userOrgIdsString))) {
            return $data;
        }
        
        return null;
        
        
    }
    
    public function getWhere($select = false, $where = false, $orderBy = false, $row = false) {        

        if ($select) {
            $this->db->select($select);
        } else {
            $this->db->select('*');
        }
        
        if ($where) {
            $this->db->where($where);
        }
        
        if ($orderBy) {
            $this->db->order_by($orderBy);
        }

        $this->db->where('f.is_active', 1);
        
        if($row){
            $result = $this->db->get($this->table)->row();
        }else {
            $result = $this->db->get($this->table)->result();
        }

        return $result;
    }

    public function getSelect($id, $select) {
        return $this->db->select($select)->where('id', $id)->where('f.is_active', 1)->from($this->table)->get()->row();
    }
    
    public function getFirstOrgFund($churchId, $campusId = null) {
        return $this->db->where(['church_id' => $churchId, 'campus_id' => $campusId, 'is_active' => 1])
                ->limit(1)->order_by('id', 'asc')
                ->get($this->table)->row();
    }

}
