<?php

defined('BASEPATH') or exit('No direct script access allowed');



class Invoice_customer_model extends CI_Model
{

    private $table       = 'invoices';
    public $valAsArray   = false; //for getting validation errors as array or a string, false = string

    public function __construct()
    {
        parent::__construct();
    }

    public function getInvoices($customerId)
    {
        // Load invoice model for accesing the constants.
        $this->load->model('invoice_model');

        // We exéct customerId comes safe.


        $invoices = $this->db
            ->where('donor_id', $customerId)
            ->where_in('status', [
                Invoice_model::INVOICE_UNPAID_STATUS,
                Invoice_model::INVOICE_DUE_STATUS,
                Invoice_model::INVOICE_PAID_STATUS
            ])
            ->where('trash', 0)
            ->order_by('id', 'desc')
            ->get($this->table)->result();

        foreach ($invoices as &$invoice) {
            $invoice->_status = Invoice_model::INVOICE_STATUS_STRING[$invoice->status];
            $invoice->_link = BASE_URL . 'c/invoice/' . $invoice->hash;
        }

        return $invoices;
    }
}
