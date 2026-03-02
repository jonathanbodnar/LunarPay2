<form class="form_chat" style="line-height: 0.5 !important;">
    <div class="alert_validation" style="color: darkred; display: none;"></div>
    <div class="recurring-calendar-picker"></div>
    <input type="hidden" name="recurring_date">
    <div class="sc-buttons-form-container">
        <button class="sc-btn sc-btn-primary sc-btn-form theme_color button_text_color" type="button" style="margin-right: 5px;">Save Date</button>
    </div>
</form>

<script>
    var enddate = new Date();
    enddate.setDate(enddate.getDate() + 30);
    $('.sc-message-list .sc-message.received:last-of-type .recurring-calendar-picker').datepicker({
        startDate  : "0d",
        endDate    : enddate,
        maxViewMode: 0
    });
    $('.sc-message-list .sc-message.received:last-of-type .recurring-calendar-picker').on('changeDate', function() {
        $('.sc-message-list .sc-message.received:last-of-type input[name="recurring_date"]').val(
            $('.sc-message-list .sc-message.received:last-of-type .recurring-calendar-picker').datepicker('getFormattedDate')
        );
    });
    $('.sc-message-list .sc-message.received:last-of-type .recurring-calendar-picker').datepicker('setDate', '0d');
</script>