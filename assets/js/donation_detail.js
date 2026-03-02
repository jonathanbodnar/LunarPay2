(function () {

    $(document).ready(function () {
        _global_objects.myprofileview = true;
        trxn_detail.setdonations();
    });
    
    var trxn_detail = {        
        setdonations: function () {            
            //Event Refund            
            $(document).on('click', '.btn-refund-transaction', function (e) {
                var transaction_id = $(this).attr('data-id');
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
                                console.log(data);
                                $.ajax({
                                    url: base_url + 'donations/refund', type: "POST",
                                    dataType: "json",
                                    data: refund_data,
                                    success: function (data) {
                                        if (data.status) {                                            
                                            success_message(data.message);
                                            setTimeout(function () {
                                                window.location.reload();                                                
                                            }, 2000);
                                         
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

            //Event stop 
            $(document).on('click', '.btn-stop-subscription', function () {
                var subscription_id = $(this).attr('data-id-subscription');               
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
                                            success_message(data.message);
                                            setTimeout(function () {
                                                  window.location.reload();
                                            }, 2000);
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
            });

            //Event remove
            $(document).on('click', '.btn-remove-transaction', function (e) {
                var transaction_id = $(this).attr('data-id');
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
                                            notify({title: 'Notification', message: data.message});
                                            setTimeout(function () {
                                                 window.location.href = `${base_url}donations/`;
                                            }, 1000);                                          
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
        }
    };
}());