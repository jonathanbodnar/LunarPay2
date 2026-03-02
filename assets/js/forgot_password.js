(function () {

    $(document).ready(function () {
        forgot_password.setrecover_form();
    });
    var forgot_password = {
        setrecover_form: function () {
            $('#btn_recover').click(function () {
                var btn = helpers.btn_disable(this);
                var data = $("#recover_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                $.ajax({
                    url: base_url + 'auth/forgot_password', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        $('#recover_form').find('.alert-validation').first().empty().hide();
                        if (data.status) {
                            $('#btn_recover').hide();
                            $('#recover_form #recover_message').show('fast');
                            $('#recover_form #recover_message .message').append(data.message);
                            setTimeout(function () {
                                location = base_url
                            },3000);
                        } else {
                            //error_message(data.message)
                            $('#recover_form').find('.alert-validation').first().empty().append(data.message).fadeIn("fast");
                            
                        }
                        helpers.btn_enable(btn);
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
                    e.preventDefault();
                    $('#btn_recover').click();
                }
            });
        },
    };
}());