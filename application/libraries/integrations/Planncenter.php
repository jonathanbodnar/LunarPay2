<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Planncenter {
    
    function __construct() {
        $this->CI = & get_instance();

        $this->encryptPhrase = $this->CI->config->item('integrations_encrypt_phrase');

        $this->CI->load->library('encryption');

        $this->CI->encryption->initialize([
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => $this->encryptPhrase,
                ]
        );
    }  

}
