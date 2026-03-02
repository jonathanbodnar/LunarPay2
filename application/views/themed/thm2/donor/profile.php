<style>
    #donations_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
</style>

<?php $this->load->view("general/add_transaction_modal") ?>
<?php $this->load->view("general/person_component_modal") ?>
<?php $this->load->view("general/invoice_component_modal") ?>
<?php $this->load->view("general/product_component_modal") ?>

<?php $profile = $view_data['profile']; ?>
<div class="container-fluid" id="customer-profile-container">
    <div class="row">
        <!-- <div class="col-xl-12 order-xl-1">
            <div class="row" style="margin-top: 20px">
               
                <div class="col-lg-3" >
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="row"  >
                                <div class="col">
                                    <h5 class="card-title text-uppercase text-muted mb-0">Total Given (NET)</h5>
                                    <span class="h2 font-weight-bold mb-0">$<?= number_format($profile->net, 2, '.', '') ?></span>
                                </div>
                                <div class="col-auto">
                                    <div class="icon icon-shape bg-gradient-green text-white rounded-circle shadow">
                                        <i class="ni ni-money-coins"></i>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-3 mb-0 text-sm">
                                <?= $profile->first_date_formatted ? '<span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>' : '' ?>
                                <span class="text-nowrap"><?= $profile->first_date_formatted ? 'Since ' . $profile->first_date_formatted : '' ?></span>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3"  >
                    <div class="card card-stats">
                        <div class="card-body">
                            <div class="row">
                                <div class="col">
                                    <h5 class="card-title text-uppercase text-muted mb-0">Month</h5>
                                    <span class="h2 font-weight-bold mb-0">$<?= number_format($profile->net_month, 2, '.', '') ?></span>
                                </div>
                                <div class="col-auto">
                                    <div class="icon icon-shape bg-gradient-green text-white rounded-circle shadow">
                                        <i class="ni ni-money-coins"></i>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-3 mb-0 text-sm">
                                <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                <span class="text-nowrap">Last 30 Days</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>-->

        <div class="col-xl-12 order-xl-1">
            <div class="row">
                <!--<div class="col-lg-2"></div>-->
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-6">
                                    <h3 class="mb-0"><b>Profile</b></h3>
                                </div>
                                <div class="col-6 text-right">
                                    <div id="profileActionWrapper" class="dropdown float-right m-2">
                                        <button class="btn btn-primary btn-sm dropdown-toggle" type="button" id="profileActionsDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            Actions
                                        </button>
                                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="profileActionsDropdown">
                                            <a class="dropdown-item btn-GENERAL-person-component" href="javascript:void(0)" data-person_id="<?= $profile->id ?>">
                                                <i class="fas fa-pen"></i> Edit Customer
                                            </a>
                                            <a class="dropdown-item btn-GENERAL-add-transaction" href="javascript:void(0)" 
                                               data-org_id="<?= $profile->org_id ?>"
                                               data-suborg_id="<?= $profile->suborg_id ?>"
                                               data-context="donor-profile"
                                               data-donor_id="<?= $profile->id ?>"
                                               data-donor_name="<?= htmlspecialchars($profile->name, ENT_QUOTES, 'UTF-8') ?>">
                                                <i class="fas fa-dollar-sign"></i> Create Transaction
                                            </a>
                                            <a class="dropdown-item btn-GENERAL-add-invoice" href="javascript:void(0)"
                                               data-org_id="<?= $profile->org_id ?>"
                                               data-suborg_id="<?= $profile->suborg_id ?>"
                                               data-context="customer_datatable_profile"
                                               data-donor_id="<?= $profile->id ?>"
                                               data-donor_name="<?= htmlspecialchars($profile->name, ENT_QUOTES, 'UTF-8') ?>"
                                               data-donor_email="<?= htmlspecialchars($profile->email, ENT_QUOTES, 'UTF-8') ?>"
                                               data-donor_business_name="<?= htmlspecialchars($profile->business_name, ENT_QUOTES, 'UTF-8') ?>">
                                                <i class="fas fa-print"></i> Create Invoice
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body" style="padding-left: 60px">
                            <?php echo form_open("donors/save_profile", ['role' => 'form', 'id' => 'add_donor_profile_form', 'data-id' => $profile->id]); ?>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <h6 class="heading-small text-muted mb-4">Account information</h6>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">First Name</span>
                                                <span class="d-block h3 text-white"><?= $profile->first_name ? $profile->first_name : '-' ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">Last Name</span>
                                                <span class="d-block h3 text-white"><?= $profile->last_name ? $profile->last_name : '-' ?></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">Email Address</span>
                                                <span class="d-block h3 text-white"><?= $profile->email ? $profile->email : '-' ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">Phone</span>
                                                <span class="d-block h3 text-white"><?= $profile->phone_code ? '+' . $profile->phone_code . ' ' . $profile->phone : ($profile->phone ? $profile->phone : '-') ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">Business name</span>
                                                <span class="d-block h3 text-white"><?= $profile->business_name ? $profile->business_name : '-' ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light">Address</span>
                                                <span class="d-block h3 text-white"><?= $profile->address ? $profile->address : '-' ?></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-12 mb-3">
                                    <span class="mt-2 heading-small text-muted">PAYMENT METHODS</span>
                                    <button type="button" class="btn btn-sm ml-2" type="button" id="openSourceModalBtn">
                                        <i class="fas fa-plus"></i> Add new
                                    </button>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="saved-sources-list overflow-auto">
                                        <ul class="font-weight-normal px-0 list-unstyled" style="max-width: 510px;">
                                            <?php if ($profile->saved_sources) : ?>
                                                <?php foreach ($profile->saved_sources as $source) : ?>
                                                    <li class="mb-2 d-flex align-items-center justify-content-start">
                                                        <?php if ($source['source_type'] == 'bank') : ?>
                                                            <div class="text-center" style="flex-shrink: 0;">
                                                                <i class="fas fa-university"></i>
                                                            </div>
                                                            <div class="text-center" style="width: 85px; flex-shrink: 0;">
                                                                <span class="text-capitalize"><?= $source['src_account_type'] ?></span>
                                                            </div>
                                                        <?php else : ?>
                                                            <div class="text-center" style="flex-shrink: 0;">
                                                                <i class="fas fa-credit-card"></i>
                                                            </div>
                                                            <div class="text-center" style="width: 85px; flex-shrink: 0;">
                                                                <span class="text-capitalize"><?= $source['src_account_type'] ?></span>
                                                            </div>
                                                        <?php endif; ?>
                                                        <div class="text-center d-flex align-items-center justify-content-center" style="width: 175px; flex-shrink: 0;">
                                                            <span style="font-size:2.2em; line-height: 1; margin-right: 10px;">···· ···· ····</span> <?= $source['last_digits'] ?>
                                                        </div>
                                                        <div class="text-center d-flex align-items-center justify-content-center" style="width: 100px; flex-shrink: 0;">
                                                            <?php if ($source['source_type'] == 'card') : ?>
                                                                <span class="text-sm text-muted">Expires: <?= $source['exp_month'] ?>/<?= $source['exp_year'] ?></span>
                                                            <?php endif; ?>
                                                        </div>
                                                        <div style="width: 50px; text-align: center; flex-shrink: 0;">
                                                            <button class="btn btn-sm px-3 removeSourceBtn" type="button" data-source-id="<?= $source['id'] ?>">
                                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M1 1l10 10M11 1L1 11" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </li>
                                                <?php endforeach; ?>
                                            <?php else : ?>
                                                <li class="text-center">No saved sources found.</li>
                                            <?php endif; ?>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php echo form_close(); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="row justify-content-start">
        <div class="col-xl-12 order-xl-1">
            <div class="card">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-10">
                            <h3 class="mb-0"><b>Customer Transactions</b></h3>
                        </div>
                    </div>
                </div>
                <div class="table-responsive py-4">

                    <table id="donations_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th style="width:40px;"><?= langx("id") ?></th>
                                <th style="width:15px;"><?= langx("action") ?></th>
                                <th><?= langx("amount") ?></th>
                                <th><?= langx("fee<br>covered") ?></th>
                                <th><?= langx("fee") ?></th>
                                <th><?= langx("net") ?></th>
                                <th><?= langx("source") ?></th>
                                <th><?= langx("method") ?></th>
                                <th><?= langx("manual_trx_type") ?>[hidden]</th>
                                <th style="width:100px"><?= langx("status") ?></th>
                                <th><?= langx("date") ?></th>
                            </tr>
                        </thead>
                    </table>
                </div>
                <?php echo form_open('donations/refund', ["id" => "refund_transaction_form"]);
                echo form_close(); ?>
                <?php echo form_open('donations/toggle_status', ["id" => "toggle_status_form"]);
                echo form_close(); ?>
                <?php echo form_open('donations/stop_subscription', ["id" => "stop_subscription_form"]);
                echo form_close();  ?>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="addSourceModal">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 400px">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    <?= langx('Add source') ?>
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="header-label show-when-fund-id-provided">
                        <br>
                        <?= langx('to') ?>
                        <span class="organization_name" style="font-weight: bold"></span> <span class="sub-separator suborg-separator" style="display:none">/ </span>
                        <span class="suborganization_name" style="font-weight: bold"></span><span class="sub-separator" style="display:none"> / </span>
                        <span style="display: none" class="show-when-fund-id-provided"><?= langx('fund') ?>: <span class="fund_name" style="font-weight: bold"></span></span>
                    </span>
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="subtitle">
                        <br>
                        <!--         <span class="organization_name" style="font-weight: bold"></span>-->
                    </span>
                </h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body py-0">
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                    <?= form_open("donors/add_source", ['role' => 'form', 'style' => 'width: 100%', 'id' => 'addDonorDourceForm']); ?>
                    <input type="hidden" name="customer_id" id="customerId" value="<?= $profile->id ?>">
                    <div id="fts-wrapper" class="text-center px-3" style="min-height: 280px; margin-top:10px; width: 100%">
                        <div id="fts-payment-options"></div>
                    </div>
                    <?= form_close() ?>
                </div>
            </div>
            <div class="modal-footer justify-content-between pt-0">
                <button data-dismiss="modal" aria-label="Close" type="button" class="btn btn-default">Close</button>
                <button id="createSourceBtn" type="button" class="btn btn-primary btn-save" style="width: 200px" data-original-label="Create" data-processing-label='Processing <i class="fa fa-spinner fa-pulse text-light"></i>'>Create</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>