<?php

defined('BASEPATH') OR exit('No direct script access allowed');

/*
  |--------------------------------------------------------------------------
  | Display Debug backtrace
  |--------------------------------------------------------------------------
  |
  | If set to TRUE, a backtrace will be displayed along with php errors. If
  | error_reporting is disabled, the backtrace will not display, regardless
  | of this setting
  |
 */
defined('SHOW_DEBUG_BACKTRACE') OR define('SHOW_DEBUG_BACKTRACE', TRUE);

/*
  |--------------------------------------------------------------------------
  | File and Directory Modes
  |--------------------------------------------------------------------------
  |
  | These prefs are used when checking and setting modes when working
  | with the file system.  The defaults are fine on servers with proper
  | security, but you may wish (or even need) to change the values in
  | certain environments (Apache running a separate process for each
  | user, PHP under CGI with Apache suEXEC, etc.).  Octal values should
  | always be used to set the mode correctly.
  |
 */
defined('FILE_READ_MODE') OR define('FILE_READ_MODE', 0644);
defined('FILE_WRITE_MODE') OR define('FILE_WRITE_MODE', 0666);
defined('DIR_READ_MODE') OR define('DIR_READ_MODE', 0755);
defined('DIR_WRITE_MODE') OR define('DIR_WRITE_MODE', 0755);

/*
  |--------------------------------------------------------------------------
  | File Stream Modes
  |--------------------------------------------------------------------------
  |
  | These modes are used when working with fopen()/popen()
  |
 */
defined('FOPEN_READ') OR define('FOPEN_READ', 'rb');
defined('FOPEN_READ_WRITE') OR define('FOPEN_READ_WRITE', 'r+b');
defined('FOPEN_WRITE_CREATE_DESTRUCTIVE') OR define('FOPEN_WRITE_CREATE_DESTRUCTIVE', 'wb'); // truncates existing file data, use with care
defined('FOPEN_READ_WRITE_CREATE_DESTRUCTIVE') OR define('FOPEN_READ_WRITE_CREATE_DESTRUCTIVE', 'w+b'); // truncates existing file data, use with care
defined('FOPEN_WRITE_CREATE') OR define('FOPEN_WRITE_CREATE', 'ab');
defined('FOPEN_READ_WRITE_CREATE') OR define('FOPEN_READ_WRITE_CREATE', 'a+b');
defined('FOPEN_WRITE_CREATE_STRICT') OR define('FOPEN_WRITE_CREATE_STRICT', 'xb');
defined('FOPEN_READ_WRITE_CREATE_STRICT') OR define('FOPEN_READ_WRITE_CREATE_STRICT', 'x+b');

/*
  |--------------------------------------------------------------------------
  | Exit Status Codes
  |--------------------------------------------------------------------------
  |
  | Used to indicate the conditions under which the script is exit()ing.
  | While there is no universal standard for error codes, there are some
  | broad conventions.  Three such conventions are mentioned below, for
  | those who wish to make use of them.  The CodeIgniter defaults were
  | chosen for the least overlap with these conventions, while still
  | leaving room for others to be defined in future versions and user
  | applications.
  |
  | The three main conventions used for determining exit status codes
  | are as follows:
  |
  |    Standard C/C++ Library (stdlibc):
  |       http://www.gnu.org/software/libc/manual/html_node/Exit-Status.html
  |       (This link also contains other GNU-specific conventions)
  |    BSD sysexits.h:
  |       http://www.gsp.com/cgi-bin/man.cgi?section=3&topic=sysexits
  |    Bash scripting:
  |       http://tldp.org/LDP/abs/html/exitcodes.html
  |
 */
defined('EXIT_SUCCESS') OR define('EXIT_SUCCESS', 0); // no errors
defined('EXIT_ERROR') OR define('EXIT_ERROR', 1); // generic error
defined('EXIT_CONFIG') OR define('EXIT_CONFIG', 3); // configuration error
defined('EXIT_UNKNOWN_FILE') OR define('EXIT_UNKNOWN_FILE', 4); // file not found
defined('EXIT_UNKNOWN_CLASS') OR define('EXIT_UNKNOWN_CLASS', 5); // unknown class
defined('EXIT_UNKNOWN_METHOD') OR define('EXIT_UNKNOWN_METHOD', 6); // unknown class member
defined('EXIT_USER_INPUT') OR define('EXIT_USER_INPUT', 7); // invalid user input
defined('EXIT_DATABASE') OR define('EXIT_DATABASE', 8); // database error
defined('EXIT__AUTO_MIN') OR define('EXIT__AUTO_MIN', 9); // lowest automatically-assigned error code
defined('EXIT__AUTO_MAX') OR define('EXIT__AUTO_MAX', 125); // highest automatically-assigned error code
//=================================================================================
//=================================================================================
//define('BASE_URL', 'http://localhost:3001/chatgive/html/dash/');

//Used to keep things on development environment without releasing it on live environment in a quick way
define('HIDE_FUTURE_FEATURES', TRUE);  //FALSE for developer machines or dev environments, TRUE for live environment, it will hide things set as "just-dev"

