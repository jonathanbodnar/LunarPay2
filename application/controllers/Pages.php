<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Pages extends My_Controller
{

    public $data = [];

    protected $fonts = [
        "Arial" => [
            "value" => "Arial",
            "type" => "default"
        ],
        "Verdana" => [
            "value" => "Verdana",
            "type" => "default"
        ],
        "Helvetica " => [
            "value" => "Helvetica",
            "type" => "default"
        ],
        "Tahoma" => [
            "value" => "Tahoma",
            "type" => "default"
        ],
        "Trebuchet MS" => [
            "value" => "Trebuchet MS",
            "type" => "default"
        ],
        "Times New Roman" => [
            "value" => "Times New Roman",
            "type" => "default"
        ],
        "Georgia " => [
            "value" => "Georgia",
            "type" => "default"
        ],
        "Garamond" => [
            "value" => "Garamond",
            "type" => "default"
        ],
        "Courier New" => [
            "value" => "Courier New",
            "type" => "default"
        ],
        "Brush Script MT" => [
            "value" => "Brush Script MT",
            "type" => "default"
        ],
        "Segoe UI" => [
            "value" => "Segoe UI",
            "type" => "default"
        ]
    ];

    public function __construct()
    {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

        $this->load->model('page_model');
    }

    public function index()
    {
        $this->template_data['title'] = langx("Pages");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name');
        $this->template_data['organizations'] = $organizations;

        $fonts = $this->fonts;

        /*$google_fonts = json_decode(file_get_contents('https://www.googleapis.com/webfonts/v1/webfonts?key=' . GOOGLE_CODE_API));
        foreach ($google_fonts->items as $item) {
            $fonts[$item->family] = [
                "value" => $item->family,
                "type" => 'google',
            ];
        }

        ksort($fonts);*/

        $view = $this->load->view('create/page', ['view_data' => $this->template_data, 'fonts' => $fonts], true);

        $this->template_data['content'] = $view;

        $this->load->view('main', $this->template_data);
    }

    public function get_pages_dt(){
        output_json($this->page_model->getDt(), true);
    }

    public function get_page()
    {

        $id = $this->input->post('id');
        $page = $this->page_model->get($id, $this->session->userdata('user_id'));

        output_json([
            'page' => $page
        ]);
    }

    public function save_page()
    {
        if ($this->input->post()) {

            $this->form_validation->set_rules('page_name', langx('page_name'), 'required');
            $this->form_validation->set_rules('slug', langx('slug'), 'required');
            $user_id = $this->session->userdata('user_id');
            $slug = '';

            $type_page = $this->input->post('type_page');
            if($type_page == 'conduit'){
                $this->form_validation->set_rules('conduit_funds[]', langx('conduit_funds'), 'required');
            }

            if ($this->form_validation->run() === TRUE) {

                $slug = slugify($this->input->post('slug'));
                $slug_exist = $this->page_model->getBySlug($slug);

                $page_id = (int)$this->input->post('id');

                if ($slug_exist && $page_id != $slug_exist->id) {
                    output_json([
                        'status' => false,
                        'message' => '<p>Slug already exists</p>'
                    ]);
                    return;
                }

                $organization_id = (int)$this->input->post('organization_id');
                $suborganization_id = (int)$this->input->post('suborganization_id');

                $conduit_funds = null;
                if($type_page == 'conduit'){
                    $conduit_funds = json_encode($this->input->post('conduit_funds'));
                }

                $save_data = [
                    'id' => $page_id,
                    'church_id' => $organization_id > 0 ? $organization_id : null,
                    'campus_id' => $suborganization_id > 0 ? $suborganization_id : null,
                    'page_name' => $this->input->post('page_name'),
                    'slug' => $slug,
                    'title' => $this->input->post('title'),
                    'content' => $this->input->post('content'),
                    'title_font_family' => $this->input->post('font_family_title'),
                    'title_font_family_type' => $this->input->post('title_family_type'),
                    'title_font_size' => $this->input->post('font_size_title'),
                    'content_font_family' => $this->input->post('font_family_content'),
                    'content_font_family_type' => $this->input->post('content_family_type'),
                    'content_font_size' => $this->input->post('font_size_content'),
                    'style' => $this->input->post('pwa_style'),
                    'type_page' => $type_page,
                    'conduit_funds' => $conduit_funds
                ];

            } else {
                output_json([
                    'status' => false,
                    'message' => validation_errors()
                ]);
                return;
            }

            $image_deleted = (int)$this->input->post('image_deleted');

            if($this->input->post('pwa_style') === 'T'){
                $image_deleted = 1;
            }

            if(!$image_deleted) {
                $image_changed = (int)$this->input->post('image_changed');

                if ($image_changed) {
                    $image_category = 'pwa_background';

                    if (!file_exists('./application/uploads/' . $image_category . '/')) {
                        mkdir('./application/uploads/' . $image_category . '/', 0777, true);
                    }

                    $config['upload_path'] = './application/uploads/' . $image_category . '/';
                    $config['allowed_types'] = 'gif|jpg|jpeg|png';
                    $config['max_size'] = 16384;
                    $config['overwrite'] = true;
                    $config['file_name'] = $slug;

                    $this->load->library('upload', $config);

                    if ($this->upload->do_upload('background')) {
                        $image_data = $this->upload->data();
                        $save_data['background_image'] = $image_category . '/' . $image_data['file_name'];
                    } else {
                        output_json([
                            'status' => false,
                            'message' => $this->upload->display_errors()
                        ]);
                        return;
                    }
                }
            } else {
                $save_data['background_image'] = '';
            }
            $save_data['client_id'] = $user_id;

            //Create or Update Page
            $result = $this->page_model->save($save_data);

            if ($result) {
                output_json([
                    'status' => true,
                    'id' => $result,
                    'message' => 'Page has been saved'
                ]);
                return;
            } else {
                output_json($result);
                return;
            }
        }
    }

    public function remove() {
        $id   = $this->input->post("id");
        $user_id = $this->session->userdata('user_id');
        $result  = $this->page_model->remove($id, $user_id);
        output_json([
            'status'  => $result['status'],
            'message' => $result['message']
        ]);
    }
}
