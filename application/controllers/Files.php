<?php

if (!defined('BASEPATH'))
    exit('No direct script access allowed');

class Files extends CI_Controller {
    
    CONST USE_EXTERNAL_STORAGE = true;

    CONST STORAGE_FOLDERS = [
        'branding_logo',
        'statmnts_donor',
        'statmnts_admin',
        'pwa_background',
        'wordpress_downloads',
        'invoices',
        'digital_content',
        'payment_receipts'
    ];

    function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->helper('download');
        $this->load->helper('file');
        /* cache control */
        $this->output->set_header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        $this->output->set_header('Pragma: no-cache');
    }

    public function get($category = false, $file_hash = false) {

        try {

            if (!$category || !$file_hash) {
                show_error('Forbidden', 403);
            }

            if (!in_array($category, self::STORAGE_FOLDERS)) {
                show_error('Forbidden', 403);
            }

            $newOutPutFileName = null;

            if ($category == 'statmnts_donor') {

                $parts = explode('_', $file_hash);
                if (isset($parts[2])) {
                    $user = $parts[2];
                } else {
                    show_error('Forbidden', 403);
                }
                $user_id_part = (int)str_replace('D', '', $user);

                //needs review, we stoped working with sessions, we need a solution considering the new api authentication system
                /*
              $user_id = (int)$this->session->userdata('tree_user_id');

              if($user_id_part != $user_id){
              show_error('Forbidden', 403);
              }

             */
            }

            if ($category == 'statmnts_admin') {

                $parts = explode('_', $file_hash);
                if (isset($parts[2])) {
                    $user = $parts[2];
                } else {
                    show_error('Forbidden', 403);
                }
                $user_id_part = (int)str_replace('A', '', $user);
                $user_id = (int)$this->session->userdata('user_id');

                if ($user_id_part != $user_id) {
                    show_error('Forbidden', 403);
                }
            }

            if ($category == 'wordpress_downloads') {
                $category = str_replace('_', '/', $category);
                $file_hash = str_replace('_', '/', $file_hash);
            }

            if ($category == 'invoices') {
                //once an invoice is set as unpaid (open) we create the pdf, 
                //it will be the pdf for that invoice eternally
                $parts = explode('_', $file_hash);

                $prefix = null; //i.e "Invoice_" word
                $invoiceReference = null;

                if (isset($parts[1])) {
                    $prefix          = $parts[0];
                    $invoiceReference       = $parts[1];
                    //$invoiceFileHash = $parts[2]; removing last part of the file (hash) for simplifyng stuff to the user
                } else {
                    show_error('Forbidden', 403);
                }

                //generate a new name with Invoice name, the invoice id and the first 20 chars of the hash
                $newOutPutFileName = $prefix . '_' . $invoiceReference . '.pdf';
            }

            if ($category == 'payment_receipts') {

                $parts = explode('_', $file_hash);

                $prefix           = null; //i.e "Invoice_" word
                $invoiceReference = null;

                if (isset($parts[1])) {
                    $prefix           = $parts[0];
                    $paymentReference = $parts[1];
                    //$paypmentFileHash = $parts[2]; removing last part of the file (hash) for simplifyng stuff to the user
                } else {
                    show_error('Forbidden', 403);
                }

                //generate a new name, the paypment id and the first 20 chars of the hash
                $newOutPutFileName = $prefix . '_000' . $paymentReference . '.pdf';                
            }

            if ($category == 'digital_content') {
                //getting new name for digital_content
                $this->load->model('product_model');

                //verifyx - we need to validate the customer has paid the invoice or the product so he can proceed to download his file
                $product = $this->product_model->getByDigitalContentHash($file_hash);

                //generate a new name with Product Reference
                $newOutPutFileName = $product->reference . '.pdf';                

            }


            if (self::USE_EXTERNAL_STORAGE) {

                $this->load->library('external-storage/ExternalStorageProvider');
                ExternalStorageProvider::init();
                $readEndpoint = ExternalStorageProvider::$READ_ENPOINT;


                $includeVersion = '';
                if(isset($_GET['v']) && !empty($_GET['v'])){
                    $includeVersion = '?v=' . $_GET['v'];
                }

                $url = $readEndpoint . $category . '/' . $file_hash . $includeVersion;
                

                $download = ['invoices', 'payment_receipts', 'digital_content',];

                if (in_array($category, $download)) {

                    $fileContents = @file_get_contents($url);
                    
                    if (!$fileContents) {
                        show_error('Error retrieving file', 500);
                    }
                    if (in_array($category, ['invoices', 'payment_receipts', 'digital_content'])) {
                        $this->load->helper('crypt');
                        
                        try {
                            $fileContents = decryptContent($fileContents, $_ENV['APP_ENCRYPTION_KEY']);
                        } catch (Exception $e) {
                            throw new Exception('Error decrypting file: ' . $e->getMessage());
                        }
                    }

                    // Set headers to force the download with the new filename
                    header('Content-Type: application/pdf'); // Set content type (adjust for your file type)
                    header('Content-Disposition: attachment; filename="' . $newOutPutFileName . '"'); // Force download with new filename
                    header('Content-Transfer-Encoding: binary'); // Ensures the file is treated as binary for download
                    header('Expires: 0'); // No caching
                    header('Cache-Control: must-revalidate'); // Ensure the file is not cached
                    header('Pragma: public'); // Public access

                    // Output the file content directly to the browser
                    echo $fileContents;
                } else {
                    header('Location: ' . $url);
                }
            } else {

                $file_path = './application/uploads/' . $category . '/' . $file_hash;

                if (is_file($file_path)) {
                    // required for IE
                    if (ini_get('zlib.output_compression')) {
                        ini_set('zlib.output_compression', 'Off');
                    }

                    // get the file mime type using the file extension

                    $mime = get_mime_by_extension($file_path);
                    // Build the headers to push out the file properly.
                    header('Pragma: public');     // required
                    header('Expires: 0');         // no cache
                    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
                    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', filemtime($file_path)) . ' GMT');
                    header('Cache-Control: private', false);
                    header('Content-Type: ' . $mime);  // Add the mime type from Code igniter.
                    header('Content-Disposition: attachment; filename="' . basename($newOutPutFileName ? $newOutPutFileName : $file_hash) . '"');  // Add the file name
                    header('Content-Transfer-Encoding: binary');
                    header('Content-Length: ' . filesize($file_path)); // provide file size
                    header('Connection: close');
                    readfile($file_path); // push it out
                    exit();
                }
            }
        } catch (Exception $e) {
            show_error($e->getMessage(), 500);
        }
    }
}
