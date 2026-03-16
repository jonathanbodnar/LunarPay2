<?php

defined('BASEPATH') or exit('No direct script access allowed');


class Product_customer_model extends CI_Model
{

    private $table = 'products';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string


    public function __construct()
    {
        parent::__construct();
    }

    public function getAvilableByMerchant($orgId)
    {
        $result = $this->db
            ->where('church_id', $orgId)
            ->where('show_customer_portal', 1)
            ->where('trash', 0)
            ->order_by('id', 'desc')
            ->get($this->table)
            ->result();

        return $result;
    }

    public function getAvailableByMerchantCount($orgId)
    {
        $result = $this->db
            ->where('church_id', $orgId)
            ->where('show_customer_portal', 1)
            ->where('trash', 0)
            ->count_all_results($this->table);

        return $result;
    }
}
