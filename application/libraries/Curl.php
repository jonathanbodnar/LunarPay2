<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Curl {

    private $httpheader = false;

    public function __construct() {
        
    }

    public function get($url) {
        $ch = curl_init();

        if ($this->httpheader) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $this->httpheader);
        }

        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);        

        $data = curl_exec($ch);        
        curl_close($ch);
        return $data;
    }

    public function post($url, $post_value, $post_file = false) {
        $post_str = '';
        if (!$post_file) {
            $post_str = http_build_query($post_value, '', '&');
        } else {
            $post_str = $post_value;
        }

        $ch = curl_init();

        if ($this->httpheader) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $this->httpheader);
        }
        curl_setopt($ch, CURLOPT_HEADER, false);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_str);
        $response = curl_exec($ch);
        curl_close($ch);
        return $response;
    }

    public function set_curlopt_httpheader($httpheader) {
        $this->httpheader = $httpheader;
    }

    public function postRawJson($url, $jsonData) {

        $ch          = curl_init($url);
        
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
        curl_setopt($ch, CURLOPT_HEADER, FALSE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type:application/json',
            'Content-Length: ' . strlen($jsonData)
                ]
        );
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //do not print output

        $result = curl_exec($ch);
             
        if (curl_errno($ch)) {
            //$error_msg = curl_error($ch);
            curl_close($ch);            
            return "{'error': true}";
        } else {
            curl_close($ch);            
            return $result;            
        }

        //return $result;
    }

}
