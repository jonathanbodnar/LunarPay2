<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
* Name:  Ion Auth Lang - English
*
* Author: Ben Edmunds
*         ben.edmunds@gmail.com
*         @benedmunds
*
* Location: https://github.com/benedmunds/CodeIgniter-Ion-Auth
*
* Created:  03.14.2010
*
* Description:  English language file for Ion Auth messages and errors
*
*/

// Account Creation
$lang['account_creation_successful']            = 'Account successfully created';
$lang['account_creation_unsuccessful']          = 'Unable to create account';
$lang['account_creation_duplicate_email']       = 'Email already used or invalid';
$lang['account_creation_duplicate_identity']    = 'Identity already used or invalid';
$lang['account_creation_missing_default_group'] = 'Default group is not set';
$lang['account_creation_invalid_default_group'] = 'Invalid default group name set';

// Password
$lang['password_change_successful']          = 'Password successfully changed';
$lang['password_change_unsuccessful']        = 'Unable to change password';
$lang['forgot_password_successful']          = 'Reset password email sent!';
$lang['forgot_password_unsuccessful']        = 'Unable to email the reset password link';

// Activation
$lang['activate_successful']                 = 'Account activated';
$lang['activate_unsuccessful']               = 'Unable to activate account';
$lang['deactivate_successful']               = 'Account de-activated';
$lang['deactivate_unsuccessful']             = 'Unable to de-activate account';
$lang['activation_email_successful']         = 'Activation email sent. please check your inbox or spam';
$lang['activation_email_unsuccessful']       = 'Unable to send activation email';
$lang['deactivate_current_user_unsuccessful']= 'You cannot de-activate your self.';

// Login / Logout
$lang['login_successful']                    = 'Logged in successfully';
$lang['login_unsuccessful']                  = 'Incorrect login';
$lang['login_unsuccessful_not_active']       = 'Account is inactive';
$lang['login_timeout']                       = 'Temporarily locked out. try again later.';
$lang['logout_successful']                   = 'Logged out successfully';

// Account Changes
$lang['update_successful']                   = 'Account information successfully updated';
$lang['update_unsuccessful']                 = 'Unable to update account information';
$lang['delete_successful']                   = 'User deleted';
$lang['delete_unsuccessful']                 = 'Unable to delete user';

// Groups
$lang['group_creation_successful']           = 'Group created successfully';
$lang['group_already_exists']                = 'Group name already taken';
$lang['group_update_successful']             = 'Group details updated';
$lang['group_delete_successful']             = 'Group deleted';
$lang['group_delete_unsuccessful']           = 'Unable to delete group';
$lang['group_delete_notallowed']             = 'Can\'t delete the administrators\' group';
$lang['group_name_required']                 = 'Group name is a required field';
$lang['group_name_admin_not_alter']          = 'Admin group name can not be changed';

// Activation Email
$lang['email_activation_subject']            = 'Account activation';
$lang['email_activate_heading']              = 'Activate account for %s';
$lang['email_activate_subheading']           = 'Please click this link to %s.';
$lang['email_activate_link']                 = 'Activate your account';

// Forgot Password Email
$lang['email_forgotten_password_subject']    = 'Forgotten password verification';
$lang['email_forgot_password_heading']       = 'Reset password for %s';
$lang['email_forgot_password_subheading']    = 'Please click this link to %s.';
$lang['email_forgot_password_link']          = 'Reset your password';

