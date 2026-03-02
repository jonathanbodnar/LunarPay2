<style>
    .card-stats .card-body {
        min-height: 120px;
    }
    .item_disabled{
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
        display: none!important
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
                                        <h5 class="mb-0">Step 1 - General Info</h5>
                                    </div>
                                    <div id="starter_step1" class="collapse" aria-labelledby="headingOne" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-1" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('company_name:', 'dba_name'); ?> <br />
                                                        <input class="form-control" id="dba_name"  name="step1[dba_name]" placeholder="<?= htmlentities(langx('"Doing Business As" name')) ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('legal_name:', 'legal_name'); ?><br />
                                                        <input class="form-control" id="legal_name"  name="step1[legal_name]" placeholder="<?= (langx('Merchant legal name')) ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('region:', 'region'); ?> <br />
                                                        <select class="form-control" id="region" name="step1[region]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('business_category:', 'businessCategory'); ?> <br />
                                                        <select class="form-control" id="businessCategory" name="step1[business_category]">
                                                        </select>
                                                    </div>
                                                </div>

                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('phone_number:', 'phone_number1'); ?> <br />
                                                        <input maxlength="10" class="form-control" id="phone_number1"  name="step1[phone_number]" placeholder="<?= langx('Merchant\'s phone number') ?>" type="number" value=""
                                                               oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                               >
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('website:', 'website'); ?> <br />
                                                        <input class="form-control" name="step1[website]" placeholder="<?= langx('Website') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3 hide">
                                                    <div class="form-group">
                                                        <?php echo langx('email:', 'merchant_email_address'); ?> <br />
                                                        <input class="form-control" id="merchant_email_address"  name="step1[email]" placeholder="<?= langx('Merchant email address') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('yearly_volume_range:', 'yearlyVolumeRange'); ?> <br />
                                                        <select class="form-control" id="yearlyVolumeRange" name="step1[yearlyVolumeRange]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('average_transaction_amount:', 'averageTransactionAmount'); ?> <br />
                                                        <input maxlength="10" type="number" class="form-control" id="averageTransactionAmount" placeholder="$" name="step1[averageTransactionAmount]" value=""
                                                               oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                               >
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('processing_currency:', 'processingCurrency'); ?> <br />
                                                        <select class="form-control" id="processingCurrency" name="step1[processing_currency]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('business_type:', 'businessType'); ?> <br />
                                                        <select class="form-control" id="businessType" name="step1[businessType]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <label for="federalTaxNumber" id="taxNumberLabel" data-us="<?= langx('Federal Tax Number:') ?>" data-eu="<?= langx('Tax Identification Number:') ?>">
                                                            <?= langx('Federal Tax Number:') ?>
                                                        </label> <br />
                                                        <input maxlength="9" default-length="9" europe-length="30" class="form-control" id="federalTaxNumber" name="step1[federalTaxNumber]" placeholder="<?= langx('Federal Tax Number') ?>" type="number" value=""
                                                               oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                               >
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('Registration Number (Europe Only):', 'registrationNumber'); ?> <br />
                                                        <input maxlength="20" disabled="" class="form-control" id="registrationNumber" name="step1[registrationNumber]" placeholder="<?= langx('Registration Number') ?>" type="text" value=""
                                                               >
                                                    </div>
                                                </div>
                                                <div class="col-md-12">
                                                    <h4><?= langx('Merchant Address') ?></h4>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('country:', 'country'); ?> <br />
                                                        <select class="form-control" id="country" name="step1[country]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('state/province:', 'state_province1'); ?> <br />
                                                        <select class="form-control" id="state_province1" name="step1[state_province]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('city:', 'city1'); ?> <br />
                                                        <input maxlength="50" class="form-control" id="city1"  name="step1[city]" placeholder="<?= langx('Merchant\'s city') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('zip:', 'postal_code1'); ?> <br />
                                                        <input class="form-control" id="postal_code1"  name="step1[postal_code]" placeholder="<?= langx('Merchant\'s zip') ?>" type="text" value=""
                                                               >
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <?php echo langx('Merchant\'s address line 1', 'address_line_1'); ?> <br />
                                                        <input maxlength="100" class="form-control" id="address_line_1"  name="step1[address_line_1]" placeholder="<?= langx('Merchant\'s address line 1') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="form-group">
                                                        <?php echo langx('Merchant\'s address line 2', 'address_line_2'); ?> <br />
                                                        <input maxlength="100" class="form-control" id="address_line_2"  name="step1[address_line_2]" placeholder="<?= langx('Merchant\'s address line 2') ?>" type="text" value="">
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
                                                        
                                                        <style>.tooltip-inner{max-width: 315px; width: 315px }</style>
                                                        <label style="text-align:center" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right" 
                                                            title='<?php $this->load->view('helpers/text_to_give_instructions')?>'>
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
                                    <div class="card-header item_disabled" id="headingTwo" data-toggle="" data-target="#starter_step2" aria-expanded="false" aria-controls="starter_step2">
                                        <h5 class="mb-0">Step 2 - Legal Information</h5>
                                    </div>
                                    <div id="starter_step2" class="collapse" aria-labelledby="headingTwo" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Business Representatives') ?></h4>
                                                </div>
                                            </div>

                                            <div class="row owner_confimation_instructions">
                                                <div class="col-2"></div>
                                                <div class="col-8">
                                                    <div class="my-4 mx-4 py-2 px-1">
                                                        <div class="">
                                                            <div class="row text-justify">
                                                                <div class="col-md-12">
                                                                    <p class="instruct-text instruct-text-us">As per Card Scheme rules & regulations, US merchants applying for payment processing services are required to indicate 1 business representative (i.e., directors/trustees) as an <strong>Applicant</strong> and 1 as a <strong>Control prong</strong>.</p>
                                                                    <p class="instruct-text instruct-text-ca" style="display: none;">As per Card Scheme rules & regulations, CA merchants applying for payment processing services are required to indicate 1 business representative (i.e., directors/trustees) as an <strong>Applicant</strong>.</p>
                                                                </div>
                                                                <div class="col-md-12">
                                                                    <p class="instruct-text">An <strong>Applicant</strong> is a business representative, UBO/director/trustee, who is completing & submitting the application on behalf of a legal entity.</p>
                                                                </div>
                                                                <div class="col-md-12 instruct-text-us">
                                                                    <p class="instruct-text">A <strong>Control Prong</strong> is a single individual with significant responsibility to control, manage or direct a legal entity. An executive officer or senior manager such as CFO, CEO, President, Vice-President, and Treasurer meets this definition.</p>
                                                                </div>
                                                                <div class="col-md-12">
                                                                    <div class="row owner_confimation_form pt-3">
                                                                        <div class="col-md-2"></div>
                                                                        <div class="col-md-6 pt-2">
                                                                            <div class="form-group">
                                                                                <p class="instruct-text">Do you confirm you are the <strong>Applicant</strong>?</p>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-md-4">
                                                                            No &nbsp; &nbsp;<label class="custom-toggle" style="position: relative; top: 6px">
                                                                                <input class="owner_confirmation_switch" type="checkbox" name="step2[is_applicant]" value="1">
                                                                                <span class="custom-toggle-slider rounded-circle"></span>
                                                                            </label> &nbsp; Yes
                                                                        </div>
                                                                        <div class="col-md-2"></div>
                                                                        <div class="col-md-6 pt-2 control_prong">
                                                                            <div class="form-group">
                                                                                <p class="instruct-text">As Applicant do you meet the <strong>Control Prong</strong> role too?
                                                                                    (Choose no if there is a different individual inside the company meeting that role)
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div class="col-md-4 pt-4 control_prong">
                                                                            No &nbsp; &nbsp;<label class="custom-toggle" style="position: relative; top: 6px">
                                                                                <input class="owner_confirmation_switch" type="checkbox" name="step2[is_control_prong]" value="1">
                                                                                <span class="custom-toggle-slider rounded-circle"></span>
                                                                            </label> &nbsp; Yes
                                                                        </div>
                                                                        <div class="col-md-12 text-center pt-4">
                                                                            <button id="btn-owner-confirmation" style="width: 150px" type="button" class="btn btn-primary">Continue</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-2" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            

                                            <style>.hide {display:none}</style>

                                            <div class="hide business_owner_form">
                                                <h5 class="business_owner_1" >Owner 1</h5>
                                                <div class="row">
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('first_name:', 'first_name'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="first_name"  name="step2[first_name]" placeholder="<?= langx('First name') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('last_name:', 'last_name'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="last_name"  name="step2[last_name]" placeholder="<?= langx('Last name') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('job_title:', 'title'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="title" name="step2[title]" placeholder="<?= langx('Title') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('phone number:', 'phone_number2'); ?> <br />
                                                            <input maxlength="10" class="form-control" id="phone_number2"  name="step2[phone_number]" placeholder="<?= langx('phone_number') ?>" type="number" value=""
                                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                   >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('owner_is_european?:', 'business_owner_is_european'); ?> <br />
                                                            <select class="form-control" id="business_owner_is_european" name="step2[business_owner_is_european]">
                                                                <option value="">— Please Select —</option>
                                                                <option value="Yes">Yes</option>
                                                                <option value="No">No</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('nationality (if_european):', 'nationality'); ?> <br />
                                                            <select class="form-control" id="nationality" name="step2[nationality]" disabled>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('gender:', 'owner_gender'); ?> <br />
                                                            <select class="form-control" id="owner_gender" name="step2[owner_gender]" disabled>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('date of birth_(mm/dd/yyyy):', 'date_of_birth'); ?>
                                                            <input class="form-control" id="date_of_birth" name="step2[date_of_birth]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('SSN:', 'ssn'); ?> <br />
                                                            <input class="form-control" id="ssn" name="step2[ssn]" placeholder="<?= langx('SSN') ?>" type="password" value="">
                                                        </div>
                                                    </div>

                                                    <!-- ------------------>
                                                    <!-- --------  Previous optional for USA check documentation ---------- -->

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_country:', 'current_country'); ?> <br />
                                                            <select class="form-control" id="owner_current_country" name="step2[owner_current_country]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_state/province:', 'current_state_province1'); ?> <br />
                                                            <select class="form-control" id="current_state_province1" name="step2[owner_current_state_province]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_city:', 'current_city1'); ?> <br />
                                                            <input maxlength="50" class="form-control" id="current_city1"  name="step2[owner_current_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_zip:', 'current_postal_code1'); ?> <br />
                                                            <input class="form-control" id="current_postal_code1"  name="step2[owner_current_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                                                   >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-5">
                                                        <div class="form-group">
                                                            <?php echo langx('current_address line 1:', 'current_address_line_1'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="current_address_line_1"  name="step2[owner_current_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('current_address line 2:', 'current_address_line_2'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="current_address_line_2"  name="step2[owner_current_address_line_2]" placeholder="<?= langx('address_line_2') ?>" type="text" value="">
                                                        </div>
                                                    </div>

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('years_at_address:', 'years_at_address'); ?> <br />
                                                            <select class="form-control" id="years_at_address" name="step2[years_at_address]">
                                                                <option value="">— Please Select —</option>
                                                                <?php for ($i = 1; $i < 81; $i++): ?>
                                                                    <option value="<?= $i ?>"><?= $i ?></option>
                                                                <?php endfor; ?>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="row hide cont-prev-addr">
                                                    <div class="col-md-12">
                                                        <h4><?= langx('Previous Address') ?>  <span style="font-size:12px; font-style: italic; font-weight: normal">(Required if years at address is less than 3)</span></h4>
                                                    </div>

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_country:', 'previous_country'); ?> <br />
                                                            <select class="form-control" id="owner_previous_country" name="step2[owner_previous_country]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_state    /province:', 'previous_state_province1'); ?> <br />
                                                            <select class="form-control" id="previous_state_province1" name="step2[owner_previous_state_province]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_city:', 'previous_city1'); ?> <br />
                                                            <input maxlength="50" class="form-control" id="previous_city1"  name="step2[owner_previous_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_zip:', 'previous_postal_code1'); ?> <br />
                                                            <input class="form-control" id="previous_postal_code1"  name="step2[owner_previous_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                                                   >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_address line 1', 'previous_address_line_1'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="previous_address_line_1"  name="step2[owner_previous_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_address line 2', 'previous_address_line_2'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="previous_address_line_2"  name="step2[owner_previous_address_line_2]" placeholder="<?= langx('trading_address_line_2') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="row hide cont-eu-identity-card">
                                                <div class="col-md-12">
                                                    <h4><?= langx('European Identity Card') ?></h4>
                                                </div>

                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('number:', 'euidcard_number'); ?> <br />
                                                        <input maxlength="20" class="form-control" id="euidcard_number"  name="step2[euidcard_number]" placeholder="<?= langx('number') ?>" type="text" value="">
                                                    </div>
                                                </div>

                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('country_of_issue:', 'euidcard_country_issue'); ?> <br />
                                                        <select class="form-control" id="euidcard_country_issue" name="step2[euidcard_country_issue]">
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    Expiry Date (mm/dd/yyyy) <?php echo langx(':', 'eu_xpry_date'); ?> <br /> <!-- chrome autocomplete messages issues when adding  expiration labels -->
                                                    <div class="form-group">
                                                        <input class="form-control" id="eu_xpry_date" name="step2[eu_xpry_date]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('id_number_line_1:', 'id_number_line_1'); ?> <br />
                                                        <input maxlength="30" class="form-control" id="id_number_line_1"  name="step2[id_number_line_1]" placeholder="<?= langx('the first line of the MRZ.') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('id_number_line_2:', 'id_number_line_2'); ?> <br />
                                                        <input maxlength="30" class="form-control" id="id_number_line_2"  name="step2[id_number_line_2]" placeholder="<?= langx('the second line of the MRZ.') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <?php echo langx('id_number_line_3:', 'id_number_line_3'); ?> <br />
                                                        <input maxlength="30" class="form-control" id="id_number_line_3"  name="step2[id_number_line_3]" placeholder="<?= langx('the third line of the MRZ.') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                            </div>
                                            </div>

                                            <div class="hide business_owner_form_2">
                                                <h5 class="business_owner_2" >Owner 2</h5>
                                                <div class="row">
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('first_name:', 'first_name'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="first_name"  name="step2[owner2_first_name]" placeholder="<?= langx('First name') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('last_name:', 'last_name'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="last_name"  name="step2[owner2_last_name]" placeholder="<?= langx('Last name') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('job_title:', 'title'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="title" name="step2[owner2_title]" placeholder="<?= langx('Title') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('phone number:', 'phone_number2'); ?> <br />
                                                            <input maxlength="10" class="form-control" id="phone_number2"  name="step2[owner2_phone_number]" placeholder="<?= langx('phone_number') ?>" type="number" value=""
                                                                   oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('owner_is_european?:', 'business_owner_is_european_2'); ?> <br />
                                                            <select class="form-control" id="business_owner_is_european_2" name="step2[owner2_business_owner_is_european]">
                                                                <option value="">— Please Select —</option>
                                                                <option value="Yes">Yes</option>
                                                                <option value="No">No</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('nationality (if_european):', 'nationality_2'); ?> <br />
                                                            <select class="form-control" id="nationality_2" name="step2[owner2_nationality]" disabled>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('gender:', 'owner_gender_2'); ?> <br />
                                                            <select class="form-control" id="owner_gender_2" name="step2[owner2_gender]" disabled>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-2">
                                                        <div class="form-group">
                                                            <?php echo langx('date of birth_(mm/dd/yyyy):', 'date_of_birth_2'); ?>
                                                            <input class="form-control" id="date_of_birth_2" name="step2[owner2_date_of_birth]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('SSN:', 'ssn'); ?> <br />
                                                            <input class="form-control" id="ssn_2" name="step2[owner2_ssn]" placeholder="<?= langx('SSN') ?>" type="password" value="">
                                                        </div>
                                                    </div>

                                                    <!-- ------------------>
                                                    <!-- --------  Previous optional for USA check documentation ---------- -->

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_country:', 'current_country'); ?> <br />
                                                            <select class="form-control" id="owner_current_country_2" name="step2[owner2_current_country]">
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_state/province:', 'current_state_province1_2'); ?> <br />
                                                            <select class="form-control" id="current_state_province1_2" name="step2[owner2_current_state_province]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_city:', 'current_city1'); ?> <br />
                                                            <input maxlength="50" class="form-control" id="current_city1"  name="step2[owner2_current_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('current_zip:', 'current_postal_code1'); ?> <br />
                                                            <input class="form-control" id="current_postal_code1"  name="step2[owner2_current_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-5">
                                                        <div class="form-group">
                                                            <?php echo langx('current_address line 1:', 'current_address_line_1'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="current_address_line_1"  name="step2[owner2_current_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('current_address line 2:', 'current_address_line_2'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="current_address_line_2"  name="step2[owner2_current_address_line_2]" placeholder="<?= langx('address_line_2') ?>" type="text" value="">
                                                        </div>
                                                    </div>

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('years_at_address:', 'years_at_address_2'); ?> <br />
                                                            <select class="form-control" id="years_at_address_2" name="step2[owner2_years_at_address]">
                                                                <option value="">— Please Select —</option>
                                                                <?php for ($i = 1; $i < 81; $i++): ?>
                                                                    <option value="<?= $i ?>"><?= $i ?></option>
                                                                <?php endfor; ?>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="row hide cont-prev-addr_2">
                                                    <div class="col-md-12">
                                                        <h4><?= langx('Previous Address') ?>  <span style="font-size:12px; font-style: italic; font-weight: normal">(Required if years at address is less than 3)</span></h4>
                                                    </div>

                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_country:', 'owner_previous_country_2'); ?> <br />
                                                            <select class="form-control" id="owner_previous_country_2" name="step2[owner2_previous_country]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_state    /province:', 'previous_state_province1'); ?> <br />
                                                            <select class="form-control" id="previous_state_province1_2" name="step2[owner2_previous_state_province]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_city:', 'previous_city1'); ?> <br />
                                                            <input maxlength="50" class="form-control" id="previous_city1"  name="step2[owner2_previous_city]" placeholder="<?= langx('city') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_zip:', 'previous_postal_code1'); ?> <br />
                                                            <input class="form-control" id="previous_postal_code1"  name="step2[owner2_previous_postal_code]" placeholder="<?= langx('zip') ?>" type="text" value=""
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_address line 1', 'previous_address_line_1'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="previous_address_line_1"  name="step2[owner2_previous_address_line_1]" placeholder="<?= langx('address_line_1') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('previous_address line 2', 'previous_address_line_2'); ?> <br />
                                                            <input maxlength="100" class="form-control" id="previous_address_line_2"  name="step2[owner2_previous_address_line_2]" placeholder="<?= langx('trading_address_line_2') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="row hide cont-eu-identity-card_2">
                                                    <div class="col-md-12">
                                                        <h4><?= langx('European Identity Card') ?></h4>
                                                    </div>

                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('number:', 'euidcard_number'); ?> <br />
                                                            <input maxlength="20" class="form-control" id="euidcard_number"  name="step2[owner2_euidcard_number]" placeholder="<?= langx('number') ?>" type="text" value="">
                                                        </div>
                                                    </div>

                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('country_of_issue:', 'euidcard_country_issue_2'); ?> <br />
                                                            <select class="form-control" id="euidcard_country_issue_2" name="step2[owner2_euidcard_country_issue]">
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        Expiry Date (mm/dd/yyyy) <?php echo langx(':', 'eu_xpry_date_2'); ?> <br /> <!-- chrome autocomplete messages issues when adding  expiration labels -->
                                                        <div class="form-group">
                                                            <input class="form-control" id="eu_xpry_date_2" name="step2[owner2_eu_xpry_date]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('id_number_line_1:', 'id_number_line_1'); ?> <br />
                                                            <input maxlength="30" class="form-control" id="id_number_line_1"  name="step2[owner2_id_number_line_1]" placeholder="<?= langx('the first line of the MRZ.') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('id_number_line_2:', 'id_number_line_2'); ?> <br />
                                                            <input maxlength="30" class="form-control" id="id_number_line_2"  name="step2[owner2_id_number_line_2]" placeholder="<?= langx('the second line of the MRZ.') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <div class="form-group">
                                                            <?php echo langx('id_number_line_3:', 'id_number_line_3'); ?> <br />
                                                            <input maxlength="30" class="form-control" id="id_number_line_3"  name="step2[owner2_id_number_line_3]" placeholder="<?= langx('the third line of the MRZ.') ?>" type="text" value="">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action" data-step="2" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingThree" data-toggle="" data-target="#starter_step3" aria-expanded="false" aria-controls="starter_step3">
                                        <h5 class="mb-0">Step 3 - Bank Account <span class="just-dev">| Crypto wallet</span></h5>
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
                                                <div class="col-md-12">
                                                    <h4><?= langx('Where do you want us to send the money?') ?></h4>
                                                    <br>
                                                </div>
                                                <div class="col-md-3">
                                                    <div class="form-group">
                                                        <?php echo langx('available_bank_types:', 'bank_type'); ?> <br />
                                                        <select class="form-control" id="bank_type" name="step3[bank_type]">                                                            
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="row bank_type wire_type hide">
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Bank account number:', 'wire_account_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="wire_account_number" name="step3[wire_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Swift Number:', 'wire_swift_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="wire_swift_number" name="step3[wire_swift_number]" placeholder="<?= langx('Swift Number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Country:', 'wire_beneficiary_country'); ?> <br />
                                                                <select class="form-control" id="wire_beneficiary_country" name="step3[wire_beneficiary_country]">
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Account Name:', 'wire_beneficiary_name'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_name"  name="step3[wire_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Address:', 'wire_beneficiary_address'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_address"  name="step3[wire_beneficiary_address]" placeholder="<?= (langx('Beneficiary Address')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary City:', 'wire_beneficiary_city'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_city"  name="step3[wire_beneficiary_city]" placeholder="<?= (langx('Beneficiary City')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Region:', 'wire_beneficiary_region'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_region"  name="step3[wire_beneficiary_region]" placeholder="<?= (langx('Beneficiary Region')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Post Code:', 'wire_beneficiary_post_code'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_post_code"  name="step3[wire_beneficiary_post_code]" placeholder="<?= (langx('Beneficiary Post Code')) ?>" type="text" value="">
                                                            </div>
                                                        </div>

                                                        <div class="col-md-12">
                                                            <h4><?= langx('Beneficiary Bank Information') ?></h4>
                                                            <br>
                                                        </div>

                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank Country:', 'wire_beneficiary_bank_country'); ?> <br />
                                                                <select class="form-control" id="wire_beneficiary_bank_country" name="step3[wire_beneficiary_bank_country]">
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank Name:', 'wire_beneficiary_bank_name'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_bank_name"  name="step3[wire_beneficiary_bank_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank Address:', 'wire_beneficiary_bank_address'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_bank_address"  name="step3[wire_beneficiary_bank_address]" placeholder="<?= (langx('Beneficiary Address')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank City:', 'wire_beneficiary_bank_city'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_bank_city"  name="step3[wire_beneficiary_bank_city]" placeholder="<?= (langx('Beneficiary City')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank Region:', 'wire_beneficiary_bank_region'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_bank_region"  name="step3[wire_beneficiary_bank_region]" placeholder="<?= (langx('Beneficiary Region')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Bank Post Code:', 'wire_beneficiary_bank_post_code'); ?><br />
                                                                <input class="form-control" id="wire_beneficiary_bank_post_code"  name="step3[wire_beneficiary_bank_post_code]" placeholder="<?= (langx('Beneficiary Post Code')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row bank_type sepa_type hide">
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('bank_country:', 'sepa_country'); ?> <br />
                                                                <select class="form-control" id="sepa_country" name="step3[sepa_country]">
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Account Name:', 'sepa_beneficiary_name'); ?><br />
                                                                <input class="form-control" id="sepa_beneficiary_name"  name="step3[sepa_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Swift Number:', 'sepa_swift_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="sepa_swift_number" name="step3[sepa_swift_number]" placeholder="<?= langx('Swift Number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('IBAN Number:', 'sepa_iban_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="sepa_iban_number" name="step3[sepa_iban_number]" placeholder="<?= langx('IBAN Number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row bank_type bacs_type hide">
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('bank_country:', 'bacs_country'); ?> <br />
                                                                <select class="form-control" id="bacs_country" name="step3[bacs_country]">
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Beneficiary Account Name:', 'bacs_beneficiary_name'); ?><br />
                                                                <input class="form-control" id="bacs_beneficiary_name"  name="step3[bacs_beneficiary_name]" placeholder="<?= (langx('Beneficiary Account Name')) ?>" type="text" value="">
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Account number:', 'bacs_account_number'); ?> <br />
                                                                <input type="number" maxlength="8" class="form-control" id="bacs_account_number" name="step3[bacs_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-3">
                                                            <div class="form-group">
                                                                <?php echo langx('Sort Code:', 'bacs_sort_code'); ?> <br />
                                                                <input type="number" maxlength="6" class="form-control" id="bacs_sort_code" name="step3[bacs_sort_code]" placeholder="<?= langx('Sort Code') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row bank_type eft_type hide">
                                                        <div class="col-md-4">
                                                            <div class="form-group">
                                                                <?php echo langx('Bank account number:', 'eft_account_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="eft_account_number" name="step3[eft_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <div class="form-group">
                                                                <?php echo langx('Transit Number:', 'eft_transit_number'); ?> <br />
                                                                <input type="number" maxlength="5" class="form-control" id="eft_transit_number" name="step3[eft_transit_number]" placeholder="<?= langx('Transit number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <div class="form-group">
                                                                <?php echo langx('Institution ID:', 'eft_institution_id'); ?> <br />
                                                                <input maxlength="3" class="form-control" id="eft_institution_id" name="step3[eft_institution_id]" placeholder="<?= langx('Institution ID') ?>" value="">
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="row bank_type ach_type hide">
                                                        <div class="col-md-4">
                                                            <div class="form-group">
                                                                <?php echo langx('Bank account number:', 'ach_account_number'); ?> <br />
                                                                <input type="number" maxlength="20" class="form-control" id="account_number" name="step3[ach_account_number]" placeholder="<?= langx('Account number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <div class="form-group">
                                                                <?php echo langx('Nine-digit Bank routing number:', 'routing_number'); ?> <br />
                                                                <input type="number" maxlength="9" class="form-control" id="routing_number" name="step3[ach_routing_number]" placeholder="<?= langx('Routing number') ?>" value=""
                                                                       oninput="if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
                                                                       >
                                                            </div>
                                                        </div>
                                                        <div class="col-md-4 hide">
                                                            <div class="form-group">
                                                                <?php echo langx('Name on bank account:', 'account_holder_name'); ?> <br />
                                                                <input maxlength="40" class="form-control" id="account_holder_name" name="step3[account_holder_name]" placeholder="<?= langx('Holder name') ?>" value="">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row bank_account_information_sent hide">
                                                <div class="col-md-4">
                                                    <div class="form-group">
                                                        <br>
                                                        <h4>Bank account information was already sent</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row just-dev">
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <label class="form-control-label" for="create_crypto_wallet"><?= langx('Create crypto payment wallet') ?></label>
                                                        
                                                        <label class="custom-toggle" style="position: relative;
                                                               top: 6px;
                                                               left: 5px;">
                                                            <input type="checkbox" id="create_crypto_wallet" name="step3[create_crypto_wallet]" value="1">
                                                            <span class="custom-toggle-slider rounded-circle"></span>
                                                        </label>
                                                        
                                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                                        
                                                        <style>.tooltip-inner{max-width: 315px; width: 315px }</style>
                                                        <label style="text-align:center; position:relative; bottom: 3px" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right" 
                                                            title='<?php $this->load->view('helpers/crypto_wallet_instructions')?>'>
                                                            <strong>?</strong>
                                                        </label>                                                       
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action" data-step="3" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div>
                                <?php echo form_close(); ?>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingFour" data-toggle="" data-target="#starter_step4" aria-expanded="false" aria-controls="starter_step4">
                                        <h5 class="mb-0">Step 4 - Terms and Conditions</h5>
                                    </div>
                                    <div id="starter_step4" class="collapse" aria-labelledby="headingFour" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-4" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Terms & Conditions') ?></h4>
                                                    <br>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group terms_conditions_1_link">

                                                    </div>
                                                </div>
                                                <div class="col-md-12 hide">
                                                    <div class="form-group terms_conditions_2_link">

                                                    </div>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <br>
                                                        <span class="terms_conditions_ask_message hide">
                                                            By submitting this form, I hereby agree to and accept the payment processor (Paysafe) terms and conditions
                                                        </span>
                                                        <span class="terms_conditions_already_accepted hide">
                                                            <h4>Terms and conditions accepted</h4>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action btn-term-condition" data-step="4" style="margin: auto; margin-right: 0px; display: block;">Accept Terms & Conditions</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingFive" data-toggle="" data-target="#starter_step5" aria-expanded="false" aria-controls="starter_step5">
                                        <h5 class="mb-0">Step 5 - Brand Settings</h5>
                                    </div>
                                    <div id="starter_step5" class="collapse" aria-labelledby="headingFive" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <?php echo form_open_multipart("", ['role' => 'form', 'id' => 'customize_widget_form']); ?>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-5" style="display: none">
                                                    </div>
                                                </div>
                                            </div>                                            
                                            <div class="row">                                                
                                                <div class="col-md-12">
                                                    <div class="row setting_section" style="margin-top: 20px">
                                                        <div class="col-md-1"></div>
                                                        <div class="col-md-5">
                                                            <div id="logo_dropzone" class="dropzone dropzone-single" data-toggle="dropzone"
                                                                 data-dropzone-url="http://" id="logo">
                                                                <div class="fallback">
                                                                    <div class="custom-file">
                                                                        <input type="file" name="logo" class="custom-file-input"
                                                                               id="dropzoneBasicUpload" style="display: none;">
                                                                    </div>
                                                                </div>

                                                                <div class="dz-preview dz-preview-single">
                                                                    <div class="dz-preview-cover">
                                                                        <img class="dz-preview-img" src="" alt="" data-dz-thumbnail
                                                                             style="max-width: 200px;margin: 0 auto; display: flex;">
                                                                    </div>
                                                                </div>

                                                                <div class="dz-message"><span>Drop or Click here to upload Logo</span></div>

                                                            </div>
                                                        </div>
                                                        <div class="col-md-5">
                                                            <div class="row">
                                                                <div class="col-md-12"><hr></div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="theme_color">Theme color (Buttons color)</label>
                                                                        <input type="color" name="theme_color" id="theme_color"
                                                                               value="#000000" class="form-control" placeholder="">
                                                                        <div class="hint-under-input">Pick one</div>
                                                                    </div>
                                                                </div>
                                                                <div class="col-md-6">
                                                                    <div class="form-group">
                                                                        <label class="form-control-label" for="button_text_color">Background color</label>
                                                                        <input type="color" name="button_text_color" id="button_text_color"
                                                                               value="#ffffff" class="form-control" placeholder="">
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
                                                        <div class="col-md-12 getting-started-disable-features"><hr></div>
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
                                            <button type="button" class="btn btn-primary btn_customize_text" data-step="5" style="margin: auto; margin-right: 0px; display: block;">Continue</button>
                                        </div>
                                    </div>
                                </div>
                                <?php echo form_open("", ['role' => 'form', 'id' => 'starter_form_status', 'autocomplete' => 'nonex']); ?>
                                <div class="card">
                                    <div class="card-header item_disabled" id="headingSix" data-toggle="" data-target="#starter_step6" aria-expanded="false" aria-controls="starter_step6">
                                        <h5 class="mb-0">Step 6 - Bank Account Confirmation</h5>
                                    </div>
                                    <div id="starter_step6" class="collapse" aria-labelledby="headingSix" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-6" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Credit Card Processor System') ?></h4>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <p class="account_status_credit_card"></p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Direct Debit (Bank) Processor System') ?></h4>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <p class="account_status_direct_debit"></p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <hr class="mt-0">
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <h4><?= langx('Company Bank account') ?></h4>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <p class="microdeposit_validation_status"></p>
                                                        <p class="microdeposit_validation_status_message"></p>
                                                    </div>
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-group">
                                                        <div class="microdeposit_validation_container">
                                                            <p>
                                                                In order to validate the bank account information a deposit between 0.01 and 0.99
                                                                has been sent to your bank account, the deposit should be reflected in your account in 1–2 business days.
                                                                As soon as you have the deposit in sight please proceed to submit the exact amount here:
                                                            </p>
                                                        </div>
                                                        <div class="microdeposit_validation_container_success hide">
                                                            <p>
                                                                Your bank account information has been successfully validated.
                                                            </p>
                                                        </div>
                                                        <div class="microdeposit_validation_container_blocked hide">
                                                            <p>
                                                                Your bank account information could not be validated, please contact support.
                                                            </p>
                                                        </div>
                                                        <div class="eu_validation_container hide">
                                                            <p>
                                                                In order to validate the account information please send us to hello@chatgive.com the next information:
                                                            </p>
                                                            <ul class="uk_validation_options hide">
                                                                <li>Voided Check, or</li>
                                                                <li>Bank Statement, or</li>
                                                                <li>Paying-in Slip, or</li>
                                                                <li>Letter from Bank Confirming Account Name, Account Number, and Sort Code</li>
                                                            </ul>
                                                            <ul class="eu_validation_options hide">
                                                                <li>Bank Statement, or</li>
                                                                <li>Letter from Bank Confirming Account Name, IBAN, BIC, and Swift Code</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-4">
                                                    <div class="form-group microdeposit_validation_container">
                                                        <?php echo langx('Amount:', 'validation_amount'); ?> <br />
                                                        <input maxlength="4" class="form-control" id="validation_amount"  name="step6[validation_amount]" placeholder="<?= langx('0.00') ?>" type="text" value="">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button type="button" class="btn btn-primary btn_action btn-status-action" data-step="6" style="margin: auto; margin-right: 0px; display: block;">Submit Amount</button>
                                        </div>
                                    </div>
                                </div>
                                <?php echo form_close(); ?>

                                <div class="card">
                                    <div class="card-header item_disabled" id="headingSeven" data-toggle="" data-target="#starter_step7" aria-expanded="false" aria-controls="starter_step7">
                                        <h5 class="mb-0">Step 7 - Account Status</h5>
                                    </div>
                                    <div id="starter_step7" class="collapse installation-guide" aria-labelledby="headingSeven" data-parent="#starter_accordion">
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <div class="alert alert-default alert-dismissible alert-validation alert-validation-7" style="display: none">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-3"></div>
                                                <div class="col-md-6 text-center">
                                                    <p class="merchant_accounts_not_ready hide">
                                                        It may take a few days to process the information provided,
                                                        once processors statuses are updated to "Enabled" you can start receiving payments
                                                    </p>
                                                    <p class="merchant_accounts_ready hide">
                                                        <strong style="font-weight: 500;">We are ready to launch!</strong> 
                                                        You can start receving payments<br>
                                                        <a class="btn btn-sm mt-2" href="<?= BASE_URL?>organizations">Manage Companies</a>
                                                    </p>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">
                                                    <hr class="instruct-hr">
                                                </div>                                                
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4 text-center">
                                                    <h4><?= langx('Credit Card Processor System') ?></h4>
                                                    <p class="account_status_credit_card"></p>
                                                </div>                                                
                                                <div class="col-md-4 text-center">
                                                    <h4><?= langx('Direct Debit (Bank) Processor System') ?></h4>
                                                    <p class="account_status_direct_debit"></p>
                                                </div>
                                                <!--If the user has reached this step the bank account has been validated-->
                                                <div class="col-md-4 text-center">
                                                    <h4><?= langx('Company\'s Bank Account') ?></h4>
                                                    <p> 
                                                        STATUS: <span class="bank_amount_confirmation_status">-</span>
                                                    </p>
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