(function () {
    $(document).ready(function () {
        payouts.setpayouts_dt();
    });
    var payouts = {
        setpayouts_dt: function () {
            var tableId = "#payouts_datatable";
            this.payouts_dt = $(tableId).DataTable({
                "dom": 'frtlip',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                iDisplayLength: 10,
                paging: false,
                searching: false,
                bInfo: false,
                deferLoading: 0,
                lengthMenu: [
                    [50, 100, 500], [50, 100, 500]],
                ajax: {
                    url: base_url + "payouts/get_dt", type: "POST",
                    "data": function (d) {
                        d.church_id = $("#organization_filter").val();
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
                        data: "id",
                        className: "text-left",
                        visible: true,
                        sortable: false,
                        mRender: function (data, type, full) {
                            var link = '';
                            link = '<label class="pty-show-detail" data-system="' + full.system + '" data-payout-index="' + full.index + '" data-payout-id="' + data + '">' + data + '</label>';
                            return link;
                        }
                    },
                    {data: "account_no", className: "text-center", visible: false, sortable: false},
                    {
                        data: "amount", className: "text-right", sortable: false, mRender: function (data, type, full) {
                            return "$" + (data.toFixed(2));
                        }
                    },
                    {
                        data: "currency",
                        className: "text-center",
                        sortable: false,
                        mRender: function (data, type, full) {
                            return data.toUpperCase();
                        }
                    }, {data: "status", className: "text-center", visible: false, sortable: false},
                    {data: "description", className: "text-center", visible: true, sortable: false},
                    {
                        data: "created",
                        className: "text-center",
                        sortable: false,
                        mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "arrival_date",
                        className: "text-center",
                        sortable: false,
                        mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {
                        data: "id",
                        className: "text-center",
                        visible: true,
                        sortable: false,
                        mRender: function (data, type, full) {
                            var link = '';
                            //link = '<label class="pty-show-detail" data-system="' + full.system + '" data-payout-index="' + full.index + '" data-payout-id="' + data + '"><i class="fas fa-ellipsis-h"></i></label>';
                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="pty-show-detail dropdown-item" data-system="` + full.system + `" data-payout-index="` + full.index + `" data-payout-id="` + data + `" href="#">
                                            <i class="fas fa-eye"></i>
                                            <span>Details</span>
                                        </a>
                                      </div>
                                    </li>`;
                            return link;
                        }
                    },
                ],
                fnInitComplete: function (data) {
                    helpers.table_filter_on_enter(this);
                }
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
                payouts.payouts_dt.draw(false);
                monthdp.hide();
            }).data('datepicker');

            $('#month_filter').datepicker('setDate', moment().format("L"));

            $(document).on('click', '.pty-show-detail', function (e) {
                e.preventDefault();
                var payoutId = $(this).data('payout-index');

                try {
                    var data = payouts.payouts_dt.rows().data();

                    data = helpers.searchInObjectsArrayPriIndex(data, payoutId, "index");
                    data = JSON.parse(data.detail_data);

                    $.each(data, function () {
                        $('#payouts_detail_data').append(
                                '<tr>' +
                                '<td>' + this.trxn_type + '</td>' +
                                '<td>' + this.reference_id + '</td>' +
                                '<td>$' + this.amount + '</td>' +
                                '<td>' + this.memo + '</td>' +
                                '<td>' + (this.transaction_date == '' ? '-' : this.transaction_date) + '</td>' +
                                '</tr>');
                    });
                    console.log(data);

                } catch (e) {
                    console.log(e);
                }

                $('#payouts_details_modal').attr('data-id', 0).modal('show');
                $('#payouts_details_modal .overlay').attr("style", "display: none!important");
            });

        }
    };

}());

