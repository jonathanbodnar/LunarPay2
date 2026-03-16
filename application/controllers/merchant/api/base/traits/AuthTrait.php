<?php
// Include traits

use PSpell\Config;

require_once APPPATH . 'controllers/merchant/api/base/traits/ResponseTrait.php';
require_once APPPATH . 'controllers/merchant/api/base/config.php';

trait AuthTrait
{
    use ResponseTrait;

    protected $EXEMPT_PATHS = [
        'auth/generate_crendentials',
    ];

    protected function enforceCredentialAuth()
    {
        $apiKey = null;
        $apiSecret = null;
        $headers = $this->getRequestHeaders();
        if (isset($headers['authorization']) && strpos($headers['authorization'], 'Basic ') === 0) {
            $base64 = substr($headers['authorization'], 6);
            $decoded = base64_decode($base64);
            list($apiKey, $apiSecret) = explode(':', $decoded, 2);
        }
        if (!$apiKey || !$apiSecret) {
            $this->sendUnauthorized('Missing API credentials');
        }
        $this->load->model('api_merchant_credentials_model');
        $credential = $this->api_merchant_credentials_model->findByKey($apiKey);
        if (!$credential) {
            $this->sendUnauthorized('Invalid API key');
        }
        if (!password_verify($apiSecret, $credential->api_secret_hash)) {
            $this->sendUnauthorized('Invalid API secret');
        }
        unset($credential->api_secret_hash);
        
        $this->currentUser = $credential;
    }
    public function getUser() {
        return $this->currentUser;
    }
    protected function isAuthExempt()
    {
        $exemptPaths = Api_base_config::EXEMPT_ROUTES;
        $path = strtolower($this->router->fetch_class() . '/' . $this->router->fetch_method());
        return in_array($path, $exemptPaths);
    }
} 