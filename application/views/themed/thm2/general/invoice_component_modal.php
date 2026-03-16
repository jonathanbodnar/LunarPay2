
<div id="invoice-component">
    <style>
        label {
            display: inline-block;
            margin-bottom: .5rem;
        }
        .modal-full-screen .modal-dialog {
            width: 100%!important; height: 100%!important;margin: 0!important; padding: 0!important;

        }
        @media (min-width: 576px){
            .modal-full-screen .modal-dialog {
                max-width: 100%!important;
                margin: 0px!important;
            }
        }

        .modal-full-screen .modal-content {
            height: 100%!important; 
            min-height: 100%!important; border-radius: 0!important;
        }

        .modal-full-screen .modal .modal-body {
            overflow-y: auto;
        }

        .modal-full-screen .modal {
            padding: 0 !important; 
        }

        .modal-full-screen .modal-header .close {
            float:left!important;
        }

        .modal-full-screen  .close > span:not(.sr-only) {
            font-size: 1.75rem;
        }

        .modal-full-screen .modal-header .close {
            margin: -1.1rem
        }

        .modal-full-screen .modal-footer {
            padding-bottom: 50px
        }

        #products-list .btn-add-product {
            display: none;
        }

        #products-list  .product-row:last-child .btn-add-product {
            display: block !important;
        }

        #products-list .product-row:only-child .remove-product-row-btn {
            display: none !important;
        }
    </style>

    <style id="css_preview"></style>

    <div class="modal fade modal-full-screen" id="main_modal">
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
                                <?= langx('create_invoice') ?>
                            </div>
                            <div class="subtitle text-muted font-italic" style="font-size: 12.7px; margin-top: 4px;">
                                <span class="organization_name font-weight-bold d-block"></span>
                            </div>
                        </div>
                    </div>
                    <div class="d-none d-md-flex">
                        <button type="button" class="btn btn-neutral btn-save" style="width: 150px" >Save Draft</button>
                        <button type="button" class="btn btn-primary ml-2 btn-review">Review Invoice</button>
                    </div>                
                </div>
                <div class="modal-body">                


                    <?php echo form_open("invoice/create", ['role' => 'form', 'id' => 'main_form']); ?>

                    <div class="row">
                        <div id="initial_space" class="col-md-1"></div>
                        <div class="col-md-6">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <strong><?php echo langx('customer', 'account_donor_id'); ?> <br /></strong>
                                        <select class="form-control select2 donor" name="account_donor_id" >
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <strong><?php echo langx('payment_options', 'payment_options'); ?> <br /></strong>
                                        <select class="form-control select2 payment_options" name="payment_options" >
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="products-list"></div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <strong><?php echo langx('memo', 'memo'); ?> <br /></strong>
                                        <textarea class="form-control" name="memo" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row align-items-stretch">
                                <div class="col-md-3">
                                    <div class="form-group h-100 d-flex flex-column justify-content-center">
                                        <strong><?php echo langx('due_date', 'due_date'); ?><br /></strong>
                                        <input id="due_date" name="due_date" class="form-control" data-provide="datepicker" data-date-format="mm/dd/yyyy" data-date-start-date="0d">
                                    </div>
                                </div>                               
                            </div>
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
                                <div class="col-md-12 d-flex align-items-center">
                                    <div class="form-group d-flex align-items-center">
                                        <label class="custom-toggle">
                                            <input id="auto_charge" type="checkbox" name="auto_charge" value="1">
                                            <span class="custom-toggle-slider rounded-circle"></span>
                                        </label>                                
                                        <label for="auto_charge" class="ml-2 mb-0">Auto-charge customer</label>
                                        <label class="tooltip-help text-center ml-2 mb-0" style="height: 20px" data-toggle="tooltip" data-html="true" data-placement="left"
                                            title='<?php $this->load->view('helpers/invoice_autochargue.php') ?>'>
                                            <strong>?</strong>
                                        </label>
                                    </div>
                                </div>
                                
                                <div id="paymentMethodsWrapper" style="display: none" class="col-md-5 align-items-center mb-3">
                                     <strong><?php echo langx('payment_method', 'payment_method_id'); ?> <br /></strong>
                                    <select class="form-control select2 select2-single-arrow" id="payment_method_id" name="payment_method_id">
                                        <option value="">No payment method found</option>
                                    </select>
                                    
                                </div>
                            </div>
                            <hr class="mt-0 mb-1">
                            <div class="row mt-4">
                                <div class="col-md-12" >
                                    <div class="form-group d-flex mb-0">
                                        <label class="custom-toggle">
                                            <input id="show_post_purchase_link" type="checkbox"
                                                   name="show_post_purchase_link" value="1">
                                            <span class="custom-toggle-slider rounded-circle"></span>
                                        </label>
                                        <label for="show_post_purchase_link" class="ml-2">Post Purchase Link</label>
                                    </div>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-11 col-md-6">
                                    <div class="form-group">
                                        <input type="text" class="form-control" name="post_purchase_url" placeholder="https://example.site" autocomplete="off">
                                    </div>
                                </div>
                                <div class="col-1 pl-1">
                                    <label style="text-align:center; position:relative; top: 10px" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right"
                                           title='By enabling the post purchase link option you can add a link to redirect your customers where you want to.'>
                                        <strong>?</strong>
                                    </label>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <strong><?php echo langx('footer', 'footer'); ?> <br /></strong>
                                        <textarea class="form-control" placeholder="It will show up on the PDF invoice only" name="footer" rows="3"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-5 text-center" style="/*box-shadow: -6px 3px 13px -6px #cbcbcb;*/">
                            <div class="ml-1 mt-4">
                                <div class="mt-3">
                                    Adjust your brand settings in <strong><a class="text-white" target="_BLANK" href="<?= BASE_URL ?>settings/branding">branding page</a></strong>                                
                                </div>
                                <div class="mt-4 mb">
                                    <strong><label for="memo">Email preview</label></strong>
                                </div>                            
                            </div>
                            <?php
                            $invoice_html = $this->load->view("email/invoice.html", '', true);
                            $invoice_html = str_replace("[baseUrl]", CUSTOMER_APP_BASE_URL, $invoice_html);
                            $invoice_html = str_replace("[logoUrl]", '', $invoice_html);
                            $invoice_html = str_replace("[hasLogo]", 'block', $invoice_html);
                            $invoice_html = str_replace("[CompanySite]", COMPANY_SITE, $invoice_html);
                            $invoice_html = str_replace("[baseAssets]", BASE_ASSETS, $invoice_html);
                            $invoice_html = str_replace("[PaymentLink]", '#', $invoice_html);
                            $invoice_html = str_replace("[link_pdf]", '#', $invoice_html);
                            $invoice_html = str_replace("[products]", '', $invoice_html);
                            $invoice_html = str_replace("[ThemeColor]", '', $invoice_html);
                            $invoice_html = str_replace("[BackColor]", '', $invoice_html);
                            $invoice_html = str_replace("[ForeColor]", '', $invoice_html);
                            $invoice_html = str_replace("[OrgName]", '', $invoice_html);
                            echo $invoice_html;
                            ?>
                        </div>
                    </div>
                    <div class="row d-md-none">
                        <div class="col-md-12 ">
                            <div class="">
                                <button type="button" class="btn btn-neutral btn-save" style="width: 150px" >Save Draft</button>
                                <button type="button" class="btn btn-primary ml-2 btn-review">Review Invoice</button>                                
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
    <div class="modal fade" tabindex="-1" role="dialog" id="reviewModal">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Send Invoice</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p ><b id="review-invoice-data"></b></p>
                    <p>Invoices can’t be edited after they’re sent.</p>
                    <p>
                    <div class="form-group d-flex flex-column align-items-left">

                        <label>
                            <b>Include on this email: <br /></b>    
                        </label>       
                        <input  type="email" id="optional-email" class="form-control focus-first" placeholder="Add email (optional)">

                    </div>
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Continue editing</button>
                    <button type="button" class="btn btn-primary btn-send">Send Invoice</button>
                </div>
            </div>
        </div>
    </div>
</div> 