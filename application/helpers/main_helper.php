<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if (!function_exists('printd')) {

    function printd($string) {
        echo '<pre>' . $string . '</pre>';
    }

}

function d($object, $die = true) {
    echo "<pre>";
    var_dump($object);
    echo "</pre>";
    if ($die) {
        die;
    }
}

function display_errors() {
    ini_set('display_errors', 1);
}

function display_errors2() {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}

function output_json($data, $json_sent = false, $cache = false, $http_code = false, $pretty_print = false) {
    $CI = & get_instance();
    if ($cache) {
        $CI->output->set_header("Pragma: no-cache");
        $CI->output->set_header("Cache-Control: no-store, no-cache");
    }

    if (defined('CSRF_TOKEN_AJAX_SENT')) {
        $data['new_token'] = [
            'name'  => CSRF_TOKEN_NAME,
            'value' => $CI->security->get_csrf_hash()
        ];
    }
    
    if($http_code) {
        http_response_code($http_code);
    }

    $CI->output->set_content_type('application/json');

    if($pretty_print) {
        $CI->output->set_output($json_sent ? $data : json_encode($data, JSON_PRETTY_PRINT));
    } else {
        $CI->output->set_output($json_sent ? $data : json_encode($data));
    }
}

function output_json_php($data, $json_sent = false, $cache = false, $http_code = false, $pretty_print = false) {
    // Set HTTP response code if provided
    if ($http_code) {
        http_response_code($http_code);
    }

    // Handle cache headers
    if ($cache) {
        header("Pragma: no-cache");
        header("Cache-Control: no-store, no-cache");
    }

    // Add CSRF token if constant is defined
    if (defined('CSRF_TOKEN_AJAX_SENT') && defined('CSRF_TOKEN_NAME') && function_exists('csrf_token')) {
        $data['new_token'] = [
            'name'  => CSRF_TOKEN_NAME,
            'value' => csrf_token() // Replace this with your method to get the CSRF hash
        ];
    }

    // Set JSON content type
    header('Content-Type: application/json');

    // Output the JSON
    if ($json_sent) {
        echo $data;
    } else {
        echo $pretty_print ? json_encode($data, JSON_PRETTY_PRINT) : json_encode($data);
    }
}


function output_json_custom($data) {
    $http_code = $data['http_code'];

    if (defined('CSRF_TOKEN_AJAX_SENT')) {
        $CI = & get_instance();

        $data['new_token'] = [
            'name'  => CSRF_TOKEN_NAME,
            'value' => $CI->security->get_csrf_hash()
        ];
    }

    if ($http_code) {
        http_response_code($http_code);
    }

    header("Pragma: no-cache");
    header("Cache-Control: no-store, no-cache");
    header("Content-Type: application/json");

    echo json_encode($data);
}

function output_json_api($data, $error, $http_code) {
    
    http_response_code($http_code);
    
    header("Pragma: no-cache");
    header("Cache-Control: no-store, no-cache");
    header("Content-Type: application/json");

    echo json_encode(['error' => $error, 'response' => $data]);
}

//YIQ Algorithm
function getContrastColor($hexcolor)
{
    $r = hexdec(substr($hexcolor, 1, 2));
    $g = hexdec(substr($hexcolor, 3, 2));
    $b = hexdec(substr($hexcolor, 5, 2));
    $yiq = (($r * 299) + ($g * 587) + ($b * 114)) / 1000;
    return ($yiq >= 128) ? 'black' : 'white';
}

/**
 * Lang
 *
 * Fetches a language variable and optionally outputs a form label
 *
 * @param	string	$result		The language line
 * @param	string	$for		The "for" value (id of the form element)
 * @param	array	$attributes	Any additional HTML attributes
 * @return	string
 */
if (!function_exists('langx')) {

    function langx($line, $for = '', $attributes = array()) {

        $CI     = & get_instance();
        $result = $CI->lang->line(strtolower($line));

        if (!$result) {
            $index_arr = explode('_', $line);
            $result2   = '';

            foreach ($index_arr as $value) {
                $result2 .= ($value) . ' ';
            }
            // $result = trim(ucwords($result2));
            $result = trim(ucfirst($result2));
        }

        if ($for !== '') {
            $result = '<label for="' . $for . '"' . _stringify_attributes($attributes) . '>' . $result . '</label>';
        }

        return $result;
    }

}

