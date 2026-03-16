<?php $this->load->view("general/person_component_modal") ?>

<div id="batches-container">
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
                            </div>
                            </button>
                        </div>
                    <?php endif; ?>

                    <div class="row">
                        <div class="col-md-3 pt-2 pl-5 pr-4" style="border-right: solid 1px whitesmoke">
                            <style>
                                #batch_tags_filter_container li.select2-selection__choice {
                                    line-height: 0.6 !important;
                                    padding: .5rem .3rem .5rem !important;
                                }
                                #batch_tags_filter_container .select2-container--default.select2-container--focus .select2-selection--multiple, 
                                #batch_tags_filter_container .select2-container--default .select2-selection--multiple {
                                    height: 30px!important;
                                    min-height: 30px!important
                                }

                                #batch_tags_filter_container ul.select2-selection__rendered {
                                    padding: .1rem !important;
                                }

                                #batch_tags_filter_container .select2-search__field {
                                    margin-top: 0px!important;
                                }

                                #batch_tags_filter_container input::placeholder {
                                    color:darkgray
                                }

                                .padding-bottom10px {
                                    padding-bottom: 10px
                                }

                                /**/
                                #batches-container .dataTables_filter {
                                    padding-right: 0px;
                                }
                                #batches-container #main_datatable_wrapper.dataTables_wrapper > .row .search {
                                    min-height: 0px;
                                }

                                #batches-container #main_datatable tbody tr td:hover { 
                                    /*background-color: #f9f9f9;*/ 
                                    border-left: solid 0.45em whitesmoke;
                                }

                                #batches-container #main_datatable tr td {
                                    padding: 9px!important;
                                    border-radius: 7px;
                                    cursor:pointer;
                                    border:none;
                                    border-left: solid 0.5em white
                                }

                                #batches-container #main_datatable tr td span.bk-badge {
                                    margin-left:3px!important
                                }

                                /* ================= */
                                #batches-container #main_datatable tbody tr.row-selected td {
                                    border-left: solid 0.45em #f1f1f1;
                                    background-color:#f9f9f9;
                                    border-radius: 7px;                                    
                                }

                                #batches-container .donations-batch-name{
                                    padding: 10px 30px 10px 25px;
                                    border-radius: 6px;
                                    font-weight: bold;
                                    border: solid 1px lightgray;
                                    border-left: solid 0.5em #f1f1f1;
                                    height:43px;
                                    /*background-color: #f9f9f9;*/
                                }
                                /* ================= */

                                #batches-container #main_datatable{                           
                                    border-collapse:separate;
                                    border-spacing:0 3px;
                                    border-bottom: none;
                                }

                                #batches-container #donations_datatable {
                                    border-collapse:separate;
                                    border-spacing:8px 8px;
                                    border:none;
                                }

                                #batches-container #donations_datatable thead th {
                                    border-top: none;
                                }

                                #batches-container #donations_datatable tbody tr td {
                                    border: solid 1px whitesmoke;
                                    background-color: #fafafa;
                                    border-radius: 6px;
                                    padding:5px
                                }
                            </style>
                            <div>
                                <div class="mb-2">
                                    <label class="bold-weight" for="datatable_organization_filter"><?= langx('Company') ?></label>
                                    <select id="datatable_organization_filter" class="custom-select custom-select-sm">
                                        <option value="">Select a Company</option>
                                    </select>
                                </div>
                                <div>
                                    <!--<label for="datatable_suborganization_filter"><?= langx('sub_organization') ?></label>-->
                                    <select id="datatable_suborganization_filter" class="custom-select custom-select-sm">
                                        <option value="">Select a Sub Organization</option>
                                    </select>
                                </div>
                                <div>
                                    <hr class="m-3 mb-3">
                                </div>
                                <div class="mb-3">
                                    <div class="col-md-12 text-right">
                                        <button class="my-1 w-100 btn btn-primary top-table-bottom btn-add" style="border-radius: 10px" data-toggle="modal">
                                            <?= langx('Create New Batch') ?>
                                        </button>
                                    </div>
                                </div>
                                <div id="batch_input_filter_container">
                                </div>
                                <div id="batch_tags_filter_container">
                                    <select class="form-control select2" id="batch_tags_filter" style="width: 100%; display: none"></select>
                                </div>
                            </div>
                            <div class="table-responsive mt-2">
                                <table id="main_datatable" class="table table-flush compact" width="100%">
                                    <thead class="thead-light">
                                        <tr style="display:none">
                                            <th>[hidden] for ordering only</th>
                                            <th style="width: 15px">Action</th>
                                            <th>Batches</th>                                            
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>

                        <div class="col-md-9" style="padding-right:35px; ">
                            <style>
                                #batches-container .donations-batch-tags .bk-badge {
                                    margin-top: 8px!important;
                                    margin-left: 12px!important;
                                    padding: 10px 20px 9px 20px;
                                    font-size: 12px;
                                }
                            </style>
                            <div class="row pt-4 pb-3 pl-2">
                                <div class="col-md-4" style="display: flex;">
                                    <span class="donations-batch-name" data-default_text="No Batches found">[Batch-Name]</span>                                    
                                </div>
                                <div class="col-md-8 text-right pt-1">
                                    <button class="btn btn-outline-neutral ml-2 batch-add-donations grid-element px-5" style="display: none">Add Donations</button>
                                    <button class="btn btn-success ml-2 batch-commit-btn grid-element" style="display: none">Commit Batch</button>
                                    <button class="btn btn-outline-neutral ml-2 batch-view-donations form-element px-4" style="display: none"><i class="fas fa-table"></i>  View Donations</button>


                                    <button class="btn btn-primary batch-commit-btn" style="
                                            border-radius: 9px; 
                                            background-color: #40b73f;
                                            border: none;
                                            display:none
                                            ">
                                        <!--<i class="fas fa-arrow-up"></i>-->  
                                        Commit Batch</button>
                                    <span class="badge badge-default batch-committed-badge-grid" style="display: none; padding: 13px; font-size: 13px;">
                                      <!--<i class="fas fa-arrow-up"></i>-->  
                                        Batch Commited</span>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12 text-right pt-2 pb-2">
                                    <i style="font-size: 1.2em; display: none" class="fas fa-tags donations-batch-tags-icon"></i>
                                    <span class="donations-batch-tags"></span>
                                </div>
                            </div>
                            <div id="batch-donations-grid">
                                <div class="table-responsive">
                                    <table id="donations_datatable" class="table table-flush compact" width="100%">
                                        <thead>
                                            <tr>
                                                <th>Id</th>
                                                <th>Donor</th>
                                                <th>Amount</th>
                                                <th>Type</th>
                                                <th>Fund</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div> 
                            </div>
                            <div id="batch-donations-form-component d-none">
                                <?php $this->load->view("batches/batch_donations_form") ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade add_modal">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title"><?= langx('New Batch') ?>
                            <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic;" class="show-when-fund-id-provided">                        
                                <br>
                                <span class="organization_name sub-title" style="font-weight: bold"></span>
                                <span class="sub-separator sub-title"> / </span>
                                <span class="suborganization_name sub-title" style="font-weight: bold;"></span>
                            </span>
                        </h4>
                        <h4 style="display: none" class="modal-title"><?= langx('Edit Batch') ?>
                            <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic;" class="show-when-fund-id-provided">                        
                                <br>
                                <br>
                                <span class="organization_name sub-title" style="font-weight: bold"></span>
                                <span class="sub-separator sub-title"> / </span>
                                <span class="suborganization_name sub-title" style="font-weight: bold;"></span>s
                            </span></h4>
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

                        <?php echo form_open("batches/create", ['role' => 'form', 'id' => 'add_form', 'autocomplete' => 'off']); ?>

                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <?php echo langx('Batch name', 'batch_name'); ?>
                                    <input class="form-control focus-first" id="batch_name" name="batch_name" placeholder="" type="text" value="">
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="form-group">
                                    <?php echo langx('Search/Pick or Add Tags', 'batch_tags'); ?> <i class="fas fa-tags donations-batch-tags-icon"></i> <br>
                                    <select class="form-control select2" id="batch_tags" style="width: 100%;">
                                    </select>
                                    <div class="hint-under-input">
                                        You can add tags followed by enter.
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="hint-under-input alert" style="text-align: justify;">
                                    <i style="font-size: 1.2em" class="fas fa-info-circle"></i> Tags are optional, these allow you to group batches in whatever way you need
                                    E.G. You can create two batches named "First Session" and "Second Session", both with 
                                    a tag named "SUNDAY EVENT 22/10/2021" OR two batches named "09/28" and "09/30" both with tag name "MAIL DONATIONS WEEK 09/27/2021", 
                                    then, in the Batches list you can filter by "Tag". Comming soon you will able to perform group operations 
                                    like getting a grand total, committing and deleting
                                    related batches.
                                </div>
                            </div>
                        </div>

                        <?php echo form_close(); ?>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <button type="button" class="btn btn-default btn-close-modal">Close</button>
                        <button type="button" class="btn btn-primary btn-create-reg btn-save-reg">Create Batch</button>
                        <button type="button" class="btn btn-primary btn-update-reg btn-save-reg" style="display: none">Update Batch</button>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>

        <!-- commit batch modal -->
        <div class="modal fade commit_modal">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title"><?= langx('Commit Batch') ?></h4>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 50px">                
                        <div class="row">
                            <div class="col-md-12">
                                <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                </div>
                            </div>
                        </div>

                        <?php echo form_open("batches/commit", ['role' => 'form', 'id' => 'commit_form', 'autocomplete' => 'off']); ?>

                        <div class="row">
                            <div class="col-12 text-left">
                                <hr class="mt-0">

                                When committing a Batch, all donations will be processed:
                                <br>
                                <br>
                                • Donations will be included in Donations & Donors pages. <br>
                                • Donations will be visible for donors from chat/widget's profile view.<br>
                                • Donations will be included in statements issued by the respective donor or a dashboard user.<br>

                            </div>                            
                        </div>
                        <?php echo form_close(); ?>
                    </div>
                    <div class="modal-footer justify-content-between">
                        <button type="button" class="btn btn-default btn-close-modal">Close</button>
                        <button type="button" class="btn btn-success btn-create-reg btn-save-reg">Commit Batch</button>
                    </div>
                </div>
                <!-- /.modal-content -->
            </div>
            <!-- /.modal-dialog -->
        </div>    
    </div>
</div>