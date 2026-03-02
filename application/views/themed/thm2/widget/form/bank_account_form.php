<form class="payment_form form_chat">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <input class="sc-form-control"  type="text" placeholder="First Name" name="first_name">
    <input class="sc-form-control"  type="text" placeholder="Last Name" name="last_name">
    <select name="account_type" class="sc-form-control" placeholder="Account Type">
        <option value="">Select Account Type</option>
        <option value="personal_checking">Personal Checking</option>
        <option value="personal_savings">Personal Savings</option>
        <option value="business_checking">Business Checking</option>
        <option value="business_savings">Business Savings</option>
    </select>
    <input class="sc-form-control"  type="tel" placeholder="Routing Number" name="routing_number">
    <input class="sc-form-control"  type="tel" placeholder="Account Number" name="account_number">
    <input class="sc-form-control"  type="text" placeholder="Postal Code" name="postal_code">

    <div class="payment_form_buttons">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button">
            Add Bank
        </button>
        <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
            Go Back</a>
    </div>
</form>
