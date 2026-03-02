<form class="payment_form form_chat">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <input class="sc-form-control"  type="text" placeholder="First Name" name="first_name">
    <input class="sc-form-control"  type="text" placeholder="Last Name" name="last_name">
    <input class="sc-form-control js_mask_credit_card" type="tel" placeholder="Card Number" name="card_number">
    <input class="sc-form-control js_mask_exp_date"  type="tel" placeholder="Expiration Date (mm/yyyy)" name="card_date">
    <input class="sc-form-control js_mask_cvv"  type="tel" placeholder="CVV" name="card_cvv">
    <input class="sc-form-control"  type="text" placeholder="Postal Code" name="postal_code">
    <div class="payment_form_buttons">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button">
            Add Card
        </button>
        <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
            Go Back</a>
    </div>
</form>