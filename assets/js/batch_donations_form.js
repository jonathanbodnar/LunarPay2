var batch_donations_form = {};
(function () {
    batch_donations_form = {
        count_donations_removed: 0,
        htmlCont: '#batch-donations-form-container',
        initForm: function () {
            $(batch_donations_form.htmlCont+' form .donation-row').remove();
            batch_donations_form.addDonationRow();

            $(batch_donations_form.htmlCont+' #btn-save-donations').click(function () {
                loader('show');

                let data = $(batch_donations_form.htmlCont + ' form').serializeArray();
                let save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                
                batches.trClickAutoId = batches.currentBatch.id; //click tr after batches.datatable.draw
                
                $.post(base_url + 'batches/create_transactions/' + batches.currentBatch.id, save_data, function (result) {
                    if (result.status) {
                        notify({title: 'Notification', 'message': result.message});
                        batches.datatable.draw(false);
                    } else if(result.status == false){
                        if(typeof result.exception !== 'undefined' && result.exception) {
                            error_message(result.errors);
                        } else {
                            error_message('<p><strong>' + result.error_row + '</strong></p>' + result.errors);
                        }
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
            });
            $(document).on('click', batch_donations_form.htmlCont + ' .btn-add-donation', function(){
                batch_donations_form.addDonationRow();
            });
        },
        resetForm: function () {
            $(batch_donations_form.htmlCont+' form .donation-row').remove();
            batch_donations_form.addDonationRow();
            this.count_donations_removed = 0;
        },
        setFunds: function (control_id) {
            let organization_id = batches.currentBatch.church_id;
            let suborganization_id = batches.currentBatch.campus_id;
            $.post(base_url + 'funds/get_funds_list', {organization_id: organization_id, suborganization_id: suborganization_id, get_all: 0}, function (result) {
                var drdFunds = $(batch_donations_form.htmlCont + ' ' + control_id);
                drdFunds.empty();
                //drdFunds.append($('<option>', {value: ''}).text('Select Fund'));
                for (var i in result) {
                    drdFunds.append($('<option>', {value: result[i].id}).text(result[i].name));
                }
            }).fail(function (e) {
                console.log(e);
            });
        },
        addDonationRow: function () {
            let donation_row = $(batch_donations_form.htmlCont+' form .donation-row').length + 1;
            let donation_number = donation_row + batch_donations_form.count_donations_removed;

            //donation-title is disabled for now (d-none=> display: none), let leave that code there, probably we may want to use the donation-title (row counter label) later
            $(batch_donations_form.htmlCont+' form #batch-donations-form-items').append(`
                <div id="donation-`+donation_number+`" class="form-group row donation-row mb-1" style="display: none">
                    <div class="col-12 bold-weight py-2">
                        <span class="badge badge-secondary bold-weight" style="margin-left: -3px;">
                            Donation <span class="donation-title">`+donation_row+`</span>
                        </span>
                        <span style="cursor:pointer; font-size:11px; color:#7a7a7a; float:right;" class="ml-2 badge remove-donation-row-btn" id="remove-donation-row-btn-`+donation_number+`" data-donation_id="`+donation_number+`">
                            Remove
                        </span>
                    </div>
                    <div class="col-md-5">
                        <div class="form-group required">
                            <label class="required">Donor</label> <br />
                            <select id="person-`+donation_number+`" class="form-control select2 donor" name="donor[`+donation_number+`]" placeholder="">
                            </select>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group required">
                            <label for="amount">Amount</label> <br />
                            <input type="number" class="form-control" name="amount[`+donation_number+`]" placeholder="0.00">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="fund">Fund</label> <br />
                            <select class="form-control" name="fund[`+donation_number+`]" placeholder="">
                            </select>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label for="method">Payment Method</label> <br />
                            <select class="form-control" name="method[`+donation_number+`]" placeholder="">
                                <option value="Cash">Cash</option>
                                <option value="Check">Check</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-12">
                        &nbsp;
                    </div>
                    <div class="col-md-3">
                        <div class="form-group required">
                            <label for="date">Received Date</label> <br />
                            <input id="received-date-`+donation_number+`" class="form-control received_date" name="date[`+donation_number+`]" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label for="details">Details</label> <br />
                        <input type="text" class="form-control" name="details[`+donation_number+`]">
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="details">&nbsp;</label> <br />
                            <button type="button" class="m-auto w-75 btn btn-neutral btn-add-donation">
                                <i class="fa fa-plus"></i> Donation Row
                            </button>
                        </div>
                    </div>
                    <div class="col-sm-12"><hr id="scrollto-`+donation_number+`" style="margin-top: 30px" class="mb-0"></div>                 
                </div>
            `);
            
            $(batch_donations_form.htmlCont + ' #donation-' + donation_number).fadeIn('fast');
            
            $(batch_donations_form.htmlCont + ' #person-'+donation_number).select2({
                multiple: false,
                placeholder: 'Select Donor',
                ajax: {
                    url: function () {
                        return base_url + 'donors/get_tags_list_pagination';
                    },
                    type: "post",
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            organization_id: batches.currentBatch.church_id,
                            suborganization_id: batches.currentBatch.campus_id,
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
            }).on('select2:open', function () {
                let a = $(this).data('select2');
                if (!$('.select2-link2').length) {
                    a.$results.parents('.select2-results')
                        .append('<div class="select2-link2"><button class="btn btn-primary btn-GENERAL-person-component" data-is_select2_id="#person-'+donation_number+'" data-is_select2="true" ' +
                            'data-org_id="'+batches.currentBatch.church_id+'" data-org_name="'+batches.currentBatch.church_name+
                            '" data-suborg_id="'+batches.currentBatch.campus_id+'" data-suborg_name="'+batches.currentBatch.campus_name+
                            '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                            ' <i class="fas fa-user"></i> Create Donor</button></div>')
                }
            });
            batch_donations_form.setFunds('#donation-' + donation_number + ' select[name="fund['+donation_number+']"]');

            $(batch_donations_form.htmlCont+' #remove-donation-row-btn-'+donation_number).on('click',function () {
                batch_donations_form.removeDonationRow($(this).attr('data-donation_id'));
            });

            $(batch_donations_form.htmlCont+' #received-date-'+donation_number).val(moment().format("L"));
            //Adding Mask to Received Date
            let momentFormat = 'MM/DD/YYYY';
            IMask($(batch_donations_form.htmlCont +' #received-date-'+donation_number).get(0), {
                mask: Date,
                pattern: momentFormat,
                lazy: false,
                min: new Date(1900, 0, 1),
                max: new Date(3000, 0, 1),
                format: function (date) {
                    return moment(date).format(momentFormat);
                },
                parse: function (str) {
                    return moment(str, momentFormat);
                },
                blocks: {
                    YYYY: {
                        mask: IMask.MaskedRange,
                        from: 1970,
                        to: 2999
                    },
                    MM: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 12
                    },
                    DD: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 31
                    }
                }
            });
            
            if($(batch_donations_form.htmlCont + ' #batch-donations-form-items .donation-row').length > 2) {
                //help with a smooth scrol to the user just when there are more than 2 rows
                setTimeout(function () {
                    $([document.documentElement, document.body]).animate({
                        scrollTop: $(batch_donations_form.htmlCont + ' #scrollto-' + donation_number).offset().top
                    }, 1000);
                }, 250);
            }
            
            $(batch_donations_form.htmlCont + ' #person-' + donation_number).select2('focus');
        },
        removeDonationRow: function (donation_number) {
            if($(batch_donations_form.htmlCont + ' .donation-row').length == 1) 
                return; //do not allow to remove all donation rows
            
                //slideup --
                $(batch_donations_form.htmlCont + ' #donation-' + donation_number).slideUp(400, function () {
                    $(batch_donations_form.htmlCont + ' #donation-' + donation_number).remove();
                });
            
            setTimeout(function(){
                let i_row = 1;
                $.each($(batch_donations_form.htmlCont + ' .donation-row'), function () {
                    $(this).find('.donation-title').text(i_row);
                    i_row++;
                });
                batch_donations_form.count_donations_removed++;
            }, 500); //wait till slideup -- important (we would not need setTimeout functions if dont using slideUp)
            
            
        }
    };
}());

