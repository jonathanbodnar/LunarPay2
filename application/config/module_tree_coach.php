<?php

//==== DO NOT MOFIFY IDS, 
//==== WHEN INSTALLING A NEW MODULE OR PAGE ADD A NEW ID (INCREMENT)

define('MODULE_TREE_COACH', [
    'organizations' => [//page name, it's shown in the team member modal
        'id'            => 1, //unique 
        'default_grant' => true,
        'color'         => '#f2f9ff',
        'endpoints'     => [
            'organizations/index'
        ]
    ],
    'invoices'      => [
        'id'            => 2,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'invoices/index'
        ]
    ],
    'payment_links' => [
        'id'            => 3,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'payment_links/index',
        ]
    ],
    'transactions'  => [
        'id'            => 4,
        'default_grant' => true,
        'color'         => '#efffe1',
        'endpoints'     => [
            'donations/index',
        ]
    ],
    'recurring'     => [
        'id'            => 5,
        'default_grant' => true,
        'color'         => '#efffe1',
        'endpoints'     => [
            'donations/recurring'
        ]
    ],
    'payouts'       => [
        'id'            => 6,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'payouts/index'
        ]
    ],
    'customers'      => [
        'id'            => 7,
        'default_grant' => true,
        'color'         => '#e8efff',
        'endpoints'     => [
            'donors/index'
        ]
    ],
    'products'      => [
        'id'            => 8,
        'default_grant' => false,
        'color'         => '#efffe1',
        'endpoints'     => [
            'products/index'
        ]
    ],
    'Branding' => [
        'id'            => 9,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/branding',
        ]
    ],
    'integrations' => [
        'id'            => 10,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/integrations',
        ]
    ],
    'team'         => [
        'id'            => 11,
        'default_grant' => false,
        'color'         => '#fff0f0',
        'endpoints'     => [
            'settings/team'
        ]
    ],
]);
