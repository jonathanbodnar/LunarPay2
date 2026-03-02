<?php $this->load->view('ui_loader') ?>
<style>
    .gray_label {
        color: #7a7a7a;
    }

    .black_label {
        color: black;
    }
</style>

<style>
  .responsive {
    padding-left: 40px;
    padding-right: 40px;
  }

  @media (max-width: 768px) { /* Adjust for mobile */
    .responsive {
      padding-left: 15px;
      padding-right: 15px;
      margin-left: 20px;
      margin-right: 20px;
    }
  }
</style>
<style id="css_branding"></style>
<div>
    <div class="row" id="form_details">
        <div class="col-lg-4"></div>
        <div class="col-lg-4 mt-4">
            <div class="App-Payment rounded Tabs is-icontabs is-desktop responsive">
                <div class="Tabs-Container">
                    <div class="row">
                        <div class="col-9 pt-3">
                            <img style="max-height: 50px; display: block; margin-left: 0px; margin-bottom: 8px;" id="invoice_logo" src="" />
                            <span id="invoice_total" class="total black_label"></span><br>
                            <span id="invoice_due_date" class="due_date"></span><br><br>
                        </div>
                        <div class="col-3 pt-1 d-flex justify-content-end" style="margin-top: 15px;">
                            <i class="fas fa-file-invoice" style="font-size: 55px; "></i>
                            <!-- <i class="fas fa-file-invoice theme_foreground_color" style="font-size: 55px; "></i> -->
                            
                            <!-- <svg class="fas fa-file-invoice theme_foreground_color"  width="60px" height="60px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                <path d="M19,12h3v8a2,2,0,0,1-2,2H19ZM17,4V22H4a2,2,0,0,1-2-2V4A2,2,0,0,1,4,2H15A2,2,0,0,1,17,4ZM10,16H5v2h5Zm4-5H5v2h9Zm0-5H5V8h9Z"></path>
                                </g>
                            </svg> -->                            
                        </div>
                    </div>
                    <div class="row pb-1 mb-2">
                        <table style="width:100%;margin-left:15px;">
                            <tr id="business_name_cont">
                                <td width="45%"><span class="toFrom gray_label">Business name</span></td>
                                <td><span id="business_name" class="business_name"></span></td>
                            </tr>
                            <tr>
                                <td width="45%"><span class="toFrom gray_label">Customer name</span></td>
                                <td><span id="customer_name" class="customer_name"></span></td>
                            </tr>
                            <tr>
                                <td width="45%"><span class="toFrom gray_label">From</span></td>
                                <td><span id="orgSub_name" class="customer_name"> - </span></td>
                            </tr>
                            <tr>
                                <td width="45%"><span class="toFrom gray_label">Memo</span></td>
                                <td><span id="orgSub_name" class="customer_memo due_date font-weight-normal"> - </span></td>
                            </tr>
                            <tr>
                                <td colspan="2" class="pt-3">
                                    <span class="toFrom">
                                        <u>
                                            <a href="javascript:void(0)" class="button" id="Invoice-downloadButton"> Download PDF <i class="fas fa-arrow-down"></i></a>
                                        </u>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="row  border-top ml-0" style="height:10px">&nbsp;</div>
                    <div class="row ">
                        <div class="col pb-2">
                            <button data-toggle="collapse" data-target="#collapsibleDetails" style="cursor:pointer" class="Button ViewInvoiceDetailsLink Button--link" type="button">
                                <div class="flex-container justify-content-center align-items-center">
                                    <svg class="InlineSVG Icon Button-Icon Button-Icon--right Icon--sm Icon--square" focusable="false" fill-opacity="1" fill="currentColor" width="12" height="12" viewBox="0 0 5 8">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.146582 1.20432C-0.0488607 1.00888 -0.0488607 0.692001 0.146582 0.496558C0.342025 0.301115 0.6589 0.301115 0.854343 0.496558L4.00421 3.64642C4.19947 3.84168 4.19947 4.15827 4.00421 4.35353L0.854343 7.50339C0.6589 7.69884 0.342025 7.69884 0.146582 7.50339C-0.0488607 7.30795 -0.0488607 6.99108 0.146582 6.79563L2.94224 3.99998L0.146582 1.20432Z"></path>
                                    </svg>
                                    <span style="font-weight: 600" class="due_date italic">Show Invoice Details</span>
                                </div>
                            </button>
                            <div id="collapsibleDetails" class="collapse">
                                <div class="spacing-4 direction-column mt-1">
                                    <span class="due_date"></span> <span class="Text toFrom due_date" id="invoice_"></span>
                                </div>
                                <table cellpadding="5" cellspacing="5" style="width: 100%;padding:5px" id="product_details">
                                    <tbody>
                                        <tr>
                                            <td height="20" colspan="2"></td>
                                        </tr>
                                        <tr id="detail">
                                            <td class="col-spacer" colspan="2"></td>
                                        </tr>
                                        <tr>
                                            <td height="20" colspan="2"></td>
                                        </tr>

                                        <tr>
                                            <td colspan="2" class="line2"></td>
                                        </tr>
                                        <tr>
                                            <td height="10" colspan="2"></td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <span class="customer_name">Amount due</span>
                                            </td>
                                            <td height="5">
                                                <span class="span-amount"><strong id="total_invoice"></strong></span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="row pb-4" id="manage_billing_section" >
                        <div class="col">
                            <div class="flex-container align-items-center gray_label"> 
                                <svg class="InlineSVG Icon Button-Icon Button-Icon--right Icon--sm Icon--square" focusable="false" fill-opacity="1" fill="currentColor" width="12" height="12" viewBox="0 0 5 8">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.146582 1.20432C-0.0488607 1.00888 -0.0488607 0.692001 0.146582 0.496558C0.342025 0.301115 0.6589 0.301115 0.854343 0.496558L4.00421 3.64642C4.19947 3.84168 4.19947 4.15827 4.00421 4.35353L0.854343 7.50339C0.6589 7.69884 0.342025 7.69884 0.146582 7.50339C-0.0488607 7.30795 -0.0488607 6.99108 0.146582 6.79563L2.94224 3.99998L0.146582 1.20432Z"></path>
                                </svg>                               
                                <a id="customer_hub_link" href="#" class="due_date italic" style="">                                     
                                    Manage billing
                                </a>
                            </div>                            
                        </div>
                    </div>
                    <div class="row ">
                        <div class="col">
                            <div id="fts-after-payment-loader" class="toFrom gray_label pt-2 pb-4" style="display:none">
                                Processing <i class="fas fa-circle-notch fa-spin"></i>
                            </div>
                            <div id="fts-errors" class="toFrom gray_label" style="display:none; padding: 20px 0px; color:indianred">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    <div class="row">&nbsp;</div>
    <!--form pago -->
    <div class="row" id="form_payment">
        <div class="col-lg-4"></div>
        <div class="col-lg-4">
            <div class="App-Payment rounded pb-2 responsive">
                <form novalidate="" id="#payment-form" class="mt-3" style="width: 100%">
                    <div style="height: 70px;display:none" id="payment-form-title">
                        <div class="Divider">
                            <hr>
                            <h6 class="Divider-Text Text customer_name">
                                Payment form
                            </h6>
                        </div>
                    </div>
                    <div class="App-Global-Fields flex-container spacing-16 direction-row wrap-wrap">
                    </div>

                    <div class="payment-selector" style="
                    /* border-bottom: solid 2px #efefef;  */
                    padding-bottom: 0px;">
                        <div style="text-align: left; margin-bottom:-3px">
                            <?php echo langx('Payment method', 'source', ['class' => 'customer_name', 'style' => '
                                   font-family: Nunito;
                                    font-size: 1.25rem;
                                    font-weight: 700;
                                    color: #4c4a4a;
                                    transform: scaleX(0.97) scaleY(1.1);
                                    letter-spacing: -0.05rem;
                                    margin-left: -7px;
                                    margin-bottom: 19px;
                                ']) 
                            ?>
                        </div>
                        <table class="table_new_payment_option new_payment_option">
                        <tbody>
                            <tr>
                                <td>
                                    <div class="option-container" type="cc">
                                            <i class="fa fa-credit-card fa-2x"></i>
                                            <!-- <i class="fa fa-credit-card fa-2x theme_foreground_color"></i> -->
                                            <div style="clear: both"></div>
                                            <span style="font-size: 12px;">Regular</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="option-container" type="cc_amex">
                                            <!-- <img src="<?= BASE_ASSETS ?>images/cc-amex-brands-solid.svg" alt="Amex" style="width:36px; height: auto; filter: grayscale(100%);"> -->
                                            <img src="<?= BASE_ASSETS ?>images/amex.png" alt="Amex" style="width:50px; height: auto; filter: grayscale(100%);">
                                            <!-- <i class="fa-cc-amex fa-2x theme_foreground_color"></i> -->
                                             
                                            
                                            <div style="clear: both"></div>
                                            <span style="font-size: 12px;">American Express</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="option-container" type="ach">
                                            <!-- <i class="fas fa-university fa-2x theme_foreground_color"></i> -->
                                            <i class="fas fa-university fa-2x"></i>
                                            <div style="clear: both"></div>
                                            <span style="font-size: 12px;">Bank Transfer</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="fts-wrapper" style="height : 270px; margin-top:20px; text-align:center">
                        <div id="fts-payment-options" style="display:none"></div>
                    </div>
                    <div class="Tabs is-icontabs is-desktop">
                        <div class="Tabs-Container">
                            <div id="payment-options"></div>
                        </div>
                        <div class="Tabs-TabPanelContainer">
                            <div style="width: 100%; transform: none;">
                                <div id="card-tab-panel" role="tabpanel" aria-labelledby="card-tab" style="display: none;"> <!--card panel--></div>
                                <div id="ach-tab-panel" role="tabpanel" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="PaymentForm-confirmPaymentContainer flex-item width-grow mt-3">
                        <div class="flex-item width-12"></div>
                        <div class="flex-item width-12">
                            <button class="SubmitButton btn btn-sm btn-default mb-0 theme_color text_theme_color" style="border: none !important;" id="pay-button" type="submit">
                                <div class="SubmitButton-Shimmer" style="background-image: linear-gradient(to right, rgba(0, 116, 212, 0) 0%, rgb(58, 139, 238) 50%, rgba(0, 116, 212, 0) 100%);"></div>
                                <div class="SubmitButton-TextContainer">
                                    <span class="SubmitButton-Text SubmitButton-Text--current Text Text-color--default Text-fontWeight--500 Text--truncate" aria-hidden="false">Loading ...</span>
                                    <span class="SubmitButton-Text SubmitButton-Text--pre Text Text-color--default Text-fontWeight--500 Text--truncate" aria-hidden="true">Processing...</span>
                                </div>
                                <div class="SubmitButton-IconContainer">
                                    <div class="SubmitButton-Icon SubmitButton-Icon--pre">
                                        <div class="Icon Icon--md Icon--square">
                                            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false">
                                                <path d="M3 7V5a5 5 0 1 1 10 0v2h.5a1 1 0 0 1 1 1v6a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1zm5 2.5a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1zM11 7V5a3 3 0 1 0-6 0v2z" fill="#ffffff" fill-rule="evenodd"></path>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="SubmitButton-Icon SubmitButton-SpinnerIcon SubmitButton-Icon--pre">
                                        <div class="Icon Icon--md Icon--square">
                                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" focusable="false">
                                                <ellipse cx="12" cy="12" rx="10" ry="10" style="stroke: rgb(255, 255, 255);"></ellipse>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="SubmitButton-CheckmarkIcon">
                                    <div class="Icon Icon--md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="14" focusable="false">
                                            <path d="M 0.5 6 L 8 13.5 L 21.5 0" fill="transparent" stroke-width="2" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </div>
                                </div>
                            </button>
                            <div class="ConfirmPayment-PostSubmit" style="min-height: 60px">
                                <div class="row" style="display:none;">
                                    <div class="col-xs-12">
                                        <p class="payment-errors Text-fontSize--14"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>