//define('SYS_FOLDER', 'lunarpay/');
define('SYS_FOLDER', '');
define('SYS_FOLDER_NUM', 1);
define('BASE_URL', ($_ENV['APP_BASE_URL'] ?? 'http://localhost/') . SYS_FOLDER);

define('BASE_URL_FILES', ($_ENV['APP_BASE_URL'] ?? 'http://localhost/') . SYS_FOLDER);

//define('CUSTOMER_APP_BASE_URL', 'https://customer.lunarpay.io/' . SYS_FOLDER);
define('CUSTOMER_APP_BASE_URL', BASE_URL);

define('FOLDER_FILES_MAIN', '/var/www/html/application/uploads/');
define('APP_LOGO_FILE_NAME', 'logo.png?ver=1.0');
define('APP_FAVICON_FILE_NAME', 'favicon.png?ver=1.0');


//in this case https://app.lunarpay.com is the main system
define('PAYSAFE_MIRRORED_SYSTEMS_I_AM_THE_MAIN_SYSTEM', TRUE); //used for paysafe webhooks there is only one central where the webhooks are received

define('PAYSAFE_MIRRORED_SYSTEMS', [ //one paysafe account for three systems, lunarpay is the main listener
    'lunarpay' => [
        'base_url' => 'http://localhost:3001/lunarpay/'
    ],
    'chatgive' => [
        'base_url' => 'http://localhost:3001/chatgive/'
    ]
]);

define('FORTIS_MIRRORED_SYSTEMS', [ //one fortis account for three systems, lunarpay is the main listener
  'lunarpay' => [
      'base_url' => 'http://localhost:3001/lunarpay/'
  ],
  'chatgive' => [
      'base_url' => 'http://localhost:3001/chatgive/'
  ]
]);

define('COMPANY_NAME', 'LunarPay');
define('COMPANY_SITE', 'LunarPay.com');

