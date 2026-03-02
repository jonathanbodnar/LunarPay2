(function () {
    $(document).ready(function () {
        starter.set_starter_psf_onboarding();
    });
    var starter = {
        install_image_changed             : 0,
        install_domain_changed            : 0,
        install_trigger_message_changed   : 0,
        install_suggested_amounts_changed : 0,
        install_default_theme_color       : '#000000',
        install_default_button_text_color : '#ffffff',
        install_logo_image                : null,
        install_logo_image_demo           : null,
        install_theme_color               : null,
        install_button_text_color         : null,
        install_slug                      : "",
        install_qr_code                   : "",
        install_status                    : null,
        install_type                      : null,
        install_conduit_funds             : null,
        current_region                    : null,
        current_merchant_country          : null,
        current_bank_type                 : null,
        accordionHandler: {
            save: function (step) {
                let btn = $('.btn_action.step_'+step);
                helpers.btn_disable(btn);
                $('#starter_accordion').find('.alert-validation').empty().hide();
                let data = $("#starter_form , #starter_form_status").serializeArray();
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['step'] = step;
                save_data['id'] = $("#starter_form").data('id');
                $.post(base_url + 'getting_started/save_onboarding', save_data, function (result) {
                    helpers.btn_enable(btn);
                    if (result.status) {
                        $("#starter_form").data('id', result.ch_id);
                        btn.prop('disabled', false);
                        //starter.tabsHandler.updateTabs(from);
                        if (step == 1) {
                            if (result.$is_text_to_give_added) {
                                $('input[name="is_text_give').attr('disabled', true);
                                $('input[name="is_text_give').prop('checked', true);
                                $('.text_to_give_container').addClass('hide');
                            }
                            starter.current_region = $('#region').val();
                            starter.current_merchant_country = $('select[name="step1[country]"]').val();
                            var website_saved = $('input[name="step1[website]"]').val();
                            $('input[name="domain"]').val(website_saved);
                        } else if (step == 3) {
                            starter.current_bank_type = $('#bank_type').val();
                            $('.terms_conditions_already_accepted').hide();
                            if (result.onboarding_status.terms_conditions_acceptance) {
                                $('.terms_conditions_already_accepted').show();
                                $('.btn-term-condition').text('Continue');
                            } else {
                                $('.terms_conditions_ask_message').show();
                            }
                            $('.terms_conditions_1_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard_id + '/1">Open document</a>');
                            $('.terms_conditions_2_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard_id + '/2">Terms & Conditions | Bank Accounts</a>');
                        } else if (step == 4) {
                            $('.terms_conditions_ask_message').hide();
                            $('.terms_conditions_already_accepted').show();
                            $('.btn-term-condition').text('Continue');
                            starter.accordionHandler.bankValidationViewSet(result);
                        } else if (step == 6) {
                            starter.accordionHandler.bankValidationViewSet(result,true);
                        }

                        if (step != 6){
                            $('#starter_step' + (step + 1)).collapse('toggle');
                            if ($('#starter_step' + step).hasClass('last_step')) {
                                $('[data-target="#starter_step' + (step + 1) + '"]').attr('data-toggle', 'collapse');
                                $('[data-target="#starter_step' + (step + 1) + '"]').removeClass('item_disabled');
                                $('[data-target="#starter_step' + step + '"] i').remove();
                                $('[data-target="#starter_step' + step + '"] h5').prepend('<i class="fas fa-check old-step-icon"></i>');
                                $('[data-target="#starter_step' + (step + 1) + '"] h5').prepend('<i class="fas fa-play last-step-icon"></i>');
                                $('#starter_step' + step).removeClass('last_step');
                                $('#starter_step' + (step + 1)).addClass('last_step');
                            }
                        }

                    } else if (result.status == false) {
                        //#
                        if(step == 6) {
                            if(typeof result.onboarding_status !== 'undefined' && result.onboarding_status.bank_status_blocked.status) {
                                $('.btn-status-action').text('Continue & Validate bank later');
                                $('#validation_amount').prop('disabled', true);
                            }
                        }
                        $('#starter_accordion').find('.alert-validation-'+step).first().empty().append(result.message).fadeIn("slow");
                    }
                    typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';

                }).fail(function (e) {
                    helpers.btn_enable(btn);
                    console.log(e);
                });
            },
            save_widget: function (){
                let btn = $('.btn_customize_text');
                helpers.btn_disable(btn);
                var save_data = new FormData($('#customize_widget_form')[0]);
                save_data.append('id', $("#starter_form").data('id'));
                save_data.append('id_setting', $('#customize_widget_form').data('id'));
                if(starter.install_image_changed === 1){
                    save_data.append('image_changed',starter.install_image_changed);
                    save_data.append('logo',starter.install_logo_image);
                    starter.install_image_changed = 0;
                }
                var step = 5;
                save_data.append('step',step);
                $.ajax({
                    url: base_url + 'getting_started/save_onboarding', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            btn.prop('disabled', false);
                            $('#starter_step'+(step+1)).collapse('toggle');
                            if($('#starter_step'+step).hasClass('last_step')){
                                $('[data-target="#starter_step'+(step+1)+'"]').attr('data-toggle','collapse');
                                $('[data-target="#starter_step'+(step+1)+'"]').removeClass('item_disabled');
                                $('[data-target="#starter_step'+step+'"] i').remove();
                                $('[data-target="#starter_step'+step+'"] h5').prepend('<i class="fas fa-check old-step-icon"></i>');
                                $('[data-target="#starter_step'+(step+1)+'"] h5').prepend('<i class="fas fa-play last-step-icon"></i>');
                                $('#starter_step'+step).removeClass('last_step');
                                $('#starter_step'+(step+1)).addClass('last_step');
                            }
                        } else if (result.status == false) {
                            $('#starter_accordion').find('.alert-validation-' + step).first().empty().append(result.message).fadeIn("slow");
                            $('#starter_step' + step).get(0).scrollIntoView();                            
                        }
                        typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        starter.install_domain_changed = 0;
                    }
                });
            },
            bankValidationViewSet: function (result,continue_step = null) {
                $('#validation_amount').prop('disabled', false).show();
                $('.microdeposit_validation_status_message').empty();
                let micros_dep_statuses = [null, 'SENT', 'ERROR', 'FAILED', 'INVALID', 'TXN_ERROR', 'TXN_FAILED', ''];
                $('.eu_validation_container').addClass('hide');
                $('.eu_validation_options').addClass('hide');
                $('.uk_validation_options').addClass('hide');
                $('.microdeposit_validation_container').addClass('hide');
                
                $('.bank_amount_confirmation_status').html(result.onboarding_status.microdeposit_validation != 'VALIDATED' ? result.onboarding_status.microdeposit_validation + '<br>Contact support' : 'VALIDATED');
                
                //'VALIDATED'
                if (result.onboarding_status.microdeposit_validation == 'VALIDATED' || result.onboarding_status.bank_status_blocked.status) {
                    
                    if(result.onboarding_status.bank_status_blocked.status){
                        $('.microdeposit_validation_container_blocked').removeClass('hide');
                    } else {
                        $('.microdeposit_validation_container_success').removeClass('hide');
                    }
                    
                    $('.microdeposit_validation_status').addClass('hide');
                    $('.microdeposit_validation_container').addClass('hide');
                    $('#validation_amount').prop('disabled', true);
                    
                    $('.btn-status-action').prop('disabled',false);
                    $('.btn-status-action').text('Continue');

                    if(continue_step) {
                        let step = 6;
                        $('#starter_step' + (step + 1)).collapse('toggle');
                        if ($('#starter_step' + step).hasClass('last_step')) {
                            $('[data-target="#starter_step' + (step + 1) + '"]').attr('data-toggle', 'collapse');
                            $('[data-target="#starter_step' + (step + 1) + '"]').removeClass('item_disabled');
                            $('[data-target="#starter_step' + step + '"] i').remove();
                            $('[data-target="#starter_step' + step + '"] h5').prepend('<i class="fas fa-check old-step-icon"></i>');
                            $('[data-target="#starter_step' + (step + 1) + '"] h5').prepend('<i class="fas fa-play last-step-icon"></i>');
                            $('#starter_step' + step).removeClass('last_step');
                            $('#starter_step' + (step + 1)).addClass('last_step');
                        }
                    }
                } else {
                    if (micros_dep_statuses.includes(result.onboarding_status.microdeposit_validation)) {
                        if (starter.current_region == 'EU' &&
                            (starter.current_bank_type == 'SEPA' ||
                            starter.current_bank_type == 'WIRE' ||
                            starter.current_bank_type == 'BACS')) {
                            $('.eu_validation_container').removeClass('hide');
                            if(starter.current_merchant_country == 'GB'){
                                $('.uk_validation_options').removeClass('hide');
                            } else {
                                $('.eu_validation_options').removeClass('hide');
                            }
                            $('.btn-status-action').text('Continue');
                            $('.btn-status-action').prop('disabled',true);
                        } else if (starter.current_bank_type == 'ACH' || starter.current_bank_type == 'EFT') {
                            $('.microdeposit_validation_container').removeClass('hide');
                            let status = result.onboarding_status.microdeposit_validation === null ? '' : result.onboarding_status.microdeposit_validation;

                            let errMsg = '';
                            if (status != '') {
                                errMsg = 'LAST ATTEMPT STATUS: ' + status + ' | MAX ATTEMPTS ALLOWED: 3';
                                $('#starter_accordion').find('.alert-validation-6').first().html('<p>Bank Account Validation: ' + errMsg + '</p').show();
                            }
                            $('.microdeposit_validation_status').text(errMsg);
                        } else {
                            $('.btn-status-action').text('Continue');
                            $('.btn-status-action').prop('disabled',true);
                        }
                    }

                    if (result.onboarding_status.bank_status_blocked.status == true) {
                        $('.microdeposit_validation_container').addClass('hide');
                        $('#validation_amount').prop('disabled', true).hide();
                        $('.microdeposit_validation_status_message').append(result.onboarding_status.bank_status_blocked.error);
                        $('.btn-status-action').prop('disabled', true);
                    }
                }
                /////////// account
                
                let cc = result.onboarding_status.account_status_credit_card;
                let dd = result.onboarding_status.account_status_direct_debit;
                if (cc) {
                    $('.account_status_credit_card').text('STATUS: ' + cc);
                }
                if (dd) {
                    $('.account_status_direct_debit').text('STATUS: ' + dd);
                }

                if (cc && dd && cc.toUpperCase() == 'ENABLED' && dd.toUpperCase() == 'ENABLED') {
                    $('.merchant_accounts_not_ready').addClass('hide');
                    $('.merchant_accounts_ready').removeClass('hide');
                } else {
                    $('.merchant_accounts_not_ready').removeClass('hide');
                }
                
            }
        },
        set_starter_psf_onboarding: function () {
            //loading data
            $.post(base_url + 'getting_started/get_organization', async function (result) {
                if(result.organization){
                    $('#starter_form').data('id',result.organization.ch_id);
                }
                for(let i = 1; i <= result.starter_step; i++){
                    $('[data-target="#starter_step'+i+'"]').attr('data-toggle','collapse');
                    $('[data-target="#starter_step'+i+'"]').removeClass('item_disabled');
                    if(i == result.starter_step){
                        $('[data-target="#starter_step'+i+'"] h5').prepend('<i class="fas fa-play last-step-icon"></i>');
                        $('#starter_step'+i).collapse('toggle');
                        $('#starter_step'+i).addClass('last_step');
                    } else {
                        $('[data-target="#starter_step'+i+'"] h5').prepend('<i class="fas fa-check old-step-icon"></i>');
                    }
                }

                if(!result.organization){
                    return;
                }

                let form = '#starter_form';
                $(form + ' input[name="step1[dba_name]"]').val(result.organization.church_name);
                $(form + ' input[name="step1[legal_name]"]').val(result.organization.legal_name);
                $(form + ' input[name="step1[phone_number]"]').val(result.organization.phone_no);
                $(form + ' input[name="step1[website]"]').val(result.organization.website);

                $(form + ' select[name="step1[country]"]').val(result.organization.country).change();
                starter.current_merchant_country = result.organization.country;
                $(form + ' select[name="step1[state_province]"]').val(result.organization.state);
                $(form + ' input[name="step1[city]"]').val(result.organization.city);
                $(form + ' input[name="step1[address_line_1]"]').val(result.organization.street_address);
                $(form + ' input[name="step1[address_line_2]"]').val(result.organization.street_address_suite);
                $(form + ' input[name="step1[postal_code]"]').val(result.organization.postal);
                
                if (result.onboard != null) {
                    $(form + ' select[name="step1[region]"]').val(result.onboard.region).change();
                    starter.current_region = result.onboard.region;
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

                    $(form + ' select[name="step1[trading_country]"]').val(result.onboard.trading_country).change();
                    $(form + ' select[name="step1[trading_state_province]"]').val(result.onboard.trading_state);
                    $(form + ' input[name="step1[trading_city]"]').val(result.onboard.trading_city);
                    $(form + ' input[name="step1[trading_address_line_1]"]').val(result.onboard.trading_address_line_1);
                    $(form + ' input[name="step1[trading_address_line_2]"]').val(result.onboard.trading_address_line_2);
                    $(form + ' input[name="step1[trading_postal_code]"]').val(result.onboard.trading_zip);

                    if(result.organization._twilio_accountsid){
                        $('input[name="is_text_give').attr('disabled',true);
                        $('input[name="is_text_give').prop('checked', true);
                    }

                    if(result.onboard.region !== 'EU') {
                        if (result.onboard.owner_is_applicant == '1') {
                            $(form + ' input[name="step2[is_applicant]"]').prop('checked', true);
                        } else {
                            $(form + ' input[name="step2[is_applicant]"]').prop('checked', false);
                        }

                        if (result.onboard.owner_is_control_prong == '1') {
                            $(form + ' input[name="step2[is_control_prong]"]').prop('checked', true);
                        } else {
                            $(form + ' input[name="step2[is_control_prong]"]').prop('checked', false);
                        }
                    }

                    $(form + ' input[name="step2[first_name]"]').val(result.onboard.owner_first_name);
                    $(form + ' input[name="step2[last_name]"]').val(result.onboard.owner_last_name);
                    $(form + ' input[name="step2[title]"]').val(result.onboard.owner_title);
                    $(form + ' input[name="step2[phone_number]"]').val(result.onboard.owner_phone);
                    $(form + ' select[name="step2[business_owner_is_european]"]').val(result.onboard.owner_is_european).change();
                    $(form + ' select[name="step2[nationality]"]').val(result.onboard.owner_nationality);
                    $(form + ' select[name="step2[owner_gender]"]').val(result.onboard.owner_gender);
                    $(form + ' input[name="step2[ssn]"]').val(result.onboard.owner_ssn);

                    $(form + ' select[name="step2[owner_current_country]"]').val(result.onboard.owner_current_country).change();
                    $(form + ' select[name="step2[owner_current_state_province]"]').val(result.onboard.owner_current_state);
                    $(form + ' input[name="step2[owner_current_city]"]').val(result.onboard.owner_current_city);
                    $(form + ' input[name="step2[owner_current_postal_code]"]').val(result.onboard.owner_current_zip);
                    $(form + ' input[name="step2[owner_current_address_line_1]"]').val(result.onboard.owner_current_address_line_1);
                    $(form + ' input[name="step2[owner_current_address_line_2]"]').val(result.onboard.owner_current_address_line_2);
                    $(form + ' select[name="step2[years_at_address]"]').val(result.onboard.region != 'US' ? result.onboard.years_at_address : '').change();

                    $(form + ' select[name="step2[owner_previous_country]"]').val(result.onboard.owner_previous_country).change();
                    $(form + ' select[name="step2[owner_previous_state_province]"]').val(result.onboard.owner_previous_state);
                    $(form + ' input[name="step2[owner_previous_city]"]').val(result.onboard.owner_previous_city);
                    $(form + ' input[name="step2[owner_previous_postal_code]"]').val(result.onboard.owner_previous_zip);
                    $(form + ' input[name="step2[owner_previous_address_line_1]"]').val(result.onboard.owner_previous_address_line_1);
                    $(form + ' input[name="step2[owner_previous_address_line_2]"]').val(result.onboard.owner_previous_address_line_2);$(form + ' input[name="step2[first_name]"]').val(result.onboard.owner_first_name);

                    $(form + ' input[name="step2[owner2_first_name]"]').val(result.onboard.owner2_first_name);
                    $(form + ' input[name="step2[owner2_last_name]"]').val(result.onboard.owner2_last_name);
                    $(form + ' input[name="step2[owner2_title]"]').val(result.onboard.owner2_title);
                    $(form + ' input[name="step2[owner2_phone_number]"]').val(result.onboard.owner2_phone);
                    $(form + ' select[name="step2[owner2_business_owner_is_european]"]').val(result.onboard.owner2_is_european).change();
                    $(form + ' select[name="step2[owner2_nationality]"]').val(result.onboard.owner2_nationality);
                    $(form + ' select[name="step2[owner2_gender]"]').val(result.onboard.owner2_gender);
                    $(form + ' input[name="step2[owner_2ssn]"]').val(result.onboard.owner2_ssn);

                    $(form + ' select[name="step2[owner2_current_country]"]').val(result.onboard.owner2_current_country).change();
                    $(form + ' select[name="step2[owner2_current_state_province]"]').val(result.onboard.owner2_current_state);
                    $(form + ' input[name="step2[owner2_current_city]"]').val(result.onboard.owner2_current_city);
                    $(form + ' input[name="step2[owner2_current_postal_code]"]').val(result.onboard.owner2_current_zip);
                    $(form + ' input[name="step2[owner2_current_address_line_1]"]').val(result.onboard.owner2_current_address_line_1);
                    $(form + ' input[name="step2[owner2_current_address_line_2]"]').val(result.onboard.owner2_current_address_line_2);
                    $(form + ' select[name="step2[owner2_years_at_address]"]').val(result.onboard.region != 'US' ? result.onboard.years_at_address2 : '').change();

                    $(form + ' select[name="step2[owner2_previous_country]"]').val(result.onboard.owner2_previous_country).change();
                    $(form + ' select[name="step2[owner2_previous_state_province]"]').val(result.onboard.owner2_previous_state);
                    $(form + ' input[name="step2[owner2_previous_city]"]').val(result.onboard.owner2_previous_city);
                    $(form + ' input[name="step2[owner2_previous_postal_code]"]').val(result.onboard.owner2_previous_zip);
                    $(form + ' input[name="step2[owner2_previous_address_line_1]"]').val(result.onboard.owner2_previous_address_line_1);
                    $(form + ' input[name="step2[owner2_previous_address_line_2]"]').val(result.onboard.owner2_previous_address_line_2);

                    $(form + ' input[name="step2[owner2_euidcard_number]"]').val(result.onboard.euidcard_number2);
                    $(form + ' select[name="step2[owner2_euidcard_country_issue]"]').val(result.onboard.euidcard_country_of_issue2).change();
                    $(form + ' input[name="step2[owner2_id_number_line_1]"]').val(result.onboard.euidcard_number_line_12);
                    $(form + ' input[name="step2[owner2_id_number_line_2]"]').val(result.onboard.euidcard_number_line_22);
                    $(form + ' input[name="step2[owner2_id_number_line_3]"]').val(result.onboard.euidcard_number_line_32);
                    
                    $('#bank_type').val(result.onboard.bank_type).change();
                    starter.current_bank_type = result.onboard.bank_type;
                    
                    if (result.onboarding_status.bank_account_created_1 && result.onboarding_status.bank_account_created_2) {
                        $(form + ' input[name^="step3"]').prop('disabled', true);
                        $(form + ' select[name^="step3"]').prop('disabled', true);
                        $('.bank_account_information_sent').removeClass('hide');
                    }
                    
                    $(form + ' input[name="step5[validation_amount]"]').val(result.onboard.validation_amount);
                    
                    if(result.onboard.owner_birth) {
                        //$('#date_of_birth').datepicker('setDate', moment(result.onboard.owner_birth).format("L"));
                        $('#date_of_birth').val(moment(result.onboard.owner_birth).format("L"));
                    }

                    if(result.onboard.owner2_birth) {
                        //$('#date_of_birth').datepicker('setDate', moment(result.onboard.owner_birth).format("L"));
                        $('#date_of_birth_2').val(moment(result.onboard.owner2_birth).format("L"));
                    }
                    
                    if(result.onboard.euidcard_expiry_date) {
                        //$('#eu_xpry_date').datepicker('setDate', moment(result.onboard.euidcard_expiry_date).format("L"));
                        $('#eu_xpry_date').val(moment(result.onboard.euidcard_expiry_date).format("L"));
                    }

                    if(result.onboard.euidcard_expiry_date2) {
                        //$('#eu_xpry_date').datepicker('setDate', moment(result.onboard.euidcard_expiry_date).format("L"));
                        $('#eu_xpry_date_2').val(moment(result.onboard.euidcard_expiry_date2).format("L"));
                    }

                    if (result.starter_step >= 3) {
                        $('.terms_conditions_already_accepted').hide();
                        if (result.onboarding_status.terms_conditions_acceptance) {
                            $('.terms_conditions_already_accepted').show();
                            $('.btn-term-condition').text('Continue');
                        } else {
                            $('.terms_conditions_ask_message').show();
                        }
                        $('.terms_conditions_1_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard.id + '/1">Open document</a>');
                        $('.terms_conditions_2_link').html('<a target="_blank" href="' + base_url + 'paysafe/terms_conditions/' + result.onboard.id + '/2">Terms & Conditions | Bank Accounts</a>');
                    }
                    if (result.starter_step >= 4) {
                        starter.accordionHandler.bankValidationViewSet(result);
                    }
                }
                
                $('input[name="step3[create_crypto_wallet]').prop('disabled', false);
                $('input[name="step3[create_crypto_wallet]').prop('checked', true);
                if (result.onboarding_status.orgnx_onboard_crypto != null && result.onboarding_status.orgnx_onboard_crypto.active == '0') {
                    $('input[name="step3[create_crypto_wallet]').prop('checked', false);
                } 
                
                if (result.funds.length > 0) {
                    $.each(result.funds, function () {
                        $('#organization_funds').tagsinput('add', this.name);
                    });
                } else {
                    $('#organization_funds').tagsinput('add', 'General');
                }
                
                if(result.chat_setting !== null){
                    $('#customize_widget_form').data('id',result.chat_setting.id);
                    $('#advanced_configuration_form').data('id',result.chat_setting.id);
                    $('input[name="theme_color').val(result.chat_setting.theme_color);
                    $('input[name="button_text_color').val(result.chat_setting.button_text_color);
                    $('input[name="trigger_message').val(result.chat_setting.trigger_text);
                    $('input[name="suggested_amounts').tagsinput('removeAll');
                    $.each(JSON.parse(result.chat_setting.suggested_amounts),function (key,value) {
                        $('input[name="suggested_amounts').tagsinput('add', value);
                    });

                    $('select[name="widget_position"]').val(result.chat_setting.widget_position);
                    
                    if(result.chat_setting.debug_message === "1")
                        $('input[name="debug_message').prop('checked', true);
                    else
                        $('input[name="debug_message').prop('checked', false);

                    $('input[name="domain').val(result.chat_setting.domain);

                    starter.install_theme_color = result.chat_setting.theme_color;
                    starter.install_button_text_color = result.chat_setting.button_text_color;
                    starter.install_status = result.chat_setting.install_status;
                    if(result.chat_setting.logo) {
                        setLogo(base_url+'files/get/'+result.chat_setting.logo);
                        starter.install_logo_image_demo = base_url+'files/get/'+result.chat_setting.logo;
                    }
                    else {
                        setLogo(null);
                        logo_dropzone.removeAllFiles(true);
                    }
                    $('select[name="funds_flow"]').val(result.chat_setting.type_widget);
                    starter.install_type = result.chat_setting.type_widget;
                    starter.install_conduit_funds = result.chat_setting.conduit_funds;
                } else {
                    $('#customize_widget_form').data('id',null);
                    $('#advanced_configuration_form').data('id',null);
                    $('input[name="theme_color').val(starter.install_default_theme_color);
                    $('input[name="button_text_color').val(starter.install_default_button_text_color);
                    $('input[name="debug_message').prop('checked', false);
                    $('input[name="suggested_amounts').tagsinput('removeAll');
                    $('input[name="domain').val('');
                    $('input[name="trigger_message').val('');
                    $('select[name="type"]').val('standard').trigger('change');
                    $('select[name="widget_position"]').val('bottom_right');
                    setLogo(null);
                    logo_dropzone.removeAllFiles(true);
                    starter.install_logo_image_demo = null;
                    starter.install_theme_color = null;
                    starter.install_button_text_color = null;
                    starter.install_status = null;
                }

                var token = result.organization.token;
                var connection = 1;

                $('#code_to_copy').text(`<script>var _chatgive_link = {"token": "`+token+`", "connection": `+ connection +`};</script>
<script src="`+short_base_url+`assets/widget/chat-widget-install.js"></script>`);
                $('#embedded_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/1" width="500px" height="600px" frameborder="0"></iframe>`);
                $('#trigger_button').text(`<button type="button" style="display:none" class="sc-open-chatgive">Give</button>`);
                $('#quickgive_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/2" width="400px" height="400px" frameborder="0"></iframe>`);

                loader('hide');
            }).fail(function (e) {
                loader('hide');
            });

            $('.btn_action').on('click', function () {
                let step = $(this).data('step');
                starter.accordionHandler.save(step);
            });
            $('.btn_customize_text').on('click', function () {
                let step = $(this).data('step');
                starter.accordionHandler.save_widget(step);
            });

            //Generate Number - States
            $('#state_text_give').append('<option value="">Select a State</option>');
            $.each(global_data_helper.us_states, function (index, text) {
                $('#state_text_give').append('<option value="' + index + '">' + text + '</option>');
            });

            //Copy to Clipboard Helper
            var ClipboardHelper = {

                copyElement: function ($element)
                {
                    this.copyText($element.text())
                },
                copyText:function(text) // Linebreaks with \n
                {
                    var $tempInput =  $("<textarea>");
                    $("body").append($tempInput);
                    $tempInput.val(text).select();
                    document.execCommand("copy");
                    $tempInput.remove();
                }
            };

            //Disable Auto Upload Dropzone
            var logo_dropzone = Dropzone.forElement('#logo_dropzone');
            logo_dropzone.options.autoProcessQueue = false;
            logo_dropzone.options.autoDiscover = false;

            logo_dropzone.on('addedfile',function(file){
                var reader = new FileReader();
                reader.onload = function(){
                    var dataURL = reader.result;
                    $('.image-temporal').remove();
                    starter.install_logo_image = file;
                    starter.install_logo_image_demo = dataURL;
                    starter.install_image_changed = 1;
                };
                reader.readAsDataURL(file);
            });

            //Show Image on dropzone
            function setLogo (url){
                var logo_element = $('#logo_dropzone');
                var preview = logo_element.find('.dz-preview');
                if(url !== null){
                    var content_preview = `<div class="dz-preview-cover dz-image-preview image-temporal">
                    <img class="dz-preview-img" src="" data-dz-thumbnail="" 
                    style="max-width: 200px;margin: 0 auto; display: flex;">
                    </div>`;
                    preview.append(content_preview);
                    logo_element.addClass('dz-max-files-reached');
                    logo_element.find('img').prop('src',url);
                    $('.sc-message--avatar').css('background-image','url(<?= base_url(); ?>assets/widget/chat-icon.svg);');
                } else {
                    preview.empty();
                    logo_element.removeClass('dz-max-files-reached');
                }
            }

            //Suggested Amounts Mask
            IMask(
                document.querySelector('.suggested_amounts .bootstrap-tagsinput input'),
                {
                    mask: Number,
                    scale: 2,
                    signed: false,
                    radix: '.'
                });
            //Mask with Tags Inputs Conflict Fix
            $('.suggested_amounts .bootstrap-tagsinput input').keypress(function (e) {
                if(e.keyCode === 13){
                    $(this).blur();
                    $(this).focus();
                }
            });

            $('.btn-update-domain').click(function(){
                //Clean Domain
                var install_domain = $('input[name="domain"]').val();
                install_domain = install_domain.replace('http://','');
                install_domain = install_domain.replace('https://','');
                install_domain = install_domain.replace('www.','');
                var setting_id = $('#customize_widget_form').data('id');
                var btn = $(this);

                let data = $("#starter_change_domain").serializeArray();
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });

                save_data['setting_id'] = setting_id;

                $.ajax({
                    url: base_url + 'getting_started/save_domain', type: "POST",
                    data: save_data,
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            btn.prop('disabled', false);
                            success_message('Domain Updated Successfully');
                        } else if (result.status == false) {
                            $('#starter_accordion').find('.alert-validation'+step).first().empty().append(result.message).fadeIn("slow");
                        }
                        typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        starter.install_domain_changed = 0;
                    }
                });

            });

            //Copy Buttton
            $('.copy_code').click(function (e) {
                e.preventDefault();
                var pre_item_text = $(this).prev().text();
                ClipboardHelper.copyText(pre_item_text);
            });

            //===== open modal advanced_configuration
            $('#advanced_configuration').on('click', function (e) {
                e.preventDefault();
                $('select[name="type"]').val(starter.install_type).trigger('change');
                $('#conduit_funds').val(starter.install_conduit_funds).trigger('change');
                $('#advanced_configuration_modal').modal('show');
                $('#advanced_configuration_modal .overlay').attr("style", "display: none!important");
            });

            //Save Conduit Funds
            $('.btn-save-advanced').on('click', function () {
                loader('show');
                var save_data = new FormData($('#advanced_configuration_form')[0]);
                save_data.append('id', $('#advanced_configuration_form').data('id'));
                save_data.append('organization_id', $('#starter_form').data('id'));
                $.ajax({
                    url: base_url + 'install/save_advanced_configuration', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $('#advanced_configuration_form').data('id',data.id);
                            starter.install_type = $('select[name="type"]').val();
                            starter.install_conduit_funds = $('#conduit_funds').val();
                            success_message(data.message);
                            $('#advanced_configuration_modal').modal('hide');
                        } else {
                            $('#advanced_configuration_form').find('.alert-validation').first().empty().html(data.message).fadeIn("slow");
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        loader('hide');
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        loader('hide');
                    }
                });
            });

            $('.xanav-selector').on('click', function (e) {
                if (!starter.accordionHandler.enableTabClick) {
                    return false;
                }
                starter.accordionHandler.enableTabClick = false;
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
                $('#ssn_2').prop('disabled', true);
                $('#ssn_2').val('');
                if ($(this).val() == 'US') {
                    $('#ssn').prop('disabled', false);
                    $('#ssn').val('');
                    $('#ssn_2').prop('disabled', false);
                    $('#ssn_2').val('');
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
                    $('#ssn_2').prop('disabled', false);
                    if ($(this).val() == 'NPCORP' || $(this).val() == 'CHARITY' || $(this).val() == 'GOV') {
                        $('#ssn').prop('disabled', true);
                        $('#ssn_2').prop('disabled', true);
                        $('#ssn').val('');
                        $('#ssn_2').val('');
                    }
                }


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

            $('#nationality_2').empty();
            $.each(state_province_empty, function (value, text) {
                $('#nationality_2').append($('<option>', {value: value, text: text}));
            });
            
            $('#owner_gender').empty();
            $.each(state_province_empty, function (value, text) {
                $('#owner_gender').append($('<option>', {value: value, text: text}));
            });

            $('#owner_gender_2').empty();
            $.each(state_province_empty, function (value, text) {
                $('#owner_gender_2').append($('<option>', {value: value, text: text}));
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

            $('#business_owner_is_european_2').on('change', function () {
                let nationalities = {};
                let gender_options = {};
                $('#nationality_2').prop('disabled', false);
                $('#owner_gender_2').prop('disabled', false);
                if ($(this).val() == 'Yes') {
                    nationalities = nationalities_all;
                    gender_options = gender_options_all;
                    $('.cont-eu-identity-card_2').removeClass('hide');
                } else {
                    nationalities = nationalities_empty;
                    gender_options = gender_options_empty;
                    $('#nationality_2').prop('disabled', true);
                    $('#owner_gender_2').prop('disabled', true);
                    $('.cont-eu-identity-card_2').addClass('hide');
                }

                $('#nationality_2').empty();
                $.each(nationalities, function (value, text) {
                    $('#nationality_2').append($('<option>', {value: value, text: text}));
                });

                $('#owner_gender_2').empty();
                $.each(gender_options, function (value, text) {
                    $('#owner_gender_2').append($('<option>', {value: value, text: text}));
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

            $('#owner_current_country_2').empty();
            $.each(countries_all, function (value, text) {
                $('#owner_current_country_2').append($('<option>', {value: value, text: text}));
            });

            $('#owner_previous_country').empty();
            $.each(countries_all, function (value, text) {
                $('#owner_previous_country').append($('<option>', {value: value, text: text}));
            });

            $('#owner_previous_country_2').empty();
            $.each(countries_all, function (value, text) {
                $('#owner_previous_country_2').append($('<option>', {value: value, text: text}));
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

            $('#current_state_province1_2').empty();
            $.each(state_province_empty, function (value, text) {
                $('#current_state_province1_2').append($('<option>', {value: value, text: text}));
            });

            $('#previous_state_province1').empty();
            $.each(state_province_empty, function (value, text) {
                $('#previous_state_province1').append($('<option>', {value: value, text: text}));
            });

            $('#previous_state_province1_2').empty();
            $.each(state_province_empty, function (value, text) {
                $('#previous_state_province1_2').append($('<option>', {value: value, text: text}));
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

            $('#country_text_give').empty();
            $.each(twilio_phone_codes, function (value, item) {
                $('#country_text_give').append($('<option>', {value: value, text: item.name}));
            });

            $('#country_text_give').on('change', function () {
                let country = $(this).val();
                if(country == 'US'){
                    $('.state_text_give_container').removeClass('hide');
                } else {
                    $('.state_text_give_container').addClass('hide');
                }
            });

            $('#region').on('change', function () {
                $('#years_at_address').prop('disabled', false);
                $('#years_at_address_2').prop('disabled', false);
                $('#years_at_address').val('');
                $('#years_at_address_2').val('');
                $('.owner_confimation_instructions').show();
                if ($(this).val() == 'US') {
                    $('#years_at_address').prop('disabled', true);
                    $('#years_at_address_2').prop('disabled', true);
                    $('#btn-owner-confirmation').show();
                    $('.control_prong').show();
                    $('.business_owner_form').hide();
                    $('.business_owner_form_2').hide();
                    $('.instruct-text-us').show();
                    $('.instruct-text-ca').hide();
                    $('.btn_action[data-step="2"]').hide();
                } else if ($(this).val() == 'CA') {
                    $('#btn-owner-confirmation').show();
                    $('.control_prong').hide();
                    $('.business_owner_form').hide();
                    $('.business_owner_form_2').hide();
                    $('.instruct-text-us').hide();
                    $('.instruct-text-ca').show();
                    $('.btn_action[data-step="2"]').hide();
                } else {
                    $('.instruct-text-us').hide();
                    $('.instruct-text-ca').hide();
                    $('.owner_confimation_form').hide();
                    $('.business_owner_1').text(null);
                    $('.business_owner_form').show();
                    $('.owner_confimation_instructions').hide();
                    $('.btn_action[data-step="2"]').show();
                }
            });

            $('#years_at_address').on('change', function () {
                $('.cont-prev-addr').addClass('hide');
                if ($(this).val() != '' && $(this).val() < 3) {
                    $('.cont-prev-addr').removeClass('hide');
                }
            });

            $('#years_at_address_2').on('change', function () {
                $('.cont-prev-addr_2').addClass('hide');
                if ($(this).val() != '' && $(this).val() < 3) {
                    $('.cont-prev-addr_2').removeClass('hide');
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

                if(twilio_phone_codes[$(this).val()]){
                    $('#country_text_give').val($(this).val()).change();
                } else {
                    $('#country_text_give').val('US').change();
                }
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

            $('#owner_current_country_2').on('change', function () {
                let sta_prv = {};
                $('#current_state_province1_2').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#current_state_province1_2').prop('disabled', true);
                }

                $('#current_state_province1_2').empty();
                $.each(sta_prv, function (value, text) {
                    $('#current_state_province1_2').append($('<option>', {value: value, text: text}));
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

            $('#owner_previous_country_2').on('change', function () {
                let sta_prv = {};
                $('#previous_state_province1_2').prop('disabled', false);
                if ($(this).val() == 'US') {
                    sta_prv = states_us;
                } else if ($(this).val() == 'CA') {
                    sta_prv = provinces_ca;
                } else {
                    sta_prv = state_province_empty;
                    $('#previous_state_province1_2').prop('disabled', true);
                }

                $('#previous_state_province1_2').empty();
                $.each(sta_prv, function (value, text) {
                    $('#previous_state_province1_2').append($('<option>', {value: value, text: text}));
                });
            });

            $('#is_text_give').on('change',function () {
                if($(this).is(':checked')){
                    $('.text_to_give_container').removeClass('hide');
                } else {
                    $('.text_to_give_container').addClass('hide');
                }
            });

            $('#bank_type').on('change',function(){
                 $('#starter_accordion').find('.alert-validation').empty().hide();
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

            $('#euidcard_country_issue_2').empty();
            $.each(countries_all, function (value, text) {
                $('#euidcard_country_issue_2').append($('<option>', {value: value, text: text}));
            });

            //=== Load yearlyVolumeRange
            $.each(yearly_volume_range, function (value, text) {
                $('#yearlyVolumeRange').append($('<option>', {value: value, text: text}));
            });
            //=== Load yearlyVolumeRange
            $.each(business_type_codes, function (value, text) {
                $('#businessType').append($('<option>', {value: value, text: text}));
            });

//            var date_of_birth = $('#date_of_birth').datepicker({
//                format: "mm/dd/yyyy",
//                endDate: "0m",
//                orientation: 'bottom',
//                startView: 2
//            }).on('changeDate', function (ev) {
//                date_of_birth.hide();
//            }).data('datepicker');

            $('#btn-owner-confirmation').click(function () {

                $('#starter_accordion').find('.alert-validation-2').empty().hide();
                let region = $('#region').val();
                if(region == 'EU'){
                    return false;
                }

                let is_applicant = $('[name="step2[is_applicant]"]').is(':checked');
                let is_control_prong = $('[name="step2[is_control_prong]"]').is(':checked');

                if(!is_applicant){
                    $('#starter_accordion').find('.alert-validation-2').html('<p>You must be an Applicant to continue.</p>').fadeIn("slow");
                    return false;
                }

                $('#btn-owner-confirmation').hide();
                $('.business_owner_1').text('Applicant');
                $('.business_owner_form').show();
                $('.btn_action[data-step="2"]').show();
                if(region == 'US') {
                    if (!is_control_prong) {
                        $('.business_owner_form_2').show();
                        $('.business_owner_2').text('Control Prong');
                    } else {
                        $('.business_owner_1').text('Applicant / Control Prong');
                    }
                } else if(region == 'CA'){
                    $('.business_owner_1').text('Applicant');
                }
            });

            $(document).on('change','.owner_confirmation_switch',function () {
                $('#btn-owner-confirmation').show();
                $('.btn_action[data-step="2"]').hide();
                $('.business_owner_form').hide();
                $('.business_owner_form_2').hide();
            });
            
            let momentFormat = 'MM/DD/YYYY';
            IMask(document.getElementById('date_of_birth'), {
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
                  from: 1900,
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

            IMask(document.getElementById('date_of_birth_2'), {
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
                  from: 1900,
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

//            var euicard_expiry_date = $('#eu_xpry_date').datepicker({
//                format: "mm/dd/yyyy",
//                orientation: 'bottom',
//                startView: 2
//            }).on('changeDate', function (ev) {
//                euicard_expiry_date.hide();
//            }).data('datepicker');
            
            IMask(document.getElementById('eu_xpry_date'), {
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
                  from: 1900,
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

            IMask(document.getElementById('eu_xpry_date_2'), {
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
                        from: 1900,
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
    let state_province_empty = {'': '— Please Select —'};
    let nationalities_empty = {'': '— Please Select —'};
    let gender_options_empty = {'': '— Please Select —'};

    let yearly_volume_range = {
        '': '— Please Select —',
        'LOW': '$0 - $50k',
        'MEDIUM': '$50k - $100k',
        'HIGH': '$100k - $250k',
        'VERY_HIGH': '$250k+'
    };
    /*
        7311 // --- not found --- Advertising Services       
        5699 // --- not found --- Miscellaneous Apparel and Accessory Shops               
        8651 // --- not found --- Political organizations -- solved
        8661 // --- not found --- Religious organizations -- solved
     */
    let merchant_category_codes_us_ca = {
        '': '— Please Select —',
        'CHARITY': 'Charity, Religious or Political Organizations', // 8398 // Charitable and Social Service Organizations        
        'ACCT': 'Accounting', // 8931 // Accounting, Auditing, and Bookkeeping Service
        'CONSULTANT': 'Consultant', // 7392 ? // Management, Consulting, and Public Relations Services
        'LEGAL': 'Legal Services', // 8111 // Legal Services and Attorneys
        'MISC_MERCH': 'Misc General Merchandise', // 5399 // Misc. General Merchandise
        'MISC_SERV': 'Services', // 7399 // Business Services, Not Elsewhere Classified
        'PC': 'Computer Services', // 5045 // Computers, Computer Peripheral Equipment, Software
        'PROF_SERV': 'Professional Services', // 8999 // Professional Services ( Not Elsewhere Defined)
    };
    
    //not available for now, let's keep them here anyway
    /*{
        'ART': 'Artist Supply and Craft Stores',
        'BEAUTY': 'Barber & Beauty Shop',
        'CATERING': 'Catering',
        'CLEANING': 'Cleaning Services',        
        'CONTRACTOR': 'Trade Contractor',
        'DENTIST': 'Dentistry',
        'EDU': 'Schools & Education',
        'FOOD': 'Food/Grocery',
        'LANDSCAPING': 'Landscaping',        
        'MEDICAL_PRACT': 'Medical Practitioner',
        'MEDICAL_SERV': 'Health Services',
        'MEMBERSHIP': 'Membership Org.',
        'MISC_FOOD_STORES': 'Misc. Food Stores',        
        'MUSIC': 'Music/Entertainment',        
        'PHOTO_FILM': 'Photo/FILM',        
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
    */
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
        'CONSULTANT': system_letter == 'H' ? 'Coach' : 'Consultant',
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



