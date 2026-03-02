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
class MY_Hook_AfterConstructor {

    private $CI;

    public function loadLanguage() {
        $this->CI = & get_instance();
        $this->CI->lang->load(['general']);
    }

}
