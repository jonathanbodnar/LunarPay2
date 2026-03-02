<?php //test git

defined('BASEPATH') OR exit('No direct script access allowed');

/* ----- EPICPAY FEES ----- */

define("EPICPAY_TPL_CHURCHBASE_CC_P", 0.029);
define("EPICPAY_TPL_CHURCHBASE_CC_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE_BNK_P", 0.01);
define("EPICPAY_TPL_CHURCHBASE_BNK_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE_NAME", "AB29030");

define("EPICPAY_TPL_CHURCHBASE2_CC_P", 0.02);
define("EPICPAY_TPL_CHURCHBASE2_CC_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE2_BNK_P", 0.02);
define("EPICPAY_TPL_CHURCHBASE2_BNK_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE2_NAME", "ActiveBase2");

define("EPICPAY_TPL_CHURCHBASE3_CC_P", 0.0215);
define("EPICPAY_TPL_CHURCHBASE3_CC_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE3_BNK_P", 0.0215);
define("EPICPAY_TPL_CHURCHBASE3_BNK_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE3_NAME", "ActiveBase3");

define("EPICPAY_TPL_CHURCHBASE4_CC_P", 0.023);
define("EPICPAY_TPL_CHURCHBASE4_CC_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE4_BNK_P", 0.023);
define("EPICPAY_TPL_CHURCHBASE4_BNK_K", 0.3);
define("EPICPAY_TPL_CHURCHBASE4_NAME", "ActiveBase4");

define("EPICPAY_TPL_DEFAULT", "ActiveBase4");

defined('EPICPAY_ONBOARD_FORM_TEST') OR define('EPICPAY_ONBOARD_FORM_TEST', TRUE);
/* --- END EPICPAY FEES --- */

require_once('fortis_constants.php');

require_once('paysafe_settings.php');

//SINGLE USE TOKEN API KEYS - IT'S PUBLIC, PLACED IN THE JAVASCRIPT AS A BASE 64 ENCODE STRING base64(user:pass)
define("PAYSAFE_SINGLE_USE_API_KEY_USER_TEST", "SUT-659760");
define("PAYSAFE_SINGLE_USE_API_KEY_PASS_TEST", "B-qa2-0-6086f824-0-302d02150088e25d58a983542e557698adcdd6527dd8d4d07f02140b61768f4c905526fcb918eea028a900f408272a"); //public, it goes in the javascript

define("PAYSAFE_SINGLE_USE_API_KEY_USER_LIVE", "OT-306132");
define("PAYSAFE_SINGLE_USE_API_KEY_PASS_LIVE", "B-p1-0-60a2ac7d-0-302c02145d412e6dd9dd3e7d1a25345583a524a40d06252b021438cfc4ce1e382a66bd8bf3358a3c5f1831c38e01"); //public, it goes in the javascript
//////////////

defined('SET_SAME_SITE_NONE') OR define('SET_SAME_SITE_NONE', FALSE);

//=================
defined('ZAPIER_ENABLED') OR define('ZAPIER_ENABLED', FALSE);
defined('EMAILING_ENABLED') OR define('EMAILING_ENABLED', FALSE);
defined('CODEIGNITER_SMTP_USER') OR define('CODEIGNITER_SMTP_USER', '');
defined('CODEIGNITER_SMTP_PASS') OR define('CODEIGNITER_SMTP_PASS', '');
defined('MAILGUN_DOMAIN') OR define('MAILGUN_DOMAIN', ''); //========== https://app.mailgun.com/app/domains
defined('MAILGUN_API_KEY') OR define('MAILGUN_API_KEY', ''); //========== https://app.mailgun.com/app/domains

define('PROVIDER_EMAIL_CODEIGNITER', 1);
define('PROVIDER_EMAIL_MAILGUN', 2);
define('PROVIDER_EMAIL_DEFAULT', PROVIDER_EMAIL_CODEIGNITER);

define('PROVIDER_MESSENGER_TWILIO', 1);
define('PROVIDER_MESSENGER_DEFAULT', PROVIDER_MESSENGER_TWILIO);
define('PROVIDER_MAIN_PHONE', '+14694847773');

define('TWILIO_AVAILABLE_COUNTRIES_NO_CREATION', [
        'US' => [
            'name' => 'United States',
            'code' => 1
        ],
        'CA' => [
            'name' => 'Canada',
            'code' => 1
        ],
        'GB' => [
            'name' => 'United Kingdom',
            'code' => 44
        ],
        'BE' => [
            'name' => 'Belgium',
            'code' => 32
        ],
        'FR' => [
            'name' => 'France',
            'code' => 33
        ],
        'SE' => [
            'name' => 'Sweden',
            'code' => 46
        ],
        'VI' => [
            'name' => 'Virgin Islands, U.S.',
            'code' => 1340
        ]
    ]);

define('PROVIDER_PAYMENT_EPICPAY', 1);
define('PROVIDER_PAYMENT_PAYSAFE', 2);
define('PROVIDER_PAYMENT_ETH', 3);

define('PROVIDER_PAYMENT_FORTIS', 4);
define('PROVIDER_PAYMENT_DEFAULT', PROVIDER_PAYMENT_FORTIS);

