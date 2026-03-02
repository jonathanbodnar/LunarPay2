<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Planningcenter extends My_Controller {

    private $access_token  = null;
    private $curr_batch_id = null;
    private $curr_src_id   = null;
    private $main_orgnx_id = null;
    private $summary       = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            die;
        }

        $this->load->model('user_model');
        $this->load->model('organization_model');
        $this->load->model('donation_model');
        $this->load->model('transaction_fund_model');

        $this->load->helper('planncenter');

        set_time_limit(0);
        ini_set('max_execution_time', 0);
    }

//======== redirect endpoint
    public function oauthcomplete() {

        if ($this->input->get('code')) {
            $data = [
                'grant_type'    => 'authorization_code',
                'code'          => $this->input->get('code'),
                'client_id'     => PLANNINGCENTER_CLIENT_ID,
                'client_secret' => PLANNINGCENTER_SECRET,
                'redirect_uri'  => PLANNINGCENTER_REDIRECT_URL
            ];

            $result = simpleCurl(PLANNINGCENTER_TOKEN_URL, 'post', $data);

            if ($result['error'] == 0 && isset($result['response']->access_token)) {
                $save_data = ['planning_center_oauth' => json_encode($result['response'])];
                $this->user_model->update($save_data, $this->session->userdata('user_id'));
            }

            redirect('settings/integrations/pcenter');
        }
    }

    public function validatetoken() {

        $client_id = PLANNINGCENTER_CLIENT_ID;
        $redirect  = BASE_URL . 'integrations/planningcenter/oauthcomplete';

        $conn_data = $this->getConnData();
        $response  = $this->refreshOauthToken($conn_data);

        $response = [
            'oauth_url'   => 'https://api.planningcenteronline.com/oauth/authorize?client_id=' . $client_id
            . '&redirect_uri=' . $redirect . '&response_type=code&scope=people giving',
            'conn_status' => $response['status'], //===== true/false
            'message'     => isset($response['message']) ? $response['message'] : ''
        ];

        output_json($response);
    }

    private function getConnData() {
        $user_id = $this->session->userdata('user_id');
        return $this->user_model->get($user_id, 'id, planning_center_oauth')->planning_center_oauth;
    }

    public function disconnect() {
        $save_data['planning_center_oauth'] = null;
        $this->user_model->update($save_data, $this->session->userdata('user_id'));
        return output_json(['status' => true, 'message' => 'Logout!']);
    }

    private function refreshOauthToken($conn_data = false) {
        if (!$conn_data) {
            $conn_data = $this->getConnData();
        }

        if (!$conn_data) {
            return ['status' => false, 'message' => 'No connection data found'];
        }

        $conn_data     = json_decode($conn_data);
        $refresh_token = $conn_data->refresh_token;

        $url       = 'https://api.planningcenteronline.com/oauth/token';
        $post_data = json_encode([
            'client_id'     => PLANNINGCENTER_CLIENT_ID,
            'client_secret' => PLANNINGCENTER_SECRET,
            'refresh_token' => $refresh_token,
            'grant_type'    => 'refresh_token'
        ]);

        $result = simpleCurl($url, 'post', $post_data, true); //=== json true

        if ($result['error'] == 0 && isset($result['response']->error)) {
            return ['status' => false, 'message' => $result['response']->error_description];
        } elseif ($result['error'] == 1) {
            return ['status' => false, 'message' => $result['response']];
        }

        $save_data = ['planning_center_oauth' => json_encode($result['response'])];
        $this->user_model->update($save_data, $this->session->userdata('user_id'));

        $this->access_token = $result['response']->access_token;

        return ['status' => true, 'Token refreshed'];
    }

    //===== we set the main orgnx for creating clean funds only for the main one, when pushing no main organization or campuses, fund names need to be unique
    //===== so we add the id amd suborg as a postfix
    private function setMainOrgnx() {
        $main_orgnx = $this->organization_model->getMain(false, $this->session->userdata('user_id'));

        if (!$main_orgnx) {
            return ['status' => false];
        }

        $this->main_orgnx_id = $main_orgnx->ch_id;

        return ['status' => true];
    }

    public function startpush() {

        $response = $this->setMainOrgnx();
        if ($response['status'] == false) {
            output_json(['status' => false, 'No organizations found']);
            return;
        }

        $people_data = $this->donation_model->getEmailsToPlanningCenter();
        if (!$people_data) {
            output_json(['status' => false, 'message' => 'No donations found']);
            return;
        }

        $commit_batch = $this->input->post('commit') === '1' ? true : false;

        $result = $this->refreshOauthToken();
        if ($result['status'] == false) {
            output_json($result);
            return;
        }

        $response = $this->setSource();
        if ($response['status'] == false) {
            output_json($response);
            return;
        }

        $response = $this->createBatch(); //==== creates and sets the current batch
        if ($response['status'] == false) {
            output_json($response);
            return;
        }

        $people_data = $this->setPeopleToBeCreated($people_data);

        $this->createPeopleAndDonations($people_data);

        if ($commit_batch) {
            $this->commitBatch();
        }

        if (isset($this->summary['funds'])) {
            $funds           = $this->summary['funds'] . ' Funds created';
            unset($this->summary['funds']);
            $this->summary[] = $funds;
        } else {
            unset($this->summary['funds']);
        }

        if (isset($this->summary['donations'])) {
            $donations       = $this->summary['donations'] . ' Donations created';
            unset($this->summary['donations']);
            $this->summary[] = $donations;
        } else {
            unset($this->summary['donations']);
        }

        if (isset($this->summary['fee_adjust']) && $this->summary['fee_adjust'] > 0) {
            $fee_adjust      = $this->summary['fee_adjust'] . ' Fee adjustments created';
            unset($this->summary['fee_adjust']);
            $this->summary[] = $fee_adjust;
        } else {
            unset($this->summary['fee_adjust']);
        }

        output_json(['status' => true, 'message' => 'Push process finished', 'summary' => $this->summary]);
    }

    //===== required for pushing donations, creates if does not exist and sets it for the current script progress
    private function setSource() {
        $url_get = 'https://api.planningcenteronline.com/giving/v2/payment_sources';

        $result = bearerCurl($this->access_token, $url_get, 'get', null);
        $hResp  = handleResponse($result);

        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            return $this->setSource();
        }

        if (isset($result['response']->data) && count($result['response']->data)) {
            foreach ($result['response']->data as $source) {
                if ($source->attributes->name == 'chatgive-source') {
                    $this->curr_src_id = $source->id;
                    return ['status' => true];
                }
            }
        }

        return $this->createSource();
    }

    private function createSource() {
        $body = [
            'data' => [
                'type'          => 'PaymentSource',
                'attributes'    => ['name' => 'chatgive-source'],
                'relationships' => []
            ]
        ];

        $url_post = 'https://api.planningcenteronline.com/giving/v2/payment_sources';
        $enc_body = json_encode($body, JSON_FORCE_OBJECT);

        $result = bearerCurl($this->access_token, $url_post, 'post', $enc_body);
        $hResp  = handleResponse($result);

        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            return $this->createSource();
        }

        $this->curr_src_id = $result['response']->data->id;

        $this->summary[] = 'Chat-give Source created';

        return ['status' => true];
    }

    private function createBatch() { //==== creates and sets the batch
        $url = 'https://api.planningcenteronline.com/giving/v2/batches';

        $batch_name = 'chatgive-' . date('mdY.His');
        $body       = [
            'data' => [
                'type'       => 'Batch',
                'attributes' => [
                    'description' => $batch_name,
                ]
            ]
        ];

        $enc_body = json_encode($body, JSON_FORCE_OBJECT);
        $result   = bearerCurl($this->access_token, $url, 'post', $enc_body);
        $hResp    = handleResponse($result);
        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            $this->createBatch();
        }

        $this->curr_batch_id = $result['response']->data->id;
        $this->summary[]     = ucfirst($batch_name) . ' Batch created';

        return ['status' => true];
    }

    private function setPeopleToBeCreated($people_data) {//=========sets emails/people to be pushed        
        $success_count = 0;
        $i             = 0;
        while ($i < count($people_data)) {
            $people = $people_data[$i];
            $url    = 'https://api.planningcenteronline.com/people/v2/people?where[search_name_or_email]=' . $people->email;

            $result = bearerCurl($this->access_token, $url, 'get');

            $hResp = handleResponse($result);
            if ($hResp['status'] == false) {
                $i++;
                continue;
            }

            if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
                continue;
            }

            if (isset($result['response']->data) && count($result['response']->data) == 0) {
                $people->create        = 1;
                $people->_pc_people_id = null;
            } else {
                $people->create        = 0;
                $people->_pc_people_id = $result['response']->data[0]->id;
            }
            $success_count ++;
            $i ++;
        }

        return $people_data;
    }

    private function createPeopleAndDonations($people_data) {

        $i       = 0;
        $created = 0;

        while ($i < count($people_data)) {
            $people           = $people_data[$i];
            $people_donations = $this->donation_model->getDonationsToPlanningCenter($people->email);

            if ($people->create) {
                $url  = 'https://api.planningcenteronline.com/people/v2/people';
                $body = [
                    'data' => [
                        "type"       => "Person",
                        "attributes" => [
                            "first_name" => $people->first_name,
                            "last_name"  => $people->last_name,
                        ]
                    ]
                ];

                $enc_body = json_encode($body, JSON_FORCE_OBJECT);
                $result   = bearerCurl($this->access_token, $url, 'post', $enc_body);

                $hResp = handleResponse($result);
                if ($hResp['status'] == false) {
                    $i++;
                    continue;
                }

                if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
                    continue;
                }

                $created ++;

                $pc_people_id = $result['response']->data->id;

                $this->createEmail($pc_people_id, $people->email);
            } else {
                $pc_people_id = $people->_pc_people_id;
            }

            $this->pushDonations($pc_people_id, $people_donations);

            $i++;
        }

        if ($created) {
            $this->summary[] = $created . ' People created';
        }
    }

    private function createEmail($pc_people_id, $email) {
        $url  = 'https://api.planningcenteronline.com/people/v2/people/' . $pc_people_id . '/emails';
        $body = [
            "data" => [
                "type"       => "Email",
                "attributes" => [
                    "address"  => $email,
                    "location" => "US",
                    "primary"  => true,
                ]
            ]
        ];

        //create email and assign it to the created person
        $enc_body = json_encode($body, JSON_FORCE_OBJECT);
        $result   = bearerCurl($this->access_token, $url, 'post', $enc_body);

        $hResp = handleResponse($result);
        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            $this->createEmail($pc_people_id, $email);
        }

        // ==== no return
    }

    private function pushDonations($pc_people_id, $people_donations) {

        //========= we should not allow the script to run for more than one hour
        //========= we should ask the client to continue pushing in a new one session
        //========= so we can remove this line and stop the script after one hour
        $this->refreshOauthToken();

        $i          = 0;
        $created    = 0;
        $fee_adjust = 0;
        while ($i < count($people_donations)) {

            $donation = $people_donations[$i];

            $fundResp   = $this->setFund($donation); //==== creates and sets the batch
            $method     = $donation->src == 'CC' ? 'card' : ($donation->src == 'BNK' ? 'ach' : 'cash');
            $created_at = $donation->created_at;

            if ($fundResp['status'] == false) {
                $i++;
                continue;
            }

            $is_refunded = false;
            if ($donation->trx_ret_id) { //===== is a return, send the fee only
                $fee         = $donation->fee + 0.01;
                $amount      = 0.01;
                $is_refunded = true;
            } else {
                $fee    = $donation->fee;
                $amount = $donation->amount;
            }

            $url      = 'https://api.planningcenteronline.com/giving/v2/batches/' . $this->curr_batch_id . '/donations';
            $enc_body = '{
  "data": {
    "type": "Donation",
    "attributes": {
      "payment_method": "' . $method . '",
      "received_at": "' . $created_at . '",
      "fee_cents": ' . -$fee * 100 . '
    },
    "relationships": {
      "person": {
        "data": { "type": "Person", "id": "' . $pc_people_id . '" }
      },
      "payment_source": {
        "data": { "type": "PaymentSource", "id": "' . $this->curr_src_id . '" }
      }
    }
  },
  "included": [
    {
      "type": "Designation",
      "attributes": { "amount_cents": ' . $amount * 100 . ' },
      "relationships": {
        "fund": {
          "data": { "type": "Fund", "id": "' . $fundResp['fund_id'] . '" }
        }
      }
    }
  ]
}';

            $result = bearerCurl($this->access_token, $url, 'post', $enc_body);
            $hResp  = handleResponse($result);

            if ($hResp['status'] == false) {
                $i++;
                continue;
            }

            if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
                continue;
            }

            $trx_fund_upd = ['id' => $donation->trx_fund_id, 'plcenter_last_update' => date('Y-m-d H:i:s'), 'plcenter_pushed' => 'Y'];
            $this->transaction_fund_model->update($trx_fund_upd);

            if ($is_refunded) {
                $fee_adjust++;
            } else {
                $created++;
            }

            $i++;
        }

        if (!isset($this->summary['donations'])) {
            $this->summary['donations'] = $created;
        } else {
            $this->summary['donations'] += $created;
        }

        if (!isset($this->summary['fee_adjust'])) {
            $this->summary['fee_adjust'] = $fee_adjust;
        } else {
            $this->summary['fee_adjust'] += $fee_adjust;
        }
    }

    private function setupFundName($donation) {
        if ($donation->church_id == $this->main_orgnx_id && $donation->campus_id == null) {
            $fund_name = $donation->fund_name;
        } else {
            if ($donation->campus_id) {
                $fund_name = $donation->fund_name . '_sorg_' . $donation->campus_id;
            } else {
                $fund_name = $donation->fund_name . '_org_' . $donation->church_id;
            }
        }
        return $fund_name;
    }

    private function setFund($donation) { //==== creates and sets the fund
        $fund_name = $this->setupFundName($donation);

        $url_get = 'https://api.planningcenteronline.com/giving/v2/funds?where[name]=' . $fund_name;

        $result = bearerCurl($this->access_token, $url_get, 'get', null);
        $hResp  = handleResponse($result);

        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            return $this->setFund($donation);
        }

        if (isset($result['response']->data) && count($result['response']->data)) {
            foreach ($result['response']->data as $pl_fund) {
                if (strtolower($pl_fund->attributes->name) == strtolower($fund_name)) {
                    return ['status' => true, 'fund_id' => $pl_fund->id];
                }
            }
        }

        return $this->createFund($donation);
    }

    private function createFund($donation) {

        $fund_name = $this->setupFundName($donation);

        $url_post = 'https://api.planningcenteronline.com/giving/v2/funds';
        $body     = [
            'data' => [
                'type'       => 'Fund',
                'attributes' => [
                    'name' => $fund_name
                ]
            ]
        ];

        $enc_body = json_encode($body, JSON_FORCE_OBJECT);
        $result   = bearerCurl($this->access_token, $url_post, 'post', $enc_body);
        $hResp    = handleResponse($result);

        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            return $this->createFund($donation);
        }

        if (!isset($this->summary['funds'])) {
            $this->summary['funds'] = 1;
        } else {
            $this->summary['funds'] ++;
        }

        return ['status' => true, 'fund_id' => $result['response']->data->id];
    }

    private function commitBatch() {
        $url_post = 'https://api.planningcenteronline.com/giving/v2/batches/' . $this->curr_batch_id . '/commit';

        $enc_body = null;
        $result   = bearerCurl($this->access_token, $url_post, 'post', $enc_body);
        $hResp    = handleResponse($result);

        if ($hResp['status'] == false) {
            return $hResp;
        }

        if ($hResp['status'] == true && $hResp['replay'] == true) { //Wait done on handle response
            return $this->commitBatch();
        }

        return ['status' => true];
    }

    //======= WARNING | DELETE PEOPLE | KEEP IT DISABLED | FOR TESTING PUROPOSES AND CLEAN UP
    public function delete($stop = false) {
        die;
        $this->validatetoken();

        $url = 'https://api.planningcenteronline.com/people/v2/people?per_page=100';

        $result = bearerCurl($this->access_token, $url, 'get', null);

        foreach ($result['response']->data as $i => $row) {
            if ($row->attributes->accounting_administrator || $row->attributes->first_name == 'Jonathan') {
                
            } else {
                $url_del = 'https://api.planningcenteronline.com/people/v2/people/' . $row->id;
                $result  = bearerCurl($this->access_token, $url_del, 'delete', null);
                echo d($url_del . " $i " . json_encode($result), false);
            }
        }

        if ($stop) {
            die;
        }
        $this->delete(true);
    }

    //======= WARNING | DELETE PEOPLE | KEEP IT DISABLED | FOR TESTING PUROPOSES AND CLEAN UP
    public function adjust() {
        die;
        $trxs = $this->db->query("select * from epicpay_customer_transactions")->result();
        foreach ($trxs as $trx) {
            $this->db->where('id', $trx->id)->update('epicpay_customer_transactions', ['email' => 'testloc@devchatgive' . $trx->id . '.com']);
        }
    }

}
