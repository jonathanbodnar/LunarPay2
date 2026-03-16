(function () {

    $(document).ready(function () {
        person.set_modal();
        person.initializeImasks();
        person.getCountrys();
    });
    var person = {
        person_id: null,
        is_select2: false,
        select2_id: null,
        context: null,
        set_modal: function () {
            $('#person_component_form input').keypress(function (e) {
                if (e.which == 13) {
                    person.save();
                    e.preventDefault();
                    return false;
                }
            });

            $(document).on('click', '.btn-GENERAL-person-component', function () {               
                loader('show');
                $('#person_component_form')[0].reset();                
                person.context = $(this).attr('data-context');
                
                   $('#person_component_modal .header-label').show();
                    $('#person_component_modal span.organization_name').show();
                    $('#person_component_modal span.organization_name').text(_global_objects.currnt_org.orgName);
                    
                    if (_global_objects.currnt_org.sorgnx_id) {                    
                    $('#person_component_modal span.suborganization_name').show();
                    $('#person_component_modal span.suborg-separator').show();
                    $('#person_component_modal span.suborganization_name').text(_global_objects.currnt_org.suborgName);
                }

                if (typeof $(this).attr('data-person_id') !== 'undefined') { // Update Setting
                    person.person_id = $(this).attr('data-person_id');
                    $('#person_component_modal .btn-save').text('Update Customer');
                    $('#person_component_form input[name="email"]').prop('disabled', true);               
                    
                } else { // Create Setting               
                    person.person_id = null;                    
                    $('#person_component_modal .btn-save').text('Create Customer');                    
                    $('#person_component_form input[name="email"]').prop('disabled', false);
                }

                if (typeof $(this).attr('data-is_select2') !== 'undefined') { // Is Select 2 Setting                    
                    person.is_select2 = $(this).attr('data-is_select2');
                    person.select2_id = $(this).attr('data-is_select2_id');
                    $(person.select2_id).select2('close');
                }

                $('#person_component_form .subtitle').hide();
                $('#person_component_modal').find('.alert-validation').first().empty().hide();
                $('#person_component_modal').modal('show');

            });

            $('#person_component_modal').on('show.bs.modal', async function () {
                setup_multiple_modal(this);
                $('#person_component_modal').find(".focus-first").first().focus();
               // await person.getOrganizationList();
                if (person.person_id !== null) {//edit mode load data
                    await $.post(base_url + 'donors/get', {id: person.person_id}, async function (result) {
                        $('#person_component_form input[name="first_name"]').val(result.donor.first_name);
                        $('#person_component_form input[name="last_name"]').val(result.donor.last_name);
                        $('#person_component_form input[name="email"]').val(result.donor.email);
                        if (result.donor.country_code_phone) {
                            $('#person_component_form select[name="country_code"]').val(result.donor.country_code_phone);
                            $('#person_component_modal select[name="country_code"]').trigger('change');
                            $('#person_component_form input[name="phone_country_code"]').val(result.donor.phone_code);
                        }
                        $('#person_component_form input[name="phone"]').val(result.donor.phone);
                        $('#person_component_form input[name="business_name"]').val(result.donor.business_name);
                        $('#person_component_form input[name="address"]').val(result.donor.address);
                        
                        $('#person_component_modal .overlay').attr("style", "display: none!important");
                    }).fail(function (e) {
                        console.log(e);
                        $('#person_component_modal .overlay').attr("style", "display: none!important");
                    });
                } else {
                   // $('#person_component_modal select[name="organization_id"]').trigger('change');
                    $('#person_component_modal select[name="country_code"]').trigger('change')
                }
                loader('hide');
            });

            $('#person_component_modal').on('shown.bs.modal', async function () {
                $('#person_component_modal').find(".focus-first").first().focus();
            });

            $('#person_component_modal select[name="country_code"]').change(function () {
                $phone_code = $('#person_component_modal select[name="country_code"] :selected').data('phone');
                $('#person_component_modal input[name="phone_country_code"]').val($phone_code);
                $country_code = $('#person_component_modal select[name="country_code"]').val();
                $('#person_component_modal #img_country').attr('src', base_url + 'assets/images/countrys/' + $country_code.toLowerCase() + '.svg')
            });

            $(document).on('click', '#person_component_modal .btn-save', function () {
                person.save();
            });
        },    
        getCountrys: async function () {
            await $.getJSON(base_url + "assets/js/countrys/countrys.json?v=4", function (data) {
                $.each(data, function (key, value) {
                    let selected = value.code === 'US' ? 'selected' : '';
                    $('#person_component_form select[name="country_code"]').append('<option data-phone="' + value.dial_code + '" ' + selected + ' value="' + value.code + '">' + value.code + ' (+' + value.dial_code + ')</option>').trigger('change');
                });
            });
        },
        save: function () {
            loader('show');

            let data = $("#person_component_form").serializeArray();
            let save_data = {};
            save_data['id'] = person.person_id;
            $.each(data, function () {
                save_data[this.name] = this.value;
            });
            if(_global_objects.currnt_org.orgnx_id)
                save_data['organization_id'] = _global_objects.currnt_org.orgnx_id;

            if(_global_objects.currnt_org.sorgnx_id)
                save_data['suborganization_id'] = _global_objects.currnt_org.sorgnx_id;

            $.post(base_url + 'donors/save', save_data, function (result) {
                if (result.status) {
                    $('#person_component_modal').modal('hide');
                    if (person.context === 'invoice' || person.context === 'recurring') {
                        notify({title: 'Notification', 'message': result.message , 'align': 'center'});
                    } else {
                        notify({title: 'Notification', 'message': result.message});
                    }

                    if (_global_objects.donors_dt) { //if the object is not set there is no need of refreshing
                        _global_objects.donors_dt.draw(false);
                    } else if (person.is_select2) {
                        $(person.select2_id).select2("trigger", "select", {data: {'id': result.data.id, text: result.data.name, first_name: result.data.first_name, last_name: result.data.last_name}});
                    } else if (_global_objects.myprofileview) {
                        setTimeout(function () {
                            location.reload();
                        }, 4000);
                    }

                } else if (result.status == false) {
                    $('#person_component_modal').find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                    $('#person_component_modal').animate({scrollTop: 0}, 'fast'); //guide the user to see the error by scrolling to the top
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
        initializeImasks: function () {
            person.phoneMask = IMask(
                    document.querySelector('#person_component_form input[name="phone"]'),
                    {
                        mask: '000000000000000',
                    });
        }
    };
}());

