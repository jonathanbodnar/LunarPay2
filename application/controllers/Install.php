<?php

defined('BASEPATH') OR exit('No direct script access allowed');

use CodeItNow\BarcodeBundle\Utils\QrCode;

class Install extends My_Controller {

    public $data = [];

    public function __construct() {
        parent::__construct();

        if (!$this->ion_auth->logged_in()) {
            redirect('auth/login', 'refresh');
        }

        $this->template_data['view_index'] = $this->router->fetch_class() . '/' . $this->router->fetch_method();
        $this->load->use_theme();

        $this->load->model('chat_setting_model');

        $this->load->library(['form_validation']);

        $this->lang->load(['auth']);

    }

    public function index() {

        $this->template_data['title'] = langx("Install Area");

        //Getting Organizations
        $this->load->model('organization_model');
        $organizations = $this->organization_model->getList('ch_id,church_name,token,twilio_phoneno');
        $this->template_data['organizations'] = $organizations;

        $view                         = $this->load->view('widget/install', ['view_data' => $this->template_data], true);

        $this->template_data['content'] = $view;
        $this->load->view('main', $this->template_data);

    }

    public function get()
    {
        $user_id = $this->session->userdata('user_id');
        $organization_id = (int)$this->input->post('organization_id');
        $suborganization_id = (int)$this->input->post('suborganization_id');

        $chat_setting = $this->chat_setting_model->getChatSetting($user_id, $organization_id, $suborganization_id);

        $slug = "";
        if (!$suborganization_id) {
            $this->load->model('organization_model');
            $slug = 'org-'.$this->organization_model->get($organization_id, 'slug')->slug;
        } else {
            $this->load->model('suborganization_model');
            $slug = 'sorg-'.$this->suborganization_model->get($suborganization_id)->slug;
        }

        $qrCode = new QrCode();
        $qrCode
            ->setText(SHORT_BASE_URL.$slug)
            ->setSize(120)
            ->setPadding(10)
            ->setErrorCorrection('high')
            ->setForegroundColor(array('r' => 0, 'g' => 0, 'b' => 0, 'a' => 0))
            ->setBackgroundColor(array('r' => 255, 'g' => 255, 'b' => 255, 'a' => 0))
            ->setLabel('QR Code')
            ->setLabelFontSize(14)
            ->setImageType(QrCode::IMAGE_TYPE_PNG)
        ;

        $img_qrcode = '<img style="margin:auto" src="data:'.$qrCode->getContentType().';base64,'.$qrCode->generate().'" />';

        output_json([
            'chat_setting'  => $chat_setting,
            'slug'          => $slug,
            'qrcode'        => $img_qrcode
        ]);
    }

    public function save()
    {
        if ($this->input->post()) {

            $this->form_validation->set_rules('organization_id', langx('company'), 'required');

            $user_id = $this->session->userdata('user_id');

            $amounts = explode(',',$this->input->post('suggested_amounts'));

            $type_widget = $this->input->post('funds_flow');
            $conduit_funds = null;
            if($type_widget === 'conduit') {
                $conduit_funds = json_encode($this->input->post('conduit_funds[]'));
            }

            if ($this->form_validation->run() === TRUE) {
                $suborganization_id = (int)$this->input->post('suborganization_id');
                $save_data = [
                    'id'                => (int)$this->input->post('id'),
                    'church_id'         => (int)$this->input->post('organization_id'),
                    'campus_id'         => $suborganization_id > 0 ? $suborganization_id : null,
                    'domain'            => $this->input->post('domain'),
                    'trigger_text'      => $this->input->post('trigger_message'),
                    'debug_message'     => $this->input->post('debug_message'),
                    'theme_color'       => $this->input->post('theme_color'),
                    'widget_position'   => $this->input->post('widget_position'),
                    'widget_x_adjust'   => $this->input->post('widget_x_adjust'),
                    'widget_y_adjust'   => $this->input->post('widget_y_adjust'),
                    'button_text_color' => $this->input->post('button_text_color'),
                    'type_widget'       => $type_widget,
                    'conduit_funds'     => $conduit_funds,
                    'suggested_amounts' => json_encode($amounts)
                ];
            } else {
                output_json([
                    'status'  => false,
                    'message' => validation_errors()
                ]);
                return;
            }


            $image_changed = (int)$this->input->post('image_changed');

            if($image_changed){
                $logo_category = 'branding_logo';

                $config['upload_path']   = './application/uploads/'.$logo_category.'/';
                $config['allowed_types'] = 'gif|jpg|jpeg|png';
                $config['max_size']      = 300;
                $config['overwrite']     = true;
                $config['file_name']     = 'u'.$user_id.'_ch'.$save_data['church_id'];

                if($save_data['campus_id'])
                    $config['file_name'] .= '_cm'.$save_data['campus_id'];

                $this->load->library('upload', $config);

                if($this->upload->do_upload('logo'))
                {
                    $image_data = $this->upload->data();
                    $save_data['logo'] = $logo_category.'/'.$image_data['file_name'].'?v='.strtotime('now');
                }
                else
                {
                    output_json([
                        'status'  => false,
                        'message' => $this->upload->display_errors()
                    ]);
                    return;
                }
            }

            $save_data['client_id'] = $user_id;

            //Install or Update Chat Setting
            $result = $this->chat_setting_model->save($save_data);

            if($result){
                output_json([
                    'status'  => true,
                    'id'      => $result,
                    'message' => 'Setup has been saved'
                ]);
                return;
            } else {
                output_json($result);
                return;
            }
        }
    }

    public function wordpress_download()
    {
        $user_id = $this->session->userdata('user_id');
        $organization_id = (int)$this->input->post('organization_id');
        $suborganization_id = (int)$this->input->post('suborganization_id');
        $token = $this->input->post('token');

        $chat_setting = $this->chat_setting_model->getChatSetting($user_id, $organization_id, $suborganization_id);
        $connection = 1;
        $plugin_folder_name = 'o'.$organization_id;

        if($suborganization_id){
            $connection = 2;
            $plugin_folder_name = 's'.$suborganization_id;
        }

        $main_plugin_folder = APPPATH."uploads/wordpress/plugin/";
        $plugin_folder = APPPATH."uploads/wordpress/downloads/".$plugin_folder_name."/";

        if (!file_exists($plugin_folder)) {
            mkdir($plugin_folder, 0777, true);
        }

        copy($main_plugin_folder.'chatgive.json',$plugin_folder.'chatgive.json');
        copy($main_plugin_folder.'chatgive.php',$plugin_folder.'chatgive.php');

        $json_config = '{
    "token": "'.$token.'",
    "connection": '.$connection.'
}';

        file_put_contents($plugin_folder.'chatgive.json',$json_config);

        $zipFileName = 'chatgive.zip';
        $this->load->library('zip');
        $this->zip->read_file($plugin_folder.'chatgive.json', 'chatgive.json');
        $this->zip->read_file($plugin_folder.'chatgive.php', 'chatgive.php');
        $this->zip->archive($plugin_folder.$zipFileName);

        output_json([
            'status' => true,
            'data'   => FILES_URL . 'wordpress_downloads/'.$plugin_folder_name.'_'. $zipFileName
        ]);
    }
}
