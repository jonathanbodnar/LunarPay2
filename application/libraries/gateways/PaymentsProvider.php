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

interface IPaymentsProvider {

    public function createTransaction($transactionData, $customerData, $paymentData);
}

class PaymentsProvider {

    const EPICPAY = PROVIDER_PAYMENT_EPICPAY;
    const PAYSAFE = PROVIDER_PAYMENT_PAYSAFE;
    const ETH     = PROVIDER_PAYMENT_ETH;
    const FTS     = PROVIDER_PAYMENT_FORTIS;

    private static $object = null;

    static function init($provider = null) {

        $provider = $provider ? $provider : PROVIDER_PAYMENT_DEFAULT;

        switch ($provider) {
            case self::EPICPAY:
                require_once 'application/libraries/gateways/PtyEpicPay.php';
                self::$object = new PtyEpicPay();
                break;
            case self::PAYSAFE:
                require_once 'application/libraries/gateways/PaySafeLib.php';
                self::$object = new PaySafeLib();
                break;
            case self::ETH:
                require_once 'application/libraries/gateways/CryptoLib.php';
                self::$object = new CryptoLib();
                break;
            case self::FTS:
                require_once 'application/libraries/gateways/FortisLib.php';
                self::$object = new FortisLib();
                break;
            default:
                show_error('Bad Email Provider');
        }
    }

    static function getInstance() {
        if (self::$object) {
            return self::$object;
        }

        show_error('Provider has not been initialized');
    }

}
