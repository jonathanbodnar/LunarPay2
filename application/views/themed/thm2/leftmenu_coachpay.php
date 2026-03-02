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
                    <?php endif; ?>
                        <li class="nav-item <?= permissionClassHide('invoices/index') ?>">
                            <a href="<?= base_url() ?>invoices" class="nav-link <?= in_array($view_index, ['invoices/index', 'invoices/view']) ? 'active' : '' ?>">
                                <i class="ni ni-single-copy-04"></i>
                                <span class="nav-link-text">Invoices</span>
                            </a>
                        </li>
                        <li class="nav-item <?= permissionClassHide('payment_links/index') ?>">
                            <a href="<?= base_url() ?>payment_links" class="nav-link <?= in_array($view_index, ['payment_links/index', 'payment_links/view']) ? 'active' : '' ?>">
                                <i class="fas fa-link"></i>
                                <span class="nav-link-text">Payment Links</span>
                            </a>
                        </li>
                        <li class="nav-item <?= permissionClassHide('donations/index') ?>">
                                        <a href="<?= base_url() ?>donations" class="nav-link <?= $view_index == 'donations/index' ? 'active' : '' ?>">
                                            <i class="ni ni-money-coins"></i>
                                            <span class="nav-link-text">Transactions</span>
                                        </a>
                        </li>
                        <li class="nav-item <?= permissionClassHide('donations/recurring') ?>">
                                        <a href="<?= base_url() ?>donations/recurring" class="nav-link <?= $view_index == 'donations/recurring' ? 'active' : '' ?>">
                                            <i class="ni ni-ruler-pencil"></i>
                                            <span class="nav-link-text">Recurring</span>
                                        </a>
                        </li>
                        <li class="nav-item <?= permissionClassHide('payouts/index') ?>">
                                        <a href="<?= base_url() ?>payouts" class="nav-link <?= $view_index == 'payouts/index' ? 'active' : '' ?>">
                                            <i class="ni ni-briefcase-24"></i> 
                                            <span class="nav-link-text">Payouts</span>
                                        </a>
                        </li>                          
                        <li class="nav-item <?= permissionClassHide('donors/index') ?>">
                            <a href="<?= base_url() ?>donors" class="nav-link <?= $view_index == 'donors/index' ? 'active' : '' ?>">
                                <i class="fas fa-user-friends"></i>
                                <span class="nav-link-text">Customers</span>
                            </a>
                        </li>  
                        <li class="nav-item <?= permissionClassHide('products/index') ?>">
                            <a href="<?= base_url() ?>products/index" onclick="loader('show')" class="nav-link <?= $view_index == 'products/index' ? 'active' : '' ?>">
                                <i class="ni ni-folder-17"></i>
                                <span class="nav-link-text">Products</span>
                            </a>
                        </li>     
                        
                        
                         <li class="nav-item <?= permissionClassHide('settings/branding') ?>">
                            <a href="<?= base_url() ?>settings/branding" onclick="loader('show')" class="nav-link <?= $view_index == 'settings/branding' ? 'active' : '' ?>">
                                <i class="ni ni-folder-17"></i>
                                <span class="nav-link-text">Branding</span>
                            </a>
                        </li>     
                        
                        <li class="nav-item <?= permissionClassHide('settings/integrations') ?>">
                            <a href="<?= base_url() ?>settings/integrations" onclick="loader('show')" class="nav-link <?= $view_index == 'settings/integrations' ? 'active' : '' ?>">
                                <i class="ni ni-folder-17"></i>
                                <span class="nav-link-text">Integrations</span>
                            </a>
                        </li>     
                        
                        <li class="nav-item <?= permissionClassHide('settings/team') ?>">
                            <a href="<?= base_url() ?>settings/team" onclick="loader('show')" class="nav-link <?= $view_index == 'settings/team' ? 'active' : '' ?>">
                                <i class="ni ni-folder-17"></i>
                                <span class="nav-link-text">Team</span>
                            </a>
                        </li>                            
                        
                        
                        <?php if($this->session->userdata('is_affiliate')){?>
                            <?php $group = ['settings/branding', 'settings/integrations', 'settings/team','referrals/index']; ?>
                            <li class="nav-item <?= permissionClassHideGroup($group) ?> <?= in_array($view_index, $group) ? 'active' : '' ?>"">
                                            <a href="<?= base_url() ?>referrals/index" class="nav-link <?= $view_index == 'referrals/index' ? 'active' : '' ?>">
                                                <i class="fas fa-bullhorn"></i>
                                                <span class="nav-link-text">Referrals</span>
                                            </a>
                            </li>
                        <?php }?>
                </ul>

                <!-- //////////////////////////////////// -->
                <!-- START help desk button configuration -->
                <style>
                    /* ---- help desk button configuration in normal conditions (menu expanded) ---- */
                    #help_desk_button {
                        position: absolute;
                        bottom: 40px;
                        right:5px;
                        min-width: 130px;
                        color: #010c4c;
                        margin-left: 5px;
                        font-weight: 500;
                    }
                    #affiliate_left_button {
                        background-color: #2350c7;
                        border-radius: 8px;
                        position: absolute;
                        bottom: 40px;
                        right: 27px;
                        min-width: 130px;
                        color: #fff;
                        margin-left: 25px!important;
                        font-weight: 500;
                    }
                    
                    /* --- ---*/
                    
                    /* --- help desk button configuration when menu is shrunk --- */
                    .g-sidenav-hidden:not(.g-sidenav-show) #help_desk_button, .g-sidenav-hidden:not(.g-sidenav-show) #affiliate_left_button{
                        padding: 0px 0px;
                        background-color: inherit;
                        color: #010c4c;
                        border: none;
                        box-shadow: none;
                        margin-left: -15px;    
                        margin-bottom: 4px
                    }
                </style>
                 <?php if (trim($this->SYSTEM_LETTER_ID) == 'H' && !$this->session->userdata('is_affiliate')){?>
                    <a class="nav-link btn btn-secondary affiliate_left_button" id="affiliate_left_button" href="javascript:void(0)" style="" target="_BLANK">
                        <i class="ni ni-notification-70"></i>
                        <span class="nav-link-text" style="font-size:0.9em">Earn recurring processing revenue <br> through referrals</span>
                    </a>
                <?php }?>
                <!-- END help desk button configuration -->
                <!-- //////////////////////////////////// -->
            </div>
        </div>
    </div>
</nav>