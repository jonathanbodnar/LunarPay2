<?php

defined('BASEPATH') or exit('No direct script access allowed');

/**
 * HTTP Status Code Constants
 * Centralized constants for HTTP status codes used throughout the application
 */
class HTTP_Constants
{
    // 1xx Informational
    const HTTP_CONTINUE = 100;
    const HTTP_SWITCHING_PROTOCOLS = 101;
    const HTTP_PROCESSING = 102;

    // 2xx Success
    const HTTP_OK = 200;
    const HTTP_CREATED = 201;
    const HTTP_ACCEPTED = 202;
    const HTTP_NON_AUTHORITATIVE_INFORMATION = 203;
    const HTTP_NO_CONTENT = 204;
    const HTTP_RESET_CONTENT = 205;
    const HTTP_PARTIAL_CONTENT = 206;
    const HTTP_MULTI_STATUS = 207;
    const HTTP_ALREADY_REPORTED = 208;
    const HTTP_IM_USED = 226;

    // 3xx Redirection
    const HTTP_MULTIPLE_CHOICES = 300;
    const HTTP_MOVED_PERMANENTLY = 301;
    const HTTP_FOUND = 302;
    const HTTP_SEE_OTHER = 303;
    const HTTP_NOT_MODIFIED = 304;
    const HTTP_USE_PROXY = 305;
    const HTTP_TEMPORARY_REDIRECT = 307;
    const HTTP_PERMANENTLY_REDIRECT = 308;

    // 4xx Client Errors
    const HTTP_BAD_REQUEST = 400;
    const HTTP_UNAUTHORIZED = 401;
    const HTTP_PAYMENT_REQUIRED = 402;
    const HTTP_FORBIDDEN = 403;
    const HTTP_NOT_FOUND = 404;
    const HTTP_METHOD_NOT_ALLOWED = 405;
    const HTTP_NOT_ACCEPTABLE = 406;
    const HTTP_PROXY_AUTHENTICATION_REQUIRED = 407;
    const HTTP_REQUEST_TIMEOUT = 408;
    const HTTP_CONFLICT = 409;
    const HTTP_GONE = 410;
    const HTTP_LENGTH_REQUIRED = 411;
    const HTTP_PRECONDITION_FAILED = 412;
    const HTTP_REQUEST_ENTITY_TOO_LARGE = 413;
    const HTTP_REQUEST_URI_TOO_LONG = 414;
    const HTTP_UNSUPPORTED_MEDIA_TYPE = 415;
    const HTTP_REQUESTED_RANGE_NOT_SATISFIABLE = 416;
    const HTTP_EXPECTATION_FAILED = 417;
    const HTTP_I_AM_A_TEAPOT = 418;
    const HTTP_UNPROCESSABLE_ENTITY = 422;
    const HTTP_LOCKED = 423;
    const HTTP_FAILED_DEPENDENCY = 424;
    const HTTP_UPGRADE_REQUIRED = 426;
    const HTTP_PRECONDITION_REQUIRED = 428;
    const HTTP_TOO_MANY_REQUESTS = 429;
    const HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE = 431;

    // 5xx Server Errors
    const HTTP_INTERNAL_SERVER_ERROR = 500;
    const HTTP_NOT_IMPLEMENTED = 501;
    const HTTP_BAD_GATEWAY = 502;
    const HTTP_SERVICE_UNAVAILABLE = 503;
    const HTTP_GATEWAY_TIMEOUT = 504;
    const HTTP_VERSION_NOT_SUPPORTED = 505;
    const HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL = 506;
    const HTTP_INSUFFICIENT_STORAGE = 507;
    const HTTP_LOOP_DETECTED = 508;
    const HTTP_NOT_EXTENDED = 510;
    const HTTP_NETWORK_AUTHENTICATION_REQUIRED = 511;

