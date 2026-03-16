<?php

if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

class Paysafewebhooks extends CI_Controller {

    function __construct() {
        parent::__construct();
        display_errors();
        die;
    }

    private function output($status, $errorCode, $message) {
        http_response_code($errorCode);

        header('Content-type: application/json');
        echo json_encode([
            'status'    => $status,
            'http_code' => $errorCode,
            'message'   => $message
        ]);
    }
    
    public function paysafe_account_belongs_to_me($account_number) {        
        $this->load->model('orgnx_onboard_psf_model');
        $result = $this->orgnx_onboard_psf_model->getByAccount($account_number);        
        echo json_encode($result);
    }   
    
    private function seekPaysafeAccountAmongSystems($account_number) {
        
        $this->load->library('curl');
        
        $sysIdFound = FALSE;
        foreach(PAYSAFE_MIRRORED_SYSTEMS as $sysId => $system) {            
            $url = $system['base_url'] . 'paysafewebhooks/paysafe_account_belongs_to_me/' . $account_number;            
            $response  = $this->curl->get($url);
            $responseArr =  json_decode($response, true);
            
            if($responseArr['status']) {
                $sysIdFound = $sysId;
                break;
            }            
        }        
        return $sysIdFound;
    }
    
    public function merchant_account_status_listener($byPassSeekJustPerfomRequest = null) {
        
        $input_json = @file_get_contents('php://input');
        $input      = json_decode($input_json);

        $clientIp = get_client_ip_from_trusted_proxy();
        log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener [SYSTEM - " . BASE_URL . "] Client IP: $clientIp " . date("Y-m-d H:i:s"));
        log_custom(LOG_CUSTOM_INFO, "PAYLOAD $input_json " . date("Y-m-d H:i:s"));
        
        $accountBelongsTo = null;
        if($byPassSeekJustPerfomRequest == null && isset($input->payload->accountNumber)) { //first trigger to lunar
            $accountBelongsTo = $this->seekPaysafeAccountAmongSystems($input->payload->accountNumber);
        }
        
        //$this->sendNotificationToSystemAdmin($input_json, $clientIp);
        
        $this->db->insert('paysafe_webhooks', [
            'created_at' => date('Y-m-d H:i:s'),
            'event_json' => $input_json,
            'system'     => $byPassSeekJustPerfomRequest ? $byPassSeekJustPerfomRequest : $accountBelongsTo,
            'mode'       => isset($input->mode) ? $input->mode : 'not_included_needs_review'
        ]);
        
        if($accountBelongsTo === FALSE) {
            log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener account not found " . $input->payload->accountNumber . '' . date("Y-m-d H:i:s"));
            return;
        }
        
        if(!isset($input->payload->accountNumber)) {
            log_custom(LOG_CUSTOM_INFO, "merchant_account_status_listener account number not provided " . date("Y-m-d H:i:s"));
            return;
        }
        
        if ($accountBelongsTo == 'lunarpay' || $byPassSeekJustPerfomRequest) { //continue the same script, do not jump
            log_custom(LOG_CUSTOM_INFO, "EXCECUTION ... " . date("Y-m-d H:i:s"));
            //continue !
        } else { //jump to the found system but set the second parameter with the system for just bypassing things and proceed with the process                        
            $xurl     = PAYSAFE_MIRRORED_SYSTEMS[$accountBelongsTo]['base_url'] .
                    'paysafewebhooks/merchant_account_status_listener/' .
                    $accountBelongsTo;
            log_custom(LOG_CUSTOM_INFO, "REDIRECTING TO ... $xurl " . date("Y-m-d H:i:s"));
            $response = $this->curl->postRawJson($xurl, $input_json);
            $this->output(true, 200, json_decode($response));
            return;
        }

        if (!isset($input->mode)) {
            $this->output(false, 400, 'Bad request');
            return;
        }

        if ($input->mode == 'live') {
            $account       = $this->db->where('account_id', $input->payload->accountNumber)->get('church_onboard_paysafe')->row();
            $fieldToUpdate = 'account_status'; //credit card account

            if (!$account) { //direct debit account
                //ACH
                $account       = $this->db->where('account_id2', $input->payload->accountNumber)->get('church_onboard_paysafe')->row();
                $fieldToUpdate = 'account_status2';

                if (!$account) {
                    //EFT
                    $account = $this->db->where('account_id3', $input->payload->accountNumber)->get('church_onboard_paysafe')->row();

                    if (!$account) {
                        //SEPA
                        $account = $this->db->where('account_id4', $input->payload->accountNumber)->get('church_onboard_paysafe')->row();

                        if (!$account) {
                            //BACS
                            $account = $this->db->where('account_id5', $input->payload->accountNumber)->get('church_onboard_paysafe')->row();
                        }
                    }
                }
            }
            
            if (!$account) {
                $this->output(false, 404, 'Merchant account not found!');
                return;
            }

            if (strtolower($input->payload->acctStatus) == 'enabled') {

                //evaluate if is time to send the credentials it's when CC and DD accounts are now enabled
                //its wwhen the accStatus comes with 'enabled' value AND the field to update is != than 'enabled' but the other account is enabled, kinda tongue twister :)
                if (($fieldToUpdate == 'account_status' && strtolower($account->account_status) != 'enabled' && strtolower($account->account_status2) == 'enabled') ||
                        ($fieldToUpdate == 'account_status2' && strtolower($account->account_status2) != 'enabled' && strtolower($account->account_status) == 'enabled')) {

                    //update the merchant account then send the email, we ensure to update the status even when there is an error sending the email
                    $this->db->where('id', $account->id)->update('church_onboard_paysafe', [$fieldToUpdate => $input->payload->acctStatus]);
                    
                    $this->sendBackOfficeCredentials($account);

                    $this->output(true, 200, 'Success! | Email sent');

                    return;
                }
            }

            $this->db->where('id', $account->id)->update('church_onboard_paysafe', [$fieldToUpdate => $input->payload->acctStatus]);
            
            $this->output(true, 200, 'Success!');
            return;
        }
    }
    
