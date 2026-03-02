<style>
    .permission-hide {
        display: none!important
    }
</style>
<!-- Sidenav -->
<style>
    <?php
    //make the left menu dark when a modal is opened
    //do not oeverlap left menu with .backdrop otherwise it won't close when responsive
    ?>
    #sidenav-main {
        z-index: 1040;
    }
    .backdrop {
        z-index: 1039; 
    }
</style>
<nav class="sidenav navbar navbar-vertical  fixed-left  navbar-expand-xs navbar-light bg-white" id="sidenav-main">
    <div class="scrollbar-inner">
        <!-- Brand -->
        <div class="sidenav-header  d-flex  align-items-center">
            <a class="navbar-brand" href="<?= base_url() ?>">
                <img src="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_LOGO_FILE_NAME ?>" class="navbar-brand-img" alt="...">
            </a>
            <div class=" ml-auto ">
                <!-- Sidenav toggler -->
                <div class="sidenav-toggler d-none d-xl-block" data-action="sidenav-unpin" data-target="#sidenav-main">
                    <div class="sidenav-toggler-inner">
                        <i class="sidenav-toggler-line"></i>
                        <i class="sidenav-toggler-line"></i>
                        <i class="sidenav-toggler-line"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="navbar-inner">
            <!-- Collapse -->
            <div class="collapse navbar-collapse" id="sidenav-collapse-main">
                <!-- Nav items -->
                <ul class="navbar-nav">
                    <?php
                        $CI = & get_instance();
                        $psf_getting_started = FALSE;
                        if($this->session->userdata('payment_processor_short') == PROVIDER_PAYMENT_PAYSAFE_SHORT) {
                            $CI->load->model('orgnx_onboard_psf_model');
                            $withChatIsInstalled = false;
                            if(!$CI->orgnx_onboard_psf_model->checkOrganizationPSFIsCompleted($this->session->userdata('user_id'), $withChatIsInstalled)){
                                $psf_getting_started = TRUE;
                            }
                        }
                    ?>
                    <?php if($psf_getting_started) : ?>
                        <?php /*getting_started/index is available only for admin user, not for team members, it is not added in the module tree so always will be hidden for team members*/ ?>
                        <li class="nav-item <?= permissionClassHide('getting_started/index') ?>">
                            <a href="<?= base_url() ?>getting_started" class="nav-link <?= $view_index == 'getting_started/index' ? 'active' : '' ?>" style="position: relative;">
                                <i class="fas fa-play"></i>
                                <span class="nav-link-text">Getting Started <span style="   color: red;
                                                                                            font-size: 1.8rem;
                                                                                            position: absolute;
                                                                                            right: 15px;
                                                                                            top: 0;">•</span>
                                </span>
                            </a>
                        </li>
                    <?php else : ?>
                    <li class="nav-item <?= permissionClassHide('organizations/index') ?>">
                        <a href="<?= base_url() ?>organizations" class="nav-link <?= $view_index == 'organizations/index' ? 'active' : '' ?>">
                            <i class="ni ni-building"></i>
                            <span class="nav-link-text">Organizations</span>
                        </a>
                    </li>
                    
                    <li class="nav-item">
                        <?php $group = ['pages/index','give_anywhere/index']; ?>
                        <!--<a class="nav-link <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>" href="#navbar-create" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="navbar-create">
                            <i class="fas fa-plus"></i>
                            <span class="nav-link-text">Create</span>
                        </a>-->
                         <div class="collapse <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'show' : '' ?>" id="navbar-create">
                            
                             <ul class="nav nav-sm flex-column">
                                <!-- <li class="nav-item <?= permissionClassHide('invoices/index') ?>">
                                    <a href="<?= base_url() ?>invoices/new" class="nav-link <?= $view_index == 'invoices/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Invoice</span>
                                    </a>
                                </li>-->
                                
                                <!--<li class="nav-item <?= permissionClassHide('products/index') ?>">
                                    <a href="<?= base_url() ?>products/new" onclick="loader('show')" class="nav-link <?= $view_index == 'products/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Product</span>
                                    </a>
                                </li>-->
                                <li style="display: none" class="nav-item <?= permissionClassHide('pages/index') ?>">
                                    <a href="<?= base_url() ?>pages" class="nav-link <?= $view_index == 'pages/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Pages</span>
                                    </a>
                                </li>
                                <li style="display: none" class="nav-item <?= permissionClassHide('give_anywhere/index') ?>">
                                    <a href="<?= base_url() ?>give_anywhere" class="nav-link <?= $view_index == 'give_anywhere/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Give Anywhere</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    
                    <?php endif; ?>
                    
                    <li class="nav-item">
                        <?php $group = ['invoices/index','invoices/view', 'payment_links/index', 'payment_links/view', 'donations/index', 'batches/index', 'donations/recurring', 'donations/detail', 'donations/profile_recurring', 'payouts/index', 'payouts/detail', 'statements/index']; ?>
                        <a class="nav-link <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>" href="#navbar-revenue" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="navbar-settings">
                            <i class="fas fa-coins"></i>
                            <span class="nav-link-text">Payments</span>
                        </a>
                        <div class="collapse <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'show' : '' ?>" id="navbar-revenue">
                            <ul class="nav nav-sm flex-column">
                                <li class="nav-item <?= permissionClassHide('invoices/index') ?>">
                                    <a href="<?= base_url() ?>invoices" class="nav-link <?= in_array($view_index, ['invoices/index', 'invoices/view']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Invoices</span>
                                    </a>
                                </li>                                
                                <li class="nav-item <?= permissionClassHide('payment_links/index') ?>">                                    <a href="<?= base_url() ?>payment_links" class="nav-link <?= in_array($view_index, ['payment_links/index', 'payment_links/view']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Payment Links</span>
                                    </a>
                                </li>                                
                                <li class="nav-item <?= permissionClassHide('donations/index') ?>">
                                    <a href="<?= base_url() ?>donations" class="nav-link <?= in_array($view_index, ['donations/index', 'donations/detail']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Transactions</span>
                                    </a>
                                </li>
                                <li style="display: none" class="nav-item <?= permissionClassHide('batches/index') ?>">
                                    <a href="<?= base_url() ?>batches" class="nav-link <?= $view_index == 'batches/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Batches</span>
                                    </a>
                                </li>
                                <li class="nav-item <?= permissionClassHide('donations/recurring') ?>">
                                    <a href="<?= base_url() ?>donations/recurring" class="nav-link <?= in_array($view_index, ['donations/recurring', 'donations/profile_recurring']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Recurring</span>
                                    </a>
                                </li>
                                <li class="nav-item <?= permissionClassHide('payouts/index') ?>">
                                    <a href="<?= base_url() ?>payouts" class="nav-link <?= in_array($view_index, ['payouts/index', 'payouts/detail']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Payouts </span>
                                    </a>
                                </li>
                                                              
                                <li style="display: none" class="nav-item <?= permissionClassHide('statements/index') ?>">
                                    <a href="<?= base_url() ?>statements" class="nav-link <?= $view_index == 'statements/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Statements</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    
                    <?php $group = ['donors/index', 'donors/profile']; ?>
                    <li class="nav-item <?= permissionClassHide('donors/index') ?>">
                        <a href="<?= base_url() ?>donors" class="nav-link <?= in_array($view_index, $group) ? 'active' : '' ?>">
                            <i class="fas fa-user-friends"></i>
                            <span class="nav-link-text">Customers</span>
                        </a>
                    </li>    
                    
                    <li class="nav-item">
                        <?php $group = ['products/index', 'products/profile']; ?>
                        <a class="nav-link <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>" href="#navbar-products" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="navbar-products">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="nav-link-text">Products</span>
                        </a>
                        <div class="collapse <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'show' : '' ?>" id="navbar-products">
                            <ul class="nav nav-sm flex-column">
                                <li class="nav-item <?= permissionClassHide('products/index') ?>">
                                    <a href="<?= base_url() ?>products" class="nav-link <?= $view_index == 'products/index' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Overview</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>           
                    
                    <li style="display: none" class="nav-item <?= permissionClassHide('install/index') ?>">
                        <a href="<?= base_url() ?>setup" class="nav-link <?= $view_index == 'install/index' ? 'active' : '' ?>">
                            <i class="fas fa-download"></i>
                            <span class="nav-link-text">Setup</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <?php $group = ['customer_hub/index', 'settings/branding', 'settings/integrations', 'settings/team']; ?>
                        <a class="nav-link <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>" href="#navbar-settings" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="navbar-settings">
                            <i class="fas fa-cog"></i>
                            <span class="nav-link-text">Settings</span>
                        </a>
                        <div class="collapse <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'show' : '' ?>" id="navbar-settings">
                            <ul class="nav nav-sm flex-column">
                                <li class="nav-item <?= permissionClassHide('customer_hub/index') ?>">
                                    <a href="<?= base_url() ?>customer_hub" class="nav-link <?= in_array($view_index, ['customer_hub/index']) ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Customer portal</span>
                                    </a>
                                </li>
                                <li class="nav-item <?= permissionClassHide('settings/branding') ?>">
                                    <a href="<?= base_url() ?>settings/branding" class="nav-link <?= $view_index == 'settings/branding' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Branding </span>
                                    </a>
                                </li>
                                <li class="nav-item <?= permissionClassHide('settings/integrations') ?>">
                                    <a href="<?= base_url() ?>settings/integrations" class="nav-link <?= $view_index == 'settings/integrations' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Integrations </span>
                                    </a>
                                </li>
                                <li class="nav-item <?= permissionClassHide('settings/team') ?>">
                                    <a href="<?= base_url() ?>settings/team" class="nav-link <?= $view_index == 'settings/team' ? 'active' : '' ?>">
                                        <span class="sidenav-mini-icon"></span>
                                        <span class="sidenav-normal">Team </span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li style="display: none" class="nav-item messaging_menu" style="<?= BASE_URL == 'https://app.chatgive.com/' ? 'display: none' : '' ?>">
                        <?php $group = ['messaging/inbox', 'communication/sms']; ?>
                        <a class="nav-link <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>" href="#navbar-messaging" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="navbar-messaging">
                                        <i class="fas fa-comment-dots"></i>
                                        <span class="nav-link-text">Messaging</span>
                                    </a>
                                    <div class="collapse <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'show' : '' ?>" id="navbar-messaging">
                                        <ul class="nav nav-sm flex-column">
                                            <li class="nav-item <?= permissionClassHide('messaging/inbox') ?>">
                                                <a href="<?= base_url() ?>messaging/inbox" class="nav-link <?= $view_index == 'messaging/inbox' ? 'active' : '' ?>">
                                                    <span class="sidenav-mini-icon"></span>
                                                    <span class="sidenav-normal">Inbox</span>
                                                </a>
                                            </li>
                                            <li class="nav-item <?= permissionClassHide('communication/sms') ?>">
                                                <a href="<?= base_url() ?>communication/sms" class="nav-link <?= $view_index == 'communication/sms' ? 'active' : '' ?>">
                                                <span class="sidenav-mini-icon"></span>
                                                <span class="sidenav-normal">SMS</span>
                                            </a>
                                </li>
                            </ul>
                        </div>
                    </li>
                    <li style="display: none" class="nav-item <?= permissionClassHide('gbarber/create_app') ?>">
                        <a href="" class="nav-link" id="free_app_nav_link">
                            <i class="fas fa-mobile-alt"></i>
                            <span class="nav-link-text">Free App</span>
                        </a>
                    </li>
                    <!-- nav using text as icon
                    <li class="nav-item">
                        <a href="" class="nav-link" id="free_app_nav_link">
                            <span class="badge badge-pill theme-color badge-text-menu">New</span>
                            &nbsp;
                            <span class="nav-link-text">Free App</span>
                        </a>
                    </li>
                    -->
                </ul>

                <!-- //////////////////////////////////// -->
                <!-- START help desk button configuration -->
                <style>
                    /* ---- help desk button configuration in normal conditions (menu expanded) ---- */
                    #help_desk_button {
                        position: absolute;
                        bottom: 40px;
                        min-width: 130px;
                        color: #010c4c;
                        margin-left: 28px;
                        font-weight: 500;
                    }
                    
                    /* --- ---*/
                    
                    /* --- help desk button configuration when menu is shrunk --- */
                    .g-sidenav-hidden:not(.g-sidenav-show) #help_desk_button{
                        padding: 0px 0px;
                        background-color: inherit;
                        color: #010c4c;
                        border: none;
                        box-shadow: none;
                        margin-left: -15px;    
                        margin-bottom: 4px
                    }
                </style>
                
                <a class="nav-link btn btn-secondary" id="help_desk_button" href="http://lunarpay.com" style="" target="_BLANK">
                    <i class="fas fa-question-circle"></i>
                    <span class="nav-link-text">Help Desk</span>
                </a>
                <!-- END help desk button configuration -->
                <!-- //////////////////////////////////// -->
            </div>
        </div>
    </div>
</nav>
