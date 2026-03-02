<?php

defined('BASEPATH') or exit('No direct script access allowed');

class Donation_customer_model extends CI_Model
{

    private $table = 'epicpay_customer_transactions';

    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    public function __construct()
    {
        parent::__construct();
    }

    //we expect customerId safe
    public function getPayments($customerId, $pagination)
    {
        $this->load->model('donation_model');

        // Get paginated data
        $result = $this->db->select("tr.id, ROUND(sum(tf.amount), 2) as amount, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as net,
                tr.created_at, CONCAT_WS(' ',tr.first_name, tr.last_name) as name ,tr.email, tr.giving_source,
                (case when tr.src = 'CC' then 'Card' when tr.src = 'BNK' then 'Bank' else tr.src end) as method, 
                (case WHEN tr.manual_trx_type = 'DE' THEN 'Deposit' WHEN tr.manual_trx_type = 'DN' THEN 'Manual' WHEN tr.manual_trx_type = 'WD' THEN 'Withdraw' ELSE tr.manual_trx_type end) as manual_trx_type,
                tr.status, tr.transaction_detail,tr.customer_subscription_id as subscription, tr.status_ach, tr.src, GROUP_CONCAT(f.name SEPARATOR ', ') as fund, 
                sub.created_at subcreated_at, sub.start_on substart_on, sub.frequency subfrequency, sub.status substatus, 
                tr.trx_ret_id, tr.trx_retorigin_id, tr.manual_failed, tr.is_fee_covered,
                (CASE WHEN tr.trx_type = 'DO' THEN 'Donation' WHEN tr.trx_type = 'RE' AND tr.manual_failed = 1 THEN 'Recovered' WHEN tr.trx_type = 'RE' THEN 'Refunded' END) as trx_type, 
                epicpay_transaction_id, tr.fts_status_id,
                CONCAT_WS('', '" . BASE_URL_FILES . "files/get/payment_receipts/', tr.receipt_file_uri_hash) as _receipt_file_url
                ")
            ->join('account_donor as ad', 'ad.id = tr.account_donor_id', 'left')
            ->join('transactions_funds as tf', 'tf.transaction_id = tr.id', 'left')
            ->join('funds as f', 'f.id = tf.fund_id', 'left')
            ->join('epicpay_customer_subscriptions as sub', 'sub.id = tr.customer_subscription_id', 'left')

            ->where('`tr`.`account_donor_id` ', $customerId)
            ->where("(tr.status = 'P' OR tr.status_ach = 'N') ", null, false)
            ->group_by('tr.id')
            ->order_by('tr.id', 'desc')
            ->limit($pagination['limit'], ($pagination['page'] - 1) * $pagination['limit'])
            ->get($this->table . ' as tr')
            ->result();

        // Add status label
        foreach ($result as $key => $value) {
            $result[$key]->_fts_status_label = labelFtsStatus($value->fts_status_id);
        }

        // Get total count
        $total = $this->db
            ->select('COUNT(DISTINCT tr.id) as count')
            ->join('account_donor as ad', 'ad.id = tr.account_donor_id', 'left')
            ->join('transactions_funds as tf', 'tf.transaction_id = tr.id', 'left')
            ->join('funds as f', 'f.id = tf.fund_id', 'left')
            ->join('epicpay_customer_subscriptions as sub', 'sub.id = tr.customer_subscription_id', 'left')
            ->where('`tr`.`account_donor_id`', $customerId)
            ->where("(tr.status = 'P' OR tr.status_ach = 'N')", null, false) //verifyx review this
            ->get($this->table . ' as tr')
            ->row()
            ->count;

        return [
            'payments' => $result,
            'total' => intval($total),
        ];
    }

    //we expect customerId safe
    public function getPaymentsWithProduct($customerId)
    {
        $this->load->model('donation_model');
        
        //CONCAT_WS("", "' . BASE_URL_FILES . 'files/get/digital_content/", p.file_hash) as digital_content_url, p.file_hash as digital_content, p.billing_period, p.recurrence,p.custom_date,p.start_subscription');

        // Get paginated data
        $result = $this->db->select("
                    tr.id, 
                    tf.amount, 
                    tf.fee, 
                    tf.net,
                    tr.created_at, 
                    tr.invoice_id, 
                    tr.payment_link_id,
                    tf.amount, tf.fee, tf.net,
                    plpp.payment_link_products,
                    ip.invoice_products
                ")

            ->join("(SELECT transaction_id, 
                    ROUND(SUM(amount), 2) AS amount, 
                    ROUND(SUM(fee), 2) AS fee, 
                    ROUND(SUM(net), 2) AS net
                    FROM transactions_funds
                    GROUP BY transaction_id) as tf", "tf.transaction_id = tr.id", "left")
            
            ->join("(SELECT transaction_id, 
                    CONCAT('[', GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', plppi.id,
                            'product_name', plppi.product_name, 
                            'quantity', plppi.qty_req, 
                            'price', plppi.product_price,
                            'digital_content_url', IF(p.file_hash IS NOT NULL, CONCAT_WS('', '" . BASE_URL_FILES . "files/get/digital_content/', p.file_hash, '?v=', UNIX_TIMESTAMP()), NULL)
                        )
                    ), ']') as payment_link_products
                    
                    FROM payment_link_products_paid plppi
                    LEFT JOIN products p ON p.id = plppi.product_id
                    
                    GROUP BY transaction_id) as plpp", "plpp.transaction_id = tr.id", "left")
    
            
            ->join("(SELECT invoice_id, 
                    CONCAT('[', GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', ipi.id,
                            'product_name', ipi.product_name, 
                            'quantity', ipi.quantity, 
                            'price', ipi.price,
                            'digital_content_url', IF(p.file_hash IS NOT NULL, CONCAT_WS('', '" . BASE_URL_FILES . "files/get/digital_content/', p.file_hash, '?v=', UNIX_TIMESTAMP()), NULL)
                        )
                    ), ']') as invoice_products
                    FROM invoice_products ipi
                    LEFT JOIN products p ON p.id = ipi.product_id
                    GROUP BY invoice_id) as ip", "ip.invoice_id = tr.invoice_id", "left")

            ->where('`tr`.`account_donor_id` ', $customerId)
            ->where('`tr`.`customer_subscription_id` ', null)
            ->where("(tr.status = 'P' OR tr.status_ach = 'Y') ", null, false) //verifyx review this
            ->group_by('tr.id')
            ->order_by('tr.id', 'desc')
            ->get($this->table . ' as tr')
            ->result();

          // loop result  and make invoice_products and payment_link_products array
          foreach ($result as $key => $value) {
            $result[$key]->invoice_products = json_decode($value->invoice_products);
            $result[$key]->payment_link_products = json_decode($value->payment_link_products);
          }  

        return $result;
    }
}
