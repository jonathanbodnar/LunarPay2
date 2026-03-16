(function () {
    $(document).ready(function () {
        install.setinstall_form();
        install.image_changed             = 0;
        install.domain_changed            = 0;
        install.trigger_message_changed   = 0;
        install.suggested_amounts_changed = 0;
        install.funds_flow_changed        = 0;
        install.default_theme_color       = '#000000';
        install.default_button_text_color = '#ffffff';
        install.logo_image                = null;
        install.logo_image_demo           = null;
        install.theme_color               = null;
        install.button_text_color         = null;
        install.slug                      = "";
        install.qr_code                   = "";
        install.install_status            = null;
        install.widget_position           = 'bottom_right';
        install.widget_x_adjust           = 0;
        install.widget_y_adjust           = 0;
    });
    var install = {
        setinstall_form: function () {

            //Copy to Clipboard Helper
            var ClipboardHelper = {

                copyElement: function ($element)
                {
                    this.copyText($element.text())
                },
                copyText:function(text) // Linebreaks with \n
                {
                    var $tempInput =  $("<textarea>");
                    $("body").append($tempInput);
                    $tempInput.val(text).select();
                    document.execCommand("copy");
                    $tempInput.remove();
                }
            };

            //Disable Auto Upload Dropzone
            var logo_dropzone = Dropzone.forElement('#logo_dropzone');
            logo_dropzone.options.autoProcessQueue = false;
            logo_dropzone.options.autoDiscover = false;

            //Suggested Amounts Mask
            IMask(
                document.querySelector('.suggested_amounts .bootstrap-tagsinput input'),
                {
                    mask: Number,
                    scale: 2,
                    signed: false,
                    radix: '.'
                });
            //Mask with Tags Inputs Conflict Fix
            $('.suggested_amounts .bootstrap-tagsinput input').keypress(function (e) {
                if(e.keyCode === 13){
                    $(this).blur();
                    $(this).focus();
                }
            });

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
                await get_settings();
            }

            loadSubOrganizations();

            //Get Settings with Organization Id
            $('select[name="organization_id"]').change(loadSubOrganizations);

            //Get Settings with Suborganization Id
            $('select[name="suborganization_id"]').change(get_settings);

            //==== save install
            function save_install_settings(){
                $('#install_form').find('.alert-validation').first().empty().hide();
                var save_data = new FormData($('#install_form')[0]);
                save_data.append('id', $('#install_form').data('id'));
                if(install.image_changed === 1){
                    save_data.append('image_changed',install.image_changed);
                    save_data.append('logo',install.logo_image);
                    install.image_changed = 0;
                }
                install.theme_color = $('input[name="theme_color').val();
                install.button_text_color = $('input[name="button_text_color').val();
                install.widget_position = $('select[name="widget_position').val();
                install.widget_x_adjust = $('input[name="widget_x_adjust').val();
                install.widget_y_adjust = $('input[name="widget_y_adjust').val();
                $.ajax({
                    url: base_url + 'install/save', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            if(install.domain_changed === 1){
                                var domain = $('input[name="domain"]').val();
                                if(domain !== null && domain.trim() !== ''){
                                    $("#set_domain_message").hide("fast");
                                } else {
                                    $("#set_domain_message").show("fast");
                                }
                                success_message('Domain Updated Successfully');
                            }
                            if(install.trigger_message_changed === 1){
                                success_message('Trigger Message Updated Successfully');
                            }
                            if(install.suggested_amounts_changed === 1){
                                success_message('Suggested Amounts Updated Successfully');
                            }
                            if(install.funds_flow_changed === 1){
                                success_message('Funds Flow Updated Successfully');
                            }
                            $('#install_form').data('id',data.id);
                        } else {
                            $('#install_form').find('.alert-validation').first().empty().html(data.message).fadeIn("slow");
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        install.domain_changed = 0;
                        install.trigger_message_changed = 0;
                        install.suggested_amounts_changed = 0;
                        install.funds_flow_changed = 0;
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        install.domain_changed = 0;
                    }
                });
                update_demo();
            }

            //Save Install Events
            $('.btn-update-domain').click(function(){

                //Clean Domain
                var install_domain = $('input[name="domain"]').val();
                install_domain = install_domain.replace('http://','');
                install_domain = install_domain.replace('https://','');
                install_domain = install_domain.replace('www.','');

                install.domain_changed = 1;

                $('input[name="domain"]').val(install_domain);
                save_install_settings();
            });
            $('.btn-update-message').click(function(){
                install.trigger_message_changed = 1;
                save_install_settings();
            });
            $('.btn-update-amounts').click(function(){
                install.suggested_amounts_changed = 1;
                save_install_settings();
            });
            $('.btn-funds-flow').click(function(){
                install.funds_flow_changed = 1;
                save_install_settings();
            });
            $('select[name="widget_position"]').change(function(){
                $('input[name="widget_x_adjust"]').val(0);
                $('input[name="widget_y_adjust"]').val(0);
                save_install_settings();
            });
            $('input[name="widget_x_adjust"]').change(save_install_settings);
            $('input[name="widget_y_adjust"]').change(save_install_settings);
            $('input[name="theme_color"]').change(save_install_settings);
            $('input[name="button_text_color"]').change(save_install_settings);
            logo_dropzone.on('addedfile',function(file){
                var reader = new FileReader();
                reader.onload = function(){
                    var dataURL = reader.result;
                    $('.image-temporal').remove();
                    install.logo_image = file;
                    install.logo_image_demo = dataURL;
                    install.image_changed = 1;
                    save_install_settings();
                };
                reader.readAsDataURL(file);
            });
            $('input[name="domain"]').keydown(function (e) {
                if(e.keyCode === 13){
                    $('.btn-update-domain').click();
                    e.preventDefault();
                }
            });

            $('input[name="trigger_message"]').keydown(function (e) {
                if(e.keyCode === 13){
                    $('.btn-update-message').click();
                    e.preventDefault();
                }
            });

            //Download Wordpress Link
            $('#download_wordpress_plugin').click(function (e) {
                e.preventDefault();
                var organization_id = $('select[name="organization_id"]').val();
                if(organization_id) {
                    var suborganization_id = $('select[name="suborganization_id"]').val();
                    var token = $('select[name="organization_id"] option:selected').data('token');
                    if(suborganization_id !== '') {
                        token = $('select[name="suborganization_id"] option:selected').data('token');
                    }
                    $.post(base_url + 'install/wordpress_download', {organization_id:organization_id,suborganization_id:suborganization_id,token:token}
                        , function (data) {
                            if (data.status === true) {
                                var file_path = data.data;
                                var a = document.createElement('A');
                                a.href = file_path;
                                a.download = file_path.substr(file_path.lastIndexOf('/') + 1);
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }
                        }).fail(function (e) {
                            console.log(e);
                        });
                    }
            });

            //Copy Buttton
            $('.copy_code').click(function (e) {
                e.preventDefault();
                var pre_item_text = $(this).prev().text();
                ClipboardHelper.copyText(pre_item_text);
            });

            //Show Image on dropzone
            function setLogo (url){
                var logo_element = $('#logo_dropzone');
                var preview = logo_element.find('.dz-preview');
                if(url !== null){
                    var content_preview = `<div class="dz-preview-cover dz-image-preview image-temporal">
                    <img class="dz-preview-img" src="" data-dz-thumbnail="" 
                    style="max-width: 200px;margin: 0 auto; display: flex;">
                    </div>`;
                    preview.append(content_preview);
                    logo_element.addClass('dz-max-files-reached');
                    logo_element.find('img').prop('src',url);
                    $('.sc-message--avatar').css('background-image','url(<?= base_url(); ?>assets/widget/chat-icon.svg);');
                } else {
                    preview.empty();
                    logo_element.removeClass('dz-max-files-reached');
                }

            }

            //==== get Settings
            async function get_settings (skip_customize_text = false) {
                var organization_id = $('select[name="organization_id"]').val();

                if(organization_id){
                    var suborganization_id = $('select[name="suborganization_id"]').val();
                    let name_org = '';
                    if(!suborganization_id){
                        name_org = $('select[name="organization_id"] option:selected').text().trim();
                    } else {
                        name_org = $('select[name="suborganization_id"] option:selected').text().trim();
                    }
                    $('.sc-header--team-name').text(name_org);

                    //Set Sub Organizations to Datatable Filters
                    await $.post(base_url + 'install/get', {organization_id:organization_id,suborganization_id:suborganization_id}
                        , async function (result) {
                            if(result.chat_setting !== null){
                                $('#install_form').data('id',result.chat_setting.id);
                                $('#advanced_configuration_form').data('id',result.chat_setting.id);
                                $('input[name="theme_color').val(result.chat_setting.theme_color);
                                $('input[name="button_text_color').val(result.chat_setting.button_text_color);
                                $('input[name="domain').val(result.chat_setting.domain);
                                $('input[name="trigger_message').val(result.chat_setting.trigger_text);
                                $('input[name="suggested_amounts').tagsinput('removeAll');
                                $.each(JSON.parse(result.chat_setting.suggested_amounts),function (key,value) {
                                    $('input[name="suggested_amounts').tagsinput('add', value);
                                });

                                if(result.chat_setting.domain !== null && result.chat_setting.domain.trim() !== ''){
                                    $("#set_domain_message").hide("fast");
                                } else {
                                    $("#set_domain_message").show("fast");
                                }

                                $('select[name="widget_position"]').val(result.chat_setting.widget_position);
                                install.widget_position = result.chat_setting.widget_position;
                                $('input[name="widget_x_adjust"]').val(result.chat_setting.widget_x_adjust);
                                install.widget_x_adjust = result.chat_setting.widget_x_adjust;
                                $('input[name="widget_y_adjust"]').val(result.chat_setting.widget_y_adjust);
                                install.widget_y_adjust = result.chat_setting.widget_y_adjust;

                                if(result.chat_setting.debug_message === "1")
                                    $('input[name="debug_message').prop('checked', true);
                                else
                                    $('input[name="debug_message').prop('checked', false);

                                install.theme_color = result.chat_setting.theme_color;
                                install.button_text_color = result.chat_setting.button_text_color;
                                install.install_status = result.chat_setting.install_status;
                                if(result.chat_setting.logo) {
                                    setLogo(base_url+'files/get/'+result.chat_setting.logo);
                                    install.logo_image_demo = base_url+'files/get/'+result.chat_setting.logo;
                                }
                                else {
                                    setLogo(null);
                                    logo_dropzone.removeAllFiles(true);
                                }
                                $('select[name="funds_flow"]').val(result.chat_setting.type_widget);
                                if(result.chat_setting.type_widget === 'standard') {
                                    $('.conduit_container').hide();
                                }
                                else if(result.chat_setting.type_widget === 'conduit') {
                                    $('.conduit_container').show();
                                }
                                await loadConduitFunds(JSON.parse(result.chat_setting.conduit_funds));
                            } else {
                                $('#install_form').data('id',null);
                                $('input[name="theme_color').val(install.default_theme_color);
                                $('input[name="button_text_color').val(install.default_button_text_color);
                                $('input[name="debug_message').prop('checked', false);
                                $('input[name="suggested_amounts').tagsinput('removeAll');
                                $('input[name="domain').val('');
                                $('input[name="trigger_message').val('');
                                $('select[name="funds_flow"]').val('standard');
                                $('select[name="widget_position"]').val('bottom_right');
                                $('input[name="widget_x_adjust"]').val(0);
                                $('input[name="widget_y_adjust"]').val(0);
                                $('.conduit_container').hide();

                                setLogo(null);
                                logo_dropzone.removeAllFiles(true);
                                install.logo_image_demo = null;
                                install.theme_color = null;
                                install.button_text_color = null;
                                install.install_status = null;
                            }
                            install.slug    = result.slug;
                            install.qr_code = result.qrcode;
                            $('.setting_section').show();

                        }).fail(function (e) {
                            console.log(e);
                    });
                    if(!skip_customize_text) {
                        await get_customize_texts();
                    }
                    update_demo();
                }
                else
                    $('.setting_section').hide();
            }

            //Update Demo Preview and Install Instructions
            function update_demo(){
                if(!install.theme_color)
                    install.theme_color = install.default_theme_color;
                if(!install.button_text_color)
                    install.button_text_color = install.default_button_text_color;

                var widget_position_css = '';
                if(install.widget_position === 'bottom_right'){
                    widget_position_css = ` #sc-launcher{
                        align-items: flex-end !important;
                    }`;
                    if(install.widget_x_adjust !== 0){
                        widget_position_css = ` #sc-launcher > * {
                            right: `+install.widget_x_adjust+`px !important;
                        }`;
                    }
                } else if (install.widget_position === 'bottom_left'){
                    widget_position_css = ` #sc-launcher {
                        align-items: flex-start !important;
                    }`;
                    if(install.widget_x_adjust !== 0){
                        widget_position_css += ` #sc-launcher > * {
                            left: `+install.widget_x_adjust+`px !important;
                        }`;
                    }
                }

                if(install.widget_y_adjust !== 0){
                    widget_position_css += ` #sc-launcher > *{
                        bottom: `+install.widget_y_adjust+`px !important;
                    }`;
                }

                $('#preview_css').empty();
                $('#preview_css').html(
                    `
                    #sc-launcher .sc-btn.theme_color {
                        background-color:`+ install.theme_color +` !important;
                        border-color: `+ install.theme_color +` !important;
                    }
                    
                    #sc-launcher  .theme_text_color{
                        color:`+ install.theme_color +` !important;
                    }
                    
                    #sc-launcher  .theme_color{
                        background-color:`+ install.theme_color +` !important;
                    }
                    
                    #sc-launcher  .sc-message--content.sent .sc-message--text.theme_color {
                        background-color: `+ install.theme_color +` !important;
                    }
                    
                    #sc-launcher  .button_text_color{
                        color:`+ install.button_text_color +` !important; 
                    }
                    `+widget_position_css+`
                `);

                if(install.logo_image_demo){
                    $('.sc-header--img').prop('src',install.logo_image_demo);
                    $('#preview_css').html($('#preview_css').html()+`
                        .sc-message--avatar{
                            background-image: url(`+ install.logo_image_demo +`) !important; 
                        }
                    `);
                }else{
                    $('.sc-header--img').prop('src','');
                }

                //Changing Instructions
                var organization_id = $('select[name="organization_id"]').val();
                var token = $('select[name="organization_id"] option:selected').data('token');
                var text_to_give = $('select[name="organization_id"] option:selected').data('phone');
                var suborganization_id = $('select[name="suborganization_id"]').val();

                var connection = 1;
                if(suborganization_id !== '') {
                    connection = 2;
                    token = $('select[name="suborganization_id"] option:selected').data('token');
                }

                // Type Widget from script disabled
                //if($('select[name="type"]').val() === 'standard') {
                    $('#code_to_copy').text(`<script>var _chatgive_link = {"token": "` + token + `", "connection": ` + connection + `};</script>
<script src="` + short_base_url + `assets/widget/chat-widget-install.js"></script>`);
                    $('#embedded_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/1" width="500px" height="600px" frameborder="0"></iframe>`);
                    $('#quickgive_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/2" width="400px" height="400px" frameborder="0"></iframe>`);

               /* }
                else
                    {
                    $('#code_to_copy').text(`<script>var _chatgive_link = {"token": "` + token + `", "connection": ` + connection + `,"type": "`+ $('select[name="type"]').val() + `"};</script>
<script src="` + short_base_url + `assets/widget/chat-widget-install.js"></script>`);
                    $('#embedded_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/1/0/`+$('select[name="type"]').val()+`" width="500px" height="600px" frameborder="0"></iframe>`);
                    $('#quickgive_to_copy').text(`<iframe src="`+short_base_url+`widget_load/index/`+ connection +`/`+token+`/2/0/`+$('select[name="type"]').val()+`" width="400px" height="400px" frameborder="0"></iframe>`);
                }*/
                $('#trigger_button').text(`<button type="button" style="display:none" class="sc-open-chatgive"></button>`);
                $('#short_link_to_copy').text(short_base_url+install.slug);

                //Install Status
                if(install.install_status === 'C'){
                    $('.install_status_icon').html('<i class="far fa-check-circle"></i>');
                    $('.install_status_text').html('Your widget is installed');
                } else {
                    $('.install_status_icon').html('<i class="far fa-times-circle"></i>');
                    $('.install_status_text').html('Your widget is not installed');
                }

                //QR Code
                $('.qr_url_container').html(install.qr_code);

                $('#text_to_give_number').text(text_to_give);
            }

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
                                                <button type="button" data-id="`+this.id+`" class="btn btn-primary btn-update-customize_text"><i class="far fa-save"></i></button>
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

            //Type Widget
            $('select[name="funds_flow"]').change(async function(){
                var type = $(this).val();
                if(type === 'standard') {
                    $('.conduit_container').hide();
                }
                else if(type === 'conduit') {
                    $('.conduit_container').show();
                    await loadConduitFunds();
                }
            });

            //Loading conduit funds
            $('#conduit_funds').select2({
                multiple: true,
                placeholder: "Select Fund",
                data: []
            });
            async function loadConduitFunds($conduit_funds) {
                var organization_id = $('select[name="organization_id"]').val();
                var suborganization_id = $('select[name="suborganization_id"]').val();
                if(organization_id){
                    await $.post(base_url + 'funds/get_tag_list', {organization_id:organization_id, suborganization_id:suborganization_id} , function (result) {
                        $('#conduit_funds').empty();
                        $('#conduit_funds').select2({data: result.data});
                        if($conduit_funds){
                            $('#conduit_funds').val($conduit_funds).trigger('change');
                        } else {
                            $('#conduit_funds').val(result.values).trigger('change');
                        }
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            }
        }
    };
}());

