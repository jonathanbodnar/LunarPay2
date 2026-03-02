<?php

if (!function_exists('simpleCurl')) {

    function simpleCurl($url, $type = 'post', $data, $json = false) {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        if ($type == 'post') {
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }

        if ($json) {
            $request_headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
        }

        $result = curl_exec($ch);

        if (curl_errno($ch)) {
            curl_close($ch);
            return ['error' => 1, 'response' => 'Network error'];
        } else {
            $result = json_decode($result);
            curl_close($ch);
            return ['error' => 0, 'response' => $result];
        }

        return $result;
    }

}


if (!function_exists('bearerCurl')) {

    function bearerCurl($access_token, $url, $type = 'post', $enc_body = null, $debug = false) {
        $type = strtolower($type);

        $request_headers   = [];
        $request_headers[] = 'Authorization: Bearer ' . $access_token;
        $request_headers[] = 'Content-Type: application/json';

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        if ($type == 'post') {
            $bodyString        = $enc_body;
            $request_headers[] = 'Content-Length: ' . strlen($bodyString);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($type == 'patch') {
            $bodyString        = $enc_body;
            $request_headers[] = 'Content-Length: ' . strlen($bodyString);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        } elseif ($type == 'delete') {
            $bodyString        = $enc_body;
            $request_headers[] = 'Content-Length: ' . strlen($bodyString);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyString);
        }

        if ($debug == true) {
            //d($url, false);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 1);

        $headers = [];
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$headers) {
            $len    = strlen($header);
            $header = explode(':', $header, 2);
            if (count($header) < 2) // ignore invalid headers
                return $len;

            $headers[strtolower(trim($header[0]))][] = trim($header[1]);

            return $len;
        });

        $result = curl_exec($ch);

        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $result      = substr($result, $header_size);

        if (curl_errno($ch)) {
            print "Error: " . curl_error($ch);
            return ['error' => 1, 'response' => 'Network error'];
        } else {
            $result = json_decode($result);
            curl_close($ch);
            return ['error' => 0, 'response' => $result, 'headers' => $headers];
        }
    }

}

if (!function_exists('handleResponse')) {

//======= returns standarized statused with message, when replay is true it means the function must be called again
//======= as the error was because of limit of request has been exeeded
    function handleResponse($response) {

        if (!isset($response['error'])) {
            return ['status' => false, 'message' => 'Unexpected error'];
        }

        if ($response['error'] == 1) {
            return ['status' => false, 'message' => $response['response']];
        }
        
        $wait_seconds = 20;
        if (isset($response['response']->errors)) {

            $message = '';
            foreach ($response['response']->errors as $error) {
                if (isset($error->code) && $error->code == '429') { //LIMIT REACHED                    
                    log_message("error", "_INFO_LOG 1. PLANNING CENTER LIMIT REACHED REPLAY TRUE WAIT $wait_seconds SECONDS " . date("Y-m-d H:i:s"));
                    log_message("error", "_INFO_LOG PLANNING CENTER RESPONSE " . json_encode($response) . " " . date("Y-m-d H:i:s"));
                    sleep($wait_seconds);
                    return ['status' => true, 'replay' => true];
                } else{
                    log_message("error", "_INFO_LOG PLANNING ERROR " . json_encode($response) . " " . date("Y-m-d H:i:s"));
                }

                $message .= $error->detail . ' |';
            }

            return ['status' => false, 'message' => $message];
        }

        if ($response['headers']['x-pco-api-request-rate-count'] >= $response['headers']['x-pco-api-request-rate-limit']) {
            log_message("error", "_INFO_LOG 2. PLANNING CENTER WAIT FOR NEXT REQUEST $wait_seconds SECONDS " . date("Y-m-d H:i:s"));
            log_message("error", "_INFO_LOG PLANNING CENTER RESPONSE " . json_encode($response) . " " . date("Y-m-d H:i:s"));
            sleep($wait_seconds);
            return ['status' => true, 'replay' => false];
        }

        return ['status' => true, 'replay' => false];
    }

}