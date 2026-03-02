<?php

//==== DO NOT MOFIFY IDS, 
//==== WHEN INSTALLING A NEW MODULE OR PAGE ADD A NEW ID (INCREMENT)

define('MODULE_TREE', [
    'organizations' => [//page name, it's shown in the team member modal
        'id'            => 1, //unique 
        'default_grant' => true,
        'color'         => '#f2f9ff',
        'endpoints'     => [
            'organizations/index'
        ]
    ],
    'payments/invoices' => [
        'id'            => 15,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'invoices/index'
        ]
    ],
    'payments/payment_links' => [
        'id'            => 17,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'payment_links/index',
        ]
    ],
    'payments/transactions'  => [
        'id'            => 3,
        'default_grant' => true,
        'color'         => '#efffe1',
        'endpoints'     => [
            'donations/index',
        ]
    ],
    'payments/recurring' => [
        'id'            => 4,
        'default_grant' => true,
        'color'         => '#efffe1',
        'endpoints'     => [
            'donations/recurring'
        ]
    ],
    'payments/payouts' => [
        'id'            => 5,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'payouts/index'
        ]
    ],
    'customer' => [
        'id'            => 2,
        'default_grant' => true,
        'color'         => '#e8efff',
        'endpoints'     => [
            'donors/index'
        ]
    ],
    'products/overview' => [
        'id'            => 16,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'products/index'
        ]
    ],
    /*
      'revenue/statements'    => [
      'id'            => 6,
      'default_grant' => false,
      'color'         => '#efffe1',
      'endpoints'     => [
      'statements/index'
      ]
      ], */


    /*
      'setup'                 => [
      'id'            => 7,
      'default_grant' => false,
      'color'         => '#eeeeee',
      'endpoints'     => [
      'setup/index']
      ], */
    
     'settings/Branding' => [
        'id'            => 18,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/branding',
        ]
    ],
    
    'settings/integrations' => [
        'id'            => 8,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/integrations',
        ]
    ],
    'settings/team' => [
        'id'            => 9,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/team'
        ]
    ],
        /*
          'messaging/inbox'         => [
          'id'            => 10,
          'default_grant' => false,
          'color'         => '#fff0f0',
          'endpoints'     => [
          'messaging/inbox'
          ] */

        /*
          'freeapp'               => [
          'id'            => 11,
          'default_grant' => false,
          'color'         => '#fff0f0',
          'endpoints'     => [
          'gbarber/create_app',
          'gbarber/validate_app'
          ]
          ],

          'messaging/sms'         => [
          'id'            => 12,
          'default_grant' => false,
          'color'         => '#fff0f0',
          'endpoints'     => [
          'communication/sms'
          ]
          ],

          'create/pages'               => [
          'id'            => 13,
          'default_grant' => false,
          'color'         => '#fff0f0',
          'endpoints'     => [
          'pages/index'
          ]
          ],
          'create/give_anywhere'  => [
          'id'            => 14,
          'default_grant' => false,
          'color'         => '#fff0f0',
          'endpoints'     => [
          'give_anywhere/index',
          ]
          ],
         */
]);
