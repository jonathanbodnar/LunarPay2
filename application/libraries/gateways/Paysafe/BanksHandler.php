<?php

namespace Paysafe;

class BanksHandler {

    public static function buildAchData($paymentData, $customerData, $billingAddressId = null) {

        //billingAddressId or billingAddress are required, billingAddress is not present in the documentation when creating the account independently 
        //from the profile but it works okay
        $data = [
            'accountType'       => $paymentData['bank_account']['account_type'],
            'routingNumber'     => $paymentData['bank_account']['routing_number'],
            'accountNumber'     => $paymentData['bank_account']['account_number'],
            'accountHolderName' => $paymentData['bank_account']['account_holder_name'],
            'billingAddress'    => $customerData['paysafe_billing_address']
        ];

        if (isset($paymentData['sec_code']) && $paymentData['sec_code']) {
            $data['payMethod'] = $paymentData['sec_code']; //it's required when making a purchase without using a paymentToken
        }

        if ($billingAddressId) {
            unset($data['billingAddress']);
            $data['billingAddressId'] = $billingAddressId;
        }

        return $data;
    }

    public static function buildEftData($paymentData, $customerData, $billingAddressId = null) {

        //billingAddressId or billingAddress are required, billingAddress is not present in the documentation when creating the account independently 
        //from the profile but it works okay

        $data = [
            'accountNumber'     => $paymentData['bank_account']['account_number'],
            'transitNumber'     => $paymentData['bank_account']['transit_number'],
            'institutionId'     => $paymentData['bank_account']['institution_id'],
            'accountHolderName' => $paymentData['bank_account']['account_holder_name'],
            'billingAddress'    => $customerData['paysafe_billing_address']
        ];
        
        if ($billingAddressId) {
            unset($data['billingAddress']);
            $data['billingAddressId'] = $billingAddressId;
        }

        return $data;
    }

    public static function buildSepaData($paymentData, $customerData, $billingAddressId = null) {

        //billingAddressId or billingAddress are required, billingAddress is not present in the documentation when creating the account independently 
        //from the profile but it works okay

        $data = [
            'iban'              => $paymentData['bank_account']['iban'],
            'accountHolderName' => $paymentData['bank_account']['account_holder_name'],
            'billingAddress'    => $customerData['paysafe_billing_address'],
            'mandates'          => [
                [
                    'reference' => $paymentData['bank_account']['mandate_reference']
                ]
            ]
        ];

        if ($billingAddressId) {
            unset($data['billingAddress']);
            $data['billingAddressId'] = $billingAddressId;
        }

        return $data;
    }

    public static function buildBacsData($paymentData, $customerData, $billingAddressId = null) {

        //billingAddressId or billingAddress are required, billingAddress is not present in the documentation when creating the account independently 
        //from the profile but it works okay

        $data = [
            'accountNumber'     => $paymentData['bank_account']['account_number'],
            'sortCode'          => $paymentData['bank_account']['sortcode'],
            'accountHolderName' => $paymentData['bank_account']['account_holder_name'],
            'billingAddress'    => $customerData['paysafe_billing_address'],
            'mandates'          => [
                [
                    'reference' => $paymentData['bank_account']['mandate_reference']
                ]
            ]
        ];

        if ($billingAddressId) {
            unset($data['billingAddress']);
            $data['billingAddressId'] = $billingAddressId;
        }

        return $data;
    }

}
