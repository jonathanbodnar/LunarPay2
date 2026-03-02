<style>
    #donors_datatable_div_new_donors_filter label{
        font-size: 0.75rem;
        padding-top: 0.25rem;
    }
    #donors_datatable_div_amount_filter{
        width: 100%;
    }
    .amount_label{
        position: absolute;
        top: -0.25rem;
        font-size: 0.75rem;
        display: inline-block;
        width: 100%;
        text-align: center;
    }
</style>


<style>
    #donors_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
</style>


<?php $this->load->view("general/person_component_modal") ?>
<?php $this->load->view("general/add_transaction_modal") ?>
<?php $this->load->view("general/invoice_component_modal") ?>
<?php $this->load->view("general/product_component_modal") ?>

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
                                <h3 class="mb-0"><i class="fas fa-user-friends"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-12 col-md-8 d-flex flex-column flex-md-row justify-content-md-end align-items-center">
                                <div class="d-flex flex-row flex-wrap justify-content-center justify-content-md-end w-100">
                                    <button id="btn_mass_text" class="btn btn-primary btn-sm m-2 just-dev">
                                        <i class="fas fa-sms"></i> Mass Text
                                    </button>
                                    <button class="btn btn-primary btn-sm m-2 btn-GENERAL-person-component" type="button">
                                        <span class="btn-inner--icon"><i class="fas fa-user"></i></span>
                                        <span class="btn-inner--text">Create Customer</span>
                                    </button>                                
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <div class="table-responsive pb-4 pt-0" >
                 <!--   <div id="donors_datatable_div_organization_filter" class="col-md-3 col-sm-12 d-inline-block pl-1" style="visibility: hidden;">
                        <label for="donors_datatable_organization_filter"><?= langx('company:') ?></label>
                        <select id="donors_datatable_organization_filter" class="custom-select custom-select-sm">
                            <option value="">All Companies</option>
                        </select>
                    </div>

                    <div id="donors_datatable_div_suborganization_filter" class="col-md-3 col-sm-12 d-inline-block pl-1" style="visibility: collapse;">
                        <label for="donors_datatable_suborganization_filter"><?= langx('sub_organization:') ?></label>
                        <select id="donors_datatable_suborganization_filter" class="custom-select custom-select-sm">
                        </select>
                    </div>

                    <div id="donors_datatable_div_date_filter" class="col-md-3 col-sm-12 d-inline-block pl-1" style="visibility: hidden;">
                        <label for="donors_datatable_date_filter"><?= langx('date:') ?></label>
                        <select id="donors_datatable_date_filter" class="custom-select custom-select-sm">
                            <option value="">All Times</option>
                            <option value="year">Year</option>
                            <option value="month">Month</option>
                            <option value="week">Week</option>
                            <option value="ytd">YTD</option>
                        </select>
                    </div>

                    <div id="donors_datatable_div_new_donors_filter" class="col-md-2 col-sm-12 d-inline-block m-1 custom-control custom-checkbox" style="visibility: collapse;">
                        <input type="checkbox" name="new_donors" id="donors_datatable_new_donors_filter" class="custom-control-input">
                        <label class="custom-control-label" for="donors_datatable_new_donors_filter"><?= langx('new_donors') ?></label>
                    </div> --> 
                    <div id="donors_datatable_div_amount_filter" class="d-inline-block ml-1 custom-control custom-checkbox p-1" style="visibility: collapse;">
                        <div id="input-slider-range" data-range-value-min="-2" data-range-value-max="-1"></div>
                        <div class="row">
                            <div class="col-6">
                                <span class="range-slider-value value-low" data-range-value-low="-2" id="input-slider-range-value-low"></span>
                            </div>
                            <div class="col-6 text-right">
                                <span class="range-slider-value value-high" data-range-value-high="-1" id="input-slider-range-value-high"></span>
                            </div>
                        </div>
                        <span class="amount_label">Amount</span>
                    </div>

                    <input type="hidden" id="is_new_donor_before_days" name="is_new_donor_before_days" value="<?= $view_data['is_new_donor_before_days'] ?>">

                    <table id="donors_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th class="just-dev"></th>
                                <th style="width:50px;"><?= langx("id") ?></th>
                                <th><?= langx("action") ?></th>
                                <th><?= langx("name") ?></th>
                                <th ><?= langx("email") ?></th>
                                <th ><?= langx("phone") ?></th>
                                <th ><?= langx("business_name") ?></th>
                                <th ><?= langx("address") ?></th>
                                <th ><?= langx("amount") ?></th>
                                <th ><?= langx("created") ?></th>
                            </tr>
                        </thead>
                    </table>

                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade just-dev" id="mass_text_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('Mass Text') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?= form_open('donor/send_mass_text',['id'=>'mass_text_form']) ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('text_message:', 'text_message'); ?> <br />
                            <textarea type="text" class="form-control focus-first" name="text_message" rows="4" placeholder=""> </textarea>
                        </div>
                    </div>
                </div>
                <?= form_close() ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-sent">Send</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>