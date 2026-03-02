<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function inAllowRemove($countInvoices) {    
    $countInvoices = (int)$countInvoices;
    if($countInvoices == 0) {        
        return 1;
    }    
    return 0;
}

function prdRecurrenceAsString($recurrence) {       
    return Product_model::RECURRENCE_STRINGS[$recurrence];
}

function prdPeriodAsString($period) {     
    if ($period == Product_model::PERIODICALLY_CUSTOM ) {
      return   Product_model::PERIODICALLY_CUSTOM;
    } else {
        return $period ? Product_model::PERIODICALLY_STRINGS[$period] : null;
    }
}

function prdShowInCustomerPortal($value) {
    if($value) {
        return '<badge class="badge badge-primary" style="width:50px">Yes</badge>';
    } else {
        return '<badge class="badge badge-secondary" style="width:50px">No</badge>';
    }
}

class Product_model extends CI_Model {

    private $table = 'products';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    const RECURRENCE_ONE_TIME     = 'O';
    const RECURRENCE_PERIODICALLY = 'R';
    const RECURRENCE_CUSTOM = 'C';
    const RECURRENCE_STRINGS = [//For presenting to the final user*
        Product_model::RECURRENCE_ONE_TIME     => 'One Time',
        Product_model::RECURRENCE_PERIODICALLY => 'Periodically',
        Product_model::RECURRENCE_CUSTOM => 'Custom'
    ];
    const PERIODICALLY_DAYLY    = 'daily';
    const PERIODICALLY_WEEKLY   = 'weekly';
    const PERIODICALLY_MONTHLY  = 'monthly';
    const PERIODICALLY_3_MONTHS = '3_months';
    const PERIODICALLY_6_MONTHS = '6_months';
    const PERIODICALLY_YEARLY   = 'yearly';  
    const PERIODICALLY_CUSTOM   = 'Custom';  
    
    
    //for private use
    private $periods = [
        Product_model::PERIODICALLY_DAYLY,
        Product_model::PERIODICALLY_WEEKLY,
        Product_model::PERIODICALLY_MONTHLY,
        Product_model::PERIODICALLY_3_MONTHS,
        Product_model::PERIODICALLY_6_MONTHS,
        Product_model::PERIODICALLY_YEARLY, 
        Product_model::PERIODICALLY_CUSTOM,
    ];

    const PERIODICALLY_STRINGS = [//For presenting to the final user*
        Product_model::PERIODICALLY_DAYLY    => 'Daily',
        Product_model::PERIODICALLY_WEEKLY   => 'Weekly',
        Product_model::PERIODICALLY_MONTHLY  => 'Monthly',
        Product_model::PERIODICALLY_3_MONTHS => 'Every 3 Months',
        Product_model::PERIODICALLY_6_MONTHS => 'Every 6 Months',
        Product_model::PERIODICALLY_YEARLY   => 'Yearly',
        Product_model::PERIODICALLY_CUSTOM   => 'Custom'
    ];
    
    //subscriptions/recurrence cron jobs used on a strtotime function // check paysafecron.php/process_recurrent_transactions();
    const PERIODICALLY_TIME_DISTANCE = [
        Product_model::PERIODICALLY_DAYLY    => '+1 day', Product_model::PERIODICALLY_WEEKLY   => '+1 week',
        Product_model::PERIODICALLY_MONTHLY  => '+1 month', Product_model::PERIODICALLY_3_MONTHS => '+3 month',
        Product_model::PERIODICALLY_6_MONTHS => '+6 month', Product_model::PERIODICALLY_YEARLY   => '+1 years'
    ];

    public function __construct() {
        parent::__construct();
    }
    
    static function getConstants() {
        $oClass = new ReflectionClass(__CLASS__);
        return $oClass->getConstants();
    }

    private function beforeSave($data){
        if(isset($data['name']) && $data['name']){
            $data['name'] = ucwords(strtolower(trimLR_Duplicates($data['name'])));
        }

        if(isset($data['show_customer_portal'])){
            $data['show_customer_portal'] = $data['show_customer_portal'] ? 1 : null;
        }
        return $data;
    }

