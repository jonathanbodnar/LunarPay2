<style>
    .dropzone-single.dz-max-files-reached .dz-message {
        background-color: hsla(0, 0%, 0%, 0.32);
    }
    .remove_file_dropzone{
        position: absolute;
        top: -20px;
        right: 0px;
    }
    #add_page_modal .form-group{
        margin-bottom: 0.5rem;
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
                                <h3 class="mb-0"><i class="far fa-file"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">
                                <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-page" data-toggle="modal">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        </button>
                    </div>
                <?php endif; ?>
                <div class="table-responsive py-4">
                    <table id="pages_datatable" class="table table-flush" width="100%">
                        <thead class="thead-light">
                            <tr>
                                <th><?= langx("id") ?></th>
                                <th><?= langx("internal_name") ?></th>
                                <th><?= langx("company") ?></th>
                                <th><?= langx("title") ?></th>
                                <th><?= langx("type") ?></th>
                                <th><?= langx("created") ?></th>
                                <th><?= langx("url") ?></th>
                                <th></th>
                            </tr>
                        </thead>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" id="add_page_modal">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('save_page') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open_multipart("page/save_page", ['role' => 'form', 'id' => 'add_page_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('company:', 'organization_id'); ?> <br />
                                    <select class="form-control focus-first" name="organization_id" placeholder="" tabindex="1">
                                        <option value="">Select a Company</option>
                                        <?php foreach ($view_data['organizations'] as $organization) : ?>
                                            <option value="<?= $organization['ch_id'] ?>"><?= htmlspecialchars($organization['church_name'], ENT_QUOTES, 'UTF-8') ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('suborganization:', 'suborganization_id'); ?> <br />
                                    <select class="form-control" name="suborganization_id" placeholder="" tabindex="2">
                                        <option value="">Select a Sub Organization</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('title:', 'title'); ?> <br />
                                    <input type="text" class="form-control focus-first" name="title" placeholder="" tabindex="5">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('internal_name:', 'page_name'); ?>

                                    <style>.tooltip-inner{max-width: 315px; width: 315px }</style>
                                    &nbsp;
                                    <label style="text-align:center" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right"
                                           title="An internal name for identifying the page, Donors won't see this">
                                        <strong>?</strong>
                                    </label>
                                    <br />
                                    <input type="text" id="page_name" class="form-control" name="page_name" placeholder="" tabindex="6">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('slug:', 'slug'); ?> <br />
                                    <div class="input-group">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text" style="font-size: 14px!important" id="basic-addon3">https://chatgive.me/pwa/</span>
                                        </div>
                                        <input type="text" name="slug" class="form-control" id="slug" aria-describedby="basic-addon3" tabindex="9">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('Description:', 'content'); ?> <br />
                                    <textarea type="text" class="form-control" name="content" rows="1" placeholder="" tabindex="10"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Title Font Family:', 'font_family_title'); ?> <br />
                                    <select class="form-control" name="font_family_title" id="font_family_title"  tabindex="11">
                                        <?php foreach ($fonts as $key => $font) { ?>
                                            <option value="<?= $key ?>" data-type="<?= $font['type'] ?>"><?= $key ?></option>
                                        <?php } ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Title Font Size:', 'font_size_title'); ?> <br />
                                    <div class="input-group">
                                        <input type="number" step="0.01" class="form-control" name="font_size_title" id="font_size_title" min="0" tabindex="12">
                                        <div class="input-group-append">
                                            <span class="input-group-text">rem</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Description Font Family:', 'font_family_content'); ?> <br />
                                    <select class="form-control" name="font_family_content" id="font_family_content" tabindex="13">
                                        <?php foreach ($fonts as $key => $font) { ?>
                                            <option value="<?= $key ?>" data-type="<?= $font['type'] ?>"><?= $key ?></option>
                                        <?php } ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Description Font Size:', 'font_size_content'); ?> <br />
                                    <div class="input-group">
                                        <input type="number" step="0.01" class="form-control" name="font_size_content" id="font_size_content" min="0" tabindex="14">
                                        <div class="input-group-append">
                                            <span class="input-group-text">rem</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('style:', 'style'); ?> <br />
                                    <div class="d-flex" style="justify-content: space-evenly; height: 45px;">
                                        <div class="custom-control custom-radio custom-control-inline">
                                            <input type="radio" id="pwa_style_two" name="pwa_style" class="custom-control-input" value="T" tabindex="3">
                                            <label class="custom-control-label" for="pwa_style_two">Two Columns</label>
                                        </div>
                                        <div class="custom-control custom-radio custom-control-inline">
                                            <input type="radio" id="pwa_style_float" name="pwa_style" class="custom-control-input" value="F" tabindex="4">
                                            <label class="custom-control-label" for="pwa_style_float">Floating Widget</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row background_row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <?php echo langx('Background:', 'background'); ?> <br />
                                    <div id="background_dropzone" class="dropzone dropzone-single" data-toggle="dropzone"
                                         data-dropzone-url="http://" >

                                        <div class="fallback">
                                            <div class="custom-file">
                                                <input type="file" name="background" class="custom-file-input"
                                                       id="dropzoneBasicUpload" style="display: none;">

                                            </div>
                                        </div>

                                        <div class="dz-preview dz-preview-single">
                                            <div class="dz-preview-cover">
                                                <img class="dz-preview-img" src="" alt="" data-dz-thumbnail
                                                     style="max-width: 400px;margin: 0 auto; display: flex;">
                                                <span class="remove_file_dropzone" alt="Click me to remove the file." data-dz-remove ><i class="fas fa-times-circle"></i><span>
                                            </div>
                                        </div>

                                        <div class="dz-message"><span>Drop or Click here to upload Background</span></div>

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <?php echo langx('Type:', 'type'); ?> <br />
                                    <select class="form-control" name="type_page" placeholder="Type Page" tabindex="7">
                                        <option selected value="standard">Standard Page</option>
                                        <option value="conduit">Conduit Page</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group conduit_container">
                                    <?php echo langx('Conduit Funds', 'Conduit Funds'); ?> <br />
                                    <select class="form-control select2" id="conduit_funds" name="conduit_funds[]" tabindex="8">
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <?php echo form_close(); ?>

                <?php
                echo form_open('pages/remove', ["id" => "remove_page_form"]);
                echo form_close();
                ?>

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