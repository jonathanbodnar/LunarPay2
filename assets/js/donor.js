(function () {
    $(document).ready(function () {
        donors.setdonors_dt();
        donors.setmass_text_modal();
    });
    var donors = {
        is_slider_amount: false,
        setdonors_dt: function () {
            var tableId = "#donors_datatable";
            this.donors_dt = $(tableId).DataTable({
                "dom": '<"row"<"col-md-9 col-sm-12 filter-1"><"col-md-3 col-sm-12 search"f>><"row"<"col-sm-12 filter-2">>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[1, "desc"]],
                ajax: {
                    url: base_url + "donors/get_donors_dt", type: "POST",
                    "data": function ( d ) {                               
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.suborganization_id = _global_objects.currnt_org.sorgnx_id;
                        d.new_donors = ($('input' + tableId + '_new_donors_filter').is(':checked')) ? 1 : 0;
                        d.date_range = $('select' + tableId + '_date_filter').val();
                        d.is_new_donor_before_days = $('input#is_new_donor_before_days').val();                        
                        if(donors.is_slider_amount) {
                            d.min_amount = $(tableId + '_div_amount_filter .value-low').text();
                            d.max_amount = $(tableId + '_div_amount_filter .value-high').text();
                        }
                    }
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");                     
                },
                "fnDrawCallback": function (data) {
                    $(tableId).fadeIn("fast");
                    var max_value = parseFloat(data.json.include.max_value);
                    max_value = max_value == 0 ? 1 : max_value;

                    var sliderAmount = document.querySelector(tableId + '_div_amount_filter #input-slider-range');
                    var last_max_value = parseFloat(sliderAmount.noUiSlider.get()[1]);
                    
                    sliderAmount.noUiSlider.updateOptions({
                        range: {
                            'min': 0,
                            'max': max_value
                        }
                    });                    
                    if(!donors.is_slider_amount){
                        sliderAmount.noUiSlider.set([0,max_value]);
                    }
                    donors.is_slider_amount = false;
                },
                columns: [
                    {data: "id", className: "",orderable: false, searchable: false, visible : is_dev, mRender: function (data, type, full) {
                            return '<input data-id="'+data+'" class="chck_donors" type="checkbox">';
                        }},
                    {data: "id", className: "", searchable: false, visible : false},
                    {data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {
                            // Sanitize dynamic data before using it in the template
                            const sanitizedFullName = $.fn.dataTable.render.text().display(full.name);
                            const sanitizedOrgName = $.fn.dataTable.render.text().display(_global_objects.currnt_org.orgName);
                            const sanitizedSuborgName = $.fn.dataTable.render.text().display(_global_objects.currnt_org.suborgName);
                            const sanitizedBusinessName = $.fn.dataTable.render.text().display(full.business_name);
                            const sanitizedEmail = $.fn.dataTable.render.text().display(full.email);

                            return `
                            <li class="nav-item dropdown" style="position: static">
                                <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                •••
                                </a>
                                <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                <a class="avoidTrClick btn-GENERAL-add-transaction dropdown-item"
                                    data-org_id="${full.org_id}" 
                                    data-suborg_id="${full.suborg_id}" 
                                    data-context="fund"
                                    data-donor_id="${data}" 
                                    data-donor_name="${sanitizedFullName}" 
                                    href="#">
                                    <i class="none"></i>
                                    Add Transaction
                                </a>
                                <a class="avoidTrClick btn-GENERAL-add-invoice dropdown-item" 
                                    data-org_id="${full.org_id}" 
                                    data-suborg_id="${full.suborg_id}" 
                                    data-org_name="${sanitizedOrgName}"
                                    data-suborg_name="${sanitizedSuborgName}"
                                    data-context="customer_datatable" 
                                    data-donor_id="${data}" 
                                    data-donor_name="${sanitizedFullName}" 
                                    data-donor_email="${sanitizedEmail}" 
                                    data-donor_business_name="${sanitizedBusinessName}"
                                    href="#">
                                    <i class="none"></i>
                                    Create Invoice
                                </a>
                                </div>
                            </li>`;
                        }
                    },
                    {data: "name", className: "", mRender: function (data, type, full) { 
                          return data ? data : '-'
                        }
                    },
                    {data: "email", className: "", mRender: function (data, type, full) { 
                          return data ? data : '-'
                        }
                    },
                    {data: "phone", className: "", mRender: function (data, type, full) { 
                            return data ? data : '-'
                        }
                    },
                    {data: "business_name", className: "", mRender: function (data, type, full) { 
                            return data ? data : '-'
                        }
                    },
                    {data: "address", className: "", visible:false, mRender: function (data, type, full) { 
                        return data ? data : '-'
                        }
                    },
                    {data: "net", className: "text-right" , searchable: false
                        , mRender: function (data) {
                            return '$' + (data ? data : 0.0);
                        }
                    },
                    
                    {data: "created_at",searchable: false, className: "text-right"}
                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);

                    _global_objects.donors_dt = donors.donors_dt;                            

                    //Moving Organization Filter                    
                    var divSelectOrg = $('div' + tableId + '_div_organization_filter');
                    $(tableId + '_wrapper .filter-1').append(divSelectOrg).css('padding','0px 20px 5px 10px');
                    divSelectOrg.css('visibility','visible');

                    //Moving Sub Organization Filter
                    var divSelectSubOrg = $('div' + tableId + '_div_suborganization_filter');
                    $(tableId + '_wrapper .filter-1').append(divSelectSubOrg).css('padding','0px 20px 5px 10px');
                    divSelectSubOrg.css('visibility','visible');

                    //Moving Date Filter
                    var divSelectDate = $('div' + tableId + '_div_date_filter');
                    $(tableId + '_wrapper .filter-1').append(divSelectDate).css('padding','0px 20px 5px 10px');
                    divSelectDate.css('visibility','visible');

                    //Moving New Donors Filter
                    var divCheckboxNewDonors = $('div' + tableId + '_div_new_donors_filter');
                    $(tableId + '_wrapper .filter-1').append(divCheckboxNewDonors).css('padding','0px 20px 5px 10px');
                    divCheckboxNewDonors.css('visibility','visible');

                    //Moving Amount Filter
                    var divSliderAmount = $('div' + tableId + '_div_amount_filter');
                    $(tableId + '_wrapper .filter-2').append(divSliderAmount).css('padding','16px 50px 5px 40px');
                    divSliderAmount.css('visibility','visible');

                }
            });

            //Set Organizations to Datatable Filters
            $.post(base_url + 'organizations/get_organizations_list', function (result) {
                for (var i in result) {
                        var selectInput = $('select' + tableId + '_organization_filter');
                        selectInput.append($('<option/>',{value: result[i].ch_id}).html(result[i].church_name));                        
                    }
            }).fail(function (e) {
                console.log(e);
            });

            //Laading Dinamically Sub Organizations
            function loadDinamycSubOrganizations(){                
                var selectInput = $('select' + tableId + '_suborganization_filter');
                selectInput.empty();
                selectInput.append($('<option/>',{value:''}).html('All Sub Organizations'));

                var organization_id = $('select' + tableId + '_organization_filter').val();
                //Set Sub Organizations to Datatable Filters
                $.post(base_url + 'suborganizations/get_suborganizations_list', {organization_id:organization_id} , function (result) {
                    for (var i in result) {
                        selectInput.append($('<option/>',{value: result[i].id}).html(result[i].name));
                    }
                }).fail(function (e) {
                    console.log(e);
                });
            }
            loadDinamycSubOrganizations();

            //Event Change Organization Filter
            var dt = this.donors_dt;
            $('select' + tableId + '_organization_filter').change(function () {
                loadDinamycSubOrganizations();
                dt.draw(false);
            });

            //Event Change SubOrganization Filter
            $('select' + tableId + '_suborganization_filter').change(function () {
                dt.draw(false);
            });

            //Event Change New Donors
            $('input' + tableId + '_new_donors_filter').change(function () {
                dt.draw(false);
            });

            //Event Change New Donors
            var sliderAmount = document.querySelector(tableId + '_div_amount_filter #input-slider-range');
            sliderAmount.noUiSlider.on('change',function () {
                donors.is_slider_amount = true;
                dt.draw(false);
            });

            //Event Change Date Filter
            var dt = this.donors_dt;
            $('select' + tableId + '_date_filter').change(function () {
                dt.draw(false);
            });
            
           $( tableId + ' tbody').on('click', 'tr', function (e) {                     
                let elementClicked = e.target;                   
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                 let data = donors.donors_dt.row(this).data();                    
                 window.location.href = `${base_url}donors/profile/${data.id}`;                 
                }
            });
            
            
            

        },
        setmass_text_modal: function () {
            $('#btn_mass_text').click(function () {
                if($('.chck_donors:checked').length === 0){
                    error_message('No Client Selected');
                } else {
                    $('#mass_text_form')[0].reset();
                    $('#mass_text_form').find('.alert-validation').first().empty().hide();
                    $('#mass_text_modal').modal('show');
                }
            });

            $('.btn-sent').click(function () {
                var btn = helpers.btn_disable(this);
                var donors = [];
                $.each($('.chck_donors:checked'),function (key,value) {
                    donors.push($(this).data('id'));
                });
                var data = $("#mass_text_form").serializeArray();
                var send_data = {};
                $.each(data, function () {
                    send_data[this.name] = this.value;
                });
                send_data['donors'] = donors;
                $.ajax({
                    url: base_url + 'communication/send_mass_text', type: "POST",
                    dataType: "json",
                    data: send_data,
                    success: function (data) {
                        if(data.status === true){
                            success_message(data.message);
                            $('#mass_text_modal').modal('hide');
                        } else {
                            $('#mass_text_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
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
                })
            });

            $('#mass_text_modal').on('shown.bs.modal', function (e) {
                $('#mass_text_form').find('.focus-first').first().focus();
            });
        },

    };



}());

