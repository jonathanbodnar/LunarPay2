(function () {

    $(document).ready(function () {
        _global_objects.myprofileview = true;
        products_profile.setproducts();
        products_profile.toggleShowInPortalSave();
    });

    var products_profile = {
        htmlCont: "#product-view",
        setproducts: function () {            
                $(document).on('click', `${this.htmlCont} .btn-remove-product`, function (e) {                     
                    var id = $(this).data('id');
                    question_modal('Remove Product', 'Are you sure?')
                            .then(function (result) {
                                if (result.value) {
                                    var data = $("#remove_product_form").serializeArray();
                                    var remove_data = {};
                                    $.each(data, function () {
                                        remove_data[this.name] = this.value;
                                    });
                                    remove_data['id'] = id;                                   
                                    loader('show');
                                    $.ajax({
                                        url: base_url + 'products/remove', type: "POST",
                                        dataType: "json",
                                        data: remove_data,
                                        success: function (data) {
                                            if (data.status) {   
                                                 window.location.href = `${base_url}products/`; 
                                            } else {
                                                error_message(data.message)
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
        toggleShowInPortalSave: function () {
            
            $(document).on('click', `${this.htmlCont} input[name="show_customer_portal"]`, function (e) {
                
                const data = $("#update_form").serializeArray();
                const saveData = {};
                $.each(data, function () {
                    saveData[this.name] = this.value;
                });
                
                saveData['id'] = $(this).data('id');
                saveData['show_customer_portal'] = $(this).is(':checked') ? 1 : 0;
                saveData['organization_id'] =  _global_objects.currnt_org.orgnx_id;
                
                loader('show');
                const url = $("#update_form").attr('action');
                $.ajax({
                    url: url, type: "POST",
                    dataType: "json",
                    data: saveData,
                    success: function (data) {
                        if (data.status) {
                            notify({title: 'Notification', 'message': data.message, 'align': 'right'});
                        } else {
                            error_message(data.message)
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
            });
        }
    };
}());





