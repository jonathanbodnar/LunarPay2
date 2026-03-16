<?php

function sendVerificationCode($identity, $subject = null, $from_name = null) {

    $CI = & get_instance();

    $code = rand (10000, 99999);
    $CI->load->model('code_security_model');
    $CI->code_security_model->create($identity,$code);

    $CI->load->use_theme(); //locate the default place where we are going to load the view from
    
    if (filter_var($identity, FILTER_VALIDATE_EMAIL)) {
        
        $message = $CI->load->view('email/donor_login_security_code', ['code' => $code, 'from_name' => $from_name], TRUE);
        $from    = EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS;
        $to      = $identity;
        if(!$subject) {
            $subject = COMPANY_NAME . ' Security Code';
        }

        if (!$from_name) {
            $from_name = COMPANY_NAME;
        }

        require_once 'application/libraries/email/EmailProvider.php';
        
        $email_data = EmailProvider::getInstance()->sendEmail($from, $from_name , $to, $subject, $message);

        if ($email_data['status']){
            return [
                'status'   => true,
                'identity' => $identity,
                'message'  => 'Security Code Successfully Sent '
            ];
        } else {
            return [
                'status'  => false,
                'message' => 'Error Sending Security Code'
            ];
        }
    } else {
        throw new Exception('Please provide a valid email');

        // code via phone is not validated

        require_once 'application/libraries/messenger/MessengerProvider.php';
        MessengerProvider::init();
        $MenssengerInstance = MessengerProvider::getInstance();

        $to = '+' . $identity;

        $from = PROVIDER_MAIN_PHONE;
        $message = COMPANY_NAME . ' Security code: ' . $code;

        try {
            $MenssengerInstance->sendSms($to, $from, $message);
            return [
                'status'   => true,
                'identity' => $identity,
                'message'  => 'Security Code Sent Successfully'
            ];
        } catch (Exception $exc) {
            $excMessage = (string) $exc->getMessage();
            $code = (string) $exc->getCode();
            $errMessage = $code == 21211 ? "Not valid phone - Error (21211)" : ($code == 21610 ? "This number is unsubscribed - Error 21610" : $excMessage);
            
            return [
                'status'  => false,
                'message' => $errMessage
            ];
        }
    }
}
