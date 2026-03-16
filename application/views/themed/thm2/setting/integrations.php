<?php
$organizations = $view_data['organizations'];
?>
<input id="integration_tab" type="hidden" value="<?= $view_data ['tab'] ?>">

<style>
.nav-tabs-code .nav-link {
    color: #6c757d;
    border: none;
    padding: 10px 20px;
    margin-right: 5px;
    border-radius: 5px;
    transition: all 0.3s ease;
}

.nav-tabs-code .nav-link:hover {
    background-color: #f8f9fa;
    color: #495057;
}

.nav-tabs-code .nav-link.active {
    background-color: #000 !important;
    color: #fff !important;
    font-weight: 600;
}

.nav-tabs-code .nav-link.active:hover {
    background-color: #000 !important;
    color: #fff !important;
}

/* Equal height columns for Developers section */
.developers-row {
    display: flex;
    flex-wrap: wrap;
}

.developers-col {
    display: flex;
    flex-direction: column;
}

.developers-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.developers-card .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
}
</style>

<div class="container-fluid">
    <div class="header-body">
        <div class="row align-items-center py-4">
            <div class="col-lg-6 col-7">
                <h6 class="h2 text-white d-inline-block mb-0"></h6>
                <nav aria-label="breadcrumb" class="d-none d-md-inline-block ml-md-4">
                    <ol class="breadcrumb breadcrumb-links breadcrumb-dark">
                    </ol>
                </nav>
            </div>                
        </div>        
    </div>
</div>

