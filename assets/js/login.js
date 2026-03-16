(function () {

    $(document).ready(function () {
        login.setlogin_form();
    });
    var login = {
        setlogin_form: function () {
            $('#btn_login').click(function () {
                var btn = helpers.btn_disable(this);
                var data = $("#login_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                $.ajax({
                    url: base_url + 'auth/login', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        $('#login_form').find('.alert-validation').first().empty().hide();
                        if (data.status) {
                            location = base_url;
                        } else {
                            //error_message(data.message)
                            $('#login_form').find('.alert-validation').first().empty().append(data.message).fadeIn("fast");
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        helpers.btn_enable(btn);
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

            $('input[name="password"]').on('keypress',function (e) {
                if(e.keyCode === 13){
                    $('#btn_login').click();
                }
            });
        },
    };
}());