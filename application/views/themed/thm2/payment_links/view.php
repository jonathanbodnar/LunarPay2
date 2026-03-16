<style>
    .card-stats .card-body {
        min-height: 120px;
    }

    /*custom style for invoice status*/
    .invoiceStatus span.badge {
        font-size: .84em;
        width: auto !important;
        padding: 6px 14px;
        margin-left: -4px;
        font-weight: 600
    }
</style>

<div id="links-view-container">
    <!-- Header -->
    <div class="header pb-6 d-flex align-items-center" style="min-height: 146px; background-size: cover; background-position: center top;">
        <!-- Mask -->
        <span class="mask bg-gradient-default opacity-8" style="background-color: inherit!important; background: inherit!important"></span>
        <!-- Header container -->
        <div class="container-fluid align-items-center">
            <div class="row">
                <div class="col-lg-7 col-md-10">
                    <h1 class="display-2"></h1>
                    <p class="mt-0 mb-5" style="margin:0!important; margin-top: -10px!important"></p>
                </div>
            </div>
        </div>
    </div>
    <!-- Page content -->
    <div class="container-fluid mt--6">
        <div class="row">
            <div class="col-xl-12 order-xl-1 align-items-center">
                <div class="row justify-content-center">
                    <!--<div class="col-lg-2"></div>-->
                    <div class="col-lg-9">
                        <div class="card">
                            <div class="card-header">
                                <div class="row align-items-center">
                                    <div class="col-12 col-md-4 text-md-left text-center">
                                        <h3 class="mb-0">Payment Link</h3>
                                    </div>
                                    <div class="col-12 col-md-8 d-flex flex-column flex-md-row justify-content-md-end align-items-center">
                                        <div class="d-flex flex-row flex-wrap justify-content-center justify-content-md-end w-100">
                                            <button class="btn btn-primary btn-sm btn-edit m-2" data-hash="<?= $links->hash ?>" type="button">
                                                <span class="btn-inner--text px-1">Update changes</span>
                                            </button>
                                            <div class="dropdown m-2">
                                                <button class="btn btn-primary btn-sm dropdown-toggle" type="button" id="paymentActionsDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                    Actions
                                                </button>
                                                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="paymentActionsDropdown">
                                                    <a
                                                        class="dropdown-item"
                                                        href="<?= CUSTOMER_APP_BASE_URL . 'c/portal/payment_link/' . $links->hash ?>" target="_blank">
                                                        <i class="fas fa-external-link-alt"></i> View as customer
                                                    </a>
                                                    <a
                                                        class="dropdown-item btn-copy-payment-link"
                                                        data-link="<?= CUSTOMER_APP_BASE_URL . 'c/portal/payment_link/' . $links->hash ?>"
                                                        href="javascript:void(0)">
                                                        <i class="fas fa-clipboard"></i> Copy Link
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body px-5">

                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="row">
                                            <div class="col-lg-12 text-left invoiceStatus">
                                                <h6 class="heading-small mb-1 pb-2"><?= $links->_status ?></h6>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span id="payment_link_id" data-id="<?= $links->id ?>"></span>
                                                    <span class="h6 surtitle text-light text-muted">ID</span>
                                                    <span class="d-block h3"> <?= $links->id ?></span>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Company</span>
                                                    <span class="d-block h3"><?= $links->organization->name ?></span>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Client covers the processing fee</span><br>
                                                    <label class="custom-toggle mt-2">
                                                        <input disabled type="checkbox" <?= $links->cover_fee ? 'checked' : '' ?> class="form-control" name="cover_fee_edit">
                                                        <span class="custom-toggle-slider rounded-circle" data-label-off="No" data-label-on="Yes"></span>
                                                    </label>

                                                </div>
                                            </div>

                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Created</span>
                                                    <span class="d-block h3"><?= ($links->created_at) ? date("F j, Y", strtotime($links->created_at)) : ' - ' ?></span>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Payment options</span>
                                                    <span class="d-block h3">
                                                        <?= (in_array('CC', json_decode($links->payment_methods, true)) && in_array('BANK', json_decode($links->payment_methods, true))) ? 'Credit Card - Bank' : (in_array('CC', json_decode($links->payment_methods, true)) ? 'Credit Card' : 'Bank') ?>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Created by</span>
                                                    <span class="d-block h3">
                                                        <?= $links->_creator ?>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Trial Days</span>
                                                    <label class="tooltip-help text-center ml-2 mb-0" style="height: 20px" data-toggle="tooltip" data-html="true" data-placement="left"
                                                        title='<?php $this->load->view('helpers/subscription_trial_period.php') ?>'>
                                                        <strong>?</strong>
                                                    </label> 
                                                    <span class="d-block h3"> <?= $links->trial_days ? $links->trial_days : 'N/A'  ?></span>  
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Post Purchase Link</span>
                                                    <span class="d-block h3"><?= $links->show_post_purchase_link ? $links->post_purchase_link : 'No' ?></span>
                                                </div>
                                            </div>
                                            <div class="col-lg-8">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Link</span>
                                                    <span class="d-block h3">
                                                        <?= $links->_link_url ?>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>                                       
                                    </div>
                                    <div class="col-md-1"></div>
                                </div>
                                <?php echo form_open("", ['role' => 'form', 'id' => 'token_form']); ?>
                                <?php echo form_close(); ?>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row justify-content-center">
                    <div class="col-lg-9">
                        <div class="card">
                            <div class="card-header">
                                <div class="row align-items-center">
                                    <div class="col-6">
                                        <h3 class="mb-0">Products</h3>
                                    </div>
                                </div>
                            </div>

                            <div class="card-body px-5">
                                <form id="edit_product_form">
                                    <table class="table table-flush table-sm table-responsive-md table-no-borders">
                                        <thead>
                                            <tr>
                                                <th class="h6 surtitle text-light text-muted">Product name</th>
                                                <th class="h6 surtitle text-light text-muted text-center">Let customers adjust quantity</th>
                                                <th class="h6 surtitle text-light text-muted text-center">Qty</th>
                                                <th class="h6 surtitle text-light text-muted text-center">Price</th>
                                                <th class="h6 surtitle text-light text-muted text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php
                                            $sum = 0;
                                            foreach ($links->products as $product) {
                                                $sum = $sum + ($product->qty * $product->product_price);
                                            ?>
                                                <tr>
                                                    <td>
                                                        <span class="d-block h4 mb-0"><?= $product->product_name ?> (<?= Product_model::RECURRENCE_STRINGS[$product->recurrence] ?>)  </span>
                                                        <?= $product->digital_content ? '<a class="text-xs" href="' . $product->digital_content_url . '">Download Deliverable</a>' : '' ?>
                                                        <input type="hidden" class="product_id" value="<?= $product->product_id ?>">
                                                        <input type="hidden" class="payment_link_product_id_<?= $product->product_id ?>" value="<?= $product->id ?>">
                                                    </td>
                                                    <td class="d-flex justify-content-center">
                                                        <label class="custom-toggle  custom-toggle">
                                                            <input type="checkbox" <?= $product->is_editable == 1 ? 'checked' : '' ?> class="form-control editable_<?= $product->product_id ?>" name="editable" <?= $product->recurrence == 'C' ? 'disabled' : '' ?>>
                                                            <span class="custom-toggle-slider rounded-circle" data-label-off="No" data-label-on="Yes"></span>
                                                        </label>
                                                    </td>
                                                    <td class="text-center">
                                                        <input type="number" id="<?= $product->product_id ?>" min="1" max="1000" class="form-control qty_<?= $product->product_id ?>" value="<?= $product->qty ?>" style="width:80px!important; margin: auto; padding: 0 0.75rem; max-height: 2rem;" <?= $product->recurrence == 'C' ? 'disabled' : '' ?> />
                                                    </td>
                                                    <td class="text-center">
                                                        <div class="form-group">

                                                            <span class="d-block h4 mb-0">$<?= number_format($product->product_price, 2, '.', ',') ?></span>
                                                        </div>
                                                    </td>
                                                    <td class="text-right">
                                                        <div class="form-group">
                                                            <span class="d-block h3">$<?= number_format($product->product_price * $product->qty, 2, '.', ',') ?></span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            <?php } ?>
                                            <tr class="mb-3">
                                                <td><span class="h6 surtitle text-light text-muted">Total</span></td>
                                                <td><span class="h4  text-light">&nbsp;</span></td>
                                                <td><span class="h4  text-light">&nbsp;</span></td>
                                                <td><span class="h4  text-light">&nbsp;</span></td>
                                                <td class="text-right"><span class="d-block h3 text-right font-weight-bold"> $<?= number_format($sum, 2, '.', ',') ?></span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>