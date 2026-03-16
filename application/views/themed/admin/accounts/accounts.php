<script>

    var _statuses_data = <?= json_encode($view_data['statuses']['data']) ?>;
    var _statuses_colors = <?= json_encode(array_column(STATUSES, 'color')) ?>;
    var _statuses_titles = <?= json_encode(array_column(STATUSES, 'title')) ?>;

</script>

<style>
.status-flow .step {
  text-align: center;
  position: relative;
  margin-bottom: 40px;
}

.status-flow .circle {
  width: 50px;
  height: 50px;
  line-height: 50px;
  margin: 0 auto 8px auto;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 16px;
  position: relative;
}

.status-flow .label {
  font-size: 14px;
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
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><i class="fas fa-user-friends"></i> <?= $view_data['title'] ?> | <strong><?= COMPANY_NAME ?></strong></h3>                                
                            </div>
                            <div class="col-sm-6">
                                <!--<button class="btn btn-neutral float-right top-table-bottom btn-add-user" data-toggle="modal">
                                    <i class="fas fa-plus"></i>
                                </button>-->
                                <!-- <div class="dropdown top-table-bottom float-right">
                                    <button class="btn btn-neutral dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-tasks"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                                        <a class="dropdown-item" href="#">Action</a>
                                        <a class="dropdown-item" href="#">Another action</a>
                                        <a class="dropdown-item" href="#">Something else here</a>
                                    </div>
                                </div> -->
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <style>
                    table#acl_users_datatable td {
                        padding-left: 12px!important;
                        padding-right: 6px!important;
                    }
                    #acl_users_datatable td{
                        font-size: .86rem!important;
                    }
                    .table td .progress {
                        width: 150px!important;
                        height: 5px!important;
                    }

                    #table_statuses .badge-dot i {
                        width: 0.66rem!important;
                        height: 0.65rem!important;
                        border-radius: 21%;
                    }

                    .badge-dot{
                        font-size: .86rem!important;
                    }

                </style>
                <div class="row">
                    <div class="col-md-8">
                        <div style="margin-top:50px; width:100%; overflow-x: auto;">
                            <div class="status-flow container">
                                <div class="row justify-content-center">
                                    <?php for ($i = 0; $i < count(STATUSES); $i++): ?>
                                        <div class="col-12 col-sm-6 col-md-4 step">
                                            <div class="circle" 
                                                style="background-color: <?= STATUSES[$i]['color'] ?>; color: <?= STATUSES[$i]['font_color'] ?>;">
                                                <?= $view_data['statuses']['values'][$i] ?>
                                            </div>
                                            <div class="label">
                                                <?= $view_data['statuses']['titles'][$i] ?>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <br>
                        <div style="width:95%;">
                            <!-- Chart wrapper -->
                            <canvas id="chart-pie-statuses" class="chart-canvas"></canvas>
                        </div>
                    </div>
                </div>

                <div class="row">

                    <div class="col-md-12 text-center">

                       
                        <!-- Button trigger modal -->
                        <!-- <button type="button" class="btn btn-primary status_button" data-toggle="modal" data-target="#exampleModal">
                            <i class="fas fa-info-circle"></i> Merchant statuses
                        </button> -->

                        <!-- Button trigger modal -->
                        <!-- <button type="button" class="btn btn-primary status_button" data-toggle="modal" data-target="#exampleModal2">
                            <i class="fas fa-info-circle"></i> Microdeposit statuses
                        </button> -->

                        <!-- Modal -->
                        <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered modal-xl" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel">Merchant account statuses</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <style>
                                            table#table_status_info tbody tr td {
                                                padding-bottom: 40px;
                                                padding-left: 20px;
                                            }
                                        </style>

                                        <table id="table_status_info" style="width:100%; margin:auto; text-align: left">
                                            <tbody>
                                                <tr>
                                                    <td><span style="font-style: italic">0. _NOTSENT</span><br>Onboard form not sent yet</td>
                                                <tr>
                                                    <td>1. APPROVED<br>The merchant account has been approved, but not yet enabled.</td>
                                                    <td>2. PROCESSING<br>The merchant account application is being processed by Risk/Compliance.</td>
                                                    <td>3. DEFERRED<br>The merchant account application has been deferred until underwriting by Risk/Compliance is completed.</td>
                                                    <td>4. DISABLED<br>The merchant account application has been disabled due to suspension or termination.</td>
                                                </tr>
                                                <tr>
                                                    <td>5. ENABLED<br>The merchant account has been enabled for payment processing.</td>
                                                    <td>6. PENDING<br>The merchant account application has not yet been completed.</td>
                                                    <td>7. REJECTED<br>The merchant account application has been rejected due to Risk/Compliance check failure.</td>
                                                    <td>8. RETURNED<br>The merchant account application has been returned from Risk to Compliance for review.</td>
                                                </tr>
                                                <tr>
                                                    <td>9. SUBMITTED<br>The merchant account has been submitted for review by Paysafe Risk/Compliance.</td>
                                                    <td>10. WAITING<br>Compliance is waiting for additional information to be provided by the merchant.</td>
                                                    <td>11. WITHDRAWN<br>The merchant account application has been withdrawn.</td>
                                                    <td></td>
                                                </tr>                        
                                            </tbody>
                                        </table>
                                        <br>
                                        <br>
                                        <a target="_BLANK" href="https://developer.paysafe.com/en/platforms/accounts-v1/api/#/introduction/complex-json-objects/merchant-accounts">
                                            Check it on paysafe side
                                        </a>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-neutral" data-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="modal fade" id="exampleModal2" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel2" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="exampleModalLabel2">Microdeposit statuses</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body" style="text-align: left">
                                        <ul><li style="font-style: italic">_NOTSENT</li><li>SENT</li><li>ERROR</li><li>FAILED</li><li>VALIDATED</li><li>INVALID</li><li>TXN_ERROR</li><li>TXN_FAILED</li></ul>
                                        <br>
                                        <br>
                                        <div class="text-center">
                                            <a target="_BLANK" href="https://developer.paysafe.com/en/platforms/accounts-v1/api/#/introduction/complex-json-objects/microdeposit">
                                                Check it on paysafe side
                                            </a>
                                        </div>

                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-neutral" data-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive py-4" style="padding-top: 0px!important">
                    <div id="acl_users_datatable_div_status_filter" class="col-md-3 col-sm-12 d-inline-block p-1" style="display: none!important;">
                        <label for="acl_users_datatable_status_filter"><?= langx('Status:') ?></label>
                        <select style='min-width:270px' id="acl_users_datatable_status_filter" class="custom-select custom-select-sm">
                            <option value="">All</option>
                            <?php foreach ($view_data['statuses']['titles_with_values'] as $i => $title): ?>
                                <option value="<?= ($i + 1) ?>"><?= ($i + 1) . '| ' . $title ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <table style="font-size: 1em!important" id="acl_users_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th>USER_ID<br>ORGNX_ID<br>ONBRD_ID</th>
                                <th><?= langx("action") ?></th>
                                <th>TODO</th>
                                <th><?= langx("username") ?></th>
                                <th><?= langx("full_name") ?></th>
                                <th><?= langx("email") ?></th>
                                <th><?= langx("phone") ?></th>
                                <th><?= langx("organization") ?></th>
                                <th><?= langx("status") ?></th>
                                <th>
                                    • Merchant CCard<br>
                                    • Merchant Bank<br>
                                    • Micro Deposit
                                </th>
                                <th>PSF ACCOUNTS </th>
                                <th><?= langx("website") ?></th>
                                <th><?= langx("created") ?></th>
                                
                            </tr>       
                        </thead>    
                    </table>                    
                </div>
            </div>                        
        </div>
    </div>                
