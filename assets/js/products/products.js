(function () {
    loader('show');
    $(document).ready(async function () {
        $(".btn-GENERAL-product-component").attr("data-org_id", _global_objects.currnt_org.orgnx_id);
        $(".btn-GENERAL-product-component").attr("data-org_name",_global_objects.currnt_org.orgName);
        $(".btn-GENERAL-product-component").attr("data-suborg_id", _global_objects.currnt_org.sorgnx_id);
        $(".btn-GENERAL-product-component").attr("data-suborg_name",_global_objects.currnt_org.suborgName);
        
        products.setDt();
        products.setRemoveEvent();
        loader('hide');
    });
    var products = {
        htmlCont: '#products-container',
        tableId: "#products_datatable",
        dtTable:null,        
        setDt: function () {
            var tableId = "#products_datatable";
            this.dtTable = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-zone"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                
                ajax: {
                    url: base_url + "products/get_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = _global_objects.currnt_org.orgnx_id;
                        d.sub_organization_id = _global_objects.currnt_org.sorgnx_id;
                    } 
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    //$(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: "pty-row-id", searchable:false, visible: false, sortable: true, mRender: function (data, type, full) {
                            return '<a href="#" class="stm-show-detail" data-statement-id="' + data + '">' + data + '</a>';
                        }
                    },
                    {data: "reference", className: "pty-row-id", sortable: true, mRender: function (data, type, full) {
                            return '<a href="#" class="stm-show-detail">' + data + '</a>';
                        }
                    },
                    {data: "prod_name", className: "text-nowrap pty-row-prod_name", sortable: true},
                    {data: "price", className: "text-right text-nowrap pty-row-price", sortable: true, mRender: function (data, type, full) {
                            return '$' + data;
                        }
                    },
                    {data: "plan_type", className: "text-nowrap text-center", sortable: true, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {data: "recurrence", className: "text-nowrap", sortable: true},
                    {data: "show_customer_portal", className: "text-center", sortable: true},
                    {data: "created_at", className: "text-center", sortable: true, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {
                            let available = full.allowRemove == 1  ? '' : 'display: none;';
                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        ${available == '' ? '•••' : '<span class="avoidTrClick" style="color:lightgray">•••</span>'}
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1" style="${available}">
                                        ${ full.allowRemove == 1 ?`<a class="avoidTrClick btn-remove-product dropdown-item" data-id="` + data + `" href="#">
                                            <i class="avoidTrClick fas fa-trash"></i> Remove
                                        </a>` : ''}
                                      </div>
                                    </li>`;
                        }
                    }   
                ],
                fnInitComplete:  function () {
                    helpers.table_filter_on_enter(this);
                     
                    //put table_id as buton attr for refreshing dataable from js component
                    $(products.htmlCont + ' .btn-GENERAL-product-component').attr('data-table_id', products.htmlCont + ' ' + products.tableId);
                     
                    $('#filters').appendTo('.filter-zone');
                    
                    //products.dtTable.columns(1).visible($(products.htmlCont+' select' + products.tableId + '_organization_filter').val() == '' ? true : false); //show column if there is not org set
                    
                     if(_global_objects.triggerNew) {
                        $(product_component.btnTrigger).click();
                     }
                }
            });  
            
            _global_objects.products_dt = products.dtTable;
            
           $(tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;              
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                    let data = products.dtTable.row(this).data();
                     window.location.href = `${base_url}products/profile/${data.id}`;

                }
            });
            
        },        
        setRemoveEvent: function () {                        
           $(document).on('click', '.btn-remove-product', function (e) {
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
                            console.log(remove_data)
                            loader('show');
                            $.ajax({
                                url: base_url + 'products/remove', type: "POST",
                                dataType: "json",
                                data: remove_data,
                                success: function (data) {
                                    if (data.status) {
                                        notify({'title': 'Notification', 'message': data.message});
                                    } else {
                                        error_message(data.message)
                                    }
                                    products.dtTable.draw(false);
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

