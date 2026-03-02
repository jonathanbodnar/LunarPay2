<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

interface IExternalStorageProvider {

    public function upload($folder, $file_name, $server_file_path);
    public function uploadBody($folder, $file_name, $body, $content_type);    
}

class ExternalStorageProvider {

    private static $object = null;

    public static $READ_ENPOINT = [];    

    static function init($provider = null) {

        if (!$provider) {
            $provider = PROVIDER_EXTERNAL_STORAGE_WASABI;
        }
        
        switch ($provider) {            
            case PROVIDER_EXTERNAL_STORAGE_WASABI:
                require_once 'application/libraries/external-storage/Wasabi.php';                
                self::$object = new Wasabi;
                self::setSettings($provider);
                return self::$object;
                break;            
            default:
                show_error('Bad Email Provider');
        }
    }

    static function getInstance() {
        if (self::$object) {
            return self::$object;
        }

        show_error('Provider has not been initialized');
    }

    private static function setSettings($provider) {        
        switch ($provider) {
            case PROVIDER_EXTERNAL_STORAGE_WASABI:
                self::$READ_ENPOINT = self::$object->readEndpoint;
                break;
        }
    }

}
