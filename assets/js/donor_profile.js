(function () {

    const org_id = _global_objects.currnt_org.orgnx_id;
    $(document).ready(function () {

        donors_profile.setdonorsprofile_form();
        _global_objects.myprofileview = true;
        donations.setdonations_dt();
        payment_methods_handler.start();

    });

    const payment_methods_handler = {
        elementsEventsSet: false,
        start: function () {
            $(document).on('click', '#openSourceModalBtn', function (e) {
                e.preventDefault();
                loader('show');
                payment_methods_handler.initProcessor();
            });

            $(document).on('click', '.removeSourceBtn', function (e) {
                e.preventDefault();
                const sourceId = $(this).attr('data-source-id');
                delete_question('payment method').then(function (result) {
                    if (result.value) {
                        payment_methods_handler.removeSource(sourceId);        
                    }                    
                });                
            });          
        },
        removeSource: async function (sourceId) {
            try {
                loader('show');
                const csrfToken = $('#addDonorDourceForm').find('input[name="csrf_token"]').val();
                const customer_id = $('#addDonorDourceForm').find('input[name="customer_id"]').val();            

                const removeSource = await fetch(base_url + 'payment_method/remove', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        source_id: sourceId,
                        org_id: org_id,
                        customer_id: customer_id,
                        csrf_token: csrfToken
                    })
                });

                const response = await removeSource.json();
                
                if(response.status === false) {
                    error_message(response.errors);
                } else {
                    success_message_callback(response.message, function () {
                        window.location.reload();
                    });
                }
            } catch (error) {
                console.log(error);
            }
            loader('hide');
        },
        createSource: async function (e) {
            try {
                
                const csrfToken = $('#addDonorDourceForm').find('input[name="csrf_token"]').val();
                const customer_id = $('#addDonorDourceForm').find('input[name="customer_id"]').val();            

                const data = {
                    fts_event:e,
                    org_id:org_id,
                    customer_id:customer_id,
                    csrf_token: csrfToken
                };

                const createSource = await fetch(base_url + 'payment_method/create', {
                    method: 'POST',                    
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const response = await createSource.json();
                
                if(response.status === false) {
                    error_message(response.errors);
                } else {
                    success_message_callback(response.message, function () {
                        window.location.reload();
                    });
                }
                
                $('#addSourceModal').modal('hide');
                

            } catch (error) {
                console.error('Error in done event:', error);
            }
        },
        initProcessor: async function () {
            const setDefaults = async function (loading, payButton) {
                if (loading) {
                    payButton.disabled = true;
                    payButton.innerHTML = payButton.getAttribute('data-processing-label');
                } else {
                    payButton.disabled = false;
                    payButton.innerHTML = payButton.getAttribute('data-original-label');                    
                }
            }

            try {
                const transactionData = {
                    action: 'tokenization',
                    payment_method: 'cc',
                };
                const transactionIntention = await fetch(base_url + 'customer/apiv1/pay/create_fortis_transaction_intention/' + org_id, {
                    method: 'POST',                    
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'

                    },
                    body: JSON.stringify(transactionData)
                });

                $('#addSourceModal').modal('show');
                
                setTimeout(() => {
                    loader('hide');
                }, 3000); // Wait for 3 seconds - fts needs time to finally load

                const intentionData = await transactionIntention.json();

                if (intentionData.error === 1) {
                    //document.getElementById('fts-payment-options').innerHTML = 'Payment gateway not ready';
                    alert('Payment gateway not ready: ' + intentionData.response.message);
                    throw new Error(intentionData.response.message);
                }

                const token = intentionData.response.result.client_token
                
                elements = new Commerce.elements(token); //const verifyx ?

                const payButton = document.getElementById('createSourceBtn');

                if (!payment_methods_handler.elementsEventsSet) {
                    payment_methods_handler.elementsEventsSet = true;

                    const submitHandler = async function (e) {
                        e.preventDefault();                        
                        setDefaults(true, payButton);
                        elements.submit();
                        
                    };                    
                    elements.on('ready', function () {
                        payButton.removeEventListener('click', submitHandler);
                        payButton.addEventListener('click', submitHandler);
                    });
                    elements.on('submitted', function (event) { console.log('fts-submitted'); });
                    elements.on('eventName', function (event) { console.log(event); });                    
                    elements.on('validationError', function (event) {
                        console.error('Validation Error:', event);
                        setDefaults(false, payButton);
                    });
                    elements.on('error', function (event) { 
                        console.error('Error:', event);
                        setDefaults(false, payButton);
                    });

                    elements.on('done', async function (e) {
                        setDefaults(false, payButton);
                        payment_methods_handler.createSource(e);
                    });
                }

                elements.create({
                    container: '#fts-payment-options',
                    environment: environment === 'prd' ? 'production' : 'sandbox',
                    theme: 'default',
                    hideTotal: true,
                    showReceipt: false,
                    showValidationAnimation: true,
                    showSubmitButton: false,
                    //floatingLabels: false,
                    appearance: {
                        colorButtonSelectedBackground: '#000000',
                        colorButtonSelectedText: '#ffffff',
                        colorButtonActionBackground: '#000000',
                        colorButtonActionText: '#ffffff',
                        colorButtonBackground: '#000000',
                        colorButtonText: '#ffffff',
                        fontSize: '0.82em',
                    },
                });


            } catch (error) {
                alert(error.message);
            }
        }
    }

    var donors_profile = {
        setdonorsprofile_form: async function () {
            
            await $.getJSON( base_url+"assets/js/countrys/countrys.json?v=4", function( data ) {
                $.each(data,function (key,value) {
                    let selected = value.code === 'US' ? 'selected' : '';
                    $('#input-phone-code').append('<option data-phone="'+value.dial_code+'" '+selected+' value="'+value.code+'">'+value.code+' (+'+value.dial_code+')</option>');

                });
            });
            
            $('#input-phone-code').change(function () {
                $phone_code = $('#input-phone-code :selected').data('phone');
                $('#input-country-code-phone').val($phone_code);
                $country_code = $('#input-phone-code').val();
                $('#img_country').attr('src',base_url+'assets/images/countrys/'+$country_code.toLowerCase()+'.svg')
            });

            $phone_code = $('#input-phone-code').data('saved');
            if($phone_code !== ''){
                $('#input-phone-code').val($phone_code);
            }
            $('#input-phone-code').trigger('change');

            //Mask Profile Phone
            //Profile Phone
            if (document.querySelector('#input-phone')) {
                IMask(
                    document.querySelector('#input-phone'),
                    {
                        mask: '000000000000000',
                    });
            }

            //==== save profile
            $('#add_donor_profile_form .btn-save').on('click', function () {
                var btn = helpers.btn_disable(this);
                $('#add_donor_profile_form').find('.alert-validation').first().empty().hide();
                var data = $("#add_donor_profile_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                save_data['id'] = $('#add_donor_profile_form').data('id');
                $.ajax({
                    url: base_url + 'donors/save_profile', type: "POST",
                    dataType: "json",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            success_message(data.message)
                        } else {
                            $('#add_donor_profile_form').find('.alert-validation').first().empty().html(data.message).fadeIn("slow");
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

    var donations = {
        newDonorsChart: null,
        setdonations_dt: function () {
            if (_global_objects.fund_id) { //load datatable with a fund by default                                
                donations.setFundOnFilter(_global_objects.fund_id);
            }
            //alert($('#add_donor_profile_form').data('id'));
            Chart.defaults.global.defaultColor = '#1468fa';
            var tableId = "#donations_datatable";
            this.donations_dt = $(tableId).DataTable({
                "dom": '<"row row_filter"<"col-md-9 col-sm-12 filter-1"><"col-md-3 col-sm-12 search"f>><"row"<"col-sm-12 filter-2">>rt<"row"<"col-sm-4"l><"col-sm-6"i><"col-sm-2"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "donors/get_donations_dt_customer", type: "POST",
                    "data": function (d) {                    
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.suborganization_id =_global_objects.currnt_org.sorgnx_id;
                        d.customer_id = $('#add_donor_profile_form').data('id');
                    }
                },
                "rowCallback": function (row, data, index) {
                    $(row).attr('title', data.transaction_detail ? data.transaction_detail : 'No details found for transaction #' + data.id);
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },

                columns: [
                    {data: "id", className: "text-center", searchable: true},
                    {data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {                            
                            var stop_subscription = "";
                            if (full.subscription != null && full.subscription > 0 && full.substatus == 'A') {
                                stop_subscription = `<a class="avoidTrClick stop_subscription dropdown-item"  data-id="` + full.subscription + `" href="#">
                                            <i class="fas fa-ban"></i>
                                            <span class="avoidTrClick" >Stop Subscription</span>
                                        </a>`;
                            }

                            var refund = '';
                            if (full.trx_type == 'Donation' && full.trx_ret_id == null && full.status == 'P') {
                                refund = `<a class="avoidTrClick refund_transaction dropdown-item" data-id="` + data + `" href="#">
                                            <i class="avoidTrClick fas fa-reply"></i>
                                            <span class="avoidTrClick" >Refund</span>
                                        </a>`;
                            }

                            let toggle_psf_status = '';
                            if (full.trx_type == 'Donation' && full.trx_ret_id == null && full.method == 'Bank' && _current_payment_processor == 'FTS') {
                                let toggle_status_text = full.status == 'P' ? 'Mark as Failed' : 'Set as Success';
                                toggle_psf_status = `<a class="avoidTrClick toggle_psf_status dropdown-item" data-id="` + data + `" href="#">
                                            <i class="fas fa-exchange-alt"></i>
                                            <span class="avoidTrClick" >`+toggle_status_text+`</span>
                                        </a>`;
                            }
                            
                            let remove_transaction = '';
                            if (full.manual_trx_type) {
                                remove_transaction = `<a class="avoidTrClick remove_transaction dropdown-item" data-id="` + data + `" href="#">
                                            <i class="avoidTrClick fas fa-trash"></i>
                                            <span class="avoidTrClick" >Remove Transaction</span>
                                        </a>`;
                            }

                            let available = refund != '' || stop_subscription != '' || toggle_psf_status != '' || remove_transaction != '';

                            return `<li class="nav-item dropdown" style="position: static">
                                  <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    ${available ? '•••' : '<span class="text-light">•••</span>'}
                                  </a>
                                  <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1" style="${available ? '' : 'display:none'}">`
                                    + refund
                                    + stop_subscription
                                    + remove_transaction
                                    + toggle_psf_status +`
                                  </div>
                                </li>`;                            
                        }                        
                    },
                    {data: "amount", className: "text-right", searchable: false
                        , mRender: function (data, type, full) {
                            var recurring_icon = "";
                            if (full.subscription != null && full.subscription > 0) {
                                recurring_icon = "<i class='fa fa-clock' title='Recurring'></i> ";                                
                            }
                            return recurring_icon + '$' + (data ? data : 0.0);
                        }},
                    {data: "is_fee_covered", className: "text-center", searchable: false
                        , mRender: function (data) {
                            return data == 0 ? 'No' : 'Yes';
                        }},
                    {data: "fee", className: "text-right", searchable: false
                        , mRender: function (data) {
                            return '$' + (data ? data : 0.0);
                        }},
                    {data: "net", className: "text-right", searchable: false
                        , mRender: function (data) {
                            return '<strong>$' + (data ? data : 0.0) + '</strong>';
                        }},

                    {data: "giving_source", className: "text-center", searchable: false},
                    {data: "method", className: "text-center", searchable: true, mRender: function (data, type, full) {
                            let str = data + (full.manual_trx_type ? '/' + full.manual_trx_type : '');
                            return str;
                        }},
                    {data: "manual_trx_type", className: "text-center", visible: false, searchable: true, mRender: function (data, type, full) {
                            return data; //for searches purposes
                        }},
                    {data: "status", className: "text-center", searchable: false, mRender: function (data, type, full) {
                            var str = '-';
                            if (full.manual_trx_type) {
                                if (data == 'P') {
                                    str = '<i class="ni ni-check-bold"></i> Succeeded';
                                }
                            } else if (full.src == 'CC') {
                                if (data == 'P') {
                                    if (full.trx_type == 'Donation' && full.manual_failed == '1') {
                                        str = '<i class="fas fa-window-close"></i> Marked as failed';
                                    } else if (full.trx_type == 'Refunded') {
                                        str = '<label style="color:darkgray"><i class="fas fa-reply"></i> Refunded</label>';
                                    } else if (full.trx_type == 'Recovered') {
                                        str = '<label style="color:darkgray"><i class="fas fa-reply"></i> Recovered</label>';
                                    } else {
                                        str = '<i class="ni ni-check-bold"></i> Succeeded';
                                    }
                                }
                            } else if (full.src == 'BNK') {
                                
                                if (full.trx_type == 'Donation' && full.manual_failed == '1') {
                                        str = '<i class="fas fa-window-close"></i> Marked as failed';
                                }else if (data == 'P' && full.trx_type == 'Donation') {
                                    str = `<i class="ni ni-check-bold"></i> ${full._fts_status}`;
                                } else if (data == 'P' && full.trx_type == 'Refunded') {
                                    str = `<label style="color:darkgray"><i class="fas fa-reply"></i> Refund <br><span style="font-size: 10px">${full._fts_status}</span></label>`;
                                } else if (data == 'P' && full.trx_type == 'Recovered') {
                                        str = '<label style="color:darkgray"><i class="fas fa-reply"></i> Recovered</label>';
                                } else if (data == 'N') {
                                    str = '<i class="fas fa-exclamation-triangle"></i> Not processed';
                                }
                            }
                            if (full.subscription != null && full.subscription > 0 && full.substatus == 'D') {
                                str += '<br><label style="color: darkgray; font-size: 12px; font-style:italic">Subscription canceled</label>';
                            }
                            return str;

                        }},
                    {data: "created_at", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {
                            return full.created_at_formatted;
                        }}
                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);
                    var search_filter = $('.search input');                    
                    $('#div_search_filter').append(search_filter);
                    
                    //_global_objects.donations_dt = donations.donations_dt; //keep the table on a global variable for getting access from other js scripts
                    _global_objects.fund_id = null; //important check loadDinamycFunds for understanding this line
                }
            });

            $(tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                    let data = donations.donations_dt.row(this).data();
                    window.location.href = `${base_url}donations/detail/${data.id}`;

                }
            });

            //Event Refund
            $(document).on('click', '.refund_transaction', function (e) {
                var transaction_id = $(this).data('id');
                question_modal('Refund Transaction', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#refund_transaction_form").serializeArray();
                                var refund_data = {};
                                $.each(data, function () {
                                    refund_data[this.name] = this.value;
                                });
                                refund_data['transaction_id'] = transaction_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'donations/refund', type: "POST",
                                    dataType: "json",
                                    data: refund_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message)
                                        } else {
                                            error_message(data.message)
                                        }
                                        donations.donations_dt.draw(false);
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

            //Event Toggle Status PSF
            $(document).on('click', '.toggle_psf_status', function (e) {
                var transaction_id = $(this).data('id');
                question_modal('Mark as failed', 'This action cannot be undone. Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#toggle_status_form").serializeArray();
                                var status_data = {};
                                $.each(data, function () {
                                    status_data[this.name] = this.value;
                                });
                                status_data['transaction_id'] = transaction_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'donations/toggle_bank_trxn_status', type: "POST",
                                    dataType: "json",
                                    data: status_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message)
                                        } else {
                                            error_message(data.message)
                                        }
                                        donations.donations_dt.draw(false);
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

            //Event Stop Subscription
            $(document).on('click', '.stop_subscription', function (e) {
                var subscription_id = $(this).data('id');
                question_modal('Stop Subscription', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#stop_subscription_form").serializeArray();
                                var subscription_data = {};
                                $.each(data, function () {
                                    subscription_data[this.name] = this.value;
                                });
                                subscription_data['subscription_id'] = subscription_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'donations/stop_subscription', type: "POST",
                                    dataType: "json",
                                    data: subscription_data,
                                    success: function (data) {
                                        if (data.status) {
                                            success_message(data.message)
                                        } else {
                                            error_message(data.message)
                                        }
                                        donations.donations_dt.draw(false);
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

            //Event Remove Transaction

            $(document).on('click', '.remove_transaction', function (e) {
                var transaction_id = $(this).data('id');
                question_modal('Remove Transaction', 'Confirm you want to continue')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#refund_transaction_form").serializeArray();
                                var refund_data = {};
                                $.each(data, function () {
                                    refund_data[this.name] = this.value;
                                });
                                refund_data['transaction_id'] = transaction_id;
                                loader('show');
                                $.ajax({
                                    url: base_url + 'donations/remove_transaction', type: "POST",
                                    dataType: "json",
                                    data: refund_data,
                                    success: function (data) {
                                        if (data.status) {
                                            donations.notify({title: 'Notification', message: data.message});
                                            donations.donations_dt.draw(false);
                                        } else {
                                            error_message(data.errors);
                                        }
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
        },

        notify: function (options) {
            $.notify({
                icon: 'ni ni-bell-55',
                title: options.title,
                message: options.message,
                url: ''
            }, {
                element: 'body',
                type: 'primary',
                allow_dismiss: true,
                placement: {
                    from: 'top',
                    align: 'right'
                },
                offset: {
                    x: 15, // Keep this as default
                    y: 15 // Unless there'll be alignment issues as this value is targeted in CSS
                },
                spacing: 10,
                z_index: 1080,
                delay: 2000, //notify_delay
                timer: 2000, //notify_timer
                url_target: '_blank',
                mouse_over: true,
                animate: {enter: 1000, exit: 1000},
                template: '<div data-notify="container" class="alert alert-dismissible alert-{0} alert-notify" role="alert" style="width: 350px">' +
                        '<span class="alert-icon" data-notify="icon"></span> ' +
                        '<div class="alert-text"</div> ' +
                        '<span class="alert-title" data-notify="title">{1}</span> ' +
                        '<span data-notify="message">{2}</span>' +
                        '</div>' +
                        //'<div class="progress" data-notify="progressbar">' +
                        //'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                        //'</div>' +
                        '<a href="{3}" target="{4}" data-notify="url"></a>' +
                        '<button type="button" class="close" data-notify="dismiss" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                        '</div>'
            });
        }
    };
}());

