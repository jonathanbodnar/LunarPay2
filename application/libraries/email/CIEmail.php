<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class CIEmail implements IEmailProvider {

    private $CI;
    private $email;

    public function __construct() {
        $this->CI = & get_instance();
        $this->CI->load->library('email', '', 'emailObj');

        $this->email = $this->CI->emailObj;

        $config['useragent']      = 'CodeIgniter';
        $config['protocol']       = 'smtp';
        $config['mailpath']       = '/usr/sbin/sendmail';
        $config['smtp_host']      = 'smtp.gmail.com';
        $config['smtp_port']      = 465;
        $config['smtp_timeout']   = 5;
        $config['smtp_crypto']    = 'ssl';
        $config['wordwrap']       = true;
        $config['wrapchars']      = 76;
        $config['mailtype']       = 'html';
        $config['charset']        = 'UTF-8';
        $config['validate']       = true;
        $config['crlf']           = "\r\n";
        $config['newline']        = "\r\n";
        $config['bcc_batch_mode'] = true;
        $config['bcc_batch_size'] = 200;
        $config['encoding']       = '8bit';
        $config['smtp_user']      = CODEIGNITER_SMTP_USER;
        $config['smtp_pass']      = CODEIGNITER_SMTP_PASS;

        $this->email->initialize($config);
    }

    public function sendEmail($from_email, $from_name, $to, $sub, $msg, $attachments = []) {

        if (!EMAILING_ENABLED) {
            return ['status' => true];
        }

        $this->email->clear(true); //reseting email variable including attachments
        $this->email->from($from_email ? $from_email : CODEIGNITER_SMTP_USER, $from_name);
        $this->email->to($to);
        $this->email->subject($sub);
        $this->email->message($msg);

        foreach ($attachments as $attach) {
            $this->email->attach($attach);
        }

        $r = $this->email->send();

        if (!$r) {
            log_message('error', "EMAIL NOT SENT CODEIGNITER $from_email $from_name $to $sub" . $this->email->print_debugger());
            return ['status' => false, 'message' => 'An error occurred when attempting to send the email'];
        }

        return ['status' => true, 'message' => 'Email sent'];
    }

}
