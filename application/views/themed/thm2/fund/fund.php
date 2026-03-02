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
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><?=$view_data['sub_organization_id'] ? '<i class="fas fa-home"></i>' : '<i class="fas fa-building"></i>'?> <?= $view_data['org_name'].' - '. $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-fund" data-toggle="modal">
                                    <?= langx('Add Fund')?>
                                </button>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <input type="hidden" id="filter_organization_id" name="filter_organization_id" value="<?= $view_data['organization_id'] ?>">
                <input type="hidden" id="filter_sub_organization_id" name="filter_sub_organization_id" value="<?= $view_data['sub_organization_id'] ?>">
                <input type="hidden" id="flag_create" name="flag_create" value="<?= $view_data['create'] ?>">
                <div class="table-responsive py-4">
                    <table id="funds_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th></th>                                
                                <th><?= langx("fund_name") ?></th>
                                <th></th>
                                <th></th>
                                <th><?= langx("collected") ?></th>                                
                                <th><?= langx("description") ?></th>                                
                                <th><?= langx("active") ?></th>                                
                                <th><?= langx("action") ?></th>
                            </tr>
                        </thead>
                    </table>
                    <?php
                    echo form_open('funds/delete_fund', ["id" => "delete_fund_form"]);
                    echo form_close();
                    ?>
                </div>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" id="add_fund_modal">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_fund') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("fund/save_fund", ['role' => 'form', 'id' => 'add_fund_form','onsubmit'=>'event.preventDefault();']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-9">
                        <div class="form-group">
                            <?php echo langx('fund_name:', 'fund_name'); ?> <br />
                            <input type="text" class="form-control focus-first" autocomplete="off" name="fund_name" placeholder="">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group" style="display: flex; flex-direction: column;">
                            <?php echo langx('active:', 'fund_active',['style' => 'text-align: center;']); ?>
                            <label class="custom-toggle" style="margin: auto;">
                                <input id="fund_active" type="checkbox"
                                       name="fund_active" value="active" checked>
                                <span class="custom-toggle-slider rounded-circle"></span>
                            </label>
                        </div>
                    </div>
                    <input type="hidden" name="organization_id">
                    <input type="hidden" name="suborganization_id">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('description:', 'description'); ?> <br />
                            <textarea type="text" class="form-control" name="description" rows="4" placeholder=""></textarea>
                            <div class="hint-under-input">Description will show up in the chat when the donor hovers the fund</div>
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