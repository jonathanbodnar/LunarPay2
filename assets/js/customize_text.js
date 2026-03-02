(function () {

    $(document).ready(function () {
        customize_text.setcustomize_text_form();
    });
    var customize_text = {
        setcustomize_text_form: function () {

            //==== Organization Changed
            async function loadSubOrganizations () {
                var selectInput = $('select[name="suborganization_id"]');
                var organization_id = $('select[name="organization_id"]').val();
                $('select[name="suborganization_id"]').empty();
                $('select[name="suborganization_id"]').append($('<option/>',{value:''}).html('Select a Sub Organization'));
                if(organization_id){
                    //Set Sub Organizations to Datatable Filters
                    await $.post(base_url + 'suborganizations/get_suborganizations_list', {organization_id:organization_id} , function (result) {
                        for (var i in result) {
                            selectInput.append($('<option/>'
                                ,{value: result[i].id,'data-token': result[i].token})
                                .html(result[i].name));
                        }
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
                await get_customize_texts();
            }

            loadSubOrganizations();

            //Get Settings with Organization Id
            $('select[name="organization_id"]').change(loadSubOrganizations);

            //Get Settings with Suborganization Id
            $('select[name="suborganization_id"]').change(get_customize_texts);



            //==== save customize text
            $('.customize_text_container').on('click','.btn-update-customize_text', function (){
                var btn = helpers.btn_disable(this);
                var data = $("#customize_text_tokens_form").serializeArray();
                var save_data = {};
                $.each(data, function () {
                    save_data[this.name] = this.value;
                });
                var chat_tree_id   = $(this).data('id');
                var organization_id   = $('select[name="organization_id"]').val();
                var suborganization_id = $('select[name="suborganization_id"]').val();
                save_data['organization_id'] = organization_id;
                save_data['suborganization_id'] = suborganization_id;
                save_data['chat_tree_id'] = chat_tree_id;
                save_data['customize_text'] = $(this).parent().parent().find('input.customize_text').val();
                $.ajax({
                    url: base_url + 'customize_text/save', type: "POST",
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            success_message('Customize Text Updated Successfully');
                        } else {
                            error_message(data.message);
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        helpers.btn_enable(btn);
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                });
            });

            //==== get customize texts
            async function get_customize_texts () {
                var organization_id = $('select[name="organization_id"]').val();

                if(organization_id){
                    var suborganization_id = $('select[name="suborganization_id"]').val();
                    //Set Sub Organizations to Datatable Filters
                    await $.post(base_url + 'customize_text/get', {organization_id:organization_id,suborganization_id:suborganization_id}
                        , function (result) {
                            $('.customize_text_container').empty();
                            $.each(result.customize_texts,function () {
                                let customize_text = this.customize_text !== null ? this.customize_text : this.html;
                                $('.customize_text_container').append(`
                                    <div class="form-group ">
                                        <div class="form-row">
                                            <div class="col-md-11 d-flex align-items-center">
                                                <div class="form-row">
                                                    <div class="col-md-12">
                                                        <input type="text" class="form-control customize_text" value="`+customize_text+`">
                                                    </div>
                                                    <div class="col-md-12">
                                                        <span class="customize_text_purpose">`+this.purpose+`</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-1">
                                                <button type="button" data-id="`+this.id+`" class="btn btn-primary btn-update-customize_text"><i class="fas fa-pen"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                `);
                            });
                            $('.setting_section').show();
                        }).fail(function (e) {
                            console.log(e);
                    });
                }
                else
                    $('.setting_section').hide();
            }
        }
    };
}());

