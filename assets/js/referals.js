(function () {
    loader('show');
   
    $(document).ready(function () {
        referals.setDt();
        loader('hide');
        
    });
    var referals = {
        htmlCont: '#referals-container',
        tableId: "#referals_datatable",
        dtTable: null,
        formater_value: function(val){
            formatter = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return formatter.format(val)
        },
        setDt: function () {
            this.dtTable = $(referals.tableId).DataTable({
                "dom": 'sssss<"row"<"col-sm-9 filter-zone"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "referrals/referals_get_dt", type: "POST",
                    "data": function (d) {
                        console.log(d)
                    }
                }
                ,
                "fnPreDrawCallback": function () {
                   
                },
                "fnDrawCallback": function () {
                     
                },
                columns: [
                    {data: "id", visible: false, searchable: false},
                    {data: "email",className: "text-left"},
                    {data: "full_name",className: "text-left"},                    
                    {data: "date_sent", className: "text-center", sortable: true, mRender: function (data, type, full) {
                        return full.date_sent_format;
                        }
                    },
                    {data: "date_register", className: "text-center", sortable: true, mRender: function (data, type, full) {
                        return full.date_register_format;
                        }
                    },
                    {data: "_earnings",className: "text-right", sortable: true, mRender: function (data, type, full) {
                        return referals.formater_value(full._earnings);
                        }
                    }
                ],
                fnInitComplete: async function () {
                    helpers.table_filter_on_enter(this);
                   
                }
            });
           $(referals.htmlCont + ' .btn-add-referal-component').on('click', function (e) {
                $(referals.htmlCont + " #referal-message").val(message_share_referral);
                $("#newReferal").modal("show");
            });
            $(referals.htmlCont + " #newReferal").on('shown.bs.modal', async function () {
                $(referals.htmlCont + " #referal-name").focus();
            });
            $(referals.htmlCont + " #newReferal").on('hide.bs.modal', async function () {
                $(referals.htmlCont + " #referal-name").val("");
                $(referals.htmlCont + " #referal-email").val("");
                $(referals.htmlCont + " #referal-message").val("");
                $('#newReferal').find('.alert-validation').first().html("").hide();
            })
            $(referals.htmlCont + ' #referal-send').on('click', function (e) {
                loader('show');
                $.post(base_url + 'referrals/save',{
                    email:$("#referal-email").val(),
                    full_name:$("#referal-name").val(),
                    referal_message:$("#referal-message").val(),
                    csrf_token : $("input[name=csrf_token]").val()
                } , function (result) {
                    console.log(result);
                    if(result.status){
                        notify({title: 'Notification', 'message': 'We send you code successfully'});
                        $("#newReferal").modal("hide");
                        referals.dtTable.draw(false); 
                        $("input[name=csrf_token]").val(result.new_token.value)
                    }else if (!result.status) {
                        $("input[name=csrf_token]").val(result.new_token.value)
                        $('#newReferal').find('.alert-validation').first().html(result.errors).show()
                        $("input[name=csrf_token]").val(result.new_token.value)
                    }
                    loader('hide');
                }).fail(function (e) {
                    if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                        alert(e.responseJSON.message);
                        window.location.reload();
                    }
                });
            });  
        } 
    };
}());

