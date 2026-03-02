(function () {
    $(document).ready(function () {
        referals.setDt();
    });
    var referals = {
        formatter: new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        htmlCont: '#referals-container',
        tableId: "#referals_datatable",
        dtTable: null,
        setDt: function () {
             
            this.dtTable = $(referals.tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-a xfilter"><"col-sm-3 search xfilter"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "referrals/affiliates_get_dt", type: "POST",
                    "data": function (d) {
                        d.filter_by_date = $(referals.htmlCont + ' #date_filter_checkbox').is(':checked') ? '1' : '0';
                        d.year = $(referals.htmlCont + ' #year_status_filter').val();
                        d.month = $(referals.htmlCont + ' #month_status_filter').val();                        
                    }
                }, 
                columns: [
                    {data: "parent_id", visible:false,  searchable: false,},
                    {data: "first_name",className: "text-left pl-25"},
                    {data: "last_name",className: "text-left"},
                    {data: "email",className: "text-left"},
                    {data: "zelle_account_id",className: "text-left"},
                    {data: "total_ref", searchable: false, orderable: false, className: "text-center", mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "Pay",  searchable: false, className: "action text-center", mRender: function (data, type, full) {
                                return full.parent_id ? `<button id='${full.parent_id}'  class="btn btn-primary avoidTrClick btn-sm">Add Payment</button>` : null;
                        }
                    },
                    {
                        data: "_earnings", orderable: false,  searchable: false, className: "text-right",mRender: function (data, type, full) {
                            return referals.formatter.format(data);
                        }
                    },
                    
                    {
                        data: "_paid", orderable: false, searchable: false, className: "text-right",mRender: function (data, type, full) {                            
                            return referals.formatter.format(data);
                        }
                    },
                    {
                        data: "_amount_remain", searchable: false, orderable:false, className: "text-right font-weight-bold", mRender: function (data, type, full) {                            
                            let amountRemain = (+full._earnings) - (+full._paid); //+pre plus to treat strings as numbers                            
                            return referals.formatter.format(amountRemain);
                        }
                    }
                ],
                fnInitComplete: async function () {
                    helpers.table_filter_on_enter(this);
                    var divSelectInput = $('div #date_div_status_filter');
                    $(referals.tableId + '_wrapper .filter-a').append(divSelectInput);
                    $('div' + referals.tableId + '_filter').css('width', '100%');
                    $('div' + referals.tableId + '_filter label').css('width', '100%');
                    $('div' + referals.tableId + '_filter input').css('width', '100%');
                    $('.filter-a').css('padding', '0px 20px 7px 20px');
                    divSelectInput.show();
                }
            });
            
            $(referals.htmlCont + ' #date_filter_checkbox').on('change', function() {
                if($(this).is(':checked')) {
                    $(referals.htmlCont + ' .date-filter-select').removeAttr('disabled');   
                } else {
                    $(referals.htmlCont + ' .date-filter-select').attr('disabled', 'disabled');
                }
                referals.dtTable.draw(false);
            });
            
             //if the datatable filter changes also lets change the add payment year month, for better usability 
            $(referals.htmlCont + ' .date-filter-select').on('change', function (){
               $(referals.htmlCont + ' #newPay #year_payment').val($(referals.htmlCont + ' #year_status_filter').val());
               $(referals.htmlCont + ' #newPay #month_payment').val($(referals.htmlCont + ' #month_status_filter').val());               
            }).change(); //fire the change to update values in the modal
            
            $('#newPay').on('shown.bs.modal', function () {
                $('#newPay').find(".focus-first").first().focus().val("");
            });
            $(referals.htmlCont + ' #year_status_filter').change(function () {
                referals.dtTable.draw(false);
            });
            $(referals.htmlCont + ' #month_status_filter').change(function () {
                referals.dtTable.draw(false);
            });
            $(referals.tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;            
                    if(!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements
                        let data = referals.dtTable.row(this).data();
                        window.location.href = `${base_url}referrals/view/${data.parent_id}`;
                    }
            });  
            $(referals.tableId).on('click','.btn', function (e) {
                $("#user-id-pay").val($(this).prop('id'));
                $("#newPay").modal("show");
            });
            $(referals.htmlCont+ " #affiliate-send").on('click', function (e) {
                question_modal('Confirm you want to add a new payment', 'Please confirm action').then(function (result) {
                    if (result.value) {
                        let data = {
                            user_id:$("#user-id-pay").val(),
                            amount:$("#amount-pay").val(),
                            year:$("#year_payment").val(),
                            month:$("#month_payment").val(),
                            message:$("#message-pay").val(),
                            csrf_token : $("input[name=csrf_token]").val(),

                        }
                        $.post(base_url + 'referrals/payment_affiliate',data , function (result) {
                            console.log(result);
                            if(result.status){
                                success_message(result.message);
                                $("input[name=csrf_token]").val(result.new_token.value);
                                referals.dtTable.draw(false);
                                setTimeout(()=>$("#newPay").modal("hide"),500)  
                            }else if (!result.status) {
                                $("input[name=csrf_token]").val(result.new_token.value)
                                error_message(result.errors);
                            }
                        }).fail(function (e) {
                            if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                                alert(e.responseJSON.message);
                                window.location.reload();
                            }
                           
                        });
                    }
                })
            });
        },
        
    };
}());

