(function () {
    loader('show');
    $(document).ready(function () {
        $(".btn-add-payment-link-component").attr("data-org_id", _global_objects.currnt_org.orgnx_id);
        $(".btn-add-payment-link-component").attr("data-org_name", _global_objects.currnt_org.orgName);
        $(".btn-add-payment-link-component").attr("data-suborg_id", _global_objects.currnt_org.sorgnx_id);
        $(".btn-add-payment-link-component").attr("data-suborg_name", _global_objects.currnt_org.suborgName);
        links.setDt();
        loader('hide');
    });
    var links = {
        htmlCont: '#links-container',
        tableId: "#payment_links_datatable",
        dtTable: null,
        setDt: function () {

            this.dtTable = $(links.tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-zone"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[25, 50], ['25', '50']], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "payment_links/get_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                         d.sub_organization_id = _global_objects.currnt_org.sorgnx_id;
                    }
                },
                "fnPreDrawCallback": function (data) {                 
                  _global_objects.currnt_config_product = data;                   
                    //$(invoices.tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    //$(invoices.tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", visible: false},
                    {data: "_link_url", className: "text-left", sortable: true, mRender: function (data, type, full) {
                            return `                                                                
                                <button title="Copy link" onclick="navigator.clipboard.writeText('${data}');notify({title: 'Notification', 'message': 'Link copied on your clipboard'});" type="button" class="avoidTrClick btn px-2 py-1">
                                    <i class="fas fa-copy avoidTrClick"></i>
                                </button> ${data}
                            `;
                        }},
                    {data: "status", className: "text-center"},
                    {data: "product_total", className: "text-center text-nowrap", searchable: false, sortable: true},
                    {data: "cover_fee", className: "text-center"},
                    {data: "creator", className: "text-center", sortable: true, mRender: function (data, type, full) {
                        return full._creator;
                        }
                    },
                    {data: "created_at", className: "text-center", sortable: true, mRender: function (data, type, full) {
                            return full.created_at_formatted;
                        }
                    },
                    {
                        data: "options", className: "action text-center", searchable: false
                        , mRender: function (data, type, full) {

                            return `<li class="nav-item dropdown" style="position: static;">
                                          <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span class="avoidTrClick">•••</span>
                                          </a>
                                          <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1" >
                                            <a class="btn-remove-link dropdown-item avoidTrClick" href="#" id="${full.id}">
                                                <i class="fas fa-trash avoidTrClick"></i> Remove
                                            </a>
                                          </div>
                                        </li>
                                        `;
                        }
                    }
                ],
                fnInitComplete: async function () {
                    helpers.table_filter_on_enter(this);
                    /* $(invoices.htmlCont + ' .btn-add-payment-link-component').attr('data-table_id', invoices.htmlCont + ' ' + invoices.tableId);
                     $('#filters').appendTo('.filter-zone');
                     if(_global_objects.triggerNew) {
                     $(invoice_component.btnTrigger + ':not([data-hash])').click();
                     }*/
                }
            });
            _global_objects.payment_links_dt = this.dtTable;
            $(document).on('click', '.btn-remove-link', function () {
                let id = $(this).prop('id');
                question_modal('Remove Link?', 'Please confirm action').then(function (result) {
                    if (result.value) {
                        let remove_data = {id: id, csrf_token: $("input[name=csrf_token]").val()}
                        $.post(base_url + 'payment_links/remove', remove_data, function (result) {
                            console.log(result);
                            if (result.status) {
                                notify({title: 'Notification', 'message': 'Removed Successfully'});
                                setTimeout(() => window.location.reload(), 500)
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
            $(links.tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements
                    let data = links.dtTable.row(this).data();
                    
                    loader('show');
                    window.location.href = `${base_url}payment_links/view/${data.id}`;
                }
            });
        }
    };
}());