<!-- Page content -->
<div class="container-fluid mt--6">
    <!-- Table -->
    <div class="row">
        <div class="col">
            <div class="card">
                <?php if (isset($view_data['title'])): ?>
                    <div class="card-header">
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><i class="fas fa-link"></i> <?= $view_data['title'] ?> </h3>
                            </div>
                            <div class="col-sm-6">
                                
                                <!--<button class="btn btn-outline-neutral float-right top-table-bottom btn-add-statement" data-toggle="modal">
                                    <i class="fas fa-print"></i> <?= langx('button') ?>
                                </button>-->
                            </div>
                        </div>
                        </button>
                    </div>
                <?php endif; ?>
                <div class="card-body">
                    <div class="ct-example">
                        <ul class="nav nav-tabs-code" id="nav-pills-tabs-tab" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" id="nav-pills-tabs-developers-tab" data-toggle="tab" href="#nav-pills-tabs-developers" role="tab" aria-controls="nav-pills-tabs-developers" aria-selected="true">
                                    <i class="fas fa-code"></i> Developers
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="nav-pills-tabs-stripe-tab" data-toggle="tab" href="#nav-pills-tabs-stripe" role="tab" aria-controls="nav-pills-tabs-stripe" aria-selected="false">
                                    Stripe
                                </a>
                            </li>
                            <li class="nav-item d-none">
                                <a class="nav-link" id="nav-pills-tabs-freshbooks-tab" data-toggle="tab" href="#nav-pills-tabs-freshbooks" role="tab" aria-controls="nav-pills-tabs-freshbooks" aria-selected="false">
                                    Freshbooks
                                </a>
                            </li>
                            <li class="nav-item d-none">
                                <a class="nav-link" id="nav-pills-tabs-quickbooks-tab" data-toggle="tab" href="#nav-pills-tabs-quickbooks" role="tab" aria-controls="nav-pills-tabs-quickbooks" aria-selected="false">
                                    Quickbooks
                                </a>
                            </li>
                            <li class="nav-item d-none">
                                <a class="nav-link" id="nav-pills-tabs-slack-tab" data-toggle="tab" href="#nav-pills-tabs-slack" role="tab" aria-controls="nav-pills-tabs-slack" aria-selected="false">
                                    Slack
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="nav-pills-tabs-zapier-tab" data-toggle="tab" href="#nav-pills-tabs-zapier" role="tab" aria-controls="nav-pills-tabs-zapier" aria-selected="false">
                                    Zapier 
                                </a>
                            </li>
                            <li class="nav-item d-none" style="display:none; /*disabled*/">
                                <a class="nav-link" id="nav-pills-tabs-planning_center-tab" data-toggle="tab" href="#nav-pills-tabs-planning_center" role="tab" aria-controls="nav-pills-tabs-planning_center" aria-selected="false">
                                    Planning Center
                                </a>
                            </li>
                            <li class="nav-item" style="display:none; /*disabled*/">
                                <a class="nav-link" id="nav-pills-tabs-wordpress-tab" data-toggle="tab" href="#nav-pills-tabs-wordpress" role="tab" aria-controls="nav-pills-tabs-wordpress" aria-selected="false">
                                    Wordpress Plugin
                                </a>
                            </li>
                        </ul>
                        <div class="tab-content">
                            <hr style="margin: 0px 0px 20px 0px">         

                            <!-- Developers Tab -->
                            <div id="nav-pills-tabs-developers" class="tab-pane fade show active" role="tabpanel" aria-labelledby="nav-pills-tabs-developers-tab">
                                <div class="developers-row mt-2">
                                    <div class="developers-col col-md-6">
                                        <!-- API Credentials Section -->
                                        <div class="developers-card">
                                            <div class="card-header d-flex justify-content-between align-items-center">
                                                <h4 class="mb-0">
                                                    <i class="fas fa-key"></i> API Credentials
                                                </h4>
                                                <a href="<?= base_url() ?>api-docs" target="_blank" class="btn btn-primary btn-sm">
                                                    <i class="fas fa-book"></i> View API Documentation
                                                </a>
                                            </div>

                                            <div class="card-body">
                                                <div id="api-credentials-section">                                                    
                                                    <div class="text-center">
                                                        <div class="spinner-border text-primary" role="status">
                                                            <span class="sr-only">Loading...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="developers-col col-md-12">
                                    <hr class="my-1">
                                    </div>
                                    <div class="developers-col col-md-6">
                                        <!-- Webhook Configuration Section -->
                                        <div class="developers-card">
                                            <div class="card-header">
                                                <h4 class="mb-0"><i class="fas fa-bell"></i> Webhook Configuration</h4>
                                            </div>
                                            <div class="card-body">
                                                <div id="webhook-config-section">
                                                    <div class="text-center">
                                                        <div class="spinner-border text-primary" role="status">
                                                            <span class="sr-only">Loading...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="nav-pills-tabs-stripe" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-stripe-tab">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'form_controlcenter']); ?>
                                <div class="row">
                                    <div style="display: none;" class="col-md-12 text-center btn_stripe_oauth_conn">
                                        <br>

                                        Connect <?= COMPANY_NAME ?> with your Stripe account for downloading 
                                        <br>your customers, invoices and products.

                                        <br>
                                        <br>
                                        <a id="btn_stripe_oauth_conn" href="" class="btn btn-primary" style="width: 320px">
                                            <i class="fas fa-link"></i> Connect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                    <div style="display: none;" class="col-md-12 text-center btn_stripe_push">
                                        <br>
                                        Your <?= COMPANY_NAME ?> Dashboard is now <strong>connected</strong> with your Stripe account.
                                        <br><br>
                                        Click on Start Download to import your Stripe customers, invoices and products.
                                        <br>
                                        <br>
                                        <br>
                                        <a id="btn_stripe_download"  href="" class="btn btn-primary" style="width: 200px">
                                            <i class="fas fa-download"></i> Start Download											
                                        </a>
                                        <a id="btn_stripe_disconnect"  href="" class="btn btn-outline-neutral" style="width: 200px">
                                            Disconnect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                </div>
                                <?php echo form_close() ?>
                            </div> 

                            
                           <div id="nav-pills-tabs-zapier" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-zapier-tab">
                                <br>
                                <div class="">
                                    <table style="max-width: 600px; margin: auto">
                                        <tbody>
                                            <tr>
                                                <td style="width:56%; text-align: right"><img src="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_LOGO_FILE_NAME ?>" class="navbar-brand-img pull-right" alt="..." style="width: 62%;"></td>
                                                <td style="width:17%; text-align: center"><span style="font-size: 22px;"><i class="fas fa-link"></i></span></td>
                                                <td style="width:27%; text-align: left;"><img src="https://cdn.zapier.com/zapier/images/logomark250.png" class="navbar-brand-img pull-right" alt="..." style="width: 25%; margin:auto; margin-top: -2px; border-color: gray"></td>                                           
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div class="row justify-content-center">
                                        <div class="col-md-6" style="text-align: justify">
                                            <hr>
                                            Zapier is an online automation tool that connects your favorite apps,
                                            such as Gmail, Slack, Mailchimp, and more (+2000 apps).
                                            You can connect two or more apps to automate repetitive tasks.
                                            <br><br>
                                            An example of what you can do is to send each new donation to
                                            a Google spreadsheet.
                                            <br><br>
                                            <h4>ChatGive triggers</h4>
                                            <ul>
                                                <li>New Donation Received</li>
                                                <li>New Donor Registered</li>
                                                <li>New Recurrent Donation Created</li>
                                                <li>New Credit Card Expired</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <br>
                                    <div class="text-center">

                                        To start building a new workflow connect ChatGive to your Zapier 
                                        account 
                                        <br>
                                        <br>
                                        <br>
                                        
                                        
                                        <?php
                                        $this->CI = & get_instance();
                                        $this->CI->load->model('setting_model');
                                        $__SYSTEM_LETTER_ID = $this->CI->setting_model->getItem('SYSTEM_LETTER_ID');
                                        ?>
                                        <?php $__zapier_url = '#' ?>
                                        <?php if ($__SYSTEM_LETTER_ID == 'L'): ?>
                                            <?php $__zapier_url = 'https://zapier.com/developer/public-invite/161132/64a06325ae9db1c59050160907a677ed/' ?>
                                        <?php elseif ($__SYSTEM_LETTER_ID == 'H'): ?>
                                            <?php $__zapier_url = 'https://zapier.com/developer/public-invite/161199/d185d3c9ce7a091d5fe1dca531782866/' ?>                                            
                                        <?php endif; ?>

                                        <a target="_blank" href="<?= $__zapier_url ?>" class="btn btn-primary" style="width: 320px">
                                            <i class="fas fa-link"></i> Connect
                                        </a>
                                        
                                        <br>
                                        <br>

                                    </div>
                                </div>
                            </div>
                            <div id="nav-pills-tabs-planning_center" style="display:none; /*disabled*/" class="tab-pane tab-example-result fade" role="tabpanel" aria-labelledby="nav-pills-tabs-planning_center-tab">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'form_controlcenter']); ?>
                                <div class="row">
                                    <div style="display: none;" class="col-md-12 text-center btn_planning_center_oauth_conn">
                                        <br>
                                        Connect ChatGive with your Planning Center account..
                                        <br>
                                        <br>
                                        <a id="btn_planning_center_oauth_conn" href="" class="btn btn-primary" style="width: 320px">
                                            <i class="fas fa-link"></i> Connect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                    <div style="display: none;" class="col-md-12 text-center btn_planning_center_push">
                                        <br>
                                        Your ChatGive Dashboard is now <strong>connected</strong> with your Planning Center account
                                        <br><br>
                                        ChatGive will create a batch and will push all new donations, 
                                        <br>funds and people from all your organizations.
                                        <br>
                                        <br>
                                        <br>
                                        <div class="row">
                                            <div class="col-sm-7 text-right">
                                                <label for="commit_batch">                                                   
                                                    Commit Planning Center Batch once finished:
                                                </label><br><br>
                                            </div>
                                            <div class="col-sm-2 text-left">
                                                <label class="custom-toggle">                                    
                                                    <input type="checkbox" id="commit_batch" checked>
                                                    <span class="custom-toggle-slider rounded-circle"></span>
                                                </label>
                                            </div>
                                        </div>
                                        <br>
                                        <a id="btn_planning_center_push"  href="" class="btn btn-primary" style="width: 200px">
                                            <i class="fas fa-upload"></i> Push Data
                                        </a>
                                        <a id="btn_planning_center_disconnect"  href="" class="btn btn-outline-neutral" style="width: 200px">
                                            Disconnect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                </div>
                                <?php echo form_close() ?>
                            </div>

                            <div id="nav-pills-tabs-wordpress" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-wordpress-tab">

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <?= langx('company:', 'organization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="organization_id" placeholder="">
                                                <?php foreach ($organizations as $organization) : ?>
                                                    <option value="<?= $organization['ch_id'] ?>" data-token="<?= $organization['token'] ?>">
                                                        <?= $organization['church_name'] ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <?= langx('sub_organization:', 'suborganization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="suborganization_id" placeholder="">
                                                <option value="">Select a Sub Organization</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div>For easy installation on a wordpress website, download this plugin, install on your wordpress site and activate.</div><br>
                                    <a id="download_wordpress_plugin" href="#">Download Link</a>
                                </div>
                            </div>
                            <div id="nav-pills-tabs-freshbooks" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-freshbooks-tab">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'form_controlcenter']); ?>
                                <div class="row">
                                    <div style="display: none;" class="col-md-12 text-center btn_freshbooks_oauth_conn">
                                        <br>
                                        Connect <?= COMPANY_NAME ?> with your FreshBooks account
                                        <br>
                                        <br>
                                        <a id="btn_freshbooks_oauth_conn" href="" class="btn btn-primary" style="width: 320px">
                                            <i class="fas fa-link"></i> Connect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                    <div style="display: none;" class="col-md-12 text-center btn_freshbooks_push">
                                        <br>
                                        Your <?= COMPANY_NAME ?> Dashboard is now <strong>connected</strong> with your FreshBooks account.
                                        <br><br>
                                        <?= COMPANY_NAME ?> will  push your current customers, invoices and payments.
                                        We will upload draft and open invoices only.
                                        <br>
                                        <br>
                                        <br>
                                        <a id="btn_freshbooks_up"  href="" class="btn btn-primary" style="width: 200px">
                                            <i class="fas fa-download"></i> Start Push											
                                        </a>
                                        <a id="btn_freshbooks_disconnect"  href="" class="btn btn-outline-neutral" style="width: 200px">
                                            Disconnect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                </div>
                                <?php echo form_close() ?>
                            </div>

                            <div id="nav-pills-tabs-quickbooks" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-quickbooks-tab">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'form_controlcenter']); ?>
                                <div class="row">
                                    <div style="display: none;" class="col-md-12 text-center btn_quickbooks_oauth_conn">
                                        <br>
                                        Connect <?= COMPANY_NAME ?> with your Quickbooks account
                                        <br>
                                        <br>
                                        <a id="btn_quickbooks_oauth_conn" href="" class="btn btn-primary" style="width: 320px">
                                            <i class="fas fa-link"></i> Connect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                    <div style="display: none;" class="col-md-12 text-center btn_quickbooks_push">
                                        <br>
                                        Your <?= COMPANY_NAME ?> Dashboard is now <strong>connected</strong> with your Quickbooks account.
                                        <br><br>
                                        <?= COMPANY_NAME ?> will  push your current customers, products ,invoices and payments.
                                        We will upload draft and open invoices only.
                                        <br>
                                        <br>
                                        <br>
                                        <a id="btn_quickbooks_up"  href="" class="btn btn-primary" style="width: 200px">
                                            <i class="fas fa-download"></i> Start Push											
                                        </a>
                                        <a id="btn_quickbooks_disconnect"  href="" class="btn btn-outline-neutral" style="width: 200px">
                                            Disconnect
                                        </a>
                                        <br>
                                        <br>
                                    </div>
                                </div>
                                <?php echo form_close() ?>
                            </div>
                            <div id="nav-pills-tabs-slack" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-slack-tab">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'form_controlcenter']); ?>
                                <div class="row">     
                                    <div style="display: none;" class="col-md-12 text-center btn_slack_save">
                                        <br>
                                        Connect <?= COMPANY_NAME ?> with your slack account
                                        <br>
                                        <br>
                                        
                                        <div class="row">
                                            <div class="col-md-4"></div>
                                            <div class="col-md-4">
                                                Each time you receive a payment you can be notified on your Slack account on your prefered channel
                                                <br>
                                                <br>
                                                <br>                                               

                                                <div class="form-group text-left">                                                    
                                                    <label for="slack_text_oauth">User OAuth Token:</label>                                                    
                                                    <input type="text" class="form-control" id="slack_text_oauth" placeholder="">
                                                </div>
                                                
                                                <br>
                                                
                                                <div class="row text-left">
                                                    <div class="col-md-12">
                                                        <div class="form-group">                                                            
                                                            <label for="slack_channel">Prefered Channel:</label>
                                                            <input type="text" class="form-control" id="slack_channel" placeholder="">
                                                        </div>                                        
                                                    </div>
                                                    <div class="col-md-12">
                                                        <label>&nbsp;</label>
                                                        <div class="form-group">                                                                                                                        
                                                            <button id="btn_slack_testconection"  href="" class="btn btn-secondary w-100">
                                                                Test Connection
                                                            </button>
                                                        </div>                                                        
                                                    </div>
                                                </div>
                                                <br>
                                                 <div class="form-group">                                                    
                                                    <span class="ml-2 font-weight-bold">Enable/Disable System</span>
                                                    <br><br>
                                                    <label class="custom-toggle">
                                                        <input id="slack_enable_system" type="checkbox" name="slack_enable_system" value="1">
                                                        <span class="custom-toggle-slider rounded-circle"></span>
                                                    </label>
                                                </div>                                                                                      
                                                <a id="btn_slack_save" href="" class="btn btn-primary" style="width: 250px">
                                                    <i class="fas fa-link"></i> Save
                                                </a>
                                            </div>
                                            <div class="col-md-4"></div>
                                        </div>

                                        
                                        <br>
                                        <br>
                                    </div>                                     

                                </div>
                                <?php echo form_close() ?>
                            </div>   
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

