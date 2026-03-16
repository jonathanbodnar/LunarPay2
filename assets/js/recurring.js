(function () {
    loader('show');
    $(document).ready(function () {
        subs.setsubs_dt();
        loader('hide');
    });
    var subs = {
        setsubs_dt: function () {
            var tableId = "#subscriptions_datatable";
            this.dtTable = $(tableId).DataTable({
                "dom": '<"row row_filter"<"col-md-9 col-sm-12 filter-1"><"col-md-3 col-sm-12 search"f>><"row"<"col-sm-12 filter-2">>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "donations/get_subscriptions_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.suborganization_id = _global_objects.currnt_org.sorgnx_id;                       
                        d.method = $('select#method_filter').val();
                        d.freq = $('select#freq_filter').val();
                    }
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function (data) {
                    $(tableId).fadeIn("fast");

                    $("#subs_monthly_total").text('$' + data.json.include.subs_data.monthly.total);
                    $("#subs_monthly_max").text('$' + data.json.include.subs_data.monthly.max_net);
                    
                    $("#subs_all_total").text('$' + data.json.include.subs_data.all.total);
                    $("#subs_total_max").text('$' + data.json.include.subs_data.all.max_net);
                    
                    $("#subs_count_total").text(data.json.include.subs_data.count.count);
                    $("#subs_count_since").text(data.json.include.subs_data.count.since);

                    let search_value = $('#div_search_filter input').val();
                    if (typeof search_value !== "undefined" && search_value !== null && search_value.trim() !== '') {
                        $('#sub_totals_container').hide();
                    } else {
                        $('#sub_totals_container').show();
                    }
                },
                columns: [
                    {data: "id", className: "text-center", searchable: true},
                    {data: "id", className: "text-center", sortable: false, searchable: false, render: function (data, type, full) {
                            var stop_subscription = "";
                            if (full.status == 'A') {
                                stop_subscription = `<a class="avoidTrClick stop_subscription dropdown-item"  data-id="` + data + `" href="#">
                                            <i class="avoidTrClick fas fa-ban"></i>
                                            <span class="avoidTrClick">Stop Subscription</span>
                                        </a>`;
                            }

                            const available = stop_subscription !== '' ? true : false;

                        return `<li class="nav-item dropdown" style="position: static">
                                      <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        ${available ? '•••' : '<span class="avoidTrClick text-light">•••</span>'}
                                      </a>
                                      <div class="avoidTrClick dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1" style="${available ? '' : 'display:none'}">`
                                            + stop_subscription
                                            + `
                                      </div>
                                    </li>`;
                        }

                    },
                    {data: "amount", className: "text-right", searchable: false, visible: true,
                        render: function (data, type, full) {
                            
                            return ((full._trial_text 
                                ? `<span class="badge">${full._trial_text}</span> `
                                : '')
                                + '$' + (data ? data : 0.0));
                        }
                    },
                    {data: "trxs_count", className: "text-center", searchable: false},
                    {data: "fee", className: "text-right", searchable: false, visible: true, render: function (data) {
                            return '$' + (data ? data : 0.0);
                        }
                    },
                    {data: "given", className: "text-right", searchable: false,
                        render: function (data, type, full) {
                            return '<strong><span style="cursor: pointer" title="'
                                    + ''
                                    + '">$' + (data ? data : 0.0)
                                    + '</span><strong>';
                        }
                    },
                    {data: "frequency", className: "text-center", searchable: false, render: function (data) {
                            return data.charAt(0).toUpperCase() + data.slice(1); //ucfirst
                        }
                    },
                    {data: "name", className: "", searchable: true},
                    {data: "email", className: "", searchable: true},                   
                    {data: "method", className: "text-center", searchable: false},
                    {data: "status_text", className: "text-center", searchable: false, render: function (data, type, full) {
                            if (data == 'Active') {
                                return '<span class="badge badge-primary">&nbsp;' + data + '&nbsp;</span>'; 
                            } else {
                                return '<span class="badge badge-warning">' + data + '</span>';
                            }

                        }
                    },
                    {data: "start_on", className: "text-center", searchable: false},
                    {data: "_created_at", className: "text-center", searchable: false}                    
                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);
                    var search_filter = $('.search input');
                    $('#div_search_filter').append(search_filter);
                }
            });

            _global_objects.recurring = this.dtTable;

             $(tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;              
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                    let data = subs.dtTable.row(this).data();   
                    
                    loader('show');                
                    window.location.href = `${base_url}donations/profile_recurring/${data.id}`;
                }
            });   


            //Event Change Method Filter
            $('select#method_filter').change(function () {
                subs.dtTable.draw(false);
            });

            $('select#freq_filter').change(function () {
                subs.dtTable.draw(false);
            });

            //Event Stop Subscription
            $(document).on('click', '.stop_subscription', function (e) {
                var subscription_id = $(this).data('id');
                question_modal('Stop Subscription', 'Are you sure?')
                        .then(function (result) {
                            if (result.value) {
                                var data = $("#general_token_form").serializeArray();
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
                                            success_message(data.message);
                                        } else {
                                            error_message(data.message);
                                        }
                                        subs.dtTable.draw(false);
                                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                        loader('hide');
                                    },
                                    error: function (jqXHR, textStatus, errorJson) {
                                        loader('hide');
                                        error_message(jqXHR.responseText);
                                    }
                                });
                            }
                        });
                e.preventDefault();
                return false;
            });
        }
    };
}());

