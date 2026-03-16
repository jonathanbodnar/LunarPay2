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
                        <div class="col-md-2 col-sm-12 d-inline-block p-1">                        
                            <label for="organization_filter"><?= langx('company:') ?></label>
                            <select id="organization_filter" class="custom-select custom-select-sm">
                                <?php foreach ($view_data['organizations'] as $row): ?>
                                    <option value="<?= $row['ch_id'] ?>"><?= $row['church_name'] ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>                    
                        <div for="month_filter" class="col-md-2 col-sm-12 d-inline-block p-1">
                            <label>Month</label>
                            <input class="form-control" id="month_filter" style="height: 28px;" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <table id="payouts_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx('Id') ?></th>
                                <th><?= langx('account_number') ?></th>
                                <th><?= langx('amount') ?></th>
                                <th><?= langx('currency') ?></th>
                                <th><?= langx('status') ?></th>
                                <th><?= langx('description') ?></th>
                                <th><?= langx('initiated') ?></th>
                                <th><?= langx('est_arrival') ?></th>
                                <th style="width:50px"><?= langx('action') ?></th>                                
                            </tr>
                        </thead>
                    </table>                    
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="payouts_details_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('payout_details') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">                
                <div class="row">
                    <div class="col-md-12">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Reference</th>
                                    <th>Total</th>
                                    <th>Details</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="payouts_detail_data">                                
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>                
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>