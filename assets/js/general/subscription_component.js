$(document).ready(function () {
    subscription_component.set_modal();

});
const subscription_component = {
    htmlCont: '#subscription-modal-component',
    transaction_dateImask: null,
    formatter: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }),
    btn: null, // Button Clicked    
    hash: null,
    products_list: [],
    payment_options: _global_payment_options.US,
    organization_id: null,
    suborganization_id: null,
    organization_name: null,
    suborganization_name: null,
    count_products_removed: 0,
    btnTrigger: '.btn-GENERAL-add-subscription', // ---- this is the button that lanunches de modal/component
    set_modal: function () {
        let _self = this;
        $(subscription_component.htmlCont + ' #main_form input').keypress(function (e) {
            if (e.which == 13) {
                return;
                subscription_component.save();
                e.preventDefault();
                return false;
            }
        });

        _self.set_payment_methods();
        _self.set_payment_options();

        $(document).on('click', _self.btnTrigger, async function () {
            loader('show');
            _self.count_products_removed = 0;
            subscription_component.btn = this;
            $(subscription_component.htmlCont + ' #main_form')[0].reset();
            $(subscription_component.htmlCont + ' .select2.donor').val(null).trigger('change');
            $(subscription_component.htmlCont + ' .select2.payment_options').val(Object.keys(_self.payment_options)).trigger('change');
            $(subscription_component.htmlCont + ' #products-list').empty();
            
            $(subscription_component.htmlCont + ' input[name="cover_fee"]').prop('checked', false);

            if (typeof $(this).attr('data-donor_id') !== 'undefined') {
                subscription_component.donor_id = $(this).attr('data-donor_id');
            }

            $(subscription_component.htmlCont + ' #trial-options').hide();

            // Create Setting
            $(_self.htmlCont + ' #component_title').html('Create Subscription');
            _self.hash = null;
            _self.addProductRow();

            if (typeof $(this).attr('data-context') !== 'undefined') {
                if ($(this).attr('data-context') == 'recurring') {
                    subscription_component.organization_name = _global_objects.currnt_org.orgName;
                    subscription_component.suborganization_name = _global_objects.currnt_org.suborgName;
                    subscription_component.organization_id = parseInt(_global_objects.currnt_org.orgnx_id);
                    subscription_component.suborganization_id = parseInt(_global_objects.currnt_org.sorgnx_id);
                        

                    if (!subscription_component.suborganization_id) {
                        $(subscription_component.htmlCont + ' .organization_name').html(subscription_component.organization_name);
                    } else {
                        $(subscription_component.htmlCont + ' .organization_name').html(subscription_component.organization_name + ' <span style="font-weight: normal;" > / </span> ' + subscription_component.suborganization_name);
                    }
                    $(subscription_component.htmlCont + ' .subtitle').show();
                }
            }

            //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
            //transaction.transaction_dateImask.value = '';
            //invoice.transaction_dateImask.value = moment().format("L");

            $(subscription_component.htmlCont + ' .main_modal').find('.alert-validation').first().empty().hide();
            $(subscription_component.htmlCont + ' .main_modal').modal('show');

            loader('hide');
        });

        $(subscription_component.htmlCont + ' .main_modal').on('show.bs.modal', function () {
            setup_multiple_modal(this);
        });

        $(this.htmlCont).on('shown.bs.modal', function () {
            //$('#add_transaction_modal').find(".focus-first").first().focus();
        });

        $(document).on('click', subscription_component.htmlCont + ' .btn-save', function () {
            subscription_component.save();
        });

        $(subscription_component.htmlCont + ' .select2.donor').select2({          
            tags: false,
            multiple: false,
            placeholder: 'Select a Customer',
            ajax: {
                url: function () {
                    return base_url + 'donors/get_tags_list_pagination';
                },
                type: "post",
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        organization_id: subscription_component.organization_id,
                        suborganization_id: subscription_component.suborganization_id,
                        q: params.term, // search term
                        page: params.page
                    };
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;
                    return {
                        results: data.items,
                        pagination: {
                            more: (params.page * 10) < parseInt(data.total_count)
                        }
                    };
                }
            }
        }).on('select2:open', function () {
            let a = $(this).data('select2');
            if ($('.select2-link2.donor').length) {
                $('.select2-link2.donor').remove();
            }

            let disabled = subscription_component.organization_id ? '' : 'disabled';

            a.$results.parents('.select2-results')
                    .append('<div class="select2-link2 donor"><button class="btn btn-primary btn-GENERAL-person-component" ' + disabled + ' data-is_select2_id="' + subscription_component.htmlCont + ' .select2.donor" data-is_select2="true" ' +
                            ' data-context="recurring" data-org_id="' + subscription_component.organization_id + '" data-org_name="' + subscription_component.organization_name +
                            '" data-suborg_id="' + subscription_component.suborganization_id + '" data-suborg_name="' + subscription_component.suborganization_name +
                            '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                            ' <i class="fas fa-user"></i> Create Customer</button></div>')

        }).on('select2:select',function () {
            if($(this).select2('data')[0]){
                subscription_component.refeshPaymentMethods();
            }
        });

        $(subscription_component.htmlCont + ' .select2.payment_options').select2({
            tags: false,
            multiple: true,
            placeholder: 'Select Payment Options',
        });

        $(document).on('click', subscription_component.htmlCont + ' .btn-add-product', function () {
            subscription_component.addProductRow();
        });

        _self.set_trial_period();
    },

    set_trial_period : function () {
        const $trialCheckbox = $('#trial_enabled');
        const $trialOptions = $('#trial-options');
        const $trialDays = $('#trial_days');
        const $trialEndDate = $('#trial_end_date');

        // Initialize datepicker
        $trialEndDate.datepicker({
            autoclose: true,
            format: 'mm/dd/yyyy',
            startDate: new Date()
        });

        // Show/hide + enable/disable trial fields
        $trialOptions.hide();
        $trialDays.prop('disabled', true);
        $trialEndDate.prop('disabled', true);
        
        $trialCheckbox.on('change', function () {
            const enabled = $(this).is(':checked');
            $trialOptions.toggle(enabled);
            $trialDays.prop('disabled', !enabled);
            $trialEndDate.prop('disabled', !enabled);
        });

        //  Update trial days when date changes
        $trialEndDate.on('changeDate', function (e) {
            const selectedDate = moment(e.date).startOf('day');
            const today = moment().startOf('day');
            const diff = selectedDate.diff(today, 'days'); // full-day precision

            $trialDays.val(diff >= 0 ? diff : 0);
        });

        // Update end date when trial days change
        $trialDays.on('input', function () {
            const days = parseInt($(this).val(), 10);
            if (!isNaN(days) && days >= 0) {
                const newDate = moment().add(days, 'days').toDate();
                $trialEndDate.datepicker('setDate', newDate);
            }
        });
    },

    set_payment_methods : function () {
        
        $(subscription_component.htmlCont + ' select[name="payment_method_id"]').select2({
            tags: false,
            multiple: false,
            placeholder: 'No payment method available',
            disabled: true, // Initially disabled
            minimumResultsForSearch: Infinity, // This removes the search input
            templateResult: function(option) {
                if (!option.id) return option.text;
                
                // Get the source data from the data attribute
                const sourceData = JSON.parse($(option.element).attr('data-source') || '{}');
                
                // Create structured layout with better spacing and hierarchy
                
                let template = `
                    <div class="pl-2 d-flex justify-content-between align-items-center">
                        <div class="source-type d-flex align-items-center">
                        <i class="fas fa-${sourceData.source_type === 'bank' ? 'university' : 'credit-card'} mr-1"></i>
                        <span class="text-capitalize font-weight-semibold ml-1">${sourceData.src_account_type}</span>
                        </div>

                        <div class="source-details d-flex align-items-center">
                        
                        <span class="ml-1 font-weight-semibold">•••• •••• •••• </span>
                        <span class="ml-2 font-weight-semibold">${sourceData.last_digits}</span>
                        ${
                            sourceData.source_type === 'card' &&
                            sourceData.exp_month &&
                            sourceData.exp_year
                            ? `<span class="text-sm text-muted mx-2"> Expires: ${sourceData.exp_month}/${sourceData.exp_year}</span>`
                            : ''
                        }      
                        </div>
                    </div>
                    `;
                
                return $(template);
            },
            templateSelection: function(option) {
                if (!option.id) return option.text;
            
                // Get the source data from the data attribute
                const sourceData = JSON.parse($(option.element).attr('data-source') || '{}');
            
                // Structured, aligned layout for selected option
                let label = `
                    <div class="d-flex align-items-center">
                        <div class="source-type d-flex align-items-center">
                            <i class="fas fa-${sourceData.source_type === 'bank' ? 'university' : 'credit-card'} mr-2"></i>
                            <span class="text-capitalize font-weight-semibold">${sourceData.src_account_type}</span>
                        </div>
                        <div class="source-details d-flex align-items-center">
                            <span class="ml-2 font-weight-semibold">•••• •••• ••••</span>
                            <span class="ml-1 font-weight-semibold">${sourceData.last_digits}</span>
                            ${
                                sourceData.source_type === 'card' &&
                                sourceData.exp_month &&
                                sourceData.exp_year
                                    ? `<span class="ml-1 text-sm text-muted">Expires: ${sourceData.exp_month}/${sourceData.exp_year}</span>`
                                    : ''
                            }
                        </div>
                    </div>
                `;
            
                return $(label);
            }
            
        });                      
    },

    refeshPaymentMethods: async function() {
        $select = $(subscription_component.htmlCont).find('select[name="payment_method_id"]');
        const customer_id = $(subscription_component.htmlCont + ' .donor').select2('val');
        
        if (!customer_id) {
            $(this).prop('checked', false);
            notify({ title: 'Notification', message: 'Please select a customer.', align: 'center' });
            return;
        }
    
        // Clear existing options and show loading state
        $select.empty().append('<option value="">Loading...</option>').prop('disabled', true);
    
        let sourcesData;
    
        try {
            const data = {
                customer_id: customer_id,
                org_id: subscription_component.organization_id,
                csrf_token: $('input[name="csrf_token"]').val()
            };
    
            loader('show');
    
            const sources = await fetch(base_url + 'payment_method/get_all', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
    
            sourcesData = await sources.json();
            if(sourcesData.status === false) {
                throw new Error(sourcesData.errors);
            }
        } catch (error) {
            console.log(error);
            notify({ title: 'Notification', message: error.message });
            $select.prop('disabled', true);
            return;
        } finally {
            loader('hide');
        }
    
        // Clear loading state
        $select.empty();
    
        if (sourcesData.status && sourcesData.data.length > 0) {
            // Add default option
            $select.append('<option value="">Select Payment Method</option>');
            
            sourcesData.data.forEach((source, index) => {
                // Just store the raw data as JSON in a data attribute
                $select.append(`<option value="${source.id}" 
                                       data-source='${JSON.stringify(source)}'>${source.source_type}</option>`);
            });
            
            // Enable the select and trigger Select2 update
            $select.prop('disabled', false);
            
            // Auto-select the first payment method
            const selectedID = sourcesData.data[0].id;
            
            $select.val(selectedID).trigger('change');
        } else {                
            $select.prop('disabled', true);
            $(this).prop('checked', false);
            //notify({ title: 'Notification', message: 'No payment methods found for this customer. You can add one from the customer profile.', align: 'center' });
        }
    },
    set_payment_options: function () {
        $.each(subscription_component.payment_options, function (key, value) {
            $(subscription_component.htmlCont + ' .select2.payment_options').append($('<option>', {
                value: key
            }).text(value));
        })
    },

    addProductRow: async function () {
        let product_row = $(subscription_component.htmlCont + ' form .product-row').length + 1;
        let product_number = product_row + subscription_component.count_products_removed;
        $(subscription_component.htmlCont + ' form #products-list').append(`
            <div id="item-` + product_number + `" class="form-group row product-row mb-1" style="display: none">
                <div class="col-12 bold-weight py-2">
                    <span class="badge badge-secondary bold-weight" style="margin-left: -3px;">
                        product <span class="product-title">` + product_row + `</span>
                    </span>
                    <span style="cursor:pointer; font-size:11px; color:#7a7a7a; float:right;" class="ml-2 badge remove-product-row-btn" id="remove-product-row-btn-` + product_number + `" data-product_id="` + product_number + `">
                        Remove
                    </span>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label><strong>Product</strong></label>
                        <select id="product-` + product_number + `"   class="form-control select2 product" name="product_id" >
                        </select>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="form-group">
                        <label><strong>Quantity</strong></label>
                        <input data-count="` + product_number + `" type="number" min="0" value="1" class="form-control product count" name="quantity" id="qty-` + product_number + `" placeholder="0">
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label for="details">&nbsp;</label> <br />
                        <button type="button" class="m-auto w-75 btn btn-neutral btn-add-product position-relative">
                            <i class="fa fa-plus"></i> Add Another
                        </button>
                    </div>
                </div>
                <div class="col-sm-12"><hr id="scrollto-` + product_number + `" style="margin-top: 30px" class="mb-0"></div>                 
            </div>
    `);

        $(subscription_component.htmlCont + ' #item-' + product_number).fadeIn('fast');

        $(subscription_component.htmlCont + ' #remove-product-row-btn-' + product_number).on('click', function () {
            subscription_component.removeProductRow($(this).attr('data-product_id'));
        });


        $(subscription_component.htmlCont + ' #product-' + product_number).select2({
            tags: false,
            multiple: false,
            placeholder: 'Select a Product',
            templateResult: function (data) {
                strconca = "";
                strconca += "<span >" + data.text + "</span>";
                strconca += "<br>";
                strconca += "<div class='container' style='font-style:oblique' >";
                
                if (data.recurrence == _global_objects.currnt_config_product_model.RECURRENCE_ONE_TIME) {
                    strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.RECURRENCE_STRINGS.O + "</div>";
                }
                if (data.recurrence == _global_objects.currnt_config_product_model.RECURRENCE_PERIODICALLY) {
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_DAYLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS.daily + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_WEEKLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS.weekly + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_MONTHLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS.monthly + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_3_MONTHS) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS['3_months'] + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_6_MONTHS) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS['6_months'] + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product_model.PERIODICALLY_YEARLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.PERIODICALLY_STRINGS.yearly + "</div>";
                    }
                }

                if (data.recurrence == _global_objects.currnt_config_product_model.RECURRENCE_CUSTOM) {
                    strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product_model.RECURRENCE_STRINGS.C + "</div>";

                }
                if (data.custom_date_view) {
                    strconca += "<div>Payments: " + data.custom_date_view + "</div>";
                }
                if (data.file_hash) {
                    strconca += "<div>PDF Linked</div>";
                }
                strconca += "</div >";
                var $state = $(strconca);
                return $state;
            },
            ajax: {
                url: function () {
                    return base_url + 'products/get_tags_list_pagination';
                },
                type: "post",
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        organization_id: subscription_component.organization_id,
                        suborganization_id: subscription_component.suborganization_id,
                        q: params.term,
                        page: params.page
                    };
                },
                processResults: function (data, params) {

                    params.page = params.page || 1;
                    var results = [];
                    $.each(data.items, function (key, value) {
                        var parameter = {};
                        parameter.id = value.id;
                        parameter.text = value.text;
                        parameter.name = value.name;
                        parameter.price = value.price;
                        parameter.recurrence = value.recurrence;
                        parameter.billing_period = value.billing_period;
                        parameter.custom_date = value.custom_date;
                        parameter.file_hash = value.file_hash;

                        if (value.custom_date) {
                            strconca = "";
                            $.each(JSON.parse(value.custom_date), function (key, value) {
                                strconca += ' ' + moment(value.date).format('MM/DD/YYYY') + ' (' + subscription_component.formatter.format(value.amount) + '),';
                            });
                            parameter.custom_date_view = strconca.slice(0, strconca.length - 1);
                        }
                        results.push(parameter);
                    });
                    return {
                        results: results,
                        pagination: {
                            more: (params.page * 10) < parseInt(data.total_count)
                        }
                    };
                }
            }
        });
        $(subscription_component.htmlCont + ' #product-' + product_number).on('select2:open', function () {
            let a = $(this).data('select2');
            if ($('.select2-link2.product').length) {
                $('.select2-link2.product').remove();
            }

            let disabled = subscription_component.organization_id ? '' : 'disabled';

            a.$results.parent('.select2-results')
                .append('<div class="select2-link2 product"><button class="btn btn-primary btn-GENERAL-product-component" ' + disabled + ' data-is_select2_id="' + subscription_component.htmlCont + ' #product-' + product_number + '" data-is_select2="true" ' +
                    ' data-context="recurring" data-org_id="' + subscription_component.organization_id + '" data-org_name="' + subscription_component.organization_name +
                    '" data-suborg_id="' + subscription_component.suborganization_id + '" data-suborg_name="' + subscription_component.suborganization_name +
                    '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                    ' <i class="fas fa-box-open"></i> Create Product</button></div>')
        }).on('select2:select', function () {
            if ($(this).select2('data')[0]) {
                let product_data_selected = $(this).select2('data')[0];
                let product_object = {};
                let custom_count = 0;
                var mDay = moment().format('MM-DD-YYYY');
                if (product_data_selected.recurrence == _global_objects.currnt_config_product_model.RECURRENCE_CUSTOM) {
                    $.each(JSON.parse(product_data_selected.custom_date), function (key, value) {
                        if (moment(value.date).format('MM-DD-YYYY') < mDay) {
                            custom_count = custom_count + 1;

                        }
                    })
                    if (custom_count == 0) {

                        document.getElementById('qty-' + product_number).disabled = true;                        
                    } else {
                        notify({
                            'title': 'Notification',
                            'message': 'Product expired'
                        });
                        $('#product-' + product_number).val('').trigger('change');
                    }

                } else {
                    document.getElementById('qty-' + product_number).disabled = false;
                }

                if (custom_count == 0) {

                    product_object.product_id = product_data_selected.id;
                    product_object.product_name = product_data_selected.name;
                    product_object.product_inv_price = product_data_selected.price;
                    subscription_component.products_list.push(product_object);
                }
            }
        });

        if ($(subscription_component.htmlCont + ' #products-items .product-row').length > 2) {
            //help with a smooth scrol to the user just when there are more than 2 rows
            setTimeout(function () {
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(subscription_component.htmlCont + ' #scrollto-' + product_number).offset().top
                }, 1000);
            }, 250);
        }

        $(subscription_component.htmlCont + ' #product-' + product_number).select2('focus');
    },
    removeProductRow: function (product_number) {
        if ($(subscription_component.htmlCont + ' .product-row').length == 1)
            return; //do not allow to remove all donation rows
        if ($("#product-" + product_number + "").select2('val')) {
            // subscription_component.products_list = subscription_component.products_list.filter(e=>e.product_id !== $("#product-"+product_number+"").select2('val'));
        }
        //slideup --
        $(subscription_component.htmlCont + ' #item-' + product_number).slideUp(400, function () {
            $(subscription_component.htmlCont + ' #item-' + product_number).remove();
        });

        setTimeout(function () {
            let i_row = 1;
            $.each($(subscription_component.htmlCont + ' .product-row'), function () {
                $(this).find('.product-title').text(i_row);
                i_row++;
            });
            subscription_component.count_products_removed++;
        }, 500); //wait till slideup -- important (we would not need setTimeout functions if dont using slideUp)
    },
    save: function () {
        let save_data = {};
        let products = [];
        let error = false;

        let data = $(subscription_component.htmlCont + ' form').serializeArray();
        $.each(data, function () {
            save_data[this.name] = this.value;             
        });

        $(subscription_component.htmlCont + ' form').find('.count').each((i, e) => {
            let product = {};
            let product_list = subscription_component.products_list.filter(f => f.product_id == $("#product-" + $(e).attr('data-count') + "").select2('val'))[0];
            if (!product_list) {
                error = true;
            } else {
                product.product_id = product_list.product_id
                product.product_name = product_list.product_name
                product.product_price = product_list.product_inv_price                
                product.quantity = $("#qty-" + $(e).attr('data-count') + "").val();
                products.push(product);                
            }
        });
        save_data.products = products;
        save_data.csrf_token = $("input[name=csrf_token]").val();

        if($(subscription_component.btnTrigger).attr('data-context') == 'customer_datatable' || $(subscription_component.btnTrigger).attr('data-context')=='customer_datatable_profile'){
            save_data['account_donor_id'] = $(invoice_component.htmlCont + ' .donor').select2('val');   
        }   

        save_data['organization_id'] = subscription_component.organization_id;
        save_data['suborganization_id'] = subscription_component.suborganization_id || null;
        save_data['payment_options'] = $(subscription_component.htmlCont + ' .payment_options').select2('val');

        save_data['cover_fee'] = $(subscription_component.htmlCont + ' input[name="cover_fee"]').is(':checked') ? 1 : 0;

        let trialEnabled = $(subscription_component.htmlCont + ' #trial_enabled').is(':checked');
        
        if (trialEnabled) {
            let trialDays = parseInt($(subscription_component.htmlCont + ' #trial_days').val()) || 0;
            
            save_data['trial_days'] = trialDays;
           
            if (trialEnabled && (!trialDays)) {
                notify({ title: 'Notification', message: 'Please provide a valid trial days.', align: 'center' });
                return;
            }
        }

        loader('show');
        $.post(base_url + 'donations/create_internal_subscription', save_data, function (result) {
            if (result.status) {
                const errors = [];
                const successes = [];

                // Check one-time payment
                if (result.one_time_payment) {
                    if (result.one_time_payment.status === false) {
                        errors.push({
                            type: "one_time",
                            trxn_id: result.one_time_payment.trxn_id,
                            message: result.one_time_payment.message || "One-time payment failed"
                        });
                    } else {
                        successes.push({
                            type: "one_time",
                            trxn_id: result.one_time_payment.trxn_id,
                            message: "One-time payment succeeded"
                        });
                    }
                }

                // Check subscriptions
                const subscriptions = result.subscriptions;
                if (Array.isArray(subscriptions) && subscriptions.length > 0) {
                    subscriptions.forEach(sub => {
                        const payInfo = sub.payment_info;

                        if (payInfo && (payInfo.status === "failed")) {
                            const pResults = payInfo.payment_reponse?.pResults;
                            const paymentMessage = Array.isArray(pResults) && pResults.length > 0
                                ? pResults[0].message
                                : "Subscription payment failed";

                            errors.push({
                                type: "subscription_payment",
                                subscription_id: payInfo.subscription_id,
                                trxn_id: payInfo.trxn_id,
                                message: paymentMessage
                            });
                        } else if (payInfo?.status === "success") {
                            successes.push({
                                type: "subscription_payment",
                                subscription_id: payInfo.subscription_id,
                                trxn_id: payInfo.trxn_id,
                                message: "Subscription payment succeeded"
                            });
                        }
                    });
                }

                // Show messages
                if (errors.length > 0) {
                    let errorString = "<div style='text-align: justify'>";
                    
                    if (errors.length > 0) {
                        errorString += `<p><b>Fail:</b></p>`;
                        errors.forEach(err => {
                            if (err.type === "one_time") {
                                errorString += `<p>One-time payment<br>Transaction ID: <b>${err.trxn_id}</b><br/>Reason: ${err.message}</p>`;
                            } else if (err.type === "subscription_payment") {
                                errorString += `<p>Subscription<br>Subscription ID: <b>${err.subscription_id}</b><br/>Transaction ID: <b>${err?.trxn_id || 'N/A'}</b><br/>Reason: ${err.message}</p>`;
                            }
                        });
                    }

                    if (successes.length > 0) {
                        errorString += `<p><b>Success:</b></p>`;
                        successes.forEach(success => {
                            if (success.type === "one_time") {
                                errorString += `<p>One-time payment<br>Transaction ID: <b>${success.trxn_id}</b></p>`;
                            } else if (success.type === "subscription_payment") {
                                errorString += `<p>Subscription<br>Subscription ID: <b>${success.subscription_id}</b><br>Transaction ID: <b>${success?.trxn_id || 'N/A'}</b></p>`;
                            }
                        });
                    }
                    errorString += "</div>";
                    info_message_custom_html(errorString);
                } else {
                    success_message('Subscription processed successfully'); // generic success
                }

                ///////
                $(subscription_component.htmlCont + ' .main_modal').modal('hide');
                
                if (_global_objects.recurring) { //if the object is not set there is no need of refreshing
                    _global_objects.recurring.draw(false);
                }
            } else {
                $(subscription_component.htmlCont).find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                $(subscription_component.htmlCont).animate({
                    scrollTop: 0
                }, 'fast'); //guide the user to see the error by scrolling to the top
            }
            loader('hide');
            typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
        }).fail(function (e) {
            loader('hide');
            if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                alert(e.responseJSON.message);
                window.location.reload();
            }            
        });
    },
    notify: function (options) {
        $.notify({
            icon: 'ni ni-money-coins',
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
            animate: {
                enter: 1000,
                exit: 1000
            },
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
}
