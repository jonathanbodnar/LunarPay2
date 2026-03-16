<?php

namespace Payments;

class SourceDataBuilder {

    public static function epicpay($request) {
        $request->first_name = ucfirst(strtolower($request->first_name));
        $request->last_name  = ucfirst(strtolower($request->last_name));

        if ($request->payment_method == 'credit_card') {

            $request->card_number = str_replace('-', '', $request->card_number);
            $request->card_date   = $request->card_date;
            $request->card_cvv    = $request->card_cvv;
            $exp                  = explode('/', $request->card_date);

            if (strlen($exp[0]) == 1) {
                $exp[0] = "0" . $exp[0];
            }
            if (strlen($exp[1]) == 4) {
                $exp[1] = substr($exp[1], -2);
            }
            $request->exp_month = $exp[0];
            $request->exp_year  = $exp[1];

            $paymentData['method']      = 'credit_card';
            $paymentData['credit_card'] = [
                'card_number'      => $request->card_number,
                'card_holder_name' => $request->first_name . ' ' . $request->last_name,
                'exp_month'        => $request->exp_month,
                'exp_year'         => $request->exp_year,
                'cvv'              => $request->card_cvv,
            ];
        } elseif ($request->payment_method == 'bank_account') {

            $paymentData['method'] = 'echeck';

            $paymentData['bank_account'] = [
                'account_type'        => $request->account_type,
                'routing_number'      => $request->routing_number,
                'account_number'      => $request->account_number,
                'account_holder_name' => $request->first_name . ' ' . $request->last_name,
            ];
        }

        $customerData = [
            'church_id'        => $request->church_id,
            'account_donor_id' => $request->account_donor_id,
            'customer_address' => [
                'email'       => $request->email,
                'first_name'  => $request->first_name,
                'last_name'   => $request->last_name,
                'postal_code' => $request->postal_code,
            ],
            'billing_address'  => [
                'email'       => $request->email,
                'first_name'  => $request->first_name,
                'last_name'   => $request->last_name,
                'postal_code' => $request->postal_code,
            ],
        ];

        $customerData['is_saved'] = $request->save_source;

        return ['paymentData' => $paymentData, 'customerData' => $customerData];
    }

    public static function paysafe($request) {

        if ($request->payment_method == 'credit_card') {

            $request->first_name = ucfirst(strtolower($request->first_name));
            $request->last_name  = ucfirst(strtolower($request->last_name));

            $paymentData['method']      = 'credit_card';
            $paymentData['credit_card'] = [
                'single_use_token'      => $request->single_use_token,
                'card_holder_name' => $request->first_name . ' ' . $request->last_name,
            ];
        } elseif ($request->payment_method == 'bank_account') {

            $paymentData['method'] = 'echeck';

            $request->first_name  = ucfirst(strtolower($request->{"$request->bank_type[first_name]"}));
            $request->last_name   = ucfirst(strtolower($request->{"$request->bank_type[last_name]"}));
            $request->postal_code = ucfirst(strtolower($request->{"$request->bank_type[postal_code]"}));

            if ($request->bank_type == 'ach') {

                $paymentData['bank_account'] = [
                    'account_type'   => $request->{"$request->bank_type[account_type]"},
                    'routing_number' => $request->{"$request->bank_type[routing_number]"},
                    'account_number' => $request->{"$request->bank_type[account_number]"}
                ];
            } elseif ($request->bank_type == 'eft') {

                $paymentData['bank_account'] = [
                    'account_number' => $request->{"$request->bank_type[account_number]"},
                    'transit_number' => $request->{"$request->bank_type[transit_number]"},
                    'institution_id' => $request->{"$request->bank_type[institution_id]"}
                ];
            } elseif ($request->bank_type == 'sepa') {

                $paymentData['bank_account'] = [
                    'iban'              => $request->{"$request->bank_type[iban]"},
                    'mandate_reference' => $request->{"$request->bank_type[mandate]"}
                ];
            } elseif ($request->bank_type == 'bacs') {

                $paymentData['bank_account'] = [
                    'account_number'    => $request->{"$request->bank_type[account_number]"},
                    'sortcode'          => $request->{"$request->bank_type[sortcode]"},
                    'mandate_reference' => $request->{"$request->bank_type[mandate]"}
                ];
            }

            $paymentData['bank_account']['account_holder_name'] = $request->first_name . ' ' . $request->last_name;
            $paymentData['bank_type']                           = $request->bank_type;
        }

        $customerData = [
            'church_id'        => $request->church_id,
            'account_donor_id' => $request->account_donor_id,
            'customer_address' => [
                'email'       => $request->email,
                'first_name'  => $request->first_name,
                'last_name'   => $request->last_name,
                'postal_code' => $request->postal_code,
            ],
            'billing_address'  => [
                'email'       => $request->email,
                'first_name'  => $request->first_name,
                'last_name'   => $request->last_name,
                'postal_code' => $request->postal_code,
            ],
        ];

        if ($request->payment_method == 'bank_account') {
            $customerData['paysafe_billing_address'] = [
                'street'  => $request->{"$request->bank_type[street]"},
                'street2' => $request->{"$request->bank_type[street2]"},
                'city'    => $request->{"$request->bank_type[city]"},
                'country' => $request->{"$request->bank_type[country]"},
                'zip'     => $request->{"$request->bank_type[postal_code]"}
            ];
        }

        $customerData['is_saved'] = $request->save_source;

        return ['paymentData' => $paymentData, 'customerData' => $customerData];
    }

}
