<style>
    #team_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
</style>

<script>   
    var _module_tree = <?= json_encode(MODULE_TREE) ?>;
    var _module_tree_coach = <?= json_encode(MODULE_TREE_COACH) ?>;
    
</script>
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
                                <h3 class="mb-0"><i class="fas fa-users"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-team-member" data-toggle="modal">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>

                <div class="table-responsive py-4">
                    <table id="team_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th><?= langx("username") ?></th>
                                <th><?= langx("name") ?></th>
                                <th><?= langx("email") ?></th>
                                <th><?= langx("permissions") ?></th>
                                <th><?= langx("created") ?></th>
                                <th style="width:40px"><?= langx("action") ?></th>
                            </tr>       
                        </thead>    
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="add_team_member_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_team_member') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("/", ['role' => 'form', 'id' => 'add_team_member_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('first_name', 'first_name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="first_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('last_name', 'last_name'); ?> <br />
                            <input type="text" class="form-control" name="last_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('email', 'email'); ?> <br />
                            <input type="text" class="form-control" name="email" placeholder="" autocomplete="new-password">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('phone', 'phone'); ?> <br />
                            <input type="text" class="form-control" name="phone" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-sm-6">
                                <br>
                                <strong><h4 class="modal-title"><?= langx('grant_access_to_modules') ?></h4></strong>
                                <br>
                            </div>
                            <div class="col-md-12">
                                <div class="row">     
                                    <?php
                                    $this->CI = & get_instance();
                                    $this->CI->load->model('setting_model');
                                    ?>
                                    <?php if (trim($this->CI->setting_model->getItem('SYSTEM_LETTER_ID')) == 'L'): ?>                                 
                                        <?php $name_module_tree = MODULE_TREE ?>
                                    <?php elseif (trim($this->CI->setting_model->getItem('SYSTEM_LETTER_ID')) == 'H'): ?>
                                        <?php $name_module_tree = MODULE_TREE_COACH ?>
                                    <?php endif; ?>  


                                    <?php foreach ($name_module_tree as $i => $row): ?>
                                        <div class="col-md-3 text-center" style="padding-top:15px; font-weight:bold;">
                                            <label for="chk_module<?= $row['id'] ?>">
                                                <span class="badge badge-pill badge-defaultx" 
                                                      style="margin-bottom: 2px; padding-top: 7px; padding-bottom: 7px; border-radius: 5px; width: 100%; font-size: 11px; color:black"
                                                      >&nbsp;<?= ucfirst($i) ?>&nbsp;</span>
                                            </label>
                                            <br>
                                            <label class="custom-toggle">                                    
                                                <input class="permissions" type="checkbox" id="chk_module<?= $row['id'] ?>" name="permissions[<?= $row['id'] ?>]">
                                                <span class="custom-toggle-slider rounded-circle"></span>
                                            </label>
                                            <hr style="margin-top: 6px; margin-bottom: 4px; width: 80%">
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>                    
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Save changes</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>