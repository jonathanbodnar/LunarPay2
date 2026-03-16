<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class My_Loader extends CI_Loader {

    protected $use_theme = false;

    public function __construct() {
        parent::__construct();
    }

    public function use_theme($value = true) {
        $this->use_theme = $value;
    }

    //===== Override view method
    public function view($view, $vars = array(), $return = FALSE) {
        if ($this->use_theme) {
            if($this->use_theme === TRUE) {
                $view = THEME_LAYOUT . $view;
            } else {
                $view = $this->use_theme . $view;
            }
            
        }
        return $this->_ci_load(array('_ci_view' => $view, '_ci_vars' => $this->_ci_prepare_view_vars($vars), '_ci_return' => $return));
    }

}
