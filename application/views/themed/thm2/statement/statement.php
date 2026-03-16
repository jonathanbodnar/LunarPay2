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
                                <h3 class="mb-0"><i class="fas fa-print"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-statement" data-toggle="modal">
                                    <i class="fas fa-print"></i> <?= langx('create_statement') ?>
                                </button>
                            </div>
                        </div>
                        </button>
                    </div>
                <?php endif; ?>
                <div class="table-responsive py-4">
                    <div id="statmnts_datatable_div_organization_filter" class="col-md-3 col-sm-12 d-inline-block p-1" style="display: none;">
                        <label for="statmnts_organization_filter"><?= langx('company:') ?></label>
                        <select id="statmnts_datatable_organization_filter" class="custom-select custom-select-sm">
                            <option value="">All Companies</option>
                        </select>
                    </div>

                    <table id="statmnts_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th>Id</th>
                                <th style="width: 15px">Action</th>
                                <th>Company</th>
                                <th>Date from</th>
                                <th>Date to</th>
                                <th>Created at</th>
                                <th>Created By</th>
                                <th>Donors</th>                                
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" id="add_statement_modal">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('create_statement') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">                
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>

                <style>
                    .nav-pills .nav-link.active, .nav-pills .show > .nav-link {
                        color: white;
                        opacity :1;
                    }
                </style>

                <style>
                    .nav-statements .nav-pills .nav-link {
                        margin: auto;
                        width: 90%;
                    }
                </style>

                <?php echo form_open("statements/create", ['role' => 'form', 'id' => 'add_statement_form']); ?>
                <div id="nav-pills-component" class="tab-pane tab-example-result fade active show nav-statements" role="tabpanel" aria-labelledby="nav-pills-component-tab">
                    <ul class="nav nav-pills nav-fill flex-column flex-sm-row" id="tabs-text" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector active first-nav-link-tab" data-position="1" id="tabs-text-1-tab" data-toggle="tab" href="#tabs-text-1" role="tab" aria-controls="tabs-text-1" aria-selected="false">
                                <i class="fa fa-filter"></i> <strong>Filter Data</strong>
                            </a>
                        </li>                        
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="2" id="tabs-text-2-tab" data-toggle="tab" href="#tabs-text-2" role="tab" aria-controls="tabs-text-2" aria-selected="true">
                                <i class="fa fa-user-friends"></i> <strong>Search Donors</strong>
                            </a>
                        </li>                        
                        <li class="nav-item">
                            <a class="nav-link mb-sm-3 mb-md-0 xanav-selector" data-position="3" id="tabs-text-3-tab" data-toggle="tab" href="#tabs-text-3" role="tab" aria-controls="tabs-text-3" aria-selected="true">
                                <i class="fa fa-file-export"></i> <strong>Export</strong>
                            </a>
                        </li>                     
                    </ul>
                </div>

                <br><br>

                <div class="tab-content" id="pills-tabContent" style="padding:20px 20px 0px 20px">
                    <div class="tab-pane fade show active" id="tabs-text-1" role="tabpanel" aria-labelledby="tabs-text-1">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('company:', 'organization_id'); ?> <br />
                                    <select class="form-control" name="organization_id" placeholder="">
                                        <option value="">All Companies</option>                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('fund:', 'fund_id'); ?> <br />
                                    <select class="form-control" name="fund_id" placeholder="">
                                        <option value="">All Funds</option>                                        
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-group">
                                    <?php echo langx('From:', 'st_from'); ?>
                                    <input class="form-control" id="st_from" readonly placeholder="Select date" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-group">
                                    <?php echo langx('To:', 'st_to'); ?>
                                    <input class="form-control" id="st_to" readonly placeholder="Select date" type="text" value="">
                                </div>
                            </div>                            

                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-2" role="tabpanel" aria-labelledby="tabs-text-2">
                        <div class="row">
                            <div class="col-md-12">
                                <?php echo langx('load_all_Donors', 'all_donors_checkbox'); ?> <br />
                                <label class="custom-toggle">                                    
                                    <input type="checkbox" id="all_donors_checkbox">
                                    <span class="custom-toggle-slider rounded-circle"></span>
                                </label>

                            </div>
                            <div class="col-md-12">
                                <br>
                            </div>
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('search/Select_Donors', 'donors_tags_list'); ?> <br />
                                    <select class="form-control select2" id="donors_tags_list" name="group" style="width: 100%;">
                                    </select>
                                </div>
                            </div>                            
                        </div>
                    </div>
                    <div class="tab-pane fade" id="tabs-text-3" role="tabpanel" aria-labelledby="tabs-text-3">
                        <div class="custom-control custom-radio custom-control-inline">
                            <input type="radio" id="customRadioInline1" name="st_opt_output" value="pdf_excel" class="custom-control-input">
                            <label class="custom-control-label" for="customRadioInline1">Download PDF/Excel</label>
                        </div>                                                
                        <div class="custom-control custom-radio custom-control-inline">
                            <input type="radio" id="customRadioInline4" name="st_opt_output" value="email" class="custom-control-input">
                            <label class="custom-control-label" for="customRadioInline4">Send Email</label>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group" style="display: none">
                                    <br><br>
                                    <label for="exampleFormControlTextarea1">Message</label>
                                    <textarea class="form-control" id="email_message" name="email_message" rows="4">Thank you for supporting our mission! Attached you will find your giving statement.

Blessings,</textarea>
                                </div>
                            </div>
                        </div>
                    </div>                    
                </div>                                
                <?php echo form_close(); ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button id="st_btn_back" type="button" class="btn btn-default" style="width: 150px">Close</button>
                <button id="st_btn_action" type="button" class="btn btn-primary" style="width: 150px">Next</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>


<div class="modal fade" id="details_statement_modal">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('statement_details') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">                
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('statement_id:', 'statement_id'); ?>
                            <input class="form-control" id="statement_id" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>                    
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('company:', 'church_name'); ?>
                            <input class="form-control" id="church_name" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('date_from:', 'date_from'); ?>
                            <input class="form-control" id="date_from" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('date_to:', 'date_to'); ?>
                            <input class="form-control" id="date_to" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            #<?php echo langx('donors:', 'donors_number'); ?>
                            <input class="form-control" id="donors_number" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('created_by:', 'created_by'); ?>
                            <input class="form-control" id="created_by" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <?php echo langx('created_at:', 'created_at'); ?>
                            <input class="form-control" id="created_at" readonly placeholder="Select date" type="text" value="">
                        </div>
                    </div>                    
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('donors:', 'donors'); ?>
                            <select class="form-control" id="donors" multiple="" style="height:200px"></select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer justify-content-between">
                <button data-dismiss="modal" aria-label="Close" type="button" class="btn btn-default">Close</button>
                <button id="btn_download" type="button" class="btn btn-primary" style="width: 200px">Download Statement</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>