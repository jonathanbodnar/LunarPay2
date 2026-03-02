(function () {
    loader('show');
    $(document).ready(function () {        
        donations.graphStatsVisibilityHandler.init();
        donations.setdonations_dt();   
        loader('hide');       
    });
    var donations = {
        totalChart: null,
        numberGifts: null,
        newDonorsChart: null,
        donations_dt: null,
        setdonations_dt: function () {
            if (_global_objects.fund_id) { //load datatable with a fund by default                                
                donations.setFundOnFilter(_global_objects.fund_id);
            }            
            
            Chart.defaults.global.defaultColor = '#1468fa';
            var tableId = "#donations_datatable";
            donations.donations_dt = $(tableId).DataTable({
                "dom": '<"row row_filter"<"col-md-9 col-sm-12 filter-1"><"col-md-3 col-sm-12 search"f>><"row"<"col-sm-12 filter-2">>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],                
                ajax: {
                    url: base_url + "donations/get_donations_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.suborganization_id = _global_objects.currnt_org.sorgnx_id;                      
                        d.method = $('select#method_filter').val();
                        d.freq = $('select#freq_filter').val();                        
                    }
                },
                "rowCallback": function (row, data, index) {
                    $(row).attr('title', data.transaction_detail ? data.transaction_detail : 'No details found for transaction #' + data.id);
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function (data) {
                    if (this.totalChart) {
                        this.totalChart.destroy();
                    }
                    //$(tableId).fadeIn("fast");

                    var total_given_context = $('#chart_total_given');
                    this.totalChart = new Chart(total_given_context, {
                        type: 'bar',
                        data: {
                            labels: data.json.include.total_given_labels,
                            datasets: [{
                                    label: 'Total Given',
                                    data: data.json.include.total_given_values
                                }]
                        },
                    });

                    total_given_context.data('chart', this.totalChart);

                    if (this.numberGifts) {
                        this.numberGifts.destroy();
                    }
                    var number_gifts_context = $('#chart_number_gifts');
                    this.numberGifts = new Chart(number_gifts_context, {
                        type: 'bar',
                        data: {
                            labels: data.json.include.number_gifts_labels,
                            datasets: [{
                                    label: 'Number of Gifts',
                                    data: data.json.include.number_gifts_values,
                                }],
                        },
                    });

                    number_gifts_context.data('chart', this.numberGifts);

                    if (this.newDonorsChart) {
                        this.newDonorsChart.destroy();
                    }
                    var new_donors_context = $('#chart_new_donors');
                    this.newDonorsChart = new Chart(new_donors_context, {
                        type: 'bar',
                        data: {
                            labels: data.json.include.new_donors_labels,
                            datasets: [{
                                    label: 'New Donors',
                                    data: data.json.include.new_donors_values
                                }]
                        },
                    });

                    new_donors_context.data('chart', this.newDonorsChart);

                    let search_value = $('#div_search_filter input').val();
                    if (typeof search_value !== "undefined" && search_value !== null && search_value.trim() !== '') {
                        $('.chart_donations').hide();
                    } else {
                        $('.chart_donations').show();
                    }
                },
                columns: [
                    {data: "id", className: "text-center", searchable: true},
                    {data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {                            
                            var stop_subscription = "";
                            if (full.subscription != null && full.subscription > 0 && full.substatus == 'A') {
                                stop_subscription = `<a class="avoidTrClick stop_subscription dropdown-item"  data-id="` + full.subscription + `" href="#">
                                            <i class="avoidTrClick fas fa-ban"></i>
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
                                            <i class="avoidTrClick fas fa-exchange-alt"></i>
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
                                    ${available ? '•••' : '<span class="avoidTrClick text-light">•••</span>'}
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
                            var freq = "";
                            if (full.subscription != null && full.subscription > 0) {
                                recurring_icon = "<i class='fa fa-clock' title='Recurring'></i> ";
                                // freq = full.subfrequency.charAt(0).toUpperCase() + full.subfrequency.slice(1); //ucfirst
                                // freq = '<span style="color: darkgray; font-size: 12px; font-style:italic"> ' + freq + '</span>';
                                
                            }
                            return recurring_icon + '$' + (data ? data : 0.0) + freq;
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
                    {data: "name", className: "", searchable: true, mRender: function (data, type, full) {
                            return data ? $.fn.dataTable.render.text().display(data) : '-'; //sanitize
                    }},
                    {data: "email", className: "", searchable: true, mRender: function (data, type, full) {
                            return data ? $.fn.dataTable.render.text().display(data) : '-'; //sanitize
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
                    
                    _global_objects.donations_dt = donations.donations_dt; //keep the table on a global variable for getting access from other js scripts
                    _global_objects.fund_id = null; //important check loadDinamycFunds for understanding this line
                }
            });

            $(tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                    let data = donations.donations_dt.row(this).data();

                    loader('show');                    
                    window.location.href = `${base_url}donations/detail/${data.id}`;

                }
            });
            

            //Laading Dinamically Funds
           /* function loadDinamycFunds() {
                if(_global_objects.fund_id) { //if fund_id is provided we do not load funds, we keep the filter with the provided one
                    return;
                }
                var selectInput = $('select#fund_filter');
                selectInput.empty();
                selectInput.append($('<option/>', {value: ''}).html('All Funds'));

                var organization_id = _global_objects.currnt_org.orgnx_id;
                var suborganization_id = _global_objects.currnt_org.sorgnx_id;
                //Set Sub Organizations to Datatable Filters
                $.post(base_url + 'funds/get_funds_list', {organization_id: organization_id, suborganization_id: suborganization_id}, function (result) {
                    for (var i in result) {
                        selectInput.append($('<option/>', {value: result[i].id}).html(result[i].name));
                    }
                }).fail(function (e) {
                    console.log(e);
                });
            }
            loadDinamycFunds();
     
            //Event Change Fund Filter
            $('select#fund_filter').change(async function () {
                if ($(this).val() == '_RESET') { //FYI _global_objects.fund_id is already set to null on fnInitComplete
                    $('select#fund_filter').css('font-weight', 'normal');                   
                    await loadDinamycFunds();
                    $(this).change();
                    return;
                }
                donations.donations_dt.draw(false);
            });*/

            //Event Change Method Filter
            $('select#method_filter').change(function () {
                donations.donations_dt.draw(false);
            });
            
            //Event Change Frequency Filter
            $('select#freq_filter').change(function () {
                donations.donations_dt.draw(false);
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
                                            donations.notify({title:'Notification', message : data.message});
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

            $('.btn-export-csv').click(function () {
                let export_params = donations.donations_dt.ajax.params();
                export_params['length'] = -1;
                $.ajax({
                    url: base_url + 'donations/export_donations_csv', type: "POST",
                    data: export_params,
                    success: function (data) {
                        var downloadLink = document.createElement("a");
                        var fileData = ['\ufeff'+data];

                        var blobObject = new Blob(fileData,{
                            type: "text/csv;charset=utf-8;"
                        });

                        var url = URL.createObjectURL(blobObject);
                        downloadLink.href = url;
                        downloadLink.download = "transactions"+moment().format('YYYYMMDDHHmmss')+".csv";

                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);

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
            });
        },
       /* setFundOnFilter: function (fund_id) {           
            $('select#fund_filter').css('font-weight', 'bold');
            $('select#fund_filter').empty()
                    .append($('<option>', {value: fund_id}).text(''))
                    .append($('<option>', {value: '_RESET'}).text('... Reset Filter'));

            $.post(base_url + 'funds/get_fund_with_orgn_data', {id: fund_id}, function (result) {
                if (result.fund) {
                    $('select#fund_filter option[value ="' + fund_id + '"]').text(result.fund.name + ' | Reset filter ↓');
                } else {
                    $('select#fund_filter option[value ="' + fund_id + '"]').text('-');
                }
            }).fail(function (e) {

            });
        },*/
        graphStatsVisibilityHandler: {
            animation: 'fast',
            init: function () {
                if ($('#show_hide_graph_selector').attr('data-initial_state') == 1 && _global_objects.fund_id == null)
                    donations.graphStatsVisibilityHandler.visibilityToggle(0); //send current state as 0 (closed) so it will open it
                else //if fund_id is provided then force to hide charts
                    donations.graphStatsVisibilityHandler.visibilityToggle(1); //send current state as 1 (opened) so it will close it                

                $('#show_hide_graph_selector').on('click', function () {
                    donations.graphStatsVisibilityHandler.visibilityToggle();
                });
            },
            visibilityToggle: function (current_state) { //current state can be 0 or 1
                if (typeof current_state == 'undefined') 
                    current_state = $('#show_hide_graph_selector').attr('data-state');

                if (current_state == 0) {
                    //if current state is closed then open it and update new state
                    $('#show_hide_graph_selector').attr('data-state', 1);
                    $('#show_hide_graph_selector .close-icon').show();
                    $('#show_hide_graph_selector .open-icon').hide();
                    $('.graph-stats-container').slideDown(this.animation);
                } else {
                    //if current state is opened then close it and update new state
                    $('#show_hide_graph_selector').attr('data-state', 0);
                    $('#show_hide_graph_selector .close-icon').hide();
                    $('#show_hide_graph_selector .open-icon').show();
                    $('.graph-stats-container').slideUp(this.animation);
                }
            }
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
                delay: 2000,//notify_delay
                timer: 2000,//notify_timer
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

