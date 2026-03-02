
$(document).ready(function () {
    product_component.init();
});

var product_component = {
    htmlCont: '#product-component',
    product_id: null,
    org_id: null,
    org_name: null,
    suborg_id: null,
    suborg_name: null,
    is_select2: false,
    select2_id: null,
    image_changed: 0,
    digital_content_changed: 0,
    count_customerdate_removed: 0,
    btnTrigger: '.btn-GENERAL-product-component', // ---- this is the button that lanunches de modal/component
    context: null, // ---- depending on the context the component will adopt specific behaviors, it is set on btn trigger
    init: function () {
        this.setBtnTriggerEvent();
        this.set_modal();
    },
    setBtnTriggerEvent: function () {
        let _self = this;
        $(document).on('click', _self.btnTrigger, async function () {
            loader('show');
            _self.count_customerdate_removed = 0;
            _self.image_changed = 0; //let the backend know when to save an image or not
            _self.digital_content_changed = 0; //let the backend know when to save an digital content or not

            _self.context = $(this).attr('data-context');
            if (!_self.context && typeof $(this).attr('data-is_select2') != 'undefined') {
                _self.context = 'invoices'; //change this verifyx
            }

            $(_self.htmlCont + ' .subtitle').hide();
            $(_self.htmlCont + ' #product_component_form')[0].reset();
            $(_self.htmlCont + ' #product_component_form select[name="recurrence"]').trigger('change');
            $(_self.htmlCont + ' #digital_content_label').text($(_self.htmlCont + ' #digital_content_label').attr('data-default-text'));
            $(_self.htmlCont + '').find('.alert-validation').first().empty().hide();
            $(_self.htmlCont + ' .btn-save').text('Create Product');
            $(product_component.htmlCont + ' #customerdate-list').empty();
            _self.addCustomerDateRow();

            _self.org_id = null;
            if (_self.context === 'products' || _self.context === 'invoices' || _self.context === 'payment_link' || _self.context === 'recurring') {
                let $btn = $('button' + _self.btnTrigger); //read "<button>" do not read "<a>"
                if (typeof $btn.attr('data-org_id') === 'undefined' || $btn.attr('data-org_id').length === 0) {
                    notify({'title': 'Notification', 'message': 'Please choose an organization'});
                    loader('hide');
                    return false;
                }
                //filters provided:
                _self.org_id = parseInt($btn.attr('data-org_id'));
                _self.suborg_id = parseInt($btn.attr('data-suborg_id'));

                _self.org_name = $btn.attr('data-org_name');
                _self.suborg_name = $btn.attr('data-suborg_name');

                $(_self.htmlCont + ' .organization_name').html(_self.org_name
                        + (_self.suborg_id ? ' <span style="font-weight: normal;" > / </span> ' + _self.suborg_name : ''));

                $(_self.htmlCont + ' .subtitle').show(); //it wraps the organization name

            }

            if (_self.context === 'invoices') {
                _self.select2_id = $('button' + _self.btnTrigger).attr('data-is_select2_id');
                $(_self.htmlCont + ' .recurrence_options').hide();
                $(_self.select2_id).select2('close');
            }

            if (_self.context === 'payment_link') {
                _self.select2_id = $('button' + _self.btnTrigger).attr('data-is_select2_id');
                $(_self.select2_id).select2('close');
            }

            if (_self.context === 'recurring') {
                _self.select2_id = $('button' + _self.btnTrigger).attr('data-is_select2_id');
                $(_self.select2_id).select2('close');
            }

            if (typeof $(this).attr('data-product_id') !== 'undefined') { // Update Setting load data
                $(_self.htmlCont + ' .btn-save').text('Update Product');
                await $.post(base_url + 'product/get', {id: _self.product_id}, async function (result) {
                    $(_self.htmlCont + ' input[name="name"]').val(result.name);
                    $(_self.htmlCont + ' input[name="description"]').val(result.description);
                    $(_self.htmlCont + ' input[name="price"]').val(result.price);
                }).fail(function (e) {
                    console.log(e);
                });
            }

            $(_self.htmlCont).modal('show');           
            ////////////////////////
        });
    },
    set_modal: function () {
        let _self = this;
        $(_self.htmlCont + ' input').keypress(function (e) {
            if (e.which == 13) {
                _self.save();
                e.preventDefault();
                return false;
            }
        });

        $(_self.htmlCont).on('show.bs.modal', async function () {
            setup_multiple_modal(this);
        });

        $(_self.htmlCont).on('shown.bs.modal', async function () {
            $(_self.htmlCont).find(".focus-first").first().focus();
            loader('hide');
        });

        $(_self.htmlCont + ' select[name="recurrence"]').change(function () {
            if ($(this).val() == 'O') {
                $(_self.htmlCont + ' #billing_period_container').hide();
                $(_self.htmlCont + ' #start_subscription_slider').hide();
                $(_self.htmlCont + ' #customerdate-list').hide();
                $(_self.htmlCont + ' #start_subscription_system').prop('checked', false);  
                $(_self.htmlCont + ' #text_subscription_slider').hide();
                
            } else if ($(this).val() == 'R') {
                $(_self.htmlCont + ' #billing_period_container').show();
                $(_self.htmlCont + ' #start_subscription_slider').show();
                $(_self.htmlCont + ' #customerdate-list').hide();
                $(_self.htmlCont + ' #text_subscription_slider').show();
            } else if ($(this).val() == 'C') {
                $(_self.htmlCont + ' #customerdate-list').show();
                $(_self.htmlCont + ' #billing_period_container').hide();
                $(_self.htmlCont + ' #start_subscription_slider').hide();
                $(_self.htmlCont + ' #start_subscription_system').prop('checked', false);
                $(_self.htmlCont + ' #text_subscription_slider').hide();

            }    
            
        });        
        $(document).on('click', _self.htmlCont + ' .btn-save', function () {
            _self.save();
        });
        
         $(document).on('click', _self.htmlCont + ' .btn-add-customerdate', function () {         
           
            _self.addCustomerDateRow();
            
        });
        

        //Disable Auto Upload Dropzone
        var logo_dropzone = Dropzone.forElement('#image_dropzone');
        logo_dropzone.options.autoProcessQueue = false;
        logo_dropzone.options.autoDiscover = false;

        logo_dropzone.on('addedfile', function (file) {
            var reader = new FileReader();
            reader.onload = function () {
                var dataURL = reader.result;
                $('.image-temporal').remove();
                _self.logo_image = file;
                _self.logo_image_demo = dataURL;
                _self.image_changed = 1;
            };
            reader.readAsDataURL(file);
        });

        $(_self.htmlCont +' #digital_content').change(function (e) {
            if(e.target.files && e.target.files[0]){
                _self.digital_content_changed = 1;
                $('#digital_content_label').text(e.target.files[0].name);
            }
        })
    },
    save: function () {
        let _self = this;
        loader('show');
        
        let save_data = new FormData($(_self.htmlCont + " #product_component_form")[0]);
        save_data.append('id', _self.product_id);
        if (_self.image_changed === 1) {
            save_data.append('image_changed', _self.image_changed);
            save_data.append('image', _self.logo_image);
            _self.image_changed = 0;
        }
        if(_self.digital_content_changed){
            save_data.append('digital_content_changed', _self.digital_content_changed);
            _self.digital_content_changed = 0;
        }
        if (_self.org_id)
            save_data.append('organization_id', _self.org_id);

        if (_self.suborg_id)
            save_data.append('suborganization_id', _self.suborg_id);

        $.ajax({
            url: base_url + 'products/save', type: "POST",
            processData: false,
            contentType: false,
            data: save_data,
            success: function (result) {
                if (result.status) {
                    // ------ PRE COMMON LINES
                    $(_self.htmlCont).modal('hide');
                    if (_self.context === 'invoices' || _self.context === 'payment_link' || _self.context === 'recurring') {                        
                        notify({title: 'Notification', 'message': result.message, 'align': 'center'});                        
                    } else {                        
                        notify({title: 'Notification', 'message': result.message});
                    }

                    // --------------------------

                    if (_self.context === 'products') {
                        _global_objects.products_dt.draw(false);
                    } else if (_self.context === 'invoices' || _self.context === 'payment_link' || _self.context === 'recurring') {                                                                       
                        $(_self.select2_id).select2("trigger", "select", {data: {'id': result.data.id, text: result.data.name,name: result.data.product_name, price: result.data.price,recurrence:result.data.recurrence,custom_date: result.data.custom_date}});
                    }

                } else if (result.status == false) {
                    $(_self.htmlCont).find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                    $(_self.htmlCont).animate({scrollTop: 0}, 'fast'); //guide the user to see the error by scrolling to the top
                }
                loader('hide');

                typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';

            },
            error: function (jqXHR, textStatus, errorJson) {
                if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                    alert(e.responseJSON.message);
                    window.location.reload();
                }
                loader('hide');
            }
        });
    },
    //Show Image on dropzone
    setImage: function (url) {
        var logo_element = $('#image_dropzone');
        var preview = logo_element.find('.dz-preview');
        if (url !== null) {
            var content_preview = `<div class="dz-preview-cover dz-image-preview image-temporal">
                        <img class="dz-preview-img" src="" data-dz-thumbnail="" 
                        style="max-width: 200px;margin: 0 auto; display: flex;">
                        </div>`;
            preview.append(content_preview);
            logo_element.addClass('dz-max-files-reached');
            logo_element.find('img').prop('src', url);
        } else {
            preview.empty();
            logo_element.removeClass('dz-max-files-reached');
        }
    },
      addCustomerDateRow: async function () {
        let customerdate_row = $(product_component.htmlCont + ' form .customerdate-row').length + 1;         
        let customerdate_number = customerdate_row + product_component.count_customerdate_removed;      

        $(product_component.htmlCont + ' form #customerdate-list').append(`
        <div id="item-` + customerdate_number + `" class="form-group row customerdate-row mb-1" >
            <div class="col-12 bold-weight py-2">
                        <span class="badge badge-secondary bold-weight" style="margin-left: -3px;">
                            Date customer <span class="customerdate-title">` + customerdate_row + `</span>
                        </span>
                        <span style="cursor:pointer; font-size:11px; color:#7a7a7a; float:right;" class="ml-2 badge remove-customerdate-row-btn" id="remove-customerdate-row-btn-` + customerdate_number + `" data-customerdate_id="` + customerdate_number + `">
                            Remove
                        </span>          
            </div>    
          
          <div class="col-md-3">
              <div class="form-group required">
                            <label for="date">Customer Date</label> <br />
                            <input id="received-date-` + customerdate_number + `"  class="form-control received_date" name="received-date[` + customerdate_number + `]"  data-provide="datepicker"   data-date-format="mm/dd/yyyy" data-date-start-date="0d">                           
             </div>
           </div>
           <div class="col-md-4">
                <div class="form-group required">
                            <label for="amount">Amount</label> <br />
                            <input type="number" class="form-control" name="amount[` + customerdate_number + `]" placeholder="0.00">
                        </div>
           </div>
           <div class="col-md-5">
             <div class="form-group">
                            <label for="details">&nbsp;</label> <br />
                            <button type="button" class="m-auto w-75 btn btn-neutral btn-add-customerdate position-relative">
                                <i class="fa fa-plus"></i> Add Another
                            </button>      
           </div>
         </div>`);
          
        $(product_component.htmlCont + ' #received-date-' + customerdate_number).val(moment().add(0, 'day').format('MM/DD/YYYY'));
        $(product_component.htmlCont + ' #received-date-' + customerdate_number).datepicker('update');

        $(product_component.htmlCont + ' #remove-customerdate-row-btn-' + customerdate_number).on('click', function () {
            product_component.removeProductRow($(this).attr('data-customerdate_id'));
        });

    },
    removeProductRow: function (customerdate_number) {
        if ($(product_component.htmlCont + ' .customerdate-row').length == 1)
            return; //do not allow to remove all donation rows        
        if ($("#customerdate-" + customerdate_number + "").select2('val')) {            
            product_component.customerdate_list = product_component.customerdate_list.filter(e => e.customerdate_id !== $("#customerdate-" + customerdate_number + "").select2('val'));
        }
        //slideup --
        $(product_component.htmlCont + ' #item-' + customerdate_number).slideUp(400, function () {
            $(product_component.htmlCont + ' #item-' + customerdate_number).remove();
        });
        setTimeout(function () {
            let i_row = 1;
            $.each($(product_component.htmlCont + ' .customerdate-row'), function () {
                $(this).find('.customerdate-title').text(i_row);
                i_row++;
            });
            product_component.count_customerdate_removed++;
        }, 500);

    }   
    
};