if (!function_exists('checkBelongsToSession')) {

    function checkBelongsToUser($data) {

        $CI              = & get_instance();
        $next_self_value = null;

        if (count(end($data)) !== 4) {
            show_error('The last array must have 4 elements, the last element must be the user id');
        }


        foreach ($data as $row) {

            //==== get self/current table params
            $self       = array_splice($row, 0, 1);
            $self_keys  = array_keys($self)[0];
            $self_arr   = explode('.', $self_keys);
            $self_table = $self_arr[0];
            $self_field = $self_arr[1];
            $self_value = $self[$self_keys];

            if ($next_self_value) {
                $self_value = $next_self_value;
            }

            //var_dump($self_table, $self_field, $self_value);

            $fk_field = array_splice($row, 0, 1)[0];

            //==== get parent table params
            $parent       = array_splice($row, 0, 1)[0];
            $parent_arr   = explode('.', $parent);
            $parent_table = $parent_arr[0];
            $parent_field = $parent_arr[1];

            //var_dump($parent_table, $parent_field);

            $self_row = $CI->db->select($self_field . ', ' . $fk_field)
                            ->where($self_field, $self_value)
                            ->get($self_table)->row();
            //var_dump($self_field, $fk_field,$self_value,$self_table);

            if ($self_row) {
                $parent_value = $self_row->{$fk_field};

                if ($row) {
                    $user_id = $row[0];
                    $CI->db->where('id', $user_id);
                }
                $parent_row = $CI->db->select($parent_field)->where($parent_field, $parent_value)->get($parent_table)->row();

                if ($parent_row && $self_row->{$fk_field} == $parent_row->{$parent_field}) {
                    //===== okay continue
                    $next_self_value = $parent_value;
                } else {
                    return ['error' => 1, 'status' => false, 'message' => 'Id mismatch'];
                }
            } else {
                return ['error' => 1, 'status' => false, 'message' => 'Id mismatch'];
            }
        }
        return true;
    }

}

function toDateTime($unix) {
    return date('Y-m-d H:i:s', $unix);
}

function getOrganizationsIds($user_id) {
    $CI = & get_instance();

    $result = $CI->db->select('ch_id')
                    ->from('church_detail')
                    ->where('client_id', $user_id)
                    ->where('trash', 0)
                    ->get()->result_array();

    if ($result) {
        $ids = implode(',', array_column($result, 'ch_id'));        
    } else {
        $ids = 0;
        
    }
    
    return $ids;
}

function get_client_ip_from_trusted_proxy() {
    return $_SERVER['REMOTE_ADDR'];

    //===== in normal conditition HTTP_X_FORWARDED_FOR is not a reliable variable for getting the client ip
    /*
      if(!empty($_SERVER[ 'HTTP_X_FORWARDED_FOR' ])) {
      $HTTP_X_FORWARDED_FOR_LIST = explode(',', $_SERVER[ 'HTTP_X_FORWARDED_FOR' ]);
      //===== HTTP_X_FORWARDED_FOR could give us several ips separated by comas, with take the last one
      $remote_addr = trim(end($HTTP_X_FORWARDED_FOR_LIST));
      } else {
      $remote_addr = $_SERVER[ 'REMOTE_ADDR' ];
      }

      return $remote_addr;
     */
}

function custom_sort_desc_created($a, $b) {
    return $a["created"] < $b["created"];
}

function custom_sort_desc_id($a, $b) {
    return $a["id"] < $b["id"];
}

function custom_sort_desc_created_ts($a, $b) {
    return $a["created_ts"] < $b["created_ts"];
}

function is_valid_domain_name($domain_name) {
    return (preg_match("/^([a-zd](-*[a-zd])*)(.([a-zd](-*[a-zd])*))*$/i", $domain_name) //valid characters check
            && preg_match("/^.{1,253}$/", $domain_name) //overall length check
            && preg_match("/^[^.]{1,63}(.[^.]{1,63})*$/", $domain_name) ); //length of every label
}

function validateRecaptcha($token, $action) {

    if (RECAPTCHA_ENABLED == false) {
        return ['status' => true, 'result' => []];
    }

    $url           = "https://www.google.com/recaptcha/api/siteverify";
    $recaptchaData = [
        'secret'   => RECAPTCHA_SECRET_KEY,
        'response' => $token,
        'remoteip' => get_client_ip_from_trusted_proxy()
    ];

    $options = [
        'http' => [
            'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
            'method'  => 'POST',
            'content' => http_build_query($recaptchaData)
        ]
    ];

    $context  = stream_context_create($options);
    $response = file_get_contents($url, false, $context);

    $result = json_decode($response, true);

    if ($result['success'] == true && $result['action'] == $action) {
        if ($result['score'] >= RECAPTCHA_THRESHOLD) {
            return ['status' => true, 'result' => $result];
        }
    }

    return ['status' => false, 'result' => $result];
}

