<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Pwa extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->use_theme();
        $this->load->model('page_model');
    }

    public function index($slug)
    {
        $page = $this->page_model->getBySlug($slug);
        if($page){
            $background = null;
            if($page->background_image){
                $background = BASE_URL_FILES.'files/get/'.$page->background_image;
            }

            $widget = null;
            if($page->church_id){
                if(!$page->campus_id){
                    $this->load->model('organization_model');
                    $org = $this->organization_model->get($page->church_id,'token');
                    $widget = SHORT_BASE_URL.'widget_load/index/1/'.$org->token.'/1'.'/'.$page->id;
                } else {
                    $this->load->model('suborganization_model');
                    $sorg = $this->suborganization_model->get($page->campus_id);
                    $widget = SHORT_BASE_URL.'widget_load/index/2/'.$sorg->token.'/1'.'/'.$page->id;
                }
            }

            $data = [
                'widget'                   => $widget,
                'background'               => $background,
                'page_name'                => $page->page_name,
                'title_font_family'        => $page->title_font_family,
                'title_font_family_type'   => $page->title_font_family_type,
                'title_font_size'          => $page->title_font_size,
                'content_font_family'      => $page->content_font_family,
                'content_font_family_type' => $page->content_font_family_type,
                'content_font_size'        => $page->content_font_size,
                'title'                    => $page->title,
                'content'                  => $page->content,
            ];

            if($page->style === 'F') {
                $this->load->view('pwa/floating_widget', $data);
            } else {
                $this->load->view('pwa/two_columns', $data);
            }
        } else {
            show_404();
        }
    }
}
