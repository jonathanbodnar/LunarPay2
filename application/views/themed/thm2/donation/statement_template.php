<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Statement</title>
    </head>
    <style>
        body {
            padding: 0; margin: 0; font-size: 12px; color: rgb(82, 81, 80); font-family: Helvetica;
        }
        .no-pad-mar {
            margin-bottom: 0; padding-bottom: 0;
        }
        .table-header {
            width: 100%;padding: 0; margin: 0;
        }
        .list-right {
            list-style: none; text-align: left; display: inline-block; padding-right: 40px;
        }
        .list-right li {
            white-space: nowrap;
        }
        .table-transactions, .table-footer {
            width: 90%; padding: 5px; margin: 0 auto 0 auto;
        }
        .table-transactions td {
            padding: 5px;
        }
        .table-transactions thead th {
            text-align: left; border-bottom: 2px solid rgb(230, 230, 230);
        }
        .table-transactions tbody tr:nth-child(even) {
            background: rgb(250, 249, 248);
        }
        .table-transactions tfoot td {
            text-align: right; border-top: 1px solid rgb(230, 230, 230);
        }
        .table-footer {
            page-break-after: always;
        }
    </style>
    <body>
        <table class="table-header">
            <tbody>
                <tr>
                    <td>
                        <ul style="list-style: none;">
                            <li><?php echo $donor_name ? $donor_name : $donor_email ?></li>
                        </ul>
                    </td>
                    <td style="text-align: right; width: 1px;">
                        <ul class="list-right">
                            <li><?php echo $church_data->church_name ?></li>                            
                        </ul>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: center;">
                        <h1 class="no-pad-mar"><?php echo $date_title ?></h1>
                    </td>
                </tr>
                <tr>
                    <td colspan="2" style="text-align: center;">
                        <h3 class="no-pad-mar"><?php echo $date_range ?></h3>
                    </td>
                </tr>
            </tbody>
        </table>
        <table class="table-transactions">
            <thead>
                <tr >
                    <th style="text-align: center">Id</th>
                    <th style="text-align: center">Date</th>
                    <th style="text-align: right">Amount</th>
                    <th style="text-align: center">Method</th>
                    <th style="text-align: center">Funds</th>
                </tr>
            </thead>
            <tbody>
                <?php
                $total = 0;
                foreach ($transactions as $trx) :
                    ?>
                    <tr>
                        <td style="text-align: center">#<?php echo $trx->id ?></td>
                        <td style="text-align: center"><?php echo date_format(date_create($trx->created_at), 'm/d/Y') ?></td>
                        <td style="text-align: right">$<?php echo $trx->total_amount ?></td>
                        <?php if ($trx->source_type): ?>
                            <td style="text-align: center"><?php echo $trx->source_type == 'card' || $trx->source_type == 'bank' ? ucfirst($trx->source_type) . ' ... ' . $trx->last_digits : ''; ?></td>
                        <?php elseif ($trx->src): ?>
                            <td style="text-align: center"><?php echo ($trx->src == 'CC' ? 'Card' : 'Bank') . ($trx->last_digits ? $trx->last_digits . ' ... ' : ''); ?></td>
                        <?php elseif ($trx->batch_method): ?>
                            <td style="text-align: center"><?php echo ucfirst(strtolower($trx->batch_method)); ?></td>
                        <?php else: ?>
                            <td style="text-align: center">-</td>
                        <?php endif; ?>
                        <td style="text-align: center"><?php echo $trx->funds_name ?></td>
                    </tr>

                    <?php
                    $total += $trx->total_amount;
                endforeach;
                ?>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" ><strong>TOTAL: $<?php echo number_format($total, 2); ?></strong></td>
                </tr>
            </tfoot>
        </table>
        <table class="table-footer">
            <tr>
                <td style="text-align: center;">
                    No goods or services were provided in exchange for this contribution other than intangile religious benefits.
                </td>
            </tr>
            <tr>
                <td style="text-align: center;">
                    <?php echo $church_data->church_name ?> <?php echo $church_data->phone_no ?> <?php echo $church_data->website ?> <?php echo $church_data->tax_id ? ' Tax ID: ' . $church_data->tax_id : '' ?>
                </td>
            </tr>
        </table>
    </body>
</html>
