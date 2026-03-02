<?php
defined('BASEPATH') OR exit('No direct script access allowed');

// Extend the core CI_Log class
class MyLogger extends CI_Log {

	//LOG_CUSTOM_ERROR, set the $level to 1 (indicating an error level)
	//LOG_CUSTOM_DEBUG, set the $level to 2 (indicating a debug level)
	//LOG_CUSTOM_INFO, set the $level to 3 (indicating an info level)
    public function __construct($level) {
        $config =& get_config();

		isset(self::$func_overload) OR self::$func_overload = (extension_loaded('mbstring') && ini_get('mbstring.func_overload'));

		$this->_log_path = ($config['log_path'] !== '') ? $config['log_path'] : APPPATH.'logs/';
		$this->_file_ext = (isset($config['log_file_extension']) && $config['log_file_extension'] !== '')
			? ltrim($config['log_file_extension'], '.') : 'php';

		file_exists($this->_log_path) OR mkdir($this->_log_path, 0755, TRUE);

		if ( ! is_dir($this->_log_path) OR ! is_really_writable($this->_log_path))
		{
			$this->_enabled = FALSE;
		}
		
		$this->_threshold = (int) $level;
		

		if ( ! empty($config['log_date_format']))
		{
			$this->_date_fmt = $config['log_date_format'];
		}

		if ( ! empty($config['log_file_permissions']) && is_int($config['log_file_permissions']))
		{
			$this->_file_permissions = $config['log_file_permissions'];
		}
    }
}