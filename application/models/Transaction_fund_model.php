<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Transaction_fund_model extends CI_Model {

    private $table = 'transactions_funds';

    public function __construct() {
        parent::__construct();
    }

    //use this function before registering a new transaction fund, it secures data and prevent possible hacks from outside
    public function validateTransactionFundsBelongToOrgnx($fund_data, $church_id, $campus_id = false) {
        $this->load->model('fund_model');
        
        if(!is_array($fund_data)) { //if fund_data is not array (it can be an int) merge it into an array
            $fund_data = [['fund_id' => $fund_data]];
        }
        
        foreach ($fund_data as $fund) {
            $fundDb = $this->fund_model->get($fund['fund_id'], $church_id, $campus_id);
            if(!$fundDb) {
                return ['error' => 1, 'message' => 'Invaid request, invalid funds'];
            } 
        }
        return ['error' => 0, 'message' => 'Funds validation okay'];
    }

    //if customer_subscription_id is sent we load funds names not from funds table but from transaction_funds table
    private function getFundName($data, $cust_sub_id = null) {
        if(!$cust_sub_id) {
            $this->load->model('fund_model');
            $fundDb = $this->fund_model->get($data['fund_id']);
        } else {
            $fundDb = $this->db->select('fund_name as name')
                    ->where('subscription_id', $cust_sub_id)->where('fund_id', $data['fund_id'])
                    ->get($this->table)->row();
        }
        
        $data['fund_name'] = $fundDb ? $fundDb->name : '';
        return $data;
    }
    
    public function register($data, $cust_sub_id = null) {
        $data = $this->getFundName($data, $cust_sub_id);
        $this->db->insert($this->table, $data);
    }

    public function getByTransaction($trnx_id) {
        $data = $this->db->select('tf.*, f.name')->where('transaction_id', $trnx_id)
                        ->join('funds as f', 'f.id = tf.fund_id', 'LEFT')
                        ->order_by('tf.id', 'ASC')
                        ->get($this->table . ' tf')
                        ->result_array();

        return $data;
    }
    
    public function getBySubscription($sub_id) {
        $data = $this->db->select('tf.*, f.name')->where('subscription_id', $sub_id)
                        ->join('funds as f', 'f.id = tf.fund_id', 'LEFT')
                        ->order_by('tf.id', 'ASC')
                        ->get($this->table . ' tf')
                        ->result_array();

        return $data;
    }
    
     public function update($data) {
        
        $id = $data['id'];
        unset($data['id']);
        $this->db->where('id', $id)->update($this->table, $data);
    }
    
    public function updateBySubscription($sub_id, $data){
        $this->db->where('subscription_id', $sub_id)->update($this->table, $data);
    }
    
    // --- $data['transaction_id'] - it must come already secured
    public function remove_transaction($data) {

        $this->db->where('transaction_id', $data['transaction_id'])->delete($this->table);
    }

}
