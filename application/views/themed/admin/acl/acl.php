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
                                <h3 class="mb-0"><i class="fas fa-user-ninja"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <!-- <div class="col-sm-6">
                                <button class="btn btn-neutral float-right top-table-bottom btn-add-user" data-toggle="modal">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <div class="dropdown top-table-bottom float-right">
                                    <button class="btn btn-neutral dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-tasks"></i>
                                    </button>
                                    <div class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdownMenuButton">
                                        <a class="dropdown-item" href="#">Action</a>
                                        <a class="dropdown-item" href="#">Another action</a>
                                        <a class="dropdown-item" href="#">Something else here</a>
                                    </div>
                                </div>
                            </div> -->
                        </div>
                    </div>
                <?php endif; ?>
                <div class="table-responsive py-4">
                    <table id="acl_users_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th><?= langx("username") ?></th>
                                <th><?= langx("names") ?></th>
                                <th><?= langx("email") ?></th>
                                <th><?= langx("created_on") ?></th>
                                <th><?= langx("id") ?></th>
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
                            <?php echo langx('create_user_email_label', 'email'); ?> <br />
                            <input type="text" class="form-control" name="email" placeholder="" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="col-md-6"></div>
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
                    <!-- <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_company_label', 'company'); ?> <br />
                            <input type="text" class="form-control focus-first" name="company" placeholder="">
                        </div>
                    </div> -->
                   
                    <!-- <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('create_user_phone_label', 'phone'); ?> <br />
                            <input type="text" class="form-control" name="phone" placeholder="">
                        </div>
                    </div> -->
                    <!-- <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('group', 'group'); ?> <br />
                            <select class="form-control select2" multiple id="group" name="group" data-placeholder="<?= langx('select_one_or_more_groups') ?>" style="width: 100%;">
                            </select>
                        </div>
                    </div> -->
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