<?php

defined('BASEPATH') OR exit('No direct script access allowed');

/*
  | -------------------------------------------------------------------------
  | Hooks
  | -------------------------------------------------------------------------
  | This file lets you define "hooks" to extend CI without hacking the core
  | files.  Please see the user guide for info:
  |
  |	https://codeigniter.com/user_guide/general/hooks.html
  |
 */
$hook['post_controller_constructor'] = [
    [
        'class'    => 'MY_Hook_AfterConstructor',
        'function' => 'loadLanguage',
        'filename' => 'MY_Hook_AfterConstructor.php',
        'filepath' => 'hooks',
        'params'   => array()
    ]
];
$hook['pre_controller'] = [
    [
        'class'    => 'MY_Hook_PreController',
        'function' => 'load',
        'filename' => 'MY_Hook_PreController.php',
        'filepath' => 'hooks',
        'params'   => array()
    ],
];

$hook['pre_system'] = [
    [
        'class'    => 'MY_Hook_PreSystem',
        'function' => 'load',
        'filename' => 'MY_Hook_PreSystem.php',
        'filepath' => 'hooks',
        'params'   => array()
    ],
];
