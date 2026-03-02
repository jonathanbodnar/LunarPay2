(function () {

    $(document).ready(function () {
        statmnts.set_dt();
        statmnts.set_modal();
    });
    var statmnts = {
        resetForm: function () {
            this.resetsDonorsForm();
            $('input:radio[name="st_opt_output"]').filter('[value="pdf_excel"]').prop('checked', true);
            $('select[name="organization_id"]').val($('#statmnts_datatable_organization_filter').val()).change();
            $('#email_message').parent().hide();
            $('.first-nav-link-tab').first().click();
        },
        resetsDonorsForm: function () {
            $("#donors_tags_list").val(null).trigger('change');
            $("#all_donors_checkbox").prop('checked', false);
        },
        tabsHandler: {
            tabIndex: 0,
            maxIndex: 2,
            buttonLabel: '',
            beforeContinue: function (toIndex) {
                if (this.tabIndex == toIndex) {
                    return true; //if clicks in the current tab do nothing validations response okay, true
                }
                if (this.tabIndex == 0 && toIndex > 0) {// === validate range date, can't be more than one year
                    let from_date = moment($('#st_from').datepicker('getDate'));
                    let to_date = moment($('#st_to').datepicker('getDate'));
                    var years = to_date.diff(from_date, 'year');
                    if (years > 0) {
                        error_message('Range date can not be greater than 1 year');
                        return false;
                    }
                }
                if (toIndex > 1) {
                    let donors = $('#donors_tags_list').select2('val');
                    if (donors.length == 0 && toIndex > this.tabIndex) {
                        error_message('Please select one or more donors');
                        return false;
                    }
                }
                if (toIndex == 3) { //finish
                    loader('show');
                    let data = {
                        church_id: $('select[name=organization_id]').val(),
                        fund_id: $('select[name=fund_id]').val(),
                        from_date: moment($('#st_from').datepicker('getDate')).format("YYYY-MM-DD"),
                        to_date: moment($('#st_to').datepicker('getDate')).format("YYYY-MM-DD"),
                        donor_ids: donors = $('#donors_tags_list').select2('val'),
                        export_option: $('input[name=st_opt_output]:checked').val(),
                        message: $('#email_message').val()
                    };
                    $.post(base_url + 'statements/generate', data, function (result) {
                        loader('hide');
                        statmnts.dtTable.draw(false);
                        if (result.status) {
                            if (data.export_option == 'pdf_excel') {
                                success_message(result.message);
                                window.open(result.data, '_BLANK');
                            } else if (data.export_option == 'email') {
                                if (result.emails_not_sent > 0) {
                                    error_message('An error occurred, Undelivered messages: ' + result.emails_not_sent);
                                } else {
                                    success_message(result.message);
                                }
                            }
                            $('#add_statement_modal').modal('hide');
                        } else {
                            error_message(result.message);
                        }

                    }).fail(function (e) {
                        console.log(e);
                    });
                }
                return true;
            },
            setTab: function (toIndex) {
                if (!this.beforeContinue(toIndex)) {
                    return false;
                }
                this.tabIndex = toIndex;
                this.navHasChanged();
                return true;
            },
            nextTab: function () {
                if (!this.beforeContinue(this.tabIndex + 1)) {
                    return false;
                }
                if (this.tabIndex < this.maxIndex) {
                    this.tabIndex++;
                    this.navHasChanged();
                    $('#pills-tabContent .tab-pane').removeClass('active');
                    $('#tabs-text-' + (this.tabIndex + 1) + '-tab').click();
                }
            },
            backTab: function () {
                if (this.tabIndex > 0) {
                    this.tabIndex--;
                    this.navHasChanged();
                    $('#pills-tabContent .tab-pane').removeClass('active');
                    $('#tabs-text-' + (this.tabIndex + 1) + '-tab').click();
                } else {
                    $('#add_statement_modal').modal('hide');
                }
            },
            navHasChanged() {
                $('#st_btn_action').text(this.tabIndex == this.maxIndex ? 'Finish' : 'Next');
                $('#st_btn_back').text(this.tabIndex == 0 ? 'Close' : 'Back');
            }
        },
        set_dt: function () {
            var tableId = "#statmnts_datatable";
            this.dtTable = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                deferLoading: 0,
                ajax: {
                    url: base_url + "statements/get_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = $('select' + tableId + '_organization_filter').val();
                    }
                },
                "fnPreDrawCallback": function () {
                    //$(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    //$(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", className: "text-center pty-row-id", sortable: true, mRender: function (data, type, full) {
                            return '<a href="#" class="stm-show-detail" data-statement-id="' + data + '">' + data + '</a>';
                        }
                    },
                    {
                        className: "text-center",
                        visible: true,
                        sortable: false,
                        searchable: false,
                        mRender: function (data, type, full) {
                            let allowDownload = ``;
                            if (full.created_by_ == 'A') {
                                allowDownload = `<a class="stm-download dropdown-item" data-file_url="` + full.file_url + `" href="#">`
                                        + `<i class="fas fa-download"></i>`
                                        + `<span>Download</span>`
                                        + `</a>`;
                            }

                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="stm-show-detail dropdown-item" data-statement-id="` + full.id + `" href="#">
                                            <i class="fas fa-eye"></i>
                                            <span>Details</span>
                                        </a>`
                                    + allowDownload
                                    + `</div>
                                    </li>`;
                            return link;
                        }
                    },
                    {data: "church_name", className: "text-center text-nowrap pty-row-church-name", sortable: true, mRender: function (data, type, full) {
                            var data = $.fn.dataTable.render.text().display(data, type, full); //sanitize
                            return data == null ? 'All' : data;
                        }
                    },
                    {data: "date_from", className: "text-center text-nowrap pty-row-date-from", sortable: true},
                    {data: "date_to", className: "text-center text-nowrap pty-row-date-to", sortable: true},
                    {data: "created_at", className: "text-center text-nowrap pty-row-created-at", sortable: true},
                    {data: "created_by", className: "text-center", sortable: true, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {data: "donors", className: "text-center", sortable: true, searchable: false}                    
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                    var divSelectInput = $('div' + tableId + '_div_organization_filter');
                    $(tableId + '_wrapper .filter-1').append(divSelectInput).css('padding', '0px 20px 5px 10px');
                    divSelectInput.show();
                    //Set Organizations to Datatable Filters
                    $.post(base_url + 'organizations/get_organizations_list', function (result) {
                        var selectInput1 = $('select' + tableId + '_organization_filter');
                        var selectInput2 = $('select[name="organization_id"]');
                        for (var i in result) {
                            selectInput1.append($('<option>', {value: result[i].ch_id, text: result[i].church_name, selected: (i == 0 ? false : false)}));
                            selectInput2.append($('<option>', {value: result[i].ch_id, text: result[i].church_name, selected: (i == 0 ? false : false)}));
                        }
                        selectInput1.change(); //refresh DT
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            });
            //Event Change Organization Filter
            var dt = this.dtTable;
            $('select' + tableId + '_organization_filter').change(function () {
                dt.draw(false);
            });
        },
        donorsTagListUrl: '',
        updateDonorsTagListUrl: function () { //called from orgnx funds and datepickers change events
            this.resetsDonorsForm();
            var from_date = $('#st_from').datepicker('getDate');
            var to_date = $('#st_to').datepicker('getDate');
            from_date = moment(from_date).format("YYYY-MM-DD");
            to_date = moment(to_date).format("YYYY-MM-DD");
            statmnts.donorsTagListUrl = base_url
                    + 'donors/get_tags_list?church_id=' + $('select[name="organization_id"]').val()
                    + '&fund_id=' + $('select[name="fund_id"]').val()
                    + '&from=' + from_date
                    + '&to=' + to_date;
        },
        getDonorURL: function () {
            return statmnts.donorsTagListUrl;
        },
        set_modal: function () {
            statmnts.updateDonorsTagListUrl();
            //Initialize Select2 Elements            
            var rows_per_page = 10;
            $('#donors_tags_list').select2({
                multiple: true,
                placeholder: "Select donors",
                ajax: {
                    url: function () {
                        return statmnts.getDonorURL();
                    },
                    type: "post",
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            q: params.term, // search term
                            page: params.page
                        };
                    },
                    processResults: function (data, params) {
                        params.page = params.page || 1;
                        return {
                            results: data.items,
                            pagination: {
                                more: (params.page * rows_per_page) < parseInt(data.total_count)
                            }
                        };
                    }
                }
            });
            $('#statmnts_datatable_organization_filter').on('change', function () {
                $('select[name="organization_id"]').val($(this).val()).change();
            });
            $('select[name="organization_id"]').on('change', function () {
                statmnts.updateDonorsTagListUrl();
                updateFundsList();
            });
            function updateFundsList() {
                $.post(base_url + 'funds/get_funds_list', {organization_id: $('select[name="organization_id"]').val(), get_all: $('select[name="organization_id"]').val() ? 0 : 1}, function (result) {
                    var selectInput = $('select[name="fund_id"]');
                    selectInput.empty();
                    selectInput.append($('<option>', {value: ''}).text('All Funds'));
                    for (var i in result) {
                        selectInput.append($('<option>', {value: result[i].id}).text(result[i].name));
                    }
                    $('select[name="fund_id"]').change();
                }).fail(function (e) {
                    console.log(e);
                });
            }

            $('select[name="fund_id"]').on('change', function () {
                statmnts.updateDonorsTagListUrl();
            });
            $('#all_donors_checkbox').on('change', function () {
                $("#donors_tags_list").val(null).trigger('change');
                if ($(this).is(':checked')) {
                    $.post(statmnts.getDonorURL() + '&all=1', function (result) {
                        var arr_data = [];
                        $("#donors_tags_list").empty();
                        $.each(result.items, function () {
                            arr_data.push(this.id);
                            $("#donors_tags_list").append($('<option>', {value: this.id, text: this.text}));
                        });
                        $("#donors_tags_list").val(arr_data).trigger('change');
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            });
            //==== date pickers
            var st_from = $('#st_from').datepicker({
                format: "mm/dd/yyyy",
                endDate: "0m",
                orientation: 'bottom'
            }).on('changeDate', function (ev) {
                st_from.hide();
                statmnts.updateDonorsTagListUrl();
            }).data('datepicker');
            $('#st_from').datepicker('setDate', moment().subtract(1, 'months').format("L"));
            var st_to = $('#st_to').datepicker({
                format: "mm/dd/yyyy",
                endDate: "0m",
                orientation: 'bottom'
            }).on('changeDate', function (ev) {
                st_to.hide();
                statmnts.updateDonorsTagListUrl();
            }).data('datepicker');
            $('#st_to').datepicker('setDate', moment().format("L"));
            //===== open modal 
            $('.btn-add-statement').on('click', function () {
                statmnts.resetForm();
                $('#add_statement_modal').modal('show');
                $('#add_statement_modal .overlay').attr("style", "display: none!important");
            });
            //==== date pickers end

            //******************* TABS NAV - WORKS WITH THE HANDLER
            $('#st_btn_action').on('click', function () {
                statmnts.tabsHandler.nextTab();
            });
            $('#st_btn_back').on('click', function () {
                statmnts.tabsHandler.backTab();
            });
            $('.xanav-selector').on('click', function (e) {
                var index = $(this).attr('data-position') - 1;
                var resp = statmnts.tabsHandler.setTab(index);
                if (!resp) {
                    return false;
                }
            });
            $('input[type=radio][name="st_opt_output"]').on('change', function (e) {
                if ($(this).val() == 'email') {
                    $('#email_message').parent().show('fast');
                    $('#email_message').focus();
                } else {
                    $('#email_message').parent().hide('fast');
                }
            });
            //***

            //==== setup form fields on modal open
            function getStatementDetails(id) {
                loader('show');
                $.post(base_url + 'statements/get', {id: id}, function (result) {
                    let modal = '#details_statement_modal';

                    $(modal + ' #statement_id').val('#' + result.id);
                    $(modal + ' #created_by').val(result.created_by == 'D' ? result.donor_f_name + ' ' + result.donor_l_name : 'Admin Dashboard');
                    $(modal + ' #church_name').val(result.orgnx ? result.orgnx.church_name : 'All');
                    $(modal + ' #date_from').val(result.date_from);
                    $(modal + ' #date_to').val(result.date_to);
                    $(modal + ' #created_at').val(result.created_at);
                    $(modal + ' #donors_number').val(result.donors.length);
                    $(modal + ' #btn_download').attr('data-file_url', result.file_url);

                    $(modal + ' #btn_download').hide();
                    if (result.created_by == 'A') {
                        $(modal + ' #btn_download').show();
                    }

                    var selectInput1 = $(modal + ' #donors').empty();
                    $.each(result.donors, function () {
                        selectInput1.append($('<option>', {value: '', text: this.donor_name + ' ' + this.donor_email}));
                    });
                    loader('hide');
                }).fail(function (e) {
                    console.log(e);
                });
            }
            $(document).on('click', '.stm-show-detail', function () {
                let id = $(this).attr('data-statement-id');
                getStatementDetails(id);
                $('#details_statement_modal').modal('show');
                $('#details_statement_modal .overlay').attr("style", "display: none!important");
            });

            $(document).on('click', '.stm-download', function () {
                let file_url = $(this).attr('data-file_url');
                window.open(file_url, '_BLANK');
            });

            $(document).on('click', '#btn_download', function () {
                let file_url = $(this).attr('data-file_url');
                let created_by = $(this).attr('data-created_by');
                window.open(file_url, '_BLANK');
            });
        }

    };
}());