</div>
<div class="modal fade" id="add_user_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_user') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("auth/create_user", ['role' => 'form', 'id' => 'add_user_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_fname_label', 'first_name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="first_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_lname_label', 'last_name'); ?> <br />
                            <input type="text" class="form-control" name="last_name" placeholder="">
                        </div>
                    </div>
                    <?php if ($view_data['identity_column'] !== 'email') : ?>
                        <div class="col-md-6">
                            <div class="form-group">
                                <?php echo langx('create_user_identity_label', 'identity'); ?> <br />
                                <input type="text" class="form-control" name="identity" placeholder="">
                            </div>
                        </div>
                    <?php endif; ?>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_company_label', 'company'); ?> <br />
                            <input type="text" class="form-control focus-first" name="company" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_email_label', 'email'); ?> <br />
                            <input type="text" class="form-control" name="email" placeholder="" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_phone_label', 'phone'); ?> <br />
                            <input type="text" class="form-control" name="phone" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('group', 'group'); ?> <br />
                            <select class="form-control select2" multiple id="group" name="group" data-placeholder="<?= langx('select_one_or_more_groups') ?>" style="width: 100%;">
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo lang('create_user_password_label', 'password'); ?> <br />
                            <input type="password" class="form-control" name="password" placeholder="" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo lang('create_user_password_confirm_label', 'password_confirm'); ?> <br />
                            <input type="password" class="form-control" name="password_confirm" placeholder="" autocomplete="new-password">
                        </div>
                    </div>
                </div>                    
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-neutral" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Save changes</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>

<div class="modal fade" id="todo_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">TODO <span class="span-action-required-status"> <i style="font-size: 16px; color:#e60000" class="fas fa-bell"></i></span></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                Organization: <span class="span-organization-name text-bold"></span>
                
                <br><br>
                    
                <?php echo form_open("organizations/save_todo", ['role' => 'form', 'id' => 'todo_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('action_required_by', 'todo_action_required_by'); ?> <br />
                            <select class="form-control focus-first" id="todo_action_required_by" name="todo_action_required_by">
                                <option value="">No action required</option>
                                <option value="merchant">Merchant</option>
                                <option value="payment_provider">Payment Provider</option>
                                <option value="the_company">The Company</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button type="button" class="form-control btn btn-todo-now">Now >></button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('reference_date_(yyyy-mm-dd):', 'todo_reference_date'); ?>
                            <input class="form-control" id="todo_reference_date" name="todo_reference_date" type="text" value="" autocomplete="off">
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button type="button" class="form-control btn btn-secondary btn-todo-add-line"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('todo_notes', 'todo_notes'); ?> <br />
                            <textarea type="text" class="form-control" name="todo_notes" rows="15" placeholder=""></textarea>
                        </div>
                    </div>
                </div>                    
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-neutral" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Save changes</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>