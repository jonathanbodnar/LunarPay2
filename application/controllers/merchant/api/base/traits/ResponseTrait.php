<?php

trait ResponseTrait
{
    protected function output($data = null, $httpCode = HTTP_Constants::HTTP_OK, $message = null, $meta = [])
    {
        http_response_code($httpCode);
        $response = [
            'success' => HTTP_Constants::isSuccessCode($httpCode),
            'code' => $httpCode,
            'message' => $message ?: HTTP_Constants::getStatusMessage($httpCode),
            'data' => $data
        ];
        if (!empty($meta)) {
            $response['meta'] = $meta;
        }
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
    protected function sendSuccess($data = null, $message = null, $httpCode = HTTP_Constants::HTTP_OK, $meta = [])
    {
        $this->output($data, $httpCode, $message, $meta);
    }
    protected function sendError($errors, $message = 'Error')
    {
        if(is_string($errors)) {
            $errors = [$errors];
        }
        $this->output($errors, HTTP_Constants::HTTP_BAD_REQUEST, $message);
    }
    protected function sendValidationError($errors, $message = 'Validation failed')
    {
        if(is_string($errors)) {
            $errors = [$errors];
        }
        $this->output($errors, HTTP_Constants::HTTP_UNPROCESSABLE_ENTITY, $message);
    }
    protected function sendNotFound($message = 'Resource not found')
    {
        $this->output(null, HTTP_Constants::HTTP_NOT_FOUND, $message);
    }
    protected function sendUnauthorized($message = 'Unauthorized access')
    {
        $this->output(null, HTTP_Constants::HTTP_UNAUTHORIZED, $message);
    }
    protected function sendForbidden($message = 'Access forbidden')
    {
        $this->output(null, HTTP_Constants::HTTP_FORBIDDEN, $message);
    }
    protected function sendMethodNotAllowed($allowedMethods = [])
    {
        if (!empty($allowedMethods)) {
            header('Allow: ' . implode(', ', $allowedMethods));
        }
        $this->output(null, HTTP_Constants::HTTP_METHOD_NOT_ALLOWED, 'Method not allowed');
    }
} 