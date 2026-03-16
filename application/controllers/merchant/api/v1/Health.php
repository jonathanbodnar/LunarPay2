<?php

defined('BASEPATH') or exit('No direct script access allowed');

require_once APPPATH . 'controllers/merchant/api/base/Api_base_controller.php';

/**
 * @OA\Info(title="Lunarpay Merchant API", version="1.0.0")
 * @OA\Tag(
 *     name="Health",
 *     description="Health check endpoints"
 * )
 */

class Health extends Api_base_controller
{

    public function __construct()
    {

        parent::__construct();
    }

    /**
 * @OA\Get(
 *     path="/api/users",
 *     tags={"Health"},
 *     summary="Get all users",
 *     @OA\Response(
 *         response=200,
 *         description="List of users"
 *     )
 * )
 */

    public function index()
    {
        if ($this->getRequestMethod() !== 'GET') {
            $this->sendMethodNotAllowed(['GET']);
        }
        
        $this->sendSuccess('Health check successful');        
    }
}
