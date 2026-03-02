$(document).ready(function () {
    const htmlCont = '#links-view-container';
    $(document).on('click', htmlCont + ' .btn-edit', function(){
        let product_list = [];
        $(htmlCont + ' #edit_product_form').find('.product_id').each((i,e) => { 
            product = {
                is_editable:$(htmlCont + ` .editable_${e.value}`).prop("checked"),
                qty:$(`.qty_${e.value}`).val(),
                payment_link_product_id:$(htmlCont + ` .payment_link_product_id_${e.value}`).val()
            }
            product_list.push(product);
        });
        let save_data = {
            payment_link_id: $(htmlCont + ' #payment_link_id').attr('data-id'),
            products:product_list,
            csrf_token : $("input[name=csrf_token]").val(),
        }
        loader('show')
        $.post(base_url + 'payment_links/update',save_data , function (result) {
            if(result.status){
                setTimeout(()=>window.location.reload(),1000)  
            }
        }).fail(function (e) {
            if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                alert(e.responseJSON.message);
                window.location.reload();
            }
        });
    });

    $(document).on('click',htmlCont + ' .btn-copy-payment-link',function () {
        let hash = $(this).attr('data-link');
        navigator.clipboard.writeText(hash);
        notify({title: 'Notification', 'message': 'Link copied to your clipboard'});
    });
});
function notify (options) {
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