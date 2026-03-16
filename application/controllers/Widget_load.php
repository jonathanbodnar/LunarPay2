<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Widget_load extends CI_Controller {

    public function __construct() {
        parent::__construct();
        
        $this->load->model('setting_model');
        $this->load->model('chat_setting_model');

        $this->load->use_theme();
    }

    //$type is currently disabled, this parameter allow to change multiple funds from script
    public function index($connection,$token,$standalone = null,$page = null,$type = "standard")
    {
        if($page){
            $this->load->model('page_model');
            $page_data = $this->page_model->get($page);
            if(!$page_data){
                show_404();
            }
        }

        //CHECKING IP ALLOWED
        $allowed_ips = json_decode($this->setting_model->getItem('widget_allowed_ips'));
        $is_ip_allowed = false;
        foreach ($allowed_ips as $allowed_ip){
            if($allowed_ip === $_SERVER['REMOTE_ADDR']){
                $is_ip_allowed = true;
                break;
            }
        }

        //CHECKING DOMAIN ALLOWED
        $is_domain_allowed  = false;
        $domain_name_origin = "";
        if($connection == 1){
            $this->load->model('organization_model');
            $organization = $this->organization_model->getByToken($token);
            if($organization){
                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);

                if(!$chat_settings){
                    $data_chat_setting = [
                        'id'                => 0,
                        'client_id'         => $organization->client_id,
                        'church_id'         => $organization->ch_id,
                        'suggested_amounts' => '["10","30","50","100"]',
                        'theme_color'       => '#000000',
                        'button_text_color' => '#ffffff'
                    ];
                    $this->chat_setting_model->save($data_chat_setting);
                    $chat_settings = $this->chat_setting_model->getChatSettingByChurch($organization->ch_id,null);
                }

                if (isset($_SERVER['HTTP_REFERER'])) {
                    $url = $_SERVER['HTTP_REFERER'];
                    $url_info = parse_url($url);
                    $domain_name_origin =  $url_info['scheme'] . '://' . $url_info['host'];
                    $allowed = 'https://'.$chat_settings->domain;
                    if ($domain_name_origin == $allowed) {
                        $is_domain_allowed = true;
                    }
                }
            }
        } elseif ($connection == 2){
            $this->load->model('suborganization_model');
            $suborganization = $this->suborganization_model->getByToken($token);
            if($suborganization){
                $this->load->model('chat_setting_model');
                $chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);

                //Get Organization / Client Id
                $this->load->model('organization_model');
                $organization = $this->organization_model->get($suborganization->church_id,'client_id,church_name');

                if(!$chat_settings){
                    $data_chat_setting = [
                        'id'                => 0,
                        'client_id'         => $organization->client_id,
                        'church_id'         => $suborganization->church_id,
                        'campus_id'         => $suborganization->id,
                        'suggested_amounts' => '["10","30","50","100"]',
                        'theme_color'       => '#000000',
                        'button_text_color' => '#ffffff'
                    ];
                    $this->chat_setting_model->save($data_chat_setting);
                    $chat_settings = $this->chat_setting_model->getChatSettingByChurch($suborganization->church_id,$suborganization->id);
                }

                if (isset($_SERVER['HTTP_REFERER'])) {
                    $url = $_SERVER['HTTP_REFERER'];
                    $url_info = parse_url($url);
                    $domain_name_origin =  $url_info['scheme'] . '://' . $url_info['host'];
                    $allowed = 'https://'.$chat_settings->domain;
                    if ($domain_name_origin == $allowed) {
                        $is_domain_allowed = true;
                    }
                }

            }
        }

        if (isset($_SERVER['HTTP_REFERER'])) {
            if ($_SERVER['HTTP_REFERER'] === "https://devapp.chatgive.com/") {
                $is_domain_allowed = true;
            }
        }

        if(!$is_domain_allowed && !$is_ip_allowed){
            //header("X-Frame-Options: DENY");
        }

        $data = [
            'connection'         => $connection,
            'token'              => $token,
            'standalone'         => (int)$standalone,
            'page'               => (int)$page,
            'type'               => $type,
            /*'is_domain_allowed'  => $is_domain_allowed ? 'yes' : 'no',
            'is_ip_allowed'      => $is_ip_allowed ? 'yes' : 'no',
            'domain_name_origin' => $domain_name_origin,
            'domain_name_db'     => $domain_name_db,
            'server'             => json_encode($_SERVER)*/
        ];

        $this->load->view('widget/index', $data);
    }

    public function standalone($slug){

        $start = substr($slug,0,4);
        $connection = 0;
        if($start === "org-"){
            $connection = 1;
            $slug = ltrim($slug,'org-');
        } else {
            $start = substr($slug,0,5);
            if($start === "sorg-"){
                $connection = 2;
                $slug = ltrim($slug,'sorg-');
            }
        }

        $token = "";
        //CHECKING DOMAIN ALLOWED
        if($connection == 1){
            $this->load->model('organization_model');
            $organization = $this->organization_model->getBySlug($slug);
            if($organization){
                $token = $organization->token;
            }
        } elseif ($connection == 2){
            $this->load->model('suborganization_model');
            $suborganization = $this->suborganization_model->getBySlug($slug);
            if($suborganization){
                $token = $suborganization->token;
            }
        } else {
            die();
        }

        $data = [
            'connection'         => $connection,
            'token'              => $token,
            'standalone'         => 1,
            'page'               => null,
            'type'               => null,
            /*'is_domain_allowed'  => $is_domain_allowed ? 'yes' : 'no',
            'is_ip_allowed'      => $is_ip_allowed ? 'yes' : 'no',
            'domain_name_origin' => $domain_name_origin,
            'domain_name_db'     => $domain_name_db,
            'server'             => json_encode($_SERVER)*/
        ];

        $this->load->view('widget/index', $data);
    }
}
