<form class="payment_form form_chat">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <div>Don’t worry, this data never hits our servers. It’s level 1 PCI compliant and SSL Secure. <span class="sc-test-text-title">This is a test widget, real payment data must not be sent.</span></div>
    <input class="sc-form-control"  type="text" placeholder="First Name" name="first_name" style="margin-top: 15px;">
    <input class="sc-form-control"  type="text" placeholder="Last Name" name="last_name">
    <div class="widget_card_number sc-form-control" style="margin-bottom: 0 !important;"></div>
    <span class="sc-test-data">e.g. 5191330000004415</span>
    <div class="widget_expiry_date sc-form-control" style="margin-bottom: 0 !important;"></div>
    <span class="sc-test-data">e.g. <?= date('m') ?> / <?= date('y') + 1 ?></span>
    <div class="widget_cvv sc-form-control" style="margin-bottom: 0 !important;"></div>
    <span class="sc-test-data">e.g. 123</span>
    <input class="sc-form-control" style="margin-bottom: 0 !important;" type="text" placeholder="Postal Code" name="postal_code">
    <span class="sc-test-data">e.g. 12345</span>
    <div class="payment_form_buttons">
        <button class="sc-btn sc-btn-primary sc-btn-form-psf theme_color button_text_color" type="button">
            Add Card
        </button>
        <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
            Go Back</a>
    </div>
</form>