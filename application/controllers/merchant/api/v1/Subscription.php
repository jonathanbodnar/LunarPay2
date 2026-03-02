<?php

defined('BASEPATH') or exit('No direct script access allowed');

require_once APPPATH . 'controllers/merchant/api/base/Api_base_controller.php';

class Subscription extends Api_base_controller
{

    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Get subscription by ID
     * GET /subscription/by-id/{id}
     */
    public function by_id($id = null)
    {
        if ($this->getRequestMethod() !== 'GET') {
            return $this->sendMethodNotAllowed(['GET']);
        }

        if (!$id) {
            return $this->sendValidationError(['id' => 'Subscription ID is required']);
        }

        try {
            $this->load->model('subscription_model');
            $this->load->model('donor_model');
            $this->load->library('gateways/FortisLib');
            $user = $this->getUser();
            
            $clientId = $user->client_id;
            
            // Get subscription by ID
            $subscription = $this->subscription_model->getById($id);
            
            if (!$subscription) {
                return $this->sendError('Subscription not found', 404);
            }

            // Verify subscription belongs to authenticated organization
            $customer = $this->donor_model->getById($subscription->account_donor_id, null, $clientId);
            if (!$customer) {
                return $this->sendError('Subscription not found', 404);
            }

            // Convert subscription object to array for FortisLib method
            $subscription_data = (array) $subscription;

            $this->load->helper('crypt');            
            $slug = null;
            if(IS_DEVELOPER_MACHINE) {
                $slug = $subscription->church_id; //merchantSlugEncode($orgId);
            } else {
                $slug = merchantSlugEncode($subscription->church_id);
            }
            $customerPortalUrl = BASE_URL . 'customer-hub/' . $slug;
            
            // Format response
            $response = [
                'customer_id' => $subscription->account_donor_id,
                'subscription_id' => $subscription->id,
                'plan_type' => $this->getPlanType($subscription_data['payment_link_products_id']),
                'billing_cycle' => $subscription->frequency,
                'status' => $subscription->status,
                'c_status' => $subscription->c_status,
                'amount' => (float) $subscription->amount,
                'next_payment_on' => $subscription->next_payment_on,
                'ends_at' => $subscription->ends_at,
                'trial_ends_at' => $subscription_data['trial_ends_at'], // Will be set if this is a trial subscription
                'trial_status' => $subscription_data['trial_status'],
                'access_period_status' => $subscription_data['access_period_status'],
                'created_as_trial' => $subscription_data['created_as_trial'],
                'start_on' => $subscription->start_on,
                'customer_email' => $customer->email,
                'customer_name' => $customer->first_name . ' ' . $customer->last_name,
                'payment_method' => $subscription->payment_method ?? 'credit_card',
                'last_digits' => $subscription->last_digits ?? null,
                'product' => isset($subscription->_product) ? $subscription->_product : null,
                'created_at' => $subscription->created_at,
                'updated_at' => $subscription->updated_at,
                'cancelled_at' => $subscription->cancelled_at,
                'urls' => [
                    'customer_portal' => $customerPortalUrl
                ]
            ];

            $this->sendSuccess($response);
        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    /**
     * Get plan name from subscription data using existing FortisLib method
     */
    private function getPlanType($payment_link_products_id)
    {   
        $this->load->library('gateways/FortisLib');
        $fortisLib = new FortisLib();
        return $fortisLib->getPlanType($payment_link_products_id);
    }
} 