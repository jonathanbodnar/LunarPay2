<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Invoice_products_model extends CI_Model {

    private $table       = 'invoice_products';
    private $tableParent = 'products';
    public $valAsArray   = false; //for getting validation errors as array or a string, false = string
    
    //invoice hash =>>> hash = invoice_id + hash, so the total hash size will be the length of invoice_id + length of HASH_SIZE
    const HASH_SIZE = 128; 

    public function __construct() {
        parent::__construct();
    }
    
    public function getList($invoice_id) { 
        // do not use trash 
        // ---- we need to use the fixed price (product_inv_price), the one saved in the invoice relation (invoice_products), 
        // ---- as a product price can change but should not in the invoice        
        
        return $this->db->select('ip.*, "hidden" as price, ip.price product_inv_price, p.name as product_name, ip.product_name as product_inv_name, p.reference,
                CONCAT_WS("","'.BASE_URL_FILES.'files/get/digital_content/",p.file_hash) as digital_content_url , p.file_hash as digital_content,p.product_quickbooks_id')
                ->join($this->tableParent . ' p', 'p.id = ip.product_id', 'left')
                ->where('invoice_id', $invoice_id)
                ->get($this->table . ' ip')->result();
    }

    //it checks if a product is associated with any invoice
    public function productExistInInvoices($product_id) {
        
        $data = $this->db->select('id')
            ->where('product_id', $product_id)
            ->get($this->table)->num_rows();
        
        return $data;
    }

    public function save($data) {
        $val_messages = [];
        if (empty($val_messages)) {
            $this->db->insert($this->table, $data);

            return [
                'status'  => true,
                'message' => langx('Invoice Product Created'),
            ];
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }

    public function removeAllInvoice($invoice_id)
    {
        $this->db->where('invoice_id', $invoice_id);
        $this->db->delete($this->table);
        return true;
    }
}
