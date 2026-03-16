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
                <div class="table-responsive py-4">
                    <?php if (isset($view_data['title'])): ?>
                        <div class="card-header">
                            <h3 class="mb-0"><i class="fas fa-dollar-sign"></i> <?= $view_data['title'] ?></h3>
                        </div>
                    <?php endif; ?>
                    <br>
                    <div class="row m-0 view_filters">
                        <style>
                            #month_filter:disabled,
                            .form-control[readonly] {
                                background-color: inherit;
                            }
                        </style>
                        <div for="month_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                            <label>Month</label>
                            <input class="form-control" id="month_filter" style="height: 28px;" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>

                    <table id="payouts_datatable" class="table table-flush rowHoverPointer" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx('action') ?></th>
                                <th>
                                    <?= langx('status') ?>
                                    <style>
                                        .tooltip-inner {
                                            max-width: 625px;
                                            width: 625px;
                                            font-size: 14px;
                                        }
                                    </style>
                                    <label class="tooltip-help text-center" data-toggle="tooltip" data-html="true" data-placement="left"
                                        title='<?php $this->load->view('helpers/fortis_payouts_status_instructions') ?>'>
                                        ?
                                    </label>
                                </th>
                                <th><?= langx('date') ?></th>
                                <th><?= langx('trxns_batch_id') ?></th> <!-- ID -->
                                <th><?= langx('type') ?></th>
                                <th><?= langx('total_sale_amount') ?></th>
                                <th><?= langx('net_amount') ?></th>
                                <th style="width:50px"><?= langx('total_amount_count') ?></th>
                                <th><?= langx('total_refund_amount') ?></th>
                                <th style="width:50px"><?= langx('total_refund_count') ?></th>
                                <th><?= langx('details') ?></th>
                                
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>