function exports_data_csv($name,$data){
    header("Content-type: application/csv");
    header("Content-Disposition: attachment; filename=\"".$name.".csv\"");
    header("Pragma: no-cache");
    header("Expires: 0");

    $handle = fopen('php://output', 'w');

    foreach ($data as $data) {
        fputcsv($handle, $data);
    }
    fclose($handle);
    exit;
}

function permissionClassHide($ep) {

    $CI = & get_instance();

    if ($CI->session->userdata('is_child') === TRUE) { //evaluate is team member only

        $current_endpoint = $ep;
        $permissions_arr  = $CI->session->userdata('permissions');
 
        $CI->load->model('setting_model');
       
        if ($CI->setting_model->SYSTEM_LETTER_ID == 'L') {
            $name_module_tree = MODULE_TREE;
        } 
        if ($CI->setting_model->SYSTEM_LETTER_ID == 'H') {
            $name_module_tree = MODULE_TREE_COACH;
        }
        foreach ($name_module_tree as $row) {
            foreach ($row['endpoints'] as $endpoint) { //===== loop through elements that need observance
                if (strtolower($endpoint) == strtolower($current_endpoint)) { //===== endpoint need to be observed
                    foreach ($permissions_arr as $permission_id) {
                        if ($permission_id == $row['id']) { //===== if member permission is found in array do not hide
                            return '';
                        }
                    }
                }
            }
        }
        return 'permission-hide';
    }
    return '';
}

function permissionClassHideGroup($eps){
    $CI = & get_instance();

    if ($CI->session->userdata('is_child') === TRUE) {

        $permissions_arr = $CI->session->userdata('permissions');
        $CI->load->model('setting_model');
        
        if ($CI->setting_model->SYSTEM_LETTER_ID == 'L') {
            $name_module_tree = MODULE_TREE;
        }
        if ($CI->setting_model->SYSTEM_LETTER_ID == 'H') {
            $name_module_tree = MODULE_TREE_COACH;
        }
        foreach ($name_module_tree as $row) {
            foreach ($row['endpoints'] as $endpoint) { //===== loop through endpoints that need observance
                if (in_array(strtolower($endpoint), $eps)) { //===== endpoint need to be observed
                    foreach ($permissions_arr as $permission_id) {
                        if ($permission_id == $row['id']) {
                            return ''; //if at least one endpoint is allowed do not hide
                        }
                    }
                }
            }
        }
        return 'permission-hide';
    }
    
}

function slugify($string){
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string), '-'));
}

function isValidDate($date) {
    return (bool) strtotime($date);
}

function trimLR_Duplicates($text) { //remove left and righ blank spaces, remove duplicated blank spaces
    return preg_replace('/\s+/', ' ', trim($text));    
}

function getCardFullYear($year){
    return substr(date('Y'),0,2).$year;
}

function stringifyFormatErrors($error_arr, $delimiters = ['<p>', '</p>']) {

    $error_string = '';

    foreach ($error_arr as $error) {
        $error_string .= $delimiters[0] . $error . $delimiters[1];
    }
    
    return $error_string;
}

function setMultiFundDistrFeeCovered($fund_data, $transactionData) {

    $fundTotalAmount = $transactionData['total_amount'] - $transactionData['fee']; //the summatory of funds conceived without fees
    foreach ($fund_data as &$fundRow) {
        $fundRow['_fund_sub_total_amount'] = $fundRow['fund_amount']; //net                    

        $perRelation          = $fundRow['fund_amount'] / $fundTotalAmount; //the fund_amount comming conceived without fee
        $fundRow['_fund_fee'] = round($transactionData['fee'] * $perRelation, 4); //discover fund fee by using the prior relation

        $fundRow['_fund_amount'] = round($fundRow['_fund_sub_total_amount'] + $fundRow['_fund_fee'], 4); //total fund amount
    }

    return $fund_data;
}

