<?php

trait ValidationTrait
{
    protected function validateRequired($fields, $data = null)
    {
        $data = $data ?: $this->requestData;
        $missing = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        if (!empty($missing)) {
            $this->sendValidationError(
                ['missing_fields' => $missing],
                'Required fields are missing: ' . implode(', ', $missing)
            );
        }
        return true;
    }
    protected function validateJsonInput()
    {
        $input_json = @file_get_contents('php://input');
        if (empty($input_json)) {
            $this->sendError('Request body is empty', HTTP_Constants::HTTP_BAD_REQUEST);
            return false;
        }
        json_decode($input_json);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendError('Invalid JSON format: ' . json_last_error_msg(), HTTP_Constants::HTTP_BAD_REQUEST);
            return false;
        }
        return true;
    }
} 