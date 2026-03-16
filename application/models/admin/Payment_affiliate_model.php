<?php

defined('BASEPATH') OR exit('No direct script access allowed');
class Payment_affiliate_model extends CI_Model { //include suborgnx too

    
    private $table     = 'payment_affiliates';
    public $valAsArray = false;

    public function __construct() {
        parent::__construct();
    }

    public function save($data) {
        if(!isset($data['amount']) || $data['amount']<=0){
            $val_messages [] = langx('A valid amount is required');
        }
        
        if (empty($val_messages)) {
            $this->db->insert($this->table, array(
                'user_id'=>$data['user_id'],
                'amount'=>$data['amount'],
                'date_month_covered'=> date('Y-m-d', strtotime($data['year'].'-'.$data['month'].'-01')),
                'message'=> isset($data['message']) ? $data['message'] : null,
            ));
            return [
                'status'  => true,
                'message' => langx('Payment saved'),
            ];
        }
        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }
    public function getPaymentsByUserId($id) {
        return $this->db->select("amount, "
                . "DATE_FORMAT(date_month_covered, '%m/%Y') date_month_covered, "
                . "DATE_FORMAT(date_created, '%m/%d/%Y') date_created, "
                . "message")
            ->where('user_id',$id)
            ->from($this->table)
            ->order_by('id DESC')
            ->get()
            ->result_array();
    }
    
    
    
}
