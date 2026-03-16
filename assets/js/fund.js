(function () {

    $(document).ready(function () {
        funds.setfunds_dt();
        funds.setfunds_modal();
    });
    var funds = {
        setfunds_dt: async function () {
            var tableId = "#funds_datatable";
            this.funds_dt = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "funds/get_funds_dt", type: "POST",
                    "data": function ( d ) {
                        d.organization_id = $('#filter_organization_id').val();
                        d.suborganization_id = $('#filter_sub_organization_id').val();
                    }
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $('[data-toggle="tooltip"]').tooltip();
                    //$(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id",visible:false},
                    {data: "name", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "id", className: "text-center btn-inside-cell", orderable: false,
                        "mRender": function (data, type, full) {
                            return `<label style="cursor:pointer" `
                                    + `data-fund_id="` + data + `" data-context="fund" `
                                    + `class="btn-GENERAL-add-transaction"> `
                                    + `Create Transaction
                                    </label>`;
                        }
                    },
                    {data: "id", className: "text-center btn-inside-cell", orderable: false,
                        "mRender": function (data, type, full) {
                            return `<label style="cursor:pointer" `
                                    + `data-fund_id="` + data + `"> `
                                    + `<a target='_blank' href="` + base_url + `donations/` + data + `"> View Transactions</a>
                                    </label>`;
                        }
                    },
                    {data: "amount", className: "text-right",orderable: false,  mRender: function (data) {
                            return data ? '$'+data : "$"+0.0;
                        }},
                    {data: "description", className: "text-center", 
                        "mRender": function (data, type, full) {
                            if(data && data != ' ') {
                                //sanitize
                                return `<label style="text-align:center" class="tooltip-help" data-toggle="tooltip" data-html="true" data-placement="right"
                                           title="` +  $.fn.dataTable.render.text().display(data) + `"> 
                                        <strong>?</strong>
                                    </label>`;                            
                            } 
                            
                            return 'No description';
                            
                        }
                    },                    
                    {data: "id", className: "text-center", orderable: false,
                        "mRender": function (data, type, full) {
                            return `<label class="custom-toggle" style="margin: auto;">
                                    <input class="fund_active" type="checkbox" `+ (full.is_active == 1 ? 'checked' : '')  +` 
                                            name="fund_active" value="active" data-id="` + data + `">
                                    <span class="custom-toggle-slider rounded-circle"></span>
                                </label>`;
                        }
                    },
                    {data: "id", className: "", orderable: false,
                        "mRender": function (data, type, full) {
                            var hide_delete = full.count_donations !== '0' ? 'collapse':'';
                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                            <a class="btn-edit-fund dropdown-item" data-id="` + data + `" href="#">
                                                <i class="fas fa-pen"></i>
                                                <span>Edit</span>
                                            </a>
                                            <a class="btn-delete-fund dropdown-item `+ hide_delete +`" data-id="` + data + `" href="#">
                                                <i class="fas fa-trash-alt"></i>
                                                <span>Remove</span>
                                            </a>
                                      </div>
                            </li>`;
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                    _global_objects.funds_dt = funds.funds_dt;
                }
            });
        },
        setfunds_modal: function () {
            //===== open modal create mode
            $('.btn-add-fund').on('click', function () {
                $('#add_fund_modal').attr('data-id', 0).modal('show');
                $('#add_fund_modal .overlay').attr("style", "display: none!important");
            });
            if($('#flag_create').val() == 'create'){
                $('.btn-add-fund').click();
            }
            //===== open modal edit mode
            $(document).on('click', '.btn-edit-fund', function () {
                $('#add_fund_modal').attr('data-id', $(this).attr('data-id')).modal('show');
            });

            $('#add_fund_form input[name="organization_id"]').val($('#filter_organization_id').val());
            $('#add_fund_form input[name="suborganization_id"]').val($('#filter_sub_organization_id').val());
            //==== setup form fields on modal open
            $('#add_fund_modal').on('show.bs.modal', async function (e) {
                $('#add_fund_form')[0].reset();
                $('#add_fund_form').find('.alert-validation').first().empty().hide();
                if ($(this).attr('data-id') != '0') {//edit mode load data
                    $('#add_fund_modal .overlay').show();
                    $.post(base_url + 'funds/get_fund', {id: $(this).attr('data-id')}, async function (result) {
                        $('#add_fund_form input[name="fund_name"]').val(result.fund.name);
                        $('#add_fund_form input[name="fund_active"]').prop('checked',result.fund.is_active == 1 ? true : false);
                        $('#add_fund_form textarea[name="description"]').val(result.fund.description);
                        $('#add_fund_modal .overlay').attr("style", "display: none!important");
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_fund_modal .overlay').attr("style", "display: none!important");
                    });
                }
            });

            //==== focus first field on modal opened
            $('#add_fund_modal').on('shown.bs.modal', function () {
                $('#add_fund_modal').find(".focus-first").first().focus();

            });

            //==== save fund
            $('#add_fund_modal .btn-save').on('click', function () {
                var btn = helpers.btn_disable(this);
                var disabled = $("#add_fund_form").find(':input:disabled').removeAttr('disabled');
                var data = $("#add_fund_form").serializeArray();
                disabled.attr('disabled','disabled');
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['id'] = $('#add_fund_modal').attr('data-id');
                $.ajax({
                    url: base_url + 'funds/save_fund', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $("#add_fund_modal").modal("hide");
                            funds.funds_dt.draw(false);
                            success_message(data.message)
                        } else {
                            //error_message(data.message)
                            $('#add_fund_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
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

            //===== open modal delete mode
            $(document).on('click', '.btn-delete-fund', function (e) {
                var fund_id = $(this).data('id');
                var data = $("#delete_fund_form").serializeArray();
                var delete_data = {};
                $.each(data, function () {
                    delete_data[this.name] = this.value;
                });
                delete_data['id'] = fund_id;
                delete_question('fund').then(function (result) {
                    if (result.value) {
                        $.ajax({
                            url: base_url + 'funds/delete_fund', type: "POST",
                            dataType: "json",
                            data: delete_data,
                            success: function (data) {
                                if (data.status) {
                                    funds.funds_dt.draw(false);
                                    success_message(data.message)
                                } else {
                                    error_message(data.message)
                                    //$('#add_fund_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
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
                    }
                });
                e.preventDefault();
                return false;
            });

            $(document).on('change', '.fund_active', function (e) {
                var active_switch = $(this);
                var fund_id = active_switch.data('id');
                var active_text = active_switch.prop('checked') ? 'Active' : 'Inactive';
                var active_val = active_switch.prop('checked') ? 1 : 0;
                var data = $("#delete_fund_form").serializeArray(); // Reusing csrf token form
                var active_data = {};
                $.each(data, function () {
                    active_data[this.name] = this.value;
                });
                active_data['id'] = fund_id;
                active_data['active'] = active_val;
                question_modal(active_text + ' Fund','Are you sure?').then(function (result) {
                    if (result.value) {
                        $.ajax({
                            url: base_url + 'funds/active_fund', type: "POST",
                            dataType: "json",
                            data: active_data,
                            success: function (data) {
                                if (data.status) {
                                    funds.funds_dt.draw(false);
                                    success_message(data.message)
                                } else {
                                    error_message(data.message);
                                    active_switch.prop('checked',!active_val);
                                }
                                typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                            },
                            error: function (jqXHR, textStatus, errorJson) {
                                active_switch.prop('checked',!active_val);
                                if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                    alert(jqXHR.responseJSON.message);
                                    location.reload();
                                } else {
                                    alert("error: " + jqXHR.responseText);
                                }
                            }
                        });
                    } else {
                        active_switch.prop('checked',!active_val);
                    }
                });
                e.preventDefault();
                return false;
            });
        }

    };



}());

