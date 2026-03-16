(function () {
    $(document).ready(function () {
        team.setDt();
        team.setGeneral();
    });
    var team = {
        setDt: function () {
            var tableId = "#team_datatable";
            this.tableDt = $(tableId).DataTable({
                "dom": '<"row"<"col-md-9 col-sm-12 filter-1"><"col-md-3 col-sm-12 search"f>><"row"<"col-sm-12 filter-2">>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "team/get_dt", type: "POST",
                    "data": function (d) {

                    }
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function (data) {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: "",orderable: false, searchable: false},
                    {data: "username", className: "", visible: false},
                    {data: "name", className: ""},
                    {data: "email", className: ""},
                    {data: "permissions_rate", className: "text-center", orderable: false, searchable: false},
                    {data: "created_on", className: ""},
                    {data: "id", className: "", orderable: false,
                        "mRender": function (data, type, full) {
                            let edit_option = `<a class="dropdown-item btn-team_member-user"  data-id="` + data + `" href="#">
                                             <i class="none"></i>
                                            <span class="avoidTrClick">Edit</span>
                                        </a>`;
                            
                            let remove_option = `<a class="avoidTrClick dropdown-item btn-delete-user"  data-id="` + data + `" href="#">
                                        <i class="none"></i>
                                            <span class="avoidTrClick">Remove</span>
                                        </a>`;

                            let resend_invitation_option = `<a class="avoidTrClick  dropdown-item btn-resend-invitation"  data-id="` + data + `" href="#">
                                            <i class="none"></i>
                                           <span class="avoidTrClick">Resend credentials</span>
                                        </a>`;

                            return `<li class="nav-item dropdown" style="position: static">
                                     <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        •••
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">`
                                    + edit_option
                                    + resend_invitation_option
                                    + remove_option
                                    + `
                                      </div>
                                    </li>`;

                            return '...';
                        }
                    }
                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);
                }
            });        
            
              $( tableId + ' tbody').on('click', 'tr', function (e) {                                
                let elementClicked = e.target;                   
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                                        
                 let data =  team.tableDt.row(this).data();
                $('#add_team_member_modal').attr('data-id',data.id).modal('show');
                $('#add_team_member_form input[name="email"]').prop('readonly', true);
                }
            });
        },
        setGeneral: function () {
            //===== open modal create mode
    
            $('.btn-add-team-member').on('click', function () {
                $('#add_team_member_modal').attr('data-id', 0).modal('show');
                $('#add_team_member_form input[name="email"]').prop('readonly', false);
                $('#add_team_member_modal .overlay').attr("style", "display: none!important");
            });
            //===== open modal edit mode
            $(document).on('click', '.btn-team_member-user', function () {
                $('#add_team_member_modal').attr('data-id', $(this).attr('data-id')).modal('show');
                $('#add_team_member_form input[name="email"]').prop('readonly', true);
            });

            //==== setup form fields on modal open
            $('#add_team_member_modal').on('show.bs.modal', function (e) {
                $('#add_team_member_form')[0].reset();
                $("#add_team_member_form #group").val([]).trigger("change");
                $('#add_team_member_form').find('.alert-validation').first().empty().hide();

                $('#add_team_member_form .permissions').prop('checked', false);
                if ($(this).attr('data-id') != '0') {//edit mode load data
                    $('#add_team_member_modal .overlay').show();
                    $.post(base_url + 'team/get_member', {id: $(this).attr('data-id')}, function (result) {
                        $('#add_team_member_form input[name="first_name"]').val(result.user.first_name);
                        $('#add_team_member_form input[name="last_name"]').val(result.user.last_name);
                        $('#add_team_member_form input[name="phone"]').val(result.user.phone);
                        $('#add_team_member_form input[name="email"]').val(result.user.email);

                        if (result.user.permissions.length) {
                            $.each(result.user.permissions, function (i, val) {
                                $('#add_team_member_form input[name="permissions[' + val + ']"]').prop('checked', true);
                            });
                        }
                        $('#add_team_member_modal .overlay').attr("style", "display: none!important");
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_team_member_modal .overlay').attr("style", "display: none!important");
                    });
                } else {                  
                    $.each(_module_tree, function (i, val) {
                        if (val.default_grant == true) {                             
                            $('#add_team_member_form input[name="permissions[' + val.id + ']"]').prop('checked', true);
                        }
                    });
                }
            });

            //==== focus first field on modal opened
            $('#add_team_member_modal').on('shown.bs.modal', function () {
                $('#add_team_member_modal').find(".focus-first").first().focus();
            });

            //==== save user
            $('#add_team_member_modal .btn-save').on('click', function () {
                var btn = helpers.btn_disable(this);
                var data = $("#add_team_member_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['id'] = $('#add_team_member_modal').attr('data-id');
                $.ajax({
                    url: base_url + 'team/save_member', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            team.tableDt.draw(false);
                            $("#add_team_member_modal").modal("hide");
                            success_message(data.message + (data.email_message != '' ? (data.email_message) : ''));
                        } else {
                            $('#add_team_member_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
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

            $(document).on('click', '.btn-resend-invitation', function () {
                let user_id = $(this).data('id');
                question_modal('Resend Credentials', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#general_token_form").serializeArray();
                                var save_data = {};
                                $.each(data, function () {
                                    save_data[this.name] = this.value;
                                });
                                save_data['id'] = user_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'team/resend_invitation', type: "POST",
                                    dataType: "json",
                                    data: save_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message + (data.email_message != '' ? (data.email_message) : ''));
                                        } else {
                                            error_message(data.message);
                                        }
                                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                        loader('hide');
                                    },
                                    error: function (jqXHR, textStatus, errorJson) {
                                        loader('hide');
                                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                            alert(jqXHR.responseJSON.message);
                                            location.reload();
                                        } else {
                                            alert("error: " + jqXHR.responseText);
                                        }
                                    }
                                });
                            }
                        });
            });
            $(document).on('click', '.btn-delete-user', function () {
                let user_id = $(this).data('id');
                question_modal('Remove User', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {

                                var data = $("#add_team_member_form").serializeArray();
                                var save_data = {};
                                $.each(data, function () {
                                   if (this.name =='csrf_token'){
                                    save_data[this.name] = this.value;
                                   }                                 
                                });
                                save_data['id'] = user_id;
                                $.ajax({
                                    url: base_url + 'team/delete_user', type: "POST",
                                    dataType: "json",
                                    data: save_data,
                                    success: function (data) {
                                        if (data.status) {
                                            notify({'title': 'Notification', 'message':data.message });
                                        } else {
                                            notify({'title': 'Notification','message':data.message});
                                        }
                                        team.tableDt.draw(false);
                                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                        loader('hide');
                                    },
                                    error: function (jqXHR, textStatus, errorJson) {
                                        loader('hide');
                                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                            alert(jqXHR.responseJSON.message);
                                            location.reload();
                                        } else {
                                            alert("error: " + jqXHR.responseText);
                                        }
                                    }
                                });
                            }
                        });
            });         
                      
            
        }
    };
}());

