<?php

class MY_Exceptions extends CI_Exceptions {

    public function __construct() {
        parent::__construct();
    }

    public function show_error($heading, $message, $template = 'error_general', $status_code = 500) {
        if ($message == 'The action you have requested is not allowed.') {
            header('HTTP/1.1 403');
            header('Content-Type: application/json');
            echo json_encode([
                'status'           => false,
                'csrf_token_error' => true,
                'message'          => 'The action you have requested needs token validation',
                'new_token'        => [
                    'name'  => CSRF_TOKEN_NAME,
                    'value' => ''
                ]
            ]);
            die;
        } else {
            return parent::show_error($heading, $message, $template, $status_code);
        }
    }

}
