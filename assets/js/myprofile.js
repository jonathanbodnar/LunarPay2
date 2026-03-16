(function () {

    $(document).ready(function () {
        myprofile.setmyprofile_form();
    });
    var myprofile = {
        setmyprofile_form: function () {
            //==== save profile
            $('#add_myprofile_form .btn-save').on('click', function () {
                var btn = helpers.btn_disable(this);
                $('#add_myprofile_form').find('.alert-validation').first().empty().hide();
                var data = $("#add_myprofile_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['id'] = $('#add_myprofile_form').data('id');
                $.ajax({
                    url: base_url + 'dashboard/save_profile', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            success_message(data.message)
                        } else {
                            $('#add_myprofile_form').find('.alert-validation').first().empty().html(data.message).fadeIn("slow");
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

            $('#add_myprofile_form .btn-change-password').on('click', function (e) {
                $('#change_password_modal .overlay').attr("style", "display: none!important");
                $('#change_password_modal').modal('show');
            });

            $('#change_password_modal .btn-save-password').on('click', function (e) {
                var btn = helpers.btn_disable(this);
                $('#change_password_form').find('.alert-validation').first().empty().hide();
                var data = $("#change_password_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['current_password'] = $('#current_password').val();
                save_data['new_password'] = $('#new_password').val();
                $.ajax({
                    url: base_url + 'dashboard/change_password', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $('#current_password').val(null);
                            $('#new_password').val(null);
                            $('#change_password_modal').modal('hide');
                            success_message(data.message)
                        } else {
                            $('#change_password_form').find('.alert-validation').first().empty().html(data.message).fadeIn("slow");
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
                        $('#change_password_modal').modal('hide');
                    }
                });
            });


            $('#change_password_modal .btn-save-password').on('');

            $('#change_password_modal ').on('shown.bs.modal', function (e) {
                $('#current_password').remove();
                $('#label_current_password').next().after('<input type="password" class="form-control" id="current_password">');
                $('#new_password').remove();
                $('#label_new_password').next().after('<input type="password" class="form-control" id="new_password">');

                $('#new_password').on('keypress',function (e) {
                    if(e.keyCode === 13){
                        $('#change_password_modal .btn-save-password').click();
                    }
                });

                $('#current_password').focus();
            })
        }

    };



}());

