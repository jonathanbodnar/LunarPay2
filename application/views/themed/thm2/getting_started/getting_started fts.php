<style>
    .card-stats .card-body {
        min-height: 120px;
    }

    .item_disabled {
        opacity: 0.4;
    }

    .accordion .card {
        margin-bottom: 5px;
    }

    .old-step-icon {
        color: green;
        margin-right: 5px;
        font-size: 0.8rem;
    }

    .last-step-icon {
        color: hsl(244deg 100% 67%);
        margin-right: 5px;
        font-size: 0.8rem;
    }

    .dropzone-single.dz-max-files-reached .dz-message {
        background-color: hsla(0, 0%, 0%, 0.32);
    }

    .getting-started-disable-features {
        display: none !important
    }
</style>

<style>
    .hide {
        display: none
    }
</style>

<?php $this->load->view("csshelpers/paysafe_instructions_installation") ?>

<!-- Header -->
<div class="header pb-6 d-flex align-items-center" style="min-height: 50px; background-size: cover; background-position: center top;">
    <!-- Mask -->
    <span class="mask bg-gradient-default opacity-8" style="background-color: inherit!important; background: inherit!important"></span>
    <!-- Header container -->
    <div class="container-fluid align-items-center">
        <div class="row">
            <div class="col-lg-7 col-md-10">

            </div>
        </div>
    </div>
