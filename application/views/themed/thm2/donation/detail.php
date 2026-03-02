<style>
    .card-stats .card-body {
        min-height: 120px;
    }

    /*custom style for invoice status*/
</style>

<?php $detail = $view_data['detail']; ?>

<div class="header pb-6 d-flex align-items-center top-separator-desktop">
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
<div class="container-fluid mt--6">
    <div class="row">
        <div class="col-xl-12 order-xl-1 align-items-center">
            <div class="row justify-content-center">
                <div class="col-lg-9">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-6">
                                    <h3 class="mb-0">Transaction</h3>
                                </div>
                                <div class="col-6 text-right">
                                    <div id="trnxActionWrapper" class="dropdown float-right m-2">
                                        <button class="btn btn-primary btn-sm dropdown-toggle" type="button" id="transactionActionsDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            Actions
                                        </button>
                                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="transactionActionsDropdown">

                                            <?php if ($detail->trx_type == 'Donation' && $detail->trx_ret_id == null && $detail->status == 'P'): ?>
                                                <a
                                                    class="dropdown-item btn-refund-transaction"
                                                    href="javascript:void(0)"
                                                    data-id="<?= $detail->id ?>">
                                                    <i class="fas fa-reply"></i> Refund
                                                </a>
                                            <?php endif; ?>

                                            <?php if ($detail->customer_subscription_id != null && $detail->customer_subscription_id > 0 && $detail->substatus == 'A'): ?>
                                                <a
                                                    class="dropdown-item btn-stop-subscription"
                                                    href="javascript:void(0)"
                                                    data-id-subscription="<?= $detail->customer_subscription_id ?>">
                                                    <i class="fas fa-ban"></i> Stop Subscription
                                                </a>
                                            <?php endif; ?>

                                            <?php if ($detail->manual_trx_type): ?>
                                                <a
                                                    class="dropdown-item btn-remove-transaction"
                                                    href="javascript:void(0)"
                                                    data-id="<?= $detail->id ?>">
                                                    <i class="fas fa-trash"></i> Remove
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                        <script>
                                            const actionBtn = document.getElementById('trnxActionWrapper');
                                            // if there is no dropdown-menu hide the button
                                            if (actionBtn.querySelector('.dropdown-menu').children.length == 0) {
                                                actionBtn.style.display = 'none';
                                            }
                                        </script>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div class="card-body" style="padding-left: 60px">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row">

                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">status</span>

                                                <?php
                                                $strstatus   = '';
                                                $strcanceled = '';
                                                $msgrefund   = '';
                                                ?>

                                                <?php
                                                if ($detail->manual_trx_type): {
                                                        if ($detail->status == 'P') {
                                                            $strstatus = '<span class="badge badge-primary" style="width: 70px">Succeeded</span>';
                                                        }
                                                    }
                                                elseif ($detail->src == 'CC'): {
                                                        if ($detail->status == 'P') {
                                                            if ($detail->trx_type == 'Donation' && $detail->manual_failed == '1') {
                                                                $strstatus = '<span class="badge bg-secondary" style="width: 100px">Marked as failed</span>';
                                                            } elseif ($detail->trx_type == 'Refunded') {
                                                                $strstatus = '<span class="badge badge-secondary" style="width: 70px">Refunded</span>';
                                                            } elseif ($detail->trx_type == 'Recovered') {
                                                                $strstatus = '<span class="badge bg-secondary" style="width: 70px">Recovered</span>';
                                                            } else {
                                                                $strstatus = '<span class="badge badge-primary" style="width: 70px">Succeeded</span>';
                                                            }
                                                        }
                                                    }
                                                elseif ($detail->src == 'BNK'): {
                                                        if ($detail->trx_type == 'Donation' && $detail->manual_failed == '1') {
                                                            $strstatus = '<span class="badge bg-secondary" style="width: 100px">Marked as failed</span>';
                                                        } elseif ($detail->status == 'P' && $detail->trx_type == 'Donation') {
                                                            if ($detail->status_ach == 'P' && $detail->fts_status_id == 134) {
                                                                $strstatus = '<span class="badge badge-primary" style="">' . $detail->_fts_status . '</span>';
                                                            } elseif ($detail->status_ach == 'W') {
                                                                $strstatus = '<span class="badge badge-warning">' . $detail->_fts_status . '</span>';
                                                            } else {
                                                                $strstatus = '<span class="badge badge-danger">' . $detail->_fts_status . '</span>';
                                                            }
                                                        } elseif ($detail->status == 'P' && $detail->trx_type == 'Refunded') {
                                                            $strstatus = '<span class="badge badge-secondary" style="width: 70px">Refunded</span> <span style="font-size: 10px;">' . $detail->_fts_status . '</span>';
                                                        } elseif ($detail->status == 'P' && $detail->trx_type == 'Recovered') {
                                                            $strstatus = '<span class="badge bg-secondary" style="width: 70px">Recovered</span>';
                                                        } elseif ($detail->status == 'N') {
                                                            $strstatus =  '<span class="badge badge-secondary" style="width: 70px">Not processed</span>';
                                                        }
                                                    }
                                                endif;

                                                if ($detail->customer_subscription_id != null && $detail->customer_subscription_id > 0 && $detail->substatus == 'D') {
                                                    $strcanceled = '<p class ="mb-0"><label class ="mb-0" style="color: black; font-size: 12px; font-style:italic">Subscription canceled</label>';
                                                }
                                                if ($detail->trx_type == 'Donation' && $detail->trx_ret_id != null && $detail->status == 'P') {
                                                    $msgrefund =  '<p class ="mb-0"><label class ="mb-0" style="color: black; font-size: 12px; font-style:italic" >Refunded</label>';
                                                }
                                                ?>
                                                <span class="d-block h3"> <?= $strstatus . $strcanceled . $msgrefund ?></span>


                                            </div>
                                        </div>

                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Amount </span>
                                                <span class="d-block h3"> $<?= number_format($detail->total_amount, 2, '.', ',') ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Fee</span>
                                                <span class="d-block h3"> $<?= number_format($detail->fee, 2, '.', ',') ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Net</span>
                                                <span class="d-block h3"> $<?= number_format($detail->sub_total_amount, 2, '.', ',') ?></span>
                                            </div>
                                        </div>

                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Transaction ID</span>
                                                <span class="d-block h3"> <?= $detail->epicpay_transaction_id ?></span>
                                            </div>
                                        </div>

                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Transaction date </span>
                                                <span class="d-block h3"> <?= date('m/d/Y H:i:s', strtotime($detail->created_at)) ?></span>
                                            </div>
                                        </div>
                                        <?php if ($detail->account_donor_id != null): ?>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Customer </span>
                                                    <span class="d-block h3"> <a style="text-decoration: underline; " href="  <?= BASE_URL_FILES . 'donors/profile/' . $detail->account_donor_id  ?>" class="link-primary"> <?= $detail->first_name . ' ' . $detail->last_name ?> </a> </span>
                                                </div>
                                            </div>
                                        <?php endif; ?>

                                        <?php if ($detail->email != null): ?>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Customer email </span>
                                                    <span class="d-block h3"> <?= $detail->email ?> </span>
                                                </div>
                                            </div>
                                        <?php endif; ?>

                                        <!-- <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Source</span>
                                                <span class="d-block h3"> <?= $detail->source ?></span>
                                            </div>
                                        </div> -->
                                        <?php if (($detail->payment_link_id == null && $detail->invoice_id != null)) : ?>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">INVOICE NUMBER</span>
                                                    <span class="d-block h3 "> <a style="text-decoration: underline; " href="  <?= BASE_URL_FILES . 'invoices/view/' . $detail->invoice_id  ?>" class="link-primary"> <?= $detail->invoice->reference  ?> </a></span>
                                                </div>
                                            </div>
                                            <?php if ($detail->receipt_file_uri_hash != null) : ?>
                                                <div class="col-lg-6">
                                                    <div class="form-group">

                                                        <span class="h6 surtitle text-light text-muted">Receipt</span>
                                                        <span class="d-block h3 "> <a style="text-decoration: underline; " href="<?= $detail->_receipt_file_url ?>">Download<i class="fas fa-arrow-down"></i></a> </span>
                                                    </div>
                                                </div>
                                            <?php endif; ?>

                                        <?php endif; ?>

                                        <?php if ($detail->payment_link_id != null  && $detail->invoice_id == null && empty($detail->paymentLink->is_internal)) : ?>
                                            <div class="col-lg-6">
                                                <div class="form-group">                                                    
                                                    <span class="h6 surtitle text-light text-muted">Payment Link</span>
                                                    <span class="d-block h3 "> <a style="text-decoration: underline; " href="<?= BASE_URL_FILES . 'payment_links/view/' . $detail->payment_link_id  ?>" class="link-primary">View link <i class="fas fa-arrow-right"></i> </a></span>
                                                </div>
                                            </div>
                                            <?php if ($detail->receipt_file_uri_hash != null) : ?>
                                                <div class="col-lg-6">
                                                    <div class="form-group">
                                                        <span class="h6 surtitle text-light text-muted">Receipt</span>
                                                        <span class="d-block h3"> <a style="text-decoration: underline; " href="<?= $detail->_receipt_file_url  ?>" class="link-primary">Download<i class="fas fa-arrow-down"></i></a> </span>
                                                    </div>
                                                </div>
                                            <?php endif; ?>

                                        <?php endif; ?>

                                        <?php if ($detail->customer_subscription_id) : ?>

                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Subscription</span>
                                                    <span class="d-block h3"> <a style="text-decoration: underline; " href="<?= BASE_URL . "donations/profile_recurring/" . $detail->customer_subscription_id ?>">View Subscription <i class="fas fa-arrow-right"></i></a></span>
                                                </div>
                                            </div>
                                        <?php endif; ?>


                                        <div class="col-lg-6">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Method</span>
                                                <span class="d-block h3"> <?= $detail->method ?> <?= $detail->src_account_type ? ("/ " . ucfirst($detail->src_account_type)) : "" ?> </span>
                                            </div>
                                        </div>

                                        <?php if ($detail->scsid != 0) : ?>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Last4</span>
                                                    <span class="d-block h3"> •••• <?= $detail->last_digits ?></span>
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div class="form-group">
                                                    <span class="h6 surtitle text-light text-muted">Expires</span>
                                                    <span class="d-block h3"> <?= $detail->exp_month ? $detail->exp_month . '/' . $detail->exp_year : 'N/A' ?></span>
                                                </div>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php echo form_open('donations/refund', ["id" => "refund_transaction_form"]);
    echo form_close(); ?>
    <?php echo form_open('donations/toggle_status', ["id" => "toggle_status_form"]);
    echo form_close(); ?>
    <?php echo form_open('donations/stop_subscription', ["id" => "stop_subscription_form"]);
    echo form_close();  ?>
</div>