    public function getDt() {
        $user_id  = $this->session->userdata('user_id');
        $orgnx_id = $this->input->post('organization_id');
        $suborgnx_id = $this->input->post('sub_organization_id');
        $this->load->library("Datatables");        
        if ($orgnx_id) {
            $this->datatables->where('prod.church_id', $orgnx_id ); //chrus = organization campus= sub
        }
        
        if ($suborgnx_id) {
            $this->datatables->where('prod.campus_id', $suborgnx_id);
        } else {
            $this->datatables->where('prod.campus_id', null);
        }
        $this->datatables->select("prod.id, prod.reference, c.church_name, cm.name as cs_name, prod.name as prod_name, 
        CONCAT_WS(' / ', c.church_name, IF(LENGTH(cm.name),cm.name,NULL)) as organization, prod.price, 
        DATE_FORMAT(prod.created_at, '%m/%d/%Y') as created_at, count(ip.id) as count_invoices, recurrence, show_customer_portal, plan_type")
                ->join('church_detail c', 'c.ch_id = prod.church_id', 'INNER')
                ->join('campuses cm','cm.id = prod.campus_id','left')
                ->join('invoice_products ip','prod.id = ip.product_id','left')
                ->where('c.client_id', $user_id)
                ->where('prod.trash',0)
                ->from($this->table . ' prod')
                ->group_by('prod.id');
        $this->datatables->add_column('allowRemove', '$1', 'inAllowRemove(count_invoices)');
        $this->datatables->add_column('recurrence', '$1', 'prdRecurrenceAsString(recurrence)');
        $this->datatables->add_column('show_customer_portal', '$1', 'prdShowInCustomerPortal(show_customer_portal)');
        $data = $this->datatables->generate();       
        return $data;
    }

    public function remove($id, $user_id) {
        //it does not remove, it only hides
        $product = $this->get($id, $user_id);
        if (!$product) { //if not exist product associated to user return
            return ['status' => false, 'message' => 'Product not found'];
        }

        $this->load->model('invoice_products_model');
        $invProdCount = $this->invoice_products_model->productExistInInvoices($id);
        if($invProdCount){
            return ['status' => false, 'message' => 'Product is already associated to an invoice'];
        }

        $this->db->where('id', $id) //hide product found associated to user
        ->where('client_id', $user_id)
        ->update($this->table, ['trash' => 1,'slug' => $id.date('Ymd')]);
        return ['status' => true, 'message' => 'Product removed'];
    }

    public function get($id, $user_id = null, $includeTrashed = false) {
        if($user_id) {
            $this->db->where('c.client_id', $user_id);
        }

        if($includeTrashed === false) {
            $this->db->where('prod.trash',0);
        }
        
        $this->db->where('prod.id', $id)            
            ->from($this->table. ' prod')
        ->join('church_detail c', 'c.ch_id = prod.church_id');
        return $this->db->get()->row();
    }

    public function getByDigitalContentHash($hash) {
        $this->db->where('prod.file_hash', $hash)
            ->where('prod.trash',0)
            ->from($this->table. ' prod');
        return $this->db->get()->row();
    }

    public function save($data, $client_id = false) {    
        $data['id'] = (int)$data['id'];
        $val_messages    = [];
        if(!$data['id']) {
            if (!isset($data['organization_id']) || !$data['organization_id'])
                $val_messages [] = langx('The Company field is required');
        }

        if (!isset($data['product_name']) || !$data['product_name'])
            $val_messages [] = langx('The Name field is required');

        if (empty($val_messages)) {
            $client_id = $client_id ? $client_id : $this->session->userdata('user_id');

            // ---- Validating that the user sends an organization that belongs to him
            $orgnx_ids     = getOrganizationsIds($client_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }

            if ($data['recurrence'] !== 'O' && $data['recurrence'] !== 'R' && $data['recurrence'] !== 'C') {
                throw new Exception('Invalid Recurrence');
            }

            if ($data['recurrence'] === self::RECURRENCE_PERIODICALLY && !in_array($data['billing_period'],$this->periods)) {
                throw new Exception('Invalid Billing Period');
            }

            //$data['billing_period'] = $data['recurrence'] == self::RECURRENCE_ONE_TIME ? null : $data['billing_period'];

            if ($data['recurrence'] == self::RECURRENCE_ONE_TIME) {
                $data['billing_period'] = null;
                
            } else if ($data['recurrence'] == self::RECURRENCE_CUSTOM) {
                $custom_date_arr = [];
                (float) $sum_amount         = 0;
                foreach ($data['amount'] as $i => $amount) {
                    
                    if ($amount>0){
                    $sum_amount = $sum_amount + (float) $amount;
                    $data_arr             = [
                        'date'  => $data['received-date'][$i],
                        'amount' => $amount,
                    ];
                    $custom_date_arr[] = $data_arr;
                    }
                }

                if (((float) $sum_amount !== (float) $data['price'])) {
                    throw new Exception('The sum of the payments is different from the price of the product.');
                }

                if (count($data['received-date']) > count(array_unique($data['received-date']))) {
                    throw new Exception('There are repeated payment dates');
                }

                $data_old['received-date'] = $data['received-date'];
                sort($data['received-date'], SORT_STRING);
                array_values($data_old['received-date']);

                foreach ($data['received-date']as $i => $date_recived) {
                    if ($date_recived != $data_old['received-date'][$i + 1]) {
                        throw new Exception('Dates must be consecutive');
                    }
                }

                //$data['billing_period'] = json_encode($billing_period_arr);
                //$data['billing_period'] = json_encode($billing_period_arr);
                $data['billing_period']= null;
            } else {
                $data['billing_period'] = $data['billing_period'];
            }

            // Auto-generate plan_type from product name if not provided
            if (!isset($data['plan_type']) || empty(trim($data['plan_type']))) {
                $data['plan_type'] = $this->generatePlanTypeFromName($data['product_name']);
            }

            $campus_id = isset($data['suborganization_id']) ? (int)$data['suborganization_id'] : null;

            $data['digital_content'] = null;
            if(!isset($data['digital_content']) && isset($data['digital_content_changed']) && $data['digital_content_changed'] == "1"){
                
                $errors = [];
                $allowed_types = ['application/pdf'];
                if (!in_array($_FILES['digital_content']['type'], $allowed_types)) {
                    $errors[] = 'Invalid file type. Only PDF files are allowed.';
                }

                if ($errors) {
                    return [
                        'status'  => false,
                        'message' => array_map(function ($error) {
                            return "<p>$error</p>";
                        }, $errors)
                    ];
                }

                $hashSize = 32;
                $fileNameHash = bin2hex(openssl_random_pseudo_bytes($hashSize / 2));
                $fileNameHash .= '-' . time() . '-' . uniqid(); // Add timestamp and unique ID
                $fileNameHash .= '.' . pathinfo($_FILES['digital_content']['name'], PATHINFO_EXTENSION);
                
                $this->load->library('external-storage/ExternalStorageProvider');        
                $extStorage = ExternalStorageProvider::init();                

                $this->load->helper('crypt');
                encryptFile($_FILES['digital_content']['tmp_name'], $_ENV['APP_ENCRYPTION_KEY']);
                $fileNameHash .= '.' . ENCRYPTED_FILE_EXTENSION;

                $extStorage->upload('digital_content', $fileNameHash, $_FILES['digital_content']['tmp_name']);
                
                $data['digital_content'] = $fileNameHash;                
            }

            if (!$data['id']) { // Create Product
                $save_data = [
                    'church_id'         => $data['organization_id'],
                    'campus_id'         => $campus_id ? $campus_id : null,
                    'name'              => $data['product_name'],
                    'price'             => (float) $data['price'],
                    'client_id'         => $client_id,
                    'recurrence'        => $data['recurrence'],
                    'file_hash'         => $data['digital_content'],
                    'billing_period'    => $data['recurrence'] == self::RECURRENCE_CUSTOM ? 'Custom' : $data['billing_period'],
                    'custom_date'       => $data['recurrence'] == self::RECURRENCE_CUSTOM ? json_encode($custom_date_arr) : null,
                    'start_subscription' => isset($data['start_subscription_system']) ? 'E':'D', // E = User define date, D = Default date
                    'created_at'        => date('Y-m-d H:i:s'),
                    'product_stripe_id'  =>isset($data['product_stripe_id']) ? $data['product_stripe_id'] : null,
                    'description'       => isset($data['description']) ? $data['description'] : null,
                    'show_customer_portal' => isset($data['show_customer_portal']) ? $data['show_customer_portal'] : null,
                    'plan_type'         => $data['plan_type']
                ];
                
                $save_data = $this->beforeSave($save_data);
                $this->db->insert($this->table, $save_data);
                $product_id = $this->db->insert_id();
                
                
                $hexa = strtoupper(dechex(date('ymdHi'))); //two digits year, month, hour & minute converted to hexa
                $reference = 'PR' . $hexa . '-00' .$product_id; 
                
                $this->db->where('id', $product_id)->update($this->table, ['reference' => $reference]);

                $name = $save_data['name'];

                return [
                    'status'  => true,
                    'message' => langx('Product Created'),
                    'data' => ['id' => $product_id, 'name' => $name . ' ($'. number_format($save_data['price'], 2, '.', ',') .') ' ,'product_name' => $name, 'price' => $save_data['price'], 'recurrence' => $data['recurrence'],'custom_date' => $data['recurrence'] == self::RECURRENCE_CUSTOM ? json_encode($custom_date_arr) : null]
                ];
            } else {
                $save_data = [
                    'church_id'          => $data['organization_id'],
                    'campus_id'          => $campus_id ? $campus_id : null,
                    'name'               => $data['product_name'],
                    'price'              => (float)$data['price'],
                    'recurrence'         => $data['recurrence'] ,
                    'file_hash'          => $data['digital_content'],
                    'billing_period'     => $data['billing_period'] ,
                    'plan_type'          => $data['plan_type']
                ];

                $this->db->where('id', $data['id']);
                $save_data = $this->beforeSave($save_data);
                $this->db->update($this->table, $save_data);

                return [
                    'status'  => true,
                    'message' => langx('Product Updated'),
                    'data' => ['id' => $data['id'], 'name' => $data['product_name'], ' ($'. number_format($save_data['price'], 2, '.', ',') .') ', 'price' => $save_data['price']]
                ];
            }
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors' => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }

    /**
     * Generate plan_type from product name
     */
    private function generatePlanTypeFromName($product_name)
    {
        // Convert to lowercase and replace spaces with underscores
        $plan_type = strtolower(trim($product_name));
        $plan_type = preg_replace('/\s+/', '_', $plan_type);
        
        // Remove special characters except underscores
        $plan_type = preg_replace('/[^a-z0-9_]/', '', $plan_type);
        
        // Ensure it's not empty
        if (empty($plan_type)) {
            $plan_type = 'default_plan';
        }
        
        return $plan_type;
    }

    public function update($data, $client_id = null)
    {
        if ($data['id']) {

            $client_id = $client_id ? $client_id : $this->session->userdata('user_id');

            // ---- Validating that the user sends an organization that belongs to him
            $orgnx_ids     = getOrganizationsIds($client_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            
            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }

            $save_data = [];

            //udpate sent data fields only
            $map = [
                'show_customer_portal' => ['key' => 'show_customer_portal'],
            ];

            foreach ($map as $inputKey => $options) {
                
                if (isset($data[$inputKey])) {
                    $value = $data[$inputKey];
                    $save_data[$options['key']] = $value;
                }
            }
            $save_data = $this->beforeSave($save_data);
            
            $this->db->where('id', $data['id']);
            $this->db->update($this->table, $save_data);

            return [
                'status'  => true,
                'message' => langx('Product Updated')                
            ];
        }
        throw new Exception('Bad request');
    }

    public function get_tags_list_pagination($where = null) {
        $limit  = 10; //it must coincide with the limit defined on front end
        $offset = ($this->input->post('page') ? $this->input->post('page') - 1 : 0) * $limit;

        $this->db->select("SQL_CALC_FOUND_ROWS id, name, price,recurrence,custom_date,billing_period,file_hash", false);

        $church_id = (int)$this->input->post('organization_id');
        $campus_id = (int)$this->input->post('suborganization_id');

        $this->db->where('trash',0);
        $this->db->where('church_id',$church_id);
        if($campus_id){
            $this->db->where('campus_id',$campus_id);
        } else {
            $this->db->where('campus_id is null');
        }

        if($where){
            $this->db->where($where);
        }

        if ($this->input->post('q')) {
            $this->db->group_start();
            $this->db->like("name", $this->input->post('q'));
            $this->db->group_end();
        }

        $this->db->limit($limit, $offset);

        $result = $this->db->get($this->table)->result();

        $data = [];
        foreach ($result as $row) {
            $data[] = ['id'             => $row->id, 'text'           => $row->name . ' ($' . number_format($row->price, 2, '.', ',') . ')', 'name'           => $row->name,
                'price'          => $row->price, 'recurrence'     => $row->recurrence, 'custom_date'    => $row->custom_date, 'billing_period' => $row->billing_period, 'file_hash'      => $row->file_hash];
        }

        $total_count = $this->db->query('SELECT FOUND_ROWS() cnt')->row();

        return [
            'items'       => $data,
            'total_count' => $total_count->cnt
        ];
    }
    
     
     public function getProductByStripeId($product_stripe_id) {
        
       $this->db->select('id,product_stripe_id')
                ->where('product_stripe_id', $product_stripe_id)
                ->from($this->table);
        $donor = $this->db->get()->row();
        if (isset($donor)) {
             return [
                    'id'  => $donor->id,
                    'product_stripe_id' => $donor->product_stripe_id
                ];
        } else {
            return false;
        }
    }   
    
    public function getProductquickbooksId($product_quickbooks_id) {
        $this->db->select('id,product_quickbooks_id')
                ->where('product_quickbooks_id', $product_quickbooks_id)
                ->from($this->table);
        $donor = $this->db->get()->row();
        if (isset($donor)) {
            return [
                'id'                    => $donor->id,
                'product_quickbooks_id' => $donor->product_quickbooks_id
            ];
        } else {
            return false;
        }
    }

    public function getProductsNotPushedByquickbooks() {
        $this->db->select('id,reference,church_id,product_quickbooks_id,campus_id,name,price,created_at,
                           trash,slug,client_id,recurrence,billing_period,file_hash')
                ->where('product_quickbooks_id is null')
                ->from($this->table);
        $data = $this->db->get()->result();
        return $data;
    }

    public function getupdateProductByquickbooks($data, $idproduct) {
        $this->db->where('id', $idproduct);
        $this->db->update($this->table, $data);
        return true;
    }        
    public function getProductNamequickbooks($nameproduct) {
        $this->db->select('id,reference,church_id,product_quickbooks_id,campus_id,name,price,created_at,
                           trash,slug,client_id,recurrence,billing_period,file_hash')
                ->where('product_quickbooks_id is not null')
                ->where('name',$nameproduct ,'limit 1')
                
                ->from($this->table);
        $data = $this->db->get()->row();
        return $data;
    }
    
    public function getProductid($id) {        
        $this->db->select("prod.id,prod.reference,prod.church_id,prod.product_quickbooks_id,prod.campus_id,prod.name,prod.price,prod.created_at,
                           prod.trash,prod.slug,prod.client_id,prod.recurrence,prod.billing_period,prod.file_hash,prod.custom_date,count(ip.id) as count_invoices, 
                           prod.description, prod.show_customer_portal, prod.plan_type")
                ->where('prod.id', $id)
                ->join('invoice_products ip', 'prod.id = ip.product_id', 'left')
                ->from($this->table . ' prod')
                ->group_by('prod.id');
        
        $data = $this->db->get()->row();
        
        return $data;
    }
}
