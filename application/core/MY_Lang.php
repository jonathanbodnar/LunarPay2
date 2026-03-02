<?php

defined('BASEPATH') OR exit('No direct script access allowed');

class My_Lang extends CI_Lang {

    public function __construct() {
        parent::__construct();
    }

    // --------------------------------------------------------------------

    /**
     * Language line
     *
     * Fetches a single line of text from the language array
     *
     * @param	string	$line		Language line key
     * @param	bool	$log_errors	Whether to log an error message if the line is not found
     * @return	string	Translation
     */
    public function line($line, $log_errors = TRUE) {
        $value = isset($this->language[$line]) ? $this->language[$line] : FALSE;

        // Because killer robots like unicorns!
        if ($value === FALSE && $log_errors === TRUE) {
            //======== remove log message
            //log_message('error', 'Could not find the language line "' . $line . '"');
        }

        return $value;
    }

}
