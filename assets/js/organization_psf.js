(function () {

    var tableId = "#organizations_datatable";
    $(document).ready(function () {
        organizations.setorganizations_dt();
        organizations.set_psf_onboarding();
    });
    var organizations = {
        default_business_category: 'non_profit',
        disable_onboard_form: false,
        date_of_birthImask : null,
        euidcard_expiry_dateImask : null,
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
                    {data: "ch_id", visible: false},
                    {data: "church_name", className: "", "render": function (data, type, full) {
                            let str = data == null || data == '' ? $.fn.dataTable.render.text().display('<No name provided>') : $.fn.dataTable.render.text().display(data, type, full); //sanitize
                            return str;
                        }
                    },
                    {data: "phone_no", className: "", "render": $.fn.dataTable.render.text(), visible: false},
                    {data: "ch_id", className: "text-center", orderable: false,
                        "render": function (data, type, full) {
                            if (full.account_status && full.account_status2 && full.account_status.toUpperCase() == 'ENABLED' && full.account_status2.toUpperCase() == 'ENABLED') {
                                return '<a style="color:#525f7f" href="' + base_url + '"><strong>Setup & Install</strong></a>';
                            } else {
                                return '<label style="cursor:pointer" data-church_id="' + data + '" class="btn-verify"><strong>Finish Company Setup</strong></label>';                                
                            } 
                        }
                    }, {data: "ch_id", className: "text-center", orderable: false, visible: false,
                        "render": function (data, type, full) {
                            if (full.twilio_phoneno === null) {
                                return '<label style="cursor:pointer" data-church_id="' + data + '" class="btn-generate-number"><strong>Add Text Giving</strong></label>';
                            } else {
                                return '<label style="color:darkgray">' + full.twilio_phoneno + '</label>';
                            }
                        }
                    },
                    {data: "epicpay_verification_status", className: "text-center", visible: false, orderable: false,
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
                    {data: "account_status", className: "text-center", "render": function(data){ return data ? data.toUpperCase() : '-' } },
                    {data: "account_status2", className: "text-center", "render": function(data){ return data ? data.toUpperCase() : '-' }},
                    {data: "bank_status", className: "text-center", "render": function(data){ 
                            if(data == 'VALIDATED' || data == 'SENT') { // data comes uppercased
                                return data;                                
                            } else { //move the user to try again validating the account
                                let step = global_data_helper.STARTER_STEP_BANK_CONFIRMATION;
                                return data ? `<a href="${base_url}getting_started/step/${step}">${data}<br><small>Try Again</small></a>` : '-';
                            }
                            
                        }
                    },
                    {data: "state", className: "", visible: false, "render": $.fn.dataTable.render.text()},
                    {data: "city", className: "", visible: false, "render": $.fn.dataTable.render.text()},
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
            //Event Remove Organization
            $(tableId).on('click', '.btn-remove-organization', function (e) {
                var ch_id = $(this).data('id');
                question_modal('Remove Company', 'Confirm Action')
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
                e.preventDefault();
                return false;
            });
            //Generate Number
            $(tableId).on('click', '.btn-generate-number', async function () {
                let html_countries = '';
                $.each(twilio_phone_codes, function (index, value) {
                    html_countries += '<option value="' + index + '">' + value.name + '</option>';
                });
                let html_options = '';
                $.each(global_data_helper.us_states, function (index, text) {
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
                            + '<select class="form-control country_text" id="country_text_give" name="country_text_give">'
                            + html_countries
                            + '</select>'
                            + '<select id="swal-select1" class="form-control state_text mt-1">'
                            + html_options
                            + '</select>'
                            + '</div>'
                            + '</div>',
                    focusConfirm: false,
                });
                if (res.isConfirmed == false) {
                    return;
                }

                let country = $('.country_text').val();
                let state = $('.state_text').val();
                let data_token = $("#remove_organization_form").serializeArray();
                let data = {};
                $.each(data_token, function () {
                    data[this.name] = this.value;
                });
                data['country'] = country;
                data['state'] = state;
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

            $('body').on('change','.country_text', function () {
                let country_text = $(this).val();
                if(country_text == 'US'){
                    $('.state_text').removeClass('hide');
                } else {
                    $('.state_text').addClass('hide');
                }
            });
        },
        tabsHandler: {
            tabIndex: 0,
            maxIndex: 5,
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
                    $('#btn_action').prop('disabled', false);
                    if (this.tabIndex > 0) {
                        if (this.tabIndex == 5) {//===== if is 5 and going back
                            //do not save
                        } else {
                            organizations.tabsHandler.save('close_modal');
                        }

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
                $.post(base_url + 'paysafe/save_onboarding', save_data, function (result) {
                    if (!is_close_modal) {
                        helpers.btn_enable(btn);
                    }
                    if (result.status) {
                        $("#ep_onboard_organization_form").attr('data-ch_id', result.ch_id);
                        $('#btn_action').prop('disabled', false);
                        organizations.dtTable.draw(false);
                        if (!is_close_modal) {
                            organizations.tabsHandler.updateTabs(from);
                            if (step == 3) {

                            } else if (step == 4) {
                                $('.terms_conditions_already_accepted').hide();
                                if (result.onboarding_status.terms_conditions_acceptance) {
                                    $('.terms_conditions_already_accepted').show();
                                    $('#btn_action').text('Continue');
                                } else {
                                    $('.terms_conditions_ask_message').show();
                                }
                                $('.terms_conditions_1_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard_id + '/1">Open document</a>');
                                $('.terms_conditions_2_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard_id + '/2">Terms & Conditions | Bank Accounts</a>');
                            } else if (step == 5) {
                                organizations.tabsHandler.bankValidationViewSet(result);
                            } else if (step == organizations.tabsHandler.maxIndex + 1) { //Last step
                                organizations.tabsHandler.bankValidationViewSet(result);
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
            bankValidationViewSet: function (result) {
                $('#validation_amount').prop('disabled', false).show();
                $('.microdeposit_validation_status_message').empty();
                let micros_dep_statuses = [null, 'SENT', 'ERROR', 'FAILED', 'INVALID', 'TXN_ERROR', 'TXN_FAILED',''];
                $('.eu_validation_container').addClass('hide');
                $('.eu_validation_options').addClass('hide');
                $('.uk_validation_options').addClass('hide');
                $('.microdeposit_validation_container').addClass('hide');
                //'VALIDATED'
                if (result.onboarding_status.microdeposit_validation == 'VALIDATED') {
                    $('.microdeposit_validation_status').addClass('hide');
                    $('.microdeposit_validation_container').addClass('hide');
                    $('.microdeposit_validation_container_success').removeClass('hide');
                    $('#btn_action').prop('disabled', true);
                } else {
                    if (micros_dep_statuses.includes(result.onboarding_status.microdeposit_validation)) {
                        if ($('#region').val() == 'EU' &&
                            ($('#bank_type').val() == 'SEPA' ||
                                $('#bank_type').val() == 'WIRE' ||
                                $('#bank_type').val() == 'BACS')) {
                            $('.microdeposit_validation_container').addClass('hide');
                            $('.eu_validation_container').removeClass('hide');
                            if($('select[name="step2[country]"]').val() == 'GB'){
                                $('.uk_validation_options').removeClass('hide');
                            } else {
                                $('.eu_validation_options').removeClass('hide');
                            }
                            $('#btn_action').text('Continue');
                        } else if ($('#bank_type').val() == 'ACH' || $('#bank_type').val() == 'EFT') {
                            $('.microdeposit_validation_container').removeClass('hide');
                            let status = result.onboarding_status.microdeposit_validation === null ? '' : result.onboarding_status.microdeposit_validation;

                            let errMsg = '';
                            if (status != '') {
                                errMsg = 'LAST ATTEMPT STATUS: ' + status + ' | MAX ATTEMPTS ALLOWED: 3';
                                $('#ep_onboard_organization_form').find('.alert-validation').first().html('<p>Bank Account Validation: ' + errMsg + '</p').show();
                            }
                            $('.microdeposit_validation_status').text(errMsg);
                        }
                                            }
                    if (result.onboarding_status.bank_status_blocked.status == true) {
                        $('.microdeposit_validation_container').addClass('hide');
                        $('#validation_amount').prop('disabled', true).hide();
                        $('.microdeposit_validation_status_message').append(result.onboarding_status.bank_status_blocked.error);
                        $('#btn_action').prop('disabled', true);
                    }
                }
                /////////// account
                if (result.onboarding_status.account_status_credit_card) {
                    $('.account_status_credit_card').text('STATUS: ' + result.onboarding_status.account_status_credit_card);
                }
                if (result.onboarding_status.account_status_direct_debit) {
                    $('.account_status_direct_debit').text('STATUS: ' + result.onboarding_status.account_status_direct_debit);
                }
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
                //
                this.validate(this.tabIndex - 1, 'backTab');
            }
            ,
            navHasChanged() {
                if (organizations.disable_onboard_form && this.tabIndex == this.maxIndex) {
                    $('#btn_action').text('End');
                } else {
                    if (this.tabIndex == 4) {
                        $('#btn_action').text('Accept Terms & Conditions');

                    } else if (this.tabIndex == 5) {
                        $('#btn_action').text('Submit Amount');

                    } else {
                        $('#btn_action').text('Continue');
                    }
                }

                $('#btn_back').text(this.tabIndex == 0 ? 'Close' : 'Back');
            }
        },
        enable_form: function () {
            organizations.disable_onboard_form = false;
            $("#ep_onboard_organization_form :input").prop("disabled", false);
            $("#registrationNumber").prop("disabled", true);
            $('#nationality').prop('disabled', true);
            $('#owner_gender').prop('disabled', true);
        },
        disable_form: function () {
            organizations.disable_onboard_form = true;
            $("#ep_onboard_organization_form :input").prop("disabled", true);
        },
        reset_ep_form: function () {
            organizations.tabsHandler.reset();
            $('#ep_onboard_organization_modal').find('.alert-validation').first().empty().hide();
            $('#ep_onboard_organization_form')[0].reset();
            $('#business_category').val(organizations.default_business_category).change();
            $('#btn_action').prop('disabled', false);
        },
        set_psf_onboarding: function () {
            //add dash to fed_tax_id
            //===== open modal create mode
            $('.btn-add-organization').on('click', function () {
                organizations.enable_form();
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
                
                //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
                organizations.date_of_birthImask.value = '';
                organizations.euidcard_expiry_dateImask.value = '';
                
                $('.bank_account_information_sent').addClass('hide');
                
                let ch_id = $('#ep_onboard_organization_form').attr('data-ch_id');
                if (ch_id != '0') {//edit mode load data                                        
                    $.post(base_url + 'paysafe/get_organization_all', {id: ch_id}, function (result) {
                        if (result.organization.epicpay_verification_status == 'N') {
                            //organizations.enable_form();
                        } else {
                            //organizations.disable_form();
                        }

                        let form = '#ep_onboard_organization_form';
                        $(form + ' input[name="step1[dba_name]"]').val(result.organization.church_name);
                        $(form + ' input[name="step1[legal_name]"]').val(result.organization.legal_name);
                        //$(form + ' input[name="step1[email]"]').val(result.organization.email);
                        $(form + ' input[name="step1[phone_number]"]').val(result.organization.phone_no);
                        $(form + ' input[name="step1[website]"]').val(result.organization.website);
                        
                        $(form + ' select[name="step2[country]"]').val(result.organization.country).change();
                        $(form + ' select[name="step2[state_province]"]').val(result.organization.state);
                        $(form + ' input[name="step2[city]"]').val(result.organization.city);
                        $(form + ' input[name="step2[address_line_1]"]').val(result.organization.street_address);
                        $(form + ' input[name="step2[address_line_2]"]').val(result.organization.street_address_suite);
                        $(form + ' input[name="step2[postal_code]"]').val(result.organization.postal);

                        if (result.onboard != null) {
                            $(form + ' select[name="step1[region]"]').val(result.onboard.region).change();
                            $(form + ' select[name="step1[business_category]"]').val(result.onboard.business_category).change();
                            $(form + ' select[name="step1[yearlyVolumeRange]"]').val(result.onboard.yearly_volume_range);
                            $(form + ' input[name="step1[averageTransactionAmount]"]').val(result.onboard.average_transaction_amount);
                            
                            $(form + ' select[name="step1[processing_currency]"]').val(result.onboard.currency);
                            
                            //disable auto populating when form is in update mode
                            $(form + ' input[name="step1[dynamicDescriptor]"]').val(result.onboard.dynamic_descriptor);
                            $(form + ' input[name="step1[phoneDescriptor]"]').val(result.onboard.phone_descriptor);

                            $(form + ' select[name="step1[businessType]"]').val(result.onboard.business_type).change();
                            $(form + ' input[name="step1[federalTaxNumber]"]').val(result.onboard.federal_tax_number);
                            $(form + ' input[name="step1[registrationNumber]"]').val(result.onboard.registration_number);

                            $(form + ' select[name="step2[trading_country]"]').val(result.onboard.trading_country).change();
                            $(form + ' select[name="step2[trading_state_province]"]').val(result.onboard.trading_state);
                            $(form + ' input[name="step2[trading_city]"]').val(result.onboard.trading_city);
                            $(form + ' input[name="step2[trading_address_line_1]"]').val(result.onboard.trading_address_line_1);
                            $(form + ' input[name="step2[trading_address_line_2]"]').val(result.onboard.trading_address_line_2);
                            $(form + ' input[name="step2[trading_postal_code]"]').val(result.onboard.trading_zip);

                            $(form + ' input[name="step3[first_name]"]').val(result.onboard.owner_first_name);
                            $(form + ' input[name="step3[last_name]"]').val(result.onboard.owner_last_name);
                            $(form + ' input[name="step3[title]"]').val(result.onboard.owner_title);
                            $(form + ' input[name="step3[phone_number]"]').val(result.onboard.owner_phone);
                            $(form + ' select[name="step3[business_owner_is_european]"]').val(result.onboard.owner_is_european).change();
                            $(form + ' select[name="step3[nationality]"]').val(result.onboard.owner_nationality);
                            $(form + ' select[name="step3[owner_gender]"]').val(result.onboard.owner_gender);
                            $(form + ' input[name="step3[ssn]"]').val(result.onboard.owner_ssn);

                            $(form + ' select[name="step3[owner_current_country]"]').val(result.onboard.owner_current_country).change();
                            $(form + ' select[name="step3[owner_current_state_province]"]').val(result.onboard.owner_current_state);
                            $(form + ' input[name="step3[owner_current_city]"]').val(result.onboard.owner_current_city);
                            $(form + ' input[name="step3[owner_current_postal_code]"]').val(result.onboard.owner_current_zip);
                            $(form + ' input[name="step3[owner_current_address_line_1]"]').val(result.onboard.owner_current_address_line_1);
                            $(form + ' input[name="step3[owner_current_address_line_2]"]').val(result.onboard.owner_current_address_line_2);
                            $(form + ' select[name="step3[years_at_address]"]').val(result.onboard.region != 'US' ? result.onboard.years_at_address : '').change();

                            $(form + ' select[name="step3[owner_previous_country]"]').val(result.onboard.owner_previous_country).change();
                            $(form + ' select[name="step3[owner_previous_state_province]"]').val(result.onboard.owner_previous_state);
                            $(form + ' input[name="step3[owner_previous_city]"]').val(result.onboard.owner_previous_city);
                            $(form + ' input[name="step3[owner_previous_postal_code]"]').val(result.onboard.owner_previous_zip);
                            $(form + ' input[name="step3[owner_previous_address_line_1]"]').val(result.onboard.owner_previous_address_line_1);
                            $(form + ' input[name="step3[owner_previous_address_line_2]"]').val(result.onboard.owner_previous_address_line_2);

                            $(form + ' input[name="step3[euidcard_number]"]').val(result.onboard.euidcard_number);
                            $(form + ' select[name="step3[euidcard_country_issue]"]').val(result.onboard.euidcard_country_of_issue).change();
                            $(form + ' input[name="step3[id_number_line_1]"]').val(result.onboard.euidcard_number_line_1);
                            $(form + ' input[name="step3[id_number_line_2]"]').val(result.onboard.euidcard_number_line_2);
                            $(form + ' input[name="step3[id_number_line_3]"]').val(result.onboard.euidcard_number_line_3);

                            $('#bank_type').val(result.onboard.bank_type).change();
                            if (result.onboarding_status.bank_account_created_1) {
                                $(form + ' input[name^="step4"]').prop('disabled', true);
                                $(form + ' select[name^="step4"]').prop('disabled', true);
                                $('.bank_account_information_sent').removeClass('hide');
                            }

                            $(form + ' input[name="step6[validation_amount]"]').val(result.onboard.validation_amount);

                            if(result.onboard.owner_birth) {
                                //$('#date_of_birth').datepicker('setDate', moment(result.onboard.owner_birth).format("L"));
                                $('#date_of_birth').val(moment(result.onboard.owner_birth).format("L"));
                                organizations.date_of_birthImask.value = moment(result.onboard.owner_birth).format("L");
                                //..iMask.updateValue() also could be used here
                            }
                            
                            if(result.onboard.euidcard_expiry_date) {
                                //$('#eu_xpry_date').datepicker('setDate', moment(result.onboard.euidcard_expiry_date).format("L"));
                                $('#eu_xpry_date').val(moment(result.onboard.euidcard_expiry_date).format("L"));
                                organizations.euidcard_expiry_dateImask.value = moment(result.onboard.euidcard_expiry_date).format("L");
                                //..iMask.updateValue() also could be used here
                            }
                            
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
            //=== Load regions
            $('#region').append($('<option>', {value: '', text: '— Please Select —'}));
            $('#processingCurrency').empty().append($('<option>', {value: '', text: '— Please Select —'}));
            $.each(global_data_helper.paysafe_regions, function (value, obj) {
                $('#region').append($('<option>', {value: value, text: obj.name}));
            });
            $('#region').on('change', function () {
                //=== Load businessCategory
                let datax = $(this).val() == 'US' || $(this).val() == 'CA' ? merchant_category_codes_us_ca : ($(this).val() == 'EU' ? merchant_category_codes_eu : business_category_empty);
                $('#businessCategory').empty();
                $.each(datax, function (value, text) {
                    $('#businessCategory').append($('<option>', {value: value, text: text}));
                });
                //populate descriptor on dba/region change
                let text = $('#dba_name').val() + ($('#region').val() != '0' ? (' ' + $('#region').val()) : '');
                text = text.toUpperCase();
                $('#dynamicDescriptor').val(text);
                //enable for europe only
                $("#registrationNumber").prop('disabled', $(this).val() != 'EU');
                $("#registrationNumber").val('');
                //set input maxlength for depending on location, value are in the html
                let length = $(this).val() == 'EU' ? $("#federalTaxNumber").attr('europe-length') : $("#federalTaxNumber").attr('default-length');
                $("#federalTaxNumber").attr('maxlength', length);

                //change EU Labels
                $('#taxNumberLabel').text($(this).val() == 'EU' ? $('#taxNumberLabel').attr('data-eu') : $('#taxNumberLabel').attr('data-us'));

                $('#ssn').prop('disabled', true);
                $('#ssn').val('');
                if ($(this).val() == 'US') {
                    $('#ssn').prop('disabled', false);
                    $('#ssn').val('');
                }
                
                //load currencies
                let region = $(this).val();
                $('#processingCurrency').empty();
                $('#processingCurrency').append($('<option>', {value: '', text: '— Please Select —'}));
                
                $('#bank_type').empty();
                $('#bank_type').append($('<option>', {value: '', text: '— Please Select —'}));
                if(region != "") {
                    $.each(global_data_helper.paysafe_regions[region].available_currencies, function (value, text) {                    
                        $('#processingCurrency').append($('<option>', {value: text, text: text}));
                    });
                    $("#processingCurrency option:eq(1)").attr("selected", "selected"); //load the first option after - Please Select -
                    
                    $.each(global_data_helper.paysafe_regions[region].available_merchant_banks, function (value, text) {                    
                        $('#bank_type').append($('<option>', {value: text, text: text}));
                    });
                }
                
                $('#bank_type').change();
                
                $('#businessType').change();
            });

            $('#businessType').on('change', function () {
                if($('#region').val() == 'US') {
                    $('#ssn').prop('disabled', false);
                    if ($(this).val() == 'NPCORP' || $(this).val() == 'CHARITY' || $(this).val() == 'GOV') {
                        $('#ssn').prop('disabled', true);
                        $('#ssn').val('');
                    }
                }
            });

            $('#dba_name').on('input change paste', function () {
                //populate descriptor on dba/region change
                let text = $('#dba_name').val() + ($('#region').val() != '0' ? (' ' + $('#region').val()) : '');
                text = text.toUpperCase();
                $('#dynamicDescriptor').val(text);
            });
            $('#phone_number1').on('input change paste', function () {
                //populate descriptor on dba/region change
                let text = $(this).val();
                text = text.toUpperCase();
                $('#phoneDescriptor').val(text);
            });

            $('#businessCategory').empty();
            $.each(business_category_empty, function (value, text) {
                $('#businessCategory').append($('<option>', {value: value, text: text}));
            });
            
            $('#country').empty();
            $.each(countries_all, function (value, text) {
                $('#country').append($('<option>', {value: value, text: text}));
            });

            $('#nationality').empty();
            $.each(state_province_empty, function (value, text) {
                $('#nationality').append($('<option>', {value: value, text: text}));
            });
            
            $('#owner_gender').empty();
            $.each(state_province_empty, function (value, text) {
                $('#owner_gender').append($('<option>', {value: value, text: text}));
            });
            
            $('#business_owner_is_european').on('change', function () {
                let nationalities = {};
                let gender_options = {};
                $('#nationality').prop('disabled', false);
                $('#owner_gender').prop('disabled', false);
                if ($(this).val() == 'Yes') {
                    nationalities = nationalities_all;
                    gender_options = gender_options_all;
                    $('.cont-eu-identity-card').removeClass('hide');
                } else {
                    nationalities = nationalities_empty;
                    gender_options = gender_options_empty;
                    $('#nationality').prop('disabled', true);
                    $('#owner_gender').prop('disabled', true);
                    $('.cont-eu-identity-card').addClass('hide');
                }

                $('#nationality').empty();
                $.each(nationalities, function (value, text) {
                    $('#nationality').append($('<option>', {value: value, text: text}));
                });
                
                $('#owner_gender').empty();
                $.each(gender_options, function (value, text) {
                    $('#owner_gender').append($('<option>', {value: value, text: text}));
                });
            });
            

            $('#trading_country').empty();
            $.each(countries_all, function (value, text) {
                $('#trading_country').append($('<option>', {value: value, text: text}));
            });

            $('#owner_current_country').empty();
            $.each(countries_all, function (value, text) {
                $('#owner_current_country').append($('<option>', {value: value, text: text}));
            });

            $('#owner_previous_country').empty();
            $.each(countries_all, function (value, text) {
                $('#owner_previous_country').append($('<option>', {value: value, text: text}));
            });

            $('#state_province1').empty();
            $.each(state_province_empty, function (value, text) {
                $('#state_province1').append($('<option>', {value: value, text: text}));
            });

            $('#trading_state_province1').empty();
            $.each(state_province_empty, function (value, text) {
                $('#trading_state_province1').append($('<option>', {value: value, text: text}));
            });

            $('#current_state_province1').empty();
            $.each(state_province_empty, function (value, text) {
                $('#current_state_province1').append($('<option>', {value: value, text: text}));
            });

            $('#previous_state_province1').empty();
            $.each(state_province_empty, function (value, text) {
                $('#previous_state_province1').append($('<option>', {value: value, text: text}));
            });

            $('#wire_beneficiary_country').empty();
            $.each(countries_all, function (value, text) {
                $('#wire_beneficiary_country').append($('<option>', {value: value, text: text}));
            });

            $('#wire_beneficiary_bank_country').empty();
            $.each(countries_all, function (value, text) {
                $('#wire_beneficiary_bank_country').append($('<option>', {value: value, text: text}));
            });

            $('#sepa_country').empty();
            $.each(countries_all, function (value, text) {
                $('#sepa_country').append($('<option>', {value: value, text: text}));
            });

            $('#bacs_country').empty();
            $.each(countries_all, function (value, text) {
                $('#bacs_country').append($('<option>', {value: value, text: text}));
            });


            $('#region').on('change', function () {
                $('#years_at_address').prop('disabled', false);
                $('#years_at_address').val('');
                if ($(this).val() == 'US') {
                    $('#years_at_address').prop('disabled', true);
                }
            });

            $('#years_at_address').on('change', function () {
                $('.cont-prev-addr').addClass('hide');
                if ($(this).val() != '' && $(this).val() < 3) {
                    $('.cont-prev-addr').removeClass('hide');
                }

            });

            $('#country').on('change', function () {
                let sta_prv = {};
                $('#state_province1').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#state_province1').prop('disabled', true);
                }

                $('#state_province1').empty();
                $.each(sta_prv, function (value, text) {
                    $('#state_province1').append($('<option>', {value: value, text: text}));
                });
            });

            $('#trading_country').on('change', function () {
                let sta_prv = {};
                $('#trading_state_province1').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#trading_state_province1').prop('disabled', true);
                }

                $('#trading_state_province1').empty();
                $.each(sta_prv, function (value, text) {
                    $('#trading_state_province1').append($('<option>', {value: value, text: text}));
                });
            });

            $('#owner_current_country').on('change', function () {
                let sta_prv = {};
                $('#current_state_province1').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#current_state_province1').prop('disabled', true);
                }

                $('#current_state_province1').empty();
                $.each(sta_prv, function (value, text) {
                    $('#current_state_province1').append($('<option>', {value: value, text: text}));
                });
            });

            $('#owner_previous_country').on('change', function () {
                let sta_prv = {};
                $('#previous_state_province1').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#previous_state_province1').prop('disabled', true);
                }

                $('#previous_state_province1').empty();
                $.each(sta_prv, function (value, text) {
                    $('#previous_state_province1').append($('<option>', {value: value, text: text}));
                });
            });

            $('#bank_type').on('change',function(){
                $('#ep_onboard_organization_modal').find('.alert-validation').empty().hide();
                $('.bank_type').addClass('hide');
                if($(this).val()) {
                    $bank_type = $(this).val().toLowerCase();                    
                    $('.' + $bank_type + '_type').removeClass('hide');
                }
            });

            $('#euidcard_country_issue').empty();
            $.each(countries_all, function (value, text) {
                $('#euidcard_country_issue').append($('<option>', {value: value, text: text}));
            });

            //=== Load yearlyVolumeRange
            $.each(yearly_volume_range, function (value, text) {
                $('#yearlyVolumeRange').append($('<option>', {value: value, text: text}));
            });
            //=== Load yearlyVolumeRange
            $.each(business_type_codes, function (value, text) {
                $('#businessType').append($('<option>', {value: value, text: text}));
            });
            
            /*
             var date_of_birth = $('#date_of_birth').datepicker({
             format: "mm/dd/yyyy",
             endDate: "0m",
             orientation: 'bottom',
             startView: 2
             }).on('changeDate', function (ev) {
             date_of_birth.hide();
             }).data('datepicker');
             */
                
            let momentFormat = 'MM/DD/YYYY';
            organizations.date_of_birthImask = IMask(document.getElementById('date_of_birth'), {
              mask: Date,
              pattern: momentFormat,
              lazy: false,
              min: new Date(1900, 0, 1),
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
            
            /*
            var euicard_expiry_date = $('#eu_xpry_date').datepicker({
                format: "mm/dd/yyyy",
                orientation: 'bottom',
                startView: 2
            }).on('changeDate', function (ev) {
                euicard_expiry_date.hide();
            }).data('datepicker');
            */
           
           organizations.euidcard_expiry_dateImask = IMask(document.getElementById('eu_xpry_date'), {
              mask: Date,
              pattern: momentFormat,
              lazy: false,
              min: new Date(new Date().getFullYear(), 0, 1), //expiry date
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
        }
    };
    let business_category_empty = {'': '— Please Select —'};
    let state_province_empty = {'': '— Please Select —'}; //verifyx reused in dropdownlist differnet thatn state_provice too, not ideal, each drop down should have his own emptydata
    let nationalities_empty = {'': '— Please Select —'};
    let gender_options_empty = {'': '— Please Select —'};

    let yearly_volume_range = {
        '': '— Please Select —',
        'LOW': '$0 - $50k',
        'MEDIUM': '$50k - $100k',
        'HIGH': '$100k - $250k',
        'VERY_HIGH': '$250k+'
    };
    let merchant_category_codes_us_ca = {
        '': '— Please Select —',
        'CHARITY': 'Charity',
        'ACCT': 'Accounting',
        'ART': 'Artist Supply and Craft Stores',
        'BEAUTY': 'Barber & Beauty Shop',
        'CATERING': 'Catering',
        'CLEANING': 'Cleaning Services',
        'CONSULTANT': 'Consultant',
        'CONTRACTOR': 'Trade Contractor',
        'DENTIST': 'Dentistry',
        'EDU': 'Schools & Education',
        'FOOD': 'Food/Grocery',
        'LANDSCAPING': 'Landscaping',
        'LEGAL': 'Legal Services',
        'MEDICAL_PRACT': 'Medical Practitioner',
        'MEDICAL_SERV': 'Health Services',
        'MEMBERSHIP': 'Membership Org.',
        'MISC_FOOD_STORES': 'Misc. Food Stores',
        'MISC_MERCH': 'Misc General Merchandise',
        'MISC_SERV': 'Services',
        'MUSIC': 'Music/Entertainment',
        'PC': 'Computer Services',
        'PHOTO_FILM': 'Photo/FILM',
        'PROF_SERV': 'Professional Services',
        'REAL_ESTATE': 'Real Estate',
        'RECREATION': 'Recreation Services',
        'REPAIR': 'Repair Services',
        'RESTO': 'Restaurant/Bar',
        'RETAIL': 'Direct Marketing Retail (MOTO)',
        'TAXI': 'Taxi/Limo',
        'VET': 'Veterinary',
        'WEB_DEV': 'Web Design',
        'WEB_HOSTING': 'Web Hosting'
    };
    let merchant_category_codes_eu = {
        '': '— Please Select —',
        'CHARITY': 'Charity',
        'ACCT': 'Accounting',
        'ADV': 'Advertising Services',
        'ART': 'Artist Supply and Craft Stores',
        'BEAUTY': 'Barber & Beauty Shop',
        'BUS_SERV': 'Business Services',
        'CATERING': 'Catering',
        'CLEANING': 'Cleaning Services',
        'CLUBS': 'Clubs, Membership',
        'COMPUTERS': 'Computers',
        'CONSULTANT': 'Consultant',
        'CONTRACTOR': 'Trade Contractor',
        'COUNSELLING': 'Counselling',
        'DANCE_SCHOOL_STUDIO': 'Dance Hall, School, Studio',
        'DENTIST': 'Dentistry',
        'DOCTOR': 'Doctor',
        'EDU': 'Schools & Education',
        'ELECTRO': 'Electronic Stores',
        'FLORIST': 'Florists',
        'FOOD': 'Food/Grocery',
        'HEALTH_BEAUTY': 'Health & Beauty Spa',
        'INS_SALES': 'Insurance Sales, Underwriting, & Premiums',
        'LANDSCAPING': 'Landscaping',
        'LEGAL': 'Legal Services',
        'MEDICAL_PRACT': 'Medical Practitioner',
        'MEDICAL_SERV': 'Health Services',
        'MEMBERSHIP': 'Membership Org.',
        'MEN_WOMEN_CLOTHING': 'Men\'s & Women\'s Clothing Stores',
        'MISC_APP': 'Miscellaneous Apparel & Accessory Shops',
        'MISC_FOOD_STORES': 'Misc. Food Stores',
        'MISC_HOME': 'Miscellaneous Home Furnishing Speciality Stores',
        'MISC_MERCH': 'Misc General Merchandise',
        'MISC_SERV': 'Services',
        'PC': 'Computer Services',
        'PHOTO_FILM': 'Photo/FILM',
        'PROF_SERV': 'Professional Services',
        'RAZOR_STORE': 'Electric Razor Store',
        'REAL_ESTATE': 'Real Estate',
        'RECREATION': 'Recreation Services',
        'RECRE_SPORT_CAMPS': 'Recreation & Sporting Camps',
        'REPAIR': 'Repair Services',
        'RESTO': 'Restaurant/Bar',
        'RETAIL': 'Direct Marketing Retail (MOTO)',
        'SHOE_STORE': 'Shoe Stores',
        'SPORTS': 'Sports',
        'SPORT_GOODS_STORE': 'Sporting Goods Store',
        'TAXI': 'Taxi/Limo',
        'THEATRE': 'Theatre',
        'VET': 'Veterinary',
        'WEB_DEV': 'Web Design'
    };
    let business_type_codes = {
        '': '— Please Select —',
        'CHARITY': 'Charity',
        'CIC': 'Community Interest Company',
        'CORP': 'Corporation',
        'LTD': 'Limited',
        'LLC': 'Limited Liability Company',
        'LLP': 'Limited Liability Partnership',
        'NPCORP': 'Non-Profit',
        'PARTNERSHP': 'Partnership',
        'PLC': 'Public Limited Company',
        'GOV': 'Public Sector/Governmental',
        'SOLEPROP': 'Sole Proprietorship/Sole Trader',
        'TRUST': 'Trust'

    };

    let countries_all = {
        '': '— Please Select —',
        "US": "United States",
        "CA": "Canada",
        "AF": "Afghanistan",
        "AX": "Åland Islands",
        "AL": "Albania",
        "DZ": "Algeria",
        "AS": "American Samoa",
        "AD": "Andorra",
        "AO": "Angola",
        "AI": "Anguilla",
        "AQ": "Antarctica",
        "AG": "Antigua and Barbuda",
        "AR": "Argentina",
        "AM": "Armenia",
        "AW": "Aruba",
        "AU": "Australia",
        "AT": "Austria",
        "AZ": "Azerbaijan",
        "BS": "Bahamas",
        "BH": "Bahrain",
        "BD": "Bangladesh",
        "BB": "Barbados",
        "BY": "Belarus",
        "BE": "Belgium",
        "BZ": "Belize",
        "BJ": "Benin",
        "BM": "Bermuda",
        "BT": "Bhutan",
        "BO": "Bolivia",
        "BQ": "Bonaire, Sint Eustatius and Saba",
        "BA": "Bosnia and Herzegovina",
        "BW": "Botswana",
        "BV": "Bouvet Island",
        "BR": "Brazil",
        "IO": "British Indian Ocean Territory",
        "BN": "Brunei Darussalam",
        "BG": "Bulgaria",
        "BF": "Burkina Faso",
        "BI": "Burundi",
        "KH": "Cambodia",
        "CM": "Cameroon",
        "CV": "Cape Verde",
        "KY": "Cayman Islands",
        "CF": "Central African Republic",
        "TD": "Chad",
        "CL": "Chile",
        "CN": "China",
        "CX": "Christmas Island",
        "CC": "Cocos (Keeling) Islands",
        "CO": "Colombia",
        "KM": "Comoros",
        "CG": "Congo",
        "CD": "Congo, Democratic Republic of",
        "CK": "Cook Islands",
        "CR": "Costa Rica",
        "CI": "Côte D’Ivoire",
        "HR": "Croatia",
        "CU": "Cuba",
        "CW": "Curaçao",
        "CY": "Cyprus",
        "CZ": "Czech Republic",
        "DK": "Denmark",
        "DJ": "Djibouti",
        "DM": "Dominica",
        "DO": "Dominican Republic",
        "EC": "Ecuador",
        "EG": "Egypt",
        "SV": "El Salvador",
        "GQ": "Equatorial Guinea",
        "ER": "Eritrea",
        "EE": "Estonia",
        "ET": "Ethiopia",
        "FK": "Falkland Islands",
        "FO": "Faroe Islands",
        "FJ": "Fiji",
        "FI": "Finland",
        "FR": "France",
        "GF": "French Guiana",
        "PF": "French Polynesia",
        "TF": "French Southern Territories",
        "GA": "Gabon",
        "GM": "Gambia",
        "GE": "Georgia",
        "DE": "Germany",
        "GH": "Ghana",
        "GI": "Gibraltar",
        "GR": "Greece",
        "GL": "Greenland",
        "GD": "Grenada",
        "GP": "Guadeloupe",
        "GU": "Guam",
        "GT": "Guatemala",
        "GG": "Guernsey",
        "GN": "Guinea",
        "GW": "Guinea-Bissau",
        "GY": "Guyana",
        "HT": "Haiti",
        "HM": "Heard and McDonald Islands",
        "HN": "Honduras",
        "HK": "Hong Kong",
        "HU": "Hungary",
        "IS": "Iceland",
        "IN": "India",
        "ID": "Indonesia",
        "IR": "Iran  (Islamic Republic of)",
        "IQ": "Iraq",
        "IE": "Ireland",
        "IM": "Isle of Man",
        "IL": "Israel",
        "IT": "Italy",
        "JM": "Jamaica",
        "JP": "Japan",
        "JE": "Jersey",
        "JO": "Jordan",
        "KZ": "Kazakhstan",
        "KE": "Kenya",
        "KI": "Kiribati",
        "KP": "Korea, Democratic People’s Republic",
        "KR": "Korea, Republic of",
        "KW": "Kuwait",
        "KG": "Kyrgyzstan",
        "LA": "Lao People’s Democratic Republic",
        "LV": "Latvia",
        "LB": "Lebanon",
        "LS": "Lesotho",
        "LR": "Liberia",
        "LY": "Libyan Arab Jamahiriya",
        "LI": "Liechtenstein",
        "LT": "Lithuania",
        "LU": "Luxembourg",
        "MO": "Macau",
        "MK": "Macedonia",
        "MG": "Madagascar",
        "MW": "Malawi",
        "MY": "Malaysia",
        "MV": "Maldives",
        "ML": "Mali",
        "MT": "Malta",
        "MH": "Marshall Islands",
        "MQ": "Martinique",
        "MR": "Mauritania",
        "MU": "Mauritius",
        "YT": "Mayotte",
        "MX": "Mexico",
        "FM": "Micronesia, Federated States of",
        "MD": "Moldova, Republic of",
        "MC": "Monaco",
        "MN": "Mongolia",
        "ME": "Montenegro",
        "MS": "Montserrat",
        "MA": "Morocco",
        "MZ": "Mozambique",
        "MM": "Myanmar",
        "NA": "Namibia",
        "NR": "Nauru",
        "NP": "Nepal",
        "NC": "New Caledonia",
        "NZ": "New Zealand",
        "NI": "Nicaragua",
        "NE": "Niger",
        "NG": "Nigeria",
        "NU": "Niue",
        "NF": "Norfolk Island",
        "MP": "Northern Mariana Islands",
        "NO": "Norway",
        "OM": "Oman",
        "PK": "Pakistan",
        "PW": "Palau",
        "PS": "Palestinian Territory, Occupied",
        "PA": "Panama",
        "PG": "Papua New Guinea",
        "PY": "Paraguay",
        "PE": "Peru",
        "PH": "Philippines",
        "PN": "Pitcairn",
        "PL": "Poland",
        "PT": "Portugal",
        "PR": "Puerto Rico",
        "QA": "Qatar",
        "RE": "Reunion",
        "RO": "Romania",
        "RU": "Russian Federation",
        "RW": "Rwanda",
        "BL": "Saint Barthélemy",
        "SH": "Saint Helena",
        "KN": "Saint Kitts and Nevis",
        "LC": "Saint Lucia",
        "MF": "Saint Martin",
        "VC": "Saint Vincent and the Grenadines",
        "WS": "Samoa",
        "SM": "San Marino",
        "ST": "Sao Tome and Principe",
        "SA": "Saudi Arabia",
        "SN": "Senegal",
        "RS": "Serbia",
        "SC": "Seychelles",
        "SL": "Sierra Leone",
        "SG": "Singapore",
        "SX": "Sint Maarten",
        "SK": "Slovakia (Slovak Republic)",
        "SI": "Slovenia",
        "SB": "Solomon Islands",
        "SO": "Somalia",
        "ZA": "South Africa",
        "GS": "South Georgia and the South Sandwich Islands",
        "SS": "South Sudan",
        "ES": "Spain",
        "LK": "Sri Lanka",
        "PM": "St. Pierre and Miquelon",
        "SD": "Sudan",
        "SR": "Suriname",
        "SJ": "Svalbard and Jan Mayen Islands",
        "SZ": "Swaziland",
        "SE": "Sweden",
        "CH": "Switzerland",
        "SY": "Syrian Arab Republic",
        "TW": "Taiwan",
        "TJ": "Tajikistan",
        "TZ": "Tanzania, United Republic of",
        "TH": "Thailand",
        "NL": "The Netherlands",
        "TL": "Timor-Leste",
        "TG": "Togo",
        "TK": "Tokelau",
        "TO": "Tonga",
        "TT": "Trinidad and Tobago",
        "TN": "Tunisia",
        "TR": "Turkey",
        "TM": "Turkmenistan",
        "TC": "Turks and Caicos Islands",
        "TV": "Tuvalu",
        "UG": "Uganda",
        "UA": "Ukraine",
        "AE": "United Arab Emirates",
        "GB": "United Kingdom",
        "UM": "United States Minor Outlying Islands",
        "UY": "Uruguay",
        "UZ": "Uzbekistan",
        "VU": "Vanuatu",
        "VA": "Vatican City State (Holy See)",
        "VE": "Venezuela",
        "VN": "Vietnam",
        "VG": "Virgin Islands (British)",
        "VI": "Virgin Islands (U.S.)",
        "WF": "Wallis and Futuna Islands",
        "EH": "Western Sahara",
        "YE": "Yemen",
        "ZM": "Zambia",
        "ZW": "Zimbabwe"
    };

    let provinces_ca = {
        '': '— Please Select —',
        'AB': 'Alberta',
        'BC': 'British Columbia',
        'MB': 'Manitoba',
        'NB': 'New Brunswick',
        'NL': 'Newfoundland',
        'NS': 'Nova Scotia',
        'NT': 'Northwest Territories',
        'NU': 'Nunavut',
        'ON': 'Ontario',
        'PE': 'Prince Edward Island',
        'QC': 'Quebec',
        'SK': 'Saskatchewan',
        'YT': 'Yukon'
    };
    
    let gender_options_all = {
        '': '— Please Select —',
        "M": "Male",
        "F": "Female"
    };

    let nationalities_all = {
        '': '— Please Select —',
        "AF": "Afghani",
        "AL": "Albanian",
        "DZ": "Algerian",
        "US": "American",
        "AS": "American Samoan",
        "AD": "Andorran",
        "AO": "Angolan",
        "AI": "Anguillan",
        "AQ": "Antarctic",
        "AG": "Antiguan",
        "AR": "Argentine",
        "AM": "Armenian",
        "AW": "Arubian",
        "AU": "Australian",
        "AT": "Austrian",
        "AZ": "Azerbaijani",
        "BS": "Bahameese",
        "BH": "Bahrainian",
        "BD": "Bangladeshi",
        "BB": "Barbadian",
        "BL": "Barthélemois",
        "BY": "Belarusian",
        "BE": "Belgian",
        "BZ": "Belizean",
        "BJ": "Beninese",
        "BM": "Bermudan",
        "BT": "Bhutanese",
        "BO": "Bolivian",
        "BA": "Bosnian",
        "BR": "Brazilian",
        "GB": "British",
        "BN": "Bruneian",
        "BG": "Bulgarian",
        "BF": "Burkinabe",
        "BI": "Burundian",
        "KH": "Cambodian",
        "CM": "Cameroonian",
        "CA": "Canadian",
        "CV": "Cape Verdean",
        "KY": "Caymanian",
        "CF": "Central African",
        "TD": "Chadian",
        "CL": "Chilean",
        "CN": "Chinese",
        "CX": "Christmas Islander",
        "CC": "Cocossian",
        "CO": "Colombian",
        "KM": "Comoran",
        "CG": "Congolese",
        "CD": "Congolese (Democratic Republic of the Congo)",
        "CK": "Cook Islander",
        "CR": "Costa Rican",
        "HR": "Croatian",
        "CU": "Cuban",
        "CW": "Curaçaoan",
        "CY": "Cypriot",
        "CZ": "Czech",
        "DK": "Danish",
        "DJ": "Djiboutian",
        "DM": "Dominican (Commonwealth)",
        "DO": "Dominican (Republic)",
        "NL": "Dutch",
        "EC": "Ecuadorean",
        "EG": "Egyptian",
        "AE": "Emirian",
        "GQ": "Equatorial Guinean",
        "ER": "Eritrean",
        "EE": "Estonian",
        "ET": "Ethiopian",
        "FK": "Falkland Islander",
        "FO": "Faroese",
        "FJ": "Fijian",
        "PH": "Filipino",
        "FI": "Finnish",
        "FR": "French",
        "GF": "French Guianese",
        "PF": "French Polynesian",
        "GA": "Gabonese",
        "GM": "Gambian",
        "GE": "Georgian",
        "DE": "German",
        "GH": "Ghanaian",
        "GI": "Gibralterian",
        "GR": "Greek",
        "GL": "Greenlander",
        "GD": "Grenadian",
        "GP": "Guadeloupean",
        "GU": "Guamanian",
        "GT": "Guatemalan",
        "GW": "Guinea-Bissau nationals",
        "GN": "Guinean",
        "GY": "Guyanese",
        "HT": "Haitian",
        "HN": "Honduran",
        "HK": "Hong Konger",
        "HU": "Hungarian",
        "KI": "I-Kiribati",
        "IS": "Icelander",
        "IN": "Indian",
        "ID": "Indonesian",
        "IR": "Iranian",
        "IQ": "Iraqi",
        "IE": "Irish",
        "IL": "Israeli",
        "IT": "Italian",
        "CI": "Ivorian",
        "JM": "Jamaican",
        "JP": "Japanese",
        "JO": "Jordanian",
        "KZ": "Kazakhstani",
        "KE": "Kenyan",
        "KN": "Kittian",
        "KW": "Kuwaiti",
        "KG": "Kyrgyzstani",
        "LA": "Laotian",
        "LV": "Latvian",
        "LB": "Lebanese",
        "LR": "Liberian",
        "LY": "Libyan",
        "LI": "Liechtensteiner",
        "LT": "Lithunian",
        "LU": "Luxembourger",
        "MO": "Macanese",
        "MK": "Macedonian",
        "YT": "Mahoran",
        "MG": "Malagasy",
        "MW": "Malawian",
        "MY": "Malaysian",
        "MV": "Maldivan",
        "ML": "Malian",
        "MT": "Maltese",
        "IM": "Manx",
        "MH": "Marshallese",
        "MQ": "Martinican",
        "MR": "Mauritanian",
        "MU": "Mauritian",
        "MX": "Mexican",
        "FM": "Micronesian",
        "MD": "Moldovan",
        "MC": "Monacan",
        "MN": "Mongolian",
        "ME": "Montenegrin",
        "MS": "Montserratian",
        "MA": "Moroccan",
        "LS": "Mosotho",
        "BW": "Motswana",
        "MZ": "Mozambican",
        "MM": "Myanmarese",
        "NA": "Namibian",
        "NR": "Nauruan",
        "NP": "Nepalese",
        "NC": "New Caledonian",
        "NZ": "New Zealander",
        "VU": "Ni-Vanuatu",
        "NI": "Nicaraguan",
        "NG": "Nigerian",
        "NE": "Nigerien",
        "NU": "Niuean",
        "NF": "Norfolk Islander",
        "KP": "North Korean",
        "MP": "Northern Mariana Islander",
        "NO": "Norwegian",
        "OM": "Omani",
        "PK": "Pakistani",
        "PW": "Palauan",
        "PS": "Palestinian",
        "PA": "Panamanian",
        "PG": "Papua New Guinean",
        "PY": "Paraguayan",
        "PE": "Peruvian",
        "PN": "Pitcairn Islander",
        "PL": "Polish",
        "PT": "Portuguese",
        "PR": "Puerto Rican",
        "QA": "Qatari",
        "RO": "Romanian",
        "RU": "Russian",
        "RW": "Rwandan",
        "SH": "Saint Helenian",
        "LC": "Saint Lucian",
        "VC": "Saint Vincentian",
        "PM": "Saint-Pierrais",
        "SV": "Salvadorean",
        "WS": "Samoan",
        "SM": "Sanmarinese",
        "SA": "Saudi Arabian",
        "SN": "Senegalese",
        "RS": "Serbian",
        "SC": "Seychellois",
        "SL": "Sierra Leonean",
        "SG": "Singaporean",
        "SK": "Slovakian",
        "SI": "Slovenian",
        "SB": "Solomon Islander",
        "SO": "Somali",
        "ZA": "South African",
        "KR": "South Korean",
        "ES": "Spanish",
        "LK": "Sri Lankan",
        "SD": "Sudanese",
        "SS": "Sudanese (South Sudan)",
        "SR": "Surinamer",
        "SZ": "Swazi",
        "SE": "Swedish",
        "CH": "Swiss",
        "SY": "Syrian",
        "ST": "São Tomean",
        "TW": "Taiwanese",
        "TJ": "Tajikistani",
        "TZ": "Tanzanian",
        "TH": "Thai",
        "TL": "Timorese",
        "TG": "Togolese",
        "TK": "Tokelauan",
        "TO": "Tongan",
        "TT": "Trinidadian",
        "TN": "Tunisian",
        "TR": "Turkish",
        "TM": "Turkmen",
        "TC": "Turks and Caicos Islander",
        "TV": "Tuvaluan",
        "UG": "Ugandan",
        "UA": "Ukrainian",
        "UY": "Uruguayan",
        "UZ": "Uzbekistani",
        "VE": "Venezuelan",
        "VN": "Vietnamese",
        "VG": "Virgin Islander (British Virgin Islands)",
        "WF": "Wallisian",
        "EH": "Western Saharan",
        "YE": "Yemeni",
        "ZM": "Zambian",
        "ZW": "Zimbabwean",
        "AX": "Ålandic"
    };

    let states_us = {
        '': '— Please Select —',
        "AL": "Alabama",
        "AK": "Alaska",
        "AS": "American Samoa",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "AA": "Armed Forces Americas",
        "AE": "Armed Forces Europe",
        "AP": "Armed Forces Pacific",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "DC": "District of Columbia",
        "FL": "Florida",
        "GA": "Georgia",
        "GU": "Guam",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "MP": "Northern Mariana Is.",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PW": "Palau",
        "PA": "Pennsylvania",
        "PR": "Puerto Rico",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "VI": "U.S. Virgin Islands",
        "UT": "Utah",
        "VT": "Vermont",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming"
    };

    let countries_us = {
        'US': 'United States'
    };

    let countries_ca = {
        'CA': 'Canada'
    };

    let countries_eu = {
        '0': '— Please Select —',
        'AT': 'Austria',
        'BE': 'Belgium',
        'BG': 'Bulgaria',
        'CY': 'Cyprus',
        'CZ': 'Czech Republic',
        'DK': 'Denmark',
        'EE': 'Estonia',
        'FI': 'Finland',
        'FR': 'France',
        'DE': 'Germany',
        'GI': 'Gibraltar',
        'GR': 'Greece',
        'GG': 'Guernsey',
        'HU': 'Hungary',
        'IS': 'Iceland',
        'IE': 'Ireland',
        'IT': 'Italy',
        'JE': 'Jersey',
        'LV': 'Latvia',
        'LI': 'Liechtenstein',
        'LT': 'Lithuania',
        'LU': 'Luxembourg',
        'MT': 'Malta',
        'MC': 'Monaco',
        'NO': 'Norway',
        'PL': 'Poland',
        'PT': 'Portugal',
        'RO': 'Romania',
        'SK': 'Slovakia (Slovak Republic)',
        'SI': 'Slovenia',
        'ES': 'Spain',
        'SE': 'Sweden',
        'CH': 'Switzerland',
        'NL': 'The Netherlands',
        'TR': 'Turkey',
        'GB': 'United Kingdom'
    };

    var twilio_phone_codes = global_data_helper.twilio_available_countries_no_creation;

}());



