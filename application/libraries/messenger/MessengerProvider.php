<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');
/*
 * 
 * Copyright 2020 Juan P. Gomez <pablogmzc@gmail.com>.
 * 
  /*
 * Description of newPHPClass
 *
 * @author Juan P. Gomez <pablogmzc@gmail.com>
 */

interface IMessengerProvider {
    public function sendSms($from,$to,$msg);
    public function createNo($church_id);
}

class MessengerProvider {

    const TWILIO = PROVIDER_MESSENGER_TWILIO;

    private static $messenger_object = null;

    static function init($provider = null) {

        $provider = $provider ? $provider : PROVIDER_MESSENGER_DEFAULT;

        switch ($provider) {
            case self::TWILIO:
                require_once 'application/libraries/messenger/TwilioRoot.php';
                self::$messenger_object = new TwilioRoot();
                break;
            default:
                show_error('Bad Messenger Provider');
        }

    }

    static function getInstance() {
        if (self::$messenger_object) {
            return self::$messenger_object;
        }
        show_error('Provider has not been initialized');
    }

}
