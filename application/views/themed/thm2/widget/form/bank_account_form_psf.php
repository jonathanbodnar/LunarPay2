<form class="payment_form form_chat">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <select name="bank_type" class="sc-form-control select_bank_type" placeholder="Bank Type">
        <option value="ach" selected>ACH Bank Type</option>
        <option value="eft">EFT Bank Type</option>
        <option value="sepa">SEPA Bank Type</option>
    </select>
    <div class="bank_type ach_type" style="display: none;">
        <div class="form-row">
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="First Name" name="ach[first_name]">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="Last Name" name="ach[last_name]">
            </div>
        </div>
        <select name="ach[account_type]" class="sc-form-control" placeholder="Account Type">
            <option value="">Select Account Type</option>
            <option value="SAVINGS">Savings</option>
            <option value="CHECKING">Checking</option>
            <option value="LOAN">Loan</option>
        </select>
        <div class="form-row">
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Account Number" name="ach[account_number]" maxlength="17">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Routing Number" name="ach[routing_number]" maxlength="9">
            </div>
        </div>

        <select name="ach[country]" class="sc-form-control country_picker" placeholder="Country">
        </select>
        <input class="sc-form-control"  type="text" placeholder="City" name="ach[city]">
        <input class="sc-form-control"  type="text" placeholder="Street" name="ach[street]">
        <input style="display: none !important;" class="sc-form-control"  type="text" placeholder="Street 2" name="ach[street2]">
        <input class="sc-form-control"  type="text" placeholder="Postal Code" name="ach[postal_code]">
    </div>
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
                <input class="sc-form-control"  type="tel" placeholder="Account Number" name="eft[account_number]" maxlength="12">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Transit Number" name="eft[transit_number]" maxlength="5">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="tel" placeholder="Institution ID" name="eft[institution_id]" maxlength="3">
            </div>
        </div>
        <select name="eft[country]" class="sc-form-control country_picker" placeholder="Country">
        </select>
        <input class="sc-form-control"  type="text" placeholder="City" name="eft[city]">
        <input class="sc-form-control"  type="text" placeholder="Street" name="eft[street]">
        <input style="display: none !important;" class="sc-form-control"  type="text" placeholder="Street 2" name="eft[street2]">
        <input class="sc-form-control"  type="text" placeholder="Postal Code" name="eft[postal_code]">
    </div>
    <div class="bank_type sepa_type" style="display: none;">
        <p>The Sepa method payment must be saved in order to make payments</p>
        <div class="form-row">
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="First Name" name="sepa[first_name]">
            </div>
            <div class="col-6">
                <input class="sc-form-control"  type="text" placeholder="Last Name" name="sepa[last_name]">
            </div>
        </div>
        <input class="sc-form-control"  type="tel" placeholder="IBAN" name="sepa[iban]" maxlength="34">
        <input class="sc-form-control"  type="text" placeholder="Mandate Reference" name="sepa[mandate]" maxlength="35">
        <select name="sepa[country]" class="sc-form-control country_picker" placeholder="Country">
        </select>
        <input class="sc-form-control"  type="text" placeholder="City" name="sepa[city]">
        <input class="sc-form-control"  type="text" placeholder="Street" name="sepa[street]">
        <input style="display: none !important;" class="sc-form-control"  type="text" placeholder="Street 2" name="sepa[street2]">
        <input class="sc-form-control"  type="text" placeholder="Postal Code" name="sepa[postal_code]">
    </div>
    <div class="payment_form_buttons">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button">
            Add Bank
        </button>
        <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
            Go Back</a>
    </div>
</form>
