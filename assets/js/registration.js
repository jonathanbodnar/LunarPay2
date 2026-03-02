(function () {

    $(document).ready(function () {
        registration.setregistration_form();
    });
    var registration = {
        setregistration_form: function () {
            $('#btn_registration').click(function () {
                var btn = helpers.btn_disable(this);
                var data = $("#registration_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });

                if (recaptcha_FE_enabled) {
                    grecaptcha.ready(function () {
                        grecaptcha.execute(recaptcha_public_key, {action: 'registration'}).then(function (token) {
                            save_data["recaptchaToken"] = token;
                            registration.do_registration(save_data, btn);
                        });
                    });
                } else {
                    registration.do_registration(save_data, btn);
                }

            });

            $('input.form-control').on('keypress', function (e) {
                if (e.keyCode === 13) {
                    $('#btn_registration').click();
                }
            });
        },
        do_registration: function (save_data, btn) {
            $.ajax({
                url: base_url + 'auth/register', type: "POST",
                dataType: "json",
                data: save_data,
                success: function (data) {
                    $('#registration_form').find('.alert-validation').first().empty().hide();
                    if (data.status) {
                        $('#registration_form #account_created_message').show('fast');
                        $('#registration_form #account_created_message .message').append(data.message);
                        setTimeout(function () {
                            location = base_url
                        }, 2000);
                    } else {
                        //error_message(data.message)
                        $('#registration_form').find('.alert-validation').first().empty().append(data.message).fadeIn("fast");
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
        }
    };
}());