var batches = {};

(function () {

    loader('show');

    $(document).ready(async function () {

        let drdOrg = await batches.loadOrgnxFilter(); //wait for loading organizations filter before loading the datatables, they need this param
        drdOrg.find('option:eq(1)').attr('selected', 'selected');

        batches.loadSubOrgnxFilter();

        loader('hide');

        // ------
        batches.setDt();
        //we need to init the batch donations form after the batches table is loaded, 
        //initForm depends on batch_id, church_id, campus_id, those are set on fnDrawCallback so we call
        //batch_donations_form.initForm() on fnInitComplete, then initForm can work 
        // ------

        batches.setModal();
        batches.setDonationsDt();

        batches.setCommitModal();

    });

    let currentBatchEmpty = {'id': null}; //for reseting currentBatch 
    batches = {
        htmlCont: '#batches-container',
        datatable: null,
        datatableDonations: null,
        currentBatch: currentBatchEmpty,
        trClickAutoId: null, //for tiggering the tr click with a specific table row for example after editing a batch
        showFormAfterDTCallback: false,
        resetBatchModalForm: function () {

            $(batches.htmlCont + ' .add_modal').find('.alert-validation').first().empty().hide();

            $(batches.htmlCont + ' .add_modal .sub-title').hide();
            $(batches.htmlCont + ' .add_modal .organization_name').text($(batches.htmlCont + ' #datatable_organization_filter option:selected').text());
            $(batches.htmlCont + ' .add_modal .organization_name').show();

            if ($(batches.htmlCont + ' #datatable_suborganization_filter').val() != '') {
                $(batches.htmlCont + ' .add_modal .suborganization_name').text($(batches.htmlCont + ' #datatable_suborganization_filter option:selected').text());
                $(batches.htmlCont + ' .add_modal .sub-separator').show();
                $(batches.htmlCont + ' .add_modal .suborganization_name').show();
            }

            $(batches.htmlCont + ' #add_form')[0].reset();
            $(batches.htmlCont + ' .add_modal #batch_tags').empty();

            $(batches.htmlCont + ' .add_modal .btn-save-reg').hide(); //hide create & update buttons
            if ($(batches.htmlCont + ' #add_form').attr('data-id') == '0') {
                $(batches.htmlCont + ' .add_modal .btn-create-reg').show();
            } else {
                $(batches.htmlCont + ' .add_modal .btn-update-reg').show();
            }

        },
        populateForm: function (batch) {
            if (batch) {

                $(batches.htmlCont + ' #add_form input[name="batch_name"]').val(batch.name);
                $.each(batch.tags.elements, function () {
                    //////////////////////////////////////////////////////////////////////////// we make texts to work as ids
                    $(batches.htmlCont + ' #add_form #batch_tags').append($('<option>', {value: this.text, text: this.text})).trigger('change');
                    $(batches.htmlCont + ' #add_form #batch_tags').select2("trigger", "select", {data: {'id': this.text}});
                    ////////////////////////////////////////////////////////////////////////////
                });

            }
        },
        setModal: function () {
            $(batches.htmlCont + ' #add_form input').keypress(function (e) {
                if (e.which == 13) {
                    batches.save();
                    e.preventDefault();
                    return false;
                }
            });

            //===== open modal 
            $(document).on('click', batches.htmlCont + ' .btn-add', function (e) {
                loader('show');

                $(batches.htmlCont + ' #add_form').attr('data-id', 0);
                batches.resetBatchModalForm();

                $(batches.htmlCont + ' .add_modal').modal('show');

                e.preventDefault();
            });

            $(document).on('click', batches.htmlCont + ' .batch-edit', async function (e) {
                loader('show');

                let batch_id = $(this).attr('data-id');
                $(batches.htmlCont + ' #add_form').attr('data-id', batch_id);
                batches.resetBatchModalForm();

                let batch = await batches.get(batch_id);

                batches.populateForm(batch);

                $(batches.htmlCont + ' .add_modal').modal('show');

                e.preventDefault();
            });


            $(batches.htmlCont + ' .add_modal').on('shown.bs.modal', function () {
                $(batches.htmlCont + ' .focus-first').focus();
                loader('hide');
            });

            batches.initTagsBatchModal();

            $(document).on('click', batches.htmlCont + ' .add_modal .btn-save-reg', function () {
                batches.save();
            });

            $(document).on('click', batches.htmlCont + ' .add_modal .btn-close-modal', function () {
                $(batches.htmlCont + ' .add_modal').modal('hide');
            });

        },
        setDt: function () {
            $(batches.htmlCont + ' #datatable_organization_filter').change(function () { //Event Change Organization Filter
                
                //reset filters
                $(batches.htmlCont + ' #batch_tags_filter').empty().trigger('change');
                batches.datatable.search('');
                
                batches.loadSubOrgnxFilter();
                batches.datatable.draw(false);
            });

            $(batches.htmlCont + ' #datatable_suborganization_filter').change(function () { //Event Change Organization Filter
                //reset selection
                $(batches.htmlCont + ' #batch_tags_filter').empty().trigger('change');
                batches.datatable.search('');
                
                batches.datatable.draw(false);
            });

            $(batches.htmlCont + ' #main_datatable').on('click', 'tbody tr', function () {
                let rowData = batches.datatable.row($(this)).data();
                batches.selectRowDt(rowData, $(this));
                batches.showFormVsGridToggle('grid');
            });

            $(batches.htmlCont + ' #main_datatable tbody tr:first').click();

            $(document).on('click', batches.htmlCont + ' .batch-add-donations', function () {
                $('html, body').animate({scrollTop: 0}, 'fast');
                batches.showFormVsGridToggle('form');
            });

            $(document).on('click', batches.htmlCont + ' .batch-view-donations', function () {
                batches.showFormVsGridToggle('grid');
            });
            
            $(batches.htmlCont + ' #batch_tags_filter').on("change", function (e) {
                batches.datatable.draw(false);                
            }); 

            batches.initTagsFilter();

            batches.datatable = $(batches.htmlCont + ' #main_datatable').DataTable({
                "dom": '<"row"<"col-sm-12"f>><"row"<"col-sm-12">>rt<"row"<"col-md-6 text-right"l><"col-md-6 text-center"p><"col-md-12 padding-bottom10px text-center"i>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[5, 10, 50], [5, 10, 50]],
                order: [[0, "desc"]],
                pagingType: 'simple', //remove numers from paging
                //deferLoading: 0,
                ajax: {
                    url: base_url + "batches/get_dt", type: "POST",
                    "data": function (d) {
                        d.organization_id = $(batches.htmlCont + ' #datatable_organization_filter').val();
                        d.suborganization_id = $(batches.htmlCont + ' #datatable_suborganization_filter').val();
                        d.tags_filter = $(batches.htmlCont + ' #batch_tags_filter').select2('val');
                    }
                },
                "fnPreDrawCallback": function () {

                },
                "fnDrawCallback": function () {

                    $(batches.htmlCont + ' .donations-batch-name').text($(batches.htmlCont + ' .donations-batch-name').attr('data-default_text'));
                    $(batches.htmlCont + ' .donations-batch-tags').html('');

                    let data = batches.datatable.data();

                    if (data.length > 0) {
                        if (batches.trClickAutoId == null) { //Some 
                            $(batches.htmlCont + ' #main_datatable tbody tr:first').click();
                        } else {
                            $(batches.htmlCont + ' #main_datatable tbody tr#' + batches.trClickAutoId).click(); //for tiggering the tr click with a specific table row for example after editing a batch
                            batches.trClickAutoId = null; //reset it again
                        }

                    } else {
                        batches.currentBatch = currentBatchEmpty; //reset currentBatch
                        batches.datatableDonations.draw(false);
                        batches.showFormVsGridToggle('grid');
                    }

                    //batches form depends on batches.currentBatch data, always that currentBatch changes we need to reset the form with new data
                    batch_donations_form.resetForm();

                    if (batches.showFormAfterDTCallback) {
                        $(batches.htmlCont + ' button.batch-add-donations').click(); //button... important otherwise we would be clicking all the batch-add-donations for each row in batches table
                        batches.showFormAfterDTCallback = false;
                    }
                },
                "fnCreatedRow": function (nRow, aData, iDataIndex) {
                    $(nRow).attr('id', aData.id); //add the id to the tr element
                },
                columns: [
                    {data: 'id', visible: false, searchable: false},
                    {data: 'id', className: "text-center", visible: false, sortable: false, searchable: false, mRender: function (data, type, full) {
                            return `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" href="#"role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="gear-edit dropdown-item" data-id="` + data + `" href="#">
                                            <i class="fas fa-pencil"></i>
                                            <span>Edit</span>
                                        </a>`
                                    + `</div>
                                    </li>`;
                        }
                    },
                    {data: "name", className: "", sortable: false, mRender: function (data, type, full) {
                            let tpl = ''
                                    + '<div>'
                                    + '<div class="text-left float-left" style="width:19%">'
                                    + `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" id="__batch` + full.id + `" href="#"role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="batch-edit dropdown-item" data-id="` + full.id + `">
                                            <i class="fas fa-pen"></i>
                                            <span>Edit</span>
                                        </a>
                                        <a class="batch-add-donations dropdown-item ` + (full.status == 'C' ? 'd-none' : '') + `" data-id="` + full.id + `">
                                            <i class="fas fa-hand-holding-usd"></i>
                                            <span>Add Transactions</span>
                                        </a>
                                        <a class="batch-commit-btn dropdown-item ` + (full.status == 'C' ? 'd-none' : '') + `" data-id="` + full.id + `">
                                            <i class="ni ni-cloud-upload-96"></i>
                                            <span>Commit Batch</span>
                                        </a>
                                        `
                                    + `</div>
                                    </li>`
                                    + '</div>'
                                    + '<div class="text-right float-right" style="width:80%; white-space: initial;">'
                                    + full.tags + ' '
                                    + '</div>'
                                    + '</div>'
                                    + '<div style="margin-top: 32px; padding-left: 4px; clear:both">'
                                    + '<span>' + full.name + '</span> '
                                    + '</div>'
                                    + '<div>'
                                    + '<span class="float-left" style="clear:both; margin-top:5px;" onclick="$(\'#__batch' + full.id + '\').click()">'
                                    + full.status_formatted
                                    + '</span>'
                                    + '<span style="font-size:0.9em; font-style: italic; line-height: 1.9em; margin-top:8px" class="float-right">'
                                    + full.created_at
                                    + '</span>'
                                    + '</div>'
                                    + '';

                            return tpl;
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                    $(batches.htmlCont + ' #main_datatable_filter').css('width', '100%')
                            .find('label').first().css('width', '100%')
                            .find('input').first().css('width', '100%').attr('placeholder', 'Search By Name');


                    let detached = $(batches.htmlCont + ' #main_datatable_filter').detach();
                    $(batches.htmlCont + ' #batch_input_filter_container').append(detached);

                    batch_donations_form.initForm();

                }
            });
        },
        selectRowDt: function (rowBatchData, tr) {

            if (typeof rowBatchData !== 'undefined') {
                batches.currentBatch = rowBatchData;
                $(batches.htmlCont + ' #main_datatable tbody tr').removeClass('row-selected');
                tr.addClass('row-selected');
                $(batches.htmlCont + ' .donations-batch-name').text(rowBatchData.name);
                $(batches.htmlCont + ' .donations-batch-tags').html(rowBatchData.tags);
                batches.datatableDonations.draw(false);
            }

        },
        showFormVsGridToggle: function (option) { //it can be form or grid
            $(batches.htmlCont + ' button.batch-add-donations').hide();
            $(batches.htmlCont + ' button.batch-commit-btn').hide();
            $(batches.htmlCont + ' .donations-batch-tags-icon').hide();

            if (batches.currentBatch.id && batches.currentBatch.tags != '') {
                $(batches.htmlCont + ' .donations-batch-tags-icon').show();
            }

            if (option == 'grid') {
                $(batch_donations_form.htmlCont).hide();

                $(batches.htmlCont + ' .form-element').hide();
                $(batches.htmlCont + ' .grid-element').show();
                $(batches.htmlCont + ' #batch-donations-grid').fadeIn('fast');

            } else if (option == 'form') {
                $(batches.htmlCont + ' .form-element').show();
                $(batches.htmlCont + ' .grid-element').hide();

                $(batches.htmlCont + ' #batch-donations-grid').hide();
                $(batch_donations_form.htmlCont).fadeIn('fast');

                //focusing is not working for the first donor (select2), we are putting the focus in the batch-view-donations button
                //the user with a TAB can focus the first donor (select2) without issue
                $(batches.htmlCont + ' button.batch-view-donations').focus();

            }

            $(batches.htmlCont + ' .batch-committed-badge-grid').hide();
            if (batches.currentBatch.id) {
                if (batches.currentBatch.status == 'C') {
                    $(batches.htmlCont + ' .batch-committed-badge-grid').show();
                    $(batches.htmlCont + ' button.batch-add-donations').hide();
                    $(batches.htmlCont + ' button.batch-commit-btn').hide();
                }
            } else {
                $(batches.htmlCont + ' button.batch-add-donations').hide();
                $(batches.htmlCont + ' button.batch-commit-btn').hide();
            }
        },
        setDonationsDt: function () {
            batches.datatableDonations = $(batches.htmlCont + ' #donations_datatable').DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3">>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]],
                order: [[0, "desc"]],
                //pagingType: 'simple', //remove numers from paging
                deferLoading: 0,
                ajax: {
                    url: base_url + "batches/get_batch_donations_dt", type: "POST",
                    "data": function (d) {
                        d.batch_id = batches.currentBatch.id;
                    }
                },
                "fnPreDrawCallback": function () {

                },
                "fnDrawCallback": function () {

                },
                columns: [
                    //{data: 'id', visible: false, searchable: false},
                    {data: 'id', className: "text-center", visible: false, sortable: false, searchable: false, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {data: 'name', className: "text-center", sortable: false, searchable: false, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {data: 'amount', className: "text-center", sortable: false, searchable: false, mRender: function (data, type, full) {
                            return data;
                        }
                    },
                    {data: 'id', className: "text-center", sortable: false, searchable: false, mRender: function (data, type, full) {
                            return `Type`;
                        }
                    },
                    {data: 'fund', className: "text-center", sortable: false, searchable: false, mRender: function (data, type, full) {
                            return data;
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                }
            });
        },
        get: async function (id) {
            let result = null;
            await $.ajax({
                url: base_url + 'batches/get/' + id,
                type: 'GET',
                dataType: 'json', // added data type
                cache: false,
                success: function (response) {
                    result = response;
                }
            });
            return result;
        },
        save: function () { //create/update

            loader('show');

            let data = $(batches.htmlCont + " #add_form").serializeArray();
            let save_data = {};
            $.each(data, function () {
                save_data[this.name] = this.value;
            });

            let batch_id = $(batches.htmlCont + ' #add_form').attr('data-id');

            let method = null;
            if (batch_id == '0') {
                method = 'create';
                save_data['organization_id'] = $(batches.htmlCont + ' #datatable_organization_filter').val();
                save_data['suborganization_id'] = $(batches.htmlCont + ' #datatable_suborganization_filter').val();
            } else {
                method = 'update/' + batch_id;
                batches.trClickAutoId = batch_id; //click tr after batches.datatable.draw 
            }

            save_data['batch_tags'] = $(batches.htmlCont + ' .add_modal #batch_tags').select2('val');

            $.post(base_url + 'batches/' + method, save_data, function (result) {
                if (result.status) {
                    $(batches.htmlCont + ' .add_modal').modal('hide');
                    notify({title: 'Notification', 'message': result.message});

                    batches.showFormAfterDTCallback = true;
                    batches.datatable.draw(false);

                } else if (result.status == false) {
                    $(batches.htmlCont + ' .add_modal').find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                }
                loader('hide');

                typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';

            }).fail(function (e) {
                if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                    alert(e.responseJSON.message);
                    window.location.reload();
                }
                loader('hide');
            });
        },
        loadOrgnxFilter: async function () {
            let selectInput1 = $(batches.htmlCont + ' #datatable_organization_filter');
            await $.post(base_url + 'organizations/get_organizations_list', function (result) {
                for (let i in result)
                    selectInput1.append($('<option>', {value: result[i].ch_id, text: result[i].church_name, selected: (i == 0 ? false : false)}));

                //selectInput1.change(); //refresh DT
            }).fail(function (e) {
                console.log(e);
            });

            return selectInput1;
        },
        loadSubOrgnxFilter: function () {
            let selectInput = $(batches.htmlCont + ' #datatable_suborganization_filter');
            selectInput.empty();
            selectInput.append($('<option/>', {value: ''}).html('Select a Sub Organization'));

            var organization_id = $(batches.htmlCont + ' #datatable_organization_filter').val();
            //Set Sub Organizations to Datatable Filters
            $.post(base_url + 'suborganizations/get_suborganizations_list', {organization_id: organization_id}, function (result) {
                if (result.length) {
                    selectInput.show();
                    for (var i in result) {
                        selectInput.append($('<option/>', {value: result[i].id}).html(result[i].name));
                    }
                } else {
                    selectInput.hide();
                }

            }).fail(function (e) {
                console.log(e);
            });
        },
        initTagsBatchModal: function () {

            function setTextAsId(items) {
                let newArr = [];
                $.each(items, function () {
                    newArr.push({'id': this.text, 'text': this.text});
                });
                return newArr;
            }

            $(batches.htmlCont + ' #batch_tags').select2({
                tags: true,
                multiple: true,
                placeholder: '',
                //data: []
                ajax: {
                    url: function () {
                        return base_url + 'batches/get_tags_list_all';
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

                        ////////////////////////////////////////////////////////////////////////////
                        data.items = setTextAsId(data.items); //we make texts to work as ids
                        ////////////////////////////////////////////////////////////////////////////

                        return {
                            results: data.items,
                            pagination: {
                                more: (params.page * 10) < parseInt(data.total_count)
                            }
                        };
                    }
                }
            });            
        },
        initTagsFilter : function () {
            $(batches.htmlCont + ' #batch_tags_filter').select2({
                tags: true,
                multiple: true,
                placeholder: 'Search By Tag',
                createTag: function (params) {
                    return undefined;
                },

                //data: []
                ajax: {
                    url: function () {
                        return base_url + 'batches/get_tags_list_all';
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
                                more: (params.page * 10) < parseInt(data.total_count)
                            }
                        };
                    }
                }
            });
        },
        resetCommitModalForm: function () {
            $(batches.htmlCont + ' .commit_modal').find('.alert-validation').first().empty().hide();
        },
        setCommitModal: function () {

            //===== open modal 
            $(document).on('click', batches.htmlCont + ' .batch-commit-btn', function (e) {
                loader('show');
                batches.resetCommitModalForm();
                $(batches.htmlCont + ' .commit_modal').modal('show');
                e.preventDefault();
            });

            $(batches.htmlCont + ' .commit_modal').on('shown.bs.modal', function () {
                $(batches.htmlCont + ' .focus-first').focus();
                loader('hide');
            });

            $(document).on('click', batches.htmlCont + ' .commit_modal .btn-save-reg', function () {
                batches.commit();
            });

            $(document).on('click', batches.htmlCont + ' .commit_modal .btn-close-modal', function () {
                $(batches.htmlCont + ' .commit_modal').modal('hide');
            });
        },
        commit: function () {
            loader('show');

            let data = $(batches.htmlCont + " #commit_form").serializeArray();
            let save_data = {};
            $.each(data, function () { //include csrf token
                save_data[this.name] = this.value;
            });
            
            batches.trClickAutoId = batches.currentBatch.id; //click tr after batches.datatable.draw 

            $.post(base_url + 'batches/commit/' + batches.currentBatch.id, save_data, function (result) {
                if (result.status) {
                    $(batches.htmlCont + ' .commit_modal').modal('hide');
                    notify({title: 'Notification', 'message': result.message});

                    batches.datatable.draw(false);

                } else if (result.status == false) {
                    $(batches.htmlCont + ' .commit_modal').find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                }
                loader('hide');

                typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';

            }).fail(function (e) {
                if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                    alert(e.responseJSON.message);
                    window.location.reload();
                }
                loader('hide');
            });
        }
    };
}());

