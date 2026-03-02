(function () {

    $(document).ready(function () {
        reset_password.setreset_form();
    });
    var reset_password = {
        setreset_form: function () {
            $('#btn_reset').click(function () {
                var btn = helpers.btn_disable(this);
                var data = $("#reset_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                $.ajax({
                    url: base_url + 'widget_profile/reset_password', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        $('#reset_form').find('.alert-validation').first().empty().hide();
                        if (data.status) {
                            $('#btn_reset').hide();
                            $('#reset_form #reset_message').show('fast');
                            $('#reset_form #reset_message .message').append(data.message);
                            setTimeout(function () {
                                location = data.back_url
                            },3000);
                        } else {
                            //error_message(data.message)
                            $('#reset_form').find('.alert-validation').first().empty().append(data.message).fadeIn("fast");
                            helpers.btn_enable(btn);
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        helpers.btn_enable(btn);
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                });
            });

            $('input.form-control').on('keypress',function (e) {
                if(e.keyCode === 13){
                    $('#btn_reset').click();
                }
            });
        },
    };
}());