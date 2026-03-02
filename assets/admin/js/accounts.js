(function () {

    $(document).ready(function () {
        acl.setaccountsDt();
        acl.setaccountsModal();
        acl.setgroups_dt();

        acl.setPieChart();
    });
    var acl = {
        dtTable: null,
        todoRefDate: null,
        setaccountsDt: function () {
            var tableId = "#acl_users_datatable";
            this.dtTable = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-a xfilter"><"col-sm-3 search xfilter"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 25, 50], [10, 25, 50]], order: [[0, "desc"]],
                pageLength: 25,
                ajax: {
                    url: base_url + "accounts/get_dt", type: "POST",
                    "data": function (d) {
                        d.status = $('select' + tableId + '_status_filter').val();
                    }
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    //$(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: "", "render": function (data, type, full) {
                            return data + ' ' + (full.ch_id ? full.ch_id : '') + ' ' + (full.psf_id ? full.psf_id : '');
                        }
                    },
                    {data: "ch_id", className: "", searchable: false, visible:false, orderable: false, render: function (data, type, full) {
                        return `<li class="nav-item dropdown" style="position: static">
                                  <a class="nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fas fa-cog"></i>
                                  </a>
                                  <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                    <a class="btn-remove-organization dropdown-item" data-id="` + data + `" href="#">
                                        <i class="fas fa-trash"></i> Send to trash
                                    </a>` +
                                `</div>
                                </li>`;
                        }
                    },
                    {data: "todo_order_ctrl", className: "text-center", searchable: false, orderable: true, render: function (data, type, full) {
                            if(full.ch_id == null) {
                                return 'no_org_created<br>dev';
                            }
                            
                            if (full.todo_action_required_by == null) {
                                return `<button title="` + (full.todo_notes ? full.todo_notes : '') + `" type="button" style="padding:3px 7px" data-id="` + full.ch_id + `" class="btn btn-secondary btn-show-todo">
                            <i style="cursor:pointer; font-size: 16px;" class="far fa-bell"></i></button>`;                                
                            } else {
                                
                                let _required_by = `<span class="badge badge-warning" style="margin-top: 10px; font-size:10px">`
                                        + `<i class="fas fa-flag"></i> `
                                        + full.todo_action_required_by
                                        + `</span>`;
                                
                                let _reference_date = '';
                                if(full.todo_reference_date) {
                                    _reference_date = ``
                                        + `<span class="badge badge-warning" style="margin-top: 10px; font-size:10px">`
                                        + full.todo_reference_date
                                        + `</span>`;
                                }
                                
                                return ``
                                        + `<button title="` + (full.todo_notes ? full.todo_notes : '') + `" type="button" style="padding:3px 7px" data-id="` + full.ch_id + `" class="btn btn-secondary btn-show-todo">`
                                        + `<i style="cursor:pointer; font-size: 16px; color:#e60000" class="fas fa-bell"></i>`
                                        + `</button>`
                                        + '<br>'
                                        + _required_by
                                        + '<br>'
                                        + _reference_date;                                
                            }
                        }
                    },
                    {data: "username", className: "", visible: false},
                    {data: "full_name", className: ""},
                    {data: "email", className: ""},
                    {data: "phone", className: ""},
                    {data: "church_name", className: "", "render": function (data, type, full) {
                            let str = '';
                            if (full.ch_id == null) {
                                str = $.fn.dataTable.render.text().display('<No Organization Created>');
                            } else if (data == '') {
                                str = $.fn.dataTable.render.text().display('<No name provided>');
                            } else {
                                str = $.fn.dataTable.render.text().display(data, type, full); //sanitize
                            }

                            return str + ' ';
                        }
                    },
                    {data: "status_index", className: "", orderable: true, searchable: false,
                        "render": function (data, type, full) {
                            let acc_status = $.parseJSON(full.acc_status);
                            return ''
                                    + '<div class="d-flex align-items-center">'
                                    + '<span class="completion mr-2" title="' + acc_status.title + '" style="cursor: pointer">' + acc_status.step + '</span>'
                                    + '<div>'
                                    + '<div class="progress">'
                                    + '<div class="progress-bar" role="progressbar" aria-valuenow="' + acc_status.per + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + acc_status.per + '%;'+ (acc_status.color ? 'background-color: ' + acc_status.color : '') + '"></div>'
                                    + '</div>'
                                    + '</div>'
                                    + '</div>';
                        }
                    },
                    {data: "status_index", className: "", visible:true, orderable: true, searchable: false,
                        "render": function (data, type, full) {
                            return ''
                                    + '<div class="d-flex align-items-center">'
                                    + '<a target="_BLANK" style="text-transform: uppercase;" href="' + base_url + 'accounts/show_details/' + full.psf_id + '">'
                                    + (full.account_status ? full.account_status : '-') + '<br>'
                                    + (full.account_status2 ? full.account_status2 : '-') + '<br>'
                                    + (full.bank_status ? (full.bank_status + ' ' + (full.bank_status.toUpperCase() == 'FAILED' ? '(Check Attempts)' : '')) : '-') + '<br>'
                                    + '</a></div>';
                        }
                    },
                    {data: "account_ids", className: "", visible:false, "render": function (data, type, full) {
                            return data ? data : '-';
                        }
                    },
                    {data: "website", className: "", "render": function (data, type, full) {
                            let _website = $.fn.dataTable.render.text().display(data, type, full);
                            
                            if(_website) {

                                if(_website.includes('http://') || _website.includes('https')) {
                                    //do nothing, show it as it comes
                                } else {
                                    _website = 'http://' + _website;
                                }

                                return '<a target="_BLANK" href="' + _website + '">' + _website + '</a>'; //sanitize
                            } else {
                                return '';
                            }
                        }
                    },
                    {data: "created_on", className: ""}
                    
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                    var divSelectInput = $('div' + tableId + '_div_status_filter');
                    $(tableId + '_wrapper .filter-a').append(divSelectInput);//.css('padding', '0px 20px 5px 10px');
                    $('div' + tableId + '_filter').css('width', '100%');
                    $('div' + tableId + '_filter label').css('width', '100%');
                    $('div' + tableId + '_filter input').css('width', '100%');
                    $('.filter-a').css('padding', '0px 20px 7px 20px');
                    divSelectInput.show();
                }
            });

            $('select' + tableId + '_status_filter').change(function () {
                acl.dtTable.draw(false);
            });

            //Event Refund
            $(tableId).on('click', '.btn-remove-organization', function (e) {
                var ch_id = $(this).data('id');
                question_modal('Remove Organization', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#general_token_form").serializeArray();
                                var refund_data = {};
                                $.each(data, function () {
                                    refund_data[this.name] = this.value;
                                });
                                refund_data['ch_id'] = ch_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'organizations/remove', type: "POST",
                                    dataType: "json",
                                    data: refund_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message)
                                        } else {
                                            error_message(data.message)
                                        }
                                        acl.dtTable.draw(false);
                                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                        loader('hide');
                                    },
                                    error: function (jqXHR, textStatus, errorJson) {
                                        loader('hide');
                                        alert("error: " + jqXHR.responseText);
                                        location.reload();
                                    }
                                });
                            }
                        });
                e.preventDefault(); //====== precent sweet alert to scroll the entire windows
                return false;
            });
            
            $(tableId).on('click', '.btn-show-todo', function (e) {
                loader('show');
                $('#todo_modal .span-organization-name').text('');
                $('#todo_modal .span-action-required-status').hide();
                
                $('#todo_form')[0].reset();
                $('#todo_modal').attr('data-id', $(this).attr('data-id')).modal('show');
                e.preventDefault(); //====== prevent window verticla scrolling
                return false;
            });
            
            $('#todo_modal').on('shown.bs.modal', function () {
                let ch_id = $(this).attr('data-id');
                $.post(base_url + 'organizations/get_todo', {ch_id: ch_id}, function (result) {
                    //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
                     //Element value was changed outside of mask
                    if(result.org.todo_reference_date == null) {
                        acl.todoRefDate.value = ''; //sets the mask with the imask placeholder                        
                    } else {
                        acl.todoRefDate.value = moment(result.org.todo_reference_date).format('YYYY-MM-DD');
                    }
                    
                    $('#todo_modal .span-organization-name').text(result.org.church_name);
                    
                    $('#todo_form #todo_action_required_by').val(result.org.todo_action_required_by).change();
                    
                    $('#todo_form textarea[name="todo_notes"]').val(result.org.todo_notes);
                    $('#todo_modal').find(".focus-first").first().focus().select();
                    loader('hide');
                });
                
                //acl.datatable.ajax.reload(null, false);
            });
            
            $(".btn-todo-add-line").on('click', function() {
                let newItemStr = ''
                        + '==============================\n'
                        + 'ACTION REQURIED BY: ' + $('#todo_action_required_by option:selected').text() 
                        + '\n'
                        + 'REF DATE: ' + acl.todoRefDate.value
                        + '\n'
                        + 'DESCRIPTION:\n';
                $('#todo_form textarea[name="todo_notes"]').val(function(index, old) { return newItemStr + old; }); 
            });
            
            $(".btn-todo-now").on('click', function() {
                acl.todoRefDate.value = moment().format('YYYY-MM-DD');
            });
             
            $('#todo_form textarea[name="todo_notes"]').keydown(function (event) {
                if (event.ctrlKey && event.keyCode === 13) {
                    $('#todo_modal .btn-save').click();
                }
            });   
            
            $('#todo_form #todo_action_required_by').on('change', function(){
                if($(this).val() == '') {
                    $('#todo_modal .span-action-required-status').hide();
                } else {
                    $('#todo_modal .span-action-required-status').show();
                }
                
            });
            //==== save todo
            $('#todo_modal .btn-save').on('click', function () {
                var data = $("#todo_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['ch_id'] = $('#todo_modal').attr('data-id');
                $.ajax({
                    url: base_url + 'organizations/save_todo', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $("#todo_modal").modal("hide");
                            acl.dtTable.draw(false);
                        } else {
                            $('#todo_modal').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
                            
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
            
            let momentFormat = 'YYYY-MM-DD';
            acl.todoRefDate = IMask(document.getElementById('todo_reference_date'), {
              mask: Date,
              pattern: momentFormat,
              lazy: false,
              min: new Date(2020, 0, 1),
              max: new Date(3000, 0, 1),

              format: function (date) {
                return moment(date).format(momentFormat);
              },
              parse: function (str) {
                return moment(str, momentFormat);
              },

              blocks: {
                YYYY: {
                  mask: IMask.MaskedRange,
                  from: 1970,
                  to: 2999
                },
                MM: {
                  mask: IMask.MaskedRange,
                  from: 1,
                  to: 12
                },
                DD: {
                  mask: IMask.MaskedRange,
                  from: 1,
                  to: 31
                }
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
        setaccountsModal: function () {
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
                            acl.dtTable.draw(false);
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
                acl.dtTable.ajax.reload(null, false);
            });
        },

        setPieChart: function () {
            var $chart = $('#chart-pie-statuses');

            var pieChart = new Chart($chart, {
                type: 'pie',
                data: {
                    labels: _statuses_titles,
                    datasets: [{
                            data: _statuses_data,
                            backgroundColor: _statuses_colors,
                            label: 'Dataset 1'
                        }]
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'top',
                        display: false
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });

            // Save to jQuery object

            $chart.data('chart', pieChart);
        }

    };
}());