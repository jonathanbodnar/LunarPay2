<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class Migrate extends CI_Controller {

    public function run() {

        $this->load->library('migration');

        //d($this->migration->find_migrations(), false);
        echo 'Migrations executed:<br>';

        if ($this->migration->latest() === FALSE) {
            show_error($this->migration->error_string());
        } else {
            echo '<br>---<br>Migration proccess finished';
        }
    }

    public function create() {
        if (!IS_DEVELOPER_MACHINE) {
            show_error('You are not allowed to use this resource');
            die;
        }
        if ($this->input->post()) {
            $name       = strtolower($this->input->post('name'));
            $class_name = 'Migration_' . $name;
            $file_name  = date('YmdHis') . '_' . $name . '.php';
            $view       = $this->load->view('utilities/migrate/create_class', ['class_name' => $class_name], true);
            $file       = fopen('application/migrations/' . $file_name, 'w') or die("Unable to open file!");
            fwrite($file, $view);
            fclose($file);
            
            $file_path = 'application/migrations/' . $file_name;
            chmod($file_path, 0777);

            echo 'File created in application/migrations/';
        } else {
            $this->load->library(['form_validation']);
            echo form_open('utilities/migrate/create', ['role' => 'form', 'style' => 'font-family: arial; font-size:12px', 'autocomplete' => 'off']);
            echo ''
            . '<label>Type the name of your migration</label><br><br>'
            . '<input type="text" placeholder="table_x_add_field_x" style="width:300px"  name="name"></input><br><br>'
            . '<button type="submit">Create</button>';
            echo form_close();
        }
    }

}
