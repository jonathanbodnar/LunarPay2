(function () {
    $(document).ready(function () {
        starter.set_starter_onboarding();
    });
    const starter = {
        install_image_changed: 0,
        install_domain_changed: 0,
        install_trigger_message_changed: 0,
        install_suggested_amounts_changed: 0,
        install_default_theme_color: '#000000',
        install_default_button_text_color: '#ffffff',
        install_logo_image: null,
        install_logo_image_demo: null,
        install_theme_color: null,
        install_button_text_color: null,
        install_slug: "",
        install_qr_code: "",
        install_status: null,
        install_type: null,
        install_conduit_funds: null,        
        accordionHandler: {
            save: function (step) {

                let btn = $('.btn_action.step_' + step);
                helpers.btn_disable(btn);
                $('#starter_accordion').find('.alert-validation').empty().hide();
                let data = $("#starter_form").serializeArray();
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['step'] = step;
                save_data['id'] = $("#starter_form").data('id');
                
                $.post(base_url + 'getting_started_fts/save_onboarding', save_data, function (result) {                                        
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
                            
                            var website_saved = $('input[name="step1[website]"]').val();
                            $('input[name="domain"]').val(website_saved);                            
                        } else if (step == 2) { //receive the mpa_link at step 3                            
                            $('#mpa_link').attr('href', result.onboarding_status.mpa_link);
                            $('#mpa_link').text(result.onboarding_status.mpa_link);   
                            $('[data-target="#starter_step' + (step + 2) + '"]').removeClass('item_disabled');
                            $('[data-target="#starter_step' + (step + 2) + '"]').attr('data-toggle', 'collapse');
                            
                            //$('#mpa_iframe').attr('src', 'https://mpa.paymentportal.cc/xframe/clearapp/start/TESTING1234?is_test=yes"');
                    
                            $('#mpa_iframe').attr('src', result.onboarding_status.mpa_link);
                        } else if (step == 4) {
                            //$('.terms_conditions_ask_message').hide();
                            //$('.terms_conditions_already_accepted').show();
                            //$('.btn-term-condition').text('Continue');

                        } else if (step == 6) {

                        }
                        
                        starter.update_account_status(result.onboarding_status);

                        if (step != 6) {
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
                        if (step == 6) {
                            if (typeof result.onboarding_status !== 'undefined' && result.onboarding_status.bank_status_blocked.status) {
                                $('.btn-status-action').text('Continue & Validate bank later');
                                $('#validation_amount').prop('disabled', true);
                            }
                        }
                        $('#starter_accordion').find('.alert-validation-' + step).first().empty().append(result.message).fadeIn("slow");
                    }
                    typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';

                }).fail(function (jqXHR) {
                    helpers.btn_enable(btn);

                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                        alert(jqXHR.responseJSON.message);
                        location.reload();
                    } else {
                        alert("error: " + jqXHR.responseText);
                    }
                });
            },
            save_widget: function () {
                let btn = $('.btn_customize_text');
                helpers.btn_disable(btn);
                var save_data = new FormData($('#customize_widget_form')[0]);
                save_data.append('id', $("#starter_form").data('id'));
                save_data.append('id_setting', $('#customize_widget_form').data('id'));
                if (starter.install_image_changed === 1) {
                    save_data.append('image_changed', starter.install_image_changed);
                    save_data.append('logo', starter.install_logo_image);
                    starter.install_image_changed = 0;
                }
                var step = 4;
                save_data.append('step', step);
                $.ajax({
                    url: base_url + 'getting_started_fts/save_onboarding', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            btn.prop('disabled', false);
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

                            starter.update_account_status(result.onboarding_status);

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
            }
        },
        update_account_status: function (onboarding_status) {
            $('.account_status').text((onboarding_status.app_status || 'NO_STATUS_DEFINED').replace(/_/g, ' ')) //

            if(onboarding_status.fortis_template.status === false){
                const error = onboarding_status.fortis_template.message;
                $('#starter_accordion').find('.alert-validation-2').first().empty().append(error).fadeIn("slow");
            }

            if (onboarding_status.app_status == null || onboarding_status.app_status == 'FORM_ERROR') {
                $('#starter_form input[name^="step2"]').prop('disabled', false);
                $('.merchant_account_status_text_space').html(`
                    Please complete the Onboard Merchant Information in the step 3`);
                return;
            }

            if (['BANK_INFORMATION_SENT', 'ACTIVE'].includes(onboarding_status.app_status)) {
                $('#starter_form input[name^="step2"]').prop('disabled', true);
            }

            if (['BANK_INFORMATION_SENT'].includes(onboarding_status.app_status)) {
                $('.merchant_account_status_text_space').html(`
                Please make sure the form in step 3 is fully completed. Once submitted, allow a few days for us to process your information. When your status changes to "ACTIVE", payment processing will be enabled!.`);
            }

            if (['ACTIVE'].includes(onboarding_status.app_status)) {
                $('.merchant_account_status_text_space').html(`                
                <strong style="font-weight: 500;">We are ready to launch!</strong>
                         You can start receving payments<br>
                     <a class="btn btn-sm mt-2" href="${base_url}organizations">Go to your organization</a>                     
                     `);
            }            
        },
        set_starter_onboarding: function () {
            //loading data
            $.post(base_url + 'getting_started_fts/get_organization', async function (result) {
                if (result.organization) {
                    $('#starter_form').data('id', result.organization.ch_id);
                }
                for (let i = 1; i <= result.starter_step; i++) {
                    $('[data-target="#starter_step' + i + '"]').attr('data-toggle', 'collapse');
                    $('[data-target="#starter_step' + i + '"]').removeClass('item_disabled');
                    if (i == result.starter_step) {
                        $('[data-target="#starter_step' + i + '"] h5').prepend('<i class="fas fa-play last-step-icon"></i>');
                        $('#starter_step' + i).collapse('toggle');
                        $('#starter_step' + i).addClass('last_step');
                    } else {
                        $('[data-target="#starter_step' + i + '"] h5').prepend('<i class="fas fa-check old-step-icon"></i>');
                    }
                }

                if (!result.organization) {
                    return;
                }

                let form = '#starter_form';
                $(form + ' input[name="step1[dba_name]"]').val(result.organization.church_name);
                $(form + ' input[name="step1[legal_name]"]').val(result.organization.legal_name);
                $(form + ' input[name="step1[website]"]').val(result.organization.website);
                
                $(form + ' input[name="step1[address_line_1]"]').val(result.organization.street_address);

                if (result.onboard != null) {

                    if (result.organization._twilio_accountsid) {
                        $('input[name="is_text_give').attr('disabled', true);
                        $('input[name="is_text_give').prop('checked', true);
                    }

                    $(form + ' input[name="step1[first_name]"]').val(result.onboard.sign_first_name);
                    $(form + ' input[name="step1[last_name]"]').val(result.onboard.sign_last_name);
                    $(form + ' input[name="step1[phone]"]').val(result.onboard.sign_phone_number);
                    $(form + ' input[name="step1[email]"]').val(result.onboard.email);

                    $(form + ' select[name="step1[merchant_state]"]').val(result.onboard.merchant_state);
                    $(form + ' input[name="step1[merchant_city]"]').val(result.onboard.merchant_city);
                    $(form + ' input[name="step1[merchant_postal_code]"]').val(result.onboard.merchant_postal_code);

                    $('#mpa_link').attr('href', result.onboarding_status.mpa_link);
                    $('#mpa_link').text(result.onboarding_status.mpa_link);

                    $('#mpa_iframe').attr('src', result.onboarding_status.mpa_link);

                }

                starter.update_account_status(result.onboarding_status);


                //$('input[name="step3[create_crypto_wallet]').prop('disabled', false);
                //$('input[name="step3[create_crypto_wallet]').prop('checked', true);
                //if (result.onboarding_status.orgnx_onboard_crypto != null && result.onboarding_status.orgnx_onboard_crypto.active == '0') {
                //    $('input[name="step3[create_crypto_wallet]').prop('checked', false);
                //}

                if (result.funds.length > 0) {
                    $.each(result.funds, function () {
                        $('#organization_funds').tagsinput('add', this.name);
                    });
                } else {
                    $('#organization_funds').tagsinput('add', 'General');
                }

                if (result.chat_setting !== null) {
                    $('#customize_widget_form').data('id', result.chat_setting.id);
                    $('#advanced_configuration_form').data('id', result.chat_setting.id);
                    $('input[name="theme_color').val(result.chat_setting.theme_color);
                    $('input[name="button_text_color').val(result.chat_setting.button_text_color);
                    $('input[name="trigger_message').val(result.chat_setting.trigger_text);
                    $('input[name="suggested_amounts').tagsinput('removeAll');
                    $.each(JSON.parse(result.chat_setting.suggested_amounts), function (key, value) {
                        $('input[name="suggested_amounts').tagsinput('add', value);
                    });

                    $('select[name="widget_position"]').val(result.chat_setting.widget_position);

                    if (result.chat_setting.debug_message === "1")
                        $('input[name="debug_message').prop('checked', true);
                    else
                        $('input[name="debug_message').prop('checked', false);

                    $('input[name="domain').val(result.chat_setting.domain);

                    starter.install_theme_color = result.chat_setting.theme_color;
                    starter.install_button_text_color = result.chat_setting.button_text_color;
                    starter.install_status = result.chat_setting.install_status;
                    if (result.chat_setting.logo) {
                        setLogo(base_url + 'files/get/' + result.chat_setting.logo);
                        starter.install_logo_image_demo = base_url + 'files/get/' + result.chat_setting.logo;
                    }
                    else {
                        setLogo(null);
                        logo_dropzone.removeAllFiles(true);
                    }
                    $('select[name="funds_flow"]').val(result.chat_setting.type_widget);
                    starter.install_type = result.chat_setting.type_widget;
                    starter.install_conduit_funds = result.chat_setting.conduit_funds;
                } else {
                    $('#customize_widget_form').data('id', null);
                    $('#advanced_configuration_form').data('id', null);
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

                $('#code_to_copy').text(`<script>var _chatgive_link = {"token": "` + token + `", "connection": ` + connection + `};</script>
<script src="`+ short_base_url + `assets/widget/chat-widget-install.js"></script>`);
                $('#embedded_to_copy').text(`<iframe src="` + short_base_url + `widget_load/index/` + connection + `/` + token + `/1" width="500px" height="600px" frameborder="0"></iframe>`);
                $('#trigger_button').text(`<button type="button" style="display:none" class="sc-open-chatgive">Give</button>`);
                $('#quickgive_to_copy').text(`<iframe src="` + short_base_url + `widget_load/index/` + connection + `/` + token + `/2" width="400px" height="400px" frameborder="0"></iframe>`);

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

            $('#mpa_link').on('click', function (e) {
                e.preventDefault(); // Prevent the default behavior of the link
                var link = $(this).attr('href');
                window.open(link, '_blank', 'width=1366,height=768,scrollbars=yes,resizable=yes');
            });

            //Generate Number - States
            $('#merchant_state').append('<option value="">Select a State</option>');
            $.each(global_data_helper.us_states, function (index, text) {
                $('#merchant_state').append('<option value="' + index + '">' + text + '</option>');
            });

            //Copy to Clipboard Helper
            var ClipboardHelper = {

                copyElement: function ($element) {
                    this.copyText($element.text())
                },
                copyText: function (text) // Linebreaks with \n
                {
                    var $tempInput = $("<textarea>");
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

            logo_dropzone.on('addedfile', function (file) {
                var reader = new FileReader();
                reader.onload = function () {
                    var dataURL = reader.result;
                    $('.image-temporal').remove();
                    starter.install_logo_image = file;
                    starter.install_logo_image_demo = dataURL;
                    starter.install_image_changed = 1;
                };
                reader.readAsDataURL(file);
            });

            //Show Image on dropzone
            function setLogo(url) {
                var logo_element = $('#logo_dropzone');
                var preview = logo_element.find('.dz-preview');
                if (url !== null) {
                    var content_preview = `<div class="dz-preview-cover dz-image-preview image-temporal">
                    <img class="dz-preview-img" src="" data-dz-thumbnail="" 
                    style="max-width: 200px;margin: 0 auto; display: flex;">
                    </div>`;
                    preview.append(content_preview);
                    logo_element.addClass('dz-max-files-reached');
                    logo_element.find('img').prop('src', url);
                    $('.sc-message--avatar').css('background-image', 'url(<?= base_url(); ?>assets/widget/chat-icon.svg);');
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
                if (e.keyCode === 13) {
                    $(this).blur();
                    $(this).focus();
                }
            });

            $('.btn-update-domain').click(function () {
                //Clean Domain
                var install_domain = $('input[name="domain"]').val();
                install_domain = install_domain.replace('http://', '');
                install_domain = install_domain.replace('https://', '');
                install_domain = install_domain.replace('www.', '');
                var setting_id = $('#customize_widget_form').data('id');
                var btn = $(this);

                let data = $("#starter_change_domain").serializeArray();
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });

                save_data['setting_id'] = setting_id;

                $.ajax({
                    url: base_url + 'getting_started_fts/save_domain', type: "POST",
                    data: save_data,
                    success: function (result) {
                        helpers.btn_enable(btn);
                        if (result.status) {
                            btn.prop('disabled', false);
                            success_message('Domain Updated Successfully');
                        } else if (result.status == false) {
                            $('#starter_accordion').find('.alert-validation' + step).first().empty().append(result.message).fadeIn("slow");
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
                            $('#advanced_configuration_form').data('id', data.id);
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


            $('#country_text_give').empty();
            $.each(twilio_phone_codes, function (value, item) {
                $('#country_text_give').append($('<option>', {value: value, text: item.name}));
            });

            $('#country_text_give').on('change', function () {
                let country = $(this).val();
                if (country == 'US') {
                    $('.state_text_give_container').removeClass('hide');
                } else {
                    $('.state_text_give_container').addClass('hide');
                }
            });
        }
    };
    var twilio_phone_codes = global_data_helper.twilio_available_countries_no_creation;

}());



