<?php

trait RequestTrait
{
    protected function parseRequestData()
    {
        $data = [];
        switch ($this->requestMethod) {
            case 'GET':
                $data = $_GET;
                break;
            case 'POST':
            case 'PUT':
            case 'PATCH':
            case 'DELETE':
                $input_json = @file_get_contents('php://input');
                if (!empty($input_json)) {
                    $json_data = json_decode($input_json, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($json_data)) {
                        $data = $json_data;
                    } else {
                        parse_str($input_json, $parsed_data);
                        $data = $parsed_data ?: [];
                    }
                }
                if (empty($data) && $this->requestMethod === 'POST') {
                    $data = $_POST;
                }
                break;
        }
        return $data;
    }
    protected function getRequestHeaders()
    {
        return get_headers_safe();
    }
    protected function getHeader($name)
    {
        $headers = array_change_key_case($this->headers, CASE_LOWER);
        $name = strtolower($name);
        return isset($headers[$name]) ? $headers[$name] : null;
    }
    protected function getRequestData()
    {
        return $this->requestData;
    }
    protected function getRawInput()
    {
        return @file_get_contents('php://input');
    }
    protected function getJsonInput()
    {
        $input_json = @file_get_contents('php://input');
        if (empty($input_json)) {
            return null;
        }
        $decoded = json_decode($input_json, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }
        return $decoded;
    }
    protected function isJsonRequest()
    {
        $input_json = @file_get_contents('php://input');
        if (empty($input_json)) {
            return false;
        }
        json_decode($input_json);
        return json_last_error() === JSON_ERROR_NONE;
    }
    protected function getInput($key, $default = null)
    {
        return isset($this->requestData[$key]) ? $this->requestData[$key] : $default;
    }
    protected function hasInput($key)
    {
        return isset($this->requestData[$key]);
    }
    protected function getInputs($keys)
    {
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->getInput($key);
        }
        return $result;
    }
} 