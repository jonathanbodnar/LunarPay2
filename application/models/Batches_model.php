<?php

defined('BASEPATH') OR exit('No direct script access allowed');

function batchesDtTagsFormat($list, $delimiter) {

    if ($list) {
        $htmlList = '';
        $arrList  = explode($delimiter, $list);

        foreach ($arrList as $tag) {
            $htmlList .= '<span class="badge badge-primary bk-badge">' . $tag . '</span>';
        }

        return $htmlList;
    }

    return null;
}

function batchesDtStatusFormat($status) {
    if ($status == 'U') {
        $formattedString = '<span class="badge badge-secondary">Uncommitted</span>';
    } else {
        $formattedString = '<span class="badge badge-default">Committed</span>';
    }

    return $formattedString;
}

class Batches_model extends CI_Model {

    private $table     = 'batches';
    public $valAsArray = false; //for getting validation errors as array or a string, false = string

    public function __construct() {
        parent::__construct();
    }

    public function getDt() {
        $this->load->library("Datatables");
        $user_id   = $this->session->userdata('user_id');
        $orngx_ids = getOrganizationsIds($user_id);
        
        if ($this->input->post('suborganization_id')) {
            $this->datatables->where('b.campus_id', $this->input->post('suborganization_id'));
        } else {
            $this->datatables->where('b.campus_id IS NULL');
        }
        
        if($this->input->post('tags_filter')) {
            $this->datatables->where_in('bt.tag_id', $this->input->post('tags_filter'));
        }

        $this->datatables->select('b.id, b.name, b.church_id, b.campus_id, '
                        . 'GROUP_CONCAT(t.name ORDER BY bt.tag_id ASC SEPARATOR "_#SEP###TOR#_") as tags, '
                        . 'status, ch.church_name as church_name, ca.name as campus_name, '
                        . 'DATE_FORMAT(b.created_at, "%m/%d/%Y") as created_at')
                ->join('batch_tags bt', 'bt.batch_id = b.id', 'LEFT')
                ->join('tags t', 't.id = bt.tag_id', 'LEFT')
                ->join('church_detail as ch', 'ch.ch_id = b.church_id', 'LEFT')
                ->join('campuses as ca', 'ca.id = b.campus_id', 'LEFT')
                ->where('b.church_id', $this->input->post('organization_id'))
                ->where_in('b.church_id', explode(',', $orngx_ids)) //access to data that belong to the user only
                ->group_by('b.id')
                ->add_column('tags', '$1', 'batchesDtTagsFormat(tags, "_#SEP###TOR#_")') //a "Complex" delimiter for exploding tags
                ->add_column('status_formatted', '$1', 'batchesDtStatusFormat(status)') //a "Complex" delimiter for exploding tags
                ->from($this->table . ' b');

        $data = $this->datatables->generate();
        return $data;
    }

    public function beforeSave($data) {
        $data['batch_name']         = ucwords(strtolower(trimLR_Duplicates($data['batch_name'])));
        $data['suborganization_id'] = isset($data['suborganization_id']) && $data['suborganization_id'] ? $data['suborganization_id'] : null;
        $data['batch_tags']         = isset($data['batch_tags']) && $data['batch_tags'] ? $data['batch_tags'] : [];

        return $data;
    }

    public function get($batch_id, $user_id = false) {
        $user_id = $user_id ? $user_id : $this->session->userdata('user_id');

        $orgnx_ids = getOrganizationsIds($user_id);
        $batch     = $this->db->where('id', $batch_id)
                        ->where_in('church_id', explode(',', $orgnx_ids))
                        ->get($this->table)->row();

        $this->load->model('batch_tags_model');

        if ($batch) {
            $batchTags         = $this->batch_tags_model->getByBatch($batch_id);
            $batchTagsElements = [];
            foreach ($batchTags as $tag) {
                $batchTagsElements [] = $tag;
            }
            $batch->tags = [
                'elements' => $batchTagsElements,
            ];
        }

        return $batch;
    }

