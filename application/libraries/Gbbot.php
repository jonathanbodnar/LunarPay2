<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Gbbot {

    public $html_submission_page = "";
    public $afterLoginHtml       = "";
    protected $gb_domain         = 'https://www.goodbarber.app/';

    public function __construct() {
        $this->_CI = &get_instance();
    }

    public function header() {
        if ((isset($_SESSION['cookie'])) && (isset($_SESSION['clientcookie']))) {
            $cookie       = $_SESSION['cookie'];
            $clientcookie = $_SESSION['clientcookie'];
        } else {
            $_SESSION['cookie']       = 'cookie' . rand(111, 999999) . time();
            $_SESSION['clientcookie'] = 'client-cookie' . rand(111, 999999) . time();
            $cookie                   = $_SESSION['cookie'];
            $clientcookie             = $_SESSION['clientcookie'];
        }
        $this->path       = GOODBARBER_COOKIES . $cookie . ".txt";
        $this->clientpath = GOODBARBER_COOKIES . $clientcookie . ".txt";
    }

    public function login() {

        $this->header();
        $loadpage = $this->call_initialpage();

        $hiden_string = $this->hiddenvalue($loadpage, 'hidden');

        $url = $this->gb_domain . "/reseller/manage/";

        $postvalue = ['login' => GOODBARBER_RESELLER_USERNAME, 'password' => GOODBARBER_RESELLER_PASSWORD, $hiden_string['name'] => $hiden_string['value']];
        $post_str  = '';

        $post_str = http_build_query($postvalue, '', '&');

        $ch   = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_str);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->path);
        $html = curl_exec($ch);

        curl_close($ch);

        $login = $this->check_login($html);

        if ($login) {
            $this->selectLoginAgency();
            //var_dump($html);
        }
        return $login;
    }

    function call_initialpage() {
        $url  = $this->gb_domain . "reseller/manage/";
        $ch   = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->path);
        $data = curl_exec($ch);
        curl_close($ch);
        return $data;
    }

    function hiddenvalue($str, $needle) {
        $pos              = strpos($str, $needle);
        $possition_cut    = substr($str, $pos);
        $stringvalue      = substr($possition_cut, 14);
        $hiddenname_pos   = strpos($stringvalue, '"');
        $hiddenname       = substr($stringvalue, 0, $hiddenname_pos);
        $hidden_pos       = $hiddenname_pos + 9;
        $hidden_value_str = substr($stringvalue, $hidden_pos);
        $hiddenvalue_pos  = strpos($hidden_value_str, '"');
        $hidden_value     = substr($hidden_value_str, 0, $hiddenvalue_pos);
        $rhm_array        = array(
            'name'  => $hiddenname,
            'value' => $hidden_value,
        );
        return $rhm_array;
    }

    function check_login($html) {
        $strpost = strpos($html, 'Wrong login or password!');

        if ($strpost) {
            return false;
        } else {
            return true;
        }
    }

    private function selectLoginAgency() {
        $agency_id = "382";
        $url       = $this->gb_domain . "reseller/manage/";
        $postval   = 'agency=' . $agency_id;
        $ch        = curl_init();
        //curl_setopt($ch, CURLINFO_HEADER_OUT, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: www.goodbarber.app",
            "X-Requested-With: XMLHttpRequest",
        ]);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postval);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        curl_exec($ch);
        curl_close($ch);        
    }

    function getallappps() {
        $this->header();
        $getappsurl = $this->gb_domain . "reseller/manage/index/getwebzines/?type=gb";
        $postval    = ''
                . 'draw=3&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&start=0'
                . '&length=10&search%5Bvalue%5D=&search%5Bregex%5D=false';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $getappsurl);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postval);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);

        $apps_name        = curl_exec($ch);
        $apps_json_decode = json_decode($apps_name, true);
        //echo "<pre>";
        //print_r($apps_json_decode);
        curl_close($ch);
        return $apps_json_decode;
    }

    function call_checkapp($app_name) {
        //$this->header();
        $getappsurl = $this->gb_domain . "reseller/manage/index/checkappname";
        $postval    = 'appname=' . $app_name;

        $ch = curl_init();
        //curl_setopt($ch, CURLINFO_HEADER_OUT, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: www.goodbarber.app",
            "X-Requested-With: XMLHttpRequest",
        ]);
        curl_setopt($ch, CURLOPT_URL, $getappsurl);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);

        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postval);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);


        $result = curl_exec($ch);

        //$information = curl_getinfo($ch);
        //d($information);
        //echo "<pre>xxx";
        //var_dump ($result);
        curl_close($ch);
        return $result;
    }

    function call_createapp($app_name) {
        $app_name   = strtolower($app_name);
        $getappsurl = $this->gb_domain . "reseller/manage/index/create";
        $postval    = 'appname=' . $app_name . '&categorie=168';
        $ch         = curl_init();
        //curl_setopt($ch, CURLINFO_HEADER_OUT, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Host: www.goodbarber.app",
            "X-Requested-With: XMLHttpRequest",
        ]);
        curl_setopt($ch, CURLOPT_URL, $getappsurl);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postval);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        $result     = curl_exec($ch);
        //$information = curl_getinfo($ch);
        curl_close($ch);
        return $result;
    }

    function app_hiddentoken($html, $needle) {

        $pos            = strpos($html, $needle);
        $possition_cut  = substr($html, $pos);
        $possition_cut2 = substr($possition_cut, 16);
        $js_array       = strtok($possition_cut2, ";");

        $data = explode("'", $js_array);

        $token = ["name" => $data[1], "value" => $data[3]];
        return $token;
    }

    public function app_login_user($data) {
        $gbarber_app_url = strtolower($data["gbarber_app_url"]) . 'manage/';
        $this->header();

        $html = $this->call_app_initialpage($gbarber_app_url);

        $token = $this->app_hiddentoken($html, 'var CSRFToken');

        $postvalue = [
            'login'          => GOODBARBER_RESELLER_USERNAME,
            'password'       => GOODBARBER_RESELLER_PASSWORD,
            'identification' => "true",
            $token["name"]   => $token["value"]
        ];
        $post_str  = '';
        $post_str  = http_build_query($postvalue, '', '&');

        $ch   = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $gbarber_app_url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_str);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->path);
        $html = curl_exec($ch);

        curl_close($ch);
        $strpost = strpos($html, 'profile-submenu');
        if ($strpost) {
            $this->afterLoginHtml = $html;
            return true;
        } else {
            return false;
        }
    }

    function call_app_initialpage($gbarber_app_url) {

        $ch   = curl_init();
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_URL, $gbarber_app_url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        //curl_setopt($ch, CURLOPT_COOKIEJAR, $this->path);
        $html = curl_exec($ch);

        curl_close($ch);
        return $html;
    }

    public function app_add_team_member($data) {
        $url     = $data['gbarber_app_url'] . 'manage/settings/account/team/addMember';
        $postval = 'team-login=' . $data['email'];
        $ch      = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postval);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        $result = curl_exec($ch);
        
        curl_close($ch);
        return $result;
    }

    public function app_publish_check($data) {
        $data["publish_url"] = strtolower($data["publish_url"]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $data["publish_url"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);

        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        $html = curl_exec($ch);
        curl_close($ch);

        $this->html_submission_page = $html;

        $strpost = strpos($html, 'Begin submission');
        if ($strpost) {
            return true;
        } else {
            return false;
        }
    }

    public function app_account_team($data) {
        $data["team_url"] = strtolower($data["team_url"]);
        $ch               = curl_init();

        curl_setopt($ch, CURLOPT_URL, $data["team_url"]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        //curl_setopt($ch, CURLOPT_POST, 1);

        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        $html = curl_exec($ch);
        curl_close($ch);

        return $html;
    }

    public function app_account_get_user_link($html) {
        $pos           = strpos($html, "manage/settings/account/user");
        $possition_cut = substr($html, $pos);
        $result        = substr($possition_cut, 0, 60);
        $result        = explode("/", $result);
        $result        = "manage/settings/account/user/" . $result[4];
        return $result;
    }

    public function app_account_set_settings($link) {
        $link = strtolower($link);
        $ch   = curl_init();

        $post_values = ''
                . 'forbidden_zone_design=oui&'
                . 'forbidden_zone_content=oui&'
                . 'forbidden_page_mcms=oui&'
                . 'forbidden_page_sectionsmanagement=oui&'
                . 'forbidden_zone_publish=oui&'
                . 'forbidden_page_publish_update=oui&'
                . 'forbidden_zone_users=oui&'
                . 'forbidden_page_push=oui&'
                . 'forbidden_page_users=oui&'
                . 'forbidden_page_comments=oui&'
                . 'forbidden_zone_audience=oui&'
                . 'forbidden_page_audience=oui&'
                . 'forbidden_page_ads=oui&'
                . 'forbidden_page_promote=oui&'
                //. 'forbidden_zone_settings=oui&'
                //. 'forbidden_page_profile_team=oui&'
                . 'forbidden_page_sections_mcms_all=oui'
                . '';
        curl_setopt($ch, CURLOPT_URL, $link);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_values);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);
        $html        = curl_exec($ch);
        curl_close($ch);
    }

    public function app_click_gotitbtn($url) {

        $ch          = curl_init();
        $token       = $this->app_hiddentoken($this->afterLoginHtml, 'var CSRFToken');
        $post_values = ''
                . $token['name'] . '=' . $token['value'] . '&'
                . '';
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post_values);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->path);

        $html = curl_exec($ch);
        //echo $html; die;
        curl_close($ch);
    }

}
