<form class="payment_form form_chat">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <div><span class="sc-test-text-title">This is a test widget, real payment data must not be sent.</span></div>
    <br>
    <select name="bank_type" class="sc-form-control select_bank_type" placeholder="Bank Type">
        <option value="eft">EFT Bank Type</option>
    </select>
    <div class="bank_type eft_type" style="display: none;">
        <div class="form-row">
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="First Name" name="eft[first_name]">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="Last Name" name="eft[last_name]">
            </div>
        </div>
        <div class="form-row">
            <div class="col-12">
                <input class="sc-form-control"  type="tel" placeholder="Account Number" name="eft[account_number]" maxlength="12" style="margin-bottom: 0 !important;">
                <span class="sc-test-data">e.g. 998772192</span>
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Transit Number" name="eft[transit_number]" maxlength="5" style="margin-bottom: 0 !important;">
                <span class="sc-test-data">e.g. 22446</span>
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Institution ID" name="eft[institution_id]" maxlength="3" style="margin-bottom: 0 !important;">
                <span class="sc-test-data">e.g. 001</span>
            </div>
        </div>
        <select name="eft[country]" class="sc-form-control country_picker" placeholder="Country">
        </select>
        <input class="sc-form-control"  type="text" placeholder="City" name="eft[city]" style="margin-bottom: 0 !important;">
        <span class="sc-test-data">e.g. Dallas</span>
        <input class="sc-form-control"  type="text" placeholder="Street" name="eft[street]" style="margin-bottom: 0 !important;">
        <span class="sc-test-data">e.g. 100 Queen Street West</span>
        <input style="display: none !important;" class="sc-form-control"  type="text" placeholder="Street 2" name="eft[street2]">
        <input class="sc-form-control"  type="text" placeholder="Postal Code" name="eft[postal_code]" style="margin-bottom: 0 !important;">
        <span class="sc-test-data">e.g. 12345</span>
    </div>
    <div class="payment_form_buttons">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button">
            Add Bank
        </button>
        <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
            Go Back</a>
    </div>
</form>