    private function sendNotificationToSystemAdmin($input_json, $clientIp) { //just sending an email as notification and knowledge to an admin 
        
        if (defined('PAYSAFE_MIRRORED_SYSTEMS_I_AM_THE_MAIN_SYSTEM') && PAYSAFE_MIRRORED_SYSTEMS_I_AM_THE_MAIN_SYSTEM) {
            require_once 'application/libraries/email/EmailProvider.php';            
            EmailProvider::getInstance()->sendEmail('noreply@lunarpay.com', 'Apollo Systems', 'juan@lunarpay.io', 'paysafe webhook status received', ''
                    . 'PAYLOAD:<br>' . $input_json . '<br><br>'
                    . 'CLIENT IP:<br>'
                    . $clientIp);
        }
    }

    private function sendBackOfficeCredentials($account) {

        $this->load->library('encryption');
        $encryptPhrase = $this->config->item('pty_epicpay_encrypt_phrase');

        $this->encryption->initialize(['cipher' => 'aes-256', 'mode' => 'ctr', 'key' => $encryptPhrase]);

        $this->load->use_theme();

        $message = $this->load->view('email/backoffice_credentials_psf_accounts_enabled', [
            'merchant_name'  => $account->merchant_name,
            'username'       => $account->backoffice_username,
            'password'       => $this->encryption->decrypt($account->backoffice_hash),
            'backoffice_url' => PAYSAFE_NETBANX_URL
                ], TRUE);

        $from = $this->config->item('admin_email', 'ion_auth');
        $to   = $account->backoffice_email;

        $subject = PAYSAFE_NETBANX_EMAIL_SUBJECT_MERCHANT_ACCOUNTS_ENABLED;

        require_once 'application/libraries/email/EmailProvider.php';        
        EmailProvider::getInstance()->sendEmail($from, COMPANY_NAME, $to, $subject, $message);
    }

}
