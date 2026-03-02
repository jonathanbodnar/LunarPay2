var view = {
    load_invoice: async function(){
        try{ 
          
        }catch(e){
            loader('hide')
            throw e;
        }
    },
    load_events : function(){
         
    }, 
    loader: null
};
(function () {
    $(document).ready(function () {
        $(document).on('click','.btn-send-invoice',function () {
            let hash = $(this).attr('data-hash');
            question_modal('Send Invoice to Customer', 'Please confirm action').then(function (result) {
                if (result.value) {
                    loader('show');
                    $.post(base_url + 'invoices/send_to_customer/' + hash , {}, function (result) {
                        if (result.status) {
                            notify({title: 'Notification', 'message': result.message});                            
                        } else if (result.status == false) {                            
                            error_message(result.message);
                        }
                        loader('hide');
                    }).fail(function (e) {
                        if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                            alert(e.responseJSON.message);
                            window.location.reload();
                        }
                        loader('hide');
                    });
                }
            });
        });
        $(document).on('click','.btn-clone-invoice', function(){
            let id = $(this).attr('data-id');
            question_modal('Clone Invoice', 'Please confirm action').then(function (result) {
                if (result.value) {
                    loader('show');
                    $.post(base_url + 'invoices/clone_invoice/' , {id: id,csrf_token:$("input[name='csrf_token']").val()}, function (result) {
                        if (result.status) {
                            loader('hide');
                            notify({title: 'Notification', 'message': result.message + ' | ' + result.message2});
                            setTimeout(function () {                                
                                window.location.href = base_url + 'invoices';
                            }, 2000);
                        } else if (result.status == false) {
                            error_message(result.message);
                        }
                        loader('hide');
                    }).fail(function (e) {
                        console.log(e);
                        if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                            alert(e.responseJSON.message);
                            window.location.reload();
                        }
                        loader('hide');
                    });
                }
            });
        });
        $(document).on('click','.btn-cancel-invoice',function () {
            let id = $(this).attr('data-id');
            question_modal('Cancel Invoice', 'Please confirm action, it cannot be undone').then(function (result) {
                if (result.value) {
                    loader('show');
                    $.post(base_url + 'invoices/cancel/' + id , {}, function (result) {
                        if (result.status) {
                            notify({title: 'Notification', 'message': result.message + ' | ' + result.message2});
                            setTimeout(function () {
                                loader('hide');
                                location.reload();
                            }, 2000);                            
                        } else if (result.status == false) {                            
                            error_message(result.message);
                        }
                        loader('hide');
                    }).fail(function (e) {
                        if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                            alert(e.responseJSON.message);
                            window.location.reload();
                        }
                        loader('hide');
                    });
                }
            });
        });
        
        $(document).on('click','.btn-copy-invoice',function () {
            let hash = $(this).attr('data-link');
            navigator.clipboard.writeText(hash);
            notify({title: 'Notification', 'message': 'Link copied on your clipboard'});
        });
    });
}());