//proceed to discount fees on funds proportionally
function setMultiFundDistrFeeNotCovered($fund_data, $transactionData) {

    $fundTotalAmount = $transactionData['total_amount']; //the summatory of funds conceived with the fee

    foreach ($fund_data as &$fundRow) {

        $fundRow['_fund_amount'] = $fundRow['fund_amount']; //fund_amount (total fund amount) conceived with fee

        $perRelation          = $fundRow['fund_amount'] / $fundTotalAmount; //the fund amount comming conceived including the fee
        $fundRow['_fund_fee'] = round($transactionData['fee'] * $perRelation, 4); //discover fund fee by using the prior relation

        $fundRow['_fund_sub_total_amount'] = round($fundRow['_fund_amount'] - $fundRow['_fund_fee'], 2); //net                                        
    }

    return $fund_data;
}

define('LOG_CUSTOM_ERROR', 'ERROR');
define('LOG_CUSTOM_INFO', 'INFO');
define('LOG_CUSTOM_DEBUG', 'DEBUG');

function log_custom($type, $message) {
    
    require_once APPPATH . 'controllers/extensions/MyLogger.php';
    
    $level = 0;

    if ($type == LOG_CUSTOM_ERROR) {
        $level = 1;
    }

    if ($type == LOG_CUSTOM_DEBUG) {
        $level = 2;
    }

    if($type == LOG_CUSTOM_INFO) {
        $level = 3;
    }

    $myLogger = new MyLogger($level);

    $myLogger->write_log($type, $message);

    //destroy Logger
    unset($myLogger);
    
}

function amountToInteger($amount) {
    return (int) round($amount * 100); //convert to cents, multiplying per 100 can be a problem with float numbers so we round it before cast to int
}

function splitFirstAndLastName($fullName) {
    
    // Trim spaces from left and right, and replace multiple spaces with a single space
    $cleanedName = preg_replace('/\s+/', ' ', trim($fullName));

    // Split the cleaned name into parts
    $parts = preg_split('/\s+/', $cleanedName);

    // Check if there's more than one word
    if (count($parts) > 1) {
        // First word is the first name
        $firstName = ucfirst(strtolower($parts[0]));

        // Remaining words are the last name
        $lastName = implode(' ', array_slice($parts, 1));
        $lastName = ucfirst(strtolower($lastName));
    } else {
        // If only one word is provided, treat it as first name
        $firstName = ucfirst(strtolower($parts[0]));
        $lastName = '';  // No last name in this case
    }

    return [
        'first_name' => $firstName,
        'last_name' => $lastName
    ];
}

function getFileVersion($url) {

    $position = strpos($url, "assets/");

    // If "assets/" is found, extract the rest of the string
    if ($position !== false) {
        $result = substr($url, $position + strlen("assets/"));
        $fileIndex = $result;
    }
    $file = FCPATH . 'application/assets-versioning/file.json';
    $fileContent = file_get_contents($file);
    $fileData = json_decode($fileContent, true);

    if (isset($fileData[$fileIndex])) {
        return $url . '?fv=' . $fileData[$fileIndex];
    } else {
        return $url . '?fv=not_found';
    }
}

/**
 * Validate the Bearer token in the Authorization header
 * @param string $yourBearerToken The expected Bearer token
 * @return array An array containing the validation result
 */
function validateBearerToken($yourBearerToken) {
    // Check if the Authorization header is provided by the client.    
    $authHeader = isset(get_headers_safe()['authorization']) ? get_headers_safe()['authorization'] : null;
    
    if (!$authHeader) {
        // If the Authorization header is missing, return an error response with HTTP 401 Unauthorized.
        return [
            'error' => true,
            'message' => 'Authentication required',
            'http_code' => 401
        ];
    } else {
        // Extract the Bearer token from the Authorization header
        if (preg_match('/^Bearer\s(.+)$/', $authHeader, $matches)) {
            $token = $matches[1];

            // Verify the Bearer token (replace with your own token validation logic)
            if ($token === $yourBearerToken) {
                // Valid token, authorized access
                return [
                    'error' => false,
                    'message' => 'Authorized',
                    'http_code' => 200
                ];
            } else {
                // Invalid token
                return [
                    'error' => true,
                    'message' => 'Unauthenticated',
                    'http_code' => 401
                ];
            }
        } else {
            // If the header is not in the correct format
            return [
                'error' => true,
                'message' => 'Incorrect Authorization header format',
                'http_code' => 400
            ];
        }
    }
}

/**
 * Get all headers case-insensitively.
 *
 * @return array An associative array of headers (all lowercase).
 */
function get_headers_safe() {
    
    $headers = getallheaders();
       
    // Normalize headers to lowercase
    $normalized_headers = [];
    foreach ($headers as $key => $value) {
        // Convert header name to lowercase and preserve the value
        $normalized_headers[strtolower($key)] = $value;
    }

    return $normalized_headers;
}