(function () {

    var tableId = "#organizations_datatable";
    $(document).ready(function () {
        organizations.setorganizations_dt();
        organizations.set_ep_onboarding();
    });
    var organizations = {
        default_business_category: 'non_profit',
        disable_onboard_form: false,
        setorganizations_dt: function () {
            this.dtTable = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "organizations/get_organizations_dt", type: "POST"
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "ch_id",visible:false},
                    {data: "church_name", className: "", "render": function(data, type, full) {
                            let str = data == null || data == '' ? $.fn.dataTable.render.text().display('<No name provided>') : $.fn.dataTable.render.text().display(data, type, full); //sanitize
                            return str;
                        }
                    },
                    {data: "phone_no", className: "", "render": $.fn.dataTable.render.text(), visible:false},
                    {data: "ch_id", className: "text-center", orderable: false,
                        "render": function (data, type, full) {
                            if (full.epicpay_verification_status == 'N') {
                                return '<label style="cursor:pointer" data-church_id="' + data + '" class="btn-verify"><strong>Finish Company Setup</strong></label>';
                            } else if (full.epicpay_verification_status == 'P') {
                                return '<a style="color:#525f7f" href="' + base_url + '"><strong>Setup & Install</strong></a>';
                            } else if (full.epicpay_verification_status == 'V') {
                                return '<a style="color:#525f7f" href="' + base_url + '"><strong>Setup & Install</strong></a>';
                            }
                        }
                    }, {data: "ch_id", className: "text-center", orderable: false, visible: true,
                        "render": function (data, type, full) {
                            if (full.twilio_phoneno === null) {
                                return '<label style="cursor:pointer" data-church_id="' + data + '" class="btn-generate-number"><strong>Add Text Giving</strong></label>';
                            } else {
                                return '<label style="color:darkgray">' + full.twilio_phoneno + '</label>';
                            }
                        }
                    }, {data: "ch_id", className: "text-center", orderable: false, visible: true,
                        "render": function (data, type, full) {
                            if (full.count_funds > 0) {
                                return '<label style="cursor:pointer"><strong><a href="'+base_url+'funds/'+data+'">Manage Funds</a></strong></label>';
                            } else {
                                return '<label style="cursor:pointer"><strong><a href="'+base_url+'funds/'+data+'/create">Create A Fund</a></strong></label>';
                            }
                        }
                    },
                    {data: "epicpay_verification_status", className: "text-center", orderable: false,
                        "render": function (data, type, full) {
                            if (data == 'N') {
                                return '<label style="color:inherit">Not connected</label>';
                            } else if (data == 'P') {
                                return '<label style="color:inherit"><strong>Validating</strong></label>';
                            } else if (data == 'V') {
                                return '<label style="color:yellowgreen"><strong>Approved</strong></label>';
                            }
                        }
                    },
                    {data: "state", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "city", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "street_address", className: "", "render": $.fn.dataTable.render.text(), visible: false},
                    {data: "ch_id", className: "", searchable: false
                        , mRender: function (data, type, full) {
                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        •••
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="btn-edit-organization dropdown-item" data-church_id="` + data + `" href="#">
                                            <i class="fas fa-eye"></i> View
                                        </a>                                        
                                        ` + (full.epicpay_verification_status == 'N' ? `
                                        <a class="btn-remove-organization dropdown-item" data-id="` + data + `" href="#">
                                            <i class="fas fa-trash"></i> Remove
                                        </a>` : '') +
                                    `</div>
                                    </li>`;
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                }
            });
            //Event Refund
            $(tableId).on('click', '.btn-remove-organization', function () {
                var ch_id = $(this).data('id');
                question_modal('Remove Organization', 'Confirm action')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#remove_organization_form").serializeArray();
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
                                        organizations.dtTable.draw(false);
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

            //Generate Number
            $(tableId).on('click', '.btn-generate-number', async function () {
                let html_options = '';
                $.each(global_data_helper.us_states,function(index, text){
                    html_options += '<option value="' + index + '">' + text + '</option>';
                });
                let res = await Swal.fire({
                    title: 'Create number',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes',
                    icon: 'info',
                    html: ''
                            + '<div class="row justify-content-center">'
                            + '<div class="col-sm-8 form-group">'
                            + '<label>Select a state</label><br><br>'
                            + '<select id="swal-select1" class="form-control">'
                            + html_options
                            + '</select>'
                            + '</div>'
                            + '</div>',
                    focusConfirm: false,
                    preConfirm: () => {
                        return [
                            document.getElementById('swal-select1').value
                        ];
                    }
                });
                
                if(res.isConfirmed == false){
                    return;
                }
                
                let state = res.value[0];
                                
                let data_token = $("#remove_organization_form").serializeArray();
                
                let data = {};
                $.each(data_token, function () {
                    data[this.name] = this.value;
                    data['state'] = state;
                });
                
                let church_id = $(this).attr('data-church_id');
                data["church_id"] = church_id;
                
                loader('show');
                $.post(base_url + 'messenger/createno', data, function (result) {
                    if (result.status) {
                        organizations.dtTable.draw(false);
                        success_message(result.message);
                    } else {
                        error_message(result.message);
                    }
                    loader('hide');
                    typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
                }).fail(function (e) {
                    loader('hide');
                    console.log(e);                    
                });
            });
        },
        tabsHandler: {
            tabIndex: 0,
            maxIndex: 3,
            buttonLabel: '',
            enableTabClick: false,
            updateTabs: function (from) {
                if (from == 'nextTab')
                    if (this.tabIndex < this.maxIndex) {
                        this.tabIndex++;
                        this.navHasChanged();
                        $('#pills-tabContent .tab-pane').removeClass('active');
                        this.enableTabClick = true;
                        $('#tabs-text-' + (this.tabIndex + 1) + '-tab').click();
                    }

                if (from == 'backTab') {
                    if (this.tabIndex > 0) {
                        organizations.tabsHandler.save('close_modal');
                        this.tabIndex--;
                        this.navHasChanged();
                        $('#pills-tabContent .tab-pane').removeClass('active');
                        this.enableTabClick = true;
                        $('#tabs-text-' + (this.tabIndex + 1) + '-tab').click();
                    } else {
                        $('#ep_onboard_organization_modal').modal('hide');
                    }
                }
            },
            reset: function () {
                this.tabIndex = 0;
                this.navHasChanged();
                $('#pills-tabContent .tab-pane').removeClass('active');
                this.enableTabClick = true;
                $('#tabs-text-' + (this.tabIndex + 1)).addClass('active');
                $('#tabs-text-' + (this.tabIndex + 1) + '-tab').click();
            },
            save: function (from) {
                let is_close_modal = 0;
                if (from !== 'close_modal') { //Temporal save when close the modal
                    if (organizations.disable_onboard_form) {
                        organizations.tabsHandler.updateTabs(from);
                        return;
                    }
                    $('#ep_onboard_organization_form').find('.alert-validation').first().empty().hide();
                    var btn = helpers.btn_disable(document.getElementById('btn_action'));
                } else {
                    is_close_modal = 1;
                }
                let data = $("#ep_onboard_organization_form").serializeArray();
                let step = this.tabIndex + 1;
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['step'] = step;
                save_data['is_closed'] = is_close_modal;
                save_data['id'] = $("#ep_onboard_organization_form").attr('data-ch_id');
                $.post(base_url + 'organizations/save_onboarding', save_data, function (result) {
                    if (!is_close_modal) {
                        helpers.btn_enable(btn);
                    }
                    if (result.status) {
                        $("#ep_onboard_organization_form").attr('data-ch_id', result.ch_id);
                        organizations.dtTable.draw(false);
                        if (!is_close_modal) {
                            organizations.tabsHandler.updateTabs(from);
                            if (typeof result.result !== 'undefined') { //Last step
                                setTimeout(function () {
                                    alert('You will be redirected to Epicpay\'s form for data review & confirmation');
                                    $('#ep_onboard_organization_modal').modal('hide');
                                    window.open(result.result.app_link, '_blank');
                                    //window.location = base_url + 'organizations/onboard_review/' + result.result.client_app_id;
                                }, 100);
                            }
                        }
                    } else if (result.status == false) {
                        $('#ep_onboard_organization_form').find('.alert-validation').first().empty().append(result.message).fadeIn("slow");
                    }
                    typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
                }).fail(function (e) {
                    helpers.btn_enable(btn);
                    console.log(e);
                });
            },
            validate: function (toIndex, from) {
                if (this.tabIndex < toIndex && this.tabIndex <= this.maxIndex) {
                    this.save(from);
                } else if (this.tabIndex > toIndex) { //=== user is going back
                    $('#ep_onboard_organization_form').find('.alert-validation').first().empty().hide();
                    organizations.tabsHandler.updateTabs(from);
                }
            },
            nextTab: function () {
                this.validate(this.tabIndex + 1, 'nextTab');
            }
            ,
            backTab: function () {
                this.validate(this.tabIndex - 1, 'backTab');
            }
            ,
            navHasChanged() {
                $('#btn_action').text(this.tabIndex == this.maxIndex ? (organizations.disable_onboard_form ? 'End' : 'Save & Review') : 'Continue');
                $('#btn_back').text(this.tabIndex == 0 ? 'Close' : 'Back');
            }
        },
        enable_ep_form: function () {
            organizations.disable_onboard_form = false;
            $("#ep_onboard_organization_form :input").prop("disabled", false);
            $("#methods_total_percent").prop("disabled", true);
        },
        disable_ep_form: function () {
            organizations.disable_onboard_form = true;
            $("#ep_onboard_organization_form :input").prop("disabled", true);
        },
        reset_ep_form: function () {
            organizations.tabsHandler.reset();
            $('#ep_onboard_organization_modal').find('.alert-validation').first().empty().hide();
            $('#ep_onboard_organization_form')[0].reset();
            $('#business_category').val(organizations.default_business_category).change();
        },
        set_ep_onboarding: function () {
            //add dash to fed_tax_id
            //===== open modal create mode
            $('.btn-add-organization').on('click', function () {
                organizations.enable_ep_form();
                organizations.reset_ep_form();

                $("#ep_onboard_organization_modal").modal('show');
                $("#ep_onboard_organization_form").attr('data-ch_id', 0);
            });

            $(tableId).on('click', '.btn-verify, .btn-edit-organization', function () {
                organizations.reset_ep_form();
                let church_id = $(this).attr('data-church_id');
                $("#ep_onboard_organization_modal").modal('show');
                $("#ep_onboard_organization_form").attr('data-ch_id', church_id);
                loader('show');
            });

            $('#ep_onboard_organization_modal').on('shown.bs.modal', function (e) {

                $('#dba_name').focus();

                let ch_id = $('#ep_onboard_organization_form').attr('data-ch_id');
                if (ch_id != '0') {//edit mode load data                                        
                    $.post(base_url + 'organizations/get_organization_all', {id: ch_id}, function (result) {
                        if (result.organization.epicpay_verification_status == 'N') {
                            organizations.enable_ep_form();
                        } else {
                            organizations.disable_ep_form();
                        }

                        let form = '#ep_onboard_organization_form';

                        $(form + ' input[name="step1[dba_name]"]').val(result.organization.church_name);
                        $(form + ' input[name="step1[legal_name]"]').val(result.organization.legal_name);
                        $(form + ' input[name="step1[email]"]').val(result.organization.email);
                        $(form + ' input[name="step1[phone_number]"]').val(result.organization.phone_no);
                        $(form + ' input[name="step1[website]"]').val(result.organization.website);
                        $(form + ' select[name="step1[state_province]"]').val(result.organization.state);
                        $(form + ' input[name="step1[city]"]').val(result.organization.city);
                        $(form + ' input[name="step1[postal_code]"]').val(result.organization.postal);

                        $(form + ' input[name="step1[address_line_1]"]').val(result.organization.street_address);
                        $(form + ' input[name="step1[address_line_2]"]').val(result.organization.street_address_suite);

                        $(form + ' input[name="step2[fed_tax_id]"]').val(result.organization.tax_id);

                        if (result.onboard != null) {
                            $(form + ' select[name="step1[business_category]"]').val(result.onboard.business_category).change();
                            $(form + ' select[name="step1[business_type]"]').val(result.onboard.business_type);
                            $(form + ' input[name="step1[business_description]"]').val(result.onboard.business_description);

                            $(form + ' select[name="step2[ownership_type]"]').val(result.onboard.ownership_type);
                            $(form + ' input[name="step2[swiped_percent]"]').val(result.onboard.swiped_percent ? result.onboard.swiped_percent : 0);
                            $(form + ' input[name="step2[keyed_percent]"]').val(result.onboard.keyed_percent ? result.onboard.keyed_percent : 0);
                            $(form + ' input[name="step2[ecommerce_percent]"]').val(result.onboard.ecommerce_percent ? result.onboard.ecommerce_percent : 100);
                            $(form + ' select[name="step2[cc_monthly_volume_range]"]').val(result.onboard.cc_monthly_volume_range ? result.onboard.cc_monthly_volume_range : 0);
                            $(form + ' select[name="step2[cc_avg_ticket_range]"]').val(result.onboard.cc_avg_ticket_range ? result.onboard.cc_avg_ticket_range : 0);
                            $(form + ' input[name="step2[cc_high_ticket]"]').val(result.onboard.cc_high_ticket);
                            $(form + ' select[name="step2[ec_monthly_volume_range]"]').val(result.onboard.ec_monthly_volume_range ? result.onboard.ec_monthly_volume_range : 0);
                            $(form + ' select[name="step2[ec_avg_ticket_range]"]').val(result.onboard.ec_avg_ticket_range ? result.onboard.ec_avg_ticket_range : 0);
                            $(form + ' input[name="step2[ec_high_ticket]"]').val(result.onboard.ec_high_ticket);

                            $(form + ' input[name="step3[first_name]"]').val(result.onboard.sign_first_name);
                            $(form + ' input[name="step3[last_name]"]').val(result.onboard.sign_last_name);
                            $('#sign_birth').datepicker('setDate', moment(result.onboard.sign_date_of_birth).format("L"));
                            $(form + ' input[name="step3[phone_number]"]').val(result.onboard.sign_phone_number);
                            $(form + ' input[name="step3[ssn]"]').val(result.onboard.sign_ssn);
                            $(form + ' input[name="step3[title]"]').val(result.onboard.sign_title);
                            $(form + ' input[name="step3[ownership_percent]"]').val(result.onboard.sign_ownership_percent);
                            $(form + ' select[name="step3[state_province]"]').val(result.onboard.sign_state_province);
                            $(form + ' input[name="step3[city]"]').val(result.onboard.sign_city);
                            $(form + ' input[name="step3[postal_code]"]').val(result.onboard.sign_postal_code);
                            $(form + ' input[name="step3[address_line_1]"]').val(result.onboard.sign_address_line_1);
                            $(form + ' input[name="step3[address_line_2]"]').val(result.onboard.sign_address_line_2);
                            $(form + ' input[name="step4[account_holder_name]"]').val(result.onboard.account_holder_name);
                        }
                        loader('hide');
                    }).fail(function (e) {
                        loader('hide');
                    });
                }
            });

            $('#ep_onboard_organization_modal').on('hidden.bs.modal', function (e) {
                organizations.tabsHandler.save('close_modal');
            });

            document.getElementById('fed_tax_id').addEventListener('keydown', function (event) {
                const key = event.key;
                if (key != "Backspace" && key != "Delete" && key != '-') {
                    if (this.value.length == 2) {
                        this.value = this.value + '-';
                    } else if (this.value.length > 2) {
                        this.value[2] = '-';
                    }
                }
            });

            $('#btn_action').on('click', function () {
                organizations.tabsHandler.nextTab();
            });
            $('#btn_back').on('click', function () {
                organizations.tabsHandler.backTab();
            });

            $('.xanav-selector').on('click', function (e) {
                if (!organizations.tabsHandler.enableTabClick) {
                    return false;
                }
                organizations.tabsHandler.enableTabClick = false;
            });

            //=== Load business categories
            $.each(epicpay_dta_business_cat, function (value, text) {
                $('#business_category').append($('<option>', {value: value, text: text}));
            });

            var sign_birth = $('#sign_birth').datepicker({
                format: "mm/dd/yyyy",
                endDate: "0m",
                orientation: 'bottom'
            }).on('changeDate', function (ev) {
                sign_birth.hide();
            }).data('datepicker');
            //$('#sign_birth').datepicker('setDate', moment().subtract(18, 'years').format("L"));

            //=== Load business types
            $('#business_category').on('change', function () {
                $('#business_type').empty();
                let id = $(this).val();
                $.each(epicpay_dta_business_types[id], function () {
                    $('#business_type').append($('<option>', {value: this.type, text: this.text}));
                });
            });
            $('#business_category').val(organizations.default_business_category).change();

            //=== Load ownership types
            $.each(epicpay_dta_owner_types, function (value, text) {
                $('#ownership_type').append($('<option>', {value: value, text: text}));
            });
            $('#ownership_type').val('np');

            //=== Auto select methods on click
            $('.update-methods-total').on('click', function () {
                $(this).select();
            });

            //=== sum methods
            $('.update-methods-total').on('blur', function () {
                $(this).val($(this).val() == '' ? 0 : $(this).val());
            });
            $('.update-methods-total').on('input change paste', function () {
                let id = $(this).attr('id');
                let val = $(this).val();

                if (val > 100 || val < 0) {
                    $('#' + id + '_val').show();
                } else {
                    $('#' + id + '_val').hide();
                }

                let total = 0;
                $('.update-methods-total').each(function () {
                    let val = $(this).val();
                    if (val == '') {
                        val = 0;
                    }
                    total += parseFloat(val);
                });

                if (total > 100 || total < 100) {
                    $('#methods_total_percent_val').show();
                } else {
                    $('#methods_total_percent_val').hide();
                }

                $('#methods_total_percent').val(total + '%');
            });

            $('#ownership_percent').on('input change paste', function () {
                let id = $(this).attr('id');
                let val = $(this).val();
                if (val > 100 || val < 0) {
                    $('#' + id + '_val').show();
                } else {
                    $('#' + id + '_val').hide();
                }
            });

            //=== Load monthly_volume_range
            $.each(epicpay_dta_monthly_ranges, function (value, text) {
                $('#cc_monthly_volume_range').append($('<option>', {value: value, text: text}));
                $('#ec_monthly_volume_range').append($('<option>', {value: value, text: text}));
            });

            //=== Load avg_ticket_range
            $.each(epicpay_dta_cc_avg_ticket_range, function (value, text) {
                $('#cc_avg_ticket_range').append($('<option>', {value: value, text: text}));
                $('#ec_avg_ticket_range').append($('<option>', {value: value, text: text}));
            });

        }
    };

    let epicpay_dta_cc_avg_ticket_range = {
        '0': '— Please Select —',
        '1': 'Under $16',
        '2': '$16-$25',
        '3': '$26-$50',
        '4': '$51-$250',
        '5': '$251-$500',
        '6': '$501-$1,000',
        '7': 'More than $1,000'

    };

    let epicpay_dta_monthly_ranges = {
        '0': '— Please Select —',
        '1': 'Under $5,000',
        '2': '$5,000-$10,000',
        '3': '$10,001-$25,000',
        '4': '$25,001-$50,000',
        '5': '$50,001-$100,000',
        '6': '$100,001-$165,000',
        '7': 'More than $165,000'
    };

    let epicpay_dta_owner_types = {
        '': '— Please Select —',
        "np": "Non-Profit Charitable Organization",
        "c": "Public Corporation",
        "gov": "Government",
        "llc": "Limited Liability Company",
        "llp": "Limited Liability Partnership",
        "p": "Partnership",
        "po": "Political Organization",
        "s": "Private Corporation",
        "sp": "Sole Proprietor",
        "te": "Other Tax Exempt"
    };

    let epicpay_dta_business_cat = {
        '': '— Please Select —',
        'non_profit': 'Non Profit and Charitable Organization',
        'beauty_and_personal_care': 'Beauty and Personal Care',
        'education': 'Education',
        'food_and_drink': 'Food and Drink',
        'health_care_and_fitness': 'Health Care and Fitness',
        'home_and_repair': 'Home and Repair',
        'professional_services': 'Professional Services',
        'retail': 'Retail',
        'transportation': 'Transportation',
        'leisure_and_entertainment': 'Travel and Entertainment',
        'casual_use': 'Casual Use'
    };

    let epicpay_dta_business_types = {
        "": [
            {"type": "", "text": "— Please Select —"}
        ],
        "non_profit": [
            {"type": "religious_organization", "text": "Religious Organization"},
            {"type": "charitable_organization", "text": "Charitable and Social Service Organization"},
            {"type": "civic_social_and_fraternal_association", "text": "Civic, Social, and Fraternal Association"},
            {"type": "membership_organization", "text": "Membership Organizations (Not Elsewhere Classified)"},
            {"type": "automobile_association", "text": "Automobile Association"},
            {"type": "political_organization", "text": "Political Organization"}
        ],
        "beauty_and_personal_care": [
            {"type": "beauty_salon", "text": "Beauty Salon"},
            {"type": "hair_salon_barbershop", "text": "Hair Salon/Barbershop"},
            {"type": "independent_stylist_barber", "text": "Independent Stylist/Barber"},
            {"type": "massage_therapist", "text": "Massage Therapist"},
            {"type": "nail_salon", "text": "Nail Salon"},
            {"type": "other", "text": "Other"},
            {"type": "spa", "text": "Spa"},
            {"type": "tanning_salon", "text": "Tanning Salon"},
            {"type": "tattoo_piercing", "text": "Tattoo/Piercing"}
        ],
        "casual_use": [
            {"type": "events_festivals", "text": "Events/Festivals"},
            {"type": "miscellaneous_goods", "text": "Miscellaneous Goods"},
            {"type": "miscellaneous_services", "text": "Miscellaneous Services"},
            {"type": "other", "text": "Other"},
            {"type": "outdoor_markets", "text": "Outdoor Markets"}
        ],
        "education": [
            {"type": "child_care", "text": "Child Care"},
            {"type": "instructor_teacher", "text": "Instructor/Teacher"},
            {"type": "other", "text": "Other"},
            {"type": "school", "text": "School"},
            {"type": "tutor", "text": "Tutor"}
        ],
        "food_and_drink": [
            {"type": "bakery", "text": "Bakery"},
            {"type": "bar_club_lounge", "text": "Bar/Club/Lounge"},
            {"type": "caterer", "text": "Caterer"},
            {"type": "coffee_tea_shop", "text": "Coffee/Tea Shop"},
            {"type": "convenience_store", "text": "Convenience Store"},
            {"type": "food_truck_cart", "text": "Food Truck/Cart"},
            {"type": "grocery_market", "text": "Grocery/Market"},
            {"type": "other", "text": "Other"},
            {"type": "outdoor_markets", "text": "Outdoor Markets"},
            {"type": "private_chef", "text": "Private Chef"},
            {"type": "quick_service_restaurant", "text": "Quick Service Restaurant"},
            {"type": "sit_down_restaurant", "text": "Sit-Down Restaurant"},
            {"type": "specialty_shop", "text": "Specialty Shop"}
        ],
        "health_care_and_fitness": [
            {"type": "acupuncture", "text": "Acupuncture"},
            {"type": "alternative_medicine", "text": "Alternative Medicine"},
            {"type": "care_giver", "text": "Care Giver"},
            {"type": "chiropractor", "text": "Chiropractor"},
            {"type": "dentist_orthodontist", "text": "Dentist/Orthodontist"},
            {"type": "gym_health_club", "text": "Gym/Health Club"},
            {"type": "massage_therapist", "text": "Massage Therapist"},
            {"type": "medical_practitioner", "text": "Medical Practitioner"},
            {"type": "optometrist_laser_eye_surgery", "text": "Optometrist/Eye Care"},
            {"type": "other", "text": "Other"},
            {"type": "personal_trainer", "text": "Personal Trainer"},
            {"type": "psychiatrist", "text": "Psychiatrist"},
            {"type": "therapist", "text": "Therapist"},
            {"type": "veterinary_services", "text": "Veterinary Services"}
        ],
        "home_and_repair": [
            {"type": "automotive_services", "text": "Automotive Services"},
            {"type": "carpet_cleaning", "text": "Carpet Cleaning"},
            {"type": "cleaning", "text": "Cleaning"},
            {"type": "clothing_alterations", "text": "Clothing Alteration"},
            {"type": "computer_electronics_and_appliance_repair", "text": "Computer/Electronics/Appliances"},
            {"type": "dry_cleaning_and_laundry", "text": "Dry Cleaning and Laundry"},
            {"type": "electrical_services", "text": "Electrical Services"},
            {"type": "flooring", "text": "Flooring"},
            {"type": "general_contracting", "text": "General Contracting"},
            {"type": "heating_and_air_conditioning", "text": "Heating and Air Conditioning"},
            {"type": "installation_services", "text": "Installation Services"},
            {"type": "junk_removal", "text": "Junk Removal"},
            {"type": "landscaping", "text": "Landscaping"},
            {"type": "locksmith_services", "text": "Locksmith Services"},
            {"type": "moving", "text": "Moving"},
            {"type": "other", "text": "Other"},
            {"type": "painting", "text": "Painting"},
            {"type": "pest_control", "text": "Pest Control"},
            {"type": "plumbing", "text": "Plumbing"},
            {"type": "roofing", "text": "Roofing"},
            {"type": "shoe_repair", "text": "Shoe Repair"},
            {"type": "watch_jewelry_repair", "text": "Watch/Jewelry Repair"}
        ],
        "leisure_and_entertainment": [
            {"type": "airlines", "text": "Airlines and Airline Carriers"},
            {"type": "car_rental", "text": "Car Rental"},
            {"type": "events_festivals", "text": "Events/Festivals"},
            {"type": "lodging", "text": "Hotels, Motels, Resorts, Central Reservation Services"},
            {"type": "movies_film", "text": "Movies/Film"},
            {"type": "museum_cultural", "text": "Museum/Cultural"},
            {"type": "music", "text": "Music"},
            {"type": "other", "text": "Other"},
            {"type": "performing_arts", "text": "Performing Arts"},
            {"type": "sporting_events", "text": "Sporting Events"},
            {"type": "sports_recreation", "text": "Sports Recreation"},
            {"type": "tourism", "text": "Tourism"}
        ],
        "professional_services": [
            {"type": "accounting", "text": "Accounting"},
            {"type": "child_care", "text": "Child Care"},
            {"type": "consulting", "text": "Consulting"},
            {"type": "delivery", "text": "Delivery"},
            {"type": "design", "text": "Design"},
            {"type": "interior_design", "text": "Interior Design"},
            {"type": "legal_services", "text": "Legal Services"},
            {"type": "marketing_advertising", "text": "Marketing/Advertising"},
            {"type": "nanny_services", "text": "Nanny Services"},
            {"type": "notary_services", "text": "Notary Services"},
            {"type": "other", "text": "Other"},
            {"type": "photography", "text": "Photography"},
            {"type": "printing_services", "text": "Printing Services"},
            {"type": "real_estate", "text": "Real Estate"},
            {"type": "software_development", "text": "Software Development"}
        ],
        "retail": [
            {"type": "art_photo_and_film", "text": "Art, Photo and Film"},
            {"type": "books_mags_music_and_video", "text": "Books, Mags, Music and Video"},
            {"type": "clothing_and_accessories", "text": "Clothing and Accessories"},
            {"type": "convenience_store", "text": "Convenience Store"},
            {"type": "electronics", "text": "Electronics"},
            {"type": "eyewear", "text": "Eyewear"},
            {"type": "flowers_and_gifts", "text": "Flowers and Gifts"},
            {"type": "furniture_home_goods", "text": "Furniture/Home Goods"},
            {"type": "grocery_market", "text": "Grocery/Market"},
            {"type": "hardware_store", "text": "Hardware Store"},
            {"type": "hobby_shop", "text": "Hobby Shop"},
            {"type": "jewelry_and_watches", "text": "Jewelry and Watches"},
            {"type": "office_supply", "text": "Office Supply"},
            {"type": "other", "text": "Other"},
            {"type": "outdoor_markets", "text": "Outdoor Markets"},
            {"type": "pet_store", "text": "Pet Store"},
            {"type": "specialty_shop", "text": "Specialty Shop"},
            {"type": "sporting_goods", "text": "Sporting Goods"}
        ],
        "transportation": [
            {"type": "bus", "text": "Bus"},
            {"type": "delivery", "text": "Delivery"},
            {"type": "limousine", "text": "Limousine"},
            {"type": "moving", "text": "Moving"},
            {"type": "other", "text": "Other"},
            {"type": "private_shuttle", "text": "Private Shuttle"},
            {"type": "taxi", "text": "Taxi"},
            {"type": "town_car", "text": "Town Car"}
        ]
    };

}());