</div>
<!-- Page content -->
<div class="container-fluid mt--6">
    <div class="row">
        <div class="col-xl-12 order-xl-1">
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-md-6">
                                    <h3 class="mb-0"><i class="fas fa-building"></i> Getting Started</h3>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="accordion" id="starter_accordion">
                                <?php echo form_open("", ['role' => 'form', 'id' => 'starter_form', 'autocomplete' => 'nonex']); ?>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingOne" data-toggle="" data-target="#starter_step1" aria-expanded="false" aria-controls="starter_step1">
                                        <h5 class="mb-0">Step 1 - General Information</h5>
                                    </div>
                                    <div id="starter_step1" class="collapse" aria-labelledby="headingOne" data-parent="#starter_accordion">
                                        <div class="card-body pb-0">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-1" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Primary principal') ?></h4>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('first_name:', 'first_name'); ?> <br />
                                                        <input maxlength="20" class="form-control" id="first_name" name="step1[first_name]" placeholder="<?= langx('First name') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('last_name:', 'last_name'); ?> <br />
                                                        <input maxlength="20" class="form-control" id="last_name" name="step1[last_name]" placeholder="<?= langx('Last name') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('email:', 'merchant_email_address'); ?> <br />
                                                        <input class="form-control" id="merchant_email_address" name="step1[email]" placeholder="<?= langx('Merchant email address') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('phone:', 'phone'); ?> <br />
                                                        <input class="form-control" id="phone" name="step1[phone]" placeholder="<?= langx('Phone') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-12">
                                                    <h4><?= langx('Merchant Information') ?></h4>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('company_name:', 'dba_name'); ?> <br />
                                                        <input class="form-control" id="dba_name" name="step1[dba_name]" placeholder="<?= htmlentities(langx('"Doing Business As" name')) ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('legal_name:', 'legal_name'); ?><br />
                                                        <input class="form-control" id="legal_name" name="step1[legal_name]" placeholder="<?= (langx('Merchant legal name')) ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <?php echo langx('address line:', 'address_line_1'); ?> <br />
                                                        <input maxlength="100" class="form-control" id="address_line_1" name="step1[address_line_1]" placeholder="<?= langx('Merchant\'s address line 1') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('city:', 'merchant_city'); ?> <br />
                                                        <input maxlength="50" class="form-control" id="merchant_city" name="step1[merchant_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <?php echo langx('State', 'merchant_state'); ?>
                                                    <select class="form-control" id="merchant_state" name="step1[merchant_state]">
                                                    </select>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('zip:', 'merchant_postal_code'); ?> <br />
                                                        <input maxlength="10" class="form-control" id="merchant_postal_code" name="step1[merchant_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('website:', 'website'); ?> <br />
                                                        <input class="form-control" name="step1[website]" placeholder="<?= langx('Website') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-12" style="display: none /*disabled for now*/">
                                                    <div class="form-group">
                                                        <label class="form-control-label" for="is_text_give"><?= langx('Text To Give') ?></label>

                                                        <label class="custom-toggle" style="position: relative;
                                                               top: 6px;
                                                               left: 5px;">
                                                            <input type="checkbox" id="is_text_give" name="is_text_give" value="1">
                                                            <span class="custom-toggle-slider rounded-circle"></span>
                                                        </label>

                                                        &nbsp;&nbsp;&nbsp;&nbsp;

                                                        <style>
                                                            .tooltip-inner {
                                                                max-width: 315px;
                                                                width: 315px
                                                            }
                                                        </style>
                                                        <label style="text-align:center" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right" title='<?php $this->load->view('helpers/text_to_give_instructions') ?>'>
                                                            <strong>?</strong>
                                                        </label>

                                                        <div class="text_to_give_container hide mt-1">
                                                            <div class="row">
                                                                <div class="col-md-3">
                                                                    <?php echo langx('Text to Give - Country', 'country_text_give'); ?>
                                                                    <select class="form-control" id="country_text_give" name="step1[country_text_give]">
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-3 state_text_give_container">
                                                                    <?php echo langx('Text to Give - State', 'state_text_give'); ?>
                                                                    <select class="form-control" id="state_text_give" name="step1[state_text_give]">
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action" data-step="1" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingThree" data-toggle="" data-target="#starter_step2" aria-expanded="false" aria-controls="starter_step2">
                                        <h5 class="mb-0">Step 2 - Bank Account</h5>
                                    </div>
                                    <div id="starter_step2" class="collapse" aria-labelledby="headingThree" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-2" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row bank_type ach_type">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Bank account') ?></h4>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('Bank account number:', 'ach_account_number'); ?> <br />
                                                        <input type="number" maxlength="20" class="form-control" id="account_number" name="step2[ach_account_number]" placeholder="<?= langx('Account number') ?>" value="" oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);">
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('Nine-digit Bank routing number:', 'routing_number'); ?> <br />
                                                        <input type="number" maxlength="9" class="form-control" id="routing_number" name="step2[ach_routing_number]" placeholder="<?= langx('Routing number') ?>" value="" oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);">
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('Name on bank account:', 'account_holder_name'); ?> <br />
                                                        <input maxlength="40" class="form-control" id="account_holder_name" name="step2[account_holder_name]" placeholder="<?= langx('Holder name') ?>" value="">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action" data-step="2" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div>
                                <?php echo form_close(); ?>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingThree" data-toggle="" data-target="#starter_step3" aria-expanded="false" aria-controls="starter_step3">
                                        <h5 class="mb-0">Step 3 - Onboard Merchant Information</h5>
                                    </div>
                                    <div id="starter_step3" class="collapse" aria-labelledby="headingThree" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-3" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 text-center">
                                                    <div style="display:none">
                                                        Please follow this link to complete your merchant information, then come back to continue
                                                        <br>
                                                        <br>
                                                        <a id="mpa_link" href="#" target="_blank">[MPA_LINK]</a>
                                                    </div>
                                                    <div>
                                                        <iframe id="mpa_iframe" src="" width="100%" height="800px" style="border: none;"></iframe>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer d-flex justify-content-end align-items-center">
                                            <!-- <div class="alert alert-secondary py-1 mb-0 d-inline-flex align-items-center" role="alert" style="margin-right: 1rem;">
                                                <span class="alert-icon mr-2"><i class="fa fa-info" style="font-size: 14px;"></i></span>
                                                <span class="alert-text">Make sure all stages in the form above are completed before continuing.</span>
                                            </div>
                                            <button type="button" class="btn btn-primary btn_action" data-step="3">Continue</button> -->
                                        </div>

                                    </div>
                                </div>
                                <?php echo form_close(); ?>
                                <!-- <div class="card">
                                    <div class="card-header item_disabled" id="headingFive" data-toggle="" data-target="#starter_step4" aria-expanded="false" aria-controls="starter_step4">
                                        <h5 class="mb-0">Step 4 - Brand Settings</h5>
                                    </div>
                                    <div id="starter_step4" class="collapse" aria-labelledby="headingFive" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <?php echo form_open_multipart("", ['role' => 'form', 'id' => 'customize_widget_form']); ?>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-4" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="row setting_section" style="margin-top: 20px">
                                                        <div class="col-md-1"></div>
                                                        <div class="col-md-5">
                                                            <div id="logo_dropzone" class="dropzone dropzone-single" data-toggle="dropzone" data-dropzone-url="http://" id="logo">
                                                                <div class="fallback">
                                                                    <div class="custom-file">
                                                                        <input type="file" name="logo" class="custom-file-input" id="dropzoneBasicUpload" style="display: none;">
                                                                    </div>
                                                                </div>

                                                                <div class="dz-preview dz-preview-single">
                                                                    <div class="dz-preview-cover">
                                                                        <img class="dz-preview-img" alt="" data-dz-thumbnail style="max-width: 200px;margin: 0 auto; display: flex;">
                                                                    </div>
                                                                </div>

                                                                <div class="dz-message"><span>Drop or Click here to upload Logo</span></div>

                                                            </div>
                                                        </div>
                                                        <div class="col-md-5">
                                                            <div class="row">
                                                                <div class="col-md-12">
                                                                    <hr>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="theme_color">Theme color (Buttons color)</label>
                                                                        <input type="color" name="theme_color" id="theme_color" value="#000000" class="form-control" placeholder="">
                                                                        <div class="hint-under-input">Pick one</div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="button_text_color">Background color</label>
                                                                        <input type="color" name="button_text_color" id="button_text_color" value="#ffffff" class="form-control" placeholder="">
                                                                        <div class="hint-under-input">Pick one</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-12 getting-started-disable-features">
                                                            <hr>
                                                        </div>
                                                        <div class="col-md-12 getting-started-disable-features">
                                                            <div class="form-row">
                                                                <div class="col-md-6">
                                                                    <label class="form-control-label" for="organization_funds">Funds</label>
                                                                    <div class="form-row">
                                                                        <div class="col-md-10">
                                                                            <input id="organization_funds" name="funds" type="text" class="form-control" data-toggle="tags" />
                                                                        </div>
                                                                        <div class="col-md-2">
                                                                            <button type="button" class="btn btn-secondary"><i class="fas fa-plus"></i></button>
                                                                        </div>
                                                                    </div>
                                                                    <div class="hint-under-input">Type fund names followed by enter.</div>
                                                                    <div class="row">
                                                                        <div class="col-md-12">
                                                                            <br>
                                                                            <div>A Fund is money saved or collected with a specific purpose, donors can choose the fund (s) they want to give to.</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="funds_flow">Fund Dynamics</label>
                                                                        <select class="form-control col-md-4" name="funds_flow">
                                                                            <option selected value="standard">One Fund</option>
                                                                            <option value="conduit">Multifunds</option>
                                                                        </select>
                                                                    </div>
                                                                    <div class="row">
                                                                        <div class="col-md-12">
                                                                            <br>
                                                                            <div>By selecting "Multifunds" the donor will be able to give to several funds in one chat session</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-12 getting-started-disable-features">
                                                            <hr>
                                                        </div>
                                                        <div class="col-md-12 getting-started-disable-features">
                                                            <div class="form-row suggested_amounts">
                                                                <div class="col-12">
                                                                    <label class="form-control-label" for="suggested_amounts">Suggested Amounts</label>
                                                                </div>
                                                                <div class="col-md-5">
                                                                    <input name="suggested_amounts" type="text" class="form-control" data-toggle="tags" />
                                                                    <div class="hint-under-input">Type a number followed by enter.</div>
                                                                </div>
                                                                <div class="col-md-2">
                                                                    <button type="button" class="btn btn-secondary"><i class="fas fa-plus"></i></button>
                                                                </div>
                                                                <div class="col-md-5"></div>
                                                                <div class="col-md-12">
                                                                    <br>
                                                                    <div>Suggested amounts are buttons with a preset amount the user can click for setting a donation amount in a quick way.</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-12 getting-started-disable-features">
                                                            <hr>
                                                        </div>
                                                        <div class="col-md-6 getting-started-disable-features">
                                                            <div class="form-row">
                                                                <div class="col-md-9">
                                                                    <?php echo langx('button_message', 'button_message', ['class' => 'form-control-label']); ?> <br />
                                                                    <input type="text" class="form-control" name="trigger_message" placeholder="Button Message" maxlength="56">
                                                                </div>
                                                                <div class="col-md-2">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="debug_message"><?= langx('run_always') ?></label><br>
                                                                        <label class="custom-toggle" style="margin-top:10px; margin-left: 12px">
                                                                            <input type="checkbox" id="debug_message" name="debug_message" value="1">
                                                                            <span class="custom-toggle-slider rounded-circle"></span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-12">
                                                                    This welcome message shows to your users once to introduce the widget
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div class="col-md-6 getting-started-disable-features">
                                                            <div class="row">
                                                                <div class="col-md-4">
                                                                    <?php echo langx('button_position', 'widget_position', ['class' => 'form-control-label']); ?> <br />
                                                                    <select class="form-control" name="widget_position">
                                                                        <option value="bottom_right" selected>Bottom Right</option>
                                                                        <option value="bottom_left">Bottom Left</option>
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-8"></div>
                                                                <div class="col-md-12">
                                                                    <br>You can locate your chat window trigger button at the bottom right or bottom left of your website
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 text-right font-weight-bold">
                                                    <small>You can customize the brand later</small>
                                                </div>
                                            </div>
                                            <?php echo form_close(); ?>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_customize_text" data-step="4" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div> -->
                                <div class="card" style="display: none">
                                    <div class="card-header item_disabled" id="headingSeven" data-toggle="" data-target="#starter_step4" aria-expanded="false" aria-controls="starter_step4">
                                        <h5 class="mb-0">Step 4 - Account Status</h5>
                                    </div>
                                    <div id="starter_step4" class="collapse installation-guide" aria-labelledby="headingSeven" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-4" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-3"></div>
                                                <div class="col-md-6 text-center">
                                                    <p class="merchant_account_status_text_space">

                                                    </p>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <hr class="instruct-hr">
                                                </div>
                                            </div>
                                            <div class="row justify-content-center pt-3">
                                                <div class="alert col-md-4 text-center">
                                                    <h4><?= langx('STATUS') ?> </h4>
                                                    <span class="account_status"></span>
                                                </div>
                                            </div>
                                            <div class="row getting-started-disable-features">
                                                <div class="col-md-12">
                                                    <hr class="instruct-hr">
                                                    <h3>Installation Guide</h3>
                                                    <br>
                                                    <?php echo form_open("", ['role' => 'form', 'id' => 'starter_change_domain', 'autocomplete' => 'nonex']); ?>
                                                    <div class="form-group ">
                                                        <?php echo langx('please_provide_the_domain_where_the_widget_is_going_to_be_installed:', 'domain', ['class' => 'form-control-label']); ?> <br />
                                                        <div class="form-row">
                                                            <div class="col-md-5 d-flex align-items-center">
                                                                <input type="text" class="form-control" name="domain" placeholder="Domain Name">
                                                            </div>
                                                            <div class="col-md-2 text-center">
                                                                <button type="button" class="btn btn-primary btn-update-domain">Update </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <?php echo form_close(); ?>
                                                </div>
                                            </div>

                                            <hr class="instruct-hr getting-started-disable-features">

                                            <div class="row getting-started-disable-features">

                                                <div class="col-12">

                                                    <p class="instruct-text">
                                                        You can install ChatGive system by using the next 2 alternatives, whichever the method you choose
                                                        <label class="form-control-label">SSL Protection (HTTPS) is required </label>
                                                        <br>
                                                        Just copy and paste in your website the script you want to install
                                                    </p>
                                                    <br>
                                                    <div class="row">
                                                        <div class="col-md-12">
                                                            <label class="form-control-label">1. Chat Widget</label> <br>
                                                            <pre id="code_to_copy" class="p-3" style="border: 1px solid #dddddd">
                                                            </pre>
                                                            <a href="#" class="copy_code float-right position-relative" style="top: -10px">Copy</a>
                                                        </div>
                                                        <div class="col-md-3 install_status">
                                                            <div class="install_status_icon"></div>
                                                            <div class="install_status_text"></div>
                                                        </div>
                                                    </div>
                                                    <p class="instruct-text">
                                                        When installing the Chat Widget script a built-in button will be loaded in your website, however, you can always
                                                        place a second button wherever you want and trigger the chat window
                                                    </p>
                                                    <label class="form-control-label">1.2 Trigger Button</label> <br>
                                                    <pre id="trigger_button" class="p-3" style="border: 1px solid #dddddd">
                                                    </pre>
                                                    <a href="#" class="copy_code float-right position-relative" style="top: -10px">Copy</a>
                                                </div>
                                                <div class="col-md-12">
                                                    <hr class="instruct-hr">
                                                </div>
                                                <div class="col-12">
                                                    <label class="form-control-label">2. Embedded Chat Form</label> <br>
                                                    <p class="instruct-text">
                                                        The Embedded Chat Form allows you to put the entire chat system wherever you want inside a page of your website
                                                    </p>
                                                    <pre id="embedded_to_copy" class="p-3" style="border: 1px solid #dddddd">
                                                    </pre>
                                                    <a href="#" class="copy_code float-right position-relative" style="top: -10px">Copy</a>
                                                </div>
                                                <div class="col-md-12 just-dev">
                                                    <hr class="instruct-hr">
                                                </div>
                                                <div class="col-md-12 just-dev">
                                                    <label class="form-control-label">3. Quick Give Widget (Feature not released)</label>
                                                    <p class="instruct-text">
                                                        Explanation
                                                    </p>
                                                    <pre id="quickgive_to_copy" class="p-3" style="border: 1px solid #dddddd">
                                                    </pre>
                                                    <a href="#" class="copy_code float-right position-relative" style="top: -10px">Copy</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>