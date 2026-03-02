(function () {
    loader('show');
    $(document).ready(async function () {
        
        $(".btn-GENERAL-add-invoice").attr("data-org_id", _global_objects.currnt_org.orgnx_id);
        $(".btn-GENERAL-add-invoice").attr("data-org_name",_global_objects.currnt_org.orgName);
        $(".btn-GENERAL-add-invoice").attr("data-suborg_id", _global_objects.currnt_org.sorgnx_id);
        $(".btn-GENERAL-add-invoice").attr("data-suborg_name",_global_objects.currnt_org.suborgName);
        
        invoices.setDt();
        loader('hide');
    });
    var invoices = {
        htmlCont: '#invoices-container',
        tableId: "#invoices_datatable",
        dtTable: null,
        setDt: function () {
            this.dtTable = $(invoices.tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-zone"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "invoices/get_dt", type: "POST",
                    "data": function (d) {                        
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.sub_organization_id = _global_objects.currnt_org.sorgnx_id;
                    }
                },
                "fnPreDrawCallback": function () {
                    //$(invoices.tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    //$(invoices.tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: "text-center", searchable: false, visible: false, sortable: true, mRender: function (data, type, full) {
                            return data;
                        }
                    },                    
                    {data: "total_amount", className: "text-right", searchable: false, "render": function (data,type,full) {                             
                            return '$' + (data ? data : 0.0);
                        
                        }},                                                            
                    {data: "status", className: "text-center text-nowrap", sortable: true},
                    {data: "reference", className: "text-left text-nowrap", sortable: true, mRender: function (data, type, full) {
                            return `${full.frequency 
                                ? `<i class="fa fa-clock" title="Recurring"></i>`
                                 : ''} ${full.reference}`;
                        }
                    },
                    {data: "customer", className: "text-nowrap", sortable: true},                   
                    {data: "due_date", className: "text-center", sortable: true, mRender: function (data, type, full) {
                            return full.due_date_formatted;
                        }
                    },  
                    {data: "created_at", className: "text-center", sortable: true, mRender: function (data, type, full) {
                            return full.created_at_formatted;
                        }
                    },                    
                    {
                        data: "id", className: "action text-center", searchable: false
                        , mRender: function (data, type, full) {
                            //avoidTrClick allows us to do not trigger the row click function                            
                            let isCloneAvailable = true;  
                            let available = isCloneAvailable || full.pdf_url || full.allowEdit == 1 || full.allowSendEmail == 1 || full.allowRemove == 1  ? '' : 'display: none;';
                                return `<li class="nav-item dropdown" style="position: static;">
                                          <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            ${available == ''  ? '•••' : '<span class="avoidTrClick" '+full.allowClone != 1 ? "style=\"color:lightgray\"" : ''+ ' >•••</span>'}
                                          </a>
                                          <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1" style="${available}">
                                          <a class="avoidTrClick btn-clone-invoice dropdown-item" id=${full.id}  href="#"><i class="fas fa-clone"></i> Clone</a>
                                          `+
                                        (full.pdf_url ? `<a class="avoidTrClick btn-GENERAL-download-invoice dropdown-item"` +
                                                `data-pdf_url="`+ full.pdf_url +`" href="#">
                                                <i class="fas fa-file"></i> Download PDF
                                            </a>` : '')+
                                        (full.allowEdit == 1 ? `<a class="avoidTrClick btn-GENERAL-add-invoice dropdown-item" data-context="invoice" data-hash="` + full.hash +
                                                `" data-org_id="`+ full.org_id +`" data-org_name="`+ full.org_name + '"' + (full.suborg_id ? ' data-suborg_id="'+ full.suborg_id +'"  data-suborg_name="'+ full.suborg_name + '"' : '' ) +` href="#">
                                                <i class="fas fa-pen"></i> Edit
                                            </a>` : '')+
                                        (full.allowSendEmail == 1 ? `<a class="avoidTrClick btn-send-invoice dropdown-item" data-hash="` + full.hash + `" href="#">
                                                <i class="far fa-paper-plane"></i> Send Invoice
                                            </a>` : '')+
                                        (full.allowRemove == 1 ? `<a class="avoidTrClick btn-remove-invoice dropdown-item" data-hash="` + full.hash +`" href="#">
                                                <i class="fas fa-trash"></i> Remove
                                            </a>` : '')+
                                          `</div>
                                        </li>
                                        `;
                            
                        }
                    }
                ],
                fnInitComplete: async function () {
                    helpers.table_filter_on_enter(this);

                    $(invoices.htmlCont + ' .btn-GENERAL-add-invoice').attr('data-table_id', invoices.htmlCont + ' ' + invoices.tableId);

                    $('#filters').appendTo('.filter-zone');
                    
                    //invoices.dtTable.columns(1).visible($(invoices.htmlCont+' select' + invoices.tableId + '_organization_filter').val() == '' ? true : false); //show column if there is not org set
                    
                    if(_global_objects.triggerNew) {
                         $(invoice_component.btnTrigger + ':not([data-hash])').click();
                     }
                }
            });
            _global_objects.invoices_dt = invoices.dtTable;

            $(invoices.tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;
                if(!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements
                    let data = invoices.dtTable.row(this).data();
                    if (data.allowEdit == 1) {//draft                        
                            let btn_edit = $(this).find('.btn-GENERAL-add-invoice').get(0);
                            btn_edit.click();
                    }else {                      
                        window.location.href = `${base_url}invoices/view/${data.id}`;
                    }
                }
            });

            $(document).on("click",".btn-GENERAL-download-invoice",function(e){
                e.preventDefault();
                var pdf_url = $(this).attr('data-pdf_url');
                window.location.href = pdf_url;
            })

            $(document).on("click",".btn-view-invoice",function(e){
                e.preventDefault();
                var id = $(this).attr('id');
                 
                loader('show');
                window.location.href = `${base_url}/invoices/view/${id}`;
            });

            $(document).on('click','.btn-send-invoice',function () {
                let hash = $(this).attr('data-hash');
                question_modal('Send Invoice to Customer', 'Please confirm action').then(function (result) {
                    if (result.value) {
                        loader('show');
                        $.post(base_url + 'invoices/send_to_customer/' + hash , {}, function (result) {
                            if (result.status) {
                                notify({title: 'Notification', 'message': result.message});
                                invoices.dtTable.draw(false);
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

            $(document).on('click','.btn-clone-invoice',function(e){
                question_modal('Clone Invoice', 'Please confirm action').then(function (result) {
                    if (result.value) {
                        loader('show');
                        $.post(base_url + 'invoices/clone_invoice/' , {id:e.target.id,csrf_token:$("input[name='csrf_token']").val()}, function (result) {
                            if (result.status) {
                                notify({title: 'Notification', 'message': result.message});
                                invoices.dtTable.draw(false);
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
            })

            $(document).on('click','.btn-remove-invoice',function () {
                var data = $("#token_form").serializeArray();
                var send_data = {};
                $.each(data, function () {
                    send_data[this.name] = this.value;
                });
                send_data['hash'] = $(this).attr('data-hash');
                question_modal('Remove Invoice', 'Please confirm action').then(function (result) {
                    if (result.value) {
                        loader('show');
                        $.post(base_url + 'invoices/remove/' , send_data, function (result) {
                            if (result.status) {
                                notify({title: 'Notification', 'message': result.message});
                                invoices.dtTable.draw(false);
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
            })
        },
        loadOrgnxFilter: async function () {
            let $filter = $(invoices.htmlCont+' select' + invoices.tableId + '_organization_filter');
            await $.post(base_url + 'organizations/get_organizations_list',  function (result) {
                for (var i in result) {
                    $filter.append($('<option>', {value: result[i].ch_id, text: result[i].church_name}));
                }
            }).fail(function (e) {
                console.log(e);
            });
            return $filter;
        }
    };
}());

