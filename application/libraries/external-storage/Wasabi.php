<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

use Aws\S3\S3Client;

class Wasabi implements IExternalStorageProvider {

    private $s3;
    private $bucket;
    private $region;
    private $endpoint;
    
    public $readEndpoint;

    public function __construct() {
        $this->bucket = $_ENV['STORAGE_DEFAULT_BUCKET'];
        $this->region = 'us-east-1';
        $this->endpoint = 's3.wasabisys.com';
        $this->readEndpoint = 'https://' . $this->bucket . '.' . $this->endpoint . '/';

        $this->s3 = new S3Client([
            'version' => 'latest',
            'region' => $this->region,
            'endpoint' => 'https://' . $this->endpoint,
            'credentials' => [
                'key'    => $_ENV['WASABI_ACCESS_KEY'],
                'secret' => $_ENV['WASABI_SECRET_KEY'],
            ],
            'suppress_php_deprecation_warning' => true, //php8 needed
        ]);
    }

    public function upload($folder, $file_name, $server_file_path) {

        try {
            $key = $folder . '/' . $file_name;
            $result = $this->s3->putObject([
                'Bucket' => $this->bucket,
                'Key'    => $key,
                'SourceFile' => $server_file_path,  // Path to the file on your server
                'ACL'    => 'public-read',  // Adjust based on your file visibility requirements
            ]);

            $data = [
                'status' => true,
                'url' => $result['ObjectURL'],
                'key' => $key
            ];
            
            return $data;
        } catch (Exception $ex) {
            log_custom(LOG_CUSTOM_ERROR, "ERROR UPLOADING FILE TO WASABI: $key | " . $ex->getMessage());
            throw new Exception("An error occurred when attempting to upload the file: $key " . $ex->getMessage());            
        }

        return ['status' => true];
    }

    public function uploadBody($folder, $file_name, $body, $content_type) {

        try {
            $key = $folder . '/' . $file_name;
            $result = $this->s3->putObject([
                'Bucket' => $this->bucket,
                'Key'    => $key,
                'Body'   => $body,
                'ContentType' => $content_type,
                'ACL'    => 'public-read',  // Adjust based on your file visibility requirements
            ]);

            $data = [
                'status' => true,
                'url' => $result['ObjectURL'],
                'key' => $key
            ];
            
            return $data;
        } catch (Exception $ex) {
            log_custom(LOG_CUSTOM_ERROR, "ERROR UPLOADING FILE TO WASABI: $key | " . $ex->getMessage());
            throw new Exception("An error occurred when attempting to upload the file: $key " . $ex->getMessage());            
        }

        return ['status' => true];
    }
}
