$(document).ready(function () {
    payment_link_component.set_modal();
    //invoice.initializeImasks();
});
var payment_link_component = {
    htmlCont: '#link-payment-modal-component',
    transaction_dateImask: null,
    formatter: new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2}),
    btn: null, // Button Clicked
    is_editing : false,
    hash : null,
    current_invoice:null,
    products_list:[],
    payment_options: _global_payment_options.US,
    organization_id: null, 
    suborganization_id: null, 
    organization_name: null, 
    suborganization_name: null,
    count_products_removed: 0,
    btnTrigger: '.btn-add-payment-link-component', // ---- this is the button that lanunches de modal/component
    set_modal: function () {
        let _self = this;
        $(payment_link_component.htmlCont + ' #main_form input').keypress(function (e) {
            if (e.which == 13) {
                return;
                payment_link_component.save();
                e.preventDefault();
                return false;
            }
        });

        _self.set_payment_options();

        $(document).on('click', _self.btnTrigger, async function () {
            loader('show');
            _self.count_products_removed = 0;          
            payment_link_component.btn = this;
            $(payment_link_component.htmlCont + ' #main_form')[0].reset();
            $(payment_link_component.htmlCont + ' .select2.donor').val(null).trigger('change');
            $(payment_link_component.htmlCont + ' .select2.payment_options').val(Object.keys(_self.payment_options)).trigger('change');
            $(payment_link_component.htmlCont + ' #products-list').empty();

            $(payment_link_component.htmlCont + ' input[name="cover_fee"]').prop('checked', false);

            // Reset post purchase link fields
            $(payment_link_component.htmlCont + ' input[name="show_post_purchase_link"]').prop('checked', false).trigger('change');
            $(payment_link_component.htmlCont + ' input[name="post_purchase_url"]').val('');

            //invoice.getOrganizationList(this); //ajax cascade

            if (typeof $(this).attr('data-donor_id') !== 'undefined') {
                payment_link_component.donor_id = $(this).attr('data-donor_id');
            }

            $(payment_link_component.htmlCont + ' #trial-options').hide();

            // Create Setting
            $(_self.htmlCont + ' #component_title').html('Create Payment Link');
            _self.hash = null;
            _self.addProductRow();
            
            if (typeof $(this).attr('data-context') !== 'undefined') {
                if ($(this).attr('data-context') == 'payment_link_context') {
                    payment_link_component.organization_id = parseInt($(this).attr('data-org_id'));
                    payment_link_component.organization_name = $(this).attr('data-org_name');
                    payment_link_component.suborganization_id = parseInt($(this).attr('data-suborg_id'));
                    payment_link_component.suborganization_name = $(this).attr('data-suborg_name');

                    if (!payment_link_component.suborganization_id) {
                        $(payment_link_component.htmlCont + ' .organization_name').html(payment_link_component.organization_name);
                    } else {
                        $(payment_link_component.htmlCont + ' .organization_name').html(payment_link_component.organization_name + ' <span style="font-weight: normal;" > / </span> ' + payment_link_component.suborganization_name);
                    }
                    $(payment_link_component.htmlCont + ' .subtitle').show();
                }
            }

            //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
            //transaction.transaction_dateImask.value = '';
            //invoice.transaction_dateImask.value = moment().format("L");

            $(payment_link_component.htmlCont + ' #main_modal').find('.alert-validation').first().empty().hide();
            $(payment_link_component.htmlCont + ' #main_modal').modal('show');

            loader('hide');
        });

        $(payment_link_component.htmlCont + ' #main_modal').on('show.bs.modal', function () {
            setup_multiple_modal(this);
        });

        $(this.htmlCont).on('shown.bs.modal', function () {
            //$('#add_transaction_modal').find(".focus-first").first().focus();
        });

        $(document).on('click', payment_link_component.htmlCont + ' .btn-save', function () {
            payment_link_component.save();
        });

        $(payment_link_component.htmlCont + ' .select2.payment_options').select2({
            tags: false,
            multiple: true,
            placeholder: 'Select Payment Options',
        });

        // Handle post purchase link checkbox
        $(document).on('change', payment_link_component.htmlCont + ' input[name="show_post_purchase_link"]', function () {
            let postPurchaseUrlField = $(payment_link_component.htmlCont + ' input[name="post_purchase_url"]');
            if ($(this).is(':checked')) {
                postPurchaseUrlField.prop('disabled', false);
            } else {
                postPurchaseUrlField.prop('disabled', true);
                postPurchaseUrlField.val('');
            }
        });

        // Initialize post purchase link field state
        $(payment_link_component.htmlCont + ' input[name="post_purchase_url"]').prop('disabled', true);

        $(document).on('click', payment_link_component.htmlCont + ' .btn-add-product', function () {
            payment_link_component.addProductRow();
        });

        _self.set_trial_period();

    },
    set_payment_options : function () {
        $.each(payment_link_component.payment_options,function(key,value){
             $(payment_link_component.htmlCont+' .select2.payment_options').append($('<option>', {value: key}).text(value));
        })
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
    
    addProductRow: async function () {       
        let product_row = $(payment_link_component.htmlCont + ' form .product-row').length + 1;
        let product_number = product_row + payment_link_component.count_products_removed;
        $(payment_link_component.htmlCont + ' form #products-list').append(`
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
                    <div class="col-md-2 text-center">
                        <label><strong>Let customers adjust quantity</strong></label>
                        <div class="pt-2">
                            <label class="custom-toggle  custom-toggle">
                                <input type="checkbox" class="form-control product" name="editable"  id="editable-` + product_number +`">
                                <span class="custom-toggle-slider rounded-circle" data-label-off="No" data-label-on="Yes"></span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label><strong>Quantity</strong></label>
                            <input data-count="`+product_number+`" type="number" min="0" value="1" class="form-control product count" name="quantity" id="qty-` + product_number +`" placeholder="0">
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

        $(payment_link_component.htmlCont + ' #item-' + product_number).fadeIn('fast');

        $(payment_link_component.htmlCont + ' #remove-product-row-btn-' + product_number).on('click', function () {
            payment_link_component.removeProductRow($(this).attr('data-product_id'));
        });


        $(payment_link_component.htmlCont + ' #product-' + product_number).select2({
            tags: false,
            multiple: false,
            placeholder: 'Select a Product',
            templateResult: function (data) {
                strconca = "";
                strconca += "<span >" + data.text + "</span>";
                strconca += "<br>";
                strconca += "<div class='container' style='font-style:oblique' >";

                if (data.recurrence == _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_ONE_TIME) {
                    strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_STRINGS.O + "</div>";
                }
                if (data.recurrence == _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_PERIODICALLY) {
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_DAYLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS.daily + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_WEEKLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS.weekly + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_MONTHLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS.monthly + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_3_MONTHS) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS['3_months'] + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_6_MONTHS) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS['6_months'] + "</div>";
                    }
                    if (data.billing_period == _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_YEARLY) {
                        strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.PERIODICALLY_STRINGS.yearly + "</div>";
                    }
                }

                if (data.recurrence == _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_CUSTOM) {
                    strconca += "<div>" + 'Recurrence: ' + _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_STRINGS.C + "</div>";

                }
                if (data.custom_date_view) {
                    strconca += "<div>Payments: " + data.custom_date_view + "</div>";
                }
                if (data.file_hash) {
                    strconca += "<div>PDF Linked</div>";
                }
                strconca += "</div >";
                var $state = $(strconca);
                return  $state;
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
                        organization_id: payment_link_component.organization_id,
                        suborganization_id: payment_link_component.suborganization_id,
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
                                strconca += ' '+moment(value.date).format('MM/DD/YYYY') + ' (' + payment_link_component.formatter.format(value.amount) + '),';
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
           $(payment_link_component.htmlCont + ' #product-' + product_number).on('select2:open', function () {
            let a = $(this).data('select2');
            if ($('.select2-link2.product').length) {                
                $('.select2-link2.product').remove();
            }
            
            let disabled = payment_link_component.organization_id ? '' : 'disabled';

            a.$results.parent('.select2-results')
                    .append('<div class="select2-link2 product"><button class="btn btn-primary btn-GENERAL-product-component" ' + disabled + ' data-is_select2_id="' + payment_link_component.htmlCont + ' #product-' + product_number + '" data-is_select2="true" ' +
                            ' data-context="payment_link" data-org_id="' + payment_link_component.organization_id + '" data-org_name="' + payment_link_component.organization_name +
                            '" data-suborg_id="' + payment_link_component.suborganization_id + '" data-suborg_name="' + payment_link_component.suborganization_name +
                            '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                            ' <i class="fas fa-box-open"></i> Create Product</button></div>')
        }).on('select2:select', function () {            
            if($(this).select2('data')[0]){
                let product_data_selected = $(this).select2('data')[0];
                let product_object = {};                  
                let custom_count= 0; 
                var mDay = moment().format('MM-DD-YYYY');
                if (product_data_selected.recurrence == _global_objects.currnt_config_product.json.include.var_config.product_model.RECURRENCE_CUSTOM) {                    
                    $.each(JSON.parse(product_data_selected.custom_date), function (key, value) {                      
                        if (moment(value.date).format('MM-DD-YYYY') < mDay) {                            
                            custom_count = custom_count + 1;
                            
                        }
                    })
                    if (custom_count == 0) {

                        document.getElementById('qty-' + product_number).disabled = true;
                        document.getElementById('editable-' + product_number).disabled = true;
                        document.getElementById('editable-' + product_number).checked = false;
                    } else {
                        notify({'title': 'Notification', 'message': 'Product expired'});
                        $('#product-'+product_number).val('').trigger('change');                       
                    }

                } else {
                    document.getElementById('qty-' + product_number).disabled = false;
                    document.getElementById('editable-' + product_number).disabled = false;
                }
                
                if (custom_count==0){               
                    
                product_object.product_id = product_data_selected.id;                
                product_object.product_name = product_data_selected.name;
                product_object.product_inv_price = product_data_selected.price;
                payment_link_component.products_list.push(product_object);
            }
            }
        });

        if ($(payment_link_component.htmlCont + ' #products-items .product-row').length > 2) {
            //help with a smooth scrol to the user just when there are more than 2 rows
            setTimeout(function () {
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(payment_link_component.htmlCont + ' #scrollto-' + product_number).offset().top
                }, 1000);
            }, 250);
        }

        $(payment_link_component.htmlCont + ' #product-' + product_number).select2('focus');
    },
    removeProductRow: function (product_number) {
        if ($(payment_link_component.htmlCont + ' .product-row').length == 1)
            return; //do not allow to remove all donation rows
        if($("#product-"+product_number+"").select2('val')){
           // payment_link_component.products_list = payment_link_component.products_list.filter(e=>e.product_id !== $("#product-"+product_number+"").select2('val'));
        }
        //slideup --
        $(payment_link_component.htmlCont + ' #item-' + product_number).slideUp(400, function () {
            $(payment_link_component.htmlCont + ' #item-' + product_number).remove();
        });

        setTimeout(function () {
            let i_row = 1;
            $.each($(payment_link_component.htmlCont + ' .product-row'), function () {
                $(this).find('.product-title').text(i_row);
                i_row++;
            });
            payment_link_component.count_products_removed++;
        }, 500); //wait till slideup -- important (we would not need setTimeout functions if dont using slideUp)
    },
    save: function () {
       let save_data = {};
       let products = [];
       let error = false;
       $(payment_link_component.htmlCont + ' form').find('.count').each((i,e) => {   
            let product = {};
            let product_list = payment_link_component.products_list.filter(f=>f.product_id == $("#product-"+$(e).attr('data-count')+"").select2('val'))[0];
            if(!product_list){            
                error = true;
            }else{            
                product.product_id = product_list.product_id
                product.product_name = product_list.product_name
                product.product_price = product_list.product_inv_price
                product.editable = $("#editable-"+$(e).attr('data-count')+"").prop("checked");                
                product.quantity = $("#qty-"+$(e).attr('data-count')+"").val();                                
                products.push(product);
            }
        });
        save_data.products = products;
        save_data.csrf_token = $("input[name=csrf_token]").val();
        save_data['organization_id'] = payment_link_component.organization_id;
        save_data['suborganization_id'] = payment_link_component.suborganization_id || null;
        save_data['payment_options'] = $(payment_link_component.htmlCont + ' .payment_options').select2('val');
        
        save_data['cover_fee'] = $(payment_link_component.htmlCont + ' input[name="cover_fee"]').is(':checked') ? 1 : 0;

        let trialEnabled = $(payment_link_component.htmlCont + ' #trial_enabled').is(':checked');
        
        if (trialEnabled) {
            let trialDays = parseInt($(payment_link_component.htmlCont + ' #trial_days').val()) || 0;
            
            save_data['trial_days'] = trialDays;
            
            if (trialEnabled && (!trialDays)) {
                notify({ title: 'Notification', message: 'Please provide a valid a trial days value.', align: 'center' });
                return;
            }
        }

        // Add post purchase link fields
        save_data['show_post_purchase_link'] = $(payment_link_component.htmlCont + ' input[name="show_post_purchase_link"]').is(':checked') ? 1 : 0;
        save_data['post_purchase_url'] = $(payment_link_component.htmlCont + ' input[name="post_purchase_url"]').val();

        loader('show');
        $.post(base_url + 'payment_links/save', save_data, function (result) {
            if (result.status) {
                $(payment_link_component.htmlCont + ' #main_modal').modal('hide');
                payment_link_component.notify({title: 'Notification', 'message': result.message});
                if (_global_objects.payment_links_dt) { //if the object is not set there is no need of refreshing
                    _global_objects.payment_links_dt.draw(false);
                }
            } else if (result.status == false) {
                $(payment_link_component.htmlCont).find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                $(payment_link_component.htmlCont).animate({scrollTop: 0}, 'fast'); //guide the user to see the error by scrolling to the top
            }
            loader('hide');         
            typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
        }).fail(function (e) {
            if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                alert(e.responseJSON.message);
                window.location.reload();
            }
            loader('hide');
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
