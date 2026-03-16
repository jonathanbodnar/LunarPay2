<style>
    .card-stats .card-body {
        min-height: 120px;
    }

    
    /*custom style for invoice status*/
</style>
<?php $this->load->helper('money');?>
<?php $payout = $view_data['payout']; ?>
<?php $trxns = $view_data['trxns']; ?>

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
                <div class="col-lg-11">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <h3 class="mb-0">Payout</h3>
                                </div>
                                <div class="col-md-9 text-right">

                                </div>
                            </div>
                        </div>
                        <div class="card-body" style="padding-left: 60px">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row">

                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted text-center">
                                                    status

                                                    <style>
                                                        .tooltip-inner {
                                                            max-width: 625px;
                                                            width: 625px;
                                                            font-size: 14px;
                                                        }
                                                    </style>
                                                    <label class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right"
                                                        title='<?php $this->load->view('helpers/fortis_payouts_status_instructions') ?>'>
                                                        ?
                                                    </label>
                                                </span>
                                                <span class="d-block h3 mt-1">
                                                    <?php
                                                    $labelClass = '';
                                                    if (($payout->_type === 'Bank' && $payout->_fts_status_id == FORTIS_STATUS_SETTLED) ||
                                                        ($payout->_type === 'Credit Card' && $payout->processing_status_id == FORTIS_BATCH_SETTLED)
                                                    ) {
                                                        $labelClass = 'primary';
                                                    } else {
                                                        $labelClass = 'secondary';
                                                    }

                                                    echo '<span class="badge badge-' . $labelClass . '">' . strtoupper($payout->_processing_status_label) . '</span>';
                                                    ?>
                                                </span>

                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Payout ID</span>
                                            <span class="d-block h3"><?= $payout->id ?></span>
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Type</span>
                                            <span class="d-block h3"><?= $payout->_type ?></span>
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Total Net Amount</span>
                                            <?php
                                                $totalNetAmount = 0;

                                                foreach ($trxns as $trxn) {
                                                    $totalNetAmount += $trxn->_sub_total_amount;
                                                }
                                            ?>
                                            <!-- <span class="d-block h3"><?= '$' . amountToCurrency($payout->total_sale_amount / 100, 2) ?></span> -->
                                            <span class="d-block h3"><?= '$' . amountToCurrency($totalNetAmount) ?></span> 
                                            
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Total Amount Count</span>
                                            <span class="d-block h3"><?= $payout->total_sale_count ?></span>
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Created At</span>
                                            <span class="d-block h3"><?= date('m/d/Y h:i A', ($payout->created_ts)) ?></span>
                                        </div>

                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Total Refund Amount</span>
                                            <span class="d-block h3"><?= '$' . number_format($payout->total_refund_amount / 100, 2) ?></span>
                                        </div>
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Total Refund Count</span>
                                            <span class="d-block h3"><?= $payout->total_refund_count ?></span>
                                        </div>
                                        <?php if ($payout->batch_close_detail): ?>
                                            <div class="col-lg-4">
                                                
                                            </div>
                                            <div class="col-lg-12">
                                                <span class="h6 surtitle text-light text-muted">Details</span>
                                                <span class="d-block h3"><?= $payout->batch_close_detail ?></span>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="table-responsive">
                            <table class="table table-flush">
                                <thead class="thead-light">
                                    <tr>
                                        <th>Transaction ID</th>
                                        <!-- <th>Settle Date</th> -->
                                        <th>Transaction Type</th>
                                        <th>Net Amount</th>
                                        <th>Description</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($trxns as $trxn): ?>
                                        <?php
                                        // Map the transaction type ID to the transaction type
                                        $transactionType = [
                                            20 => 'Sale',
                                            21 => 'AVS Only',
                                            22 => 'Settle',
                                            30 => 'Refund',
                                            40 => 'Credit',
                                            50 => 'Debit',
                                        ][$trxn->type_id] ?? 'Unknown';

                                        $settleDateF = $trxn->settle_date ? date('m/d/Y h:i A', ($trxn->settle_date)) : '-';
                                        $createdTsF = date('m/d/Y h:i A', ($trxn->created_ts));
                                        $color = $trxn->type_id == 30 ? 'text-gray' : '';
                                        $sign = $trxn->type_id == 30 ? '-' : '';
                                        //$formattedAmount = number_format($trxn->transaction_amount / 100, 2);
                                        $formattedNetAmount = amountToCurrency($trxn->_sub_total_amount);
                                        ?>
                                        <tr>
                                            <td><?= $trxn->id ?></td>
                                            <!-- <td><?= $settleDateF ?></td> -->
                                            <td><?= $transactionType ?></td>
                                            <td class="<?= $color ?>"><?= $sign . '$' . $formattedNetAmount ?></td>
                                            <td><?= $trxn->description ?: '-' ?></td>
                                            <td><?= $createdTsF ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>