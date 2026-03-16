<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of newPHPClass
 *
 * @author Juan
 */
class MY_Hook_PreSystem {

    public function load() {
        $input   = @file_get_contents('php://input');
        $request = json_decode($input);

        if (isset($request->{CSRF_TOKEN_NAME}) && $request->{CSRF_TOKEN_NAME}) {            
            $_POST[CSRF_TOKEN_NAME] = $request->{CSRF_TOKEN_NAME};
        }

        if (isset($_POST[CSRF_TOKEN_NAME])) {            
            define('CSRF_TOKEN_AJAX_SENT', 1);
        }
    }

}
