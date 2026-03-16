<?php

//PAYSAFE REGIONS
// if we want to enable Credit Card USD for EU ask paysafe if we need a new product code

define("PAYSAFE_REGIONS_TEST", [
    "US" => [
        "available_currencies"     => [
            "USD"
        ],
        "available_merchant_banks" => [
            "ACH"
        ],
        "name"                     => "United States."
    ],
    "CA" => [
        "available_currencies"     => [
            "CAD",
            "USD"
        ],
        "available_merchant_banks" => [
            "EFT"
        ],
        "name"                     => "Canada."
    ],
    "EU" => [
        "available_currencies"     => [
            "EUR",
        //"USD"
        ],
        "available_merchant_banks" => [
            "SEPA",
            "BACS",
            "WIRE"
        ],
        "name"                     => "EuropeTest"
    ],
]);

define("PAYSAFE_REGIONS_LIVE", [
    "US" => [
        "available_currencies"     => [
            "USD"
        ],
        "available_merchant_banks" => [
            "ACH"
        ],
        "name"                     => "United States"
    ],
    "CA" => [
        "available_currencies"     => [
            "CAD",
            "USD"
        ],
        "available_merchant_banks" => [
            "EFT"
        ],
        "name"                     => "Canada"
    ],
        /* "EU" => [
          "available_currencies"     => [
          "EUR",
          //"USD"
          ],
          "available_merchant_banks" => [
          "SEPA",
          "BACS",
          "WIRE"
          ],
          "name"                     => "Europe"
          ], */
]);

//
//PAYSAFE FEES 
//the payment_method can be credit_card, ach, eft, sepa or bacs
//the payment_type can be card or bank
/////////////////////////////////
//LIVE PRODUCT CODES.
//////////////////////////////

define("PAYSAFE_PRODUCT_CODE_DEFAULT_INDEX", 4);

define("PAYSAFE_PRODUCT_CODES_TEST", [
    "USD" => [
        "credit_card" => [// <<< payment method
            'type'  => 'card', // <<< payment type
            'codes' => [
                "0" => ["code" => "CC-USD", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "CC-USD", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "CC-USD", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "CC-USD", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "CC-USD", "percent" => 0.025, "const" => 0],
            ]
        ],
        "ach"         => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "DD-USD", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "DD-USD", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "DD-USD", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "DD-USD", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "DD-USD", "percent" => 0.025, "const" => 0],
            ]
        ]
    ],
    "CAD" => [
        "credit_card" => [
            'type'  => 'card',
            'codes' => [
                "0" => ["code" => "x", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "x", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "CC-CAD", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "x", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "CC-CAD", "percent" => 0.025, "const" => 0],
            ]
        ],
        "eft"         => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "x", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "x", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "DD-CAD", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "x", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "DD-CAD", "percent" => 0.025, "const" => 0],
            ]
        ]
    ],
    "EUR" => [
        "credit_card" => [
            'type'  => 'card',
            'codes' => [
                "0" => ["code" => "CC-EUR", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "x", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "x", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "x", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "x", "percent" => 0.025, "const" => 0],
            ]
        ],
        "sepa"        => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "DD-EUR", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "x", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "x", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "x", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "x", "percent" => 0.025, "const" => 0],
            ]
        ],
        "bacs"        => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "DD-EU2", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "x", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "x", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "x", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "x", "percent" => 0.025, "const" => 0],
            ]
        ]
    ]
]);

///////////////////////////////
//WARNING !! LIVE PRODUCT CODES
//////////////////////////////

define("PAYSAFE_PRODUCT_CODES_LIVE", [
    "USD" => [
        "credit_card" => [// <<< payment method
            'type'  => 'card', // <<< payment type
            'codes' => [
                "0" => ["code" => "65042", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "65032", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "65022", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "65052", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "65062", "percent" => 0.025, "const" => 0],
            ]
        ],
        "ach"         => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "65222", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "65232", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "65242", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "65252", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "65262", "percent" => 0.025, "const" => 0],
            ]
        ]
    ],
    "CAD" => [
        "credit_card" => [
            'type'  => 'card',
            'codes' => [
                "0" => ["code" => "65442", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "65432", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "65422", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "65452", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "65462", "percent" => 0.025, "const" => 0],
            ]
        ],
        "eft"         => [
            'type'  => 'bank',
            'codes' => [
                "0" => ["code" => "65472", "percent" => 0.021, "const" => 0],
                "1" => ["code" => "65482", "percent" => 0.022, "const" => 0],
                "2" => ["code" => "65492", "percent" => 0.023, "const" => 0],
                "3" => ["code" => "65502", "percent" => 0.024, "const" => 0],
                "4" => ["code" => "65512", "percent" => 0.025, "const" => 0],
            ]
        ]
    ]
]);
