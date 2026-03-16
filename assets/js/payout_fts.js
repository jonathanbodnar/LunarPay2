(function () {
    loader('show');
    $(document).ready(function () {
        payouts.setpayouts_dt();
        //loader('hide');
    });
    var payouts = {
        formatter: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        payouts_dt: null,
        setpayouts_dt: function () {
            var tableId = "#payouts_datatable";
            this.payouts_dt = $(tableId).DataTable({
                "dom": 'frtlip',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]],
                // order: [[0, "desc"]],
                iDisplayLength: 10,
                paging: false,
                searching: false,
                ordering: false,
                bInfo: false,
                deferLoading: 0,
                processing: false, // disable the loading ... message
                lengthMenu: [
                    [50, 100, 500], [50, 100, 500]],
                ajax: {
                    url: base_url + "payouts/get_dt", type: "POST",
                    "data": function (d) {
                        d.month = $('input#month_filter').val();
                        return d;
                    }
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function (data) {
                    //$(tableId).fadeIn("fast");
                },
                columns: [

                    {
                        data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {

                            return `<li class="nav-item dropdown" style="position: static">
                                        <a class="avoidTrClick btn nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            •••</span>
                                        </a>
                                            <div class="avoidTrClick dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                            <a class="avoidTrClick stop_subscription dropdown-item pty-show-detail" data-type="${full._type}" data-payout-id="` + data + `" href="#">
                                                <i class="avoidTrClick fas fa-info"></i>
                                                <span class="avoidTrClick">Details</span>
                                            </a>
                                        </div>
                                    </li>`;
                        }
                    },
                    {
                        data: "_processing_status_label",
                        className: "text-center font-weight-bold",
                        sortable: false,
                        mRender: function (data, type, full) {
                            // Define label classes based on the process_status_id
                            var labelClass = '';
                            switch ((full._type === 'Bank' && full._fts_status_id == 134) || (full._type === 'Credit Card' && full.processing_status_id == 2)) {
                                case true:
                                    labelClass = 'primary';
                                    break;
                                default:
                                    labelClass = 'secondary';
                            }

                            return '<span class="badge badge-' + labelClass + '">' + data.toUpperCase() + '</span>';
                        }
                    },

                    {
                        data: "created_ts", className: "text-center", sortable: false, mRender: function (data, type, full) {
                            return moment.unix(data).format('MM/DD/YYYY hh:mm A');
                        }
                    },

                    {
                        data: "id",
                        className: "text-left",
                        visible: false,
                        sortable: false,
                        mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "_type",
                        className: "text-center",
                        sortable: false,
                        visible : false,
                        mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "total_sale_amount", className: "text-right", sortable: false, visible:false, mRender: function (data, type, full) {
                            const amount = payouts.formatter.format(data ? parseFloat(data) : 0);
                            return amount;
                        }
                    },
                    {
                        data: "_total_net_amount", className: "text-right", sortable: false, mRender: function (data, type, full) {
                            const amount = payouts.formatter.format(data ? parseFloat(data) : 0);
                            return amount;
                        }
                    },
                    {
                        data: "total_sale_count", className: "text-center", visible: true, sortable: false
                    },
                    {
                        data: "total_refund_amount", className: "text-right", sortable: false, mRender: function (data, type, full) {
                            const amount = payouts.formatter.format(data ? parseFloat(data) : 0);
                            return amount;
                        }
                    },
                    {
                        data: "total_refund_count", className: "text-center", visible: true, sortable: false
                    },
                    {
                        data: "batch_close_detail",
                        className: "text-center",
                        sortable: false,
                        visible: false,
                        mRender: function (data, type, full) {
                            return data || '-';
                        }
                    },

                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);
                }
            });

            payouts.payouts_dt.on('draw', function () {
                loader('hide');
            });

            //on preXhr event, show the loader
            payouts.payouts_dt.on('preXhr', function () {
                loader('show');
            });
            

            $('#organization_filter').change(function () {
                payouts.payouts_dt.draw(false);
            });

            var monthdp = $('#month_filter').datepicker({
                format: "yyyy/mm",
                viewMode: "months",
                minViewMode: "months",
                endDate: "0m"
            }).on('changeDate', function (ev) {
                helpers.addUrlParam('month', moment(ev.date).format("YYYY-MM"));
                payouts.payouts_dt.draw(false);
                monthdp.hide();
            }).data('datepicker');

            const params =  helpers.getUrlSearchParams();
            if(params.get('month') && moment(params.get('month'), 'YYYY-MM', true).isValid()){
                $('#month_filter').datepicker('setDate', moment(params.get('month')).format("YYYY/MM"));
            } else {
                helpers.removeUrlParam('month');
                $('#month_filter').datepicker('setDate', moment().format("YYYY/MM"));
            }
            $(document).on('click', '.pty-show-detail', async function (e) {
                e.preventDefault();
                const payoutId = $(this).data('payout-id');
                const type = $(this).data('type'); // Bank or Credit Card
                payouts.loadDetails(payoutId, type);
            });

            $(tableId + ' tbody').on('click', 'tr', function (e) {
                let elementClicked = e.target;
                if (!$(elementClicked).hasClass('avoidTrClick')) { //avoid event when clicked blacklisted elements                        
                    const data = payouts.payouts_dt.row(this).data();
                    const payoutId = data.id;
                    payouts.loadDetails(payoutId, data._type);
                }
            });

        },
        loadDetails: async function (payoutId, type) {
            loader('show');
            window.location.href = `${base_url}payouts/detail/${payoutId}/${type === 'Credit Card' ? 'cc' : 'bank'}`;
        }
    };

}());

