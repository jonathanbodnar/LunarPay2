(function () {

    //add csrf token, it is pending
    $(document).ready(async function () {
        try {
            await portal.start(); //loader shown on header before loading html
            $(portal.htmlCnt).show();
            $(portal.htmlCnt + ' #email').focus();
            loader('hide');
        } catch (e) {
            setTimeout(function () { // Await Refresh Token
                $(portal.htmlCnt).show();
                $(portal.htmlCnt + ' #email').focus();
                loader('hide');
            },300)
        }

    });

    let portal = {
        htmlCnt: '#portal-container', //html container
        view_config: view_config, //set on footer outside this scope but global
        base_api: APP_BASE_URL + 'customer/apiv1/',
        payment_link_data: null,
        apiKey:null, //will be loaded within the payment link resource
        formatter: new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2}),
        login_action: null,
        sc_input: $(this.htmlCnt + ' #sc-1'), //Current security code input working
        email_regexp : /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/,
        user_logged: null,
        user_data: null,
        user_exist: false,
        payment_option_selected: null,
        registering: false, // When modal is Registering instead Logging
        is_refreshed_token: false,
        is_subscription: false,
        has_one_time_product: false,
        var_config: null, //used for data models
        payment_processor: null,
        trial_days: null,
        calculated_total: 0, //full totals
        calculated_fee: 0, //full totals
        cover_fee: null,
        hideQty: false,
        calculated_subtotals: {
            one_time_calculated_total: 0, //subtotals it is handled in one transaction
            one_time_calculated_fee: 0, //subtotals it is handled in one transaction
            recurrent_totals: [], //subtotals each subscription is handled on different transactions
        },
        theme: null,
        customerHubCartKey: 'shop-storage',
        customerHubUrl: null,
        // Function to get post purchase link with priority: URL param > payment link data
        getPostPurchaseLink: function() {
            // First check if success_callback is in URL parameters (from generate_session)
            const urlParams = new URLSearchParams(window.location.search);
            const urlPostPurchaseLink = urlParams.get('success_callback');
            
            if (urlPostPurchaseLink) {
                return urlPostPurchaseLink;
            }
            
            // Fall back to payment link data if no URL parameter
            if (portal.payment_link_data && portal.payment_link_data.show_post_purchase_link && portal.payment_link_data.post_purchase_link) {
                return portal.payment_link_data.post_purchase_link;
            }
            
            return null;
        },
        options: {
            environment: null, //TEST / LIVE //will be loaded within the invoice resource
            style: {
                input: {
                    "font-size": "13px",
                    "color": "#1A1A1A!important",
                    "font-family":"Open Sans, sans-serif;",
                    "font-weight": "300",
                    "background": "transparent !important"
                },
                "::placeholder": {
                    "color": "#bbbbc2!important",
                    "font-family":"Open Sans, sans-serif;",
                    "font-weight": "300"
                }
            },
            fields: {
                cardNumber: {
                    selector: "#cardNumber",
                    placeholder: "Card Number",
                },
                expiryDate: {
                    selector: "#cardExpiry",
                    placeholder: "MM / YY"
                },
                cvv: {
                    selector: "#cardCvc",
                    placeholder: "CVV"
                }
            }
        },
        launchSignInModal: async function () {
            loader('show');
            await portal.generateSecurityCode();
            $(portal.htmlCnt + ' #sign-in-modal').modal('show');
            loader('hide');
            //portal.sc_input.focus();
        },
        payment_option: 'cc', //cc or bank,
        payment_form_selected: 'cc', //cc or bank,
        pay_button_clicked: false,
        checkAccountExists: async function (email) {
            let email_value = email;
            let email_validation = String(email_value).toLowerCase()//email regular expression validation
                .match(portal.email_regexp);
            if (email_validation) {
                let send_data = {};
                send_data['username'] = email_value;
                send_data['org_id'] = portal.payment_link_data.church_id;
                if (parseInt(portal.payment_link_data.campus_id))
                    send_data['suborg_id'] = portal.payment_link_data.campus_id;
                await $.ajax({
                    url: `${portal.base_api}auth/account_exists`, type: "POST", data: JSON.stringify(send_data), dataType: "json",
                    success: function (data) {
                        if (data.response.status) {
                            portal.user_exist = true;
                            $(portal.htmlCnt + ' #btn_sign_in_modal').show();
                            // Show manage billing links when user exists
                            $(portal.htmlCnt + ' .customer_hub_link').show();
                            //$(portal.htmlCnt + ' .save_card_container').hide();
                        } else {
                            $(portal.htmlCnt + ' #btn_sign_in_modal').hide();
                            // Hide manage billing links when user doesn't exist
                            $(portal.htmlCnt + ' .customer_hub_link').hide();
                            //$(portal.htmlCnt + ' .save_card_container').show();
                            portal.user_exist = false
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON !== 'undefined' &&
                            typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        portal.user_exist = false;
                        // Hide manage billing links on error
                        $(portal.htmlCnt + ' .customer_hub_link').hide();
                    }
                });
            }
            else {
                portal.user_exist = false;
                $(portal.htmlCnt + ' #btn_sign_in_modal').hide();
                // Hide manage billing links when email validation fails
                $(portal.htmlCnt + ' .customer_hub_link').hide();
                $(portal.htmlCnt + ' .save_card_container').show();
            }
        },
        setEvents: async function () { //@private method
            $(document).on('click', portal.htmlCnt + ' .payment-selector .option-container', function () {
                $(portal.htmlCnt + ' .payment-selector .option-container').removeClass('is-selected');
                $(this).hide().fadeIn('slow').addClass('is-selected');
                let type = $(this).attr('type');
                portal.payment_form_selected = type;
                
                if(portal.payment_processor && portal.payment_processor.code === 'FTS') {
                    portal.fts_init();
                }
                
                $('[data-option-container]').hide();
                $('[data-option-container="' + type + '"]').fadeIn()
                
            });
            $(portal.htmlCnt + ' .payment-selector .option-container[type="cc"]').click();

            //Check if email is registered
            $(document).on('input', portal.htmlCnt + ' #email',function (e) {
                portal.checkAccountExists($(this).val());   
            });

            //Sign-in/Sign-up Modal Open
            $(portal.htmlCnt + ' #btn_sign_in_modal').on('click', async function () {
                portal.launchSignInModal();                
            });

            // $(portal.htmlCnt + ' #email').on('blur', async function () {
            //     if(portal.user_exist && !portal.user_logged) {
            //         notify({'title': 'Notification', 'message': 'This email is already registered, feel free to sign in!'});
            //     }
            // });
            
            $(portal.htmlCnt + ' #sign-in-modal').on('show.bs.modal', await async function (e) {
                
                const actionText = portal.registering ? 'Sign up' : 'Sign in';
                $(portal.htmlCnt + ' .is_registering').text(actionText);
                $(portal.htmlCnt+ ' .sign_in_email').text($(portal.htmlCnt + ' #email').val());
                $(portal.htmlCnt + ' .sc-status').hide();
                $(portal.htmlCnt + ' .sc-status-info').show();
                $(portal.htmlCnt + ' #security-code-table input').attr('disabled', false);
                $(portal.htmlCnt + " #security-code-table input").val('');
                
                portal.sc_input = $(portal.htmlCnt + ' #sc-1');
                
            });

            $(portal.htmlCnt + ' #sign-in-modal').on('shown.bs.modal', function () {
                portal.sc_input.focus();
            });

            $(portal.htmlCnt + ' #sign-in-modal').on('hide.bs.modal', function () {
                portal.registering = false;
                portal.pay_button_clicked = false;
                $(portal.htmlCnt + " .sc-status").hide();
                $(portal.htmlCnt + " .sc-status-info").show();
                $(portal.htmlCnt + " #security-code-table input").attr('disabled',false);
                if (portal.user_logged == null) {
                    $(portal.htmlCnt + ' .save_data').prop('checked', false);
                    portal.fts_init();
                }
                portal.sc_input.focus();
            });

            //Security Code Input Functionality
            let security_code_table = $(portal.htmlCnt + " #security-code-table");
            security_code_table.on('keypress',function (e) {
                let charCode = String.fromCharCode(e.keyCode);
                let is_number = /^[0-9]+$/.test(charCode);
                if (is_number) {
                    let target = e.srcElement || e.target;
                    target = $(target);
                    let next = target.parent().next().find('input');
                    if (next !== null) {
                        next.focus();
                        portal.sc_input = next;
                    }
                } else {
                    e.preventDefault();
                }
            });
            security_code_table.on('keydown','input',function (e) {
                if(e.keyCode == 8) { // BACKSPACE
                    let target = e.srcElement || e.target;
                    target = $(target);
                    let previous = target.parent().prev().find('input');
                    if (previous !== null) {
                        previous.focus();
                        previous.val('');
                        portal.sc_input = previous;
                    }
                }
            });
            security_code_table.on('focus','input',function (e) {
                if($(this) !== portal.sc_input) {
                    setTimeout(function () { // FIX Maximum call stack size exceeded ERROR
                        portal.sc_input.focus();
                    },1);
                    e.preventDefault();
                }
            });
            security_code_table.on('keyup','input',async function (e) {
                e.stopPropagation();
                let security_code_inputs = $(portal.htmlCnt + " #security-code-table input");
                let security_code = '';
                $.each(security_code_inputs,function (key,value) {
                    security_code += $(value).val();
                });
                if(security_code.length === 5){
                    security_code_inputs.attr('disabled','disabled');
                    $(portal.htmlCnt + " .sc-status").hide();
                    $(portal.htmlCnt + " .sc-status-verifying").show();
                    if(portal.registering){
                        await portal.register(security_code)
                    } else {
                        await portal.login(security_code);
                    }
                    if(portal.user_logged == null) { //failed to get a session, no register no login
                        setTimeout(function () {
                            security_code_inputs.val(null);
                            security_code_inputs.attr('disabled', false);
                            portal.sc_input = security_code_inputs.first();
                            security_code_inputs.focus();
                        }, 500);
                    }
                    
                }
            });

            security_code_table.on('paste','input',async function (e) {
                let ev = e.originalEvent;
                e.preventDefault();
                let paste = (ev.clipboardData || window.clipboardData).getData('text');
                if(!isNaN(parseFloat(paste))){
                    let target = $(e.target);
                    for (const letter of paste) {
                        target.val(letter);
                        target = target.parent().next().find('input');
                        if (target !== null) {
                            target.focus();
                            portal.sc_input = target;
                        } else {
                            break;
                        }
                    }
                }
                return false;
            });

            //Register Data Functionality
            $(portal.htmlCnt + ' .save_data').change(async function (e) {
                if ($(this).is(':checked')) {
                    if(portal.user_logged) {//do not continue                        
                        e.preventDefault();
                        if(portal.payment_processor.code === 'FTS') portal.fts_init();
                        return false;
                    }

                    await portal.checkAccountExists($(portal.htmlCnt + ' #email').val());

                    portal.registering = portal.user_exist ? false : true;

                    let email_value = $(portal.htmlCnt + ' #email').val().trim();
                    let email_holder_name = $(portal.htmlCnt + ' #holder_name').val().trim();

                    let first_name = $(portal.htmlCnt + ' #ach_bank_form input[name="first_name"]').val();
                    if(portal.payment_link_data.organization.region === 'CA') {
                        first_name = $(portal.htmlCnt + ' #eft_bank_form input[name="first_name"]').val();
                    }
                    let is_valid = true;
                    let error_message = '';

                    if(!email_value){
                        error_message = 'The Email field is required';
                        is_valid = false;
                    } else if(!email_value.match(portal.email_regexp)){
                        error_message = 'A valid Email is required';
                        is_valid = false;
                    } else if(portal.payment_form_selected === 'cc' && !email_holder_name && portal.payment_processor.code === 'PSF'){
                        error_message = 'Holder Name is required';
                        is_valid = false;
                    } else if(portal.payment_form_selected === 'bank' && !first_name){
                        error_message = 'First Name is required';
                        is_valid = false;
                    }

                    if(is_valid){
                        portal.launchSignInModal();
                        if (portal.payment_processor.code === 'FTS') portal.fts_init();                        
                    } else {
                        notify({'title': 'Notification', 'message': error_message});
                        $(portal.htmlCnt + ' .save_data').prop('checked',false);
                    }
                } else {
                    if (portal.payment_processor.code === 'FTS') portal.fts_init();
                }
            });

            //Change Qty
            $(portal.htmlCnt + ' #product_list').on('input','input',function () {
                portal.fts_init();                
            });

            //Sign Out
            $(portal.htmlCnt + ' #sign_out').on('click',async function () {
                loader('show');
                await portal.sign_out();
                loader('hide');
            });

            $(portal.htmlCnt + ' #pay_bank').on('click',async function () {
                loader('show');
                portal.pay_button_clicked = true;
                await portal.bank_payment();
                loader('hide');
            });

            $(portal.htmlCnt + ' #pay_wallet').on('click',async function () {
                loader('show');
                portal.pay_button_clicked = true;
                await portal.wallet_payment();
                loader('hide');
            });

            $(portal.htmlCnt + ' #cancel_change_payment_option').on('click',async function () {
                $(portal.htmlCnt + ' .payment_selected_container').show();
                $(portal.htmlCnt + ' .payment_options').hide();                
            });

            $(portal.htmlCnt + ' #change_payment_option').on('click',async function () {
                $(portal.htmlCnt + ' .payment_selected_container').hide();
                $(portal.htmlCnt + ' .payment_options').show();
            });

            //update payment option on click
            $(portal.htmlCnt + ' .payment_options').on('click','.payment_option',function () { //saved sources
                $(portal.htmlCnt + ' .payment_option').removeClass('theme_color text_theme_color');
                $(this).addClass('theme_color text_theme_color');
                portal.payment_option_selected = {
                    'id' : $(this).attr('data-id'), 
                    'source_type' : $(this).attr('data-source_type'),
                    'src_account_type' : $(this).attr('data-src_account_type'),
                };

                //
                portal.calculateTotal();

                let text_payment = $(this).html();
                setTimeout(function () {
                    $(portal.htmlCnt + ' .payment_options').hide();
                    $(portal.htmlCnt + ' #payment_selected').html(text_payment);
                    $(portal.htmlCnt + ' .payment_selected_container').show();
                },100);
            });

            $(portal.htmlCnt + ' .payment_options').on('click','.add_new_option',function () {
                $(portal.htmlCnt + ' .payment_options').hide();
                $(portal.htmlCnt + ' .table_new_payment_option').show();
                $(portal.htmlCnt + ' #fts-group').show();
                $(portal.htmlCnt + ' .option-container.is-selected').click();
                $(portal.htmlCnt + ' .cancel_new_payment_option_container').show();
                portal.payment_option_selected = null;
                portal.calculateTotal();
            });

            $(portal.htmlCnt + ' #cancel_new_payment_option').on('click', function () {
                $(portal.htmlCnt + ' .payment_options').show();
                $(portal.htmlCnt + ' .new_payment_option').hide();
                $(portal.htmlCnt + ' #fts-group').hide();
                $(portal.htmlCnt + ' .cancel_new_payment_option_container').hide();
                $(portal.htmlCnt + ' .payment_options .theme_color').first().click(); //the click updates the data selected

            });

            $(portal.htmlCnt + ' #back_buy').on('click',async function () {
                location.reload(true);
            });

            $(portal.htmlCnt + ' #resend-code').on('click',await async function () {
                loader('show');
                await portal.generateSecurityCode();
                loader('hide');
            });
        },
        login: async function(security_code){
            let send_data = {};
            send_data['username'] = $(portal.htmlCnt + ' #email').val();
            send_data['security_code'] = security_code;
            send_data['org_id'] = portal.payment_link_data.church_id;
            if(parseInt(portal.payment_link_data.campus_id))
                send_data['suborg_id'] = portal.payment_link_data.campus_id;
            await $.ajax({
                url: `${portal.base_api}auth/login`, type: "POST", data: JSON.stringify(send_data) , dataType: "json",
                success: async function (data) {
                    if(data.response.status === true){

                        if(data.response[auth_obj_var]){
                            try {
                                localStorage.setItem(auth_access_tk_var, data.response[auth_obj_var][auth_access_tk_var]);
                                localStorage.setItem(auth_refresh_tk_var, data.response[auth_obj_var][auth_refresh_tk_var]);
                            } catch (e) {}
                        }

                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-status-success").show();
                        portal.user_logged = send_data['username'];
                        await portal.get_user();
                        portal.showLoggedView();
                        await portal.resolveSubscriptionIfNeccesary();
                        setTimeout(function () { $(portal.htmlCnt + ' #sign-in-modal').modal('hide'); }, 1000)
                    } else {
                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-error-message").text(data.response.message);
                        $(portal.htmlCnt + " .sc-status-error").show();
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    if (typeof jqXHR.responseJSON !== 'undefined' &&
                        typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {

                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-error-message").text(jqXHR.responseJSON.message);
                        $(portal.htmlCnt + " .sc-status-error").show();
                    } else {
                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-error-message").text(jqXHR.responseText);
                        $(portal.htmlCnt + " .sc-status-error").show();
                    }
                }
            });
        },
        register: async function(security_code){
            let send_data = {};
            send_data['username'] = $(portal.htmlCnt + ' #email').val();
            if(portal.payment_form_selected === 'cc') {
                send_data['name'] = $(portal.htmlCnt + ' #holder_name').val();
            } else {
                if(portal.payment_link_data.organization.region === 'CA') {
                    let first_name = $(portal.htmlCnt + ' #eft_bank_form input[name="first_name"]').val();
                    let last_name = $(portal.htmlCnt + ' #eft_bank_form input[name="last_name"]').val();
                    send_data['name'] = last_name ? first_name + ' ' + last_name : first_name;
                } else {
                    let first_name = $(portal.htmlCnt + ' #ach_bank_form input[name="first_name"]').val();
                    let last_name = $(portal.htmlCnt + ' #ach_bank_form input[name="last_name"]').val();
                    send_data['name'] = last_name ? first_name + ' ' + last_name : first_name;
                }
            }
            send_data['security_code'] = security_code;
            send_data['org_id'] = portal.payment_link_data.church_id;
            if(parseInt(portal.payment_link_data.campus_id))
                send_data['suborg_id'] = portal.payment_link_data.campus_id;
            await $.ajax({
                url: `${portal.base_api}auth/register`, type: "POST", data: JSON.stringify(send_data) , dataType: "json",
                success: async function (data) {
                    $(portal.htmlCnt + " .sc-status").hide();
                    if(data.response.status === true){

                        if(data.response[auth_obj_var]){
                            try {
                                localStorage.setItem(auth_access_tk_var, data.response[auth_obj_var][auth_access_tk_var]);
                                localStorage.setItem(auth_refresh_tk_var, data.response[auth_obj_var][auth_refresh_tk_var]);
                            } catch (e) {}
                        }

                        $(portal.htmlCnt + " .sc-status-success").show();
                        portal.user_logged = send_data['username'];
                        await portal.get_user();
                        portal.showLoggedView();
                        await portal.resolveSubscriptionIfNeccesary();
                        setTimeout(function () {
                            $(portal.htmlCnt +' #sign-in-modal').modal('hide');
                        },1000)
                    } else {
                        $(portal.htmlCnt + " .sc-error-message").text(data.response.message);
                        $(portal.htmlCnt + " .sc-status-error").show();
                        //$(portal.htmlCnt + " .save_data").prop('checked',false);
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    if (typeof jqXHR.responseJSON !== 'undefined' &&
                        typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {

                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-error-message").text(jqXHR.responseJSON.message);
                        $(portal.htmlCnt + " .sc-status-error").show();
                    } else {
                        $(portal.htmlCnt + " .sc-status").hide();
                        $(portal.htmlCnt + " .sc-error-message").text(jqXHR.responseText);
                        $(portal.htmlCnt + " .sc-status-error").show();
                    }
                }
            });
        },
        sign_out: async function(){
            let header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_access_tk_var)){
                    header += localStorage.getItem(auth_access_tk_var);
                }

                await $.ajax({
                    url: `${portal.base_api}auth/sign_out`, type: "POST", dataType: "json", headers: {'Authorization': header},
                    success: function (data) {
                        if(data.response.status){
                            portal.user_logged = null;
                            portal.user_data = null;
                            portal.registering = false;
                            portal.payment_option_selected = null;
                            try {
                                if(localStorage){
                                    localStorage.removeItem(auth_access_tk_var);
                                    localStorage.removeItem(auth_refresh_tk_var);
                                }
                            } catch (e) {}
                            portal.signoutView();
                        }
                    },
                    error: async function (jqXHR, textStatus, errorJson) {
                        try {
                            let json = jqXHR.responseJSON;
                            if (json.response && (json.response.errors === 'access_token_not_found' || json.response.errors === 'access_token_expired')) {
                                await portal.refresh_token();
                                if (portal.is_refreshed_token) {
                                    portal.is_refreshed_token = false;
                                    await portal.sign_out();
                                }
                            }
                        } catch (error) {                                     
                            console.log(error);
                        }
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        get_user: async function(){
            let header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_access_tk_var)){
                    header += localStorage.getItem(auth_access_tk_var);
                }
            } catch (e) {}

            return await $.ajax({
                url: `${portal.base_api}auth/get_user`, type: "POST", dataType: "json", headers: {'Authorization': header}})
                .done(function (data) {
                    if(data.response.status){
                        portal.user_data = data.response.user;
                        portal.user_data.full_name = portal.user_data.last_name ? portal.user_data.first_name + ' ' + portal.user_data.last_name : portal.user_data.first_name;
                        portal.showLoggedView();
                    }
                })
                .fail(async function (jqXHR, textStatus, errorJson) {
                    try {
                        let json = jqXHR.responseJSON;
                        if(json.response && (json.response.errors === 'access_token_not_found' || json.response.errors === 'access_token_expired')){
                            await portal.refresh_token();
                            if(portal.is_refreshed_token) {
                                portal.is_refreshed_token = false;
                                await portal.get_user();
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });
        },
        showLoggedView: function(){
            $(portal.htmlCnt + ' #email_input').hide();
            //$(portal.htmlCnt + ' .save_card_container').hide();
            $(portal.htmlCnt + ' #email').val(portal.user_logged);
            $(portal.htmlCnt + ' #holder_name').val(portal.user_data.full_name);
            $(portal.htmlCnt + ' input[name="first_name"]').val(portal.user_data.first_name);
            $(portal.htmlCnt + ' input[name="last_name"]').val(portal.user_data.last_name);
            $(portal.htmlCnt + ' #email_logged').text(portal.user_logged);
            $(portal.htmlCnt + ' #email_logged_container').show();

            // Show manage billing links when user is logged in
            $(portal.htmlCnt + ' .customer_hub_link').show();

            if(portal.user_data.sources && portal.user_data.sources.length){                
                portal.payment_option_selected = portal.user_data.sources[0];
                if(portal.payment_option_selected){ 
                    $(portal.htmlCnt + ' .new_payment_option').hide();
                    $(portal.htmlCnt + ' #fts-group').hide(); //fts hide
                    $(portal.htmlCnt + ' .payment_selected_container').show();
                    if(portal.payment_option_selected.source_type === 'card') {
                        $(portal.htmlCnt + ' #payment_selected').html('<i class="fa fa-credit-card"></i> •••• •••• •••• '+portal.payment_option_selected.last_digits);
                    } else {
                        $(portal.htmlCnt + ' #payment_selected').html('<i class="fas fa-university"></i> •••• •••• •••• '+portal.payment_option_selected.last_digits);
                    }
                }
                let payment_options_container = $(portal.htmlCnt + ' .payment_options .list-group');
                payment_options_container.empty();
                $.each(portal.user_data.sources,function (key,value) {
                    let payment_text = '';
                    if(value.source_type === 'card')
                        payment_text = '<i class="fa fa-credit-card"></i> •••• •••• •••• '+value.last_digits;
                    else
                        payment_text = '<i class="fas fa-university"></i> •••• •••• •••• '+value.last_digits;

                    payment_text += ` (${value.src_account_type})`;
                    payment_options_container.append(`<li data-id="${value.id}" data-source_type="${value.source_type}" data-src_account_type="${value.src_account_type}" class="payment_option list-group-item ${key === 0 ? 'theme_color text_theme_color' : ''}">${payment_text}</li>`);
                });

                //click the first element of the payment_options_container list
                $(portal.htmlCnt + ' .payment_option').first().click();

                payment_options_container.append(`<li class="add_new_option list-group-item text-center"><a href="#">Use a Different Payment Method</a></li>`);
            }
            $(portal.htmlCnt + ' #sign_out').show();
        },
        signoutView: async function(){
            $(portal.htmlCnt + ' #email_input').show();
            $(portal.htmlCnt + ' #email').val(null);
            $(portal.htmlCnt + ' #email').focus();
            $(portal.htmlCnt + ' #email_logged_container').hide();
            $(portal.htmlCnt + ' .payment_selected_container').hide();
            $(portal.htmlCnt + ' .payment_options').hide();
            $(portal.htmlCnt + ' .cancel_new_payment_option_container').hide();
            $(portal.htmlCnt + ' .table_new_payment_option').show();
            $(portal.htmlCnt + ' .option-container.is-selected').click();

            // Hide manage billing links when user signs out
            $(portal.htmlCnt + ' .customer_hub_link').hide();

            $(portal.htmlCnt + ' #cc_form')[0].reset();
            $(portal.htmlCnt + ' #eft_bank_form')[0].reset();
            $(portal.htmlCnt + ' #ach_bank_form')[0].reset();

            $(portal.htmlCnt + ' #email').trigger('input');
            $(portal.htmlCnt + ' #sign_out').hide();
            $(portal.htmlCnt + ' .save_data').prop('checked',false);
            $(portal.htmlCnt + ' #fts-group').show();
            portal.calculateTotal();
        },
        start: async function () { //@public
            await portal.setEvents();

            // Hide manage billing links initially - they should only show when logged in
            $(portal.htmlCnt + ' .customer_hub_link').hide();

            $.each(states_us, function (value, text) {
                $('#ach_state').append($('<option>', {value: value, text: text}));
            });

            if (portal.view_config.view == 'payment_link') { //load the view requested from the url
                await portal.getPaymentLinkFullData(view_config.payment_link.hash);
            }
            await portal.get_branding_data();
            await portal.payment_processor_init();

            await portal.is_logged({ notifySessionExpired: false }).then(async function () { // Fix nested Away on ajax, force await
                if(portal.user_logged) {
                    await portal.get_user();
                }
            });
        },
        areProductsInCustomerHubCart(productsList) { //customer-hub portal

            const cartObj = JSON.parse(localStorage.getItem(portal.customerHubCartKey));
            const cartItems = cartObj?.state?.cart;
            if (!Array.isArray(cartItems)) return false;
            if (cartItems.length !== productsList.length) {
                return false; // Check if the lengths match first
            }
            // "very" works like this: [true, true, false, true].every(val => val); // → false
            return productsList.every(product => {
                const cartItem = cartItems.find(item => item.id.toString() === product.product_id.toString());
                if (!cartItem || cartItem._quantity !== parseInt(product.qty)) {
                    return false; // If a product is not found in the cart or quantities don't match, return false
                }
                
                return true;
            });
        },
        getPaymentLinkFullData: async function (hash) {
            await $.ajax({
                url: `${portal.base_api}payment_link/${hash}`, type: "GET", dataType: "json",
                success: async function (data) {
                    portal.var_config = data.response.var_config;                    
                    portal.payment_link_data = data.response.payment_link;
                    portal.options.environment = data.response.payment_processor.env;
                    portal.apiKey = data.response.payment_processor.encoded_keys;
                    
                    portal.payment_processor = data.response.payment_processor;
                    portal.cover_fee = portal.payment_link_data.cover_fee;
                    portal.customerHubUrl = data.response.customer_hub_url;
                    portal.trial_days = portal.payment_link_data.trial_days;

                    portal.hideQty = portal.trial_days !== null && portal.payment_link_data.products.length == 1;
                    
                    if(portal.trial_days !== null) {
                        $(portal.htmlCnt + ' .due_today_message').show();                        
                    } else {
                        $(portal.htmlCnt + ' .due_today_message').hide();
                    }

                    $(portal.htmlCnt + ' .customer_hub_link').attr('href', portal.customerHubUrl);
                        
                    $(portal.htmlCnt + ' .company_name').text(portal.payment_link_data.organization.name);
                    portal.showProducts();
                    if(portal.is_subscription){
                        $(portal.htmlCnt + ' .save_card_container').addClass('d-none');
                        $(portal.htmlCnt + ' .subscription_or_pay').text('"Subscribe"');
                    }
                    if(portal.payment_link_data.organization.region === 'CA'){
                        $(portal.htmlCnt + ' .bank_form').hide();
                        $(portal.htmlCnt + ' #eft_bank_form').show();
                    } else {
                        $(portal.htmlCnt + ' .bank_form').hide();
                        $(portal.htmlCnt + ' #ach_bank_form').show();
                    }
                },
                error: function (jqXHR, textStatus, errorJson) {
                    if (typeof jqXHR.responseJSON !== 'undefined' &&
                            typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                        alert(jqXHR.responseJSON.message);
                    } else {
                        alert("error: " + jqXHR.responseText);
                    }
                }
            });
        },
        showProducts: function (){
            $(portal.htmlCnt + ' #product_list').empty();
            let total_amount = 0;
            let custom_count= 0;
            var mDay = moment().format('MM-DD-YYYY');
            
            const trialDays = portal.trial_days;
            let trialDaysText = '';
            if (trialDays !== null && trialDays > 0) {
                trialDaysText = `<div class="d-inline-flex product_qty mutted-text align-items-end">&nbsp;(${trialDays} days trial)</div>`;
            }

            $.each(portal.payment_link_data.products,function (key,value) {
                let subscribe_html = '';
                
                if(value.recurrence == portal.var_config.product_model.RECURRENCE_PERIODICALLY){
                    portal.is_subscription = true;
                    subscribe_html = `<span class="d-inline-flex product_qty mutted-text align-items-end" >  &nbsp; Billed ${value._billing_period}</span>` ;
                    subscribe_html += trialDaysText;
                }
                
                if (value.recurrence == portal.var_config.product_model.RECURRENCE_CUSTOM) {
                    portal.is_subscription = true;
                    $(portal.htmlCnt + ' #product_list').append(`<div class="product_item recurrent row mb-1 pb-2" data-id="${value.id}" data-price="${value.product_price}" data-default-qty="${value.qty}"><div class="col-8 text-muted"><span class="h4">${value.product_name}</span></div><div class="h4 col-4 text-right">${portal.formatter.format(value.product_price)}</div><div class="d-inline-block product_qty mutted-text" style="padding-left: 15px;" ><div><span class="h5">Custom product detail:</span></div> `);   
                    $.each(JSON.parse(value.custom_date), function (key, value) {     
                      
                        if(moment(value.date).format('MM-DD-YYYY') < mDay){                           
                            custom_count = custom_count+1;
                        }
                        
                        subscribe_html = `<div class="row text-muted"><div class="col-6 text-center"> Charged on ${value.date}</div> <div class="col-6 text-right">${portal.formatter.format(value.amount)} </div></div></div>`;                                                                                         
                        $(portal.htmlCnt + ' #product_list').append(`</div>${subscribe_html}</div>`);                           
                    });
                     $(portal.htmlCnt + ' #product_list').append(`<div class="custom_detail row mb-2 pb-2 border-bottom"></div>`);
                    
                }
                
                if (value.recurrence == portal.var_config.product_model.RECURRENCE_PERIODICALLY) {
                    if (value.start_subscription == 'E') {
                        const startDateVisibility = portal.trial_days && portal.trial_days > 0 ? 'd-none' : 'd-inline-block';
                            
                        $(portal.htmlCnt + ' #product_list').append(`
                    <div class="product_item recurrent row mb-2 pb-2 border-bottom" data-id="${value.id}" data-price="${value.product_price}" data-default-qty="${value.qty}">
                    <div class="col-8 text-muted"><span class="h4">${value.product_name}</span></div>
                    <div class="h4 col-4 text-right">${portal.formatter.format(value.product_price)}</div>
                    <div class="d-inline-block product_qty mutted-text" style="padding-left: 15px;" >Qty ${value.is_editable === '1' ? `<input data-id="${value.id}" class="input_product_qty form-control form-control-sm d-inline-block ml-1" value="${value.qty}" min="1" max="${value.qty}" type="number" style="width: 60px">` : value.qty}</div> ${subscribe_html}   
                    <div class="col-sm-12"></div>
                    <div class="col-9 mutted-text ${startDateVisibility} product_qty pt-2 pb-1" >Start date </div>
                    <div class="col-9 mutted-text ${startDateVisibility} product_qty"><input class = "form-control form-control-sm d-inline-block" id="start-date-${value.id}"  name="start-date-${value.id}" style="width: 100px"  data-provide="datepicker" data-date-format="mm/dd/yyyy" data-date-start-date="0d"> </div>                        
                    </div>`);
                        $("#start-date-" + value.id).val(moment().add(0, 'day').format('MM/DD/YYYY'));
                        $("#start-date-" + value.id).datepicker('update');

                    } else {                        
                        $(portal.htmlCnt + ' #product_list').append(`<div class="product_item recurrent row mb-2 pb-2 border-bottom" data-id="${value.id}" data-price="${value.product_price}" data-default-qty="${value.qty}"><div class="col-8 text-muted"><span class="h4">${value.product_name}</span></div><div class="h4 col-4 text-right">${portal.formatter.format(value.product_price)}</div>
                        <div class="d-inline-block product_qty mutted-text" style="${ portal.hideQty ? 'padding-left: 8px; ' : 'padding-left: 15px; '}" >
                        <span style="${portal.hideQty ? 'display:none' : ''}"> 
                            Qty ${value.is_editable === '1' ? `
                                <input data-id="${value.id}" class="input_product_qty form-control form-control-sm d-inline-block ml-1" value="${value.qty}" min="1" max="${value.qty}" type="number" style="width: 60px">` : 
                                value.qty 
                            }
                        </span>
                        </div>${subscribe_html}</div>`);
                    }

                }
                if (value.recurrence !== portal.var_config.product_model.RECURRENCE_CUSTOM && value.recurrence !== portal.var_config.product_model.RECURRENCE_PERIODICALLY) {
                    $(portal.htmlCnt + ' #product_list').append(`<div class="product_item row mb-2 pb-2 border-bottom" data-id="${value.id}" data-price="${value.product_price}" data-default-qty="${value.qty}"><div class="col-8 text-muted"><span class="h4">${value.product_name}</span></div><div class="h4 col-4 text-right">${portal.formatter.format(value.product_price)}</div><div class="d-inline-block product_qty mutted-text" style="padding-left: 15px;" >Qty ${value.is_editable === '1' ? `<input data-id="${value.id}" class="input_product_qty form-control form-control-sm d-inline-block ml-1" value="${value.qty}" min="1" max="${value.qty}" type="number" style="width: 60px">` : value.qty }</div>${subscribe_html}</div>`);
                }
            
                total_amount += (value.product_price * value.qty);
            });

            $(portal.htmlCnt + ' .total_amount').text(portal.formatter.format(total_amount));

            portal.calculated_total = Math.round(total_amount * 100) / 100; //safe value to 2 decimals

            if(!portal.is_subscription)
                $(portal.htmlCnt + ' .pay_button').text('Pay '+portal.formatter.format(total_amount));
            else
                if (custom_count>0){                    
                    $(portal.htmlCnt + ' .pay_button').text('Subscribe '+portal.formatter.format(total_amount));            
                    $(portal.htmlCnt + ' .pay_button').attr("disabled",true);                       
                    $(portal.htmlCnt + ' #payment_text_custom').append(`</div>${'This payment link has expired'}</div>`);                                               
                }    
                else{               
                    $(portal.htmlCnt + ' .pay_button').text('Subscribe '+portal.formatter.format(total_amount));                   
               }   
        },
        calculateTotal : function () {
            
            let one_time_pr_total_amount = 0; // using these basically for calcultation when fee covered
            let recurrent_totals = [];
            
            let total_amount = 0;
            $.each($('.product_item'),function (key,value) {
                let price = $(value).attr('data-price');
                let qty = $(value).attr('data-default-qty');
                let qty_input = $(value).find('.input_product_qty');
                let is_recurrent = $(value).hasClass('recurrent');
                let product_id = $(value).attr('data-id');
                
                if(qty_input.length){
                    qty = qty_input.val();
                }
                
                total_amount += (price * qty)

                if(is_recurrent) {
                    recurrent_totals.push({
                        'product_id': product_id,
                        'amount' : (price * qty)
                    })
                } else {
                    one_time_pr_total_amount += (price * qty);
                }
            });

            let formatted_total_amount = '';
            if(portal.cover_fee) {
                const tpl = portal.payment_processor.pricing_tpl;

                let kte = 0;
                let percent = 0;

                let paymentMethod = null;
                
                if(portal.payment_option_selected !== null) { //getting data from saved sources
                    const { source_type, src_account_type } = portal.payment_option_selected;
                    paymentMethod = source_type === 'card' ? (src_account_type === 'amex' ? 'cc_amex' : 'cc') : 'ach';                    
                } else {
                    paymentMethod = portal.payment_form_selected; //getting data from new payment method
                }

                if(paymentMethod === 'cc') {
                    kte = tpl.kte_cc;
                    percent = tpl.var_cc;
                } else if(paymentMethod === 'ach') {
                    kte = tpl.kte_bnk;
                    percent = tpl.var_bnk;
                } else if(paymentMethod === 'cc_amex') {
                    kte = tpl.kte_cc_amex;
                    percent = tpl.var_cc_amex;
                } 

                ////////////////////////////////

                // Helper function to round values to 2 decimals
                const roundToTwoDecimals = (value) => Math.round(value * 100) / 100;

                // Calculate one-time payment totals and fee
                let = baseOneTimeTotal = 0;
                let oneTimeFee = 0;
                if(one_time_pr_total_amount > 0) {
                    baseOneTimeTotal = one_time_pr_total_amount;
                    one_time_pr_total_amount = (baseOneTimeTotal + kte) / (1 - percent);
                    oneTimeFee = one_time_pr_total_amount - baseOneTimeTotal;
                }
                portal.calculated_subtotals.one_time_calculated_total = roundToTwoDecimals(one_time_pr_total_amount);
                portal.calculated_subtotals.one_time_calculated_fee = roundToTwoDecimals(oneTimeFee);

                // Calculate recurrent totals and fees
                portal.calculated_subtotals.recurrent_totals = recurrent_totals.map(({ amount, ...rest }) => {
                    const newAmount = roundToTwoDecimals((amount + kte) / (1 - percent));
                    const fee = roundToTwoDecimals(newAmount - amount);
                    return { ...rest, amount, new_amount: newAmount, fee };
                });

                // Calculate total amount and total fee
                const totalRecurrentAmount = portal.calculated_subtotals.recurrent_totals.reduce((sum, { new_amount }) => sum + new_amount, 0);
                const totalRecurrentFee = portal.calculated_subtotals.recurrent_totals.reduce((sum, { fee }) => sum + fee, 0);

                total_amount = totalRecurrentAmount + portal.calculated_subtotals.one_time_calculated_total;
                const total_fee = totalRecurrentFee + portal.calculated_subtotals.one_time_calculated_fee;

                portal.calculated_total = roundToTwoDecimals(total_amount);
                portal.calculated_fee = roundToTwoDecimals(total_fee);

                // Format the totals
                formatted_total_amount = portal.formatter.format(total_amount);
                const formatted_total_fee = portal.formatter.format(total_fee);

                $(portal.htmlCnt + ' #processing_fee').empty();
                $(portal.htmlCnt + ' #processing_fee').append(`
                    <div class="row mt-3 mb-3 border-bottom">
                        <div class="col-8 text-muted">
                            <span class="h4">Processing fee</span>
                        </div>
                        <div class="h4 col-4 text-right">
                        ${formatted_total_fee}
                        </div>
                    </div>`);
            } else {
                formatted_total_amount = portal.formatter.format(total_amount);
                portal.calculated_total = Math.round(total_amount * 100) / 100; //safe value to 2 decimals
                portal.calculated_fee = 0;
            }

            if(!portal.is_subscription) {
                $(portal.htmlCnt + ' .total_amount').text(formatted_total_amount);                
                $(portal.htmlCnt + ' .pay_button').text('Pay '+portal.formatter.format(total_amount));
            }
            else {
                
                if(portal.trial_days !== null) {
                    $(portal.htmlCnt + ' .total_amount').text(portal.formatter.format(one_time_pr_total_amount));
                    $(portal.htmlCnt + ' .pay_button').text('Subscribe');
                } else {
                    $(portal.htmlCnt + ' .pay_button').text('Subscribe '+portal.formatter.format(total_amount));
                    $(portal.htmlCnt + ' .total_amount').text(formatted_total_amount);
                }

            }

            
        },
        generateSecurityCode: async function () {
            let send_data = {};
            send_data['username'] = $(portal.htmlCnt + ' #email').val();
            send_data['org_id'] = portal.payment_link_data.church_id;
            if(parseInt(portal.payment_link_data.campus_id))
                send_data['suborg_id'] = portal.payment_link_data.campus_id;
            await $.ajax({
                url: `${portal.base_api}auth/generate_security_code`, type: "POST",data:JSON.stringify(send_data), dataType: "json",
                error: function (jqXHR, textStatus, errorJson) {
                    //loader('hide');
                    if (typeof jqXHR.responseJSON !== 'undefined' &&
                            typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                        alert(jqXHR.responseJSON.message);
                    } else {
                        alert("error: " + jqXHR.responseText);
                    }
                }
            });
        },
        get_branding_data: async function () {
            await $.get(portal.base_api + 'organization/get_brand_settings/' + portal.payment_link_data.church_id +
                (portal.payment_link_data.campus_id ? '/' + portal.payment_link_data.campus_id : ''), function (result) {
                    if (result.response.data) {
                        if (result.response.data.logo) {
                            $(portal.htmlCnt + ' #logo').attr('src', result.response.data.entire_logo_url);
                            $(portal.htmlCnt + ' #logo').show();
                        } else {
                            $(portal.htmlCnt + ' #logo').hide();
                        }
                        let theme_color = result.response.data.theme_color ? result.response.data.theme_color : '#000000';
                        let text_theme_color = helpers.getTextColor(theme_color);
                        portal.theme = { theme_color, text_theme_color };

                        let style = `
                    .theme_color{
                        background: ${theme_color} !important;
                    }.theme_foreground_color{
                        color: ${theme_color} !important;
                    }
                    .text_theme_color{
                        color: ${text_theme_color} !important;
                    }
                    .background_color{
                        background: ${result.response.data.button_text_color ? result.response.data.button_text_color : '#F8F8F8'} !important;
                    }
                `;
                        $('#css_branding').html(style);
                    }
                });
        },
        adjustPaymentMethodAndNotify : (newMethod, message) => {
            const oldTotalAmount = $(portal.htmlCnt + ' .total_amount').html();            
            
            $(portal.htmlCnt + ` .payment-selector .option-container[type="${newMethod}"]`).click(); //it calls to portal.fts_init();
            portal.calculateTotal();
            const newTotalAmount = $(portal.htmlCnt + ' .total_amount').html();
            
            info_message_custom_html(`
                <div style="text-align:justify">
                    ${message}
                    <br><br>
                    The previous amount was <strong>${oldTotalAmount}</strong>, the new amount is <strong>${newTotalAmount}</strong>.
                    <br><br>
                    Please re-enter your payment information.
                </div>
            `);
        },
        elementsEventsSet: false,
        fts_init: async function () {    
            document.getElementById('fts-payment-options').style.display = 'block';
            document.getElementById('fts-payment-options').innerHTML = 'Loading <i class="fas fa-circle-notch fa-spin"></i>'
            $(portal.htmlCnt + ' .payment-form').show();
            
            const ftsWrapper = document.getElementById('fts-wrapper')            
            const payButton = document.getElementById('pay-button-fts');
        
            payButton.disabled = false;

            //const saveCardWrapper = document.getElementById('save_card_container-fts');

            payButton.style.display = 'none';
            //saveCardWrapper.style.display = 'none';

            const saveSource = $(portal.htmlCnt + ' .save_data').is(':checked');
            const paymentMethod = portal.payment_form_selected;

            portal.calculateTotal(); //reset the paybutton text
            
            const org_id = portal.payment_link_data.church_id;

            if(portal.is_subscription) {
                ftsWrapper.style.height = '275px';
            }
                
            try {
                
                let intentionData = null;
                if ((paymentMethod === 'cc' || paymentMethod === 'cc_amex') && !portal.is_subscription) {
                    //one time payment and cards selected: we always use the ticket intention flow to determine the bin of the card
                    const ticketIntention = await fetch(portal.base_api + 'pay/create_fortis_ticket_intention/' + org_id, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });

                    intentionData = await ticketIntention.json()
                } else {

                    let transactionData = null;

                    if (portal.is_subscription) { //if subscription always tokenize for all payment methods, we can get the bin here.
                        transactionData = {
                            action: 'tokenization',
                            payment_method: paymentMethod
                        };                        
                    } else if(paymentMethod === 'ach') { //if not a subscription, this is clearly an ach transaction, it create a transaction intention with saving or not the source
                        transactionData = {
                            action: 'sale',
                            amount: portal.calculated_total,
                            save_source: saveSource,
                            payment_method: paymentMethod
                        };
                    } else {
                        throw new Error('Invalid flow');
                    }

                    const transactionIntention = await fetch(portal.base_api + 'pay/create_fortis_transaction_intention/' + org_id, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(transactionData)
                    });

                    intentionData = await transactionIntention.json()
                }

                if (intentionData.error === 1) {
                    document.getElementById('fts-payment-options').innerHTML = 'Payment gateway not ready';
                    alert('Payment gateway not ready: ' + intentionData.response.message);
                    throw new Error(intentionData.response.message);
                }

                const token = intentionData.response.result.client_token

                elements = new Commerce.elements(token);
                
                setTimeout(() => {
                    payButton.style.display = 'block';
                    //saveCardWrapper.style.display = 'block';
                }, 1000);

                if (!portal.elementsEventsSet) {
                    portal.elementsEventsSet = true;

                    elements.on('validationError', function (event) {
                        console.log('validationError')
                        ftsWrapper.style.height = 'auto';
                        payButton.disabled = false;
                        portal.calculateTotal(); //reset the paybutton text                    
                    });

                    elements.on('error', function (event) {
                        console.log('error')
                        ftsWrapper.style.height = 'auto';
                        payButton.disabled = false;
                        portal.calculateTotal(); //reset the paybutton text                    
                    });

                    const submitHandler = async function (e) {
                        e.preventDefault();                        
                        const email_value = $(portal.htmlCnt + ' #email').val();
                        let email_validation =  String(email_value).toLowerCase().match(portal.email_regexp);
                        if (!email_validation) {
                            notify({'title': 'Notification', 'message': 'Please enter a valid email address'});
                            return false;
                        }
                        payButton.disabled = true;
                        portal.pay_button_clicked = true;
                        payButton.innerHTML = 'Processing <i class="fa fa-spinner fa-pulse text-light"></i>';

                        if (!portal.is_subscription) {
                            if ($(portal.htmlCnt + ' .save_data').is(':checked')) { //one time payment and saved source
                                // If saving data, ensure the user is logged in before submitting.
                                // If there is no valid session, await portal.is_logged(); will redirect to the login view.
                                await portal.is_logged();
                                if (portal.user_logged !== null) {
                                    elements.submit();
                                }
                            } else { //one time payment and not saved source, it just submits
                                elements.submit();
                            }                            
                        } else if(portal.is_subscription){//if subscription no matter if saved or not, it just submits
                            //test this further later
                            elements.submit();
                        } else { //
                            payButton.disabled = false;
                            portal.pay_button_clicked = false;
                            payButton.innerHTML = 'An error ocurred';
                        }
                    };
                    
                    elements.on('ready', function () {

                        payButton.removeEventListener('click', submitHandler);
                        payButton.addEventListener('click', submitHandler);
                    });

                    elements.on('submitted', function (event) {
                        console.log('fts-submitted')
                    });

                    elements.on('eventName', function(event){
                        //Event received
                        console.log(event); //{ "@type": "eventName", "data": {} }
                      });

                    elements.on('done', async function (e) {
                        
                        const action = e?.data?.['@action'] ?? null;
                        
                        if (!action) {
                            alert('An error ocurred after processing the payment | done event');
                            return false;
                        } 

                        const payment_method = e?.data?.payment_method ?? null;
                        
                        let bin = null
                        if (action === 'ticket' || (action === 'tokenization' && payment_method === 'cc')) { //when tokenization the payment_method param will be there cc
                            bin = e.data.first_six;
                            const paymentMethod = portal.payment_form_selected;
                            const isAmex = bin.startsWith('34') || bin.startsWith('37');
                            
                            if (isAmex && paymentMethod !== 'cc_amex') {
                                portal.adjustPaymentMethodAndNotify('cc_amex',  //switch to amex
                                    'An American Express card number has been provided, but a different payment method was selected. The total amount has been adjusted automatically to reflect the correct fees.');
                                return;
                            } else if (!isAmex && paymentMethod === 'cc_amex') {
                                portal.adjustPaymentMethodAndNotify('cc', //switch to a standard card
                                    'An American Express payment method was selected, but a different card brand was used. The total amount has been adjusted automatically to reflect the correct fees.');
                                return;
                            }
                        }

                        portal.payment_option = e.data.payment_method === 'cc' ? 'cc' : 'bank';                       
                        
                        payButton.disabled = true;                        
                        
                        $(portal.htmlCnt + ' .payment-form').hide();
                        $(portal.htmlCnt + ' #fts-after-payment-loader').show();                        

                        let send_data = {};
                        var form = $(portal.htmlCnt + ' #fts_form');
                        var data = form.serializeArray();
                        $.each(data, function () {
                            send_data[this.name] = this.value;
                        });

                        send_data['username'] = $(portal.htmlCnt + ' #email').val();
                        send_data['products'] = [];

                        let header = "Bearer ";
                        try {
                            if (localStorage && localStorage.getItem(auth_access_tk_var)) {
                                header += localStorage.getItem(auth_access_tk_var);
                            }
                        } catch (e) { }
                        
                        loader('show');
                        await portal.pay(send_data, header, e);
                        loader('hide');
                        payButton.disabled = false;                        
                        $(portal.htmlCnt + ' #fts-after-payment-loader').hide();

                    });
                }

                elements.create({
                    container: '#fts-payment-options',
                    environment: portal.options.environment === 'LIVE' ? 'production' : 'sandbox',
                    theme: 'default',
                    hideTotal: true,
                    showReceipt: false,
                    showValidationAnimation: true,
                    showSubmitButton: false,
                    floatingLabels: false,
                    appearance: {
                        colorButtonSelectedBackground: portal.theme.theme_color,
                        colorButtonText: portal.theme.text_theme_color,
                        colorButtonBackground: '#9b9b9b',
                        fontSize: '0.82em',
                    },
                });

            } catch (error) {
                alert(error.message);
            }
        },

        payment_processor_init: async function () {
            if (portal.payment_processor.code === 'FTS') {                 

                portal.fts_init();

            } else if (portal.payment_processor.code === 'PSF') {
                paysafe.fields.setup(portal.apiKey, portal.options, function (instance, error) {
                    $(portal.htmlCnt + ' #pay_cc').click(function () {
                        loader('show');
                        portal.pay_button_clicked = true;
                        instance.tokenize(async function (instance, error, result) {
                            if (error) {
                                // display the tokenization error in dialog window                            
                                $(portal.htmlCnt + ' #card_information .alert-validation').text(error.displayMessage);
                                loader('hide');
                            } else {
                                let send_data = {};
                                var form = $(portal.htmlCnt + ' #cc_form');
                                var data = form.serializeArray();
                                $.each(data, function () {
                                    send_data[this.name] = this.value;
                                });
                                send_data['data_payment'] = { 'single_use_token': result.token, 'postal_code': $(portal.htmlCnt + ' #cardZip').val() };
                                send_data['username'] = $(portal.htmlCnt + ' #email').val();
                                send_data['data_payment']['first_name'] = $(portal.htmlCnt + ' #holder_name').val();
                                send_data['payment_method'] = 'credit_card';
                                send_data['products'] = [];
                                portal.payment_option = 'cc';

                                let header = "Bearer ";
                                try {
                                    if (localStorage && localStorage.getItem(auth_access_tk_var)) {
                                        header += localStorage.getItem(auth_access_tk_var);
                                    }
                                } catch (e) { }

                                await portal.pay(send_data, header);
                                loader('hide');
                            }
                        });
                    });
                });
            }
        }, // CC Payment
        bank_payment: async function (){ //Bank Payment
            let send_data = {};
            send_data['data_payment'] = {};
            var form = $(portal.htmlCnt + ' #ach_bank_form');
            send_data['data_payment']['bank_type'] = 'ach';
            if(portal.payment_link_data.organization.region === 'CA'){
                form = $(portal.htmlCnt + ' #eft_bank_form');
                send_data['data_payment']['bank_type'] = 'eft';
            }
            var data = form.serializeArray();

            $.each(data, function () {
                send_data['data_payment'][this.name] = this.value;
            });
            send_data['username'] = $(portal.htmlCnt + ' #email').val();
            send_data['payment_method'] = 'bank_account';
            portal.payment_option = 'bank';

            let header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_access_tk_var)){
                    header += localStorage.getItem(auth_access_tk_var);
                }
            } catch (e) {}

            await portal.pay(send_data,header);
            loader('hide');
        }, //Bank Payment
        wallet_payment: async function (){ //Wallet Payment
            let send_data = {};

            send_data['username'] = $(portal.htmlCnt + ' #email').val();
            portal.payment_option = 'wallet';
            send_data['data_payment'] = {};
            send_data['data_payment']['wallet_id'] = portal.payment_option_selected.id;

            let header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_access_tk_var)){
                    header += localStorage.getItem(auth_access_tk_var);
                }
            } catch (e) {}

            await portal.pay(send_data,header);
            loader('hide');
        },
        pay: async function (send_data, header = null, fts_event = null) {
            try {
                $(portal.htmlCnt + ' .alert-validation').text('');
                if (await portal.checkSubscriptionFunctionality(send_data, header, fts_event)) { // This happens when user try to subscribe as Anonymous (Login is required)
                    return;
                }
                send_data['trial_days'] = portal.trial_days;
                send_data['products'] = [];
                $.each($(portal.htmlCnt + ' #product_list .product_item'), function (key, value) {
                    let link_product_id = $(value).attr('data-id');
                    let qty = $(value).attr('data-default-qty');
                    let qty_input = $(value).find('.input_product_qty');

                    if (qty_input.length) {
                        qty = qty_input.val();
                    }

                    let product_data = {
                        link_product_id: link_product_id,
                        qty: qty
                    };

                    // Only include start_date_input if trial_days is set and > 0
                    if (!portal.trial_days) {
                        let start_date_input = $("#start-date-" + link_product_id).val();
                        product_data.start_date_input = start_date_input;
                    }

                    send_data['products'].push(product_data);
                });

                if (portal.payment_processor.code === 'FTS') {
                    send_data['payment_processor'] = 'FTS';
                    send_data['fts_event'] = fts_event;

                    send_data['payment_method_selected'] = portal.payment_form_selected;
                    
                    if(!portal.is_subscription) {
                       send_data['save_source'] = $(portal.htmlCnt + ' .save_data').is(':checked') ? '1' : '0';
                    }

                    //send_data['cover_fee'] = portal.cover_fee; cover fee is evaluated in backend as it depends on paymentlink obj
                }   

                await $.ajax({
                    url: `${portal.base_api}pay/payment_link/` + portal.view_config.payment_link.hash, headers: { 'Authorization': header }, type: "POST", data: JSON.stringify(send_data), dataType: "json",
                    success: function (data) {
                        if (data.response.status) {

                            const matchCustomerHubCart = portal.areProductsInCustomerHubCart(data.response.payment_link.products);

                            if (matchCustomerHubCart) {
                                console.info('matchCustomerPortalCart', matchCustomerHubCart);
                                localStorage.removeItem(portal.customerHubCartKey); //clear local storage from customer-hub app
                            } else {
                                console.info('matchCustomerPortalCart', matchCustomerHubCart);
                            }
                            
                            portal.payment_link_data = data.response.payment_link;
                            $(portal.htmlCnt + ' .payment-form').hide();
                            
                            let error = false;

                            $(portal.htmlCnt + ' #product_list .product_item input').replaceWith(function () {
                                return `<span>${$(this).val()}</span>`;
                            });

                            $.each(data.response.payment_link.products, function (key, value) {
                                if (value.digital_content) {
                                    $(portal.htmlCnt + ` #product_list .product_item[data-id="${value.id}"]`).append(`<a class="col-12 digital_content" href="${value.digital_content_url}">Download Deliverable</a>`);
                                }
                            });
                            $(portal.htmlCnt + ' #download_receipt').empty();
                            $(portal.htmlCnt + ' #download_receipt').append(`<a class="text-muted mt-2 mb-1" href="${portal.customerHubUrl}">Manage billing <i class="fas fa-chevron-right"></i></a>`);
                           
                            if (data.response.payment_link.payments.length == 1) {
                                if(data.response.payment_link.payments[0].status === 'P'){ 
                                    $(portal.htmlCnt + ' #download_receipt').
                                        append(`<a class="text-muted mt-2" href="${data.response.payment_link.payments[0]._receipt_file_url}">Download Receipt <i class="fas fa-arrow-down"></i></a>`);
                                } else {
                                    error = true;
                                }
                            } else if (data.response.payment_link.payments.length > 1) {
                                let download_receipt = '';
                                let subscription_receipt = '';
                                $.each(data.response.payment_link.payments, function (key, value) {
                                    let link_name = 'Download Receipt';
                                    if (value.status === 'P') {
                                        if (value.customer_subscription_id) {
                                            $.each(data.response.payment_link.products_paid.data, function (key_prd, value_prd) {
                                                if (value_prd.transaction_id === value.id) {
                                                    link_name = 'Download ' + value_prd.product_name + ' Receipt';
                                                }
                                            });
                                            subscription_receipt += `<a class="text-muted mt-2" href="${value._receipt_file_url}">${link_name} <i class="fas fa-arrow-down"></i></a>`;

                                        } else {
                                            download_receipt += `<a class="text-muted mt-2" href="${value._receipt_file_url}">${link_name} <i class="fas fa-arrow-down"></i></a>`;
                                        }
                                    } else {
                                        error = true;
                                    }
                                });

                                $(portal.htmlCnt + ' #download_receipt').append(download_receipt);
                                $(portal.htmlCnt + ' #download_receipt').append('<h5 class="text-muted mt-4 mb-0 font-weight-bold">Subscriptions:</h5>');
                                $(portal.htmlCnt + ' #download_receipt').append(subscription_receipt);
                            }

                            if(!error) {
                                if (portal.is_subscription) {
                                    $(portal.htmlCnt + ' #payment_text').text('Thanks for your Subscription');
                                }
                            } else {
                                $(portal.htmlCnt + ' #payment_text').text('');
                                const subscriptions = data.response.subscriptions
                                if (subscriptions.length > 0) {
                                    subscriptions.forEach((s) => {
                                        if (s.payment_info.payment_done === false) {
                                            const pResults = s.payment_info.payment_response.pResults;
                                            pResults.forEach((p) => {
                                                if (p.status === false) {
                                                    $(portal.htmlCnt + ' #download_receipt').append(`
                                                        <p class="py-2 m-0 text-muted text-sm">
                                                            ${p.message} (Trxn ID: ${p.trxn_id})
                                                        </p>
                                                    `);

                                                }
                                            }
                                            );

                                        }
                                    });
                                }
                            }

                             // Add post purchase link countdown redirect if enabled
                             const postPurchaseLink = portal.getPostPurchaseLink();
                             if (postPurchaseLink) {
                                 let countdown = 5;
                                 
                                 // Truncate URL if too long for UI
                                 const maxUrlLength = 50;
                                 const displayUrl = postPurchaseLink.length > maxUrlLength 
                                     ? postPurchaseLink.substring(0, maxUrlLength) + '...'
                                     : postPurchaseLink;
                                 
                                 $(portal.htmlCnt + ' #download_receipt').append(`
                                     <div class="text-muted text-center mt-4 mb-3" id="post-purchase-countdown">
                                         <div>You will be redirected to <span class="text-primary font-weight-bold">${displayUrl}</span> in <span id="countdown-number">${countdown}</span> seconds.</div>
                                         <div class="mt-2">
                                             If you prefer to proceed immediately, <a href="${postPurchaseLink}" class="text-primary font-weight-bold">click here</a>.
                                         </div>
                                     </div>
                                 `);
                                 
                                 const countdownInterval = setInterval(() => {
                                     countdown--;
                                     $(portal.htmlCnt + ' #countdown-number').text(countdown);
                                     
                                     if (countdown <= 0) {
                                         clearInterval(countdownInterval);
                                         window.location.href = postPurchaseLink;
                                         $(portal.htmlCnt + ' #post-purchase-countdown').html(`
                                             <div class="mt-3">Redirecting to <span class="text-primary">${displayUrl}</span>...</div>
                                         `);
                                     }
                                 }, 1000);
                             }
                            

                            $(portal.htmlCnt + ' #payment_done').css("display", "flex").hide().fadeIn();
                        } else {
                            if (portal.payment_processor.code === 'FTS') {
                                $(portal.htmlCnt + ' .payment-form').show();
                                portal.fts_init();
                                $(portal.htmlCnt + ' .alert-validation').text(data.response.errors.join("\n"));                                
                            } else {
                                if (portal.payment_option === 'cc') {
                                    $(portal.htmlCnt + ' #card_information .alert-validation').text(data.response.errors.join("\n"));
                                    if (portal.is_subscription) {
                                        $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(data.response.errors.join("\n"));
                                    }
                                } else if (portal.payment_option === 'bank') {
                                    $(portal.htmlCnt + ' #bank_information .alert-validation').text(data.response.errors.join("\n"));

                                } else {
                                    $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(data.response.errors.join("\n"));
                                }
                            }
                        }
                    },
                    error: async function (jqXHR, textStatus, errorJson) {
                        if (header) {
                            try {
                                let json = jqXHR.responseJSON;                                                                
                                if (json.response && (json.response.errors === 'access_token_not_found' || json.response.errors === 'access_token_expired')) {
                                    await portal.refresh_token();
                                    if (portal.is_refreshed_token) {
                                        portal.is_refreshed_token = false;

                                        let header = "Bearer ";            
                                        if(localStorage && localStorage.getItem(auth_access_tk_var)){
                                            header += localStorage.getItem(auth_access_tk_var);
                                        }
                                        loader('show');
                                        await portal.pay(send_data, header, fts_event);
                                        loader('hide');
                                    }
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        } else {
                            if (portal.payment_processor.code === 'FTS') {                                
                                $(portal.htmlCnt + ' .payment-form').show();
                                portal.fts_init();
                                if (typeof jqXHR.responseJSON !== 'undefined' && typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                    $(portal.htmlCnt + ' .alert-validation').text(jqXHR.responseJSON.errors.join("\n"));
                                } else {
                                    $(portal.htmlCnt + ' .alert-validation').text(qXHR.responseText.join("\n"));
                                }
                            } else {
                                if (typeof jqXHR.responseJSON !== 'undefined' &&
                                    typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                    if (portal.payment_option === 'cc') {
                                        $(portal.htmlCnt + ' #card_information .alert-validation').text(jqXHR.responseJSON.errors.join("\n"));
                                        if (portal.is_subscription) {
                                            $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(jqXHR.responseJSON.errors.join("\n"));
                                        }
                                    } else if (portal.payment_option === 'bank') {
                                        $(portal.htmlCnt + ' #bank_information .alert-validation').text(jqXHR.responseJSON.errors.join("\n"));
                                    } else {
                                        $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(jqXHR.responseJSON.errors.join("\n"));
                                    }
                                } else {
                                    if (portal.payment_option === 'cc') {
                                        $(portal.htmlCnt + ' #card_information .alert-validation').text(jqXHR.responseText.join("\n"));
                                        if (portal.is_subscription) {
                                            $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(jqXHR.responseText.join("\n"));
                                        }
                                    } else if (portal.payment_option === 'bank') {
                                        $(portal.htmlCnt + ' #bank_information .alert-validation').text(jqXHR.responseText.join("\n"));
                                    } else {
                                        $(portal.htmlCnt + ' .payment_selected_container .alert-validation').text(jqXHR.responseText.join("\n"));
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.log(e);
            }
        },
        cancel_subscription: async function(subscription_id){
            let header = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_access_tk_var)){
                    header += localStorage.getItem(auth_access_tk_var);
                }
            } catch (e) {}
            let send_data = {};
            send_data['subscription_id'] = subscription_id;

            await $.ajax({
                url: `${portal.base_api}subscription/cancel`, type: "POST", data: JSON.stringify(send_data) , dataType: "json", headers: {'Authorization': header},
                success: async function (data) {
                    if(data.response.status){
                        await portal.get_user();
                        notify({'title': 'Notification', 'message': 'Subscription Canceled'});
                    }
                },
                error: async function (jqXHR, textStatus, errorJson) {
                    try {
                        let json = jqXHR.responseJSON;
                        if(json.response && (json.response.errors === 'access_token_not_found' || json.response.errors === 'access_token_expired')){
                            await portal.refresh_token();
                            if(portal.is_refreshed_token) {
                                portal.is_refreshed_token = false;
                                await portal.cancel_subscription(subscription_id);
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        },
        is_logged: async function (options) {
            let header = "Bearer ";
            let tkn = null;
            portal.user_logged = null;
        
            try {
                if (localStorage && localStorage.getItem(auth_access_tk_var)) {
                    tkn = localStorage.getItem(auth_access_tk_var);
                    header += tkn;
                }
            } catch (e) {}
        
            if (tkn === null) {
                return;
            }
        
            let send_data = { org_id: portal.payment_link_data.church_id };
            if (parseInt(portal.payment_link_data.campus_id)) {
                send_data.suborg_id = portal.payment_link_data.campus_id;
            }
        
            try {
                const data = await $.ajax({
                    url: `${portal.base_api}auth/is_logged`,
                    type: "POST",
                    data: JSON.stringify(send_data),
                    dataType: "json",
                    headers: { Authorization: header }
                });
        
                if (data.response.status) {
                    portal.user_logged = data.response.data.email;
                }
            } catch (jqXHR) {
                try {
                    let json = jqXHR.responseJSON;
                    if (json.response && (json.response.errors === 'access_token_not_found' || json.response.errors === 'access_token_expired')) {
                        await portal.refresh_token(options);
                        if (portal.is_refreshed_token) {
                            portal.is_refreshed_token = false;
                            await portal.is_logged(options); // Retry after token refresh
                            if (portal.user_logged) {
                                await portal.get_user();
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error handling in fail:", e);
                }
            }
        },
        notifySessionExpired: function () {
            notify({
                'title': 'Session Expired',
                'message': 'Your session has ended. The app will refresh automatically in a moment.'
            });
            setTimeout(function () {
                // location.reload(true);
            }, 4000);
        },
        refresh_token: async function(options){            
            let header_refresh = "Bearer ";
            try {
                if(localStorage && localStorage.getItem(auth_refresh_tk_var)){
                    header_refresh += localStorage.getItem(auth_refresh_tk_var);
                }
            } catch (e) {}
            await $.ajax({
                type: "POST",
                url: `${portal.base_api}auth/refresh_token`,
                headers: {'Authorization': header_refresh},
                dataType: 'json',
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(function (data, status) {                                
                if(data.response.status == true){
                    if(data.response[auth_obj_var]){
                        try {
                            localStorage.setItem(auth_access_tk_var, data.response[auth_obj_var][auth_access_tk_var]);
                            localStorage.setItem(auth_refresh_tk_var, data.response[auth_obj_var][auth_refresh_tk_var]);
                            portal.is_refreshed_token = true;
                        } catch (e) {}
                    }
                } 
            }).fail(async function (jqXHR, textStatus, errorJson) {                                
                try {
                    if(localStorage){                        
                        localStorage.removeItem(auth_access_tk_var);
                        localStorage.removeItem(auth_refresh_tk_var);
                    }
                } catch (e) {}
                const rjson = jqXHR.responseJSON;                       
                if (rjson.error === 1 && ['refresh_token_expired', 'refresh_token_not_found', 'bad_request'].includes(rjson.response.code)) {
                    if (options && options.notifySessionExpired === false) {
                        //Do not notify
                    } else {
                        portal.notifySessionExpired(); //if not defined, notify and reload
                    }
                }                
            });
        },
        sub_send_data:null,
        sub_header:null,
        sub_fts_event:null,
        checkSubscriptionFunctionality: async function(send_data, header, fts_event){
            if(portal.is_subscription){
                if(!portal.user_logged){
                    if(!portal.user_exist){
                        portal.registering = true;
                    }
                    loader('show');
                    await portal.generateSecurityCode();
                    $(portal.htmlCnt + ' #sign-in-modal').modal('show'); //verifyx check if we can group thres four lines of code in a function
                    loader('hide');                    

                    portal.sub_send_data = send_data;
                    portal.sub_header = header;
                    portal.sub_fts_event = fts_event;
                    return true;
                }
            }
            return false;
        },
        resolveSubscriptionIfNeccesary: async function(){            
            if(portal.is_subscription && portal.pay_button_clicked){
                portal.pay_button_clicked = false;
                if(portal.payment_processor.code === 'FTS') {                                        
                    setTimeout(function () { $(portal.htmlCnt + ' #sign-in-modal').modal('hide'); }, 1000); //in this case close the modal inmediately                    
                    loader('show');
                    await portal.pay(portal.sub_send_data, portal.sub_header, portal.sub_fts_event);
                    loader('hide');
                    portal.sub_send_data = null;
                    portal.sub_header = null;
                    portal.sub_fts_event = null;
                } else {
                    if (portal.payment_option === 'cc') {
                        $(portal.htmlCnt + ' #pay_cc').click();
                    } else if (portal.payment_option === 'bank') {
                        $(portal.htmlCnt + ' #pay_bank').click();
                    } else {
                        $(portal.htmlCnt + ' #pay_wallet').click();
                    }
                }
            }
        }
    };
    let states_us = {
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
}());