<?php
    
defined('BASEPATH') OR exit('No direct script access allowed');

class Migration_reset_tree_WARNING extends CI_Migration {

    public function __construct() {
        parent::__construct();
        $this->load->dbforge();
    }

    public function up() {

        $this->db->query('DROP TABLE IF EXISTS `chat_childs`;');
        $this->db->query('DROP TABLE IF EXISTS `chat_tree`;');

        $this->db->query('CREATE TABLE IF NOT EXISTS `chat_tree` (
                          `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                          `order` int(11) DEFAULT NULL,
                          `type_set` varchar(128) COLLATE utf8_bin DEFAULT NULL,
                          `method_set` varchar(128) COLLATE utf8_bin DEFAULT NULL,
                          `set` varchar(128) COLLATE utf8_bin DEFAULT NULL,
                          `method_get` varchar(128) COLLATE utf8_bin DEFAULT NULL,
                          `type_get` varchar(100) COLLATE utf8_bin DEFAULT NULL,
                          `answer_type` varchar(128) COLLATE utf8_bin DEFAULT NULL,
                          `html` text COLLATE utf8_bin,
                          `purpose` text COLLATE utf8_bin,
                          `answer` varchar(24) COLLATE utf8_bin DEFAULT NULL,
                          `replace` text COLLATE utf8_bin,
                          `back` tinyint(1) DEFAULT \'0\',
                          `dev` text COLLATE utf8_bin,
                          `sessions` varchar(256) COLLATE utf8_bin DEFAULT NULL,
                          `is_text_customizable` tinyint(1) DEFAULT \'1\',
                          `is_session_enabled` tinyint(1) DEFAULT \'1\',
                          `session_enabled_id` int(11) DEFAULT NULL,
                          PRIMARY KEY (`id`),
                          KEY `answer` (`answer`),
                          KEY `is_session_enabled` (`is_session_enabled`)
                        ) ENGINE=InnoDB;');


        $this->db->query('CREATE TABLE IF NOT EXISTS `chat_childs` (
          `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
          `order` int(11) DEFAULT NULL,
          `parent_id` int(10) unsigned DEFAULT NULL,
          `child_id` int(11) unsigned DEFAULT NULL,
          PRIMARY KEY (`id`),
          KEY `FK_chat_childs_chat_tree` (`parent_id`),
          KEY `FK_chat_childs_chat_tree_2` (`child_id`),
          CONSTRAINT `FK_chat_childs_chat_tree` FOREIGN KEY (`parent_id`) REFERENCES `chat_tree` (`id`),
          CONSTRAINT `FK_chat_childs_chat_tree_2` FOREIGN KEY (`child_id`) REFERENCES `chat_tree` (`id`)
        ) ENGINE=InnoDB;');

        $this->db->query("INSERT INTO `chat_tree` (`id`, `order`, `type_set`, `method_set`, `set`, `method_get`, `type_get`, `answer_type`, `html`, `purpose`, `answer`, `replace`, `back`, `dev`, `sessions`, `is_text_customizable`, `is_session_enabled`, `session_enabled_id`) VALUES
	(1, 0, 'start', NULL, NULL, NULL, NULL, NULL, '', NULL, NULL, NULL, 0, NULL, NULL, 1, 1, NULL),
	(2, 30, 'action', 'set_amount_gross_logged', NULL, 'get_suggested_amounts', 'money_or_quickgive', 'money_or_quickgive', 'Hey [first_name], if you\'d like to give to [org_name], choose an amount below or reply with a custom amount.', 'If donor is logged, amount to give request, use [first_name] to display first name of donor and [org_name] to display the organization name.', '1', 'first_name,org_name', 0, NULL, 'amount,is_repeat_quickgive', 1, 1, NULL),
	(3, 40, 'action', 'set_identity', NULL, NULL, NULL, NULL, 'Welcome, what\'s your phone or email?', 'If donor isn\'t logged, chat requests email or phone.', '1', NULL, 0, NULL, 'identity', 1, 0, NULL),
	(5, 60, 'action', 'set', 'first_name', NULL, NULL, NULL, 'Welcome! What\'s your name?', 'Name request for account creation.', '0', NULL, 0, NULL, 'first_name', 1, 0, NULL),
	(6, 70, 'auto_message', NULL, NULL, 'register', NULL, NULL, 'Hey [first_name], nice to meet you', 'Friendly message after set Name, use [first_name] to display the first name.', '1', 'first_name', 0, NULL, NULL, 1, 1, NULL),
	(10, 10, 'action', 'set', 'amount_gross', 'get_suggested_amounts', 'money', 'money', 'If you\'d like to give to [org_name], choose an amount below or reply with a custom amount.', 'If donor isn\'t logged, amount to give request', '0', 'org_name', 0, NULL, 'amount_gross', 1, 0, 2),
	(11, 130, 'action', 'set_fund', NULL, 'get_funds', 'buttons', NULL, 'Thank you for your generosity! Which fund would you like to give to?', 'Request of Fund.', '1', NULL, 1, NULL, 'fund', 1, 1, NULL),
	(12, 140, 'action', 'set_recurrent', NULL, 'get_recurring_options', 'buttons', NULL, 'Great! Would you like to make this gift recurring?', 'Request if donor wants to make a recurring gift.', '1', NULL, 1, NULL, 'recurring,chosen_frequency', 1, 1, NULL),
	(13, 160, 'action', 'set_recurrent_date', NULL, 'recurring_date_form', 'form', 'date', 'Start Recurring Giving on:', 'If recurring gift doesn\'t begin today, start recurring date calendar picker title.', '0', NULL, 0, NULL, 'recurrent_date', 1, 1, NULL),
	(14, 170, 'action', 'set_payment_method', NULL, 'get_payment_methods', 'buttons_methods', NULL, 'Which payment method would you like to use today?', 'Request for payment method to make the gift.', '2', NULL, 0, NULL, 'payment_method,is_exp_date,fee', 1, 1, NULL),
	(16, 180, 'form', 'payment_checking', NULL, 'credit_card_form', 'no_send_form', NULL, '', 'New Payment Method, CC Form Title.', '2', NULL, 0, NULL, NULL, 0, 1, NULL),
	(17, 200, 'action', 'set_save_source', NULL, 'get_yes_no_buttons', 'local_payment_form', 'yes_no', 'Would you like to save this for future use?', 'New Payment Method, request to save it for future.', '1', NULL, 1, NULL, 'save_source', 1, 1, NULL),
	(18, 220, 'auto_message', NULL, NULL, 'payment', 'validate_payment', NULL, 'Your gift is being processed', 'Gift is being processed.', '1', NULL, 0, NULL, NULL, 1, 1, NULL),
	(19, 230, 'end', NULL, NULL, NULL, 'end', NULL, 'Payment processed! Thanks so much for your generosity!', 'Gift has been processed successfully.', '1', NULL, 0, NULL, NULL, 1, 1, NULL),
	(20, 190, 'form', 'payment_checking', NULL, 'bank_account_form', 'no_send_form', NULL, '', 'New Payment Method, ACH Form Title.', '3', NULL, 0, NULL, NULL, 0, 1, NULL),
	(21, 150, 'action', 'is_recurring_today', NULL, 'get_yes_no_buttons', NULL, 'yes_no', 'Do you want your [chosen_frequency] gift to start today?', 'For recurring gift, request if recurring gift will begin today, use [chosen_frequency] to display chosen frequency by the donor.', '1', 'chosen_frequency', 1, NULL, 'is_recurring_today', 1, 1, NULL),
	(25, 210, 'action', 'set_amount_fee', NULL, 'get_yes_no_payments', 'payment_form', 'yes_no', 'Would you like to help by covering the $[fee] processing fee for [org_name]?', 'Request if donor wants to cover the fee, use [fee] to display the fee and [org_name] to display the organization name.', '4', 'fee,org_name', 0, NULL, 'amount_fee', 1, 1, NULL),
	(27, 114, 'action', 'set_method_save', NULL, 'get_methods_options', 'buttons', NULL, 'Which payment method would you like to use today?', 'To add a new faster payment method, choose kind of method (CC or ACH).', '1', NULL, 0, NULL, 'method_save', 1, 1, NULL),
	(29, 118, 'form_method', NULL, NULL, 'save_credit_card_form', 'form_method', NULL, '', 'To add a new faster payment method, CC Form Title.', '1', NULL, 0, NULL, NULL, 0, 1, NULL),
	(30, 119, 'form_method', NULL, NULL, 'save_bank_account_form', 'form_method', NULL, '', 'To add a new faster payment method, ACH Form Title.', '2', NULL, 0, NULL, NULL, 0, 1, NULL),
	(32, 175, 'form_exp_date', 'update_exp_date', NULL, 'get_update_exp_form', 'form', NULL, 'Your credit card has expired, please update your expiration date', 'Request to update expiration date of CC.', '5', NULL, 0, NULL, 'exp_date_status,exp_date_message', 1, 1, NULL),
	(33, 50, 'action', 'set_security_code', NULL, NULL, NULL, NULL, 'We have sent your security code, please enter it below.', 'Security Code request for login', '1', NULL, 0, NULL, NULL, 1, 0, NULL),
	(34, 215, 'action', NULL, NULL, 'confirmation', 'confirmation', NULL, 'We are ready to proccess your gift', 'Message awaiting final confirmation', '2', NULL, 0, NULL, NULL, 1, 1, NULL),
	(35, 131, 'action', 'set_fund_multiple', NULL, 'get_funds_multiple', 'buttons', NULL, 'Hey, you can give to several funds at the same time, which fund would you like to start giving to?', 'Request of Multiple Fund.', '10', NULL, 0, NULL, '', 0, 0, 38),
	(36, 132, 'action', 'set_amount_to_fund', NULL, 'get_suggested_amounts_multiple', 'money', 'money', 'Choose an amount below or reply with a custom amount.', 'Amount related to fund', '11', NULL, 0, NULL, '', 0, 1, NULL),
	(37, 133, 'action', 'check_continue_multiple_funds', NULL, 'get_yes_no_buttons', NULL, 'yes_no', 'Thank you for your generosity! Would you like to give to another fund?', 'Continue with multiple fund loop', '11', NULL, 0, NULL, '', 0, 1, NULL),
	(38, 31, 'action', 'set_fund_multiple', NULL, 'get_funds_multiple_loop_quickgive', 'fund_or_quickgive', NULL, 'Hey [first_name], you can give to several funds at the same time, which fund would you like to start giving to?', 'If donor is logged, on multiple fund widget, fund request to give', '11', 'first_name', 0, NULL, NULL, 0, 1, NULL),
	(39, 135, 'action', 'set_fund_multiple_loop', NULL, 'get_funds_multiple_loop', 'buttons', NULL, 'Thank you for your generosity! Which fund would you like to continue giving to?', 'Request of Multiple Fund Loop.', '10', NULL, 0, NULL, '', 0, 1, NULL);");


        $this->db->query('INSERT INTO `chat_childs` (`id`, `order`, `parent_id`, `child_id`) VALUES
                    (4, 60, 3, 33),
                    (5, 80, 5, 6),
                    (6, 90, 6, 27),
                    (10, 20, 10, 3),
                    (11, 50, 2, 11),
                    (13, 160, 11, 12),
                    (14, 170, 12, 21),
                    (15, 210, 12, 14),
                    (17, 190, 13, 14),
                    (18, 260, 14, 25),
                    (20, 250, 16, 17),
                    (21, 280, 17, 25),
                    (22, 300, 18, 19),
                    (24, 230, 14, 20),
                    (25, 240, 20, 17),
                    (26, 220, 14, 16),
                    (27, 180, 21, 13),
                    (28, 200, 21, 14),
                    (29, 10, 1, 10),
                    (30, 41, 1, 2),
                    (33, 290, 25, 34),
                    (34, 234, 16, 14),
                    (35, 238, 20, 14),
                    (38, 133, 27, 29),
                    (39, 135, 27, 30),
                    (41, 145, 29, 11),
                    (42, 150, 30, 11),
                    (44, 255, 14, 32),
                    (45, 258, 32, 25),
                    (46, 136, 38, 36),
                    (47, 70, 33, 5),
                    (48, 295, 34, 18),
                    (49, 253, 20, 25),
                    (50, 254, 16, 25),
                    (51, 293, 2, 34),
                    (52, 40, 1, 38),
                    (53, 11, 1, 35),
                    (54, 21, 35, 3),
                    (55, 141, 29, 36),
                    (56, 151, 30, 36),
                    (57, 142, 36, 39),
                    (59, 161, 39, 12),
                    (60, 140, 33, 11),
                    (61, 162, 36, 12),
                    (62, 137, 39, 36),
                    (63, 138, 38, 34),
                    (64, 139, 33, 36),
                    (65, 50, 2, 32),
                    (66, 293, 32, 34),
                    (67, 138, 38, 32);');


        printd(get_class($this));
        
        //$this->db->query('');        
        //printd('<b>comment when adding data</b>');
        
    }

    public function down() {
        
    }

}
