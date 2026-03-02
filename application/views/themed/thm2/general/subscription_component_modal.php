<div id="subscription-modal-component">
    <style>
        .modal-full-screen-link .modal-dialog {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;

        }

        @media (min-width: 576px) {
            .modal-full-screen-link .modal-dialog {
                max-width: 100% !important;
                margin: 0px !important;
            }
        }

        .modal-full-screen-link .modal-content {
            height: 100% !important;
            min-height: 100% !important;
            border-radius: 0 !important;
        }

        .modal-full-screen-link .modal .modal-body {
            overflow-y: auto;
        }

        .modal-full-screen-link .modal {
            padding: 0 !important;
        }

        .modal-full-screen-link .modal-header .close {
            float: left !important;
        }

        .modal-full-screen-link .close>span:not(.sr-only) {
            font-size: 1.75rem;
        }

        .modal-full-screen-link .modal-header .close {
            margin: -1.1rem
        }

        .modal-full-screen-link .modal-footer {
            padding-bottom: 50px
        }

        #products-list .btn-add-product {
            display: none;
        }

        #products-list .product-row:last-child .btn-add-product {
            display: block !important;
        }

        #products-list .product-row:only-child .remove-product-row-btn {
            display: none !important;
        }

</style>
    
    <div class="modal fade modal-full-screen-link main_modal">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" style="overflow-y: auto">
                <div class="modal-header d-flex justify-content-between flex-wrap align-items-start">
                    <div class="d-flex align-items-center">
                        <!-- Close button aligned center with title -->
                        <button type="button" class="close mr-2 ml-1" data-dismiss="modal" aria-label="Close"
                            style="font-size: 1.5rem; line-height: 1; padding: 0;">
                            <span aria-hidden="true">&times;</span>
                        </button>

                        <!-- Divider -->
                        <div style="border-left: 1px solid #ccc; height: 45px; margin: 0 12px;"></div>

                        <!-- Title and company stacked -->
                        <div>
                            <div id="component_title" style="font-weight: bold; font-size: 1.25rem; white-space: nowrap; line-height: 1;">
                                <?= langx('subscription') ?>
                            </div>
                            <div class="subtitle text-muted font-italic" style="font-size: 12.7px; margin-top: 4px;">
                                <span class="organization_name font-weight-bold d-block"></span>
                            </div>
                        </div>
                    </div>
                    <div class="d-none d-md-flex">
                        <button type="button" class="btn btn-primary w-100 w-md-auto btn-save">Create</button>
                    </div>                
                </div>

                <div class="modal-body px-0 px-md-3">
                    <?php echo form_open("subscription/create", ['role' => 'form', 'id' => 'main_form']); ?>
                    <div class="row">
                        <div class="col-md-10 offset-md-2 p-5 ">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <strong><?php echo langx('customer', 'account_donor_id'); ?> <br /></strong>
                                        <select class="form-control select2 donor" name="account_donor_id" >
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <strong><?php echo langx('payment_options', 'payment_options'); ?> <br /></strong>
                                        <select class="form-control select2 payment_options" name="payment_options">
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <hr class="mt-0 mb-1">
                            <div id="products-list"></div>
                            <div class="row mt-3">
                                <div class="col-md-12">
                                    <div class="form-group d-flex">
                                        <label class="custom-toggle">
                                            <input id="cover_fee" type="checkbox"
                                                name="cover_fee" value="1">
                                            <span class="custom-toggle-slider rounded-circle"></span>
                                        </label>
                                        <label for="cover_fee" class="ml-2">Make your customer cover the fees</label>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div id="paymentMethodsWrapper" class="col-md-4 align-items-center">
                                    <div style="max-width: 380px">
                                        <strong><?php echo langx('payment_method', 'payment_method_id'); ?> <br /></strong>
                                        <select class="form-control select2 select2-single-arrow" id="payment_method_id" name="payment_method_id">
                                            <option value="">No payment method found</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr class="mb-4 mt-4">

                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group d-flex">
                                        <label class="custom-toggle">
                                            <input id="trial_enabled" type="checkbox" name="trial_enabled" value="1">
                                            <span class="custom-toggle-slider rounded-circle"></span>
                                        </label>                                        
                                        <label for="trial_enabled" class="ml-2 mb-0">Trial Enabled (Recurring Products Only)</label>
                                        <label class="tooltip-help text-center ml-2 mb-0" style="height: 20px" data-toggle="tooltip" data-html="true" data-placement="left"
                                            title='<?php $this->load->view('helpers/subscription_trial_period.php') ?>'>
                                            <strong>?</strong>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="trial-options" class="row" style="display: none;">
                                <div class="col-md-1">
                                    <div class="form-group mb-1">
                                        <label>Trial Days</label>
                                        <input id="trial_days" name="trial_days" type="number" min="0" value="0" class="form-control" placeholder="Enter number of days" disabled>
                                    </div>
                                </div>
                                <div class="col-md-3 mt-2 mt-md-0" style="max-width: 300px">
                                    <div class="form-group">
                                        <label>Trial End Date</label>
                                        <input id="trial_end_date" name="trial_end_date" class="form-control" data-provide="datepicker" data-date-format="mm/dd/yyyy" data-date-start-date="0d" placeholder="Select end date" disabled>
                                    </div>
                                </div>
                            </div>                            
                        </div>
                    </div>
                    <div class="row d-md-none">
                        <div class="col-md-12 px-5">
                            <div class="">
                                <button type="button" class="btn btn-primary  btn-save">Create</button>
                            </div>
                        </div>
                    </div>
                    <?php echo form_close(); ?>
                </div>
                <div class="modal-footer text-center">
                    
                </div>
            </div>
            <!-- /.modal-content -->
        </div>
        <!-- /.modal-dialog -->
    </div>
</div>