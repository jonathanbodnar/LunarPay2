<?php

use FontLib\EOT\Header;

defined('BASEPATH') OR exit('No direct script access allowed');


/**
 * Admin_tasks Controller
 * 
 * This controller is designed as a secure backdoor for performing database updates.
 * It uses HTTP Basic Authentication to restrict access to authorized users only.
 * 
 * Usage:
 * - This controller prompts for a username and password.
 * - Only users with the correct credentials. 
 * .
 */



class Admin_tasks extends CI_Controller {

    public function __construct() {
        parent::__construct();
        
        $username = ADMIN_TASKS_UPDATE_USER;
        $password = ADMIN_TASKS_UPDATE_PASS;

        // Check if HTTP Basic Authentication headers are provided by the client.
        // If not, prompt the client with a 401 Unauthorized response.
        if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])) {
            // Send Basic Auth headers to trigger the login prompt in the browser
            header('WWW-Authenticate: Basic realm="Admin Area"');
            header('HTTP/1.0 401 Unauthorized');
            print_r('Authentication required');
            exit;
        } else {
            // Verify the provided credentials against the environment variables
            if ($_SERVER['PHP_AUTH_USER'] === $username && $_SERVER['PHP_AUTH_PW'] === $password) {                
                // Authorized access:
            } else {
                // Unauthorized access: prompt the user again
                header('HTTP/1.0 401 Unauthorized');
                echo 'Incorrect username or password';
                exit;
            }
        }
    }


    //http://localhost:3001/utilities/admin_tasks/list_organizations
    public function list_organizations() {        
        $url = BASE_URL . 'utilities/admin_tasks/update_organization/';

        $result = $this->db
            ->select("ch_id as organizationId, 
              church_name as organizationName,
              users.email, users.first_name firstName, users.last_name lastName, 
              fortis_template as fortisTemplate,
              CONCAT('$url', ch_id) as updateLink,
              created_at as createdAt
              ")
            ->join('users', 'church_detail.client_id = users.id', 'inner')
            ->from('church_detail')
            ->order_by('ch_id', 'desc')
            ->get()
            ->result();

        header('Content-Type: application/json');
        echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);        
    }


    //http://localhost:3001/utilities/admin_tasks/update_organization
    public function update_organization($organizationId = null) {

        if(!$organizationId) {
            header('HTTP/1.0 400 Bad Request');
            echo 'OrganizationId param is required. Example: /utilities/admin_tasks/update_organization/[organization_id]';
            exit;
        }        
        
        if ($this->input->post()) {
            
            $fortis_template       = $this->input->post('fortis_template') ? $this->input->post('fortis_template') : null;            

            $this->db->where('ch_id', $organizationId);    
            $this->db->update('church_detail', ['fortis_template' => $fortis_template]);

            $result = $this->db->select("church_detail.ch_id organizationId, church_detail.church_name organizationName, 
            users.email, users.first_name firstName, users.last_name lastName, church_detail.fortis_template fortisTemplate")
            ->from('church_detail')
            ->join('users', 'church_detail.client_id = users.id', 'inner')            
            ->where('church_detail.ch_id', $organizationId)->get()->row();

            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => "Organization $organizationId updated successfully", "organization" => $result], JSON_PRETTY_PRINT);
        } else {

            $result = $this->db->select("church_detail.ch_id organizationId, church_detail.church_name organizationName, 
            users.email, users.first_name firstName, users.last_name lastName, church_detail.fortis_template fortisTemplate")
            ->from('church_detail')
            ->join('users', 'church_detail.client_id = users.id', 'inner')            
            ->where('church_detail.ch_id', $organizationId)->get()->row();

            $fortis_template_value = isset($result->fortisTemplate) ? htmlspecialchars($result->fortisTemplate, ENT_QUOTES, 'UTF-8') : ''; 

            $this->load->library(['form_validation']);
            echo form_open('utilities/admin_tasks/update_organization/' . $organizationId, ['role' => 'form', 'style' => 'font-family: arial; font-size:12px', 'autocomplete' => 'off']);
            
            echo '<pre>';
            print_r($result);            
            echo '</pre>';
            
            echo ''
            . '<label>New fortis template (An empty value will set a null value in the database)</label><br>'
            . ($_ENV['fortis_environment'] === 'dev' ? '<br>You are in dev mode, use:<br><br>TESTING1234<br><br>' : '')
            . '<input type="text" placeholder="" style="width:300px" name="fortis_template" value="'. $fortis_template_value . '"></input><br><br>'
            . '<button type="submit">Update</button>';
            echo form_close();
        }
    }

    public function ip() {
        header('Content-Type: application/json');
        $headersAndFullRequest = get_headers_safe();

        echo json_encode([
            'ip' => get_client_ip_from_trusted_proxy(),
            'headers' => $headersAndFullRequest
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    public function td()
    {
        function mask_param($value) {
            return strlen($value) > 4 ? '****' . substr($value, -4) : $value;
        }

        $envs = [];
        $countEmptyEnvs = 0;
        $countFilledEnvs = 0;
        foreach ($_ENV as $key => $value) {
            $envs[$key] = mask_param($value);
            if (empty($value)) {
                $countEmptyEnvs++;
            } else {
                $countFilledEnvs++;
            }
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'count' => count($envs),
            'filled' => $countFilledEnvs,
            'empty' => $countEmptyEnvs,
            'params'=> $envs
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    public function view_logs() {
        $logs_path = APPPATH . 'logs';
        if (!is_dir($logs_path)) {
            show_error('Logs directory does not exist.', 500);
            return;
        }
    
        // Get all files in the logs directory
        $files = array_diff(scandir($logs_path), ['.', '..']);
        
        // Sort files in descending order (latest first)
        rsort($files);
    
        // Pagination parameters
        $per_page = 25; // Number of files per page
        $current_page = $this->input->get('page') ? (int) $this->input->get('page') : 1;
        $total_files = count($files);
        $total_pages = ceil($total_files / $per_page);
    
        // Calculate the offset for the files to display on the current page
        $offset = ($current_page - 1) * $per_page;
        $files_to_display = array_slice($files, $offset, $per_page);
    
        if ($this->input->get('file')) {
            $file_name = basename($this->input->get('file'));
            $file_path = $logs_path . '/' . $file_name;
    
            if (file_exists($file_path)) {
                // Prepare HTML content for the log file
                $temp_html_file = sys_get_temp_dir() . '/' . $file_name . '.html';
                $html_content = "<html><head><style>
                    body { background-color: black; color: white; font-family: monospace; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                </style></head><body>
                temp file name: $temp_html_file
                <pre>" . htmlspecialchars(file_get_contents($file_path)) . "</pre></body></html>";
    
                // Save HTML content to a temporary file
                file_put_contents($temp_html_file, $html_content);
    
                // Create a password-protected ZIP file
                $zip_file = sys_get_temp_dir() . '/' . $file_name . '.zip';
                $zip_password = ADMIN_TASKS_UPDATE_PASS; // secure_password | use a env variable here
                $zip_command = "zip -j -P " . escapeshellarg($zip_password) . " " . escapeshellarg($zip_file) . " " . escapeshellarg($temp_html_file);
                exec($zip_command, $output, $result_code);
    
                if ($result_code === 0) {
                    // Serve the ZIP file for download
                    header('Content-Type: application/zip');
                    header('Content-Disposition: attachment; filename="' . $file_name . '.zip"');
                    readfile($zip_file);
    
                    // Clean up temporary files
                    unlink($temp_html_file);
                    unlink($zip_file);
                } else {
                    echo "<p>Failed to create ZIP file.</p>";
                }
            } else {
                echo "<p>File not found.</p>";
            }
        } else {
            echo "<html><head><style>
                    body { background-color: black; color: white; font-family: monospace; font-size: 15px; }
                    a { color: #4CAF50; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    li { list-style-type: none; }
                    pre { margin: 3; }
                    a.pager { font-weight: bold; }
                    .pager_gray { color: gray; }
                  </style></head><body><h3>Log Files.</h3><ul>";

            // Display total files and current pagination information
            echo "<p>Total Files: $total_files | Page $current_page of $total_pages | Per page: $per_page</p>";
          
            if ($current_page > 1) {
                echo "<a class='pager' href='?page=" . ($current_page - 1) . "'>PREVIOUS</a> ";
            } else {
                echo "<span class='pager_gray'>PREVIOUS</span> ";
            }
            if ($current_page < $total_pages) {
                echo "<a class='pager' href='?page=" . ($current_page + 1) . "'>NEXT</a>";
            } else {
                echo "<span class='pager_gray'>NEXT</span>";
            }

            echo "<br><br>";
    
            foreach ($files_to_display as $file) {
                echo "<pre><a href='?file=" . urlencode($file) . "'>$file</a></pre>";
            }
    
            echo "</ul>";

            echo "</body></html>";
        }
    }
    

    public function phpinfo() {
        //phpinfo();
    }
    
    public function generate_token() {        
        $token = bin2hex(random_bytes(24));
        Header('Content-Type: application/json');
        echo json_encode(['token' => $token], JSON_PRETTY_PRINT);
    }

    public function crypt_decrypt_keys()
    {
       
        $this->load->library('encryption');
        $encriptionDetails = [
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => 'enc-key'
        ];

        $this->encryption->initialize($encriptionDetails);
        $result = $this->encryption->decrypt('encoded-string');
        
        d(json_decode($result), false);

        $this->encryption->initialize($encriptionDetails);
        
        $enc_credentials = $this->encryption->encrypt('{"user_id":"user","user_api_key":"key"}');  

        d($enc_credentials);
    }

    public function encrypt_fortis_merchant_keys()
    {

        $userId = ""; //DO NOT PUSH SENSIBLE DATA
        $userApiKey = ""; //DO NOT PUSH SENSIBLE DATA

        $encriptionDetails = [
            'cipher' => 'aes-256',
            'mode'   => 'ctr',
            'key'    => '' //DO NOT PUSH SENSIBLE DATA
        ];

        $this->load->library('encryption');
        $this->encryption->initialize($encriptionDetails);

        $credentials = $this->encryption->encrypt(json_encode([
            'user_id' => $userId,
            'user_api_key' => $userApiKey
        ]));

        d($credentials);
    }

    public function magic_json_remove_child()
    {
        $json = $this->input->raw_input_stream;

        // Decode as stdClass objects
        $data = json_decode($json);

        if (
            isset($data->devPages->{"/"}->code->children[0]->children)
        ) {
            $data->devPages->{"/"}->code->children = $data->devPages->{"/"}->code->children[0]->children;
        } else {
            return $this->output
                ->set_content_type('application/json')
                ->set_status_header(400)
                ->set_output(json_encode(['error' => 'children[0].children not found']));
        }

        return $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    
    }

}