    /**
     * Get status message for HTTP code
     * @param int $code HTTP status code
     * @return string Status message
     */
    public static function getStatusMessage($code)
    {
        $messages = [
            // 1xx
            self::HTTP_CONTINUE => 'Continue',
            self::HTTP_SWITCHING_PROTOCOLS => 'Switching Protocols',
            self::HTTP_PROCESSING => 'Processing',

            // 2xx
            self::HTTP_OK => 'OK',
            self::HTTP_CREATED => 'Created',
            self::HTTP_ACCEPTED => 'Accepted',
            self::HTTP_NON_AUTHORITATIVE_INFORMATION => 'Non-Authoritative Information',
            self::HTTP_NO_CONTENT => 'No Content',
            self::HTTP_RESET_CONTENT => 'Reset Content',
            self::HTTP_PARTIAL_CONTENT => 'Partial Content',
            self::HTTP_MULTI_STATUS => 'Multi-Status',
            self::HTTP_ALREADY_REPORTED => 'Already Reported',
            self::HTTP_IM_USED => 'IM Used',

            // 3xx
            self::HTTP_MULTIPLE_CHOICES => 'Multiple Choices',
            self::HTTP_MOVED_PERMANENTLY => 'Moved Permanently',
            self::HTTP_FOUND => 'Found',
            self::HTTP_SEE_OTHER => 'See Other',
            self::HTTP_NOT_MODIFIED => 'Not Modified',
            self::HTTP_USE_PROXY => 'Use Proxy',
            self::HTTP_TEMPORARY_REDIRECT => 'Temporary Redirect',
            self::HTTP_PERMANENTLY_REDIRECT => 'Permanent Redirect',

            // 4xx
            self::HTTP_BAD_REQUEST => 'Bad Request',
            self::HTTP_UNAUTHORIZED => 'Unauthorized',
            self::HTTP_PAYMENT_REQUIRED => 'Payment Required',
            self::HTTP_FORBIDDEN => 'Forbidden',
            self::HTTP_NOT_FOUND => 'Not Found',
            self::HTTP_METHOD_NOT_ALLOWED => 'Method Not Allowed',
            self::HTTP_NOT_ACCEPTABLE => 'Not Acceptable',
            self::HTTP_PROXY_AUTHENTICATION_REQUIRED => 'Proxy Authentication Required',
            self::HTTP_REQUEST_TIMEOUT => 'Request Timeout',
            self::HTTP_CONFLICT => 'Conflict',
            self::HTTP_GONE => 'Gone',
            self::HTTP_LENGTH_REQUIRED => 'Length Required',
            self::HTTP_PRECONDITION_FAILED => 'Precondition Failed',
            self::HTTP_REQUEST_ENTITY_TOO_LARGE => 'Request Entity Too Large',
            self::HTTP_REQUEST_URI_TOO_LONG => 'Request-URI Too Long',
            self::HTTP_UNSUPPORTED_MEDIA_TYPE => 'Unsupported Media Type',
            self::HTTP_REQUESTED_RANGE_NOT_SATISFIABLE => 'Requested Range Not Satisfiable',
            self::HTTP_EXPECTATION_FAILED => 'Expectation Failed',
            self::HTTP_I_AM_A_TEAPOT => 'I\'m a teapot',
            self::HTTP_UNPROCESSABLE_ENTITY => 'Unprocessable Entity',
            self::HTTP_LOCKED => 'Locked',
            self::HTTP_FAILED_DEPENDENCY => 'Failed Dependency',
            self::HTTP_UPGRADE_REQUIRED => 'Upgrade Required',
            self::HTTP_PRECONDITION_REQUIRED => 'Precondition Required',
            self::HTTP_TOO_MANY_REQUESTS => 'Too Many Requests',
            self::HTTP_REQUEST_HEADER_FIELDS_TOO_LARGE => 'Request Header Fields Too Large',

            // 5xx
            self::HTTP_INTERNAL_SERVER_ERROR => 'Internal Server Error',
            self::HTTP_NOT_IMPLEMENTED => 'Not Implemented',
            self::HTTP_BAD_GATEWAY => 'Bad Gateway',
            self::HTTP_SERVICE_UNAVAILABLE => 'Service Unavailable',
            self::HTTP_GATEWAY_TIMEOUT => 'Gateway Timeout',
            self::HTTP_VERSION_NOT_SUPPORTED => 'HTTP Version Not Supported',
            self::HTTP_VARIANT_ALSO_NEGOTIATES_EXPERIMENTAL => 'Variant Also Negotiates',
            self::HTTP_INSUFFICIENT_STORAGE => 'Insufficient Storage',
            self::HTTP_LOOP_DETECTED => 'Loop Detected',
            self::HTTP_NOT_EXTENDED => 'Not Extended',
            self::HTTP_NETWORK_AUTHENTICATION_REQUIRED => 'Network Authentication Required'
        ];

        return isset($messages[$code]) ? $messages[$code] : 'Unknown Status';
    }

    /**
     * Check if HTTP code is a success code (2xx)
     * @param int $code HTTP status code
     * @return bool True if success code
     */
    public static function isSuccessCode($code)
    {
        return $code >= 200 && $code < 300;
    }
} 