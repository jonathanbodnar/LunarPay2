<?php
defined('BASEPATH') or exit('No direct script access allowed');

require_once 'application/libraries/email/EmailProvider.php';

class AdminNotifier
{
    public static function onUserRegistration($userData, $toEmail = false)
    {
        $formatted = [
            'first_name'      => ucwords(strtolower($userData['first_name'] ?? '')),
            'last_name'       => ucwords(strtolower($userData['last_name'] ?? '')),
            'email'           => $userData['email'] ?? '',
            'phone'           => $userData['phone'] ?? '',
            'organization'    => ucwords(strtolower($userData['organization'] ?? '')),
            'organization_id' => $userData['organization_id'] ?? null,
        ];

        self::notify('New merchant', 'New merchant', $formatted, $toEmail);
    }

    public static function onOnboardBankSent($formData, $toEmail = false)
    {        
        //make formData as an array
        $formData = (array) $formData;
        self::notify('Onboard Bank Step Completed', 'Onboard Bank Step Completed, MPA Link available. Waiting for approval.', $formData, $toEmail);
    }

    public static function onOnboardWebhookReceived($formData, $toEmail = false)
    {
        //makek formData as an array
        $formData = (array) $formData;
        self::notify('Onboard Webhook Received', 'Onboard Webhook Received', $formData, $toEmail);
    }

    private static function notify(string $eventLabel, string $eventDescription, $data, $toEmail = false)
    {

        $CI = &get_instance();

        // Send to Zapier if enabled
        if (defined('ZAPIER_ENABLED') && ZAPIER_ENABLED) {
            $CI->load->library('curl');
            $url = 'https://hooks.zapier.com/hooks/catch/8146183/ok8qggk/';
            $CI->curl->post($url, $data);
        }

        // Send via email if requested
        if ($toEmail) {
            $toArray = is_array($toEmail) ? $toEmail : [$toEmail];

            $data_json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

            if ($data_json === false) {
                $data_json = 'JSON encoding error: ' . json_last_error_msg();
            }            
            
            $subject = COMPANY_NAME . " notification: $eventLabel " . (isset($data['email']) ? ' - ' . $data['email'] : '');
            $message = "<pre>" . COMPANY_NAME . " notification: $eventDescription</pre><pre>$data_json</pre>";

            $message .= "<pre><a href='" . rtrim(BASE_URL, '/') . "'>" . rtrim(BASE_URL, '/') . "</a></pre>";

            foreach ($toArray as $to) {
                EmailProvider::getInstance()->sendEmail(
                    EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS,
                    COMPANY_NAME . ' Backend Notification',
                    $to,
                    $subject,
                    $message
                );
            }
        }
    }
}
