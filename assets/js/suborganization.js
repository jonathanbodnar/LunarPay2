(function () {

    $(document).ready(function () {
        suborganizations.setsuborganizations_dt();
        suborganizations.setsuborganizations_modal();
    });
    var suborganizations = {
        setsuborganizations_dt: function () {
            var tableId = "#suborganizations_datatable";
            this.suborganizations_dt = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "suborganizations/get_suborganizations_dt", type: "POST",
                    "data": function ( d ) {
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                    }
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "name", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "address", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "phone", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "pastor", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "id", className: "text-center", orderable: false, visible: false,
                        "render": function (data, type, full) {
                            if (full.count_funds > 0) {
                                return '<label style="cursor:pointer"><strong><a href="'+base_url+'funds/'+full.church_id+'/'+data+'">Manage Funds</a></strong></label>';
                            } else {
                                return '<label style="cursor:pointer"><strong><a href="'+base_url+'funds/'+full.church_id+'/'+data+'/create">Create A Fund</a></strong></label>';
                            }
                        }
                    },
                    {data: "description", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "id", className: "", orderable: false,
                        "mRender": function (data, type, full) {
                            return '<i class="fas fa-pen btn-edit-suborganization" style="cursor:pointer" data-id="' + data + '"></i>';
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);

                    var divSelectInput = $('div' + tableId + '_div_organization_filter');
                    $(tableId + '_wrapper .filter-1').append(divSelectInput).css('padding','0px 20px 5px 10px');
                    divSelectInput.show();
                }
            });

            //Set Organizations to Datatable Filters
           /* $.post(base_url + 'organizations/get_organizations_list', function (result) {
                for (var i in result) {
                        var selectInput = $('select' + tableId + '_organization_filter');
                        selectInput.append($('<option/>',{value: result[i].ch_id, text : result[i].church_name}));
                    }
            }).fail(function (e) {
                console.log(e);
            });*/
          
        },
        setsuborganizations_modal: function () {            
            //===== open modal create mode
            $('.btn-add-suborganization').on('click', function () {                
                    $('#add_suborganization_modal .show-when-add-sub-organization').show();                      
                    $('#add_suborganization_modal .organization_name').show();                        
                    $('#add_suborganization_modal .organization_name').text(_global_objects.currnt_org.orgName);                    
                
                $('#add_suborganization_modal').attr('data-id', 0).modal('show');
                $('#add_suborganization_modal .overlay').attr("style", "display: none!important");
            });
            //===== open modal edit mode
            $(document).on('click', '.btn-edit-suborganization', function () {                               
                $('#add_suborganization_modal').attr('data-id', $(this).attr('data-id')).modal('show');
            });

            //==== setup form fields on modal open
            $('#add_suborganization_modal').on('show.bs.modal', function (e) {
                
                $('#add_suborganization_form')[0].reset();
                $('#add_suborganization_form').find('.alert-validation').first().empty().hide();       
                
                if ($(this).attr('data-id') != '0') {//edit mode load data
                    
                    $('#add_suborganization_modal .show-when-add-sub-organization').show();  
                    $('#add_suborganization_modal .organization_name').show();                        
                    $('#add_suborganization_modal .organization_name').text(_global_objects.currnt_org.orgName);                    
                    
                    $('#add_suborganization_modal .overlay').show();
                    
                    $.post(base_url + 'suborganizations/get_suborganization', {id: $(this).attr('data-id')}, function (result) {
                        $('#add_suborganization_form input[name="suborganization_name"]').val(result.suborganization.name);
                        $('#add_suborganization_form input[name="address"]').val(result.suborganization.address);
                        $('#add_suborganization_form input[name="phone"]').val(result.suborganization.phone);
                        $('#add_suborganization_form input[name="pastor"]').val(result.suborganization.pastor);                    
                        $('#add_suborganization_form textarea[name="description"]').val(result.suborganization.description);

                        $('#add_suborganization_modal .overlay').attr("style", "display: none!important");
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_suborganization_modal .overlay').attr("style", "display: none!important");
                    });
                }
            });

            //==== focus first field on modal opened
            $('#add_suborganization_modal').on('shown.bs.modal', function () {
                $('#add_suborganization_modal').find(".focus-first").first().focus();

            });

            //==== save sub organization
            $('#add_suborganization_modal .btn-save').on('click', function () {
            
                var btn = helpers.btn_disable(this);
                var data = $("#add_suborganization_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;                    
                });
                save_data['id'] = $('#add_suborganization_modal').attr('data-id');
                save_data['organization_id'] = _global_objects.currnt_org.orgnx_id;
                
                $.ajax({
                    url: base_url + 'suborganizations/save_suborganization', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $("#add_suborganization_modal").modal("hide");
                            suborganizations.suborganizations_dt.draw(false);
                            success_message(data.message)
                        } else {
                            //error_message(data.message)
                            $('#add_suborganization_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
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
        }

    };



}());