define('PROVIDER_PAYMENT_EPICPAY_SHORT', 'EPP');
define('PROVIDER_PAYMENT_PAYSAFE_SHORT', 'PSF');
define('PROVIDER_PAYMENT_ETH_SHORT', 'ETH');
define('PROVIDER_PAYMENT_FORTIS_SHORT', 'FTS');


defined('COMPANY_NAME') OR define('COMPANY_NAME', 'LunarPay');
defined('COMPANY_SITE') OR define('COMPANY_SITE', 'LunarPay.com');

define("PAYSAFE_NETBANX_URL", "https://login.netbanx.com/office/public/preLogin.htm");
define("PAYSAFE_NETBANX_EMAIL_SUBJECT_MERCHANT_ACCOUNTS_ENABLED", "Your " . COMPANY_NAME . " account is ready for receiving payments!");
define("PAYSAFE_NETBANX_EMAIL_SUBJECT", COMPANY_NAME . " - Paysafe Backoffice Access");

define('FOOTER_TEXT_YEAR_ONLY', '@');
define('FOOTER_TEXT', FOOTER_TEXT_YEAR_ONLY . ' ' . COMPANY_NAME);

define("FORTIS_EMAIL_SUBJECT_MERCHANT_ACCOUNT_ACTIVE", "Your " . COMPANY_NAME . " account is ready for receiving payments!");

define('FILES_URL', BASE_URL . 'files/get/');

///// check this, probably we don't need this
if (BASE_URL === "https://app.lunarpay.com/") {
    define('SHORT_BASE_URL', 'https://lunarpay.me/');
} elseif (BASE_URL === "https://devapp.lunarpay.com/") {
    define('SHORT_BASE_URL', 'https://devwidget.lunarpay.com/');
} else {
    define('SHORT_BASE_URL', BASE_URL);
}
///////////////////////////////////////////

//If there is not defined the customer's APP base url just put the current base_url, it will work for devs
defined('CUSTOMER_APP_BASE_URL') OR define('CUSTOMER_APP_BASE_URL', BASE_URL);

//USED FOR HANDLING MANY DOMAINS WITHIN THE SAME BASE WEB APP (DASHBOARD, CUSTOMER, ETC)
//IF IS DEVELOPER MACHINE ALL SYSTEMS WILL DEPEND ON THE LOCAL MACHINE BASE URL
//IF IS NOT DEVELOPER MACHINE ALL SYSTEMS WILL DEPEND ON THEIR DOMAIN - CHECK MY_CUSTOMER.PHP AND MY_CONTROLLER.PHP
defined('IS_DEVELOPER_MACHINE') OR define('IS_DEVELOPER_MACHINE', TRUE);

//====== GOOD BARBER
define('GOODBARBER_APPS_DOMAIN', 'myappbuilder.io');
defined('GOODBARBER_APP_WITH_ORGNX') OR define('GOODBARBER_APP_WITH_ORGNX', TRUE); //==== Create app only if there is an orgnx verified
//===== RECAPTCHA
defined('RECAPTCHA_ENABLED') OR define('RECAPTCHA_ENABLED', FALSE);
defined('RECAPTCHA_SECRET_KEY') OR define('RECAPTCHA_SECRET_KEY', '');
defined('RECAPTCHA_PUBLIC_KEY') OR define('RECAPTCHA_PUBLIC_KEY', '');
defined('RECAPTCHA_THRESHOLD') OR define('RECAPTCHA_THRESHOLD', 0.6); //===== RECAPTCHA SUCCESS IF SCORE >= THRESHOLD [VALUES BETWEEN 0.1 & 1]
//===== INTERCOM
defined('FORCE_HIDE_INTERCOM') OR define('FORCE_HIDE_INTERCOM', TRUE);

require_once 'module_tree.php';
require_once 'module_tree_coach.php';

date_default_timezone_set("America/Chicago");

define('COUNT_CHAT_ITEMS', 100);
define('DEFAULT_PHONE_CODE', 1);

define('REFERRAL_SHARE_CODE_MESSAGE','Your CoachPay.com account is waiting for you!'
        . '\n\n'
        . 'Your friend [Dashboard-Admin-Name] ([Organization-Name]) has invited you. You can register by clicking the button below.');

//Organization IDS that we want to use as test church, overriden LIVE to TEST environment
defined('TEST_ORGNX_IDS') OR define('TEST_ORGNX_IDS', [5]);

//widget auth var names
define('WIDGET_AUTH_OBJ_VAR_NAME', 'd1a22a6f44f8b11b132a1ea');
define('WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME', 'b25a9b3d0c99f288c');
define('WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME', '564c8d74f693c47f5');

define('BRAND_MAX_LOGO_SIZE', 10000); //KB

defined('PAYSAFE_MIRRORED_SYSTEMS') OR define('PAYSAFE_MIRRORED_SYSTEMS', [
            'lunarpay' => [
                'base_url' => 'http://localhost:3001/lunarpay/'
            ],
            'chatgive' => [
                'base_url' => 'http://localhost:3001/chatgive/'
            ]
        ]);

//just "FROM" title, it does not mean this is the mail where notification emails are triggered necessarely
defined('EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS') OR define('EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS', 'noreply@lunarpay.com');
