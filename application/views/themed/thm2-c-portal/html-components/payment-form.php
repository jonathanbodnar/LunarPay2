<div class="payment-form">
    <!--<hr data-content="Payment Form" class="hr-text">-->
    <div class="text-center mb-3">
        <!-- <label class="text-muted">Payment Details</label> -->
    </div>
    <div class="payment-selector">
        <div id="email_input" class="form-group w-100">
            <div class="d-flex justify-content-between align-items-center w-100">
                <?php echo langx('email', 'email', ['class' => 'text-muted']) ?>

                <label class="text-muted">
                    <a class="customer_hub_link" href="#">
                        Manage billing <i class="fas fa-chevron-right due_date ml-1 " style="font-weight: 500;"></i>
                    </a>
                </label>
            </div>
            <input id="email" name="email" type="email" class="payment_input form-control">
            <div class="float-right mr-1">
                <label class="text-muted">
                    <span id="btn_sign_in_modal" style="display: none;" type="button">
                        Sign-in
                    </span>
                </label>
            </div>
        </div>
        <div id="email_logged_container" class="card" style="display: none;">
            <div class="card-body p-3">
                <p class="text-sm mb-0 font-weight-bold" style="opacity: .4">Email</p>
                <h4 id="email_logged" class="font-weight-bolder mb-0"></h4>
                
                <a class="customer_hub_link text-sm mb-0 font-weight-bold" href="#" style="position: absolute; top: 15px; right: 15px;">
                    Manage billing <i class="fas fa-chevron-right due_date ml-1 " style="font-weight: 500;"></i>
                </a>
            </div>
        </div>
        <div class="cancel_new_payment_option_container mt-3 row" style="display: none;">
            <div class="col-9">
                <?php echo langx('use_a_different_payment_method', 'use_a_different_payment_method', ['class' => 'text-muted']) ?>
            </div>
            <div class="col-3 text-right">
                <a id="cancel_new_payment_option" class="text-sm mb-0 font-weight-bold" href="#">Cancel</a>
            </div>
        </div>

        <div id="fts-group" style="margin-top:10px;">
            <div class="">
                <?php echo langx('Payment method', 'source', ['class' => 'text-muted']) ?>

                <table class="table_new_payment_option new_payment_option">
                    <tbody>
                        <tr>
                            <td>
                                <div class="option-container" type="cc">
                                    <i class="fa fa-credit-card fa-2x"></i>
                                    <!-- <i class="fa fa-credit-card fa-2x theme_foreground_color"></i> -->
                                    <div style="clear: both"></div>
                                    <span style="font-size: 12px;">Credit / Debit</span>
                                </div>
                            </td>
                            <td>
                                <div class="option-container" type="cc_amex">
                                    <img src="<?= BASE_ASSETS ?>images/amex.png" alt="Amex" style="width: 51px; height: auto; filter: grayscale(100%);">
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

            <div id="save_card_container-fts">
                <div class="save_card_container card mt-4" style="background-color: inherit; border-radius:6px; margin-bottom: 0px;">
                    <div class="card-body">
                        <?php echo form_open('', ['id' => 'fts_form']) ?>
                        <div class="form-check" style="padding-left: 2rem">
                            <input id="save_data_cc_fts" name="save_source" class="form-check-input save_data" type="checkbox" value="1">
                            <label class="form-check-label text-muted" style="cursor: pointer;" for="save_data_cc_fts">
                                Save my data for a secure purchase process in one click
                            </label>
                            <!-- <div class="text-sm mt-2" style="color: #adadad;">Pay faster</div> -->
                        </div>
                        <?php echo form_close() ?>
                    </div>
                </div>
            </div>
            <div id="fts-wrapper" class="text-center" style="height: 350px; margin-top:30px">
                <div id="fts-payment-options" style="display:none"></div>
            </div>
            <div class="mt-3" style="height:50px">
                <button id="pay-button-fts" type="button" class="theme_color text_theme_color btn btn-primary col-12 pay_button">Pay</button>
                <div class="alert-validation"></div>
            </div>
        </div>

        <div class="payment_selected_container mt-3" style="display: none;">
            <div class="card">
                <div class="card-body p-3">
                    <p class="text-sm mb-0 font-weight-bold" style="opacity: .4">Payment Source Selected</p>
                    <div class="row">
                        <div id="payment_selected" class="col-md-9 text-muted"></div>
                        <div class="col-md-3 text-sm mb-0 font-weight-bold"><a id="change_payment_option" href="#">Change</a></div>
                    </div>
                </div>
            </div>
            <div class="mt-2 text-center" id="payment_text_custom" style="color: #ff0000;">
            </div>
            <button id="pay_wallet" type="button" class="theme_color text_theme_color mt-3 btn btn-primary col-12 pay_button">Pay</button>
            <div class="alert-validation"></div>
        </div>
        <div class="payment_options mt-4" style="display: none; cursor:pointer">
            <div class="row">
                <div class="col-9">
                    <?php echo langx('select_a_payment_option', 'select_a_payment_option', ['class' => 'text-muted']) ?>
                </div>
                <div class="col-3 text-right">
                    <a id="cancel_change_payment_option" class="text-sm mb-0 font-weight-bold" href="#">Cancel</a>
                </div>
            </div>
            <ul class="list-group mt-2">
            </ul>
        </div>

        <div id="psf-wrapper" style="display: none;">
            <!-- <table class="table_new_payment_option new_payment_option">
                <tbody>
                    <tr>
                        <td>
                            <div class="option-container" type="cc">
                                <i class="fa fa-credit-card fa-2x theme_foreground_color"></i>
                                <div style="clear: both"></div>
                                <span style="font-size: 12px;">Card</span>
                            </div>
                        </td>
                        <td>
                            <div class="option-container" type="bank">
                                <i class="fas fa-university fa-2x theme_foreground_color"></i>
                                <div style="clear: both"></div>
                                <span style="font-size: 12px;">Bank Transfer</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table> -->
            <div id="card_information" data-option-container="cc" class="mt-3 new_payment_option form-group">
                <?php echo form_open('', ['id' => 'cc_form']) ?>
                <?php echo langx('card_information', 'card_information', ['class' => 'text-muted']) ?>
                <div class="form-row">
                    <div id="cardNumber" class="col-12 form-control bg-transparent"></div>
                    <div id="cardExpiry" class="col-6 form-control bg-transparent"></div>
                    <div id="cardCvc" class="col-6 form-control bg-transparent"></div>
                    <input id="cardZip" name="cc_zip" type="text" class="payment_input form-control" placeholder="Zip Code">
                    <div id="holder_name_input" class="w-100 mt-2">
                        <?php echo langx('holder_name', 'holder_name', ['class' => 'mt-2 text-muted pl-1']) ?>
                        <input id="holder_name" name="holder_name" type="text" class="payment_input form-control">
                    </div>
                    <div class="save_card_container card mt-4" style="background-color: inherit">
                        <div class="card-body">
                            <div class="form-check" style="padding-left: 2rem">
                                <input id="save_data_cc" class="form-check-input save_data" type="checkbox" value="">
                                <label class="form-check-label text-muted" style="cursor: pointer;" for="save_data_cc">
                                    Save my data for a secure purchase process in one click
                                </label>
                                <div class="text-sm mt-2" style="color: #adadad;">Pay faster</div>
                            </div>
                        </div>
                    </div>
                    <button id="pay_cc" type="button" class="theme_color text_theme_color mt-3 btn btn-primary col-12 pay_button">Pay</button>
                    <div class="alert-validation"></div>
                </div>
                <?php echo form_close() ?>
            </div>
            <div id="bank_information" data-option-container="bank" class="mt-3 new_payment_option form-group">
                <?php echo form_open('', ['id' => 'ach_bank_form', 'class' => 'bank_form']) ?>
                <?php echo langx('ACH_bank_account', 'bank_account', ['class' => 'text-muted']) ?>
                <div class="form-row">
                    <input name="first_name" type="text" class="bank_first_name payment_input form-control" placeholder="First Name">
                    <input name="last_name" type="text" class="payment_input bank_medium_input form-control" placeholder="Last Name">
                    <select name="account_type" class="payment_input bank_medium_input form-control">
                        <option value="">Select an account type</option>
                        <option value="SAVINGS">Savings</option>
                        <option value="CHECKING">Checking</option>
                        <option value="LOAN">Loan</option>
                    </select>
                    <input id="ach_bank_account_number" name="account_number" type="text" class="payment_input bank_medium_input form-control" placeholder="Account Number" maxlength="17">
                    <input id="bank_routing" name="routing_number" type="text" class="payment_input bank_medium_input form-control" placeholder="Routing" maxlength="9">

                    <select id="ach_state" name="state" class="payment_input bank_medium_input form-control">
                        <option value="">- Select State -</option>
                    </select>

                    <input id="bank_city" name="city" type="text" class="payment_input bank_medium_input form-control" placeholder="City">
                    <input id="bank_street" name="street" type="text" class="payment_input bank_medium_input form-control" placeholder="Street">
                    <input name="postal_code" type="text" class="bank_zip payment_input form-control" placeholder="Zip Code">
                </div>
                <?php echo form_close() ?>
                <?php echo form_open('', ['id' => 'eft_bank_form', 'class' => 'bank_form']) ?>
                <?php echo langx('EFT_bank_account', 'bank_account', ['class' => 'text-muted']) ?>
                <div class="form-row">
                    <input name="first_name" type="text" class="bank_first_name payment_input form-control" placeholder="First Name">
                    <input name="last_name" type="text" class="payment_input bank_medium_input form-control" placeholder="Last Name">
                    <input name="account_number" type="text" class="payment_input bank_medium_input form-control" placeholder="Account Number" maxlength="12">
                    <input name="transit_number" type="text" class="payment_input bank_medium_input form-control" placeholder="Transit Number" maxlength="5">
                    <input name="institution_id" type="text" class="payment_input bank_medium_input form-control" placeholder="Institution ID" maxlength="3">
                    <input name="city" type="text" class="payment_input bank_medium_input form-control" placeholder="City">
                    <input name="street" type="text" class="payment_input bank_medium_input form-control" placeholder="Street">
                    <input name="postal_code" type="text" class="bank_zip payment_input form-control" placeholder="Zip Code">
                </div>
                <?php echo form_close() ?>
                <div class="form-row">
                    <div class="save_card_container card mt-4" style="background-color: inherit">
                        <div class="card-body">
                            <div class="form-check" style="padding-left: 2rem">
                                <input id="save_data_bank" class="form-check-input save_data" type="checkbox" value="">
                                <label class="form-check-label text-muted" style="cursor: pointer;" for="save_data_bank">
                                    Save my data for a secure purchase process in one click
                                </label>
                                <div class="text-sm mt-2" style="color: #adadad;">Pay faster</div>
                            </div>
                        </div>
                    </div>
                    <button id="pay_bank" type="button" class="theme_color text_theme_color mt-3 btn btn-primary col-12 pay_button">Pay</button>
                    <div class="alert-validation"></div>
                </div>

            </div>
        </div>
        <div class="text-sm mt-2 text-center" id="subscription_message" style="color: #adadad; ">
            By clicking on <span class="subscription_or_pay">"Pay"</span>, you agree to allow <span class="company_name"></span> to charge your card for this payment and future payments according to the payment frequency listed.
        </div>
        <div class="text-center mt-3 text-sm" id="sign_out" style="display: none;"><a href="#">Sign out</a></div>
    </div>
</div>

<div id="subscriptions_container" style="display: none">
    <div class="mb-3">
        <a id="my_subscriptions_back" href="#">Back</a>
    </div>

    <label class="text-muted">Subscriptions</label>
    <div id="subscription_list">

    </div>
</div>


<div id="fts-after-payment-loader" class="text-center my-4 py-4" style="display:none">
    Processing <i class="fas fa-circle-notch fa-spin"></i>
</div>


<div id="payment_done" class="flex-column align-items-center" style="margin-top: 3em;  display: none;">
    <div class="mb-3 align-self-start">
        <a id="back_buy" href="#">Back</a>
    </div>
    <img src="<?= BASE_ASSETS ?>images/tick.png" style="width: 100px; grayscale(100%);" alt="">
    <h5 id="payment_text" class="text-muted mt-3">Thanks for your payment</h5>
    <div id="download_receipt"></div>
</div>