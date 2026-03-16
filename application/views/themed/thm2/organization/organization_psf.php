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
                                        <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-organization just-dev" data-toggle="modal">
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
                                                       title='<?php $this->load->view('helpers/text_to_give_instructions') ?>'>
                                                    ?
                                                </label>
                                            </th>
                                           
                                            <th>
                                                <?= langx("approval_status") ?>
                                                <label class="tooltip-help" data-toggle="tooltip" data-placement="right" title="Our processing partner needs to review and approve your application before donations can be accepted. This usually takes less than 30 minutes.">
                                                    ?
                                                </label>
                                            </th>

                                            <th>Receive CC <br>Payments</th>
                                            <th>Receive Bank <br>Payments</th>
                                            <th>Bank Account <br>Status</th>
                                            <th><?= langx("state") ?></th>
                                            <th><?= langx("city") ?></th>
                                            <th><?= langx("address") ?></th>
                                            <th>Action</th>
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
                                <!-- comment <div id="suborganizations_datatable_div_organization_filter" class="col-md-3 col-sm-12 d-inline-block p-1" style="display: none;">
                                    <label for="suborganizations_datatable_organization_filter"><?= langx('company:') ?></label>
                                    <select id="suborganizations_datatable_organization_filter" class="custom-select custom-select-sm">
                                        <option value="">All Companies</option>
                                    </select>
                                </div>-->

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
                                <!--<i class="fa fa-list"></i>-->
                                <strong>General Info</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="2" id="tabs-text-2-tab" data-toggle="tab" href="#tabs-text-2" role="tab" aria-controls="tabs-text-2" aria-selected="false">
                                <!--<i class="fa fa-map-marked-alt"></i>-->
                                <strong>&nbsp;  &nbsp; &nbsp;  &nbsp;  &nbsp; Address &nbsp;  &nbsp;  &nbsp; &nbsp;  &nbsp;</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="3" id="tabs-text-3-tab" data-toggle="tab" href="#tabs-text-3" role="tab" aria-controls="tabs-text-3" aria-selected="true">
                                <!--<i class="fa fa-file-signature"></i>-->
                                <strong>&nbsp;  &nbsp; &nbsp;  &nbsp;  &nbsp; Owner &nbsp;  &nbsp;  &nbsp; &nbsp;  &nbsp;</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="4" id="tabs-text-4-tab" data-toggle="tab" href="#tabs-text-4" role="tab" aria-controls="tabs-text-4" aria-selected="true">
                                <!--<i class="fa fa-university"></i>-->
                                <strong>Bank Account</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="5" id="tabs-text-5-tab" data-toggle="tab" href="#tabs-text-5" role="tab" aria-controls="tabs-text-5" aria-selected="true">
                                <!--<i class="fa fa-university"></i>-->
                                <strong>Terms & Conditions</strong>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="6" id="tabs-text-6-tab" data-toggle="tab" href="#tabs-text-6" role="tab" aria-controls="tabs-text-6" aria-selected="true">
                                <!--<i class="fas fa-info-circle"></i>-->
                                <strong>Status</strong>
                            </a>
                        </li>
                    </ul>
                </div>

                <br>

                <div class="tab-content" id="pills-tabContent" style="padding:0px">
                    <div class="tab-pane fade show active" id="tabs-text-1" role="tabpanel" aria-labelledby="tabs-text-1">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('company_name:', 'dba_name'); ?> <br />
                                    <input class="form-control" id="dba_name"  name="step1[dba_name]" placeholder="<?= htmlentities(langx('"Doing Business As" name')) ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('legal_name:', 'legal_name'); ?><br />
                                    <input class="form-control" id="legal_name"  name="step1[legal_name]" placeholder="<?= (langx('Merchant legal name')) ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('region:', 'region'); ?> <br />
                                    <select class="form-control" id="region" name="step1[region]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('business_category:', 'businessCategory'); ?> <br />
                                    <select class="form-control" id="businessCategory" name="step1[business_category]">
                                    </select>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('phone_number:', 'phone_number1'); ?> <br />
                                    <input maxlength="10" class="form-control" id="phone_number1"  name="step1[phone_number]" placeholder="<?= langx('Merchant\'s phone number') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('website:', 'website'); ?> <br />
                                    <input class="form-control" id="website"  name="step1[website]" placeholder="<?= langx('Merchant\'s website') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3 hide">
                                <div class="form-group">
                                    <?php echo langx('email:', 'merchant_email_address'); ?> <br />
                                    <input class="form-control" id="merchant_email_address"  name="step1[email]" placeholder="<?= langx('Merchant email address') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('yearly_volume_range:', 'yearlyVolumeRange'); ?> <br />
                                    <select class="form-control" id="yearlyVolumeRange" name="step1[yearlyVolumeRange]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('average_transaction_amount:', 'averageTransactionAmount'); ?> <br />
                                    <input maxlength="10" type="number" class="form-control" id="averageTransactionAmount" placeholder="$" name="step1[averageTransactionAmount]" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('processing_currency:', 'processingCurrency'); ?> <br />
                                    <select class="form-control" id="processingCurrency" name="step1[processing_currency]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('dynamic_descriptor:', 'dynamicDescriptor'); ?><br />
                                    <input class="form-control" id="dynamicDescriptor"  name="step1[dynamicDescriptor]" placeholder="<?= (langx('Dynamic Descriptor')) ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('phone_descriptor:', 'phoneDescriptor'); ?> <br />
                                    <input maxlength="10" class="form-control" id="phoneDescriptor"  name="step1[phoneDescriptor]"  placeholder="<?= (langx('Phone Descriptor')) ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('business_type:', 'businessType'); ?> <br />
                                    <select class="form-control" id="businessType" name="step1[businessType]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="federalTaxNumber" id="taxNumberLabel" data-us="<?= langx('Federal Tax Number:') ?>" data-eu="<?= langx('Tax Identification Number:') ?>">
                                        <?= langx('Federal Tax Number:') ?>
                                    </label> <br />
                                    <input maxlength="9" default-length="9" europe-length="30" class="form-control" id="federalTaxNumber" name="step1[federalTaxNumber]" placeholder="<?= langx('Federal Tax Number') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('Registration Number (Europe Only):', 'registrationNumber'); ?> <br />
                                    <input maxlength="20" disabled="" class="form-control" id="registrationNumber" name="step1[registrationNumber]" placeholder="<?= langx('Registration Number') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="tabs-text-2" role="tabpanel" aria-labelledby="tabs-text-2">
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Merchant Address') ?></h4>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('country:', 'country'); ?> <br />
                                    <select class="form-control" id="country" name="step2[country]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('state/province:', 'state_province1'); ?> <br />
                                    <select class="form-control" id="state_province1" name="step2[state_province]">                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('city:', 'city1'); ?> <br />
                                    <input maxlength="50" class="form-control" id="city1"  name="step2[city]" placeholder="<?= langx('Merchant\'s city') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('zip:', 'postal_code1'); ?> <br />
                                    <input class="form-control" id="postal_code1"  name="step2[postal_code]" placeholder="<?= langx('Merchant\'s zip') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Merchant\'s address line 1', 'address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_1"  name="step2[address_line_1]" placeholder="<?= langx('Merchant\'s address line 1') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Merchant\'s address line 2', 'address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="address_line_2"  name="step2[address_line_2]" placeholder="<?= langx('Merchant\'s address line 2') ?>" type="text" value="">
                                </div>
                            </div>

                            <!-- -------------------------------------------------------- -->
                            <!-- -------------------------------------------------------- -->
                            <!-- -------------------------------------------------------- -->
                        </div>
                        <div class="row hide">
                            <div class="col-md-12">
                                <h4><?= langx('Trading Address') ?></h4>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('country:', 'trading_country'); ?> <br />
                                    <select class="form-control" id="trading_country" name="step2[trading_country]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('state/province:', 'trading_state_province1'); ?> <br />
                                    <select class="form-control" id="trading_state_province1" name="step2[trading_state_province]">                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('city:', 'trading_city1'); ?> <br />
                                    <input maxlength="50" class="form-control" id="trading_city1"  name="step2[trading_city]" placeholder="<?= langx('trading_city') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('zip:', 'trading_postal_code1'); ?> <br />
                                    <input class="form-control" id="trading_postal_code1"  name="step2[trading_postal_code]" placeholder="<?= langx('trading_zip') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('address line 1', 'trading_address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="trading_address_line_1"  name="step2[trading_address_line_1]" placeholder="<?= langx('trading_address_line_1') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('address line 2', 'trading_address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="trading_address_line_2"  name="step2[trading_address_line_2]" placeholder="<?= langx('trading_address_line_2') ?>" type="text" value="">
                                </div>
                            </div>                            
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-3" role="tabpanel" aria-labelledby="tabs-text-3">
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Business Owner') ?></h4>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('first_name:', 'first_name'); ?> <br />
                                    <input maxlength="20" class="form-control" id="first_name"  name="step3[first_name]" placeholder="<?= langx('First name') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('last_name:', 'last_name'); ?> <br />
                                    <input maxlength="20" class="form-control" id="last_name"  name="step3[last_name]" placeholder="<?= langx('Last name') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('job_title:', 'title'); ?> <br />
                                    <input maxlength="20" class="form-control" id="title" name="step3[title]" placeholder="<?= langx('Title') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('phone number:', 'phone_number2'); ?> <br />
                                    <input maxlength="10" class="form-control" id="phone_number2"  name="step3[phone_number]" placeholder="<?= langx('phone_number') ?>" type="number" value=""
                                           oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                           >
                                </div>
                            </div>

                            <div class="col-md-2">
                                <div class="form-group">
                                    <?php echo langx('owner_is_european?:', 'business_owner_is_european'); ?> <br />
                                    <select class="form-control" id="business_owner_is_european" name="step3[business_owner_is_european]">
                                        <option value="">— Please Select —</option>                                        
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('nationality (if_european):', 'nationality'); ?> <br />
                                    <select class="form-control" id="nationality" name="step3[nationality]" disabled>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <div class="form-group">
                                    <?php echo langx('gender:', 'owner_gender'); ?> <br />
                                    <select class="form-control" id="owner_gender" name="step3[owner_gender]" disabled>
                                    </select>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('date of birth_(mm/dd/yyyy):', 'date_of_birth'); ?>
                                    <input class="form-control" id="date_of_birth" name="step3[date_of_birth]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-group">
                                    <?php echo langx('SSN:', 'ssn'); ?> <br />
                                    <input class="form-control" id="ssn" name="step3[ssn]" placeholder="<?= langx('SSN') ?>" type="password" value="">
                                </div>
                            </div>

                            <!-- ------------------>
                            <!-- --------  Previous optional for USA check documentation ---------- -->

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('current_country:', 'current_country'); ?> <br />
                                    <select class="form-control" id="owner_current_country" name="step3[owner_current_country]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('current_state/province:', 'current_state_province1'); ?> <br />
                                    <select class="form-control" id="current_state_province1" name="step3[owner_current_state_province]">                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('current_city:', 'current_city1'); ?> <br />
                                    <input maxlength="50" class="form-control" id="current_city1"  name="step3[owner_current_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('current_zip:', 'current_postal_code1'); ?> <br />
                                    <input class="form-control" id="current_postal_code1"  name="step3[owner_current_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                            <div class="col-md-5">
                                <div class="form-group">
                                    <?php echo langx('current_address line 1:', 'current_address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="current_address_line_1"  name="step3[owner_current_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('current_address line 2:', 'current_address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="current_address_line_2"  name="step3[owner_current_address_line_2]" placeholder="<?= langx('address_line_2') ?>" type="text" value="">
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('years_at_address:', 'years_at_address'); ?> <br />
                                    <select class="form-control" id="years_at_address" name="step3[years_at_address]">
                                        <option value="">— Please Select —</option>
                                        <?php for ($i = 1; $i < 81; $i++): ?>
                                            <option value="<?= $i ?>"><?= $i ?></option>
                                        <?php endfor; ?>
                                    </select>
                                </div>
                            </div>                            
                        </div>

                        <style>.hide {display:none}</style>

                        <div class="row hide cont-prev-addr">
                            <div class="col-md-12">
                                <h4><?= langx('Previous Address') ?>  <span style="font-size:12px; font-style: italic; font-weight: normal">(Required if years at address is less than 3)</span></h4>
                            </div>

                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('previous_country:', 'previous_country'); ?> <br />
                                    <select class="form-control" id="owner_previous_country" name="step3[owner_previous_country]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('previous_state/province:', 'previous_state_province1'); ?> <br />
                                    <select class="form-control" id="previous_state_province1" name="step3[owner_previous_state_province]">                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('previous_city:', 'previous_city1'); ?> <br />
                                    <input maxlength="50" class="form-control" id="previous_city1"  name="step3[owner_previous_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('previous_zip:', 'previous_postal_code1'); ?> <br />
                                    <input class="form-control" id="previous_postal_code1"  name="step3[owner_previous_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                           >
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('previous_address line 1', 'previous_address_line_1'); ?> <br />
                                    <input maxlength="100" class="form-control" id="previous_address_line_1"  name="step3[owner_previous_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('previous_address line 2', 'previous_address_line_2'); ?> <br />
                                    <input maxlength="100" class="form-control" id="previous_address_line_2"  name="step3[owner_previous_address_line_2]" placeholder="<?= langx('trading_address_line_2') ?>" type="text" value="">
                                </div>
                            </div>                            
                        </div>

                        <div class="row hide cont-eu-identity-card">
                            <div class="col-md-12">
                                <h4><?= langx('European Identity Card') ?></h4>
                            </div>

                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('number:', 'euidcard_number'); ?> <br />
                                    <input maxlength="20" class="form-control" id="euidcard_number"  name="step3[euidcard_number]" placeholder="<?= langx('number') ?>" type="text" value="">
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('country_of_issue:', 'euidcard_country_issue'); ?> <br />
                                    <select class="form-control" id="euidcard_country_issue" name="step3[euidcard_country_issue]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                Expiry Date (mm/dd/yyyy) <?php echo langx(':', 'eu_xpry_date'); ?> <br /> <!-- chrome autocomplete messages issues when adding  expiration labels -->
                                <div class="form-group">                                    
                                    <input class="form-control" id="eu_xpry_date" name="step3[eu_xpry_date]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('id_number_line_1:', 'id_number_line_1'); ?> <br />
                                    <input maxlength="30" class="form-control" id="id_number_line_1"  name="step3[id_number_line_1]" placeholder="<?= langx('the first line of the MRZ.') ?>" type="text" value="">
                                </div>
                            </div>                                                        
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('id_number_line_2:', 'id_number_line_2'); ?> <br />
                                    <input maxlength="30" class="form-control" id="id_number_line_2"  name="step3[id_number_line_2]" placeholder="<?= langx('the second line of the MRZ.') ?>" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('id_number_line_3:', 'id_number_line_3'); ?> <br />
                                    <input maxlength="30" class="form-control" id="id_number_line_3"  name="step3[id_number_line_3]" placeholder="<?= langx('the third line of the MRZ.') ?>" type="text" value="">
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
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('available_bank_types:', 'bank_type'); ?> <br />
                                    <select class="form-control" id="bank_type" name="step4[bank_type]">
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="row bank_type wire_type hide">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Bank account number:', 'wire_account_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="wire_account_number" name="step4[wire_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Swift Number:', 'wire_swift_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="wire_swift_number" name="step4[wire_swift_number]" placeholder="<?= langx('Swift Number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Country:', 'wire_beneficiary_country'); ?> <br />
                                            <select class="form-control" id="wire_beneficiary_country" name="step4[wire_beneficiary_country]">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Account Name:', 'wire_beneficiary_name'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_name"  name="step4[wire_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Address:', 'wire_beneficiary_address'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_address"  name="step4[wire_beneficiary_address]" placeholder="<?= (langx('Beneficiary Address')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary City:', 'wire_beneficiary_city'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_city"  name="step4[wire_beneficiary_city]" placeholder="<?= (langx('Beneficiary City')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Region:', 'wire_beneficiary_region'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_region"  name="step4[wire_beneficiary_region]" placeholder="<?= (langx('Beneficiary Region')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Post Code:', 'wire_beneficiary_post_code'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_post_code"  name="step4[wire_beneficiary_post_code]" placeholder="<?= (langx('Beneficiary Post Code')) ?>" type="text" value="">
                                        </div>
                                    </div>

                                    <div class="col-md-12">
                                        <h4><?= langx('Beneficiary Bank Information') ?></h4>
                                        <br>
                                    </div>

                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank Country:', 'wire_beneficiary_bank_country'); ?> <br />
                                            <select class="form-control" id="wire_beneficiary_bank_country" name="step4[wire_beneficiary_bank_country]">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank Name:', 'wire_beneficiary_bank_name'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_bank_name"  name="step4[wire_beneficiary_bank_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank Address:', 'wire_beneficiary_bank_address'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_bank_address"  name="step4[wire_beneficiary_bank_address]" placeholder="<?= (langx('Beneficiary Address')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank City:', 'wire_beneficiary_bank_city'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_bank_city"  name="step4[wire_beneficiary_bank_city]" placeholder="<?= (langx('Beneficiary City')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank Region:', 'wire_beneficiary_bank_region'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_bank_region"  name="step4[wire_beneficiary_bank_region]" placeholder="<?= (langx('Beneficiary Region')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Bank Post Code:', 'wire_beneficiary_bank_post_code'); ?><br />
                                            <input class="form-control" id="wire_beneficiary_bank_post_code"  name="step4[wire_beneficiary_bank_post_code]" placeholder="<?= (langx('Beneficiary Post Code')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                </div>
                                <div class="row bank_type sepa_type hide">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('bank_country:', 'sepa_country'); ?> <br />
                                            <select class="form-control" id="sepa_country" name="step4[sepa_country]">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Account Name:', 'sepa_beneficiary_name'); ?><br />
                                            <input class="form-control" id="sepa_beneficiary_name"  name="step4[sepa_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Swift Number:', 'sepa_swift_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="sepa_swift_number" name="step4[sepa_swift_number]" placeholder="<?= langx('Swift Number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('IBAN Number:', 'sepa_iban_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="sepa_iban_number" name="step4[sepa_iban_number]" placeholder="<?= langx('IBAN Number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                </div>
                                <div class="row bank_type bacs_type hide">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('bank_country:', 'bacs_country'); ?> <br />
                                            <select class="form-control" id="bacs_country" name="step4[bacs_country]">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Beneficiary Account Name:', 'bacs_beneficiary_name'); ?><br />
                                            <input class="form-control" id="bacs_beneficiary_name"  name="step4[bacs_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Account number:', 'bacs_account_number'); ?> <br />
                                            <input type="number" maxlength="8" class="form-control" id="bacs_account_number" name="step4[bacs_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?php echo langx('Sort Code:', 'bacs_sort_code'); ?> <br />
                                            <input type="number" maxlength="6" class="form-control" id="bacs_sort_code" name="step4[bacs_sort_code]" placeholder="<?= langx('Sort Code') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                </div>
                                <div class="row bank_type eft_type hide">
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <?php echo langx('Bank account number:', 'eft_account_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="eft_account_number" name="step4[eft_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <?php echo langx('Transit Number:', 'eft_transit_number'); ?> <br />
                                            <input type="number" maxlength="5" class="form-control" id="eft_transit_number" name="step4[eft_transit_number]" placeholder="<?= langx('Transit number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <?php echo langx('Institution ID:', 'eft_institution_id'); ?> <br />
                                            <input maxlength="3" class="form-control" id="eft_institution_id" name="step4[eft_institution_id]" placeholder="<?= langx('Institution ID') ?>" value="">
                                        </div>
                                    </div>
                                </div>
                                <div class="row bank_type ach_type hide">
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <?php echo langx('Bank account number:', 'ach_account_number'); ?> <br />
                                            <input type="number" maxlength="20" class="form-control" id="account_number" name="step4[ach_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <?php echo langx('Nine-digit Bank routing number:', 'routing_number'); ?> <br />
                                            <input type="number" maxlength="9" class="form-control" id="routing_number" name="step4[ach_routing_number]" placeholder="<?= langx('Routing number') ?>" value=""
                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                            >
                                        </div>
                                    </div>
                                    <div class="col-md-4 hide">
                                        <div class="form-group">
                                            <?php echo langx('Name on bank account:', 'account_holder_name'); ?> <br />
                                            <input maxlength="40" class="form-control" id="account_holder_name" name="step4[account_holder_name]" placeholder="<?= langx('Holder name') ?>" value="">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row bank_account_information_sent">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <br>
                                    <h4>Bank account information was already sent</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-5" role="tabpanel" aria-labelledby="tabs-text-5">
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Terms & Conditions') ?></h4>
                                <br>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group terms_conditions_1_link">

                                </div>
                            </div>
                            <div class="col-md-12 hide">
                                <div class="form-group terms_conditions_2_link">

                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <br>
                                    <span class="terms_conditions_ask_message hide">
                                        By submitting this form, I hereby agree to and accept the payment processor (Paysafe) terms and conditions
                                    </span>
                                    <span class="terms_conditions_already_accepted hide">
                                        <h4>Terms and conditions accepted</h4>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-6" role="tabpanel" aria-labelledby="tabs-text-6">
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Status') ?></h4>
                                <br>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <h4><?= langx('Merchant\'s credit card account') ?></h4>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <p class="account_status_credit_card"></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <br>
                                <h4><?= langx('Merchant\'s direct debit account') ?></h4>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <p class="account_status_direct_debit"></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <br>
                                <h4><?= langx('Bank account') ?></h4>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <p class="microdeposit_validation_status"></p>
                                    <p class="microdeposit_validation_status_message"></p>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <div class="microdeposit_validation_container">
                                        <p>
                                            In order to validate the bank account information a deposit between 0.01 and 0.99 
                                            has been sent to your bank account, the deposit should be reflected in your account in 1–2 business days. 
                                            As soon as you have the deposit in sight please proceed to submit the exact amount here:
                                        </p>
                                    </div>
                                    <div class="microdeposit_validation_container_success hide">
                                        <p>
                                            Your bank account information has been successfully validated.
                                        </p>
                                    </div>
                                    <div class="eu_validation_container hide">
                                        <p>
                                            In order to validate the account information please send us to hello@chatgive.com the next information:
                                        </p>
                                        <ul class="uk_validation_options hide">
                                            <li>Voided Check, or</li>
                                            <li>Bank Statement, or</li>
                                            <li>Paying-in Slip, or</li>
                                            <li>Letter from Bank Confirming Account Name, Account Number, and Sort Code</li>
                                        </ul>
                                        <ul class="eu_validation_options hide">
                                            <li>Bank Statement, or</li>
                                            <li>Letter from Bank Confirming Account Name, IBAN, BIC, and Swift Code</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group microdeposit_validation_container">
                                    <?php echo langx('Amount:', 'validation_amount'); ?> <br />
                                    <input maxlength="4" class="form-control" id="validation_amount"  name="step6[validation_amount]" placeholder="<?= langx('0.00') ?>" type="text" value="">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <?php echo form_close(); ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button id="btn_back" type="button" class="btn btn-default">Close</button>
                <button id="btn_action" type="button" class="btn btn-primary">Continue</button>
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
                <h4 class="modal-title">
                <?= langx('save_sub_organization') ?>
                     <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="header-label show-when-add-sub-organization">                        
                         <br>
                        <?= langx('to') ?> 
                        <span class="organization_name" style="font-weight: bold"></span>                       
                        
                    </span>
                </h4>
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