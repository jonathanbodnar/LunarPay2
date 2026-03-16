<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	https://codeigniter.com/user_guide/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There are three reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router which controller/method to use if those
| provided in the URL cannot be matched to a valid route.
|
|	$route['translate_uri_dashes'] = FALSE;
|
| This is not exactly a route, but allows you to automatically route
| controller and method names that contain dashes. '-' isn't a valid
| class or method name character, so it requires translation.
| When you set this option to TRUE, it will replace ALL dashes in the
| controller and method URI segments.
|
| Examples:	my-controller/index	-> my_controller/index
|		my-controller/my-method	-> my_controller/my_method
*/


//customer/client side
$route['c/invoice/(:any)'] = 'customer/invoice/index/$1';
$route['customer/apiv1/invoice/get_all_by_customer'] = 'customer/apiv1/invoice/get_all_by_customer'; //force for when get_all_by_customer use that method and not index
$route['customer/apiv1/invoice/(:any)'] = 'customer/apiv1/invoice/index/$1';

$route['c/portal/payment_link/(:any)'] = 'customer/portal/payment_link/$1';

$route['customer/apiv1/payment_link/create'] = 'customer/apiv1/payment_link/create'; //force for when using create use that method and not index
$route['customer/apiv1/payment_link/(:any)'] = 'customer/apiv1/payment_link/index/$1';

//=====================================================

$route['default_controller'] = 'organizations'; //if you change the default controller here you need to change it on MY_Controller
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;
$route['postajax']['POST'] = 'acl/postajax';
$route['formajax'] = 'acl/formajax';
$route['setup'] = 'install/index';
$route['save'] = 'acl/save_user';
$route['pwa/(:any)'] = 'pwa/index/$1';
$route['funds/(:num)'] = 'funds/index/$1';
$route['funds/(:num)/(:num)'] = 'funds/index/$1/$2';
$route['funds/(:num)/(:any)'] = 'funds/index/$1//$2';
$route['funds/(:num)/(:num)/(:any)'] = 'funds/index/$1/$2/$3';
// $route['(:any)']  = function($slug)
// {
//     if(file_exists('application/controllers/'.ucfirst($slug).'.php')){
//         return $slug.'/index';
//     }
//     return 'widget_load/standalone/'.$slug;
// };
$route['donations/(:num)'] = 'donations/index/$1';

$route['invoices/new'] = 'invoices/index/new';
$route['products/new'] = 'products/index/new';
