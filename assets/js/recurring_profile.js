(function () {
    $(document).ready(function () {
        subs.setsubs_dt();
    });
    var subs = {
        setsubs_dt: function () {   
        $(document).on('click', '.btn-stop-subscription', function (e) {           
                var subscription_id = $(this).data('id');
                question_modal('Stop Subscription', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#general_token_form").serializeArray();
                                var subscription_data = {};
                                $.each(data, function () {
                                    subscription_data[this.name] = this.value;
                                });
                                subscription_data['subscription_id'] = subscription_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'donations/stop_subscription', type: "POST",
                                    dataType: "json",
                                    data: subscription_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message);
                                            setTimeout(function () {
                                                  window.location.reload();
                                            }, 2000);
                                            
                                        } else {
                                            error_message(data.message);
                                        }                                       
                                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                        loader('hide');
                                    },
                                    error: function (jqXHR, textStatus, errorJson) {
                                        loader('hide');
                                        error_message(jqXHR.responseText);
                                    }
                                });
                            }
                        });
                e.preventDefault();
                return false;
            });
        }
  };
}());