<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <style>

            body {
                font-family: Helvetica !important;
                font-size: 13px;
            }       

            .container-box {        
                max-width: 800px;
                margin: auto;
                padding: 0px 30px 30px 30px;
                box-shadow: 0 0 10px rgba(0, 0, 0, .15);        
                line-height: 24px;
                color: #555;
            }

            .container-box table {
                width: 100%;
                line-height: inherit;
                text-align: left;
            }

            .container-box table td {
                padding: 5px;
                vertical-align: top;
            }

            .container-box table tr td:nth-child(4) {
                text-align: right;
            }

            .container-box table tr.top table td {
                padding-bottom: 20px;
            }

            .container-box table tr.top table td.title {
                font-size: 45px;
                line-height: 45px;
                color: #333;
            }

            .container-box table tr.information table td {
                padding-bottom: 10px;
            }

            .container-box table tr.heading  {

                font-weight: bold;
            }

            .container-box table tr.details td {
                padding-bottom: 20px;
            }

            .container-box table tr.item td{
                border-bottom: 1px solid #eee;
            }
            .container-box table tr.head td{
                border-top: 1px solid #000;
            }
            .container-box table tr.item.last td {
                border-bottom: none;
            }

            .container-box table tr.total td:nth-child(n+2):nth-child(-n+4) {
                border-top: 1px solid #eee;
                font-weight: bold;
            }

            @media only screen and (max-width: 600px) {
                .container-box table tr.top table td {
                    width: 100%;
                    display: block;
                    text-align: center;
                }

                .container-box table tr.information table td {
                    width: 100%;
                    display: block;
                    text-align: center;
                }
            }
            .rtl {
                direction: rtl;
            }

            .rtl table {
                text-align: right;
            }

            .rtl table tr td:nth-child(4) {
                text-align: left;
            }
            footer {
                position: fixed; 
                bottom: -40px; 
                left: 0px; 
                right: 0px;
                height: 150px; 
                border-top: 1px solid #eee;
                background-color: #fff;
                color: #333;
                text-align: left;
                line-height: 21px;
            }
            @page {
                margin: 30px 25px;
            }
            .wrapper-page {
                page-break-after: always;
            }

            .wrapper-page:last-child {
                page-break-after: avoid;
            }

            .container-box .memo {
                padding-top: 20px;
                padding-bottom: 20px;
            }
        </style>
    </head>

    <body>
        <div class="wrapper-page">
            <footer>
                <span>
                    <?php if ($trxnFull->invoice_id): ?>                 
                        <p style="width: 100%; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">
                            <?= $trxnFull->invoice->footer ? $trxnFull->invoice->footer . '<br><br>' : '' ?>
                        </p>
                        <br>
                    <?php endif; ?>
                    Invoicing brought to you by <a href="http://lunarpay.com"><?= COMPANY_SITE ?></a>            
                </span>
            </footer>

            <?php if ($trxnFull->invoice_id): ?>
                <div class="container-box">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td colspan="4"><h3>PAYMENT RECEIPT</h3><td>
                        </tr>

                        <tr class="top">                
                            <td colspan="4">
                                <table>
                                    <tr>
                                        <td class="title">
                                            <img width="135" src="<?= $trxnFull->branding->logo_base64 ?>" alt="" />
                                        </td>                            
                                        <td>
                                            <style>
                                                .lc1 { width:48%; float:left; text-align: right } 
                                                .lc2 { width:50%; float:right; text-align: right }
                                            </style>
                                            <div class="lc1">Receipt Reference:</div>
                                            <div class="lc2"><strong>000<?= $trxnFull->id ?></strong></div>
                                            <div style="clear:both"></div>
                                            <div class="lc1">Invoice Reference:</div>
                                            <div class="lc2"><strong><?= $trxnFull->invoice->reference ?></strong></div>
                                            <div style="clear:both"></div>
                                            <div class="lc1">Invoice issued:</div>
                                            <div class="lc2"><?= date("F j, Y", strtotime($trxnFull->invoice->finalized)) ?></div>                                                                                        
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="information">
                            <td colspan="4">
                                <table>
                                    <tr>
                                        <td style="padding-right:5%; width:50%; text-align:left">
                                            <strong>From</strong><br>
                                            <?= $trxnFull->invoice->organization->name ?><br>
                                            <?= $trxnFull->organization->onboard->merchant_address_line_1 ?>
                                            <?= $trxnFull->organization->onboard->merchant_city ?>, 
                                            <?= $trxnFull->organization->onboard->_merchant_state ?>
                                            <?= $trxnFull->organization->onboard->merchant_postal_code ?>
                                        </td>
                                        
                                        <td style="padding-left:5%; width:50%; text-align:right">
                                            <strong>Billed To</strong><br>
                                            <?= $trxnFull->invoice->customer->first_name ?> <?= $trxnFull->invoice->customer->last_name ?> - 
                                            <?= $trxnFull->invoice->customer->email ?>
                                            <?php if ($trxnFull->business_name): ?>
                                                <br>
                                                <?= $trxnFull->business_name ?>
                                            <?php endif; ?>
                                            <?php if ($trxnFull->address): ?>
                                                <br>
                                                <?= $trxnFull->address ?>                                                
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <?php if ($trxnFull->invoice->memo) : ?>
                            <tr>
                                <td colspan="4" class="memo"><?= $trxnFull->invoice->memo ?></td>
                            </tr>
                        <?php endif; ?>
                        <tr class="heading">
                            <td>
                                Description
                            </td>
                            <td>
                                Qty
                            </td>
                            <td>
                                Unit price
                            </td>
                            <td>
                                Amount
                            </td>
                        </tr>
                        <tr class="head"><td colspan="4"></td></tr>

                        <?php
                        $sum = 0;
                        $i   = 0;
                        foreach ($trxnFull->invoice->products as $product) : $sum = $sum + ($product->quantity * $product->product_inv_price);
                            ?>
                            <tr class="item">
                                <td><?= $product->product_inv_name ?></td>
                                <td><?= $product->quantity ?></td>
                                <td>$<?= number_format($product->product_inv_price, 2, '.', ',') ?></td>
                                <td>$<?= number_format(($product->quantity * $product->product_inv_price), 2, '.', ',') ?></td>
                            </tr>
                            <?php
                            $i   += 1;
                        endforeach;
                        ?>
                        <?php if($trxnFull->invoice->cover_fee): ?>
                        <tr class="total">
                            <td></td>
                            <td style="border-top: 1px solid #eee;"></td>
                            <td style="border-top: 1px solid #eee;">Subtotal</td>
                            <td style="border-top: 1px solid #eee;">
                                $<?= number_format($trxnFull->sub_total_amount, 2, '.', ',') ?>
                            </td>
                        </tr>
                        <tr class="total">
                            <td></td>
                            <td></td>
                            <td>Processing Fee</td>
                            <td>
                                $<?= number_format($trxnFull->fee, 2, '.', ',') ?>
                            </td>
                        </tr>
                        <?php endif; ?>
                            
                        <tr class="total">
                            <td></td>
                            <td style="border-top: 1px solid #eee;"></td>
                            <td style="border-top: 1px solid #eee;"><strong>Amount paid</strong></td>
                            <td style="border-top: 1px solid #eee;">
                                $<?= number_format($trxnFull->total_amount, 2, '.', ',') ?>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4">&nbsp;</td>
                        </tr>
                        <tr>
                            <td colspan="4">
                            <small><b>Payment method:</b> <?= $trxnFull->method . ($trxnFull->tsrc_account_type ? (" / " . ucfirst($trxnFull->tsrc_account_type)) : "") ?></small>
                            </td>                            
                        </tr>
                        <tr>
                            <td colspan="4">&nbsp;</td>
                        </tr>
                        <tr>
                            <td colspan="4">&nbsp;</td>
                        </tr>

                    </table>
                </div>
            <?php elseif ($trxnFull->payment_link_id): ?>
                <div class="container-box">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                            <td colspan="4"><h3>PAYMENT RECEIPT</h3><td>
                        </tr>

                        <tr class="top">                
                            <td colspan="4">
                                <table>
                                    <tr>
                                        <td class="title">
                                            <img width="135" src="<?= $trxnFull->branding->logo_base64 ?>" alt="" />
                                        </td>                            
                                        <td>
                                            <style>
                                                .lc1 { width:48%; float:left; text-align: right } 
                                                .lc2 { width:50%; float:right; text-align: right }
                                            </style>
                                            <div class="lc1">Receipt Reference:</div>
                                            <div class="lc2"><strong>000<?= $trxnFull->id ?></strong></div>
                                            <div style="clear:both"></div>                                            
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="information">
                            <td colspan="4">
                                <table>
                                    <tr>
                                    <td style="padding-right:5%; width:50%; text-align:left">
                                            <strong>From</strong><br>
                                            <?= $trxnFull->paymentLink->organization->name ?><br>                                            
                                            <?= $trxnFull->organization->onboard->merchant_address_line_1 ?>
                                            <?= $trxnFull->organization->onboard->merchant_city ?>, 
                                            <?= $trxnFull->organization->onboard->_merchant_state ?>
                                            <?= $trxnFull->organization->onboard->merchant_postal_code ?>
                                        </td>                                        
                                        <td style="padding-left:5%; width:50%; text-align:right">
                                            <strong>Billed To</strong><br>
                                            <?= $trxnFull->first_name ?> <?= $trxnFull->last_name ?> -
                                            <?= $trxnFull->email ?>
                                            <?php if ($trxnFull->business_name): ?>
                                                <br>
                                                <?= $trxnFull->business_name ?>
                                            <?php endif; ?>
                                            <?php if ($trxnFull->address): ?>                                                
                                                <br>
                                                <?= $trxnFull->address ?>                                                
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr class="heading">
                            <td>
                                Description
                            </td>
                            <td>
                                Qty
                            </td>
                            <td>
                                Unit price
                            </td>
                            <td>
                                Amount
                            </td>
                        </tr>
                        <tr class="head"><td colspan="4"></td></tr>

                        <?php                         
                        $_products      = $trxnFull->paymentLink->products_paid['data'];
                        $_bigTotal      = $trxnFull->paymentLink->products_paid['_big_total'];
                        $_totalProducts = count($_products);
                        ?>                        

                        <?php foreach ($_products as $i => $product) : ?>
                            <tr class="item <?= $i === $_totalProducts - 1 ? 'last' : '' ?>">
                                <td><?= $product->product_name ?></td>
                                <td><?= $product->qty_req ?></td>
                               
                                <td>$<?= number_format($product->product_price, 2, '.', ',') ?></td>
                                <td>$<?= number_format(($product->qty_req * $product->product_price), 2, '.', ',') ?></td>
                            </tr>
                        <?php endforeach; ?>

                        <?php if($trxnFull->is_fee_covered): ?>
                            <tr class="total">
                                <td></td>
                                <td style="border-top: 1px solid #eee;"></td>
                                <td style="border-top: 1px solid #eee;">Processing Fee</td>
                                <td style="border-top: 1px solid #eee;">
                                    $<?= number_format($trxnFull->fee, 2, '.', ',') ?>
                                </td>
                            </tr>
                        <?php endif; ?>

                        <tr class="total">
                            <td></td>
                            <td style="border-top: 1px solid #eee;"></td>
                            <td style="border-top: 1px solid #eee;"><strong>Amount paid</strong></td>
                            <td style="border-top: 1px solid #eee;">
                                $<?= number_format($trxnFull->total_amount, 2, '.', ',') ?>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="4">&nbsp;</td>
                        </tr>
                        <tr>
                            <td colspan="4">&nbsp;</td>
                        </tr>

                    </table>
                </div>
            <?php endif; ?>
        </div>
    </body>
</html>