    public function create($data, $user_id = false) {

        $data = $this->beforeSave($data);

        $val_messages    = [];
        if (!isset($data['organization_id']) || !$data['organization_id'])
            $val_messages [] = langx('The Company field is required');

        if (!isset($data['batch_name']) || !$data['batch_name'])
            $val_messages [] = langx('The batch_name field is required');

        if (empty($val_messages)) {

            // ---- Validating that the user sends an organization that belongs to him            
            $orgnx_ids     = getOrganizationsIds($user_id ? $user_id : $this->session->userdata('user_id'));
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($data['organization_id'], $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }
            // ----

            $this->db->trans_start();

            $save_data = [
                'name'       => $data['batch_name'],
                'church_id'  => $data['organization_id'],
                'campus_id'  => $data['suborganization_id'],
                'created_at' => date('Y-m-d H:i:s')
            ];

            $this->db->insert($this->table, $save_data);
            $batchId = $this->db->insert_id();

            $this->load->model('tags_model');
            $scope    = 'B'; //Batches
            $tagsResp = $this->tags_model->create($data['batch_tags'], $scope, $batchId);

            $this->load->model('batch_tags_model');
            $this->batch_tags_model->reset($tagsResp['tag_ids'], $batchId);

            $this->db->trans_complete();
            if ($this->db->trans_status() === FALSE) {
                throw new Exception('Database transaction error');
            }

            return [
                'status'  => true,
                'message' => langx('Batch created')
            ];
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors'  => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }

    //$data holds id, batch_name
    public function update($data, $user_id = false) {

        $data = $this->beforeSave($data);

        $val_messages = [];

        if (!isset($data['batch_name']) || !$data['batch_name'])
            $val_messages [] = langx('The batch_name field is required');

        if (empty($val_messages)) {

            $this->db->trans_start();

            $batchId = $data['id'];

            $batchDb = $this->get($batchId, $user_id);
            if (!$batchDb) {
                throw new Exception('Invalid request');
            }

            $user_id = $user_id ? $user_id : $this->session->userdata('user_id');

            // ---- Validating that the user sends an id that belongs to the user
            $orgnx_ids     = getOrganizationsIds($user_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($batchDb->church_id, $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }
            // ----

            $save_data = ['name' => $data['batch_name']];

            $this->db->where('id', $batchId)->update($this->table, $save_data);

            $this->load->model('tags_model');
            $scope = 'B'; //Batches

            $tagsResp = $this->tags_model->create($data['batch_tags'], $scope, $batchId);

            $this->load->model('batch_tags_model');
            $this->batch_tags_model->reset($tagsResp['tag_ids'], $batchId);

            $this->tags_model->removeUnusedTags($scope); //clean up

            $this->db->trans_complete();
            if ($this->db->trans_status() === FALSE) {
                throw new Exception('Database transaction error');
            }

            return [
                'status'  => true,
                'message' => langx('Batch updated')
            ];
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors'  => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }

    public function createTransactions($data, $batch_id, $user_id = false) {

        $user_id ? $user_id : $this->session->userdata('user_id');

        $batchDb = $this->get($batch_id);
       
        if (!$batchDb) {
            throw new Exception('Invalid batch');
        }

        $totalDonations = 0;
        if (isset($data['amount'])) {
            $totalDonations = count($data['amount']); //count total of elements inside the amount array, thats the number of total donations
        } else {
            throw new Exception('Invalid batch data, you must provide at least one donation');
        }

        $errorFound = false;

        $this->load->model('donation_model');
        $this->db->trans_start(); //important, if at some point there is an error (exception or validation) $this->db->trans_complete(); wont be executed queries won't be executed 

        $donationNumber = 0;
        foreach ($data['amount'] as $i => $amount) { //we use $data['amount'] array as reference for getting ids and quering the other fields
            
            $donationNumber ++;

            $save_transaction = [
                'amount'             => $amount, //or $data['amount'][$i] works too
                'method'             => isset($data['method'][$i]) ? $data['method'][$i] : null, //not set, in the next level of model (donation_model) validation messages will be triggered
                'fund_id'            => isset($data['fund'][$i]) ? $data['fund'][$i] : null,
                'account_donor_id'   => isset($data['donor'][$i]) ? $data['donor'][$i] : null,
                'date'               => isset($data['date'][$i]) ? $data['date'][$i] : null,
                'operation'          => 'DN', //manual donation
                'organization_id'    => $batchDb->church_id,
                'suborganization_id' => $batchDb->campus_id,
                'batch_id'           => $batch_id,
                'status'             => 'N', //as the batch at this point is not committed then the new transactions are not commited either (batch_committed remains null and status = 'N'
            ];

            $result = $this->donation_model->save_transaction($save_transaction, $user_id);

            if ($result['status'] == false) {
                $result['error_row'] = langx('We found an error attempting to process Donation ' . $donationNumber);
                $errorFound          = true;
                break;
            }
        }

        if ($errorFound) {
            return $result;
        }

        $this->db->trans_complete();

        if ($this->db->trans_status() === FALSE) {
            throw new Exception('Database transaction error');
        }

        return [
            'status'  => true,
            'message' => langx('Batch Donations Created')
        ];
    }
    
    //$data holds id, batch_name
    public function commit($data, $user_id = false) {

        $val_messages = [];

        if (empty($val_messages)) {

            if (!isset($data['id']) || !$data['id']) {
                throw new Exception('Batch id is required');
            }

            $batchId = $data['id'];

            $batchDb = $this->get($batchId, $user_id);
            if (!$batchDb) {
                throw new Exception('Invalid request');
            }

            $user_id = $user_id ? $user_id : $this->session->userdata('user_id');

            // ---- Validating that the user sends an id that belongs to the user
            $orgnx_ids     = getOrganizationsIds($user_id);
            $orgnx_ids_arr = $orgnx_ids ? explode(',', $orgnx_ids) : [];
            if (!in_array($batchDb->church_id, $orgnx_ids_arr)) {
                throw new Exception('Invalid organization');
            }
            // ----

            $this->db->trans_start(); //check if we are putting this line okay in the other methods
            
            $this->db->where('id', $batchId)->update($this->table, ['status' => 'C', 'committed_at' => date('Y-m-d H:i:s')]);
            
            $cmtResult = $this->commitTransactions($batchId);
            if(!$cmtResult['status']) {
                return $cmtResult;
            }

            $this->db->trans_complete();
            if ($this->db->trans_status() === FALSE) {
                throw new Exception('Database transaction error');
            }

            return [
                'status'  => true,
                'message' => langx('Batch Committed')
            ];
        }

        return [
            'status'  => false,
            'message' => langx('Validation error found'),
            'errors'  => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
        ];
    }
    
    //batchId must come clean and validated
    private function commitTransactions($batchId) {
        
        $this->db->where('batch_id', $batchId)->update('epicpay_customer_transactions', ['status' => 'P']);
        
        $this->load->model('donor_model');
        
        //get transactions for getting the account_donor & amount for updating donor accumulator
        $batchTrxn = $this->db->where('batch_id', $batchId)->get('epicpay_customer_transactions')->result();
        
        if(!$batchTrxn) {
            $val_messages [] = langx('No donations found to be committed');
            return [
                'status'  => false,
                'message' => langx('Validation error found'),
                'errors'  => !$this->valAsArray ? stringifyFormatErrors($val_messages) : $val_messages
            ];
        }
        
        foreach($batchTrxn as $trxn) {
            if($trxn->account_donor_id) {
                $donationAcumData = ['id' => $trxn->account_donor_id, 'amount_acum' => $trxn->total_amount, 'fee_acum' => 0, 'net_acum' => $trxn->total_amount];
                $this->donor_model->updateDonationAcum($donationAcumData); //add money to the donor accumulator
            }
            
        }
        
        return ['status' => true];
    }
    
    public function getBatchDonationsDt($user_id = null) {
        //Getting Organization Ids
        $user_id = $user_id ? $user_id : $this->session->userdata('user_id');

        $organizations_ids = getOrganizationsIds($user_id);

        $batch_id = (int) $this->input->post('batch_id');

        $this->load->library("Datatables");
        $this->datatables->select("tr.id, ROUND(sum(tf.amount), 2) as amount, ROUND(sum(tf.fee), 2) as fee, sum(tf.net) as net,
                DATE_FORMAT(tr.created_at,'%m/%d/%Y') created_at_formatted, tr.created_at, CONCAT_WS(' ',tr.first_name, tr.last_name) as name ,tr.email, tr.giving_source,
                tr.status, tr.transaction_detail,
                GROUP_CONCAT(f.name SEPARATOR ', ') as fund
                    ")
                ->from('epicpay_customer_transactions' . ' as tr')
                ->join('account_donor as ad', 'ad.id = tr.account_donor_id', 'left')
                ->join('transactions_funds as tf', 'tf.transaction_id = tr.id', 'left')
                ->join('funds as f', 'f.id = tf.fund_id', 'left')
                ->group_by('tr.id')
                ->where("batch_id", $batch_id);

        //Organizations of User Filter
        $this->datatables->where('tr.church_id in (' . $organizations_ids . ')');

        $data = $this->datatables->generate();

        return $data;
    }

}
