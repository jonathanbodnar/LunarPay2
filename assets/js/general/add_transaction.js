(function () {

    $(document).ready(function () {
        transaction.set_modal();
        transaction.initializeImasks();
    });
    var transaction = {
        transaction_dateImask: null,
        btn:null, donor_id: null, fund_id: null, fund_name: null, organization_id: null, suborganization_id: null, //When fund id is provided
        set_modal: function () {
            $('#add_transaction_form input').keypress(function (e) {
                if (e.which == 13) {
                    transaction.save();
                    e.preventDefault();
                    return false;
                }
            });

            $(document).on('click', '.btn-GENERAL-add-transaction', function () {                
                loader('show');
                transaction.btn = this;
                $('#add_transaction_form')[0].reset();
                 
                //the modal can be opened with a fund already defined, in that case we hide fields that we don't need
                if (typeof $(this).attr('data-fund_id') !== 'undefined') {                    
                    $('#add_transaction_modal .hide-when-fund-id-provided').hide();
                    $('#add_transaction_modal .show-when-fund-id-provided').show();    
                    transaction.fund_id = $(this).attr('data-fund_id');
                    transaction.getFundWithOrgnData(transaction.fund_id); //it triggers transaction.getOrganizationList(); ajax cascade
                } else {
                   transaction.getOrganizationList(this); //ajax cascade
                }

                if (typeof $(this).attr('data-context') !== 'undefined') {
                    transaction.reorderHtml($(this).attr('data-context'));
                }

                if (typeof $(this).attr('data-donor_id') !== 'undefined') {
                    $('#add_transaction_modal select[name="operation"]').val('DN').trigger('change'); //when donor id is used, operation is forced to Donation
                    $('#add_transaction_modal select[name="operation"]').attr('disabled','true');
                    $('#add_transaction_modal select[name="account_donor_id"]').append($('<option>',{value: $(this).attr('data-donor_id'), text: $(this).attr('data-donor_name')})).trigger('change');
                    $('#add_transaction_modal select[name="account_donor_id"]').select2("trigger", "select", {data: {'id': $(this).attr('data-donor_id')}});
                    $('#add_transaction_modal select[name="account_donor_id"]').attr('disabled','true');
                    transaction.donor_id = $(this).attr('data-donor_id');
                    
                    $('#add_transaction_modal .organization_container').hide();
                    $('#add_transaction_modal .suborganization_container').hide();
                }
                //when using modals we need to reset/sync the imask fields values otherwise we will have warnings and unexpected behaviors
                //transaction.transaction_dateImask.value = '';
                transaction.transaction_dateImask.value = moment().format("L");                

                $('#add_transaction_modal').find('.alert-validation').first().empty().hide();
                $('#add_transaction_modal').modal('show');
            });
            $('#add_transaction_modal').on('show.bs.modal', function () {
                setup_multiple_modal();
            });

            $('#add_transaction_modal').on('shown.bs.modal', function () {
                //$('#add_transaction_modal').find(".focus-first").first().focus();
            });

            $('#add_transaction_modal select[name="organization_id"]').on('change', function () {
                if (typeof $(transaction.btn).attr('data-donor_id') == 'undefined') {
                    $('#add_transaction_modal select[name="account_donor_id"]').val(null).trigger('change');
                }
                transaction.getSubOrganizationList();
            });
            $('#add_transaction_modal select[name="suborganization_id"]').on('change', function () {
                if (typeof $(transaction.btn).attr('data-donor_id') == 'undefined') {
                    $('#add_transaction_modal select[name="account_donor_id"]').val(null).trigger('change');
                }
                transaction.getFundList();
            });
            $('#add_transaction_modal select[name="operation"]').on('change', function () {
                if($('#add_transaction_modal select[name="operation"]').val() == 'DN'){ //Donation
                    $('.donation_fields').css('display', 'flex');
                } else {
                    $('.donation_fields').hide();
                }
            });

            $(document).on('click', '#add_transaction_modal .btn-save', function () {
                transaction.save();
            });

            $('#add_transaction_modal .select2.donor').select2({
                tags: false,
                multiple: false,
                placeholder: 'Select a Donor',
                ajax: {
                    url: function () {
                        return base_url + 'donors/get_tags_list_pagination';
                    },
                    type: "post",
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        return {
                            organization_id: $('#add_transaction_modal select[name="organization_id"]').val(),
                            suborganization_id: $('#add_transaction_modal select[name="suborganization_id"]').val(),
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
                if ($('.select2-link2.donor').length) {
                    $('.select2-link2.donor').remove();
                }
                
                let organization_id = $('#add_transaction_modal select[name="organization_id"]').val();                
                let organization_name = $('#add_transaction_modal select[name="organization_id"] :selected').text();                
                let suborganization_id = $('#add_transaction_modal select[name="suborganization_id"]').val();
                let suborganization_name = $('#add_transaction_modal select[name="suborganization_id"] :selected').text();

                let disabled = organization_id ? '' : 'disabled';

                a.$results.parents('.select2-results')
                    .append('<div class="select2-link2 donor"><button class="btn btn-primary btn-GENERAL-person-component" '+disabled+' data-is_select2_id="#add_transaction_modal .select2.donor" data-is_select2="true" ' +
                        'data-org_id="'+organization_id+'" data-org_name="'+organization_name+
                        '" data-suborg_id="'+suborganization_id+'" data-suborg_name="'+suborganization_name+
                        '" style="width: calc(100% - 20px); margin: 0 10px; margin-top: 5px">' +
                        ' <i class="fas fa-user"></i> Create Donor</button></div>')
            });
        },
        getOrganizationList: function () {
            let drdOrg = $('#add_transaction_modal select[name="organization_id"]');
            drdOrg.empty();
            drdOrg.append($('<option>', {value: ''}).text('Select A Company'));
            $.post(base_url + 'organizations/get_organizations_list', function (result) {

                for (var i in result) {                    
                    drdOrg.append($('<option>', {value: result[i].ch_id, text: result[i].church_name, selected: (i == 0 ? false : false)}));
                }
                if (typeof $(transaction.btn).attr('data-donor_id') !== 'undefined') {
                    transaction.organization_id = parseInt($(transaction.btn).attr('data-org_id')) ? parseInt($(transaction.btn).attr('data-org_id')) : null;
                    drdOrg.val(transaction.organization_id);
                    drdOrg.change();
                } else if (result.length > 0) {
                    drdOrg.find('option:eq(1)').attr('selected', 'selected');
                    drdOrg.change();
                }

            }).fail(function (e) {
                console.log(e);
            });
        },
        getSubOrganizationList: function () {
            let drdSuborg = $('#add_transaction_modal select[name="suborganization_id"]');
            drdSuborg.empty();
            drdSuborg.append($('<option>', {value: ''}).text('Select A Sub Organization'));
            let organization_id = $('#add_transaction_modal select[name="organization_id"]').val();
            $.post(base_url + 'suborganizations/get_suborganizations_list', {organization_id: organization_id}, function (result) {
                for (let i in result) {
                    drdSuborg.append($('<option>', {value: result[i].id}).html(result[i].name));
                }

                if (typeof $(transaction.btn).attr('data-donor_id') !== 'undefined') {
                    transaction.suborganization_id = parseInt($(transaction.btn).attr('data-suborg_id')) ? parseInt($(transaction.btn).attr('data-suborg_id')) : null;
                    drdSuborg.val(transaction.suborganization_id);
                    drdSuborg.change();
                    
                    let organization_name = $('#add_transaction_modal select[name="organization_id"] :selected').text();
                    //show header label
                    $("#amount").focus();     
                    $('#add_transaction_modal .header-label').show();
                    $('#add_transaction_modal span.organization_name').show();
                    $('#add_transaction_modal span.organization_name').text(organization_name);
                    $('#add_transaction_modal select[name="account_donor_id"]').attr('data-org_id', transaction.organization_id);
                    $('#add_transaction_modal select[name="account_donor_id"]').attr('data-org_name', organization_name);

                    if(transaction.suborganization_id){
                        let suborganization_name = $('#add_transaction_modal select[name="suborganization_id"] :selected').text();
                        $('#add_transaction_modal span.suborganization_name').show();
                        $('#add_transaction_modal span.suborg-separator').show();
                        $('#add_transaction_modal span.suborganization_name').text(suborganization_name);

                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_id', transaction.suborganization_id);
                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_name', suborganization_name);
                    } else {
                        $('#add_transaction_modal span.suborganization_name').hide();
                        $('#add_transaction_modal span.suborg-separator').hide();
                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_id', null);
                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_name', null);
                    }
                }

                 if ($(transaction.btn).attr('data-context') =='donation' )
                {
                    
                    $("#amount").focus();           
   
                    $('#add_transaction_modal .organization_container').hide();
                    $('#add_transaction_modal .suborganization_container').hide();
                    let organization_name = $('#add_transaction_modal select[name="organization_id"] :selected').text();                     
                    
                    $('#add_transaction_modal .header-label').show();
                    $('#add_transaction_modal span.organization_name').show();
                    $('#add_transaction_modal span.organization_name').text(organization_name);
                    $('#add_transaction_modal select[name="account_donor_id"]').attr('data-org_id', transaction.organization_id);
                    $('#add_transaction_modal select[name="account_donor_id"]').attr('data-org_name', organization_name);                   
                     
                    if(_global_objects.currnt_org.sorgnx_id){
                        
                        $('#add_transaction_modal span.suborganization_name').show();
                        $('#add_transaction_modal span.suborg-separator').show();
                        $('#add_transaction_modal span.suborganization_name').text(_global_objects.currnt_org.suborgName);

                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_id', _global_objects.currnt_org.sorgnx_id);
                        $('#add_transaction_modal select[name="account_donor_id"]').attr('data-suborg_name',_global_objects.currnt_org.suborgName);
                    }
                }

                drdSuborg.change(); //trigger the getFundList method

            }).fail(function (e) {
                console.log(e);
            });
        },
        getFundList: function () {
            let _org_id = $('#add_transaction_modal select[name="organization_id"]').val();
            let _suborg_id = $('#add_transaction_modal select[name="suborganization_id"]').val();
            $.post(base_url + 'funds/get_funds_list', {organization_id: _global_objects.currnt_org.orgnx_id, suborganization_id:_global_objects.currnt_org.sorgnx_id , get_all: 0}, function (result) {
                var drdFunds = $('#add_transaction_modal select[name="fund_id"]');
                drdFunds.empty();
                drdFunds.append($('<option>', {value: ''}).text('Select A Fund'));
                for (var i in result) {
                    drdFunds.append($('<option>', {value: result[i].id}).text(result[i].name));
                }
                 drdFunds.find('option:eq(1)').attr('selected', 'selected');
                loader('hide');
            }).fail(function (e) {
                loader('hide');
                console.log(e);
            });
        },
        getFundWithOrgnData : function (fund_id) {
            $('#add_transaction_modal .sub-separator').hide();
            $.post(base_url + 'funds/get_fund_with_orgn_data', {id: fund_id}, function (result) {        
                if (result.fund) {
                    $('#add_transaction_modal .organization_name').text(result.fund.church_name);
                    
                    if(result.fund.campus_name) {
                        $('#add_transaction_modal .suborganization_name').text(result.fund.campus_name);
                        $('#add_transaction_modal .sub-separator').show();
                    }                    
                    
                    $('#add_transaction_modal .fund_name').text(result.fund.name);

                    transaction.organization_id = result.fund.church_id;
                    transaction.suborganization_id = result.fund.campus_id;
                    
                    loader('hide');
                }
            }).fail(function (e) {                
            });
        },
        save: function () {

            loader('show');

            let data = $("#add_transaction_form").serializeArray();
            let save_data = {};
            $.each(data, function () {
                save_data[this.name] = this.value;
            });
            
            if (transaction.fund_id) { //if fund_id was provided load organization_id and suborganization_id not from dropdownlist
                save_data['fund_id'] = transaction.fund_id;
                save_data['organization_id'] = transaction.organization_id;
                save_data['suborganization_id'] = transaction.suborganization_id;
            }

            if (transaction.donor_id){
                save_data['account_donor_id'] = transaction.donor_id;
                save_data['operation'] = 'DN';
                save_data['organization_id'] = transaction.organization_id;
                save_data['suborganization_id'] = transaction.suborganization_id;
            }
            if ($(transaction.btn).attr('data-context') =='donation')
            {
                save_data['organization_id'] = _global_objects.currnt_org.orgnx_id;                
                if (_global_objects.currnt_org.orgnx_id)
                {
                save_data['suborganization_id']= _global_objects.currnt_org.sorgnx_id;
                }
             }
            
            $.post(base_url + 'donations/save_transaction', save_data, function (result) {
                if (result.status) {
                    $('#add_transaction_modal').modal('hide');
                    transaction.notify({title: 'Notification', 'message': result.message});

                    if (_global_objects.donations_dt) { //if the object is not set there is no need of refreshing
                        _global_objects.donations_dt.draw(false);
                    }
                    
                    if (_global_objects.funds_dt) { //if the object is not set there is no need of refreshing
                        _global_objects.funds_dt.draw(false);
                    }

                    if($(transaction.btn).attr('data-context') === 'donor-profile'){
                        setTimeout(function () {
                            location.reload();
                        }, 3000);
                    }

                } else if (result.status == false) {                    
                    $('#add_transaction_modal').find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                    //$('#add_transaction_modal').get(0).scrollIntoView();    
                    $('#add_transaction_modal').animate({scrollTop: 0}, 'fast'); //guide the user to see the error by scrolling to the top
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

        reorderHtml: function(context) {
            if(context == 'fund'){
                $('#add_transaction_modal .donation_fields').removeClass('col-md-8');
                $('#add_transaction_modal .donation_fields').addClass('col-md-4');
            } else if(context == 'donor' || context == 'donor-profile' ) {
                $('#add_transaction_modal .donation_fields').removeClass('col-md-8');
                $('#add_transaction_modal .donation_fields').addClass('col-md-4');
            }
        },
        initializeImasks: function () {
            let momentFormat = 'MM/DD/YYYY';
            transaction.transaction_dateImask = IMask(document.getElementById('add_transaction_modal.transaction_date'), {
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
        },
        notify: function (options) {
            $.notify({
                icon: 'ni ni-money-coins',
                title: options.title,
                message: options.message,
                url: ''
            }, {
                element: 'body',
                type: 'primary',
                allow_dismiss: true,
                placement: {
                    from: 'top',
                    align: 'right'
                },
                offset: {
                    x: 15, // Keep this as default
                    y: 15 // Unless there'll be alignment issues as this value is targeted in CSS
                },
                spacing: 10,
                z_index: 1080,
                delay: 2000, //notify_delay
                timer: 2000, //notify_timer
                url_target: '_blank',
                mouse_over: true,
                animate: {enter: 1000, exit: 1000},
                template: '<div data-notify="container" class="alert alert-dismissible alert-{0} alert-notify" role="alert" style="width: 350px">' +
                        '<span class="alert-icon" data-notify="icon"></span> ' +
                        '<div class="alert-text"</div> ' +
                        '<span class="alert-title" data-notify="title">{1}</span> ' +
                        '<span data-notify="message">{2}</span>' +
                        '</div>' +
                        //'<div class="progress" data-notify="progressbar">' +
                        //'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                        //'</div>' +
                        '<a href="{3}" target="{4}" data-notify="url"></a>' +
                        '<button type="button" class="close" data-notify="dismiss" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                        '</div>'
            });

        }
    };
}());