//USED FOR HANDLING MANY DOMAINS WITHIN THE SAME BASE WEB APP (DASHBOARD, CUSTOMER, ETC)
//IF IS DEVELOPER MACHINE ALL SYSTEMS WILL DEPEND ON THE LOCAL MACHINE BASE URL
//IF IS NOT DEVELOPER MACHINE ALL SYSTEMS WILL DEPEND ON THEIR DOMAIN - CHECK MY_CUSTOMER.PHP AND MY_CONTROLLER.PHP
define('IS_DEVELOPER_MACHINE', strtoupper($_ENV['IS_DEVELOPER_MACHINE'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE); 

//=================================================================================
define('THEME', 'thm2');
define('THEME_LAYOUT', 'themed/' . THEME . '/');

define('THEME_LAYOUT_ADMIN', 'themed/admin/');
define('THEME_LAYOUT_API', 'themed/api/');

define('BASE_ASSETS', BASE_URL . 'assets/');
define('BASE_ASSETS_THEME', BASE_URL . 'assets/argon-dashboard-pro-v1.2.0/');
define('CSRF_TOKEN_NAME', 'csrf_token');

define('EPICPAY_ONBOARD_FORM_TEST', strtoupper($_ENV['EPICPAY_ONBOARD_FORM_TEST'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);

define('SET_SAME_SITE_NONE', strtoupper($_ENV['SET_SAME_SITE_NONE'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);

//===============
define('ZAPIER_ENABLED', strtoupper($_ENV['ZAPIER_ENABLED'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);
define('EMAILING_ENABLED', strtoupper($_ENV['EMAILING_ENABLED'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);
define('CODEIGNITER_SMTP_USER', ($_ENV['CODEIGNITER_SMTP_USER'] ?? ''));
define('CODEIGNITER_SMTP_PASS', ($_ENV['CODEIGNITER_SMTP_PASS'] ?? ''));
define('MAILGUN_DOMAIN', ($_ENV['MAILGUN_DOMAIN'] ?? '')); //==========// https://app.mailgun.com/app/domains
define('MAILGUN_API_KEY', ($_ENV['MAILGUN_API_KEY'] ?? ''));

//just "FROM" title, it does not mean this is the mail where notification emails are triggered necessarely
define('EMAIL_FROM_TITLE_FOR_NOTIFICACTIONS', 'noreply@lunarpay.com');

//================
define('PROVIDER_MESSENGER_TEST', strtoupper($_ENV['PROVIDER_MESSENGER_TEST'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);
//==== TWILIO KEYS
define('TWILIO_ACCOUNT_SID_LIVE', ($_ENV['TWILIO_ACCOUNT_SID_LIVE'] ?? ''));
define('TWILIO_AUTH_TOKEN_LIVE', ($_ENV['TWILIO_AUTH_TOKEN_LIVE'] ?? ''));

define('TWILIO_ACCOUNT_SID_TEST', ($_ENV['TWILIO_ACCOUNT_SID_TEST'] ?? ''));
define('TWILIO_AUTH_TOKEN_TEST', ($_ENV['TWILIO_AUTH_TOKEN_TEST'] ?? ''));

define('TWILIO_ACCOUNT_SID', PROVIDER_MESSENGER_TEST ? TWILIO_ACCOUNT_SID_TEST : TWILIO_ACCOUNT_SID_LIVE);
define('TWILIO_AUTH_TOKEN', PROVIDER_MESSENGER_TEST ? TWILIO_AUTH_TOKEN_TEST : TWILIO_AUTH_TOKEN_LIVE);
//==== TWILIO KEYS ===========

define('APPCUES_ENABLED', strtoupper($_ENV['APPCUES_ENABLED'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);

//====== GOOD BARBER
define('GOODBARBER_COOKIES', $_ENV['GOODBARBER_COOKIES'] ?? '');
define('GOODBARBER_RESELLER_USERNAME', $_ENV['GOODBARBER_RESELLER_USERNAME'] ?? '');
define('GOODBARBER_RESELLER_PASSWORD', $_ENV['GOODBARBER_RESELLER_PASSWORD'] ?? '');
define('GOODBARBER_APP_WITH_ORGNX', strtoupper($_ENV['GOODBARBER_APP_WITH_ORGNX'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE); //==== Create app only if there is an orgnx verified

//====== RECAPTCHA
define('RECAPTCHA_ENABLED', strtoupper($_ENV['RECAPTCHA_ENABLED'] ?? 'FALSE') == 'TRUE' ? TRUE : FALSE);
define('RECAPTCHA_SECRET_KEY', $_ENV['RECAPTCHA_SECRET_KEY'] ?? '');
define('RECAPTCHA_PUBLIC_KEY', $_ENV['RECAPTCHA_PUBLIC_KEY'] ?? '');
define('RECAPTCHA_THRESHOLD', $_ENV['RECAPTCHA_THRESHOLD'] ?? '0.6'); //===== RECAPTCHA SUCCESS IF SCORE >= THRESHOLD [VALUES BETWEEN 0.1 & 1]

//====== PLANNING CENTER OAUTH
define('PLANNINGCENTER_REDIRECT_URL', BASE_URL . ($_ENV['PLANNINGCENTER_REDIRECT_URL'] ?? ''));
define('PLANNINGCENTER_TOKEN_URL', $_ENV['PLANNINGCENTER_TOKEN_URL'] ?? '');
define('PLANNINGCENTER_CLIENT_ID', $_ENV['PLANNINGCENTER_CLIENT_ID'] ?? '');
define('PLANNINGCENTER_SECRET', $_ENV['PLANNINGCENTER_SECRET'] ?? '');

//===== INTERCOM
define('FORCE_HIDE_INTERCOM', strtoupper($_ENV['FORCE_HIDE_INTERCOM'] ?? 'TRUE') == 'TRUE' ? TRUE : FALSE);

//===== GOOGLE
define('GOOGLE_CODE_API',$_ENV['GOOGLE_CODE_API'] ?? ''); //<<<< Adolfo's Key, we need a chatgive google key (console.developers.com)

define('ZAPIER_POLLING_KPIS_USER', $_ENV['ZAPIER_POLLING_KPIS_USER'] ?? '');                                    
define('ZAPIER_POLLING_KPIS_PASS', $_ENV['ZAPIER_POLLING_KPIS_PASS'] ?? '');

//stripe oauth connection apollo eleven inc | live
define('STRIPE_OAUTH_CLIENT_ID', $_ENV['STRIPE_OAUTH_CLIENT_ID'] ?? '');
define('STRIPE_OAUTH_SECRET', $_ENV['STRIPE_OAUTH_SECRET'] ?? '');

//freshbooks oauth connection apollo eleven inc | live
define('FRESHBOOKS_OAUTH_CLIENT_ID', $_ENV['FRESHBOOKS_OAUTH_CLIENT_ID'] ?? '');
define('FRESHBOOKS_OAUTH_SECRET', $_ENV['FRESHBOOKS_OAUTH_SECRET'] ?? '');

//quickbooks oauth connection apollo elevein inc | live
define('QUICKBOOKS_OAUTH_CLIENT_ID', $_ENV['QUICKBOOKS_OAUTH_CLIENT_ID'] ?? '');
define('QUICKBOOKS_OAUTH_SECRET', $_ENV['QUICKBOOKS_OAUTH_SECRET'] ?? '');

//used for our cron jobs
define('CRON_AUTH_TOKEN', 'e47e5e4147d1c6f701056025c862e71433db2b56c1fa7371'); //it is the token to be used in cron jobs, it's defined on the cron config file too

define('ADMIN_TASKS_UPDATE_USER', 'lunar2025'); //verifyx get it from $_ENV['AUTH_ADMIN_UPDATE_USER']
define('ADMIN_TASKS_UPDATE_PASS', 'lunar2025'); //verifyx get it from $_ENV['AUTH_ADMIN_UPDATE_PASS']

//Organization IDS that we want to use as test church, overriden LIVE to TEST environment / works for donor processes, not for onboarding
define('TEST_ORGNX_IDS', [5]);

//this is temporal while we pull the configuration from the dashboard/database
define('FORCE_MULTI_FUNDS', TRUE);

define('PROVIDER_EXTERNAL_STORAGE_WASABI', 'WASABI');

require_once('constants_ext.php');

require_once('constants_admin.php');


