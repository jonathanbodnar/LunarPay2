<form class="form_chat payment_form">
    <div class="alert_validation" style="color: darkred; display: none;"></div><br>
    <input class="sc-form-control js_mask_exp_date_short"  type="tel" placeholder="Expiration Date (mm/yy)" name="card_date">
    <input class="sc-form-control"  type="text" placeholder="Holder Name" name="holder_name">
    <input class="sc-form-control"  type="text" placeholder="Street" name="street">
    <input style="display: none !important;" class="sc-form-control"  type="text" placeholder="Street 2" name="street2">
    <input class="sc-form-control"  type="text" placeholder="City" name="city">
    <input class="sc-form-control"  type="text" placeholder="Postal Code" name="postal_code">
    <select name="country" class="sc-form-control country_picker" placeholder="Country">
    </select>
    <div class="sc-buttons-form-container">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button" style="margin-right: 5px;">Save</button>
        <button class="sc-btn sc-btn-default sc-btn-sm sc-btn-history-back" type="button">Back</button>
    </div>
</form>