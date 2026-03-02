<div class="modal fade" id="product-component">
    <style>
        #customerdate-list .btn-add-customerdate {
            display: none;
        }

        #customerdate-list .customerdate-row:last-child .btn-add-customerdate {
            display: block !important;
        }

        #customerdate-list .customerdate-row:only-child .remove-customerdate-row-btn {
            display: none !important;
        }
    </style>
    <div class="modal-dialog modal-dialog-centered modal-lg" style="max-width: 740px">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    <?= langx('Product') ?>
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="subtitle">
                        <br>
                        <?= langx('to') ?>
                        <span class="organization_name" style="font-weight: bold"></span>
                    </span>
                </h4>
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
                <?php echo form_open("products/save", ['role' => 'form', 'id' => 'product_component_form', 'autocomplete' => 'nope']); ?>
                <div class="row">

                    <div id="organization_field" class="col-md-6 d-none">

                        <div class="form-group">
                            <?php echo langx('company:', 'organization_id'); ?> <br />
                            <select class="form-control" name="organization_id" placeholder="">
                            </select>
                        </div>
                    </div>
                    <div id="suborganization_field" class="col-md-6 d-none">
                        <div class="form-group">
                            <?php echo langx('sub_organization:', 'suborganization_id'); ?> <br />
                            <select class="form-control" name="suborganization_id" placeholder="">
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('name:', 'name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="product_name" placeholder="Name" autocomplete="off">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('description', 'description'); ?>
                            <label class="tooltip-help text-center" data-toggle="tooltip" data-html="true" data-placement="left"
                                title='<?php $this->load->view('helpers/product_description_help_text.php') ?>'>
                                ?
                            </label>
                            <br />
                            <textarea class="form-control" maxlength="300" name="description" rows="1"></textarea>
                            <small class="text-muted">Max 300 characters</small>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <hr class="mt-1 mb-3" />
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('price:', 'price:'); ?> <br />
                            <input type="number" class="form-control" name="price" placeholder="0.00">
                        </div>
                    </div>
                    <div class="col-md-6 recurrence_options">
                        <div class="form-group">
                            <?php echo langx('recurrence:', 'recurrence'); ?> <br />
                            <select class="form-control" name="recurrence" placeholder="">
                                <option value="O" selected>One Time</option>
                                <option value="R">Periodically</option>
                                <option value="C">Custom</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('Plan Type:', 'plan_type'); ?> <br />
                            <input type="text" class="form-control" name="plan_type" placeholder="e.g., basic, pro, enterprise, premium, etc.">
                            <small class="text-muted">Required. If left empty, will be auto-generated from product name.</small>
                        </div>
                    </div>
                    <div id="billing_period_container" class="col-md-6 recurrence_options" style="display: none">
                        <div class="form-group">
                            <?php $this->load->model('product_model') //for reading PERIODICALLY_STRINGS strings 
                            ?>
                            <?php echo langx('Billing Period:', 'billing_period'); ?> <br />
                            <select class="form-control" name="billing_period" placeholder="">
                                <?php foreach (Product_model::PERIODICALLY_STRINGS as $rid => $rvalue): ?>
                                    <?php if ($rvalue != Product_model::PERIODICALLY_CUSTOM) : ?>
                                        <option value="<?= $rid ?>"><?= $rvalue ?></option>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div id="start_subscription_slider" class="col-md-6 recurrence_options" style="display: none">
                        <div class="form-group d-flex pt-0 pt-md-4">                            
                            <label class="custom-toggle mt-3" style="min-width: 52px">
                                <input id="start_subscription_system" type="checkbox" name="start_subscription_system" value="1">
                                <span class="custom-toggle-slider rounded-circle"></span>
                            </label>
                            <label for="start_subscription_system" id="text_subscription_slider" class="mt-3 ml-2 text-justify">
                                Allow customers to set the date for the first payment. 
                                This option applies to payment links when no trial period is specified.
                            </label>
                        </div>
                    </div>                    
                    <div class="col-md-12">
                        <hr class="mt-1 mb-3" />
                    </div>
                    <div class="col-md-12 d-none">

                        <div id="image_dropzone" class="dropzone dropzone-single"
                            data-toggle="dropzone"
                            data-dropzone-url="http://">
                            <div class="fallback">
                                <div class="custom-file">
                                    <input type="file" name="logo"
                                        class="custom-file-input"
                                        id="dropzoneBasicUpload"
                                        style="display: none;">
                                </div>
                            </div>

                            <div class="dz-preview dz-preview-single">
                                <div class="dz-preview-cover">
                                    <img class="dz-preview-img" src="" alt=""
                                        data-dz-thumbnail
                                        style="max-width: 200px;margin: 0 auto; display: flex;">
                                </div>
                            </div>

                            <div class="dz-message" style="padding: 3.7rem 1rem;"><span>Drop or Click here to Product Image</span>
                            </div>

                        </div>

                    </div>
                    <div class="col-md-12 ">
                        <div id="customerdate-list"></div>
                    </div>
                    <div class="col-md-12">


                        <style>
                            .tooltip-inner {
                                max-width: 315px;
                                width: 315px
                            }
                        </style>
                        <?php echo langx('deliverable', 'digital_content'); ?>
                        <label for="digital_content">PDF</label>
                        <?php echo langx('file', 'digital_content'); ?>&nbsp;&nbsp;

                        <label style="text-align:center; position:relative; bottom: 2px" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right"
                            title='You can upload a PDF file to be delivered to your customer once they have paid'>
                            <strong>?</strong>
                        </label>


                        <br />
                        <div class="custom-file">
                            <input type="file" accept=".pdf" id="digital_content" name="digital_content" class="custom-file-input d-none" lang="en">
                            <label id="digital_content_label" data-default-text="<?= langx('No file selected'); ?>"
                                class="custom-file-label" for="digital_content"></label>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <div class="form-group d-flex align-items-center mt-3">                        
                            <label class="custom-toggle mb-0">
                                <input id="show_customer_portal" type="checkbox" name="show_customer_portal" value="1" checked>
                                <span class="custom-toggle-slider rounded-circle"></span>
                            </label>
                            <label for="show_customer_portal" class="mb-0 ml-2">
                                Show in customer portal
                            </label>
                            <label class="tooltip-help text-center ml-2" data-toggle="tooltip" data-html="true" data-placement="left"
                                title='<?php $this->load->view('helpers/product_show_customer_portal_help_text.php') ?>'>
                                ?
                            </label>
                        </div>
                    </div>

                </div>
                <?php echo form_close(); ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button data-dismiss="modal" aria-label="Close" type="button" class="btn btn-default">Close</button>
                <button type="button" class="btn btn-primary btn-save" style="width: 200px">Create</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>