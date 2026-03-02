<style>
    #nav-pills-tabs-organizations, #nav-pills-tabs-sub-organizations{
        border-bottom: none;
        border-left: none;
        border-right: none;
        padding:0
    }

    #nav-pills-tabs-tab{
        padding: 23px 15px 1px 15px!important
    }

    .card-header-orgs{
        border:none; 
        padding-left:0;        
        padding-bottom:0;
    }
    .table-orgs{
        padding-top: 8px!important
    }
    .table-orgs2{
        padding-top: 0px!important
    }
    .card-body-orgs{
        padding:0
    }
    .table label a{
        color: hsl(223deg 22% 41%);
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
    <div class="alert alert-default alert-dismissible fade show" role="alert" id="agent_creation_popup_message" style="display: none">
        <span class="alert-icon"><i class="ni ni-like-2"></i></span>
        <span class="alert-text">Please enable popups for <strong><?= $_SERVER['HTTP_HOST'] ?></strong> in your browser while setting up your Company</span>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">×</span>
        </button>
    </div>
    <!-- Table -->
    <div class="row">
        <div class="col">
            <div class="card">
                <div class="card-body card-body-orgs">
                    <ul class="nav nav-tabs-code" id="nav-pills-tabs-tab" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link active" id="nav-pills-tabs-organizations-tab" data-toggle="tab" href="#nav-pills-tabs-organizations" role="tab" aria-controls="nav-pills-tabs-organizations" aria-selected="true">
                                <i class="fas fa-building"></i> Companies 
                            </a>
                        </li>
                        <li class="nav-item just-dev">
                            <a class="nav-link" id="nav-pills-tabs-sub-organizations-tab" data-toggle="tab" href="#nav-pills-tabs-sub-organizations" role="tab" aria-controls="nav-pills-tabs-sub-organizations" aria-selected="false">
                                <i class="fas fa-home"></i> Sub Organizations 
                            </a>
                        </li>
                    </ul>
                    <div class="tab-content">
                        <div id="nav-pills-tabs-organizations" class="tab-pane tab-example-result fade show active" role="tabpanel" aria-labelledby="nav-pills-tabs-organizations-tab">
                            <div class="card-header card-header-orgs">
                                <div class="row">
                                    <div class="col-sm-6">
                                        
                                    </div>
                                    <div class="col-sm-6">
                                        <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-organization" data-toggle="modal">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive py-4 table-orgs">
                                <table id="organizations_datatable" class="table table-flush" width="100%">
                                    <thead class="thead-light">
                                        <tr>
                                            <th></th>
                                            <th><?= langx("company_name") ?></th>
                                            <th><?= langx("phone_number") ?></th>
                                            <th><?= langx("action") ?></th>
                                            <th>
                                                <?= langx("text_to_give") ?>
                                                <style>
                                                    .tooltip-inner{
                                                        max-width: 315px;
                                                        width: 315px; 
                                                    }
                                                </style>
                                                <label class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right" 
                                                       title='<?php $this->load->view('helpers/text_to_give_instructions')?>'>
                                                    ?
                                                </label>
                                            </th>
                                            <th><?= langx("funds") ?></th>
                                            <th>
                                                <?= langx("approval_status") ?>
                                                <label class="tooltip-help" data-toggle="tooltip" data-placement="right" title="Our processing partner needs to review and approve your application before donations can be accepted. This usually takes less than 30 minutes.">
                                                    ?
                                                </label>
                                            </th>
                                            <th><?= langx("state") ?></th>
                                            <th><?= langx("city") ?></th>
                                            <th><?= langx("address") ?></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                </table>
                                <?php
                                echo form_open('organizations/remove', ["id" => "remove_organization_form"]);
                                echo form_close();
                                ?>
                            </div>
                        </div>
                        <div id="nav-pills-tabs-sub-organizations" class="tab-pane fade" role="tabpanel" aria-labelledby="nav-pills-tabs-sub-organizations-tab">
                            <div class="card-header card-header-orgs">
                                <div class="row">
                                    <div class="col-sm-6">

                                    </div>
                                    <div class="col-sm-6">
                                        <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-suborganization" data-toggle="modal">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="table-responsive py-4 table-orgs2">
                                <div id="suborganizations_datatable_div_organization_filter" class="col-md-3 col-sm-12 d-inline-block p-1" style="display: none;">
                                    <label for="suborganizations_datatable_organization_filter"><?= langx('company:') ?></label>
                                    <select id="suborganizations_datatable_organization_filter" class="custom-select custom-select-sm">
                                        <option value="">All Companies</option>
                                    </select>
                                </div>

                                <table id="suborganizations_datatable" class="table table-flush" width="100%">
                                    <thead class="thead-light">
                                        <tr>
                                            <th><?= langx("sub_organization_name") ?></th>
                                            <th><?= langx("address") ?></th>
                                            <th><?= langx("phone") ?></th>
                                            <th><?= langx("pastor") ?></th>
                                            <th><?= langx("funds") ?></th>
                                            <th><?= langx("description") ?></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="add_organization_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('setup_organization') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("organization/save_organization", ['role' => 'form', 'id' => 'add_organization_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('company_name:', 'organization_name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="organization_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('phone_number:', 'phone_number'); ?> <br />
                            <input type="text" class="form-control" name="phone_number" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('website:', 'website'); ?> <br />
                            <input type="text" class="form-control focus-first" name="website" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('city:', 'city'); ?> <br />
                            <input type="text" class="form-control" name="city" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('state:', 'state'); ?> <br />
                            <input maxlength="2" type="text" class="form-control" placeholder="<?= langx('two-digit state or province code') ?>" name="state" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('street_address:', 'street_address'); ?> <br />
                            <input type="text" class="form-control" name="street_address" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('postal:', 'postal'); ?> <br />
                            <input type="text" class="form-control" name="postal" placeholder="">
                        </div>
                    </div>
                </div>
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Save changes</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>

<div class="modal fade" id="ep_onboard_organization_modal">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_organization') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" style="padding-top:0; padding-bottom:0">
                <style>
                    .nav-pills .nav-link.active, .nav-pills .show > .nav-link {
                        color: white;
                        opacity :1;
                    }

                    /*SELECT FIX BUG WHEN USING MULTPLE - THE SEARCH INPUT IS HIDDEN AND SHRINKED TO 0 WIDTH*/
                    .select2-container .select2-search--inline {
                        display: block!important
                    }
                    .select2-search__field {
                        width: 100% !important;
                        margin-left: 5px!important;
                        margin-top: 0px!important;
                        font-size: 14px!important;
                    }
                    /*-----*/
                </style>

                <style>
                    .nav-statements .nav-pills .nav-link {
                        margin: auto;
                        width: 90%;
                    }
                </style>

                <style>
                    .ep-val{
                        color:indianred;
                        font-size: 13px;
                        font-weight: bold;
                    }
                    #ep_onboard_organization_modal .form-group{
                        margin-bottom: 15px
                    }
                </style>

                <?php echo form_open("", ['role' => 'form', 'id' => 'ep_onboard_organization_form', 'autocomplete' => 'nonex']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div id="nav-pills-component" class="tab-pane tab-example-result fade active show nav-statements" role="tabpanel" aria-labelledby="nav-pills-component-tab">
                    <ul class="nav nav-pills nav-fill flex-column flex-sm-row" id="tabs-text" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector active first-nav-link-tab" data-position="1" id="tabs-text-1-tab" data-toggle="tab" href="#tabs-text-1" role="tab" aria-controls="tabs-text-1" aria-selected="false">
                                <i class="fa fa-list"></i>
                                <strong>General Info</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="2" id="tabs-text-2-tab" data-toggle="tab" href="#tabs-text-2" role="tab" aria-controls="tabs-text-2" aria-selected="false">
                                <i class="fa fa-chart-bar"></i>
                                <strong>Company params</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="3" id="tabs-text-3-tab" data-toggle="tab" href="#tabs-text-3" role="tab" aria-controls="tabs-text-3" aria-selected="true">
                                <i class="fa fa-file-signature"></i>
                                <strong>Authorized Signer</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="4" id="tabs-text-4-tab" data-toggle="tab" href="#tabs-text-4" role="tab" aria-controls="tabs-text-4" aria-selected="true">
                                <i class="fa fa-university"></i>
                                <strong>Bank Account</strong>
                            </a>
                        </li>
                    </ul>
                </div>

                <br>

                <div class="tab-content" id="pills-tabContent" style="padding:0px">
                    <div class="tab-pane fade show active" id="tabs-text-1" role="tabpanel" aria-labelledby="tabs-text-1">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('company_name:', 'dba_name'); ?> <br />
                                    <input class="form-control" id="dba_name"  name="step1[dba_name]" placeholder="<?= htmlentities(langx('Merchant "Doing Business As" name')) ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <strong><?php echo langx('legal_name:', 'legal_name'); ?></strong> <br />
                                    <input class="form-control" id="legal_name"  name="step1[legal_name]" placeholder="<?= (langx('Merchant legal name (leave blank if same as DBA name)')) ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('business_category:', 'business_category'); ?> <br />
                                    <select class="form-control" id="business_category" name="step1[business_category]">
                                    </select>
                                </div>
                            </div><div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('business_type:', 'business_type'); ?> <br />
                                    <select class="form-control" id="business_type" name="step1[business_type]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('business_description:', 'business_description'); ?> <br />
                                    <input maxlength="200" class="form-control" id="business_description"  name="step1[business_description]" placeholder="<?= langx('Description of Goods or Services (EX: Donations)') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('email:', 'merchant_email_address'); ?> <br />
                                    <input class="form-control" id="merchant_email_address"  name="step1[email]" placeholder="<?= langx('Merchant email address') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('phone_number:', 'phone_number1'); ?> <br />
                                    <input maxlength="10" class="form-control" id="phone_number1"  name="step1[phone_number]" placeholder="<?= langx('Merchant\'s business phone number') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('website:', 'website'); ?> <br />
                                    <input class="form-control" id="website"  name="step1[website]" placeholder="<?= langx('Merchant\'s business website') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('state:', 'state_province1'); ?> <br />
                                    <select class="form-control" id="state_province1" name="step1[state_province]">
                                        <option value="">— Please Select —</option>
                                        <?php $this->load->view('helpers/us_states_options') ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('city:', 'city1'); ?> <br />
                                    <input maxlength="50" class="form-control" id="city1"  name="step1[city]" placeholder="<?= langx('Merchant\'s business city') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('postal_code:', 'postal_code1'); ?> <br />
                                    <input maxlength="5" class="form-control" id="postal_code1"  name="step1[postal_code]" placeholder="<?= langx('Merchant\'s business postal code') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="form-group">
                                    <?php echo langx('Merchant\'s business address line 1', 'address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_1"  name="step1[address_line_1]" placeholder="<?= langx('Merchant\'s business address line') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('suite', 'address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_2"  name="step1[address_line_2]" type="text" value="">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="tabs-text-2" role="tabpanel" aria-labelledby="tabs-text-2">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('ownership_type:', 'ownership_type'); ?> <br />
                                    <select class="form-control" id="ownership_type" name="step2[ownership_type]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Fed Tax ID:', 'fed_tax_id'); ?> <br />
                                    <input maxlength="10" class="form-control" id="fed_tax_id" name="step2[fed_tax_id]" placeholder="<?= langx('Federal Tax ID (EIN): 00-0000000') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                            <div class="col-md-12">
                                <hr style="margin-top:0">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Your Processing Methods') ?></h4>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('Card present/swiped percentage:', 'swiped_percent'); ?> <br />
                                    <input type="number" class="form-control update-methods-total" id="swiped_percent" name="step2[swiped_percent]" placeholder="<?= langx('Card present/swiped percentage') ?>" value="0">
                                    <span class="ep-val" id="swiped_percent_val" style="display: none" class="ep-val">Value must be between 0 and 100</span>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('Card not present/keyed percentage:', 'keyed_percent'); ?> <br />
                                    <input type="number" class="form-control update-methods-total" id="keyed_percent"  name="step2[keyed_percent]" placeholder="<?= langx('Card not present/keyed percentage') ?>" value="0">
                                    <span class="ep-val" id="keyed_percent_val" style="display: none" class="ep-val">Value must be between 0 and 100</span>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('Ecommerce percentage :', 'ecommerce_percent'); ?> <br />
                                    <input type="number" class="form-control update-methods-total" id="ecommerce_percent"  name="step2[ecommerce_percent]" placeholder="<?= langx('Ecommerce percentage') ?>" value="100">
                                    <span class="ep-val" id="ecommerce_percent_val" style="display: none" class="ep-val">Value must be between 0 and 100</span>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('total:', 'methods_total_percent'); ?> <br />
                                    <input disabled class="form-control" id="methods_total_percent" type="text" value="100%">
                                    <span class="ep-val" id="methods_total_percent_val" style="display: none">Must equal 100%</span>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Monthly Card Volume:', 'cc_monthly_volume_range'); ?> <br />
                                    <select class="form-control" id="cc_monthly_volume_range" name="step2[cc_monthly_volume_range]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Average Ticket Size:', 'cc_avg_ticket_range'); ?> <br />
                                    <select class="form-control" id="cc_avg_ticket_range" name="step2[cc_avg_ticket_range]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('High Ticket', 'cc_high_ticket'); ?> <br />
                                    <input maxlength="10" type="number" class="form-control" id="cc_high_ticket" placeholder="$" name="step2[cc_high_ticket]" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Monthly Check Volume:', 'ec_monthly_volume_range'); ?> <br />
                                    <select class="form-control" id="ec_monthly_volume_range" name="step2[ec_monthly_volume_range]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Average Check Size:', 'ec_avg_ticket_range'); ?> <br />
                                    <select class="form-control" id="ec_avg_ticket_range" name="step2[ec_avg_ticket_range]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('High Ticket', 'ec_high_ticket'); ?> <br />
                                    <input maxlength="10" type="number" class="form-control" id="ec_high_ticket" placeholder="$" name="step2[ec_high_ticket]" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-3" role="tabpanel" aria-labelledby="tabs-text-3">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s first name:', 'first_name'); ?> <br />
                                    <input maxlength="20" class="form-control" id="first_name"  name="step3[first_name]" placeholder="<?= langx('First name') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s last name:', 'last_name'); ?> <br />
                                    <input maxlength="20" class="form-control" id="last_name"  name="step3[last_name]" placeholder="<?= langx('Last name') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s date of birth:', 'sign_birth'); ?>
                                    <input class="form-control" id="sign_birth" name="step3[date_of_birth]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s phone number:', 'phone_number2'); ?> <br />
                                    <input maxlength="10" class="form-control" id="phone_number2"  name="step3[phone_number]" placeholder="<?= langx('phone_number') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s SSN (Last 4 digits):', 'ssn'); ?> <br />
                                    <input maxlength="4" class="form-control" id="ssn" name="step3[ssn]" placeholder="<?= langx('SSN') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s Title:', 'title'); ?> <br />
                                    <input maxlength="20" class="form-control" id="title" name="step3[title]" placeholder="<?= langx('Title') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Percentage of business owned:', 'ownership_percent'); ?> <br />
                                    <input type="number" class="form-control" id="ownership_percent"  name="step3[ownership_percent]" placeholder="<?= langx('Ownership percent') ?>" value="0">
                                    <span class="ep-val" id="ownership_percent_val" style="display: none" class="ep-val">Value must be between 0 and 100</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s State:', 'state_province2'); ?> <br />
                                    <select class="form-control" id="state_province2" name="step3[state_province]">
                                        <option value="">— Please Select —</option>
                                        <?php $this->load->view('helpers/us_states_options') ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s city:', 'city2'); ?> <br />
                                    <input maxlength="50" class="form-control" id="city2" name="step3[city]" placeholder="<?= langx('City') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s postal code:', 'postal_code2'); ?> <br />
                                    <input maxlength="5" class="form-control" id="postal_code2"  name="step3[postal_code]" placeholder="<?= langx('postal_code') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="form-group">
                                    <?php echo langx('Primary principal or signer\'s residential address line 1', 'address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_1-2"  name="step3[address_line_1]" placeholder="<?= langx('Primary principal or signer\'s residential address line 1') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('suite', 'address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_2-2"  name="step3[address_line_2]" type="text" value="">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-4" role="tabpanel" aria-labelledby="tabs-text-4">
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Where do you want us to send the money?') ?></h4>
                                <br>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Nine-digit Bank routing number:', 'routing_number'); ?> <br />
                                    <input type="number" maxlength="9" class="form-control" id="routing_number" name="step4[routing_number]" placeholder="<?= langx('Routing number') ?>" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Bank account number:', 'account_number'); ?> <br />
                                    <input type="number" maxlength="17" class="form-control" id="account_number" name="step4[account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Name on bank account:', 'account_holder_name'); ?> <br />
                                    <input maxlength="40" class="form-control" id="account_holder_name" name="step4[account_holder_name]" placeholder="<?= langx('Holder name') ?>" value="">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <?php echo form_close(); ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button id="btn_back" type="button" class="btn btn-default" style="width: 150px">Close</button>
                <button id="btn_action" type="button" class="btn btn-primary" style="width: 200px">Continue</button>
            </div>
        </div>
    </div>

</div>

<div class="modal fade" id="add_suborganization_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_sub_organization') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("suborganization/save_suborganization", ['role' => 'form', 'id' => 'add_suborganization_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('sub_organization_name:', 'suborganization_name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="suborganization_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('company:', 'organization_id'); ?> <br />
                            <select class="form-control" name="organization_id" placeholder="">
                                <option value="">Select a Company</option>
                                <?php foreach ($view_data['organizations'] as $organization) : ?>
                                    <option value="<?= $organization['ch_id'] ?>"><?= htmlspecialchars($organization['church_name'], ENT_QUOTES, 'UTF-8') ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('address:', 'address'); ?> <br />
                            <input type="text" class="form-control" name="address" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('phone:', 'phone'); ?> <br />
                            <input type="text" class="form-control" name="phone" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('pastor:', 'pastor'); ?> <br />
                            <input type="text" class="form-control" name="pastor" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('description:', 'description'); ?> <br />
                            <textarea type="text" class="form-control" name="description" rows="4" placeholder=""> </textarea>
                        </div>
                    </div>

                </div>
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Save changes</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>