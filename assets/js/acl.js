(function () {

    $(document).ready(function () {
        acl.setusers_dt();
        acl.setusers_modal();
        acl.setgroups_dt();
    });
    var acl = {
        setusers_dt: function () {
            var tableId = "#acl_users_datatable";
            this.users_dt = $(tableId).DataTable({
                //====== https://datatables.net/reference/option/dom
                "dom": '<"row"<"col-sm-3 filter-1"><"col-sm-9"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "acl/get_users_dt", type: "POST"
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: ""},
                    {data: "username", className: "", visible: false},
                    {data: "first_name", className: "",
                        "mRender": function (data, type, full) {
                            return full.first_name + ' ' + full.last_name;
                        }
                    },
                    {data: "email", className: ""},
                    {data: "created_on", className: ""},
                    {data: "id", className: "", orderable: false,
                        "mRender": function (data, type, full) {
                            return '<i class="fas fa-pen btn-edit-user" style="cursor:pointer" data-id="' + data + '"></i>';
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);

                    //=========
                    var selectOpts = {id: tableId + '_filter_1', class: 'form-control'};
                    var selectInput = $('<select/>', selectOpts);

                    var opts = ['orng1', 'orng2', 'orng3'];
                    for (var i in opts) {
                        selectInput.append($('<option/>').html(opts[i]));
                    }
                    $(tableId + '_wrapper .filter-1').append(selectInput).css('padding','0px 20px 5px 10px');
                    //========
                }
            });

        },
        setgroups_dt: function () {
            var tableId = "#acl_groups_datatable";
            acl.groups_dt = $(tableId).DataTable({
                //language: dt_language,
                processing: true, serverSide: true,
                //deferLoading: 0, 
                aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "acl/get_groups_dt", type: "POST"
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: ""},
                    {data: "name", className: ""},
                    {data: "description", className: ""},
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                }
            });
        },
        setusers_modal: function () {
            //===== open modal create mode
            $('.btn-add-user').on('click', function () {
                $('#add_user_modal').attr('data-id', 0).modal('show');
                $('#add_user_modal .overlay').attr("style", "display: none!important");
            });
            //===== open modal edit mode
            $(document).on('click', '.btn-edit-user', function () {
                $('#add_user_modal').attr('data-id', $(this).attr('data-id')).modal('show');
            });

            //==== setup form fields on modal open
            $('#add_user_modal').on('show.bs.modal', function (e) {
                $('#add_user_form')[0].reset();
                $("#add_user_form #group").val([]).trigger("change");
                $('#add_user_form').find('.alert-validation').first().empty().hide();

                if ($(this).attr('data-id') != '0') {//edit mode load data
                    $('#add_user_modal .overlay').show();
                    $.post(base_url + 'acl/get_user', {id: $(this).attr('data-id')}, function (result) {
                        $('#add_user_form input[name="first_name"]').val(result.user.first_name);
                        $('#add_user_form input[name="last_name"]').val(result.user.last_name);
                        $('#add_user_form input[name="company"]').val(result.user.company);
                        $('#add_user_form input[name="phone"]').val(result.user.phone);
                        $('#add_user_form input[name="email"]').val(result.user.email);
                        var groups = [];
                        $("#add_user_form #group").empty();
                        $.each(result.user_groups, function () {
                            groups.push(this.id);
                            $("#add_user_form #group").append('<option value="' + this.id + '">' + this.name + '</option>')
                        });
                        $("#add_user_form #group").val(groups).trigger('change');
                        $('#add_user_modal .overlay').attr("style", "display: none!important");
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_user_modal .overlay').attr("style", "display: none!important");
                    });
                }
            });

            //==== focus first field on modal opened
            $('#add_user_modal').on('shown.bs.modal', function () {
                $('#add_user_modal').find(".focus-first").first().focus();
                //acl.datatable.ajax.reload(null, false);
            });

            //Initialize Select2 Elements
            var rows_per_page = 30;
            $('#add_user_form #group').select2({
                ajax: {
                    url: base_url + 'acl/get_groups_list',
                    type: "post",
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            q: params.term, // search term
                            page: params.page,
                        };
                    },
                    processResults: function (data, params) {
                        params.page = params.page || 1;
                        return {
                            results: data.items,
                            pagination: {
                                more: (params.page * rows_per_page) < data.total_count
                            }
                        };
                    }
                }
            });

            //==== save user
            $('#add_user_modal .btn-save').on('click', function () {
                var data = $("#add_user_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['groups'] = $('#add_user_form #group').select2('val');
                save_data['id'] = $('#add_user_modal').attr('data-id');
                $.ajax({
                    url: base_url + 'acl/save_user', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $("#add_user_modal").modal("hide");
                            acl.users_dt.draw(false);
                        } else {
                            //======== Adolfo please use sweet alerts instead
                            $('#add_user_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
                            //=========
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                });
            });
        },
        setroles_modal: function () {
            $('#add_roles_modal').on('shown.bs.modal', function () {
                $(this).find(".focus_first").first().focus();
                acl.users_dt.ajax.reload(null, false);
            });
        }

    };
}());