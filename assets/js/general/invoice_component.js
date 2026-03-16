$(document).ready(function () {
    invoice_component.set_modal();
    //invoice.initializeImasks();
});
var invoice_component = {
    htmlCont: '#invoice-component',
    reviewCont: '#reviewModal',
    transaction_dateImask: null,
    btn: null, // Button Clicked
    is_editing : false,
    hash : null,
    current_invoice: null,
    payment_options: _global_payment_options.US,
    organization_id: null, suborganization_id: null, organization_name: null, suborganization_name: null, //When invoice context is provided
    count_products_removed: 0,
    btnTrigger: '.btn-GENERAL-add-invoice', // ---- this is the button that launches de modal/component
    btnReview: '.btn-review',
    dollarUSLocale : Intl.NumberFormat('en-US',{minimumFractionDigits : 2,maximumFractionDigits : 2}),
    set_modal: function () {        
        let _self = this; 
        $(invoice_component.htmlCont + ' #main_form input').keypress(function (e) {
            if (e.which == 13) {
                return;
                invoice_component.save();
                e.preventDefault();
                return false;
            }
        });
  
        _self.set_payment_options();

        $(document).on('click', _self.btnReview, async function () {
            if($(_self.htmlCont + ' select[name="account_donor_id"]').val() == null) {
                notify({'title': 'Notification', 'message': 'Please choose a Customer', 'align' : 'center'});
                return false;
            }
            if($(invoice_component.htmlCont+ ' .email_total').attr('id')=='$0.00'){
                notify({'title': 'Notification', 'message': 'Add a valid product', 'align' : 'center'});
                return false;
            }
            var client = $(_self.htmlCont + ' select[name="account_donor_id"]').select2("data")[0]['text'];
            var total = $(invoice_component.htmlCont+ ' .email_total').attr('id');
            if(client && total){
                $('#review-invoice-data').html(`Send invoice for ${total} to ${client.split('-')[0]} ?`);
                $('#reviewModal').modal("show");
            } 
        });
        
        $(_self.htmlCont + ' #reviewModal').on('shown.bs.modal', function () {            
            $(_self.htmlCont + ' #reviewModal').find(".focus-first").first().focus();
        });

        $(document).on('click', _self.btnTrigger, async function () {      
             loader('show');
            
             invoice_component.current_invoice = {
                customer:{first_name:'',last_name:'',email:'', business_name:''},
                due_date:moment().add(1,'week').format('MM/DD/YYYY'),memo:'',reference:'IN00000000-####'
            };

            invoice_component.organization_name = _global_objects.currnt_org.orgName;
            invoice_component.suborganization_name = _global_objects.currnt_org.suborgName;
            invoice_component.organization_id = parseInt(_global_objects.currnt_org.orgnx_id);
            invoice_component.suborganization_id = parseInt(_global_objects.currnt_org.sorgnx_id);
                
            _self.count_products_removed = 0;
            invoice_component.btn = this;
            $(invoice_component.htmlCont + ' #main_form')[0].reset();
            $(invoice_component.htmlCont + ' .select2.donor').val(null).trigger('change');
            $(invoice_component.htmlCont + ' .select2.payment_options').val(Object.keys(_self.payment_options)).trigger('change');
            $(invoice_component.htmlCont + ' #products-list').empty();
            $(invoice_component.htmlCont + ' #due_date').val(moment().add(1,'week').format('MM/DD/YYYY'));
            $(invoice_component.htmlCont + ' #due_date').datepicker('update');
            $(invoice_component.htmlCont + ' #cover_fee').prop('checked',false);
            $(invoice_component.htmlCont + ' #show_post_purchase_link').attr('checked',false).trigger('change');      
            $(invoice_component.htmlCont + ' #paymentMethodsWrapper').hide();
            $(invoice_component.htmlCont + ' #auto_charge').prop('checked', false);
          
            if (typeof $(this).attr('data-donor_id') !== 'undefined') {
                invoice_component.donor_id = $(this).attr('data-donor_id');
            }

            if (typeof $(this).attr('data-hash') !== 'undefined') {
                _self.is_editing = true;
                _self.hash = $(this).attr('data-hash');
                await $.post(base_url + 'invoices/get/'+ _self.hash, function (result) { // Update Setting
                    _self.current_invoice = result;
                    if(result.due_date) {
                        $(invoice_component.htmlCont + ' #due_date').val(moment(result.due_date).format('MM/DD/YYYY'));
                        $(invoice_component.htmlCont + ' #due_date').datepicker('update');
                    }
                    $(_self.htmlCont + ' #component_title').html('Update Invoice');
                    let customerName = result.customer.first_name;
                    customerName += result.customer.last_name ? ' ' + result.customer.last_name : '';
                    customerName += ' - ' + result.customer.email;
                    $(_self.htmlCont + ' textarea[name="memo"]').val(result.memo);
                    $(_self.htmlCont + ' textarea[name="footer"]').val(result.footer);

                    $(_self.htmlCont + ' select[name="account_donor_id"]').select2("trigger", "select", {data: {id: result.donor_id, text: customerName, first_name: result.customer.first_name, last_name: result.customer.last_name}});
                    
                    if(result.payment_method_id) {                        
                        $(invoice_component.htmlCont + ' #auto_charge').prop('checked', true).change(); // change to show the list "** Auto Charge"                       
                        $(_self.htmlCont + ' select[name="payment_method_id"]').val(result.payment_method_id).trigger('change');
                    } else {
                        $(invoice_component.htmlCont + ' #auto_charge').prop('checked', false).change(); // change to show the list                        
                    }

                    $(invoice_component.htmlCont + ' .select2.payment_options').val(JSON.parse(result.payment_options)).trigger('change');
                    $(invoice_component.htmlCont + ' input[name="post_purchase_url"]').val(result.post_purchase_link);
                    $(invoice_component.htmlCont + ' #show_post_purchase_link').attr('checked',result.show_post_purchase_link).trigger('change');
                    $(invoice_component.htmlCont + ' #cover_fee').prop('checked',result.cover_fee);
                                                          
                    if(result.products.length > 0) {
                        $.each(result.products, async function (key, value) {
                            await _self.addProductRow(value);
                            $(_self.htmlCont + ' #product-' + (key + 1)).select2("trigger", "select", {data: {'id': value.product_id, name: value.product_name,
                                    text: value.product_name + ' ($' + invoice_component.dollarUSLocale.format(value.product_inv_price) + ')', price: value.product_inv_price }});
                            $(_self.htmlCont + ' input[name="quantity[' + (key + 1) + ']"').val(value.quantity);
                        })
                    } else {
                        _self.addProductRow();
                    }
                }).fail(function (e) {
                    console.log(e);
                });

            } else { // Create Setting
                $(_self.htmlCont + ' #component_title').html('Create Invoice');
                _self.hash = null;
                _self.addProductRow();
            }

            if(!_self.is_editing) {
                if (typeof $(this).attr('data-org_id') === 'undefined' || $(this).attr('data-org_id').length === 0) {
                    notify({'title': 'Notification', 'message': 'Please choose an organization'});
                    loader('hide');
                    return false;
                }
            }

            if (typeof $(this).attr('data-context') !== 'undefined') {
                if ($(this).attr('data-context') == 'invoice') {                                        
                    
                    if (!invoice_component.suborganization_id) {
                       $(invoice_component.htmlCont + ' .organization_name').html(invoice_component.organization_name);
                    } else {
                        $(invoice_component.htmlCont + ' .organization_name').html(invoice_component.organization_name + ' <span style="font-weight: normal;" > / </span> ' + invoice_component.suborganization_name);
                    }
                    $(invoice_component.htmlCont + ' .subtitle').show();
                }
            }

            if (typeof $(this).attr('data-context') !== 'undefined') {
                if ($(this).attr('data-context') == 'customer_datatable' || $(this).attr('data-context') == 'customer_datatable_profile'  ) {                
                    $('#invoice-component select[name="account_donor_id"]').prop('disabled', true);
                    $('#invoice-component select[name="account_donor_id"]').select2("trigger", "select", {data: {id: $(this).attr('data-donor_id'), text: $(this).attr('data-donor_name')+' - '+$(this).attr('data-donor_email'),first_name: $(this).attr('data-donor_name')}});                          
                    
                    invoice_component.current_invoice.customer.business_name = $(this).attr('data-donor_business_name');
                    
                    if (!invoice_component.suborganization_id) {
                        $(invoice_component.htmlCont + ' .organization_name').html(invoice_component.organization_name);
                    } else {
                        $(invoice_component.htmlCont + ' .organization_name').html(invoice_component.organization_name + ' <span style="font-weight: normal;" > / </span> ' + invoice_component.suborganization_name);
                    }
                 $(invoice_component.htmlCont + ' .subtitle').show();
                }
            }

            //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
            //transaction.transaction_dateImask.value = '';
            //invoice.transaction_dateImask.value = moment().format("L");

            $(invoice_component.htmlCont + ' #main_modal').find('.alert-validation').first().empty().hide();
            $(invoice_component.htmlCont + ' #main_modal').modal('show');

            invoice_component.update_preview();
            loader('hide');
        });

        $(invoice_component.htmlCont + ' #main_modal').on('show.bs.modal', function () {
            setup_multiple_modal(this);
        });
        
        $(invoice_component.htmlCont + ' #reviewModal').on('show.bs.modal', function () {
            setup_multiple_modal(this);
        });

        $(this.htmlCont).on('shown.bs.modal', function () {
            //$('#add_transaction_modal').find(".focus-first").first().focus();
        });

        $(document).on('click', invoice_component.htmlCont + ' .btn-save', function () {         
            invoice_component.save('save_only');
        });

        $(document).on('click',   invoice_component.reviewCont +' .btn-send', function () {
            invoice_component.save('save_and_send');
        });      
        $(invoice_component.htmlCont + ' .select2.donor').select2({          
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
                        organization_id: invoice_component.organization_id,
                        suborganization_id: invoice_component.suborganization_id,
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

            let disabled = invoice_component.organization_id ? '' : 'disabled';

            a.$results.parents('.select2-results')
                    .append('<div class="select2-link2 donor"><button class="btn btn-primary btn-GENERAL-person-component" ' + disabled + ' data-is_select2_id="' + invoice_component.htmlCont + ' .select2.donor" data-is_select2="true" ' +
                            ' data-context="invoice" data-org_id="' + invoice_component.organization_id + '" data-org_name="' + invoice_component.organization_name +
                            '" data-suborg_id="' + invoice_component.suborganization_id + '" data-suborg_name="' + invoice_component.suborganization_name +
                            '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                            ' <i class="fas fa-user"></i> Create Customer</button></div>')

        }).on('select2:select',function () {
            if($(this).select2('data')[0]){
                let customer_data = $(this).select2('data')[0];
                
                $(invoice_component.htmlCont + ' input[name="auto_charge"]').prop('checked',false).change();
                
                invoice_component.current_invoice.customer = {};
                invoice_component.current_invoice.customer.first_name = customer_data.first_name;
                invoice_component.current_invoice.customer.last_name = customer_data.last_name;
                invoice_component.current_invoice.customer.email = customer_data.email;
                invoice_component.current_invoice.customer.business_name = customer_data.business_name;
            }
            invoice_component.update_preview();
        });

        $(invoice_component.htmlCont + ' .select2.payment_options').select2({
            tags: false,
            multiple: true,
            placeholder: 'Select Payment Options',
        });

        $(document).on('click', invoice_component.htmlCont + ' .btn-add-product', function () {
            invoice_component.addProductRow();
        });

        $(document).on('change','.product_quantity',function () {
            let index_product = $('#products-list .product-row').index($(this).parents('.product-row'));
            let product_object = invoice_component.current_invoice.products[index_product];
            product_object.quantity = $(this).val();
            invoice_component.update_preview();
        });

        $(document).on('change','textarea[name="memo"]',function () {
            invoice_component.current_invoice.memo = $(this).val();
            invoice_component.update_preview();
        });

        $(document).on('change','input[name="due_date"]',function () {
            invoice_component.current_invoice.due_date = $(this).val();
            invoice_component.update_preview();
        });

        $(document).on('change','input[name="cover_fee"]',function () {
            invoice_component.current_invoice.cover_fee = $(this).is(':checked');
            invoice_component.update_preview();
        });

        $(document).on('change','input[name="show_post_purchase_link"]',function () {
            if($(this).is(':checked')){
                $('input[name="post_purchase_url"]').attr('disabled',false)
            } else {
                $('input[name="post_purchase_url"]').attr('disabled',true)
            }
        });

        invoice_component.set_payment_methods();

        invoice_component.get_branding_data();

        window.addEventListener("storage", function(event){
            if(event.key == 'preview_style'){
                let _newValue = JSON.parse(event.newValue);
                if(_newValue.current_org.orgnx_id == _global_objects.currnt_org.orgnx_id &&
                    _newValue.current_org.sorgnx_id == _global_objects.currnt_org.sorgnx_id) {
                    $('.email_invoice .email_invoice_logo').attr('src',_newValue.logo);
                    if(_newValue.logo) {
                        $('.email_invoice .email_invoice_logo').show();
                    } else {
                        $('.email_invoice .email_invoice_logo').hide();
                    }
                    $('#css_preview').html(_newValue.style);
                }
            }
        });
    },

    set_payment_methods : function () {
        const $wrapper = $(invoice_component.htmlCont + ' #paymentMethodsWrapper');
        
        const $select = $wrapper.find('select[name="payment_method_id"]');

        $(invoice_component.htmlCont + ' select[name="payment_method_id"]').select2({
            tags: false,
            multiple: false,
            placeholder: 'Select Payment Method',
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
            
        });;

        $(document).on('change', 'input[name="auto_charge"]', async function () {
            
            const isChecked = $(this).is(':checked');
            
            if (!isChecked) {
                $wrapper.hide();
                // Reset Select2 and disable it
                $select.val(null).trigger('change');
                $select.prop('disabled', true);
                return;
            }
        
            const customer_id = $(invoice_component.htmlCont + ' .donor').select2('val');
            
            if (!customer_id) {
                $(this).prop('checked', false);
                notify({ title: 'Notification', message: 'Please select a customer.', align: 'center' });
                return;
            }
        
            $wrapper.show();
            
            // Clear existing options and show loading state
            $select.empty().append('<option value="">Loading...</option>').prop('disabled', true);
        
            let sourcesData;
        
            try {
                const data = {
                    customer_id: customer_id,
                    org_id: invoice_component.organization_id,
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
                $wrapper.hide();
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
                const selectedID = invoice_component.current_invoice.payment_method_id 
                                    ? invoice_component.current_invoice.payment_method_id
                                    : sourcesData.data[0].id;
                
                $select.val(selectedID).trigger('change');
            } else {
                $wrapper.hide();
                $select.prop('disabled', true);
                $(this).prop('checked', false);
                notify({ title: 'Notification', message: 'No payment methods found for this customer. You can add one from the customer profile.', align: 'center' });
            }
        });              
    },

    set_payment_options : function () {
        $.each(invoice_component.payment_options,function(key,value){
             $(invoice_component.htmlCont+' .select2.payment_options').append($('<option>', {value: key}).text(value));
        })
    },
    addProductRow: async function (_product = null) {
        let product_row = $(invoice_component.htmlCont + ' form .product-row').length + 1;
        let product_number = product_row + invoice_component.count_products_removed;

        $(invoice_component.htmlCont + ' form #products-list').append(`
                <div id="item-` + product_number + `" class="form-group row product-row mb-1" style="display: none">
                    <div class="col-12 bold-weight py-2">
                        <span class="badge badge-secondary bold-weight" style="margin-left: -3px;">
                            product <span class="product-title">` + product_row + `</span>
                        </span>
                        <span style="cursor:pointer; font-size:11px; color:#7a7a7a; float:right;" class="ml-2 badge remove-product-row-btn" id="remove-product-row-btn-` + product_number + `" data-product_id="` + product_number + `">
                            Remove
                        </span>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="form-group">
                            <label><strong>Product</strong></label>
                            <select id="product-` + product_number + `" class="form-control select2 product" name="product_id[` + product_number + `]" >
                            </select>
                        </div>
                    </div>
                    
                    <div class="col-md-2">
                        <div class="form-group">
                            <label><strong>Quantity</strong></label>
                            <input type="number" min="0" value="1" class="form-control product_quantity" name="quantity[` + product_number + `]" placeholder="0">
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

        $(invoice_component.htmlCont + ' #item-' + product_number).fadeIn('fast');

        $(invoice_component.htmlCont + ' #remove-product-row-btn-' + product_number).on('click', function () {
            invoice_component.removeProductRow($(this).attr('data-product_id'));
        });

        $(invoice_component.htmlCont + ' #product-' + product_number).select2({
            tags: false,
            multiple: false,
            placeholder: 'Select a Product',
            templateResult: function (data){
                return $(`<span data-name="${data.name}" data-price="${data.price}">${data.text}</span>`);
            },
            ajax: {
                url: function () {
                    return base_url + 'products/get_tags_list_pagination_one_time';
                },
                type: "post",
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    return {
                        organization_id: invoice_component.organization_id,
                        suborganization_id: invoice_component.suborganization_id,
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
            if ($('.select2-link2.product').length) {
                $('.select2-link2.product').remove();
            }

            let disabled = invoice_component.organization_id ? '' : 'disabled';

            a.$results.parent('.select2-results')
                    .append('<div class="select2-link2 product"><button class="btn btn-primary btn-GENERAL-product-component" ' + disabled + ' data-is_select2_id="' + invoice_component.htmlCont + ' #product-' + product_number + '" data-is_select2="true" ' +
                            ' data-context="invoices" data-org_id="' + invoice_component.organization_id + '" data-org_name="' + invoice_component.organization_name +
                            '" data-suborg_id="' + invoice_component.suborganization_id + '" data-suborg_name="' + invoice_component.suborganization_name +
                            '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                            ' <i class="fas fa-box-open"></i> Create Product</button></div>')
        }).on('select2:select', function () {
            if($(this).select2('data')[0]){
                let index_product = $(invoice_component.htmlCont+ ' #products-list .product-row').index($(this).parents('.product-row').get(0));
                let product_data_selected = $(this).select2('data')[0];
                let product_object = invoice_component.current_invoice.products[index_product];
                product_object.product_id = product_data_selected.id;
                product_object.product_name = product_data_selected.name;
                product_object.product_inv_price = product_data_selected.price;
            }
            invoice_component.update_preview();
        });

        if ($(invoice_component.htmlCont + ' #products-items .product-row').length > 2) {
            //help with a smooth scrol to the user just when there are more than 2 rows
            setTimeout(function () {
                $([document.documentElement, document.body]).animate({
                    scrollTop: $(invoice_component.htmlCont + ' #scrollto-' + product_number).offset().top
                }, 1000);
            }, 250);
        }

        $(invoice_component.htmlCont + ' #product-' + product_number).select2('focus');

        if(_product)
            _product.element = 'item-' + product_number;
        else {
            if(!invoice_component.current_invoice.products)
                invoice_component.current_invoice.products = [];
            invoice_component.current_invoice.products.push({id:null,quantity:1});
        }
    },
    removeProductRow: function (product_number) {
        if ($(invoice_component.htmlCont + ' .product-row').length == 1)
            return; //do not allow to remove all donation rows

        let product_index = $(invoice_component.htmlCont+ ' #products-list .product-row').index($('#item-' + product_number));
        invoice_component.current_invoice.products.splice(product_index,1);
        //slideup --
        $(invoice_component.htmlCont + ' #item-' + product_number).slideUp(400, function () {
            $(invoice_component.htmlCont + ' #item-' + product_number).remove();
        });

        invoice_component.update_preview();

        setTimeout(function () {
            let i_row = 1;
            $.each($(invoice_component.htmlCont + ' .product-row'), function () {
                $(this).find('.product-title').text(i_row);
                i_row++;
            });
            invoice_component.count_products_removed++;
        }, 500); //wait till slideup -- important (we would not need setTimeout functions if dont using slideUp)

    },
    save: function (command) {
        loader('show');
        let save_data = {};
        if($('#optional-email').val()){
            const emailEleRegex = new RegExp('[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-zA-Z]{2,4}');
            if (!emailEleRegex.test($('#optional-email').val())) {
                notify({title: 'Notification', 'message': 'A valid email is required'});
                loader('hide');
                return false;
            } 
            save_data['optional_email'] = $('#optional-email').val();
        }
        let data = $(invoice_component.htmlCont + ' form').serializeArray();
        $.each(data, function () {
            save_data[this.name] = this.value;             
        });             

       if($(invoice_component.btnTrigger).attr('data-context') == 'customer_datatable' || $(invoice_component.btnTrigger).attr('data-context')=='customer_datatable_profile'){
         save_data['account_donor_id'] = $(invoice_component.htmlCont + ' .donor').select2('val');   
        }                      
        save_data['organization_id'] = invoice_component.organization_id;
        save_data['suborganization_id'] = invoice_component.suborganization_id;
        save_data['payment_options'] = $(invoice_component.htmlCont + ' .payment_options').select2('val');
        save_data['command'] = command;
        save_data['hash'] = invoice_component.hash;        
        save_data['payment_method_id'] = $(invoice_component.htmlCont + ' #payment_method_id').select2('val');
        
        $.post(base_url + 'invoices/save', save_data, function (result) {
            if (result.status) {               
                $(invoice_component.htmlCont + ' #main_modal').modal('hide');
                $('#reviewModal').modal('hide');

                invoice_component.notify({title: 'Notification', 'message': result.message});
                if (typeof result.emailResponse !== 'undefined' && result.emailResponse !== null && result.emailResponse.status == true) {
                    invoice_component.notify({title: 'Notification', 'message': result.emailResponse.message});
                } 
                
                if (typeof result.paymentResponse !== 'undefined' && result.paymentResponse !== null) {
                    if(result.paymentResponse.status === false) {
                        error_message('<p>Payment error details</p> ' + '<p>' +result.paymentResponse.message + '</p>');                        
                    } else {
                        success_message('<p>Invoices paid.</p>');
                    }
                } 
                
                if ($(invoice_component.btnTrigger).attr('data-context') == 'customer_datatable' || $(invoice_component.btnTrigger).attr('data-context') == 'customer_datatable_profile') {
                    setTimeout(() => {
                        if (command == 'save_only') {
                            window.location.href = `${base_url}invoices`;
                        }
                        if (command == 'save_and_send') {
                            window.location.href = `${base_url}invoices/view/${result.data.id}`;
                        }    
                    }, 5000);
                    
                } else {             
                    if (_global_objects.invoices_dt) {
                        _global_objects.invoices_dt.draw(false);
                    }
                }
            } else if (result.status == false) {
                $(invoice_component.htmlCont).find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");

                $(invoice_component.htmlCont).animate({scrollTop: 0}, 'fast');
            }
            
            if(typeof result.emailResponse !== 'undefined' && result.emailResponse !== null && result.emailResponse.status == false) {
                error_message(result.emailResponse.message);
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
    update_preview: function(){
        $(invoice_component.htmlCont+ ' .email_invoice .email_organization').text(_global_objects.currnt_org.orgName);
        $(invoice_component.htmlCont+ ' .email_invoice .email_header_title').text('Invoice From '+_global_objects.currnt_org.orgName);
        if(invoice_component.current_invoice){
            let first_name = invoice_component.current_invoice.customer.first_name;
            let last_name = invoice_component.current_invoice.customer.last_name;
            let business_name = invoice_component.current_invoice.customer.business_name;;
            $(invoice_component.htmlCont+ ' .email_invoice .email_customer').text((first_name ? first_name : '-') + ' ' + (last_name ? last_name : ' '));
            $(invoice_component.htmlCont+ ' .email_invoice .email_business_name').text(business_name ? business_name : '-');
            $(invoice_component.htmlCont+ ' .email_invoice .email_reference').text(invoice_component.current_invoice.reference);

            let email_products = '';
            let base_total = 0;

            $.each(invoice_component.current_invoice.products,function (key,value) {
                if(value.product_name) {
                    email_products += `
                   <tr style="border-bottom: #ededed solid 0.5px;padding-bottom: 5px;">
                        <td style="border: 0;border-collapse: collapse; margin: 0;padding: 4px 0; width: 50%; ">
                            <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;word-break: break-word;" >
                                &nbsp; ${value.product_name ? value.product_name : ''}
                            </span>
                            <br>
                            <span style="color: #999999;font-size: 12px;line-height: 14px;">
                                &nbsp;&nbsp; Qty ${value.quantity}
                            </span> 
                        </td>
                        <td style="border: 0;border-collapse: collapse; margin: 0; width: 50%; text-align:right">
                            <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;">
                                &nbsp;&nbsp; \$${value.product_inv_price ? invoice_component.dollarUSLocale.format(value.product_inv_price) : 0} &nbsp;
                            </span>
                        </td>
                    </tr>`;
                    base_total += (parseFloat(value.product_inv_price) * value.quantity ? parseFloat(value.product_inv_price) * value.quantity : 0);
                }
            });

            $(invoice_component.htmlCont + ' .cover-fee-container, .no-cover-fee-container').hide();
            if(invoice_component.current_invoice.cover_fee){
                // Adding Fee on Products List
                
                const { 
                    newTotal, 
                    newTotalFee, 
                    newTotalAmex, 
                    newTotalAmexFee, 
                    newTotalAch, 
                    newTotalAchFee
                } = invoice_component.calcTotalWithFee(base_total);

                email_products += `
                <tr style="border-bottom: #ededed solid 0.5px;padding-bottom: 5px;">
                    <td style="padding:8px; border: 0;border-collapse: collapse; margin: 0;padding: 0;width: 50%; ">
                        <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;word-break: break-word;" >
                            &nbsp;&nbsp; Subtotal
                        </span>
                    </td>
                    <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;padding:8px; width: 50%;">
                        <span style="color: #1A1A1A;font-size: 14px;line-height: 25px; float:right;">
                            <b>\$${invoice_component.dollarUSLocale.format(base_total)}</b>&nbsp;
                        </span>
                    </td>
                </tr>
                <tr style="border-bottom: #ededed solid 0.5px;padding-bottom: 5px;">
                    <td style="padding:8px; border: 0;border-collapse: collapse; margin: 0;padding: 0;width: 50%; ">
                        <span style="color: #1A1A1A;font-size: 14px;line-height: 16px; word-break: break-word;" >
                            &nbsp;&nbsp; Processing Fee
                        </span>
                    </td>
                    <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;padding:8px; width: 50%;">
                        <span style="color: #1A1A1A;font-size: 14px;line-height: 25px; float:right">

                        Regular card: \$${invoice_component.dollarUSLocale.format(newTotalFee)}&nbsp;<br>
                        Amex: \$${invoice_component.dollarUSLocale.format(newTotalAmexFee)}&nbsp;<br>
                        Ach: \$${invoice_component.dollarUSLocale.format(newTotalAchFee)}&nbsp;
                        </span>
                    </td>
                </tr>`;

                $(invoice_component.htmlCont + ' .email_invoice .email_total_regular').text('$' + invoice_component.dollarUSLocale.format(newTotal));
                $(invoice_component.htmlCont + ' .email_invoice .email_total_amex').text('$' + invoice_component.dollarUSLocale.format(newTotalAmex));
                $(invoice_component.htmlCont + ' .email_invoice .email_total_ach').text('$' + invoice_component.dollarUSLocale.format(newTotalAch));
                
                $(invoice_component.htmlCont + ' .cover-fee-container').show();
            } else {
                $(invoice_component.htmlCont + ' .no-cover-fee-container').show();
            }

            $(invoice_component.htmlCont+ ' .email_invoice .email_products').html(email_products);

            $(invoice_component.htmlCont+ ' .email_invoice .email_total').text('$'+invoice_component.dollarUSLocale.format(base_total));
            $(invoice_component.htmlCont+ ' .email_invoice .email_total').attr('id','$'+invoice_component.dollarUSLocale.format(base_total));                
            
            $(invoice_component.htmlCont+ ' .email_invoice .email_memo').html(invoice_component.current_invoice.memo ? invoice_component.current_invoice.memo : '-');
            $(invoice_component.htmlCont+ ' .email_invoice .email_due_date').html('Due '+moment(invoice_component.current_invoice.due_date).format('LL'));

        } else {
            $(invoice_component.htmlCont+ ' .email_invoice .email_total').text('$0');
            $(invoice_component.htmlCont+ ' .email_invoice .email_customer').text('');
            $(invoice_component.htmlCont+ ' .email_invoice .email_reference').text('-');
            $(invoice_component.htmlCont+ ' .email_invoice .email_products').html('');
            $(invoice_component.htmlCont+ ' .email_invoice .email_memo').html('');
            $(invoice_component.htmlCont+ ' .email_invoice .email_due_date').html('');
        }
    },
    roundToTwoDecimals: (value) => Math.round(parseFloat(value) * 100) / 100,  
    calcTotalWithFee: function(t){
        
        const applyFormula = (total, kte, var_fee) => 
            (parseFloat(total) + parseFloat(kte)) / (1 - parseFloat(var_fee));
        
        
        const { fortis_template: tpl } = _global_objects.currnt_org_with_fts_tpl;
        
        const total = parseFloat(t);

        const newTotal = applyFormula(total, tpl.kte_cc, tpl.var_cc); //regular card
        const newTotalFee = newTotal - total;
        
        const newTotalAmex = applyFormula(total, tpl.kte_cc_amex, tpl.var_cc_amex); //amex card
        const newTotalAmexFee = newTotalAmex - total;

        const newTotalAch = applyFormula(total, tpl.kte_bnk, tpl.var_bnk); //ach
        const newTotalAchFee = newTotalAch - total;

        return {
            newTotal: invoice_component.roundToTwoDecimals(newTotal),
            newTotalFee: invoice_component.roundToTwoDecimals(newTotalFee),

            newTotalAmex: invoice_component.roundToTwoDecimals(newTotalAmex),
            newTotalAmexFee: invoice_component.roundToTwoDecimals(newTotalAmexFee),

            newTotalAch: invoice_component.roundToTwoDecimals(newTotalAch),
            newTotalAchFee: invoice_component.roundToTwoDecimals(newTotalAchFee),
        }
        
    },
    get_branding_data: async function(){
        await $.get(base_url + 'settings/get_branding/'+_global_objects.currnt_org.orgnx_id+
            (_global_objects.currnt_org.sorgnx_id ? '/'+_global_objects.currnt_org.sorgnx_id : ''),function (result) {
            if(result.data) {
                if (result.data.logo) {
                    $('.email_invoice .email_invoice_logo').show();
                    $('.email_invoice .email_invoice_logo').attr('src', base_url + 'files/get/' +  result.data.logo);
                } else {
                    $('.email_invoice .email_invoice_logo').hide();
                }
                let theme_color = result.data.theme_color ? result.data.theme_color : '#000000';
                let text_theme_color = helpers.getTextColor(theme_color);
                let style = `
                    .theme_color{
                        background: ${theme_color} !important;
                    }.theme_foreground_color{
                        color: ${theme_color} !important;
                    }
                    .text_theme_color{
                        color: ${text_theme_color} !important;
                    }
                    .email_background_color{
                        background: ${result.data.button_text_color ? result.data.button_text_color : '#F8F8F8'} !important;
                    }
                `;
                $('#css_preview').html(style);
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
