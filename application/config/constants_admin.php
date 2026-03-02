<?php //test git

defined('BASEPATH') or exit('No direct script access allowed');

define('BASE_URL_ADMIN', BASE_URL . 'admin/');
define('BASE_ASSETS_ADMIN', BASE_URL . 'assets/admin/');

define('STATUSES', [
    0 => [
        'title' => 'Awaiting company information',
        'color' => '#cbd5e1',
        'font_color' => 'white'
    ],
    1 => [
        'title' => 'Awaiting bank submission',
        'color' => '#94a3b8',
        'font_color' => 'white'
    ],
    2 => [
        'title' => 'Bank Submission Error',
        'color' => 'darkred',
        'font_color' => 'white'
    ],
    3 => [
        'title' => 'Filling FTS Form | Awaiting Approval',
        'color' => '#5c7186',
        'font_color' => 'white'
    ],
    4 => [
        'title' => 'Approved',
        'color' => '#2e3a59',
        'font_color' => 'white'
    ],
    5 => [
        'title' => 'Approved & Tranx found',
        'color' => '#1e293b',
        'font_color' => 'white'
    ]
]);




