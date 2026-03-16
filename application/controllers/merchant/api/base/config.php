<?php

defined('BASEPATH') or exit('No direct script access allowed');

/**
 * Config class 
 */
class Api_base_config
{
    const EXEMPT_ROUTES = [  // Exempt auth routes from auth checks
        'auth/generate_credentials',
        'customer/validate_token_link',
        'health/index'
    ];
}
