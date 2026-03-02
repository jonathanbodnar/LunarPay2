<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

interface IEmailProvider {

    public function sendEmail($from_email, $from_name, $to, $sub, $msg);
}

class EmailProvider {

    const CODEIGNITER = PROVIDER_EMAIL_CODEIGNITER;
    const MAIL_GUN    = PROVIDER_EMAIL_MAILGUN;

    // Store instances by provider key
    private static $instances = [];

    static function getInstance($provider = null) {
        $provider = $provider ? $provider : PROVIDER_EMAIL_DEFAULT;

        // Return cached instance if exists
        if (isset(self::$instances[$provider])) {
            return self::$instances[$provider];
        }

        // Create new instance for this provider
        switch ($provider) {
            case self::CODEIGNITER:
                require_once 'application/libraries/email/CIEmail.php';
                self::$instances[$provider] = new CIEmail;
                break;
            case self::MAIL_GUN:
                require_once 'application/libraries/email/MailGunRoot.php';
                self::$instances[$provider] = new MailgunRoot;
                break;
            default:
                show_error('Bad Email Provider');
        }

        return self::$instances[$provider];
    }
}

