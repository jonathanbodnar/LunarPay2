(function () {
    $(document).ready(function () {
        payouts_psf.init();
    });
    var payouts_psf = {
        init: function () {
            $('#send_credentials_psf').on('click', function () {
                let btn = helpers.btn_disable(this);
                $.ajax({
                    url: base_url + 'paysafe/send_backoffice_credentials', type: "POST",
                    dataType: "json",
                    success: function (data) {
                        helpers.btn_enable(btn);
                        if (data.status) {
                            $(btn).prop('disabled', true).text('Credentials sent!');
                        }else{
                            $(btn).prop('disabled', true).text(data.message);
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        helpers.btn_enable(btn);
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

