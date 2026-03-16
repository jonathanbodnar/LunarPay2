<style>
    #btn_preview {
        border-radius: 5px;
        padding: 0 16px;
        border: none;
        font-size: 14px;
        height: 40px;
        font-family: 'Roboto','Helvetica','Arial','sans-serif';
        cursor: pointer;
        width: auto;
    }
</style>

<?php
    if(BASE_URL !== "https://app.chatgive.com/") {?>
        <script>
            var base_url = "<?=base_url();?>";
            var baseUrlLogo = "<?= BASE_URL_FILES ?>";
        </script>
<?php } ?>

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

<!-- give_anywhere content -->
<div class="container-fluid mt--6">
    <!-- Table -->
    <div class="row">
        <div class="col">
            <div class="card">
                <?php if (isset($view_data['title'])): ?>
                    <div class="card-header">
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><i class="fas fa-caret-square-right"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-give_anywhere" data-toggle="modal">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        </button>
                    </div>
                <?php endif; ?>
                <div class="table-responsive py-4">
                    <table id="give_anywhere_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th><?= langx("company") ?></th>
                                <th><?= langx("button_text") ?></th>
                                <th><?= langx("created_at") ?></th>
                                <th></th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" id="add_give_anywhere_modal">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open_multipart("give_anywhere/save_give_anywhere", ['role' => 'form', 'id' => 'add_give_anywhere_form' ,'onsubmit'=>'event.preventDefault();']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('company:', 'organization_id'); ?> <br />
                                    <select class="form-control" name="organization_id" placeholder="">
                                        <option value="">Select a Company</option>
                                        <?php foreach ($view_data['organizations'] as $organization) : ?>
                                            <option  value="<?= $organization['ch_id'] ?>" data-token="<?= $organization['token'] ?>"><?= htmlspecialchars($organization['church_name'], ENT_QUOTES, 'UTF-8') ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('suborganization:', 'suborganization_id'); ?> <br />
                                    <select class="form-control" name="suborganization_id" placeholder="">
                                        <option value="">Select a Sub Organization</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('button_color:', 'button_color'); ?> <br />
                                    <input type="color" id="button_color" class="form-control focus-first" name="button_color" placeholder="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('text_color:', 'text_color'); ?> <br />
                                    <input type="color" id="text_color" class="form-control" name="text_color" placeholder="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <?php echo langx('button_text:', 'button_text'); ?> <br />
                                    <input type="text" id="button_text" class="form-control" name="button_text" placeholder="">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group text-center">
                                    <?php echo langx('preview:', 'btn_preview'); ?> <br />
                                    <button type="button" id="btn_preview" class="form-control chatgive-anywhere-btn" value="" style="margin: 3px auto;">
                                </div>
                            </div>
                        </div>
                        <div class="row installation_code" style="display: none;">
                            <div class="col-12">
                                <label class="form-control-label">Copy the below code to install:</label><br>
                                <pre id="code_to_copy" class="p-3" style="border: 1px solid #dddddd">
                                                        </pre>
                                <a href="#" class="copy_code float-right position-relative" style="top: -10px">Copy</a>
                            </div>
                        </div>
                    </div>
                </div>

                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save">Generate Script</button>
                <script src="<?=SHORT_BASE_URL?>assets/widget/chat-widget-anywhere.js"></script>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>