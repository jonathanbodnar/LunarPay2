(function () {

    var chatgive = {};

    chatgive.base_url_logo = typeof baseUrlLogo === 'undefined' ? 'https://app.chatgive.com/' : baseUrlLogo;
    chatgive.base_url = typeof base_url === 'undefined' ? 'https://chatgive.me/' : base_url;
    chatgive.id_bot                   = 1;
    chatgive.session_data             = '';
    chatgive.is_connected             = false;
    chatgive.is_button_clicked        = false;
    chatgive.temp_email               = null;
    chatgive.temp_amount              = null;
    chatgive.type_set                 = null;
    chatgive.type_get                 = null;
    chatgive.payment_form             = {};
    chatgive.logo                     = "";
    chatgive.trigger_text             = null;
    chatgive.t_message_displayed      = false;
    chatgive.is_opening               = false;
    chatgive.debug_message            = "0";
    chatgive.profile_donations_offset = 0;
    chatgive.org_name                 = "";
    chatgive.login_identity           = "";
    chatgive.login_phone_code         = "";
    chatgive.org_name                 = "";
    chatgive.bot_timeout              = 750;
    chatgive.history                  = [{id:1}];
    chatgive.is_before_autocomplete   = false;
    chatgive.is_quickgive_empty       = false; // FOR Square QuickGive - 1 question at a time
    chatgive.is_repeat_donation       = false;
    chatgive.payment_processor        = 'EPP';
    chatgive.hide_bank_country        = false;
    chatgive.autoselect_country       = null;
    chatgive.paysafe_profile_cc       = null;
    chatgive.paysafe_profile_is_setup = false;
    chatgive.paysafe_apiKey           = null;
    chatgive.paysafe_environment      = null;
    chatgive.processing_bot           = false;

    chatgive.loadjQuery = function (url, callback) {
        //===== doing this as we need HEAD must be present | no grade A Browsers
        var attempts = 30;

        var addLib = function () {
            var head = document.getElementsByTagName("head");

            if (head.length == 0) {
                if (attempts-- > 0) {
                    setTimeout(addLib, 100);
                }
                return;
            }

            var script = document.createElement("script");
            script.src = url;

            script.onload = function () {
                //console.log('wdget jquery loded', new Date().getMilliseconds());
                callback();
            };

            head[0].appendChild(script);
        };

        addLib();
    };

    chatgive.addJS = function(url){
        var head = document.getElementsByTagName("head");
        var script = document.createElement("script");
        script.src = url;
        head[0].appendChild(script);
    };

    chatgive.addCSS = function(url){
        var head = document.getElementsByTagName("head");
        var link = document.createElement("link");
        link.rel = 'stylesheet';
        link.href = url;
        head[0].appendChild(link);
    };

    chatgive.loadjQuery(base_url+'assets/widget/libraries/jquery-3.5.0.min.js', function () {
        //setTimeout(function () {
        //var widgetjQuery = $.noConflict(true); //it keeps $ with the old version
        //console.log('wdget jquery loded after no conflict ', new Date().getMilliseconds());

        chatgive.addJS(base_url+'assets/widget/libraries/imask.js');
        chatgive.addJS(base_url+'assets/widget/libraries/sweetalert2@9.js');
        
        chatgive.addCSS(base_url+'assets/widget/libraries/bootstrap-datepicker3.min.css');
        chatgive.addJS(base_url+'assets/widget/libraries/bootstrap-datepicker.min.js');
        
        chatgive.addCSS(base_url+'assets/widget/libraries/tooltip.css?v=2.3');
        chatgive.addJS(base_url+'assets/widget/libraries/tooltip.js?v=2.3');

        chatgive.main($);
        //}, 2000);
    });

    chatgive.main = function ($w) {
        //console.log('widget jquery', $w.fn.jquery, new Date().getMilliseconds());
        $w(window).ready(function () {

            $w.ajax({
                type: "POST",
                url: chatgive.base_url + 'widget/setup',
                data: {'chatgive_tokens': _chatgive_link},
                dataType: 'json',
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                function (data, status) {
                    if (data.status) {
                        chatgive.is_connected = true;
                        if (data.new_token) {
                            chatgive.token_name = data.new_token.name;
                            chatgive.token_code = data.new_token.value;
                        }
                        chatgive.org_name = data.org_name;
                        chatgive.payment_processor = data.payment_processor;

                        if (data.chat_settings) {

                            var left_menu_adjust = 395 + parseFloat(data.chat_settings.widget_x_adjust);
                            var widget_position_css = '';
                            if(data.chat_settings.widget_position === 'bottom_right'){
                                widget_position_css = ` 
                                    #sc-launcher .sc-launcher ,
                                    #sc-launcher .sc-chat-window ,
                                    #cover_spin ,
                                    #sc-launcher .sc-launcher .sc-closed-icon,
                                    #sc-launcher .sc-launcher .sc-open-icon ,
                                    #trigger_message
                                    {
                                        right: 25px !important;
                                    }
                                    
                                    #sc-launcher .sc-launcher .sc-closed-icon 
                                    {
                                        right: 45px !important;
                                    }
                                    
                                    #trigger_message span {
                                        margin-left: 20px;
                                        margin-right: 60px;
                                    }
                                    
                                    @media (min-width: 401px){
                                        .chatgive_main_body .swal2-container {
                                            right: 25px !important;
                                        }
                                    }
                                    @media (max-width: 400px){
                                        #sc-launcher .sc-chat-window {
                                            right: 0 !important;
                                        }
                                        .backbround-dropdown , .dropdown-content {
                                            left: 0 !important                                            
                                        }
                                        .chatgive_main_body .swal2-container {
                                            right: 0 !important;
                                        }
                                    }
                                    .backbround-dropdown , .dropdown-content
                                    {
                                        left: calc(100% - 395px);
                                    }
                                `;
                            } else if (data.chat_settings.widget_position === 'bottom_left'){
                                widget_position_css += ` 
                                    #sc-launcher .sc-launcher ,
                                    #sc-launcher .sc-chat-window ,
                                    #cover_spin ,
                                    #sc-launcher .sc-launcher .sc-closed-icon, 
                                    #sc-launcher .sc-launcher .sc-open-icon ,
                                    #trigger_message
                                    {
                                        left: 25px !important;
                                    }
                                    
                                    #sc-launcher .sc-launcher .sc-closed-icon 
                                    {
                                        left: 45px !important;
                                    }
                                    
                                    #trigger_message span {
                                        margin-left: 70px;
                                        margin-right: 10px;
                                    }
                                    
                                    @media (min-width: 401px){
                                        .chatgive_main_body .swal2-container {
                                            left: 25px !important;
                                        }
                                    }
                                    @media (max-width: 400px){
                                        #sc-launcher .sc-chat-window {
                                            left: 0 !important;
                                        }
                                        .backbround-dropdown , .dropdown-content {
                                            left: 0 !important                                            
                                        }
                                        .chatgive_main_body .swal2-container {
                                            left: 0 !important;
                                        }
                                    }
                                    .backbround-dropdown , .dropdown-content
                                    {
                                        left: calc(100% - 415px);
                                    }
                                `;
                            }

                            $w('body').append(`
                            <style id="preview_css">
                                #sc-launcher  .sc-btn.theme_color {
                                    background-color: ` + data.chat_settings.theme_color + ` !important;
                                    border-color: ` + data.chat_settings.theme_color + ` !important;
                                }
                                
                                #sc-launcher  .theme_text_color {
                                    color: ` + data.chat_settings.theme_color + ` !important;
                                }
                                
                                #sc-launcher  .theme_color {
                                    background-color: ` + data.chat_settings.theme_color + ` !important;
                                }
                                
                                #sc-launcher  .sc-message--content.sent .sc-message--text.theme_color {
                                    background-color: ` + data.chat_settings.theme_color + ` !important;
                                }
                                
                                #sc-launcher  .button_text_color {
                                    color: ` + data.chat_settings.button_text_color + ` !important;
                                } `+ widget_position_css +`
                            </style>
                        `);
                            if (data.chat_settings.logo) {
                                chatgive.logo = chatgive.base_url_logo + 'files/get/' + data.chat_settings.logo;
                                $w('#preview_css').html($w('#preview_css').html() + `
                                .sc-message--avatar{
                                    background-image: url(` + chatgive.logo + `) !important; 
                                }
                            `);
                            }

                            chatgive.trigger_text = data.chat_settings.trigger_text;
                            chatgive.debug_message = data.chat_settings.debug_message;

                        } else {
                            $w('body').append(`
                            <style id="preview_css">
                                #sc-launcher .sc-btn.theme_color {
                                    background-color: #000000 !important;
                                    border-color: #000000 !important;
                                }
                                
                                #sc-launcher  .theme_text_color {
                                    color: #000000 !important;
                                }
                                
                                #sc-launcher .theme_color {
                                    background-color: #000000 !important;
                                }
                                
                                #sc-launcher .sc-message--content.sent .sc-message--text.theme_color {
                                    background-color: #000000 !important;
                                }
                                
                                #sc-launcher .button_text_color {
                                    color: #ffffff !important;
                                }
                            </style>
                        `);
                        }

                        //Loading Paysafe.js
                        if(chatgive.payment_processor == 'PSF'){
                            var s = document.createElement("script");
                            s.type = "text/javascript";
                            s.src = "https://hosted.paysafe.com/js/v1/latest/paysafe.min.js";
                            $w('head').prepend(s);
                        }

                        //Trigger Message Logic
                        var had_trigger_message = null;
                        try {
                            if(localStorage && localStorage.getItem("trigger_message")){
                                had_trigger_message = localStorage.getItem("trigger_message");
                            }
                        } catch (e) {}
                        if (had_trigger_message !== "1" || chatgive.debug_message === "1") {
                            setTimeout(function () {
                                if (chatgive.is_opening === true)
                                    return false;

                                parent.postMessage("trigger_message", '*');
                                setTimeout(function () {
                                    if (chatgive.is_opening === true)
                                        return false;

                                    $w('#trigger_message').css('display', 'flex');
                                    $w('#trigger_message').css('width', '350px');
                                    setTimeout(function () {
                                        $w('#trigger_message span').fadeIn();
                                    }, 500);
                                    chatgive.t_message_displayed = true;
                                    try {
                                        if(localStorage) {
                                            localStorage.setItem("trigger_message", "1");
                                        }
                                    } catch (e) {}
                                }, 500);
                            }, 3000);
                        }

                        //$w('body').css('background-color', 'gray');
                        chatgive.loadTemplate();

                        if (chatgive.trigger_text) {
                            $w('#trigger_message span').text(chatgive.trigger_text);
                        }

                        //Chat Events
                        $w('.sc-close-button').click(function () {
                            chatgive.toggleChat();
                        });

                        $w('#trigger_message').click(function () {
                            chatgive.toggleChat();
                        });

                        $w('.sc-launcher').click(function () {
                            chatgive.toggleChat();
                        });

                        chatgive.refreshChat = function() {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.processing_bot = true;

                            $w('.sc-message-list').empty();
                            chatgive.id_bot   = 1;
                            chatgive.type_get = null;
                            chatgive.history  = [{id:1}];

                            chatgive.processing_bot = false;
                            chatgive.bot();
                        };

                        chatgive.no_logged_chat = function(){
                            $w('.logged_item').hide();
                            $w('#profile_name_header').hide();
                            $w('#sign_in').show();
                            $w('.sc-body-chat').hide();
                            $w('#sc-body-main').show();
                            $w('.sc-header').show();
                            chatgive.refreshChat();
                            chatgive.closeMainMenu();
                            chatgive.cover_loader('hide');
                        };

                        $w('.sc-give-confirmation').click(function () {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.bot();
                            $w('.sc-give-confirmation').hide();
                            $w('.sc-main-input-text').show();
                        });

                        $w('.sign_out_btn').click(function () {
                            var data = {};
                            data[chatgive.token_name] = chatgive.token_code;

                            $header = "Bearer ";
                            try {
                                if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                                    $header += localStorage.getItem("b25a9b3d0c99f288c");
                                }
                            } catch (e) {}

                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget/log_out',
                                data: data,
                                dataType: 'json',
                                headers: {'Authorization': $header},
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {
                                    if (data.status === true) {
                                        //It's Square Quickgive
                                        if(_chatgive_link['standalone'] === 2){
                                            $w('.sign_out').hide();
                                        }
                                        $w('.logged_item').hide();
                                        $w('#profile_name_header').hide();
                                        $w('#sign_in').show();
                                        if(data.new_token){
                                            chatgive.token_name = data.new_token.name;
                                            chatgive.token_code = data.new_token.value;
                                        }
                                        $w('.sc-message-list').empty();
                                        chatgive.id_bot = 1;
                                        chatgive.type_get = null;
                                        chatgive.bot();
                                        $w('.sc-body-chat').hide();
                                        $w('#sc-body-main').show();
                                        $w('.sc-header').show();
                                        chatgive.closeMainMenu();
                                    }
                                }).fail(function (data,status) {
                                    var chat_data = data.responseJSON;
                                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                                        var $header_refresh = "Bearer ";
                                        try {
                                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                                            }
                                        } catch (e) {}
                                        $w.ajax({
                                            type: "POST",
                                            url: chatgive.base_url + 'wtoken/refresh',
                                            headers: {'Authorization': $header_refresh},
                                            dataType: 'json',
                                            crossDomain: true,
                                            xhrFields: {
                                                withCredentials: true
                                            }
                                        }).done(function (data, status) {
                                            if(data.status == true){
                                                if(data.d1a22a6f44f8b11b132a1ea){
                                                    try {
                                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                                    } catch (e) {}
                                                }
                                                $w('.sign_out_btn').trigger('click');
                                            }
                                        }).fail(function () {
                                            chatgive.no_logged_chat();
                                        })
                                    }
                                });
                        });

                        //Navigation Buttons
                        $w('.sc-left-menu').click(function () {
                            $w('.sc-left-menu').toggleClass('active');
                            $w('.dropdown-content').toggleClass('show');
                            $w('.backbround-dropdown').toggleClass('show');
                        });

                        chatgive.closeMainMenu = function(){
                            $w('.sc-left-menu').removeClass('active');
                            $w('.dropdown-content').removeClass('show');
                            $w('.backbround-dropdown').removeClass('show');
                        };

                        $w(document).on("click", function(event){
                            var $trigger = $w(".dropdown-content");
                            var $trigger2 = $w(".sc-left-menu");
                            if($trigger.get(0) !== event.target && !$trigger.has(event.target).length &&
                                $trigger2.get(0) !== event.target && !$trigger2.has(event.target).length ){
                                chatgive.closeMainMenu();
                            }
                        });

                        $w('.sc-goto-login').click(function () {
                            $w('.sign_in').trigger('click');
                        });

                        $w('.sc-goto-register').click(function () {
                            $w('.sign_up').trigger('click');
                        });

                        $w('.sign_in').click(function () {
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            $w('#sc-body-login-phone-form').show();
                            $w('#sc-body-login-phone-form #phone_main_form').val('');
                            $w('#sc-login-failed-main').hide();
                            chatgive.closeMainMenu();
                        });

                        $w('.sign_up').click(function () {
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            $w('#sc-body-register-form').show();
                            $w('#sc-body-register-form #register_name').val('');
                            $w('#sc-body-register-form #register_email').val('');
                            $w('#sc-body-register-form #register_name').val('');
                            $w('#sc-body-register-form #country_phone_register').val('US');
                            $w('#sc-body-register-form #register_phone_code').val('1');
                            $w('#sc-body-register-form #register_phone').val('');
                            $w('#country_phone_register').trigger('change');
                            chatgive.closeMainMenu();
                        });

                        $w('#profile').click(async function () {
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            chatgive.cover_loader('show');
                            try {
                                await chatgive.loadProfile($w('#sc-body-profile'));
                            } catch (e) {}
                            chatgive.cover_loader('hide');
                            $w('#sc-body-profile').show();
                            chatgive.closeMainMenu();
                        });

                        $w('#profile_saved_sources_btn').click(async function () {
                            $w('.cancel_payment_method').click();
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            chatgive.cover_loader('show');
                            try {
                                await chatgive.loadProfile($w('#profile_saved_sources'));
                            } catch (e) {}
                            chatgive.cover_loader('hide');
                            $w('#profile_saved_sources').show();
                            chatgive.closeMainMenu();
                        });

                        $w('#profile_giving_btn').click(async function () {
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            chatgive.cover_loader('show');
                            try {
                                await chatgive.loadProfile($w('#profile_giving'));
                            } catch (e) {}

                            chatgive.cover_loader('hide');
                            $w('#profile_giving').show();
                            chatgive.closeMainMenu();
                        });

                        $w('.sc-back-button').click(function () {
                            $w('.sc-body-chat').hide();
                            $w('#sc-body-main').show();
                            $w('.sc-header').show();
                        });

                        $w('.sc-back-button-give').click(function () {
                            $w('.sc-body-chat').hide();
                            $w('#sc-body-main').show();
                            $w('.sc-header').show();
                        });

                        $w('.forgot-password').click(function () {
                            $w('.sc-body-chat').hide();
                            $w('.sc-header').hide();
                            $w('#sc-recover-password-message').hide();
                            $w('#sc-recover-success-password-message').empty();
                            $w('#sc-recover-success-password-message').hide();
                            $w('.sc-btn-recover-password').show();
                            $w('#sc-body-forgot-password form input').val('');
                            $w('#sc-body-forgot-password').show();
                        });

                        //Login with Email
                        $w('.sc-btn-form-login-main').click(function () {
                            send_data = {};
                            var form = $w("#sc-body-login-form form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name] = chatgive.token_code;
                            send_data['chatgive_tokens'] = _chatgive_link;
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/login',
                                data: send_data,
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                               function (data, status) {
                                   if (data.status === true) {
                                       $w('#sign_in').hide();
                                       $w('#sign_up').hide();
                                       //It's Square Quickgive
                                       if (_chatgive_link['standalone'] === 2) {
                                           $w('.sign_out').show();
                                           $w('.sc-body-chat').hide();
                                           $w('#sc-body-main').show();
                                           $w('.sc-header').show();
                                       } else {
                                           $w('.logged_item').show();
                                           $w('#profile_name_header').show();
                                           $w('#profile').click();
                                       }
                                       $w('#sc-login-failed-main').hide();
                                       chatgive.refreshChat();
                                       chatgive.loadProfile();
                                   } else {
                                       $w('#sc-login-failed-main').show();
                                   }
                                   if (data.new_token){
                                       chatgive.token_name = data.new_token.name;
                                       chatgive.token_code = data.new_token.value;
                                   }
                                });
                        });

                        //Login with Phone - Send SMS
                        $w('.sc-btn-form-login-phone-main').click(function () {
                            chatgive.cover_loader('show');
                            send_data = {};
                            var form = $w("#sc-body-login-phone-form form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name] = chatgive.token_code;
                            send_data['chatgive_tokens'] = _chatgive_link;
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/login_send_code',
                                data: send_data,
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {
                                    if (data.status === true) {
                                        $w('.sc-body-chat').hide();
                                        $w('.sc-header').hide();
                                        $w('#sc-body-login-phone-code-form').show();
                                        $w('#sc-body-login-phone-code-form input').val('');
                                        $w('#sc-login-phone-code-failed-main').hide();
                                        chatgive.login_identity    = data.identity;
                                        chatgive.login_phone_code  = data.phone_code;
                                    } else {
                                        Swal.fire(
                                            'Error',
                                            data.error_message,
                                            'error'
                                        );
                                    }
                                    if (data.new_token) {
                                        chatgive.token_name = data.new_token.name;
                                        chatgive.token_code = data.new_token.value;
                                    }
                                    chatgive.cover_loader('hide');
                                });
                        });

                        //Login with Phone - Verification Code
                        $w('.sc-btn-form-login-phone-code-main').click(function () {
                            send_data = {};
                            var form = $w("#sc-body-login-phone-code-form form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name] = chatgive.token_code;
                            send_data['identity'] = chatgive.login_identity;
                            send_data['phone_code'] = chatgive.login_phone_code;
                            send_data['chatgive_tokens'] = _chatgive_link;
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/login_with_code',
                                data: send_data,
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {
                                    if (data.status === true) {

                                        if(data.d1a22a6f44f8b11b132a1ea){
                                            try {
                                                localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                                localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                            } catch (e) {}
                                        }

                                        $w('#sign_in').hide();
                                        $w('#sign_up').hide();
                                        //It's Square Quickgive
                                        if(_chatgive_link['standalone'] === 2){
                                            $w('.sign_out').show();
                                        } else {
                                            $w('.logged_item').show();
                                            $w('#profile').click();
                                        }
                                        $w('#sc-login-phone-code-failed-main').hide();
                                        chatgive.refreshChat();
                                        chatgive.loadProfile();
                                    } else {
                                        $w('#sc-login-phone-code-failed-main').show();
                                    }
                                    if (data.new_token) {
                                        chatgive.token_name = data.new_token.name;
                                        chatgive.token_code = data.new_token.value;
                                    }
                                });
                        });

                        //Register - Send SMS
                        $w('.sc-btn-form-register').click(function () {
                            chatgive.cover_loader('show');
                            send_data = {};
                            var form = $w("#sc-body-register-form form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name] = chatgive.token_code;
                            send_data['chatgive_tokens'] = _chatgive_link;
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/register_send_code',
                                data: send_data,
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {
                                    if (data.status === true) {

                                        if(data.d1a22a6f44f8b11b132a1ea){
                                            try {
                                                localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                                localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                            } catch (e) {}
                                        }

                                        $w('.sc-body-chat').hide();
                                        $w('#sc-body-register-phone-code-form').show();
                                        $w('#sc-body-register-phone-code-form input').val('');
                                        chatgive.register_session_data = data.register_session_data;
                                    } else {
                                        Swal.fire(
                                            'Error',
                                            data.message,
                                            'error'
                                        );
                                    }
                                    if (data.new_token) {
                                        chatgive.token_name = data.new_token.name;
                                        chatgive.token_code = data.new_token.value;
                                    }
                                    chatgive.cover_loader('hide');
                                });
                        });

                        //Register - Verification Code
                        $w('.sc-btn-form-register-phone-code-main').click(function () {
                            send_data = {};
                            var form = $w("#sc-body-register-phone-code-form form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name]     = chatgive.token_code;
                            send_data['chatgive_tokens']       = _chatgive_link;
                            send_data['register_session_data'] = chatgive.register_session_data;
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/register_with_code',
                                data: send_data,
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {

                                    if(data.d1a22a6f44f8b11b132a1ea){
                                        try {
                                            localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                            localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                        } catch (e) {}
                                    }

                                    if (data.status === true) {
                                        $w('#sign_in').hide();
                                        $w('#sign_up').hide();
                                        //It's Square Quickgive
                                        if(_chatgive_link['standalone'] === 2){
                                            $w('.sign_out').show();
                                        } else {
                                            $w('.logged_item').show();
                                            $w('#profile').click();
                                        }
                                        chatgive.refreshChat();
                                        chatgive.loadProfile();
                                    } else {
                                        Swal.fire(
                                            'Error',
                                            'Invalid Security Code',
                                            'error'
                                        );
                                    }
                                    if (data.new_token) {
                                        chatgive.token_name = data.new_token.name;
                                        chatgive.token_code = data.new_token.value;
                                    }
                                });
                        });

                        $w('.sc-user-input--send-icon-wrapper').click(chatgive.sendMessage);
                        $w('.sc-user-input--text').keydown(chatgive.sentMessageKeyEnter);

                        $w('.sc-user-input--text').focus(function () {
                            chatgive.activeUserInput(true);
                        });
                        $w('.sc-user-input--text').blur(function () {
                            chatgive.activeUserInput(false);
                        });

                        $w('.sc-user-input--text').on('focus', '#sc-input-password', function () {
                            chatgive.activeUserInput(true);
                        });
                        $w('.sc-user-input--text').on('blur', '#sc-input-password', function () {
                            chatgive.activeUserInput(false);
                        });
                        
                        //====== do not allow paste --
                        $w('.sc-user-input--text').on('paste',function(e) {
                            e.preventDefault();
                            return false;
                        });
                        
                        //====== do not allow drag --
                        $w('.sc-user-input--text').bind('dragover drop', function(e){
                            e.preventDefault();
                            return false;
                        });

                        $w('#sc-launcher').on('click', '.sc-message-received:last .sc-btn-form', function () {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.processing_bot = true;

                            var send_data = null;
                            if (chatgive.type_get !== 'no_send_form') {
                                send_data = {};
                                var form = $w(this).parents('.form_chat');
                                var data = form.serializeArray();
                                $w.each(data, function () {
                                    send_data[this.name] = this.value;
                                });
                                send_data = JSON.stringify(send_data);
                            } else {
                                if($w('.sc-message-list .sc-message-received:last .select_bank_type').length){
                                    send_data = $w('.sc-message-list .sc-message-received:last .select_bank_type').val();
                                }
                            }

                            chatgive.processing_bot = false;
                            chatgive.bot(send_data);
                        });

                        $w('#sc-launcher').on('click', '.sc-message-received:last .sc-btn-form-back', function () {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.bot('back');
                        });

                        //History Go Back veryfix
                        $w('#sc-launcher').on('click', '.sc-message-received:last .sc-btn-history-back', function () {
                            $w('.sc-user-input--text').prop('contenteditable', false);
                            chatgive.history.splice(chatgive.history.length - 1,1);
                            var back_history = chatgive.history[chatgive.history.length - 1];
                            chatgive.history.splice(chatgive.history.length - 1,1);
                            chatgive.typingMessage();
                            var data = {
                                id_bot: back_history.id,
                                church_id: chatgive.church_id,
                                campus_id: chatgive.campus_id
                            };
                            data[chatgive.token_name] = chatgive.token_code;
                            setTimeout(function () {
                                $w.ajax({
                                    type: "POST",
                                    url: chatgive.base_url + "widget/back",
                                    data: data,
                                    dataType: 'json',
                                    crossDomain: true,
                                    xhrFields: {
                                        withCredentials: true
                                    }
                                }).done(
                                    function (data, status) {
                                        if (data.new_token) {
                                            chatgive.token_name = data.new_token.name;
                                            chatgive.token_code = data.new_token.value;
                                        }

                                        if (data.status) {
                                            chatgive.id_bot = data.chat.id_bot;
                                            chatgive.type_set = data.chat.type_set;
                                            chatgive.type_get = data.chat.type_get;

                                            //Showing Message

                                            //It's Square Quickgive
                                            if (_chatgive_link['standalone'] === 2) {
                                                $w('.sc-message-list').empty();
                                            }
                                            chatgive.receivedMessage(data.chat.html, data.chat.id_bot, data.chat.type_get);

                                            if($w('.sc-message-list .sc-message-received:last .country_picker').length){
                                                $w.each(countries_all,function (key,value) {
                                                    $w('.sc-message-list .sc-message-received:last .country_picker').append(
                                                        '<option value="'+key+'">'+value+'</option>'
                                                    )
                                                })
                                            }

                                            //Set Chat History
                                            chatgive.history.push({id:data.chat.id_bot,back:data.chat.back});

                                            //Showing Back Button
                                            var previous_chat = chatgive.history[chatgive.history.length - 2];
                                            if(previous_chat.back === "1"){
                                                var received_message = $w('.sc-message-list .sc-message-received:last .sc-message--text');
                                                received_message.append(`<div class="sc-buttons-container">  
                                                           <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
                                                           Go Back</a>                                                                 
                                                        </div>
                                                    `);
                                            }

                                            //Setting Input Masks for CC and ACH
                                            chatgive.inputMasks();

                                            //Keep Lock chat on Form
                                            if (data.chat.type_get !== 'form'
                                                && data.chat.type_get !== 'form_password'
                                                && data.chat.type_get !== 'no_send_form'
                                                && data.chat.type_get !== 'payment_form'
                                                && data.chat.type_get !== 'end'
                                            ) {
                                                $w('.sc-user-input--text').prop('contenteditable', true);
                                                $w('.sc-user-input--text').focus();
                                            }
                                        }
                                    });
                            }, chatgive.bot_timeout);
                        });

                        $w('#sc-launcher').on('click', '.sc-message-received:last .sc-btn-select', function () {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.processing_bot = true;

                            var send_data = $w(this).data('value');
                            chatgive.is_button_clicked = true;

                            //Sending additional data on multiple fund
                            if($w(this).parent().hasClass('multiple_fund')){
                                chatgive.processing_bot = false;
                                chatgive.bot(send_data,null,null,null,{fund_order_id:$w(this).data('fund-order')});
                                return;
                            }

                            //Sending additional data on multiple fund amount
                            if($w(this).parent().hasClass('multiple_fund_amount')){
                                chatgive.processing_bot = false;
                                chatgive.bot(send_data,null,null,null,{fund_order_id:$w(this).data('fund-order'),fund_id:$w(this).data('fund')});
                                return;
                            }

                            chatgive.processing_bot = false;
                            chatgive.bot(send_data);
                        });

                        window.addEventListener('message', function (event) {
                            if (event.data === "toggleChat") {
                                $w('.sc-launcher').click();
                            }
                        });

                        //Loading country phones
                        $w.getJSON( chatgive.base_url+"assets/js/countrys/countrys.json?v=4", function( data ) {
                            $w.each(data,function (key,value) {
                                let selected = value.code === 'US' ? 'selected' : '';
                                if(value.dial_code !== "") {
                                    $w('#input-country-code-phone').append('<option data-phone="'+value.dial_code+'" '+selected+' value="'+value.code+'">'+value.code+' (+'+value.dial_code+')</option>');
                                    $w('#country_phone_register').append('<option data-phone="'+value.dial_code+'" '+selected+' value="'+value.code+'">'+value.code+' (+'+value.dial_code+')</option>');
                                }
                            });
                            $w('#input-country-code-phone').change(function () {
                                $phone_code = $w('#input-country-code-phone :selected').data('phone');
                                $w('#input-phone-code').val($phone_code);
                                $country_code = $w('#input-country-code-phone').val();
                                if($country_code) {
                                    $w('#img_country').attr('src', chatgive.base_url + 'assets/images/countrys/' + $country_code.toLowerCase() + '.svg')
                                }
                            });
                            $w('#country_phone_register').change(function () {
                                $phone_code = $w('#country_phone_register :selected').data('phone');
                                $w('#input-phone-code-register').val($phone_code);
                                $country_code = $w('#country_phone_register').val();
                                if($country_code) {
                                    $w('#img_country_register').attr('src', chatgive.base_url + 'assets/images/countrys/' + $country_code.toLowerCase() + '.svg')
                                }
                            });
                            $w('#input-country-code-phone').trigger('change');
                            $w('#country_phone_register').trigger('change');
                        });


                        //Back when clicks on previous Button (Back to choice another option)
                        $w('#sc-launcher').on('click', '.sc-message-received:not(:last) .sc-btn-select',function () {
                            if(chatgive.processing_bot)
                                return;

                            chatgive.processing_bot = true;

                            var message_received = $w(this).parents('.sc-message-received');
                            var id_bot = message_received.data('bot');
                            var type_get = message_received.data('tg');
                            var btn_value = $w(this).data('value');
                            message_received.nextAll('div').remove();

                            if($w(this).hasClass('sc-custom-amount')){
                                chatgive.id_bot = id_bot;
                                chatgive.type_get = type_get;
                                $w('.sc-user-input--text').removeClass('sc-password');
                                $w('.sc-give-confirmation').hide();
                                $w('.sc-main-input-text').show();
                                $w('.sc-user-input--text').focus();
                                chatgive.processing_bot = false;
                                return;
                            }

                            //Sending additional data on multiple fund
                            if($w(this).parent().hasClass('multiple_fund')){
                                chatgive.processing_bot = false;
                                chatgive.bot(btn_value,true,id_bot,type_get,{fund_order_id:$w(this).data('fund-order')});
                                return;
                            }

                            //Sending additional data on multiple fund amount
                            if($w(this).parent().hasClass('multiple_fund_amount')){
                                chatgive.processing_bot = false;
                                chatgive.bot(btn_value,true,id_bot,type_get,{fund_order_id:$w(this).data('fund-order'),fund_id:$w(this).data('fund')});
                                return;
                            }

                            chatgive.processing_bot = false;
                            chatgive.bot(btn_value,true,id_bot,type_get);
                        });

                        //Profile Events
                        $w('#profile_form').on('click', '#save_profile', function () {
                            chatgive.cover_loader('show');
                            var button_clicked = $w(this);
                            send_data = {};
                            var form = $w("#profile_form");
                            var data = form.serializeArray();
                            $w.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data[chatgive.token_name] = chatgive.token_code;

                            $header = "Bearer ";
                            try {
                                if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                                    $header += localStorage.getItem("b25a9b3d0c99f288c");
                                }
                            } catch (e) {}

                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'widget_profile/update',
                                data: JSON.stringify(send_data),
                                dataType: 'json',
                                headers: {'Authorization': $header},
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(
                                function (data, status) {
                                    if (data.status === true) {
                                        chatgive.cover_loader('hide');
                                        Swal.fire(
                                            'Success',
                                            data.message,
                                            'success'
                                        );
                                    } else {
                                        chatgive.cover_loader('hide');
                                        Swal.fire(
                                            'Error',
                                            data.message,
                                            'error'
                                        );
                                    }
                                    if (data.new_token) {
                                        chatgive.token_name = data.new_token.name;
                                        chatgive.token_code = data.new_token.value;
                                    }
                                }).fail(function (data,status) {
                                    var chat_data = data.responseJSON;
                                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                                        var $header_refresh = "Bearer ";
                                        try {
                                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                                            }
                                        } catch (e) {}
                                        $w.ajax({
                                            type: "POST",
                                            url: chatgive.base_url + 'wtoken/refresh',
                                            headers: {'Authorization': $header_refresh},
                                            dataType: 'json',
                                            crossDomain: true,
                                            xhrFields: {
                                                withCredentials: true
                                            }
                                        }).done(function (data, status) {
                                            if(data.status == true){
                                                if(data.d1a22a6f44f8b11b132a1ea){
                                                    try {
                                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                                    } catch (e) {}
                                                }
                                                button_clicked.trigger('click');
                                            }
                                        }).fail(function () {
                                            chatgive.cover_loader('hide');
                                            chatgive.no_logged_chat();
                                        })
                                    }
                                });
                        });

                        $w.each(countries_all,function (key,value) {
                            $w('.country_picker').append(
                                '<option value="'+key+'">'+value+'</option>'
                            )
                        });

                        chatgive.loadProfileEvents();
                        chatgive.inputMasksProfile();

                        $w('.sc-header--team-name').text(chatgive.org_name);

                        $w('.sc-user-input--text').focus(function () {
                            if(document.activeElement.scrollIntoViewIfNeeded) {
                                document.activeElement.scrollIntoViewIfNeeded();
                            }
                        });

                        //Standalone Function
                        if($w('body').hasClass('sc-body-standalone')){
                            chatgive.bot();
                        }

                        //More Options Event
                        $w('body').on('click','.sc-message-received:last .sc-more-options-buttons',function () {
                            $w('.sc-message-received:last .sc-more-container').hide();
                            $w('.sc-message-received:last .sc-btn-extra').removeClass('sc-btn-extra');
                        })
                    }
                });
        });

        chatgive.inputMasks = function () {
            //Dates
            if ($w('.sc-message-list .sc-message-received:last .js_mask_date').get(0)) {
                IMask(
                    $w('.sc-message-list .sc-message-received:last .js_mask_date').get(0),
                    {
                        mask: Date,  // enable date mask

                        // other options are optional
                        pattern: 'm/`d/`Y',  // Pattern mask with defined blocks, default is 'd{.}`m{.}`Y'
                        // you can provide your own blocks definitions, default blocks for date mask are:
                        blocks: {
                            d: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 31,
                                maxLength: 2,
                            },
                            m: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12,
                                maxLength: 2,
                            },
                            Y: {
                                mask: IMask.MaskedRange,
                                from: 1900,
                                to: 9999,
                            }
                        },
                        // define date -> str convertion
                        format: function (date) {
                            var day = date.getDate();
                            var month = date.getMonth() + 1;
                            var year = date.getFullYear();

                            if (day < 10) day = "0" + day;
                            if (month < 10) month = "0" + month;

                            return [month, day, year].join('/');
                        },
                        // define str -> date convertion
                        parse: function (str) {
                            var yearMonthDay = str.split('/');
                            return new Date(yearMonthDay[2], yearMonthDay[0] - 1, yearMonthDay[1]);
                        },

                        // optional interval options
                        min: new Date(1900, 1, 1),  // defaults to `1900-01-01`
                        max: new Date(9999, 12, 12),  // defaults to `9999-12-12`

                        // and other common options
                        overwrite: true  // defaults to `false`
                    });
            }

            //Credit Card
            if ($w('.sc-message-list .sc-message-received:last .js_mask_credit_card').get(0)) {
                IMask(
                    $w('.sc-message-list .sc-message-received:last .js_mask_credit_card').get(0),
                    {
                        mask: '0000-0000-0000-0000',
                    });
            }
            //CVV
            if ($w('.sc-message-list .sc-message-received:last .js_mask_cvv').get(0)) {
                IMask(
                    $w('.sc-message-list .sc-message-received:last .js_mask_cvv').get(0),
                    {
                        mask: '000',
                    });
            }

            //EXPIRATION DATE
            if ($w('.sc-message-list .sc-message-received:last .js_mask_exp_date').get(0)) {
                IMask(
                    $w('.sc-message-list .sc-message-received:last .js_mask_exp_date').get(0),
                    {
                        mask: Date,
                        pattern: 'm/Y',
                        blocks: {
                            m: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12,
                                maxLength: 2,
                            },
                            Y: {
                                mask: IMask.MaskedRange,
                                from: 1900,
                                to: 9999,
                            }
                        },

                        // define date -> str convertion
                        format: function (date) {
                            var month = date.getMonth() + 1;
                            var year = date.getFullYear();

                            if (month < 10) month = "0" + month;

                            return [month, year].join('/');
                        },

                        parse: function (str) {
                            var yearMonthDay = str.split('/');
                            return new Date(yearMonthDay[1], yearMonthDay[0] - 1, 1);
                        },

                        // optional interval options
                        min: new Date(1900, 1, 1),  // defaults to `1900-01-01`
                        max: new Date(9999, 12, 12),  // defaults to `9999-12-12`

                        overwrite: true
                    });
            }

            //EXPIRATION DATE SHORT
            if ($w('.sc-message-list .sc-message-received:last .js_mask_exp_date_short').get(0)) {
                IMask(
                    $w('.sc-message-list .sc-message-received:last .js_mask_exp_date_short').get(0),
                    {
                        mask: 'MM/YY',
                        maxLength: 5,
                        blocks: {
                            MM: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12,
                                maxLength: 2,
                            },
                            YY: {
                                mask: '00',
                            }
                        },
                    });
            }
        };

        chatgive.checkButtonsResponse = function(answer){
            var buttons = $w('.sc-message-received:last button');
            var found = false;
            $w.each(buttons,function () {
                var clean_response = answer.toLowerCase();
                var value = $w(this).data('value').toString();
                if(chatgive.type_get === "buttons_methods"){
                    if($w(this).data('chat-code')) {
                        value = $w(this).data('chat-code').toString();
                    }
                }
                value = value.replace(/-/g,' ').toLowerCase();
                value = value.replace(/_/g,' ').toLowerCase();
                if(value === clean_response){
                    answer = $w(this).data('value').toString();
                    found = true;
                    return false;
                }
                var text_button = $w(this).text().toLowerCase();
                if(text_button === clean_response){
                    answer = $w(this).data('value').toString();
                    found = true;
                    return false;
                }
            });
            //check exact exist
            return found ? answer : "";

        };

        //Chatgive Bot Main Logic
        chatgive.bot = function (answer = null,is_back = null,id_bot=null,type_get=null,data_additional=null) {
            if(chatgive.processing_bot)
                return;

            $w('.sc-user-input--text').prop('contenteditable', false);
            chatgive.processing_bot = true;

            if(typeof answer === "string")
                answer = answer.trim();

            var bk_answer = answer;
            var button_text = '';
            if(chatgive.is_button_clicked){
                button_text = $w('.sc-message-received:last button[data-value="'+answer+'"]').text();
            }

            if(!is_back) {
                if ((chatgive.type_get === 'buttons' || chatgive.type_get === 'buttons_methods') && chatgive.is_button_clicked === false) {
                    answer = chatgive.checkButtonsResponse(answer);

                    //Checking and setting data for multiple funds
                    if($w('.sc-message-received:last .multiple_fund').length){
                        var fund_order_id = $w('.sc-message-received:last .multiple_fund button:first').data('fund-order');
                        data_additional = {fund_order_id:fund_order_id};
                    }
                }
            }

            //Checking and setting data for multiple funds amount
            if($w('.sc-message-received:last .multiple_fund_amount').length){
                var fund_order_id = $w('.sc-message-received:last .multiple_fund_amount button:first').data('fund-order');
                var fund_id = $w('.sc-message-received:last .multiple_fund_amount button:first').data('fund');
                data_additional = {fund_order_id:fund_order_id,fund_id:fund_id};
            }

            //Back to previous button clicked
            if(is_back){
                chatgive.id_bot = id_bot;
                chatgive.type_get = type_get;
            }

            $w('.sc-user-input--text').removeClass('sc-password');
            $w('.sc-give-confirmation').hide();
            $w('.sc-main-input-text').show();

            //CC and ACH Fields Required - Validation
            var validation = true;
            if ((chatgive.type_get === 'no_send_form' || chatgive.type_set === "form_method"|| chatgive.type_set === "form_exp_date") && answer !== 'back') {
                if($w('.sc-message-list .sc-message-received:last .select_bank_type').length){
                    var bank_type = $w('.sc-message-list .sc-message-received:last .select_bank_type').val();
                    $inputs = $w('.sc-message-received:last .payment_form .'+bank_type+'_type input.sc-form-control');
                } else {
                    $inputs = $w('.sc-message-received:last .payment_form input.sc-form-control');
                }
                $w.each($inputs, function (key,value_input) {
                    $input_value = $w(this).val().trim();
                    $input_name = $w(this).attr('placeholder');
                    //Skipping validation
                    if($input_name !== 'Street 2') {
                        if ($input_value === null || $input_value === '') {
                            $w('.sc-message-received:last .alert_validation').text($input_name + ' is required');
                            $w('.sc-message-received:last .alert_validation').show();
                            validation = false;
                            $w('.sc-user-input--text').prop('contenteditable', true);
                            chatgive.processing_bot = false;
                            return false;
                        }
                    }
                });
            }
            if (validation === false) {
                $w('.sc-user-input--text').prop('contenteditable', true);
                chatgive.processing_bot = false;
                return false;
            }

            $w('.alert_validation').hide();

            $w('.sc-typing').remove();
            chatgive.typingMessage();
            setTimeout(async function () {

                //Temporal Saving Password for Password Form
                if (chatgive.type_get === 'email') {
                    chatgive.temp_email = answer;
                }

                //Temporal Saving Amount
                if (chatgive.type_get === 'money') {
                    chatgive.temp_amount = answer.toString();
                }

                //Temporal Saving Amount and clean Fee
                chatgive.is_repeat_donation = false;
                if (chatgive.type_get === 'money_or_quickgive' || chatgive.type_get === 'fund_or_quickgive') {
                    if(answer.toString().startsWith('quickgive_')){ // REPEAT DONATION
                        chatgive.is_repeat_donation = true;
                        chatgive.temp_amount = answer.replace('quickgive_','');
                        answer = 'quickgive';
                    } else {
                        chatgive.temp_amount = answer.toString();
                    }
                }

                //Temporal Saving CC and ACH Forms
                if (chatgive.type_get === 'confirmation') {
                    chatgive.payment_form['answer'] = answer;
                    answer = JSON.stringify(chatgive.payment_form);
                }

                //Main Bot AJAX
                var data = {
                    id_bot: chatgive.id_bot,
                    answer: answer,
                    bk_answer: bk_answer,
                    church_id: chatgive.church_id,
                    campus_id: chatgive.campus_id,
                    chatgive_tokens: _chatgive_link,
                    bk_session_data: chatgive.session_data
                };

                try {
                    data['token'] = localStorage.getItem('test_value');
                } catch (e) {
                    console.log(e);
                }

                $w.each(data_additional,function (key,value) {
                    data[key] = value;
                });

                if (chatgive.type_get === 'no_send_form') {
                    if ($w('.sc-message-list .sc-message-received:last .widget_card_number').length) {
                        data.answer = '{}';
                        data.bk_answer = '{}';
                    }
                }

                //Back to previous button clicked
                if(is_back){
                    chatgive.id_bot = id_bot;
                    data['id_bot'] = id_bot;
                    data['is_back'] = true;
                }

                data[chatgive.token_name] = chatgive.token_code;
                if(chatgive.type_get === 'buttons' || chatgive.type_get === 'buttons_methods'){
                    data['button_text'] = button_text;
                }
                controller = "widget/index";
                if (chatgive.id_bot === 1) {
                    var controller = "widget/is_logged";

                    $header_refresh = "Bearer ";
                    try {
                        if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                            $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                        }
                    } catch (e) {}
                    try {
                        await $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if (data.status == true) {
                                if (data.d1a22a6f44f8b11b132a1ea) {
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {
                                    }
                                }
                            }
                        })
                    } catch (e) {}
                }

                var current_type_get = chatgive.type_get;

                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                try {
                    localStorage.setItem('b25a9b3d0c99f288c', data.chat.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                    localStorage.setItem('564c8d74f693c47f5', data.chat.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + controller,
                    data: data,
                    headers: {'Authorization': $header},
                    dataType: 'json',
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        chatgive.is_button_clicked = false;
                        if (data.new_token) {
                            chatgive.token_name = data.new_token.name;
                            chatgive.token_code = data.new_token.value;
                        }
                        chatgive.session_data = data.bk_session_data;

                        //When Log In
                        if(data.chat.d1a22a6f44f8b11b132a1ea){
                            try {
                                localStorage.setItem('b25a9b3d0c99f288c', data.chat.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                localStorage.setItem('564c8d74f693c47f5', data.chat.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                            } catch (e) {}
                        }

                        //When Register
                        if(data.chat.data && data.chat.data.d1a22a6f44f8b11b132a1ea){
                            try {
                                localStorage.setItem('b25a9b3d0c99f288c', data.chat.data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                localStorage.setItem('564c8d74f693c47f5', data.chat.data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                            } catch (e) {}
                        }

                        if (data.status) {
                            $w('.alert_validation').hide();

                            //Login on first Request
                            if (chatgive.id_bot === 1) {
                                if (data.chat.is_logged) {
                                    //It's Square Quickgive
                                    if(_chatgive_link['standalone'] === 2){
                                        $w('.sign_out').show();
                                    } else {
                                        $w('.logged_item').show();
                                    }
                                    chatgive.loadProfile();
                                    $w('#sign_in').hide();
                                    $w('#sign_up').hide();
                                } else {
                                    if(_chatgive_link['standalone'] === 2){
                                        $w('.sign_out').hide();
                                    } else {
                                        $w('.logged_item').hide();
                                        $w('#profile_name_header').hide();
                                    }
                                    $w('#sign_in').show();
                                    $w('#sign_up').show();
                                }
                            }

                            //Validation exp_date
                            if (data.chat.type_get === 'payment_form' && data.chat.data && data.chat.data.is_expiration) {
                                if (data.chat.data.exp_status == 0) {
                                    $w('.sc-typing').remove();
                                    $w('.sc-message-list .sc-message-received:last .alert_validation').text(data.chat.data.exp_message);
                                    $w('.sc-message-list .sc-message-received:last .alert_validation').show();
                                    $w('.sc-user-input--text').prop('contenteditable', true);
                                    chatgive.processing_bot = false;
                                    return false;
                                }
                                $w('.sc-message-list .sc-message-received:last .alert_validation').text('');
                                $w('.sc-message-list .sc-message-received:last .alert_validation').hide();
                            }

                            chatgive.id_bot = data.chat.id_bot;
                            chatgive.type_set = data.chat.type_set;
                            chatgive.type_get = data.chat.type_get;

                            //Saving Amount Gross
                            if(data.chat.data && data.chat.data.amount_gross){
                                chatgive.temp_amount = data.chat.data.amount_gross.toString();
                            }

                            //Setting Login Successful verifix this code is not used
                            if(data.chat.type_get === "login"){
                                if(_chatgive_link['standalone'] === 2){
                                    $w('.sign_out').show();
                                } else {
                                    $w('.logged_item').show();
                                }
                                chatgive.loadProfile();
                                $w('#sign_in').hide();
                                $w('#sign_up').hide();
                            }

                            //Login Here
                            if (data.chat.is_logging === true) {
                                //It's Square Quickgive
                                if(_chatgive_link['standalone'] === 2){
                                    $w('.sign_out').show();
                                } else {
                                    $w('.logged_item').show();
                                }

                                //The chat can have buttons and elements created without the session, after creating a session the user can go back and reuse those elements, we need to specify those elements work under the session
                                $w.each(data.chat.session_enabled_ids,function () {
                                    $w('[data-bot="'+this.id+'"]').attr('data-bot', this.session_enabled_id)
                                });

                                chatgive.loadProfile();
                                $w('#sign_in').hide();
                                $w('#sign_up').hide();
                            }

                            $w('.sc-user-input--text').prop('contenteditable', false);

                            //Save Payment Form on local variable
                            if (current_type_get === 'no_send_form') {
                                $w('.sc-typing').remove();
                                if ($w('.sc-message-list .sc-message-received:last .widget_card_number').length) {
                                    chatgive.payment_form = JSON.parse(answer);
                                    answer = '{}';
                                } else {
                                    var form = $w('.sc-message-received:last .payment_form');
                                    if (form) {
                                        var form_data = form.serializeArray();
                                        var send_data = {};
                                        $w.each(form_data, function () {
                                            send_data[this.name] = this.value.trim();
                                        });
                                        chatgive.payment_form = send_data;
                                    }
                                }
                            }

                            chatgive.is_quickgive_empty = false; // FOR QuickGive - 1 question at a time
                            //Showing Message
                            if(data.chat.is_validation){
                                chatgive.receivedMessageReadOnly(data.chat.html)
                            } else {
                                //It's Square Quickgive
                                if(_chatgive_link['standalone'] === 2) {
                                    if (chatgive.is_before_autocomplete === false){
                                        $w('.sc-message-list').empty();
                                        chatgive.is_quickgive_empty = true; // FOR QuickGive - 1 question at a time
                                    }
                                    if (data.chat.type_set === 'auto_message'){
                                        chatgive.is_before_autocomplete = true;
                                    } else {
                                        chatgive.is_before_autocomplete = false;
                                    }
                                }
                                chatgive.receivedMessage(data.chat.html,data.chat.id_bot,data.chat.type_get);
                            }

                            //Widget CC PSF Form
                            if (chatgive.payment_processor == 'PSF') {
                                if ($w('.sc-message-list .sc-message-received:last .widget_card_number').length) {
                                    var options_profile = {
                                        // select the Paysafe test / sandbox environment
                                        environment: chatgive.paysafe_environment,
                                        // set the CSS selectors to identify the payment field divs above
                                        // set the placeholder text to display in these fields
                                        fields: {
                                            cardNumber: {
                                                selector: ".sc-message-received:last-of-type .widget_card_number",
                                                placeholder: 'Card Number'
                                            },
                                            expiryDate: {
                                                selector: ".sc-message-received:last-of-type .widget_expiry_date",
                                                placeholder: 'Expiration Date (mm/yy)'
                                            },
                                            cvv: {
                                                selector: ".sc-message-received:last-of-type .widget_cvv",
                                                placeholder: 'CVV'
                                            }
                                        },
                                        style: {
                                            input: {
                                                "font-family": "robotoregular,Helvetica,Arial,sans-serif",
                                                "font-weight": "normal",
                                                "font-size": "14px",
                                                "color": "hsl(212, 17%, 60%)"
                                            }
                                        }
                                    };

                                    chatgive.paysafe_profile_is_setup = true;
                                    paysafe.fields.setup(chatgive.paysafe_apiKey, options_profile, function(instance, error) {
                                        $w('.sc-message-received:last-of-type .sc-btn-form-psf').click(function () {
                                            $w('.sc-message-list .sc-message-received:last .alert_validation').text('');
                                            $w('.sc-message-list .sc-message-received:last .alert_validation').hide();
                                            instance.tokenize(function(instance, error, result) {
                                                if (error) {
                                                    // display the tokenization error in dialog window
                                                    $w('.sc-message-list .sc-message-received:last .alert_validation').text(error.displayMessage);
                                                    $w('.sc-message-list .sc-message-received:last .alert_validation').show();
                                                } else {
                                                    send_data = {};
                                                    var form = $w('.sc-message-received:last .payment_form');
                                                    var data = form.serializeArray();
                                                    $w.each(data, function () {
                                                        send_data[this.name] = this.value;
                                                    });
                                                    send_data['single_use_token'] = result.token;
                                                    send_data = JSON.stringify(send_data);
                                                    $w('.sc-user-input--text').prop('contenteditable', true);
                                                    chatgive.processing_bot = false;
                                                    chatgive.bot(send_data);
                                                }
                                            });
                                        });
                                    });
                                }
                            }

                            //Setting Countries on New Bank account form
                            if($w('.sc-message-list .sc-message-received:last .country_picker').length){
                                $w.each(countries_all,function (key,value) {
                                    $w('.sc-message-list .sc-message-received:last .country_picker').append(
                                        '<option value="'+key+'">'+value+'</option>'
                                    )
                                })
                            }

                            //Set Chat History
                            chatgive.history.push({id:data.chat.id_bot,back:data.chat.back});

                            //Setting Input Masks for CC and ACH
                            chatgive.inputMasks();

                            //Validate Payment
                            if (data.chat.type_get === 'validate_payment') {
                                if (data.chat.data.status === false) {
                                    chatgive.type_get = 'end';
                                    chatgive.typingMessage();
                                    setTimeout(function () {
                                        $w('.sc-typing').remove();
                                        chatgive.receivedMessage(data.chat.data.message,data.chat.id_bot,data.chat.type_get);
                                    }, 750);
                                    chatgive.processing_bot = false;
                                    return;
                                }
                            }

                            //Setting Email in password form
                            if (data.chat.type_set === 'form_password') {
                                $w('.sc-user-input--text').addClass('sc-password');
                                $w('.sc-user-input--text').html(`
                                    <input type="email" name="username" id="sc-input-email" style="display: none;">
                                    <input type="password" name="password" autocomplete="on" id="sc-input-password" placeholder="Enter the password">       
                                    <input id="sc-do-login" name="doLogin"  type="submit" value="Login" style="display: none;" />
                                `);
                                $w('input[name="email"]').val(chatgive.temp_email);
                                $w('#sc-input-email').val(chatgive.temp_email);
                                $w('.sc-user-input--text #sc-input-password').focus();
                                $w('#sc-lock').show();
                            }

                            //Auto Message
                            if (data.chat.type_set === 'auto_message' || data.chat.type_set === 'auto_message_once') {
                                $w('.sc-user-input--text').prop('contenteditable', false);
                                $w('.sc-typing').remove();
                                chatgive.typingMessage();
                                setTimeout(function () {
                                    chatgive.processing_bot = false;
                                    chatgive.bot();
                                }, 1000);
                                return;
                            }

                            //Reset Bot Timeout when after automessage is just once
                            chatgive.bot_timeout = 750;

                            //Keep Lock chat on Form
                            if (data.chat.type_get !== 'form'
                                && data.chat.type_get !== 'form_password'
                                && data.chat.type_get !== 'no_send_form'
                                //&& data.chat.type_get !== 'payment_form'
                                && data.chat.type_get !== 'end'
                            ) {
                                $w('.sc-user-input--text').prop('contenteditable', true);
                                $w('.sc-user-input--text').focus();
                            }

                            //Showing Back Button
                            if(!data.chat.is_validation) {
                                var previous_chat = chatgive.history[chatgive.history.length - 2];
                                if (previous_chat.back === "1") {
                                    var received_message = $w('.sc-message-list .sc-message-received:last .sc-message--text');
                                    var buttons_form_container = received_message.find('.sc-buttons-form-container');
                                    if (buttons_form_container.length > 0) {
                                        buttons_form_container.append(`<a class="sc-link sc-btn-history-back" href="javascript:void(0)">
                                                                        Go Back</a> 
                                                                `);
                                    } else {
                                        received_message.append(`<div class="sc-buttons-container">  
                                                           <a class="sc-link sc-btn-history-back" href="javascript:void(0)">
                                                           Go Back</a> 
                                                        </div>
                                                    `);
                                    }
                                }
                                if(!chatgive.is_quickgive_empty) {
                                    var message_list = $w('.sc-message-list');
                                    message_list.get(0).scrollTop = message_list.get(0).scrollHeight;
                                }
                            }


                            //Hide Country Picker when is US or CA region
                            if(data.chat.type_get === 'no_send_form' || data.chat.type_get === 'form_method'){
                                if(data.chat.data && data.chat.data.hide_country){
                                    $w('.sc-message-list .sc-message-received:last .country_picker').hide();
                                    $w('.sc-message-list .sc-message-received:last .country_picker').val(data.chat.data.autoselect_country);
                                }
                            }

                            //Last final button confirmation Give
                            if(data.chat.type_get === 'confirmation'){
                                $w('.sc-main-input-text').hide();
                                var amount = parseFloat(chatgive.temp_amount.replace('$',''));
                                if(data.chat.data.is_cover_fee && !chatgive.is_repeat_donation) {
                                    amount = parseFloat(amount + data.chat.data.fee).toFixed(2).toString();
                                }
                                $w('.sc-give-confirmation span').text('Give $'+ amount);
                                $w('.sc-give-confirmation').show();
                            }

                            if($w('.sc-message-list .sc-message-received:last .select_bank_type').length){
                                $w('.sc-message-list .sc-message-received:last .select_bank_type').change(function () {
                                    $w('.sc-message-list .sc-message-received:last .bank_type').hide();
                                    var bank_type = $w(this).val();
                                    $w('.sc-message-list .sc-message-received:last .'+bank_type+'_type').show();
                                });
                                $w('.sc-message-list .sc-message-received:last .select_bank_type').change();
                            }
                        } else {
                            //Validation on Forms
                            $w('.sc-typing').remove();
                            $w('.sc-message-list .sc-message-received:last .alert_validation').text(data.chat.html);
                            $w('.sc-message-list .sc-message-received:last .alert_validation').show();
                        }
                        chatgive.processing_bot = false;
                    }).fail(function (data,status) {
                        var chat_data = data.responseJSON;
                        if(chat_data.code && (chat_data.code == 'access_token_not_found' || chat_data.code == 'access_token_expired')) {
                            $header_refresh = "Bearer ";
                            try {
                                if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                    $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                                }
                            } catch (e) {}
                            $w.ajax({
                                type: "POST",
                                url: chatgive.base_url + 'wtoken/refresh',
                                headers: {'Authorization': $header_refresh},
                                dataType: 'json',
                                crossDomain: true,
                                xhrFields: {
                                    withCredentials: true
                                }
                            }).done(function (data, status) {
                                if(data.status == true){
                                    if(data.d1a22a6f44f8b11b132a1ea){
                                        try {
                                            localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                            localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                        } catch (e) {}
                                    }
                                    chatgive.processing_bot = false;
                                    chatgive.bot(bk_answer,is_back ,id_bot,type_get,data_additional);
                                } else {
                                    chatgive.receivedMessageReadOnly(data.responseJSON.message);
                                }
                            }).fail(function () {
                                chatgive.no_logged_chat();
                            });
                        } else {
                            chatgive.receivedMessageReadOnly(data.responseJSON.message);
                        }
                });
            }, chatgive.bot_timeout);
        };

        //===========
        var toggleChatClicked = false;
        chatgive.toggleChat = function () {
            if(chatgive.processing_bot)
                return;

            if (toggleChatClicked === true) {
                return;
            }

            chatgive.processing_bot = true;

            if (chatgive.t_message_displayed === true) {
                $w('#trigger_message span').fadeOut();
                setTimeout(function () {
                    $w('#trigger_message').css('width', '60px');
                    setTimeout(function () {
                        $w('#trigger_message').css('display', 'none');
                    }, 1000);
                }, 300);
            }

            toggleChatClicked = true;

            chatgive.is_opening = false;

            if (!$w('.sc-launcher').hasClass('opened')) {
                parent.postMessage("opened", '*');
                chatgive.is_opening = true;
            }

            if (chatgive.is_opening === true) {
                setTimeout(function () {
                    $w('.sc-launcher').toggleClass('opened');
                    $w('.sc-chat-window').toggleClass('opened');
                    $w('.sc-chat-window').toggleClass('closed');
                    var message_list = $w('.sc-message-list').get(0);
                    message_list.scrollTop = message_list.scrollHeight;
                    toggleChatClicked = false;
                }, 300);
            } else {
                $w('.sc-launcher').toggleClass('opened');
                $w('.sc-chat-window').toggleClass('opened');
                $w('.sc-chat-window').toggleClass('closed');
                var message_list = $w('.sc-message-list').get(0);
                message_list.scrollTop = message_list.scrollHeight;
            }


            if (!$w('.sc-launcher').hasClass('opened') && chatgive.is_opening === false) {
                setTimeout(function () {
                    parent.postMessage("closed", '*');
                    toggleChatClicked = false;
                }, 300);
            }

            if (chatgive.id_bot === 1) {
                chatgive.processing_bot = false;
                chatgive.bot();
            }
        };

        chatgive.sentMessageKeyEnter = function (e) {
            if (e.keyCode == 13) {
                chatgive.sendMessage();
                e.preventDefault();
                return false;
            }
        };

        chatgive.sendMessage = function () {
            if(chatgive.processing_bot)
                return;

            chatgive.processing_bot = true;

            var message = $w('.sc-user-input--text').html();
            if (message === "") {
                chatgive.processing_bot = false;
                return;
            }

            var send_data = {};

            if (chatgive.type_set === 'form_password') {
                var password = $w('.sc-user-input--text input:password').val();
                $w('#password_form input[name="password"]').val(password);
                message = "••••••••••";
                var form = $w('#password_form');
                var data = form.serializeArray();

                $w.each(data, function () {
                    send_data[this.name] = this.value;
                });
                send_data = JSON.stringify(send_data);
                $w('.sc-user-input').submit(function (event) {
                    event.preventDefault();
                });
                $w('#sc-do-login').click();
            }

            var messageHtml =
                `<div class="sc-message">
                <div class="sc-message--content sent">
                    <div class="sc-message--avatar" style="background-image: url(` + chatgive.base_url + `assets/widget/chat-icon.svg);"></div>
                    <div class="sc-message--text theme_color button_text_color"><span class="Linkify">` + message + `</span></div>
                </div>
            </div>`;

            var message_list = $w('.sc-message-list').get(0);
            message_list.innerHTML += messageHtml;
            message_list.scrollTop = message_list.scrollHeight;
            $w('.sc-user-input--text').text('');
            chatgive.processing_bot = false;
            if (chatgive.type_set === 'form_password') {
                chatgive.bot(send_data);
            } else {
                chatgive.bot(message);
            }

            $w('.sc-user-input--text').prop('contenteditable', false);
            $w('#sc-lock').hide();
        };

        chatgive.receivedMessage = function (message, id_bot, type_get) {
            $w('.sc-typing').remove();
            //===== evaluate probably xss vulnerabilties
            var messageHtml =
            `<div class="sc-message received sc-message-received theme-text-color" data-bot="`+id_bot+`" data-tg="`+type_get+`">
                <div class="sc-message--content received">
                    <div class="sc-message--avatar" style="background-image: url(&quot;chat-icon.svg&quot;);"></div>
                    <div class="sc-message--text theme_text_color"><span class="Linkify">` + message + `</span></div>
                </div>
            </div>`;

            var message_list = $w('.sc-message-list');
            message_list.append(messageHtml);

            //Moving Buttons Options Out - Options
            var buttons = $w('.sc-message-received:last .sc-options-buttons-container');
            buttons.css('visibility','collapse');
            var parent = buttons.parent().parent().parent();
            parent.append(buttons);
            buttons.css('visibility','visible');

            //Moving Quickgive
            var quickgive = $w('.sc-message-received:last .sc-quickgive-container');
            quickgive.css('visibility','collapse');
            var parent_quickgive = quickgive.parent().parent().parent();
            parent_quickgive.append(quickgive);
            quickgive.css('visibility','visible');

            if(!chatgive.is_quickgive_empty) {
                message_list.get(0).scrollTop = message_list.get(0).scrollHeight;
            }
        };

        chatgive.receivedMessageReadOnly = function (message) {
            $w('.sc-typing').remove();
            //===== evaluate probably xss vulnerabilties
            var messageHtml =
                `<div class="sc-message received">
                <div class="sc-message--content received">
                    <div class="sc-message--avatar" style="background-image: url(&quot;chat-icon.svg&quot;);"></div>
                    <div class="sc-message--text theme_text_color"><span class="Linkify">` + message + `</span></div>
                </div>
            </div>`;

            var message_list = $w('.sc-message-list');
            message_list.append(messageHtml);
            message_list.get(0).scrollTop = message_list.get(0).scrollHeight;
        };

        chatgive.typingMessage = function () {
            //===== evaluate probably xss vulnerabilties
            var messageHtml = `<div class="sc-message received sc-typing" >
                <div class="sc-message--content received">
                    <div class="sc-message--avatar" style="background-image: url(&quot;chat-icon.svg&quot;);"></div>
                    <div class="sc-message--text" style="max-width: 20px; white-space: initial;"
                        "><span class="Linkify">
                        <div class="sc-spinner">
                          <div class="bounce1"></div>
                          <div class="bounce2"></div>
                          <div class="bounce3"></div>
                        </div>
                    </span></div>
                </div>
            </div>`;

            var message_list = $w('.sc-message-list');
            message_list.append(messageHtml);
            message_list.get(0).scrollTop = message_list.get(0).scrollHeight;
        };

        chatgive.activeUserInput = function (active) {
            if (active)
                $w('.sc-user-input').addClass('active');
            else
                $w('.sc-user-input').removeClass('active');
        };

        chatgive.loadTemplate = function () {
            var standaloneClass = "";
            if(_chatgive_link['standalone'] > 0){
                standaloneClass = 'class="sc-standalone"';
            }
            $w('body').append(`
            <div id="sc-launcher" ` + standaloneClass + `>
                <div id="cover_spin"></div>
                <div id="trigger_message">
                    <span>
                        Welcome, you can now give easier by clicking here!
                    </span>
                </div>
                <div class="sc-launcher theme_color">
                    <img class="sc-open-icon" src="` + chatgive.base_url + `assets/widget/close-icon.png">
                    <img class="sc-closed-icon" src="` + chatgive.base_url + `assets/widget/chat_icon_transparent.png" style="transform: scale(0.6);">
                </div>
                <div class="sc-chat-window closed">
                    <div class="sc-header">
                        <div class="sc-left-menu">
                            <img class="sc-left-menu-img" src="` + chatgive.base_url + `assets/widget/leftmenuicon.png" alt="">
                        </div>

                        <div class="backbround-dropdown"></div>

                        <div id="main_left_menu" class="dropdown-content">
                            <div id="profile_name_header" class="sc-header--button" style="display: none">
                            </div>
                            <div id="main_left_header">
                                <img src="` + chatgive.logo + `" alt="">
                            </div>
                            <a href="#" id="sign_in" class="sign_in" style="display: none">                                 
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/sign-in-alt-solid.svg?v=2" alt="" >
                                   <div class="sc-menu-item-name">Log In</div></a>
                            <a href="#" id="sign_up" class="sign_up" style="display: none">                                 
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/plus-circle-solid.svg?v=2" alt="" >
                                   <div class="sc-menu-item-name">Register</div></a>
                            <a href="#" id="profile" class="logged_item" style="display: none">
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/user-solid.svg?v=2" alt="" >
                                <div class="sc-menu-item-name">Profile</div></a>
                            <a href="#" id="profile_saved_sources_btn" class="logged_item" style="display: none">
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/credit-card-solid.svg?v=2" alt="" >
                                <div class="sc-menu-item-name">Payment</div></a>
                            <a href="#" id="profile_giving_btn" class="logged_item" style="display: none">
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/hand-holding-usd-solid.svg?v=2" alt="" >
                                <div class="sc-menu-item-name">My Giving</div></a>
                            <a href="#" id="sign_out" class="logged_item sign_out_btn" style="display: none">
                                <img class="sc-menu-item" src="` + chatgive.base_url + `assets/widget/sign-out-alt-solid.svg?v=2" alt="" >
                                <div class="sc-menu-item-name">Log out</div></a>
                            <a href="#" class="sc-close-button" style="display: none">
                                <img class="sc-menu-item" style="width: 15px; padding-left: 4px;" src="` + chatgive.base_url + `assets/widget/close-solid.svg?v=2"   alt="">
                                <div class="sc-menu-item-name">Close</div></a>
                        </div>                        
                        <div class="sc-header-title">
                            <img class="sc-header--img" src="` + chatgive.logo + `" alt="">
                            <div class="sc-header--team-name theme_text_color">
                                Chat Give
                            </div>
                        </div>
                        <div class="sc-right-menu">                       
                        </div>
                    </div>
                    <div id="sc-body-main" class="sc-body-chat">
                        <div class="sc-message-list">
                        </div>
                        <form class="sc-user-input" action="" method="post">
                            <div class="sc-powered">
                                <a class="sc-link sc-powered-link" href="https://chatgive.com/" target="_blank">Powered by ChatGive</a>
                            </div>
                            <div role="button" tabindex="0" contenteditable="true" placeholder="Write a reply..." class="sc-user-input--text sc-main-input-text"></div>
                            <div class="sc-give-confirmation theme_color" style="display: none;">
                                <span class="sc-mont button_text_color">Give</span>
                            </div>
                            <div class="sc-user-input--buttons">
                                <div class="sc-user-input--button"></div>
                                <div class="sc-user-input--button">
                                    <div class="sc-user-input--picker-wrapper">
                                        <div class="sc-popup-window">
                                            <div class="sc-popup-window--cointainer closed">
                                                <input class="sc-popup-window--search" placeholder="Search emoji...">
                                                <div class="sc-emoji-picker">
                                                    <div class="sc-emoji-picker--category">
                                                        <div class="sc-emoji-picker--category-title">People</div>
                                                        <span class="sc-emoji-picker--emoji">😄</span><span class="sc-emoji-picker--emoji">😃</span><span class="sc-emoji-picker--emoji">😀</span><span class="sc-emoji-picker--emoji">😊</span><span class="sc-emoji-picker--emoji">😉</span>
                                                        <span class="sc-emoji-picker--emoji">😍</span><span class="sc-emoji-picker--emoji">😘</span><span class="sc-emoji-picker--emoji">😚</span><span class="sc-emoji-picker--emoji">😗</span><span class="sc-emoji-picker--emoji">😙</span>
                                                        <span class="sc-emoji-picker--emoji">😜</span>
                                                        <span class="sc-emoji-picker--emoji">😝</span><span class="sc-emoji-picker--emoji">😛</span><span class="sc-emoji-picker--emoji">😳</span><span class="sc-emoji-picker--emoji">😁</span><span class="sc-emoji-picker--emoji">😔</span>
                                                        <span class="sc-emoji-picker--emoji">😌</span>
                                                        <span class="sc-emoji-picker--emoji">😒</span><span class="sc-emoji-picker--emoji">😞</span><span class="sc-emoji-picker--emoji">😣</span><span class="sc-emoji-picker--emoji">😢</span><span class="sc-emoji-picker--emoji">😂</span>
                                                        <span class="sc-emoji-picker--emoji">😭</span><span class="sc-emoji-picker--emoji">😪</span><span class="sc-emoji-picker--emoji">😥</span><span class="sc-emoji-picker--emoji">😰</span><span class="sc-emoji-picker--emoji">😅</span>
                                                        <span class="sc-emoji-picker--emoji">😓</span><span class="sc-emoji-picker--emoji">😩</span><span class="sc-emoji-picker--emoji">😫</span><span class="sc-emoji-picker--emoji">😨</span><span class="sc-emoji-picker--emoji">😱</span>
                                                        <span class="sc-emoji-picker--emoji">😠</span><span class="sc-emoji-picker--emoji">😡</span><span class="sc-emoji-picker--emoji">😤</span><span class="sc-emoji-picker--emoji">😖</span><span class="sc-emoji-picker--emoji">😆</span>
                                                        <span class="sc-emoji-picker--emoji">😋</span><span class="sc-emoji-picker--emoji">😷</span><span class="sc-emoji-picker--emoji">😎</span><span class="sc-emoji-picker--emoji">😴</span><span class="sc-emoji-picker--emoji">😵</span>
                                                        <span class="sc-emoji-picker--emoji">😲</span><span class="sc-emoji-picker--emoji">😟</span><span class="sc-emoji-picker--emoji">😦</span><span class="sc-emoji-picker--emoji">😧</span><span class="sc-emoji-picker--emoji">👿</span>
                                                        <span class="sc-emoji-picker--emoji">😮</span><span class="sc-emoji-picker--emoji">😬</span><span class="sc-emoji-picker--emoji">😐</span><span class="sc-emoji-picker--emoji">😕</span><span class="sc-emoji-picker--emoji">😯</span>
                                                        <span class="sc-emoji-picker--emoji">😏</span><span class="sc-emoji-picker--emoji">😑</span><span class="sc-emoji-picker--emoji">👲</span><span class="sc-emoji-picker--emoji">👳</span><span class="sc-emoji-picker--emoji">👮</span>
                                                        <span class="sc-emoji-picker--emoji">👷</span><span class="sc-emoji-picker--emoji">💂</span><span class="sc-emoji-picker--emoji">👶</span><span class="sc-emoji-picker--emoji">👦</span><span class="sc-emoji-picker--emoji">👧</span>
                                                        <span class="sc-emoji-picker--emoji">👨</span><span class="sc-emoji-picker--emoji">👩</span><span class="sc-emoji-picker--emoji">👴</span><span class="sc-emoji-picker--emoji">👵</span><span class="sc-emoji-picker--emoji">👱</span>
                                                        <span class="sc-emoji-picker--emoji">👼</span><span class="sc-emoji-picker--emoji">👸</span><span class="sc-emoji-picker--emoji">😺</span><span class="sc-emoji-picker--emoji">😸</span><span class="sc-emoji-picker--emoji">😻</span>
                                                        <span class="sc-emoji-picker--emoji">😽</span><span class="sc-emoji-picker--emoji">😼</span><span class="sc-emoji-picker--emoji">🙀</span><span class="sc-emoji-picker--emoji">😿</span><span class="sc-emoji-picker--emoji">😹</span>
                                                        <span class="sc-emoji-picker--emoji">😾</span><span class="sc-emoji-picker--emoji">👹</span><span class="sc-emoji-picker--emoji">👺</span><span class="sc-emoji-picker--emoji">🙈</span>
                                                        <span class="sc-emoji-picker--emoji">🙉</span><span class="sc-emoji-picker--emoji">🙊</span><span class="sc-emoji-picker--emoji">💀</span><span class="sc-emoji-picker--emoji">👽</span>
                                                        <span class="sc-emoji-picker--emoji">💩</span><span class="sc-emoji-picker--emoji">🔥</span><span class="sc-emoji-picker--emoji">✨</span><span class="sc-emoji-picker--emoji">🌟</span>
                                                        <span class="sc-emoji-picker--emoji">💫</span><span class="sc-emoji-picker--emoji">💥</span><span class="sc-emoji-picker--emoji">💢</span><span class="sc-emoji-picker--emoji">💦</span>
                                                        <span class="sc-emoji-picker--emoji">💧</span><span class="sc-emoji-picker--emoji">💤</span><span class="sc-emoji-picker--emoji">💨</span><span class="sc-emoji-picker--emoji">👂</span>
                                                        <span class="sc-emoji-picker--emoji">👀</span><span class="sc-emoji-picker--emoji">👃</span><span class="sc-emoji-picker--emoji">👅</span><span class="sc-emoji-picker--emoji">👄</span>
                                                        <span class="sc-emoji-picker--emoji">👍</span><span class="sc-emoji-picker--emoji">👎</span><span class="sc-emoji-picker--emoji">👌</span><span class="sc-emoji-picker--emoji">👊</span>
                                                        <span class="sc-emoji-picker--emoji">✊</span><span class="sc-emoji-picker--emoji">👋</span><span class="sc-emoji-picker--emoji">✋</span><span class="sc-emoji-picker--emoji">👐</span>
                                                        <span class="sc-emoji-picker--emoji">👆</span><span class="sc-emoji-picker--emoji">👇</span><span class="sc-emoji-picker--emoji">👉</span><span class="sc-emoji-picker--emoji">👈</span>
                                                        <span class="sc-emoji-picker--emoji">🙌</span><span class="sc-emoji-picker--emoji">🙏</span><span class="sc-emoji-picker--emoji">👏</span><span class="sc-emoji-picker--emoji">💪</span>
                                                        <span class="sc-emoji-picker--emoji">🚶</span><span class="sc-emoji-picker--emoji">🏃</span><span class="sc-emoji-picker--emoji">💃</span><span class="sc-emoji-picker--emoji">👫</span>
                                                        <span class="sc-emoji-picker--emoji">👪</span><span class="sc-emoji-picker--emoji">💏</span><span class="sc-emoji-picker--emoji">💑</span>
                                                        <span class="sc-emoji-picker--emoji">👯</span><span class="sc-emoji-picker--emoji">🙆</span><span class="sc-emoji-picker--emoji">🙅</span>
                                                        <span class="sc-emoji-picker--emoji">💁</span><span class="sc-emoji-picker--emoji">🙋</span><span class="sc-emoji-picker--emoji">💆</span>
                                                        <span class="sc-emoji-picker--emoji">💇</span><span class="sc-emoji-picker--emoji">💅</span><span class="sc-emoji-picker--emoji">👰</span>
                                                        <span class="sc-emoji-picker--emoji">🙎</span><span class="sc-emoji-picker--emoji">🙍</span><span class="sc-emoji-picker--emoji">🙇</span>
                                                        <span class="sc-emoji-picker--emoji">🎩</span><span class="sc-emoji-picker--emoji">👑</span><span class="sc-emoji-picker--emoji">👒</span>
                                                        <span class="sc-emoji-picker--emoji">👟</span><span class="sc-emoji-picker--emoji">👞</span><span class="sc-emoji-picker--emoji">👡</span>
                                                        <span class="sc-emoji-picker--emoji">👠</span><span class="sc-emoji-picker--emoji">👢</span><span class="sc-emoji-picker--emoji">👕</span>
                                                        <span class="sc-emoji-picker--emoji">👔</span><span class="sc-emoji-picker--emoji">👚</span><span class="sc-emoji-picker--emoji">👗</span>
                                                        <span class="sc-emoji-picker--emoji">🎽</span><span class="sc-emoji-picker--emoji">👖</span><span class="sc-emoji-picker--emoji">👘</span>
                                                        <span class="sc-emoji-picker--emoji">👙</span><span class="sc-emoji-picker--emoji">💼</span><span class="sc-emoji-picker--emoji">👜</span>
                                                        <span class="sc-emoji-picker--emoji">👝</span><span class="sc-emoji-picker--emoji">👛</span><span class="sc-emoji-picker--emoji">👓</span>
                                                        <span class="sc-emoji-picker--emoji">🎀</span><span class="sc-emoji-picker--emoji">🌂</span>
                                                        <span class="sc-emoji-picker--emoji">💄</span><span class="sc-emoji-picker--emoji">💛</span>
                                                        <span class="sc-emoji-picker--emoji">💙</span><span class="sc-emoji-picker--emoji">💜</span>
                                                        <span class="sc-emoji-picker--emoji">💚</span><span class="sc-emoji-picker--emoji">💔</span>
                                                        <span class="sc-emoji-picker--emoji">💗</span><span class="sc-emoji-picker--emoji">💓</span>
                                                        <span class="sc-emoji-picker--emoji">💕</span><span class="sc-emoji-picker--emoji">💖</span>
                                                        <span class="sc-emoji-picker--emoji">💞</span><span class="sc-emoji-picker--emoji">💘</span>
                                                        <span class="sc-emoji-picker--emoji">💌</span><span class="sc-emoji-picker--emoji">💋</span>
                                                        <span class="sc-emoji-picker--emoji">💍</span><span class="sc-emoji-picker--emoji">💎</span>
                                                        <span class="sc-emoji-picker--emoji">👤</span><span class="sc-emoji-picker--emoji">💬</span>
                                                        <span class="sc-emoji-picker--emoji">👣</span>
                                                    </div>
                                                    <div class="sc-emoji-picker--category">
                                                        <div class="sc-emoji-picker--category-title">Nature</div>
                                                        <span class="sc-emoji-picker--emoji">🐶</span><span class="sc-emoji-picker--emoji">🐺</span><span class="sc-emoji-picker--emoji">🐱</span><span class="sc-emoji-picker--emoji">🐭</span><span class="sc-emoji-picker--emoji">🐹</span>
                                                        <span class="sc-emoji-picker--emoji">🐰</span><span class="sc-emoji-picker--emoji">🐸</span><span class="sc-emoji-picker--emoji">🐯</span><span class="sc-emoji-picker--emoji">🐨</span><span class="sc-emoji-picker--emoji">🐻</span>
                                                        <span class="sc-emoji-picker--emoji">🐷</span>
                                                        <span class="sc-emoji-picker--emoji">🐽</span><span class="sc-emoji-picker--emoji">🐮</span><span class="sc-emoji-picker--emoji">🐗</span><span class="sc-emoji-picker--emoji">🐵</span><span class="sc-emoji-picker--emoji">🐒</span>
                                                        <span class="sc-emoji-picker--emoji">🐴</span>
                                                        <span class="sc-emoji-picker--emoji">🐑</span><span class="sc-emoji-picker--emoji">🐘</span><span class="sc-emoji-picker--emoji">🐼</span><span class="sc-emoji-picker--emoji">🐧</span><span class="sc-emoji-picker--emoji">🐦</span>
                                                        <span class="sc-emoji-picker--emoji">🐤</span><span class="sc-emoji-picker--emoji">🐥</span><span class="sc-emoji-picker--emoji">🐣</span><span class="sc-emoji-picker--emoji">🐔</span><span class="sc-emoji-picker--emoji">🐍</span>
                                                        <span class="sc-emoji-picker--emoji">🐢</span><span class="sc-emoji-picker--emoji">🐛</span><span class="sc-emoji-picker--emoji">🐝</span><span class="sc-emoji-picker--emoji">🐜</span><span class="sc-emoji-picker--emoji">🐞</span>
                                                        <span class="sc-emoji-picker--emoji">🐌</span><span class="sc-emoji-picker--emoji">🐙</span><span class="sc-emoji-picker--emoji">🐚</span><span class="sc-emoji-picker--emoji">🐠</span><span class="sc-emoji-picker--emoji">🐟</span>
                                                        <span class="sc-emoji-picker--emoji">🐬</span><span class="sc-emoji-picker--emoji">🐳</span><span class="sc-emoji-picker--emoji">🐎</span><span class="sc-emoji-picker--emoji">🐲</span><span class="sc-emoji-picker--emoji">🐡</span>
                                                        <span class="sc-emoji-picker--emoji">🐫</span><span class="sc-emoji-picker--emoji">🐩</span><span class="sc-emoji-picker--emoji">🐾</span><span class="sc-emoji-picker--emoji">💐</span><span class="sc-emoji-picker--emoji">🌸</span>
                                                        <span class="sc-emoji-picker--emoji">🌷</span><span class="sc-emoji-picker--emoji">🍀</span><span class="sc-emoji-picker--emoji">🌹</span><span class="sc-emoji-picker--emoji">🌻</span><span class="sc-emoji-picker--emoji">🌺</span>
                                                        <span class="sc-emoji-picker--emoji">🍁</span><span class="sc-emoji-picker--emoji">🍃</span><span class="sc-emoji-picker--emoji">🍂</span><span class="sc-emoji-picker--emoji">🌿</span><span class="sc-emoji-picker--emoji">🌾</span>
                                                        <span class="sc-emoji-picker--emoji">🍄</span><span class="sc-emoji-picker--emoji">🌵</span><span class="sc-emoji-picker--emoji">🌴</span><span class="sc-emoji-picker--emoji">🌰</span><span class="sc-emoji-picker--emoji">🌱</span>
                                                        <span class="sc-emoji-picker--emoji">🌼</span><span class="sc-emoji-picker--emoji">🌑</span><span class="sc-emoji-picker--emoji">🌓</span><span class="sc-emoji-picker--emoji">🌔</span><span class="sc-emoji-picker--emoji">🌕</span>
                                                        <span class="sc-emoji-picker--emoji">🌛</span><span class="sc-emoji-picker--emoji">🌙</span><span class="sc-emoji-picker--emoji">🌏</span><span class="sc-emoji-picker--emoji">🌋</span><span class="sc-emoji-picker--emoji">🌌</span>
                                                        <span class="sc-emoji-picker--emoji">🌠</span><span class="sc-emoji-picker--emoji">⛅</span><span class="sc-emoji-picker--emoji">⛄</span><span class="sc-emoji-picker--emoji">🌀</span><span class="sc-emoji-picker--emoji">🌁</span>
                                                        <span class="sc-emoji-picker--emoji">🌈</span><span class="sc-emoji-picker--emoji">🌊</span>
                                                    </div>
                                                    <div class="sc-emoji-picker--category">
                                                        <div class="sc-emoji-picker--category-title">Objects</div>
                                                        <span class="sc-emoji-picker--emoji">🎍</span><span class="sc-emoji-picker--emoji">💝</span><span class="sc-emoji-picker--emoji">🎎</span><span class="sc-emoji-picker--emoji">🎒</span><span class="sc-emoji-picker--emoji">🎓</span>
                                                        <span class="sc-emoji-picker--emoji">🎏</span><span class="sc-emoji-picker--emoji">🎆</span><span class="sc-emoji-picker--emoji">🎇</span><span class="sc-emoji-picker--emoji">🎐</span><span class="sc-emoji-picker--emoji">🎑</span>
                                                        <span class="sc-emoji-picker--emoji">🎃</span>
                                                        <span class="sc-emoji-picker--emoji">👻</span><span class="sc-emoji-picker--emoji">🎅</span><span class="sc-emoji-picker--emoji">🎄</span><span class="sc-emoji-picker--emoji">🎁</span><span class="sc-emoji-picker--emoji">🎋</span>
                                                        <span class="sc-emoji-picker--emoji">🎉</span>
                                                        <span class="sc-emoji-picker--emoji">🎊</span><span class="sc-emoji-picker--emoji">🎈</span><span class="sc-emoji-picker--emoji">🎌</span><span class="sc-emoji-picker--emoji">🔮</span><span class="sc-emoji-picker--emoji">🎥</span>
                                                        <span class="sc-emoji-picker--emoji">📷</span><span class="sc-emoji-picker--emoji">📹</span><span class="sc-emoji-picker--emoji">📼</span><span class="sc-emoji-picker--emoji">💿</span><span class="sc-emoji-picker--emoji">📀</span>
                                                        <span class="sc-emoji-picker--emoji">💽</span><span class="sc-emoji-picker--emoji">💾</span><span class="sc-emoji-picker--emoji">💻</span><span class="sc-emoji-picker--emoji">📱</span><span class="sc-emoji-picker--emoji">📞</span>
                                                        <span class="sc-emoji-picker--emoji">📟</span><span class="sc-emoji-picker--emoji">📠</span><span class="sc-emoji-picker--emoji">📡</span><span class="sc-emoji-picker--emoji">📺</span><span class="sc-emoji-picker--emoji">📻</span>
                                                        <span class="sc-emoji-picker--emoji">🔊</span><span class="sc-emoji-picker--emoji">🔔</span><span class="sc-emoji-picker--emoji">📢</span><span class="sc-emoji-picker--emoji">📣</span><span class="sc-emoji-picker--emoji">⏳</span>
                                                        <span class="sc-emoji-picker--emoji">⌛</span><span class="sc-emoji-picker--emoji">⏰</span><span class="sc-emoji-picker--emoji">⌚</span><span class="sc-emoji-picker--emoji">🔓</span><span class="sc-emoji-picker--emoji">🔒</span>
                                                        <span class="sc-emoji-picker--emoji">🔏</span><span class="sc-emoji-picker--emoji">🔐</span><span class="sc-emoji-picker--emoji">🔑</span><span class="sc-emoji-picker--emoji">🔎</span><span class="sc-emoji-picker--emoji">💡</span>
                                                        <span class="sc-emoji-picker--emoji">🔦</span><span class="sc-emoji-picker--emoji">🔌</span><span class="sc-emoji-picker--emoji">🔋</span><span class="sc-emoji-picker--emoji">🔍</span><span class="sc-emoji-picker--emoji">🛀</span>
                                                        <span class="sc-emoji-picker--emoji">🚽</span><span class="sc-emoji-picker--emoji">🔧</span><span class="sc-emoji-picker--emoji">🔩</span><span class="sc-emoji-picker--emoji">🔨</span><span class="sc-emoji-picker--emoji">🚪</span>
                                                        <span class="sc-emoji-picker--emoji">🚬</span><span class="sc-emoji-picker--emoji">💣</span><span class="sc-emoji-picker--emoji">🔫</span><span class="sc-emoji-picker--emoji">🔪</span><span class="sc-emoji-picker--emoji">💊</span>
                                                        <span class="sc-emoji-picker--emoji">💉</span><span class="sc-emoji-picker--emoji">💰</span><span class="sc-emoji-picker--emoji">💴</span><span class="sc-emoji-picker--emoji">💵</span><span class="sc-emoji-picker--emoji">💳</span>
                                                        <span class="sc-emoji-picker--emoji">💸</span><span class="sc-emoji-picker--emoji">📲</span><span class="sc-emoji-picker--emoji">📧</span><span class="sc-emoji-picker--emoji">📥</span><span class="sc-emoji-picker--emoji">📤</span>
                                                        <span class="sc-emoji-picker--emoji">📩</span><span class="sc-emoji-picker--emoji">📨</span><span class="sc-emoji-picker--emoji">📫</span><span class="sc-emoji-picker--emoji">📪</span>
                                                        <span class="sc-emoji-picker--emoji">📮</span><span class="sc-emoji-picker--emoji">📦</span><span class="sc-emoji-picker--emoji">📝</span><span class="sc-emoji-picker--emoji">📄</span>
                                                        <span class="sc-emoji-picker--emoji">📃</span><span class="sc-emoji-picker--emoji">📑</span><span class="sc-emoji-picker--emoji">📊</span><span class="sc-emoji-picker--emoji">📈</span>
                                                        <span class="sc-emoji-picker--emoji">📉</span><span class="sc-emoji-picker--emoji">📜</span><span class="sc-emoji-picker--emoji">📋</span><span class="sc-emoji-picker--emoji">📅</span>
                                                        <span class="sc-emoji-picker--emoji">📆</span><span class="sc-emoji-picker--emoji">📇</span><span class="sc-emoji-picker--emoji">📁</span><span class="sc-emoji-picker--emoji">📂</span>
                                                        <span class="sc-emoji-picker--emoji">📌</span><span class="sc-emoji-picker--emoji">📎</span><span class="sc-emoji-picker--emoji">📏</span><span class="sc-emoji-picker--emoji">📐</span>
                                                        <span class="sc-emoji-picker--emoji">📕</span><span class="sc-emoji-picker--emoji">📗</span><span class="sc-emoji-picker--emoji">📘</span><span class="sc-emoji-picker--emoji">📙</span>
                                                        <span class="sc-emoji-picker--emoji">📓</span><span class="sc-emoji-picker--emoji">📔</span><span class="sc-emoji-picker--emoji">📒</span><span class="sc-emoji-picker--emoji">📚</span>
                                                        <span class="sc-emoji-picker--emoji">📖</span><span class="sc-emoji-picker--emoji">🔖</span><span class="sc-emoji-picker--emoji">📛</span><span class="sc-emoji-picker--emoji">📰</span>
                                                        <span class="sc-emoji-picker--emoji">🎨</span><span class="sc-emoji-picker--emoji">🎬</span><span class="sc-emoji-picker--emoji">🎤</span><span class="sc-emoji-picker--emoji">🎧</span>
                                                        <span class="sc-emoji-picker--emoji">🎼</span><span class="sc-emoji-picker--emoji">🎵</span><span class="sc-emoji-picker--emoji">🎶</span><span class="sc-emoji-picker--emoji">🎹</span>
                                                        <span class="sc-emoji-picker--emoji">🎻</span><span class="sc-emoji-picker--emoji">🎺</span><span class="sc-emoji-picker--emoji">🎷</span>
                                                        <span class="sc-emoji-picker--emoji">🎸</span><span class="sc-emoji-picker--emoji">👾</span><span class="sc-emoji-picker--emoji">🎮</span>
                                                        <span class="sc-emoji-picker--emoji">🃏</span><span class="sc-emoji-picker--emoji">🎴</span><span class="sc-emoji-picker--emoji">🀄</span>
                                                        <span class="sc-emoji-picker--emoji">🎲</span><span class="sc-emoji-picker--emoji">🎯</span><span class="sc-emoji-picker--emoji">🏈</span>
                                                        <span class="sc-emoji-picker--emoji">🏀</span><span class="sc-emoji-picker--emoji">⚽</span><span class="sc-emoji-picker--emoji">⚾</span>
                                                        <span class="sc-emoji-picker--emoji">🎾</span><span class="sc-emoji-picker--emoji">🎱</span><span class="sc-emoji-picker--emoji">🎳</span>
                                                        <span class="sc-emoji-picker--emoji">⛳</span><span class="sc-emoji-picker--emoji">🏁</span><span class="sc-emoji-picker--emoji">🏆</span>
                                                        <span class="sc-emoji-picker--emoji">🎿</span><span class="sc-emoji-picker--emoji">🏂</span><span class="sc-emoji-picker--emoji">🏊</span>
                                                        <span class="sc-emoji-picker--emoji">🏄</span><span class="sc-emoji-picker--emoji">🎣</span><span class="sc-emoji-picker--emoji">🍵</span>
                                                        <span class="sc-emoji-picker--emoji">🍶</span><span class="sc-emoji-picker--emoji">🍺</span><span class="sc-emoji-picker--emoji">🍻</span>
                                                        <span class="sc-emoji-picker--emoji">🍸</span><span class="sc-emoji-picker--emoji">🍹</span><span class="sc-emoji-picker--emoji">🍷</span>
                                                        <span class="sc-emoji-picker--emoji">🍴</span><span class="sc-emoji-picker--emoji">🍕</span><span class="sc-emoji-picker--emoji">🍔</span>
                                                        <span class="sc-emoji-picker--emoji">🍟</span><span class="sc-emoji-picker--emoji">🍗</span>
                                                        <span class="sc-emoji-picker--emoji">🍖</span><span class="sc-emoji-picker--emoji">🍝</span>
                                                        <span class="sc-emoji-picker--emoji">🍛</span><span class="sc-emoji-picker--emoji">🍤</span>
                                                        <span class="sc-emoji-picker--emoji">🍱</span><span class="sc-emoji-picker--emoji">🍣</span>
                                                        <span class="sc-emoji-picker--emoji">🍥</span><span class="sc-emoji-picker--emoji">🍙</span>
                                                        <span class="sc-emoji-picker--emoji">🍘</span><span class="sc-emoji-picker--emoji">🍚</span>
                                                        <span class="sc-emoji-picker--emoji">🍜</span><span class="sc-emoji-picker--emoji">🍲</span>
                                                        <span class="sc-emoji-picker--emoji">🍢</span><span class="sc-emoji-picker--emoji">🍡</span>
                                                        <span class="sc-emoji-picker--emoji">🍳</span><span class="sc-emoji-picker--emoji">🍞</span>
                                                        <span class="sc-emoji-picker--emoji">🍩</span><span class="sc-emoji-picker--emoji">🍮</span>
                                                        <span class="sc-emoji-picker--emoji">🍦</span><span class="sc-emoji-picker--emoji">🍨</span>
                                                        <span class="sc-emoji-picker--emoji">🍧</span>
                                                        <span class="sc-emoji-picker--emoji">🎂</span>
                                                        <span class="sc-emoji-picker--emoji">🍰</span>
                                                        <span class="sc-emoji-picker--emoji">🍪</span>
                                                        <span class="sc-emoji-picker--emoji">🍫</span>
                                                        <span class="sc-emoji-picker--emoji">🍬</span>
                                                        <span class="sc-emoji-picker--emoji">🍭</span>
                                                        <span class="sc-emoji-picker--emoji">🍯</span>
                                                        <span class="sc-emoji-picker--emoji">🍎</span>
                                                        <span class="sc-emoji-picker--emoji">🍏</span>
                                                        <span class="sc-emoji-picker--emoji">🍊</span>
                                                        <span class="sc-emoji-picker--emoji">🍒</span>
                                                        <span class="sc-emoji-picker--emoji">🍇</span>
                                                        <span class="sc-emoji-picker--emoji">🍉</span>
                                                        <span class="sc-emoji-picker--emoji">🍓</span>
                                                        <span class="sc-emoji-picker--emoji">🍑</span>
                                                        <span class="sc-emoji-picker--emoji">🍈</span>
                                                        <span class="sc-emoji-picker--emoji">🍌</span>
                                                        <span class="sc-emoji-picker--emoji">🍍</span>
                                                        <span class="sc-emoji-picker--emoji">🍠</span>
                                                        <span class="sc-emoji-picker--emoji">🍆</span>
                                                        <span class="sc-emoji-picker--emoji">🍅</span>
                                                        <span class="sc-emoji-picker--emoji">🌽</span>
                                                    </div>
                                                    <div class="sc-emoji-picker--category">
                                                        <div class="sc-emoji-picker--category-title">Places</div>
                                                        <span class="sc-emoji-picker--emoji">🏠</span><span class="sc-emoji-picker--emoji">🏡</span><span class="sc-emoji-picker--emoji">🏫</span><span class="sc-emoji-picker--emoji">🏢</span><span class="sc-emoji-picker--emoji">🏣</span>
                                                        <span class="sc-emoji-picker--emoji">🏥</span><span class="sc-emoji-picker--emoji">🏦</span><span class="sc-emoji-picker--emoji">🏪</span><span class="sc-emoji-picker--emoji">🏩</span><span class="sc-emoji-picker--emoji">🏨</span>
                                                        <span class="sc-emoji-picker--emoji">💒</span>
                                                        <span class="sc-emoji-picker--emoji">⛪</span><span class="sc-emoji-picker--emoji">🏬</span><span class="sc-emoji-picker--emoji">🌇</span><span class="sc-emoji-picker--emoji">🌆</span><span class="sc-emoji-picker--emoji">🏯</span>
                                                        <span class="sc-emoji-picker--emoji">🏰</span>
                                                        <span class="sc-emoji-picker--emoji">⛺</span><span class="sc-emoji-picker--emoji">🏭</span><span class="sc-emoji-picker--emoji">🗼</span><span class="sc-emoji-picker--emoji">🗾</span><span class="sc-emoji-picker--emoji">🗻</span>
                                                        <span class="sc-emoji-picker--emoji">🌄</span>
                                                        <span class="sc-emoji-picker--emoji">🌅</span><span class="sc-emoji-picker--emoji">🌃</span><span class="sc-emoji-picker--emoji">🗽</span><span class="sc-emoji-picker--emoji">🌉</span><span class="sc-emoji-picker--emoji">🎠</span>
                                                        <span class="sc-emoji-picker--emoji">🎡</span><span class="sc-emoji-picker--emoji">⛲</span><span class="sc-emoji-picker--emoji">🎢</span><span class="sc-emoji-picker--emoji">🚢</span><span class="sc-emoji-picker--emoji">⛵</span>
                                                        <span class="sc-emoji-picker--emoji">🚤</span><span class="sc-emoji-picker--emoji">🚀</span><span class="sc-emoji-picker--emoji">💺</span><span class="sc-emoji-picker--emoji">🚉</span><span class="sc-emoji-picker--emoji">🚄</span>
                                                        <span class="sc-emoji-picker--emoji">🚅</span><span class="sc-emoji-picker--emoji">🚇</span><span class="sc-emoji-picker--emoji">🚃</span><span class="sc-emoji-picker--emoji">🚌</span><span class="sc-emoji-picker--emoji">🚙</span>
                                                        <span class="sc-emoji-picker--emoji">🚗</span><span class="sc-emoji-picker--emoji">🚕</span><span class="sc-emoji-picker--emoji">🚚</span><span class="sc-emoji-picker--emoji">🚨</span><span class="sc-emoji-picker--emoji">🚓</span>
                                                        <span class="sc-emoji-picker--emoji">🚒</span><span class="sc-emoji-picker--emoji">🚑</span><span class="sc-emoji-picker--emoji">🚲</span><span class="sc-emoji-picker--emoji">💈</span><span class="sc-emoji-picker--emoji">🚏</span>
                                                        <span class="sc-emoji-picker--emoji">🎫</span><span class="sc-emoji-picker--emoji">🚥</span><span class="sc-emoji-picker--emoji">🚧</span><span class="sc-emoji-picker--emoji">🔰</span><span class="sc-emoji-picker--emoji">⛽</span>
                                                        <span class="sc-emoji-picker--emoji">🏮</span><span class="sc-emoji-picker--emoji">🎰</span><span class="sc-emoji-picker--emoji">🗿</span><span class="sc-emoji-picker--emoji">🎪</span><span class="sc-emoji-picker--emoji">🎭</span>
                                                        <span class="sc-emoji-picker--emoji">📍</span><span class="sc-emoji-picker--emoji">🚩</span>
                                                    </div>
                                                    <div class="sc-emoji-picker--category">
                                                        <div class="sc-emoji-picker--category-title">Symbols</div>
                                                        <span class="sc-emoji-picker--emoji">🔟</span><span class="sc-emoji-picker--emoji">🔢</span><span class="sc-emoji-picker--emoji">🔣</span><span class="sc-emoji-picker--emoji">🔠</span><span class="sc-emoji-picker--emoji">🔡</span>
                                                        <span class="sc-emoji-picker--emoji">🔤</span><span class="sc-emoji-picker--emoji">🔼</span><span class="sc-emoji-picker--emoji">🔽</span><span class="sc-emoji-picker--emoji">⏪</span><span class="sc-emoji-picker--emoji">⏩</span>
                                                        <span class="sc-emoji-picker--emoji">⏫</span>
                                                        <span class="sc-emoji-picker--emoji">⏬</span><span class="sc-emoji-picker--emoji">🆗</span><span class="sc-emoji-picker--emoji">🆕</span><span class="sc-emoji-picker--emoji">🆙</span><span class="sc-emoji-picker--emoji">🆒</span>
                                                        <span class="sc-emoji-picker--emoji">🆓</span>
                                                        <span class="sc-emoji-picker--emoji">🆖</span><span class="sc-emoji-picker--emoji">📶</span><span class="sc-emoji-picker--emoji">🎦</span><span class="sc-emoji-picker--emoji">🈁</span><span class="sc-emoji-picker--emoji">🈯</span>
                                                        <span class="sc-emoji-picker--emoji">🈳</span><span class="sc-emoji-picker--emoji">🈵</span><span class="sc-emoji-picker--emoji">🈴</span><span class="sc-emoji-picker--emoji">🈲</span><span class="sc-emoji-picker--emoji">🉐</span>
                                                        <span class="sc-emoji-picker--emoji">🈹</span><span class="sc-emoji-picker--emoji">🈺</span><span class="sc-emoji-picker--emoji">🈶</span><span class="sc-emoji-picker--emoji">🈚</span><span class="sc-emoji-picker--emoji">🚻</span>
                                                        <span class="sc-emoji-picker--emoji">🚹</span><span class="sc-emoji-picker--emoji">🚺</span><span class="sc-emoji-picker--emoji">🚼</span><span class="sc-emoji-picker--emoji">🚾</span><span class="sc-emoji-picker--emoji">🚭</span>
                                                        <span class="sc-emoji-picker--emoji">🈸</span><span class="sc-emoji-picker--emoji">🉑</span><span class="sc-emoji-picker--emoji">🆑</span><span class="sc-emoji-picker--emoji">🆘</span><span class="sc-emoji-picker--emoji">🆔</span>
                                                        <span class="sc-emoji-picker--emoji">🚫</span><span class="sc-emoji-picker--emoji">🔞</span><span class="sc-emoji-picker--emoji">⛔</span><span class="sc-emoji-picker--emoji">❎</span><span class="sc-emoji-picker--emoji">✅</span>
                                                        <span class="sc-emoji-picker--emoji">💟</span><span class="sc-emoji-picker--emoji">🆚</span><span class="sc-emoji-picker--emoji">📳</span><span class="sc-emoji-picker--emoji">📴</span><span class="sc-emoji-picker--emoji">🆎</span>
                                                        <span class="sc-emoji-picker--emoji">💠</span><span class="sc-emoji-picker--emoji">⛎</span><span class="sc-emoji-picker--emoji">🔯</span><span class="sc-emoji-picker--emoji">🏧</span><span class="sc-emoji-picker--emoji">💹</span>
                                                        <span class="sc-emoji-picker--emoji">💲</span><span class="sc-emoji-picker--emoji">💱</span><span class="sc-emoji-picker--emoji">❌</span><span class="sc-emoji-picker--emoji">❗</span><span class="sc-emoji-picker--emoji">❓</span>
                                                        <span class="sc-emoji-picker--emoji">❕</span><span class="sc-emoji-picker--emoji">❔</span><span class="sc-emoji-picker--emoji">⭕</span><span class="sc-emoji-picker--emoji">🔝</span><span class="sc-emoji-picker--emoji">🔚</span>
                                                        <span class="sc-emoji-picker--emoji">🔙</span><span class="sc-emoji-picker--emoji">🔛</span><span class="sc-emoji-picker--emoji">🔜</span><span class="sc-emoji-picker--emoji">🔃</span><span class="sc-emoji-picker--emoji">🕛</span>
                                                        <span class="sc-emoji-picker--emoji">🕐</span><span class="sc-emoji-picker--emoji">🕑</span><span class="sc-emoji-picker--emoji">🕒</span><span class="sc-emoji-picker--emoji">🕓</span><span class="sc-emoji-picker--emoji">🕔</span>
                                                        <span class="sc-emoji-picker--emoji">🕕</span><span class="sc-emoji-picker--emoji">🕖</span><span class="sc-emoji-picker--emoji">🕗</span><span class="sc-emoji-picker--emoji">🕘</span>
                                                        <span class="sc-emoji-picker--emoji">🕙</span><span class="sc-emoji-picker--emoji">🕚</span><span class="sc-emoji-picker--emoji">➕</span><span class="sc-emoji-picker--emoji">➖</span>
                                                        <span class="sc-emoji-picker--emoji">➗</span><span class="sc-emoji-picker--emoji">💮</span><span class="sc-emoji-picker--emoji">💯</span><span class="sc-emoji-picker--emoji">🔘</span>
                                                        <span class="sc-emoji-picker--emoji">🔗</span><span class="sc-emoji-picker--emoji">➰</span><span class="sc-emoji-picker--emoji">🔱</span><span class="sc-emoji-picker--emoji">🔺</span>
                                                        <span class="sc-emoji-picker--emoji">🔲</span><span class="sc-emoji-picker--emoji">🔳</span><span class="sc-emoji-picker--emoji">🔴</span><span class="sc-emoji-picker--emoji">🔵</span>
                                                        <span class="sc-emoji-picker--emoji">🔻</span><span class="sc-emoji-picker--emoji">⬜</span><span class="sc-emoji-picker--emoji">⬛</span><span class="sc-emoji-picker--emoji">🔶</span>
                                                        <span class="sc-emoji-picker--emoji">🔷</span><span class="sc-emoji-picker--emoji">🔸</span><span class="sc-emoji-picker--emoji">🔹</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="sc-lock" style="display: none;">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                                            <path d="m11.666 1043.52v-1.49c0-2.02-1.645-3.667-3.666-3.667-2.02 0-3.666 1.645-3.666 3.667v1.49c-.289.06-.507.317-.507.624v5.582c0 .352.286.638.638.638h7.07c.352 0 .638-.286.638-.638v-5.582c0-.307-.218-.563-.507-.624m-2.81 4.758c.013.069-.034.125-.104.125h-1.488c-.07 0-.117-.057-.104-.125l.237-1.256c-.179-.164-.292-.399-.292-.661 0-.494.401-.895.895-.895.494 0 .895.4.895.895 0 .255-.107.485-.278.648zm1.534-4.772h-4.782v-1.476c0-1.319 1.073-2.391 2.391-2.391 1.318 0 2.391 1.073 2.391 2.391z" 
                                            fill="lightgray" transform="translate(0-1036.36)"/></svg>
                                        </div>
                                        <button id="sc-emoji-picker-button" style="display: none;" class="sc-user-input--emoji-icon-wrapper">
                                          <svg class="sc-user-input--emoji-icon " version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100%" height="10px" viewBox="0 0 37 37" enable-background="new 0 0 37 37">
                                             <g>
                                                <path d="M18.696,37C8.387,37,0,29.006,0,18.696C0,8.387,8.387,0,18.696,0c10.31,0,18.696,8.387,18.696,18.696 C37,29.006,29.006,37,18.696,37z M18.696,2C9.49,2,2,9.49,2,18.696c0,9.206,7.49,16.696,16.696,16.696 c9.206,0,16.696-7.49,16.696-16.696C35.393,9.49,27.902,2,18.696,2z"></path>
                                             </g>
                                             <g>
                                                <circle cx="12.379" cy="14.359" r="1.938"></circle>
                                             </g>
                                             <g>
                                                <circle cx="24.371" cy="14.414" r="1.992"></circle>
                                             </g>
                                             <g>
                                                <path d="M18.035,27.453c-5.748,0-8.342-4.18-8.449-4.357c-0.286-0.473-0.135-1.087,0.338-1.373 c0.471-0.286,1.084-0.136,1.372,0.335c0.094,0.151,2.161,3.396,6.74,3.396c4.713,0,7.518-3.462,7.545-3.497 c0.343-0.432,0.973-0.504,1.405-0.161c0.433,0.344,0.505,0.973,0.161,1.405C27.009,23.374,23.703,27.453,18.035,27.453z"></path>
                                             </g>
                                          </svg>
                                       </button>
                                    </div>
                                </div>
                                <div style="display:none;" class="sc-user-input--button sc-send-button-container">
                                    <button type="button" class="sc-user-input--send-icon-wrapper">
                                       <svg version="1.1" class="sc-user-input--send-icon" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="37.393px" height="37.393px" viewBox="0 0 37.393 37.393" enable-background="new 0 0 37.393 37.393">
                                          <g id="Layer_2">
                                             <path d="M36.511,17.594L2.371,2.932c-0.374-0.161-0.81-0.079-1.1,0.21C0.982,3.43,0.896,3.865,1.055,4.241l5.613,13.263 L2.082,32.295c-0.115,0.372-0.004,0.777,0.285,1.038c0.188,0.169,0.427,0.258,0.67,0.258c0.132,0,0.266-0.026,0.392-0.08 l33.079-14.078c0.368-0.157,0.607-0.519,0.608-0.919S36.879,17.752,36.511,17.594z M4.632,30.825L8.469,18.45h8.061 c0.552,0,1-0.448,1-1s-0.448-1-1-1H8.395L3.866,5.751l29.706,12.757L4.632,30.825z"></path>
                                          </g>
                                       </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                                  
                    <div id="sc-body-login-phone-form" class="sc-body-chat theme_color" style="display: none;">
                         <a class="sc-back-button" href="#"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                         <form onsubmit="return false;" style="position: relative;">
                            
                            <div class="form-row">                                
                                <div class="col-12">
                                    <input type="hidden" name="country_phone_main_form" value="1" >
                                    <input id="phone_main_form" class="sc-form-control" type="text"  placeholder="Email or phone number" id="phone_main_form" name="phone_main_form">
                                </div>                                
                            </div>                            
                            <a class="sc-link-action sc-btn-form-login-phone-main" href="#">Continue</a>
                            <a class="sc-link-action goto_link sc-goto-register" href="#">Or Register</a>
                        </form>
                        <div class="sc-powered">
                                <a class="sc-link sc-powered-link" href="https://chatgive.com/" target="_blank">Powered by ChatGive</a>
                            </div>
                    </div>
                    
                    <div id="sc-body-login-phone-code-form" class="sc-body-chat theme_color" style="display: none;">
                             <a class="sc-back-button" href="#"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                         <form onsubmit="return false;" style="position: relative;">
                            <div id="sc-login-phone-code-failed-main" class="button_text_color" style="display: none;">Incorrect Code</div>
                            <label class="button_text_color">We have sent you a security code<br><br></label>
                            <div class="form-row">
                                <input class="sc-form-control" type="text" maxlength="5" placeholder="Code" id="verification_code" name="phone_verification_code" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code">
                            </div>
                            <a class="sc-link-action sc-btn-form-login-phone-code-main" href="#">Login</a>
                        </form>
                        <div class="sc-powered">
                                <a class="sc-link sc-powered-link" href="https://chatgive.com/" target="_blank">Powered by ChatGive</a>
                        </div>
                    </div>
                    
                    <div id="sc-body-register-form" class="sc-body-chat theme_color" style="display: none;">
                         <a class="sc-back-button" href="#"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                         <form onsubmit="return false;" style="position: relative;">
                            <label class="button_text_color">Create Account<br><br></label>
                            <div class="form-row">    
                                <div class="col-12">
                                    <input class="sc-form-control" type="text"  placeholder="Name" id="register_name" name="register_name">
                                </div>                                
                            </div>
                            <div class="form-row">                                
                                <div class="col-12">
                                    <input class="sc-form-control" type="text"  placeholder="Email" id="register_email" name="register_email">
                                </div>  
                            </div>
                            <div class="form-row" style="width: 250px">  
                                <div class="col-6" style="display: flex">
                                    <div class="col-1 img_country_container" style="margin-bottom: 0;">
                                        <img id="img_country_register" height="25px" src="" alt="">
                                    </div>
                                    <div class="col-8" style="margin-bottom: 0; padding-left: 0;">
                                        <select name="country_phone_register" style="font-size: 0.75rem; padding: 8px 2px 7px 2px; height: 35px;" id="country_phone_register" class="form-control">
                                        </select>
                                        <input type="hidden" id="input-phone-code-register" name="register_phone_code" value="">
                                    </div>
                                </div>
                                <div class="col-6 p-0" >
                                    <input class="sc-form-control" type="text"  placeholder="Phone" id="register_phone" name="register_phone" style="width: 100%">
                                </div>                    
                            </div>                            
                                                   
                            <a class="sc-link-action sc-btn-form-register" href="#">Continue</a>
                            
                            <a class="sc-link-action goto_link sc-goto-login" href="#">Or Login</a>
                        </form>
                        <div class="sc-powered">
                                <a class="sc-link sc-powered-link" href="https://chatgive.com/" target="_blank">Powered by ChatGive</a>
                        </div>
                    </div>
                    
                    <div id="sc-body-register-phone-code-form" class="sc-body-chat theme_color" style="display: none;">
                             <a class="sc-back-button" href="#"><img class="sc-left-menu-img" src="` +
                chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                         <form onsubmit="return false;" style="position: relative;">
                            <label class="button_text_color">We have sent you a security code<br><br></label>
                            <div class="form-row">
                                <input class="sc-form-control" type="text" maxlength="5" placeholder="Code" id="register_verification_code" name="register_phone_verification_code" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code">
                            </div>
                            <a class="sc-link-action sc-btn-form-register-phone-code-main" href="#">Register</a>
                        </form>
                        <div class="sc-powered">
                                <a class="sc-link sc-powered-link" href="https://chatgive.com/" target="_blank">Powered by ChatGive</a>
                        </div>
                    </div>
                    
                    <div id="sc-body-profile" class="sc-body-chat" style="display: none;">
                         <div class="sc-back-bar theme_color sc-back-button-give">
                             <a class="sc-back-button" href="#" style="top: 25px;"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                             <a class="sc-link-action sc-back-button-give" href="#">Give Now</a>
                         </div>
                         <div id="sc-profile">
                             <h4>Profile</h4>
                             <form onsubmit="return false;" id="profile_form">
                                 <div class="form-row">
                                    <div class="col-6">
                                        <input class="form-control" type="text" name="first_name" id="profile_name" placeholder="First Name">
                                    </div>
                                    <div class="col-6">
                                        <input class="form-control" type="text" name="last_name" id="profile_last_name" placeholder="Last  Name">
                                    </div>
                                 </div>
                                 <div class="form-row">
                                    <div class="col-12">
                                        <input class="form-control" type="email" name="" id="profile_email" placeholder="Email" disabled>
                                    </div>
                                 </div>
                                 <div class="form-row">
                                    <div class="col-12">
                                        <input class="form-control profile_input" type="text" name="address" id="profile_address" placeholder="Address">                            
                                    </div>
                                 </div>
                                 <div class="form-row">
                                        <div class="col-6">
                                            <div class="form-row">
                                                <div class="col-4 img_country_container" style="margin-bottom: 0;">
                                                    <img id="img_country" height="25px"src="" alt="">
                                                </div>
                                                <div class="col-8" style="margin-bottom: 0; padding-left: 0;">
                                                    <select name="country_code_phone" style="font-size: 0.75rem; padding: 8px 2px 7px 2px; height: 35px;" id="input-country-code-phone" class="form-control">
                                                    </select>
                                                    <input type="hidden" id="input-phone-code" name="phone_code" value="">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                          <input class="form-control profile_input" type="tel" name="phone" id="profile_phone" placeholder="Phone" maxlength="15">
                                        </div>
                                    </div>
                                 
                                 <div class="form-row">
                                    <div class="col-6">
                                        <input class="form-control profile_input" type="text" name="state" id="profile_state" placeholder="State">
                                    </div>
                                    <div class="col-6">
                                        <input class="form-control profile_input" type="text" name="city" id="profile_city" placeholder="City">
                                    </div>
                                </div>
                                <div class="form-row">                                    
                                    <div class="col-6">
                                        <input class="form-control profile_input" type="text" name="postal_code" id="profile_postal" placeholder="Postal Code">
                                    </div>
                                 </div>
                                 <div style="height: 3em">
                                     <button style="float: right;" id="save_profile" class="sc-btn sc-btn-primary theme_color button_text_color" type="button">Save</button>
                                 </div>
                             </form>
                         </div>
                    </div>
                    <div id="profile_saved_sources" class="sc-body-chat profile_section" style="display: none;">  
                        <div class="sc-back-bar theme_color sc-back-button-give">
                                <a class="sc-back-button" href="#" style="top: 25px;"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                                 <a class="sc-link-action sc-back-button-give" href="#">Give Now</a>
                             </div>
                         <div class="profile_section_content">
                             
                             <h4>Saved Payment Sources</h4>
                             <div class="payment_sources">
                             </div>
                             <div class="sc-add-payment_method">
                                <a href="#">Add Payment Method</a>
                             </div>
                             <div class="add-payment-method-form" style="display: none">
                                <div id="alert_validation_payment_method" style="color: darkred; display: none; padding: 0.5em 0;"></div>
                                <div class="form-row">
                                    <div class="col-12">
                                        <select class="form-control" name="" id="profile_type_method">
                                            <option value="">Select Type Payment</option>
                                            <option value="credit_card">Credit Card</option>
                                            <option value="bank_account">Bank Account</option>
                                        </select>
                                    </div>
                                </div>
                                <form onsubmit="return false;" id="profile_bank_account" style="display: none">
                                    <div class="form-row">
                                        <div class="col-6">
                                            <input class="form-control"  type="text" placeholder="First Name" name="first_name">
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control"  type="text" placeholder="Last Name" name="last_name">    
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-6">
                                            <select name="account_type" class="form-control" placeholder="Account Type">
                                                <option value="">Select Account Type</option>
                                                <option value="personal_checking">Personal Checking</option>
                                                <option value="personal_savings">Personal Savings</option>
                                                <option value="business_checking">Business Checking</option>
                                                <option value="business_savings">Business Savings</option>
                                            </select>
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control"  type="tel" placeholder="Account Number" name="account_number">
                                        </div>
                                        
                                    </div>
                                    <div class="form-row">
                                        <div class="col-6">
                                            <input class="form-control"  type="tel" placeholder="Routing Number" name="routing_number">
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control"  type="text" placeholder="Postal Code" name="postal_code">
                                        </div>
                                    </div>
                                    <a class="cancel_payment_method" href="#">Cancel</a>
                                    <a class="save_payment_method" href="#">Save</a>
                                </form>
                                <form onsubmit="return false;" id="profile_bank_account_psf" style="display: none">
                                    <div class="form-row">
                                        <div class="col-12">
                                            <select name="bank_type" class="sc-form-control select_bank_type" placeholder="Bank Type" style="margin-top: 15px;">
                                                <option value="ach" selected>ACH Bank Type</option>
                                                <option value="eft">EFT Bank Type</option>
                                                <option value="sepa">SEPA Bank Type</option>
                                                <option value="bacs">BACS Bank Type</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="bank_type ach_type" style="display: none;">
                                        <div class="form-row">
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="First Name" name="ach[first_name]">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="Last Name" name="ach[last_name]">    
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <select name="ach[account_type]" class="form-control" placeholder="Account Type">
                                                    <option value="">Select Account Type</option>
                                                    <option value="SAVINGS">Savings</option>
                                                    <option value="CHECKING">Checking</option>
                                                    <option value="LOAN">Loan</option>
                                                </select>
                                            </div>                                        
                                        </div>
                                        <div class="form-row">
                                            <div class="col-6">
                                                <input class="form-control"  type="tel" placeholder="Account Number" name="ach[account_number]" maxlength="17">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="tel" placeholder="Routing Number" name="ach[routing_number]" maxlength="9">
                                            </div>                                        
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <select name="ach[country]" class="form-control country_picker" placeholder="Country">
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="City" name="ach[city]">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Street" name="ach[street]">
                                            </div>
                                            <div class="col-12" style="display: none !important;">
                                                <input class="form-control"  type="text" placeholder="Street 2" name="ach[street2]" value="">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Postal Code" name="ach[postal_code]">
                                            </div>
                                        </div>                                        
                                    </div>
                                    <div class="bank_type bacs_type" style="display: none;">
                                        <div class="form-row">
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="First Name" name="bacs[first_name]">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="Last Name" name="bacs[last_name]">    
                                            </div>
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <input class="form-control"  type="tel" placeholder="Account Number" name="bacs[account_number]" maxlength="8">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="tel" placeholder="Sort Code" name="bacs[sortcode]" maxlength="6">
                                            </div>  
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Mandate Reference" name="bacs[mandate]" maxlength="10">
                                            </div>                                       
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <select name="bacs[country]" class="form-control country_picker" placeholder="Country">
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="City" name="bacs[city]">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Street" name="bacs[street]">
                                            </div>
                                            <div class="col-12" style="display: none !important;">
                                                <input class="form-control"  type="text" placeholder="Street 2" name="bacs[street2]" value="" style="display: none !important;">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Postal Code" name="bacs[postal_code]">
                                            </div>
                                        </div>                                        
                                    </div>
                                    <div class="bank_type eft_type" style="display: none;">
                                        <div class="form-row">
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="First Name" name="eft[first_name]">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="Last Name" name="eft[last_name]">    
                                            </div>
                                        </div>                                        
                                        <div class="form-row">
                                            <div class="col-12">
                                                <input class="form-control"  type="tel" placeholder="Account Number" name="eft[account_number]" maxlength="12">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="tel" placeholder="Transit Number" name="eft[transit_number]"  maxlength="5">
                                            </div>       
                                            <div class="col-6">
                                                <input class="form-control"  type="tel" placeholder="Institution ID" name="eft[institution_id]"  maxlength="3">
                                            </div>                                   
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <select name="eft[country]" class="form-control country_picker" placeholder="Country">
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="City" name="eft[city]">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Street" name="eft[street]">
                                            </div>
                                            <div class="col-12" style="display: none !important;">
                                                <input class="form-control"  type="text" placeholder="Street 2" name="eft[street2]" value="" style="display: none !important;">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Postal Code" name="eft[postal_code]">
                                            </div>
                                        </div>                                        
                                    </div>
                                    <div class="bank_type sepa_type" style="display: none;">
                                        <div class="form-row">
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="First Name" name="sepa[first_name]">
                                            </div>
                                            <div class="col-6">
                                                <input class="form-control"  type="text" placeholder="Last Name" name="sepa[last_name]">    
                                            </div>
                                        </div>                                        
                                        <div class="form-row">
                                            <div class="col-12">
                                                <input class="form-control"  type="tel" placeholder="IBAN" name="sepa[iban]"  maxlength="34">
                                            </div>       
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Mandate Reference" name="sepa[mandate]" maxlength="35">
                                            </div>                                 
                                        </div>
                                        <div class="form-row">
                                            <div class="col-12">
                                                <select name="sepa[country]" class="form-control country_picker" placeholder="Country">
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="City" name="sepa[city]">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Street" name="sepa[street]">
                                            </div>
                                            <div class="col-12" style="display: none !important;">
                                                <input class="form-control"  type="text" placeholder="Street 2" name="sepa[street2]" value="" style="display: none !important;">
                                            </div>
                                            <div class="col-12">
                                                <input class="form-control"  type="text" placeholder="Postal Code" name="sepa[postal_code]">
                                            </div>
                                        </div>                                        
                                    </div>
                                    <a class="cancel_payment_method" href="#">Cancel</a>
                                    <a class="save_payment_method" href="#">Save</a>
                                </form>
                                <form onsubmit="return false;" id="profile_credit_card" style="display: none">
                                    <div class="form-row">
                                        <div class="col-6">
                                            <input class="form-control"  type="text" placeholder="First Name" name="first_name">
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control"  type="text" placeholder="Last Name" name="last_name">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-12">
                                            <input class="form-control js_mask_credit_card" type="tel" placeholder="Card Number" name="card_number">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-6">
                                            <input class="form-control js_mask_cvv"  type="tel" placeholder="CVV" name="card_cvv">
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control js_mask_exp_date"  type="tel" placeholder="Expiration Date (mm/yyyy)" name="card_date">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-12">
                                            <input class="form-control"  type="text" placeholder="Postal Code" name="postal_code">
                                        </div>
                                    </div>
                                    <a id="profile_save_payment_method" class="save_payment_method" href="#">Save</a>
                                    <a class="cancel_payment_method" href="#">Cancel</a>
                                </form>
                                <form onsubmit="return false;" id="profile_credit_card_psf" style="display: none">
                                    <div class="form-row">
                                        <div class="col-6">
                                            <input class="form-control" id="cc_psf_profile_first_name" type="text" placeholder="First Name" name="first_name">
                                        </div>
                                        <div class="col-6">
                                            <input class="form-control" id="cc_psf_profile_last_name"  type="text" placeholder="Last Name" name="last_name">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-12">
                                            <div id="profile_card_number" class="form-control"></div>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col-6">
                                            <div id="profile_card_cvv" class="form-control"></div>
                                        </div>
                                        <div class="col-6">
                                            <div id="profile_card_date" class="form-control"></div>
                                        </div>
                                    </div>                                   
                                    <div class="form-row">
                                        <div class="col-12">
                                            <input class="form-control" id="cc_psf_profile_postal"  type="text" placeholder="Postal Code" name="postal_code">
                                        </div>
                                    </div>
                                    <a id="psf_save_cc_profile" href="#">Save</a>
                                    <a class="cancel_payment_method" href="#">Cancel</a>
                                </form>
                             </div>
                         </div>
                     </div>
                    <div id="profile_giving" class="sc-body-chat profile_section" style="display: none;">
                         <div class="sc-back-bar theme_color sc-back-button-give">
                             <a class="sc-back-button" href="#" style="top: 25px;"><img class="sc-left-menu-img" src="` +
                                        chatgive.base_url + `assets/widget/back_header.png" alt="">
                             </a>
                             <a class="sc-link-action sc-back-button-give" href="#">Give Now</a>
                         </div>
                         <div class="profile_section_content">
                             <h4>Recurring Donations</h4>
                             <div class="recurring_donations">
                             </div>
                             <h4>Giving History</h4>
                             <div class="giving_history">
                            </div>
                            <div class="row profile_spinner_container" style="display: none;">
                                <div id="profile_spinner" class="spinner-border">
                                </div>
                            </div>                            
                            <div>
                                <a class="sc-item-load-more" href="#">Load More</a>
                                <a class="sc-item-download-ytd" href="#">Download YTD Statement</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
                `);
        };
        
        //@show_view = sometimes is neccessary show the view after load the code, and this view is recalled on refresh token
        chatgive.loadProfile = async function (show_view = null) {
            chatgive.refresh_profile = false;

            //Get and Load Profile
            $header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem("b25a9b3d0c99f288c")){
                    $header += localStorage.getItem("b25a9b3d0c99f288c");
                }
            } catch (e) {}

            await $w.ajax({
                type: "POST",
                url: chatgive.base_url + 'widget_profile/get',
                dataType: 'json',
                headers: {'Authorization': $header},
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                function (data, status) {
                    if (data.status === true) {
                        chatgive.payment_processor = data.payment_processor;
                        chatgive.paysafe_apiKey = data.single_use_token_api_key;
                        chatgive.paysafe_environment = data.environment;
                        data.data.country_code_phone = data.data.country_code_phone ? data.data.country_code_phone : 'US';
                        data.data.phone_code = data.data.country_code_phone ? data.data.country_code_phone : '1';
                        $w('#profile_name').val(data.data.first_name);
                        $w('#profile_last_name').val(data.data.last_name);
                        $w('#profile_email').val(data.data.email);
                        $w('#profile_address').val(data.data.address);
                        $w('#profile_city').val(data.data.city);
                        $w('#profile_state').val(data.data.state);
                        $w('#profile_postal').val(data.data.postal_code);
                        $w('#profile_phone').val(data.data.phone);
                        $w('#profile_phone').val(data.data.phone);
                        $w('#input-country-code-phone').val(data.data.country_code_phone);
                        $w('#input-phone-code').val(data.data.phone_code);
                        $w('#input-country-code-phone').trigger('change');
                        $w('#profile_name_header').text(data.data.first_name);
                        $w('#profile_name_header').show();
                        chatgive.hide_bank_country  = data.data.hide_country;
                        chatgive.autoselect_country = data.data.autoselect_country;
                        if(data.data.hide_country){
                            $w('#profile_bank_account_psf .country_picker').hide();
                            $w('#profile_bank_account_psf .country_picker').val(data.data.autoselect_country);
                        } else {
                            $w('#profile_bank_account_psf .country_picker').show();
                            $w('#profile_bank_account_psf .country_picker').val(null);
                        }

                        if(chatgive.payment_processor == 'PSF' && !chatgive.paysafe_profile_is_setup){

                            var options_profile = {
                                // select the Paysafe test / sandbox environment
                                environment: chatgive.paysafe_environment,
                                // set the CSS selectors to identify the payment field divs above
                                // set the placeholder text to display in these fields
                                fields: {
                                    cardNumber: {
                                        selector: "#profile_card_number",
                                        placeholder: 'Card Number'
                                    },
                                    expiryDate: {
                                        selector: "#profile_card_date",
                                        placeholder: 'Expiration Date (mm/yy)'
                                    },
                                    cvv: {
                                        selector: "#profile_card_cvv",
                                        placeholder: 'CVV'
                                    }
                                },
                                style: {
                                    input: {
                                        "font-family": "robotoregular,Helvetica,Arial,sans-serif",
                                        "font-weight": "normal",
                                        "font-size": "0.9rem",
                                        "color": "#495057"
                                    }
                                }
                            };

                            chatgive.paysafe_profile_is_setup = true;
                            paysafe.fields.setup(chatgive.paysafe_apiKey, options_profile, function(instance, error) {

                                chatgive.paysafe_profile_cc = instance;
                                // When the customer clicks Pay Now,
                                // call the SDK tokenize function to create
                                // a single-use payment token corresponding to the card details entered
                                document.getElementById("psf_save_cc_profile").addEventListener("click", function(event) {
                                    chatgive.cover_loader('show');
                                    instance.tokenize(function(instance, error, result) {
                                        if (error) {
                                            // display the tokenization error in dialog window
                                            chatgive.cover_loader('hide');
                                            Swal.fire(
                                                'Error',
                                                error.displayMessage,
                                                'error'
                                            );
                                        } else {
                                            var type = $w('#profile_type_method').val();
                                            var validation = true;
                                            var inputs = null;
                                            inputs = $w('#profile_credit_card_psf input.form-control');
                                            $w.each(inputs, function () {
                                                var input_value = $w(this).val().trim();
                                                var input_name = $w(this).attr('placeholder');
                                                //Skipping validation
                                                if(input_name !== 'Street 2') {
                                                    if (input_value === null || input_value === '') {
                                                        $w('#alert_validation_payment_method').text(input_name + ' is required');
                                                        $w('#alert_validation_payment_method').show();
                                                        validation = false;
                                                        return false;
                                                    }
                                                }
                                            });

                                            if(validation === false){
                                                return false;
                                            }

                                            var send_data = {};
                                            var form = $w('#profile_credit_card_psf');
                                            send_data['payment_method'] = 'credit_card';
                                            send_data['single_use_token'] = result.token;
                                            send_data['first_name'] = $w('#cc_psf_profile_first_name').val();
                                            send_data['last_name'] = $w('#cc_psf_profile_last_name').val();
                                            send_data['postal_code'] = $w('#cc_psf_profile_postal').val();
                                            send_data[chatgive.token_name] = chatgive.token_code;

                                            add_payment_source_psf(send_data,form);
                                        }
                                    });
                                }, false);
                            });
                        }
                    }
                }
            ).fail(function (data,status) {
                var chat_data = data.responseJSON;
                if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                    var $header_refresh = "Bearer ";
                    try {
                        if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                            $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                        }
                    } catch (e) {}
                    $w.ajax({
                        type: "POST",
                        url: chatgive.base_url + 'wtoken/refresh',
                        headers: {'Authorization': $header_refresh},
                        dataType: 'json',
                        crossDomain: true,
                        xhrFields: {
                            withCredentials: true
                        }
                    }).done(function (data, status) {
                        if(data.status == true){
                            if(data.d1a22a6f44f8b11b132a1ea){
                                try {
                                    localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                    localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                } catch (e) {}
                            }
                            chatgive.loadProfile(show_view);
                        }
                    }).fail(function () {
                        chatgive.no_logged_chat();
                    })
                }
            });

            function add_payment_source_psf(send_data,form){
                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + 'widget_profile/add_payment_source',
                    data: JSON.stringify(send_data),
                    dataType: 'json',
                    headers: {'Authorization': $header},
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        if (data.status === true) {
                            chatgive.cover_loader('hide');
                            Swal.fire(
                                'Success',
                                data.message,
                                'success'
                            );
                            form.trigger('reset');
                            $w('#alert_validation_payment_method').hide();
                            $w('.add-payment-method-form').hide();
                            $w('.sc-add-payment_method').show();
                            $w('#profile_type_method').val('');
                            $w('#profile_bank_account').hide();
                            $w('#profile_credit_card').hide();
                            chatgive.refreshChat();
                            chatgive.loadProfile();
                        } else {
                            chatgive.cover_loader('hide');
                            Swal.fire(
                                'Error',
                                data.message,
                                'error'
                            );
                        }
                    }
                ).fail(function (data,status) {
                    var chat_data = data.responseJSON;
                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                        var $header_refresh = "Bearer ";
                        try {
                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                            }
                        } catch (e) {}
                        $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if(data.status == true){
                                if(data.d1a22a6f44f8b11b132a1ea){
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {}
                                }
                                add_payment_source_psf(send_data,form);
                            }
                        }).fail(function () {
                            chatgive.cover_loader('hide');
                            chatgive.no_logged_chat();
                        })
                    }
                });
            }



            //Get and Load Profile Payment Sources
            await $w.ajax({
                type: "POST",
                url: chatgive.base_url + 'widget_profile/get_payment_sources',
                dataType: 'json',
                headers: {'Authorization': $header},
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                function (data, status) {
                    if (data.status === true) {
                        $w('.payment_sources').empty();
                        $w.each(data.data, function () {
                            var payment_source = this;
                            var source_type = payment_source.source_type;
                            $w('.payment_sources').append(`
                                <div class="sc-item">
                                    <div class="sc-item-body">
                                        <div class="sc-item-name"><span class="sc-item-source-type">` + source_type + `</span> ending in ... ` + payment_source.last_digits + `</div>
                                        <div class="sc-item-delete-source"><a data-id="` + payment_source.id + `" href="#">X</a></div>
                                    </div>
                                </div>
                            `);
                        });
                    }
                }
            ).fail(function (data,status) {
                var chat_data = data.responseJSON;
                if(chat_data.code && (chat_data.code == 'access_token_not_found' || chat_data.code == 'access_token_expired')) {
                    $header_refresh = "Bearer ";
                    try {
                        if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                            $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                        }
                    } catch (e) {}
                    $w.ajax({
                        type: "POST",
                        url: chatgive.base_url + 'wtoken/refresh',
                        headers: {'Authorization': $header_refresh},
                        dataType: 'json',
                        crossDomain: true,
                        xhrFields: {
                            withCredentials: true
                        }
                    }).done(function (data, status) {
                        if(data.status == true){
                            if(data.d1a22a6f44f8b11b132a1ea){
                                try {
                                    localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                    localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                } catch (e) {}
                            }
                            chatgive.loadProfile(show_view);
                        }
                    }).fail(function () {
                        chatgive.no_logged_chat();
                    })
                }
            });

            //Get and Load Profile Recurring
            await $w.ajax({
                type: "POST",
                url: chatgive.base_url + 'widget_profile/get_subscriptions',
                dataType: 'json',
                headers: {'Authorization': $header},
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                function (data, status) {
                    if (data.status === true) {
                        $w('.recurring_donations').empty();
                        if(data.data.length > 0) {
                            $w.each(data.data, function () {
                                var recurring = this;
                                var source_type = recurring.payment_method;
                                var ending_digits = "";
                                if (recurring.last_digits !== null) {
                                    ending_digits = "ending in ... " + recurring.last_digits;
                                }
                                $w('.recurring_donations').append(`
                                <div class="sc-item">
                                    <div class="sc-item-header">
                                        <div class="sc-item-date">` + recurring.created_at + `</div>
                                        <div class="sc-item-fund">` + recurring.funds_name + `</div>
                                    </div>
                                    <div class="sc-item-body">
                                        <div class="sc-item-name"><span class="sc-item-source-type">` + source_type + ` </span>` + ending_digits + `</div>
                                        <div class="sc-item-amount">$` + recurring.amount + `</div>
                                        <div class="sc-item-cancel-recurring"><a data-id="` + recurring.id + `" href="#">Cancel</a></div>
                                    </div>
                                </div>
                                    `);
                            });
                        } else {
                            $w('.recurring_donations').append(`<div class="sc-no-records-found">No records found</div>`);
                        }
                    }
                }
            ).fail(function (data,status) {
                var chat_data = data.responseJSON;
                if(chat_data.code && (chat_data.code == 'access_token_not_found' || chat_data.code == 'access_token_expired')) {
                    $header_refresh = "Bearer ";
                    try {
                        if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                            $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                        }
                    } catch (e) {}
                    $w.ajax({
                        type: "POST",
                        url: chatgive.base_url + 'wtoken/refresh',
                        headers: {'Authorization': $header_refresh},
                        dataType: 'json',
                        crossDomain: true,
                        xhrFields: {
                            withCredentials: true
                        }
                    }).done(function (data, status) {
                        if(data.status == true){
                            if(data.d1a22a6f44f8b11b132a1ea){
                                try {
                                    localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                    localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                } catch (e) {}
                            }
                            chatgive.loadProfile(show_view);
                        }
                    }).fail(function () {
                        chatgive.no_logged_chat();
                    })
                }
            });


            try {
                await chatgive.loadProfileDonations(0);
            } catch (e) {}

            chatgive.cover_loader('hide');
            if(show_view){
                show_view.show();
            }
            chatgive.closeMainMenu();
        };

        chatgive.loadProfileDonations = async function($offset,force_show_view = null) {

            $header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem("b25a9b3d0c99f288c")){
                    $header += localStorage.getItem("b25a9b3d0c99f288c");
                }
            } catch (e) {}
            
            if($offset === 0){
                $w('.giving_history').empty();
            }
            $w('.profile_spinner_container').show();
            //Get and Load Profile Giving History
            var send_data = {offset:$offset};
            await $w.ajax({
                type: "POST",
                url: chatgive.base_url + 'widget_profile/get_donations',
                data: JSON.stringify(send_data),
                dataType: 'json',
                headers: {'Authorization': $header},
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                function (data, status) {
                    if (data.status === true) {
                        if(data.data.rows.length > 0) {
                            $w.each(data.data.rows, function () {
                                var donation = this;
                                var source_type = donation.payment_method;
                                var ending_digits = "";
                                var donation_status = "";
                                if (donation.last_digits !== null) {
                                    ending_digits = "ending in ... " + donation.last_digits;
                                }
                                if (donation.status_ach == 'W') {
                                    donation_status = 'In Progress';
                                }
                                $w('.giving_history').append(`
                                <div class="sc-item">
                                    <div class="sc-item-header">
                                        <div class="sc-item-date">` + donation.created_at + `</div>
                                        <div class="sc-item-fund">` + donation.funds_name + `</div>
                                    </div>
                                    <div class="sc-item-body">
                                        <div class="sc-item-name"><span class="sc-item-source-type">` + source_type + `</span> ` + ending_digits + `</div>
                                        <div class="sc-item-amount">$` + donation.total_amount + `</div>
                                    </div>
                                    <div class="sc-item-status">` + donation_status + `</div>
                                </div>
                                    `);
                            });
                            if (data.data.has_more === true) {
                                $w('.sc-item-load-more').css('visibility', 'visible');
                            } else {
                                $w('.sc-item-load-more').css('visibility', 'hidden');
                            }
                            chatgive.profile_donations_offset = data.data.offset;
                        } else {
                            $w('.giving_history').append(`<div class="sc-no-records-found">No records found</div>`);
                        }
                    }
                    $w('.profile_spinner_container').hide();
                }
            ).fail(function (data,status) {
                var chat_data = data.responseJSON;
                if(chat_data.code && (chat_data.code == 'access_token_not_found' || chat_data.code == 'access_token_expired')) {
                    $header_refresh = "Bearer ";
                    try {
                        if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                            $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                        }
                    } catch (e) {}
                    $w.ajax({
                        type: "POST",
                        url: chatgive.base_url + 'wtoken/refresh',
                        headers: {'Authorization': $header_refresh},
                        dataType: 'json',
                        crossDomain: true,
                        xhrFields: {
                            withCredentials: true
                        }
                    }).done(function (data, status) {
                        if(data.status == true){
                            if(data.d1a22a6f44f8b11b132a1ea){
                                try {
                                    localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                    localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                } catch (e) {}
                            }
                            chatgive.loadProfileDonations($offset,force_show_view);
                        }
                    }).fail(function () {
                        chatgive.no_logged_chat();
                    })
                }
            });
        };

        chatgive.loadProfileEvents = function () {
            $w('.sc-add-payment_method')
                .click(function () {
                $w('.sc-add-payment_method').hide();
                $w('.add-payment-method-form').show();
                $w('#profile_type_method').val('');
            });

            $w('#profile_bank_account_psf .select_bank_type').change(function () {
                $w('#profile_bank_account_psf .bank_type').hide();
                var bank_type = $w(this).val();
                $w('#profile_bank_account_psf .'+bank_type+'_type').show();
            });

            $w('#profile_type_method').change(function () {
                var type = $w('#profile_type_method').val();
                $w('#profile_bank_account').hide();
                $w('#profile_credit_card').hide();
                $w('#profile_credit_card_psf').hide();
                $w('#profile_bank_account_psf').hide();
                if (type === "bank_account") {
                    if(chatgive.payment_processor == 'PSF'){
                        $w('#profile_bank_account_psf').show();
                        $w('#profile_bank_account_psf .bank_type').hide();
                        $w('#profile_bank_account_psf .select_bank_type').val('ach');
                        $w('#profile_bank_account_psf .ach_type').show();
                        $w('#profile_bank_account_psf').get(0).reset();
                        if(chatgive.hide_bank_country){
                            $w('#profile_bank_account_psf .country_picker').val(chatgive.autoselect_country);
                        }
                    } else {
                        $w('#profile_bank_account').show();
                    }
                } else if (type === "credit_card") {
                    if(chatgive.payment_processor == 'PSF'){
                        $w('#profile_credit_card_psf').show();
                    } else {
                        $w('#profile_credit_card').show();
                    }
                }
            });



            $w('.cancel_payment_method').click(function () {
                var type = $w('#profile_type_method').val();
                $w('#profile_'+type).trigger('reset');
                $w('#alert_validation_payment_method').hide();
                $w('.add-payment-method-form').hide();
                $w('.sc-add-payment_method').show();
                $w('#profile_type_method').val('');
                $w('#profile_bank_account').hide();
                $w('#profile_credit_card').hide();
            });

            $w('.save_payment_method').click(function () {
                chatgive.cover_loader('show');

                var type = $w('#profile_type_method').val();
                var validation = true;
                var inputs = null;
                if(type === 'bank_account' && chatgive.payment_processor == 'PSF'){
                    var bank_type = $w('#profile_'+type+'_psf .select_bank_type').val();
                    inputs = $w('#profile_'+type+'_psf .'+bank_type+'_type .form-control');
                } else {
                    inputs = $w('#profile_' + type + ' .form-control');
                }
                $w.each(inputs, function (key,value_input) {
                    var input_value = $w(value_input).val();
                    if(input_value){
                        input_value = input_value.trim();
                    }
                    var input_name = $w(value_input).attr('placeholder');
                    //Skipping validation
                    if(input_name !== 'Street 2') {
                        if (input_value === null || input_value === '') {
                            $w('#alert_validation_payment_method').text(input_name + ' is required');
                            $w('#alert_validation_payment_method').show();
                            validation = false;
                            return false;
                        }
                    }
                });

                if(validation === false){
                    return false;
                }

                var send_data = {};
                var form = null;
                if(type === 'bank_account' && chatgive.payment_processor == 'PSF') {
                    form = $w('#profile_bank_account_psf');
                } else {
                    form = $w('#profile_' + type);
                }
                var data = form.serializeArray();
                send_data['payment_method'] = type;
                $w.each(data, function () {
                    send_data[this.name] = this.value;
                });

                send_data[chatgive.token_name] = chatgive.token_code;

                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + 'widget_profile/add_payment_source',
                    data: JSON.stringify(send_data),
                    dataType: 'json',
                    headers: {'Authorization': $header},
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        chatgive.cover_loader('hide');
                        if (data.status === true) {
                            Swal.fire(
                                'Success',
                                data.message,
                                'success'
                            );
                            form.trigger('reset');
                            $w('#alert_validation_payment_method').hide();
                            $w('.add-payment-method-form').hide();
                            $w('.sc-add-payment_method').show();
                            $w('#profile_type_method').val('');
                            $w('#profile_bank_account').hide();
                            $w('#profile_credit_card').hide();
                            chatgive.refreshChat();
                            chatgive.loadProfile();
                        } else {
                            Swal.fire(
                                'Error',
                                data.message,
                                'error'
                            );
                        }
                    }
                ).fail(function (data,status) {
                    var chat_data = data.responseJSON;
                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                        var $header_refresh = "Bearer ";
                        try {
                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                            }
                        } catch (e) {}
                        $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if(data.status == true){
                                if(data.d1a22a6f44f8b11b132a1ea){
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {}
                                }
                                $w('.save_payment_method').trigger('click');
                            }
                        }).fail(function () {
                            chatgive.cover_loader('hide');
                            chatgive.no_logged_chat();
                        })
                    }
                });
            });

            //Delete Sources
            $w('.payment_sources').on('click','.sc-item-delete-source a',function () {

                Swal.fire({
                    title: 'Delete Payment Source',
                    text: "Are you sure?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, delete it!'
                }).then((result) => {
                    if (result.value) {
                        chatgive.cover_loader('show');
                        chatgive.remove_payment_source($w(this));
                    }
                });
            });

            chatgive.remove_payment_source = function(button_clicked){
                var source_id = button_clicked.data('id');
                var payment_source_item = button_clicked.parents('.sc-item');
                var data = {source_id:source_id};
                data[chatgive.token_name] = chatgive.token_code;

                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + 'widget_profile/remove_payment_source',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    headers: {'Authorization': $header},
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        chatgive.cover_loader('hide');
                        if (data.status === true) {
                            payment_source_item.remove();
                            chatgive.refreshChat();
                            Swal.fire(
                                'Deleted',
                                data.message,
                                'success'
                            )
                        } else {
                            Swal.fire(
                                'Error',
                                data.message,
                                'error'
                            )
                        }
                    }
                ).fail(function (data,status) {
                    var chat_data = data.responseJSON;
                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                        var $header_refresh = "Bearer ";
                        try {
                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                            }
                        } catch (e) {}
                        $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if(data.status == true){
                                if(data.d1a22a6f44f8b11b132a1ea){
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {}
                                }
                                chatgive.remove_payment_source(button_clicked);
                            }
                        }).fail(function () {
                            chatgive.cover_loader('hide');
                            chatgive.no_logged_chat();
                        })
                    }
                });
            };

            //Cancel Subscription
            $w('.recurring_donations').on('click','.sc-item-cancel-recurring a',function () {
                Swal.fire({
                    title: 'Cancel Subscription',
                    text: "Are you sure?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, cancel it!'
                }).then((result) => {
                    if (result.value) {
                        chatgive.cover_loader('show');
                        chatgive.stop_subscription($w(this));
                    }
                });
            });

            chatgive.stop_subscription = function(button_clicked){
                var subscription_id = button_clicked.data('id');
                var recurring_donation_item = button_clicked.parents('.sc-item');
                var data = {subscription_id:subscription_id};
                data[chatgive.token_name] = chatgive.token_code;

                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + 'widget_profile/stop_subscription',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    headers: {'Authorization': $header},
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        chatgive.cover_loader('hide');
                        if (data.status === true) {
                            recurring_donation_item.remove();
                            Swal.fire(
                                'Canceled',
                                data.message,
                                'success'
                            )
                        } else {
                            Swal.fire(
                                'Error',
                                data.message,
                                'error'
                            )
                        }
                    }
                ).fail(function (data,status) {
                    var chat_data = data.responseJSON;
                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                        var $header_refresh = "Bearer ";
                        try {
                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                            }
                        } catch (e) {}
                        $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if(data.status == true){
                                if(data.d1a22a6f44f8b11b132a1ea){
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {}
                                }
                                chatgive.stop_subscription(button_clicked);
                            }
                        }).fail(function () {
                            chatgive.cover_loader('hide');
                            chatgive.no_logged_chat();
                        })
                    }
                });
            };

            $w('.sc-item-load-more').click(function(){
                chatgive.loadProfileDonations(chatgive.profile_donations_offset);
            });

            $w('.sc-item-download-ytd').click(function () {
                chatgive.cover_loader('show');
                var send_data = {};
                send_data[chatgive.token_name] = chatgive.token_code;

                $header = "Bearer ";
                try {
                    if(localStorage && localStorage.getItem			("b25a9b3d0c99f288c")){
                        $header += localStorage.getItem("b25a9b3d0c99f288c");
                    }
                } catch (e) {}

                $w.ajax({
                    type: "POST",
                    url: chatgive.base_url + 'widget_profile/generate_ytd_statement',
                    data: send_data,
                    dataType: 'json',
                    headers: {'Authorization': $header},
                    crossDomain: true,
                    xhrFields: {
                        withCredentials: true
                    }
                }).done(
                    function (data, status) {
                        chatgive.cover_loader('hide');
                        if (data.status === true) {
                            var file_path = data.data;
                            var a = document.createElement('A');
                            a.href = file_path;
                            a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                    }
                ).fail(function (data,status) {
                    var chat_data = data.responseJSON;
                    if(chat_data.code && (chat_data.code === 'access_token_not_found' || chat_data.code === 'access_token_expired')) {
                        var $header_refresh = "Bearer ";
                        try {
                            if(localStorage && localStorage.getItem("564c8d74f693c47f5")){
                                $header_refresh += localStorage.getItem("564c8d74f693c47f5");
                            }
                        } catch (e) {}
                        $w.ajax({
                            type: "POST",
                            url: chatgive.base_url + 'wtoken/refresh',
                            headers: {'Authorization': $header_refresh},
                            dataType: 'json',
                            crossDomain: true,
                            xhrFields: {
                                withCredentials: true
                            }
                        }).done(function (data, status) {
                            if(data.status == true){
                                if(data.d1a22a6f44f8b11b132a1ea){
                                    try {
                                        localStorage.setItem('b25a9b3d0c99f288c', data.d1a22a6f44f8b11b132a1ea['b25a9b3d0c99f288c']);
                                        localStorage.setItem('564c8d74f693c47f5', data.d1a22a6f44f8b11b132a1ea['564c8d74f693c47f5']);
                                    } catch (e) {}
                                }
                                $w('.sc-item-download-ytd').trigger('click');
                            }
                        }).fail(function () {
                            chatgive.cover_loader('hide');
                            chatgive.no_logged_chat();
                        })
                    }
                });
            });
        };

        chatgive.inputMasksProfile = function () {

            //Profile Phone
            if (document.querySelector('#profile_phone')) {
                IMask(
                    document.querySelector('#profile_phone'),
                    {
                        mask: '0000000000',
                    });
            }

            //Profile Phone Login Main
            if (document.querySelector('#verification_code')) {
                IMask(
                    document.querySelector('#verification_code'),
                    {
                        mask: '00000',
                    });
            }

            //Credit Card
            if (document.querySelector('.add-payment-method-form .js_mask_credit_card')) {
                IMask(
                    document.querySelector('.add-payment-method-form .js_mask_credit_card'),
                    {
                        mask: '0000-0000-0000-0000',
                    });
            }

            //CVV
            if (document.querySelector('.add-payment-method-form .js_mask_cvv')) {
                IMask(
                    document.querySelector('.add-payment-method-form .js_mask_cvv'),
                    {
                        mask: '000',
                    });
            }

            //EXPIRATION DATE
            if (document.querySelector('.add-payment-method-form .js_mask_exp_date')) {
                IMask(
                    document.querySelector('.add-payment-method-form .js_mask_exp_date'),
                    {
                        mask: Date,
                        pattern: 'm/Y',
                        blocks: {
                            m: {
                                mask: IMask.MaskedRange,
                                from: 1,
                                to: 12,
                                maxLength: 2,
                            },
                            Y: {
                                mask: IMask.MaskedRange,
                                from: 1900,
                                to: 9999,
                            }
                        },

                        // define date -> str convertion
                        format: function (date) {
                            var month = date.getMonth() + 1;
                            var year = date.getFullYear();

                            if (month < 10) month = "0" + month;

                            return [month, year].join('/');
                        },

                        parse: function (str) {
                            var yearMonthDay = str.split('/');
                            return new Date(yearMonthDay[1], yearMonthDay[0] - 1, 1);
                        },

                        // optional interval options
                        min: new Date(1900, 1, 1),  // defaults to `1900-01-01`
                        max: new Date(9999, 12, 12),  // defaults to `9999-12-12`

                        overwrite: true
                    });
            }
        };

        chatgive.cover_loader = function(option) {
            if (option === "show") {
                $w("#cover_spin").show(0);
            } else if (option === "hide") {
                $w("#cover_spin").hide(0);
            }
        };

    };

    let countries_all = {
        '': 'Select Country',
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
})();