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
    #donations_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
</style>


<?php $this->load->view("general/add_transaction_modal") ?>
<?php $this->load->view("general/person_component_modal") ?>

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
                            <div class="col-6">
                                <h3 class="mb-0"><i class="fas fa-hand-holding-usd"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-6 text-right">
                                <div id="donationActionWrapper" class="dropdown float-right m-2">
                                    <button class="btn btn-primary btn-sm dropdown-toggle" type="button" id="donationActionsDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        Actions
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="donationActionsDropdown">
                                        <a class="dropdown-item btn-GENERAL-add-transaction" href="javascript:void(0)" data-context="donation">
                                            <i class="fas fa-dollar-sign"></i> Create Transaction
                                        </a>
                                        <a class="dropdown-item btn-export-csv" href="javascript:void(0)">
                                            <i class="fas fa-file-export"></i> Export CSV
                                        </a>                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <div class="row m-0">
                    <div class="col-md-12">
                        <div data-initial_state="0" id="show_hide_graph_selector" title="Show/Hide Graph Stats" style="cursor: pointer; font-weight: bold; font-style: italic;
                             width: 170px; float: left; text-align: left; padding-top: 10px; border-bottom: 1px solid white;">
                            <span class="close-icon" style="display: none">
                                Hide Charts <i class="fa fa-chevron-up"></i>                                
                                <!--<i class="fas fa-eye-slash"></i>-->
                            </span>
                            <span class="open-icon" style="display: none">Show Charts <i class="fa fa-chevron-down"></i>                                
                                <!--<i class="far fa-eye"></i>-->
                            </span>
                        </div>
                    </div>
                </div>
                <div class="row m-0 graph-stats-container" style="display: none; /*js will handle the visibility*/">
                    <div class="col-lg-4 col-md-12 chart_donations">

                        <div class="card">
                            <div class="card-header">
                                <h5 class="h3 mb-0">Total Received</h5>
                            </div>

                            <div class="card-body">
                                <div class="chart">
                                    <canvas id="chart_total_given" class="chart-canvas"></canvas>
                                </div>
                            </div>

                        </div>

                    </div>
                    <div class="col-lg-4 col-md-12 chart_donations">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="h3 mb-0">Number of transactions</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart">
                                    <canvas id="chart_number_gifts" class="chart-canvas"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-12 chart_donations">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="h3 mb-0">New Customers</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart">
                                    <canvas id="chart_new_donors" class="chart-canvas"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <form id="div_organization_filter_form" class="row m-0 view_filters">
                     <!--<!--<div id="div_organization_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="organization_filter"><?= langx('company:')?></label>
                        <select id="organization_filter" class="custom-select custom-select-sm">
                            <option value="">All Companies</option>
                        </select>
                    </div>
                    <div id="div_suborganization_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="suborganization_filter"><?= langx('sub_organization:')?></label>
                        <select id="suborganization_filter" class="custom-select custom-select-sm">
                        </select>
                    </div>
                    <div id="div_fund_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="fund_filter"><?= langx('fund:')?></label>
                        <select id="fund_filter" class="custom-select custom-select-sm">
                        </select>
                    </div>-->
                    <div id="div_method_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                        <label for="method_filter"><?= langx('method:')?></label>
                        <select id="method_filter" class="custom-select custom-select-sm">
                            <option value="" selected>All Methods</option>
                            <option value="CC">Card</option>
                            <option value="BNK">Bank</option>
                            <option value="Cash">Cash</option>
                            <option value="Check">Check</option>
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
                </form>
                
                <div class="table-responsive py-4">
                    <table id="donations_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th style="width:15px;"><?= langx("action") ?></th>                                
                                <th><?= langx("amount") ?></th>
                                <th><?= langx("fee<br>covered") ?></th>
                                <th><?= langx("fee") ?></th>
                                <th><?= langx("net") ?></th>
                                <th><?= langx("customer") ?></th>
                                <th><?= langx("email") ?></th>
                                <th><?= langx("source") ?></th>
                                <th><?= langx("method") ?></th>
                                <th><?= langx("manual_trx_type") ?>[hidden]</th>
                                <th style="width:100px"><?= langx("status") ?></th>
                                <th><?= langx("date") ?></th>
                            </tr>
                        </thead>
                    </table>
                    <?php echo form_open('donations/refund',["id"=>"refund_transaction_form"]); echo form_close(); ?>
                    <?php echo form_open('donations/toggle_status',["id"=>"toggle_status_form"]); echo form_close(); ?>
                    <?php echo form_open('donations/stop_subscription',["id"=>"stop_subscription_form"]); echo form_close(); ?>
                </div>
            </div>
        </div>
    </div>
</div>