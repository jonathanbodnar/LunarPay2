<?php $this->load->view("general/subscription_component_modal") ?>
<?php $this->load->view("general/person_component_modal") ?>
<?php $this->load->view("general/product_component_modal") ?>
<style>
    #div_search_filter{
        display: flex !important;
        justify-content: flex-end;
        flex-direction: column;
        font-size: 14px;
    }
    #div_search_filter input{
        height: 28px;
    }
    .row_filter{
        display: none !important;
    }
    .chart_donations{
        padding: 1.5rem;
        padding-bottom: 0;
    }

    .view_filters{
        padding: 0.5rem 1.5rem;
    }
</style>

<style>
    #subscriptions_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
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
                        <div class="row align-items-center">
                            <div class="col-12 col-md-4 text-md-left text-center">
                                <h3 class="mb-0"><i class="fas fa-hand-holding-usd"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-12 col-md-8 d-flex flex-column flex-md-row justify-content-md-end align-items-center">
                                <div class="d-flex flex-row flex-wrap justify-content-center justify-content-md-end w-100">
                                    <button class="btn btn-primary btn-sm m-2 btn-GENERAL-add-subscription" data-context="recurring">
                                        <i class="fas fa-clock"></i> <?= langx('create subscription') ?>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <div class="row m-0 view_filters">
                    <!--<div id="div_organization_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="organization_filter"><?= langx('company:') ?></label>
                        <select id="organization_filter" class="custom-select custom-select-sm">
                            <option value="">All Companies</option>
                        </select>
                    </div>
                    <div id="div_suborganization_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="suborganization_filter"><?= langx('sub_organization:') ?></label>
                        <select id="suborganization_filter" class="custom-select custom-select-sm">
                        </select>
                    </div>
                    <div id="div_fund_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="fund_filter"><?= langx('fund:') ?></label>
                        <select id="fund_filter" class="custom-select custom-select-sm">
                        </select>
                    </div>-->
                    <div id="div_method_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="method_filter"><?= langx('method:') ?></label>
                        <select id="method_filter" class="custom-select custom-select-sm">
                            <option value="" selected>All Methods</option>
                            <option value="CC">Card</option>
                            <option value="BNK">ACH</option>
                        </select>
                    </div>
                    <div id="div_freq_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="freq_filter"><?= langx('frequency:') ?></label>
                        <select id="freq_filter" class="custom-select custom-select-sm">
                            <option value="" selected>All Frequencies</option>
                            <?php foreach ($view_data['subs_freqs'] as $i => $freq): ?>
                                <option value="<?= $i ?>"><?= $freq ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div id="div_search_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                    </div>
                </div>                
                <div class="row m-0 xjustify-content-center" id="sub_totals_container" style="padding: 21px 25px 0px 25px">
                    <div class="col-md-4" style="display: block">
                        <div class="card card-stats">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title text-uppercase text-muted mb-0">Total Monthly</h5>
                                        <span class="h2 font-weight-bold mb-0" id="subs_monthly_total"></span>
                                    </div>
                                    <div class="col-auto">
                                        <div class="icon icon-shape bg-gradient-black text-white rounded-circle shadow">
                                            <i class="fas fa-calendar"></i>
                                        </div>
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-sm">
                                    <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                    Max: <span class="text-nowrap" id="subs_monthly_max"></span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4" style="display: block">
                        <div class="card card-stats">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title text-uppercase text-muted mb-0">Total All</h5>
                                        <span class="h2 font-weight-bold mb-0" id="subs_all_total"></span>
                                    </div>
                                    <div class="col-auto">
                                        <div class="icon icon-shape bg-gradient-black text-white rounded-circle shadow">
                                            <i class="fas fa-funnel-dollar"></i>                                            
                                        </div>
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-sm">
                                    <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                    Max: <span class="text-nowrap" id="subs_total_max"></span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4" style="display:block">
                        <div class="card card-stats">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <h5 class="card-title text-uppercase text-muted mb-0">Active</h5>
                                        <span class="h2 font-weight-bold mb-0" id="subs_count_total"></span>
                                    </div>
                                    <div class="col-auto">
                                        <div class="icon icon-shape bg-gradient-black text-white rounded-circle shadow">
                                            <i class="fa fa-undo"></i>
                                        </div>
                                    </div>
                                </div>
                                <p class="mt-3 mb-0 text-sm">
                                    <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                    Since <span class="text-nowrap" id="subs_count_since"></span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive py-4" style="padding-top: 0px!important">
                    <style>
                        table#subscriptions_datatable td {
                            padding-left: 6px!important;
                            padding-right: 6px!important;
                        }
                    </style>
                    <table id="subscriptions_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th style="width:30px;"><?= langx("action") ?></th>
                                <th><?= langx("amount") ?></th>
                                <th title="<?= langx("refunds_are_included") ?>"><?= langx("trxn_count") ?></th>
                                <th><?= langx("total_fee") ?></th>
                                <th><?= langx("net_given") ?></th>
                                <th><?= langx("frequency") ?></th>
                                <th><?= langx("customer") ?></th>
                                <th><?= langx("email") ?></th>                               
                                <th><?= langx("method") ?></th>
                                <th style="width:100px"><?= langx("status") ?></th>
                                <th><?= langx("starts_on") ?></th>
                                <th><?= langx("created") ?></th>                                
                            </tr>
                        </thead>
                    </table>                    
                </div>
            </div>
        </div>
    </div>
</div>