<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

require 'application/vendor/autoload.php';

use Mailgun\Mailgun;

class MailGunRoot implements IEmailProvider {

    private $mg;

    public function __construct() {
        $this->mg = Mailgun::create(MAILGUN_API_KEY, 'https://api.mailgun.net/v3/' . MAILGUN_DOMAIN); // For US servers        
    }

    public function sendEmail($from_email, $from_name, $to, $sub, $msg) {

        if (!EMAILING_ENABLED) {
            return true;
        }

        //https://app.mailgun.com/app/domains
        try {
            $data = [
                'from'    => $from_email,
                'to'      => $to,
                'subject' => $sub,
                'text'    => $msg
            ];

            $this->mg->messages()->send(MAILGUN_DOMAIN, $data);
        } catch (Exception $ex) {
            log_message('error', 'EMAIL NOT SENT ON ACCOUNT REGISTRATION MAILGUN ' . $ex->getMessage());
            return ['status' => false, 'message' => 'An error occurred when attempting to send the email'];
        }

        return ['status' => true];
    }

}
