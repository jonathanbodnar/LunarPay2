(function () {
    loader('show');
    $(document).ready(async function () {
        await branding.setup();
        $('#branding_preview').show();
        loader('hide');
    });
    var branding = {
        image_changed : 0,
        logo_image    : null,
        logo_dropzone : null,
        current_style : '',
        data: [],
        setup : async function () {
            //Disable Auto Upload Dropzone
            branding.logo_dropzone = Dropzone.forElement('#logo_dropzone');
            branding.logo_dropzone.options.autoProcessQueue = false;
            branding.logo_dropzone.options.autoDiscover = false;

            branding.logo_dropzone.on('addedfile',function(file){
                loader('show');
                var reader = new FileReader();
                reader.onload = function(){
                    $('.image-temporal').remove();
                    var dataURL = reader.result;
                    branding.logo_image = file;
                    branding.image_changed = 1;
                    branding.data.logo = dataURL;
                    branding.update_preview();
                };
                reader.readAsDataURL(file);
            });

            branding.logo_dropzone.on('thumbnail',function(file){
                loader('hide');
            });

            await branding.get();

            $('.btn-save').click(function () {
                branding.save();
            });

            $('input[name="theme_color').change(function () {
                branding.data.theme_color = $(this).val();
                branding.update_preview();
            });
            $('input[name="button_text_color').change(function () {
                branding.data.button_text_color = $(this).val();
                branding.update_preview();
            });
        },
        get: async function() {
            await $.get(base_url + 'settings/get_branding/'+_global_objects.currnt_org.orgnx_id+
                (_global_objects.currnt_org.sorgnx_id ? '/'+_global_objects.currnt_org.sorgnx_id : ''),function (result) {
                if(result.data) {
                    branding.data = result.data;
                    $('#branding_form').attr('data-id',result.data.id);
                    $('input[name="theme_color').val(result.data.theme_color);
                    $('input[name="button_text_color').val(result.data.button_text_color); // THIS IS BACKGROUND COLOR
                    if (result.data.logo) {
                        branding.setLogo(base_url + 'files/get/' + result.data.logo);
                        branding.data.logo = base_url + 'files/get/' + result.data.logo;
                    } else {
                        branding.setLogo(null);
                        branding.logo_dropzone.removeAllFiles(true);
                    }
                    branding.update_preview();
                }
            });
        },
        save: function () {
            loader('show');
            let save_data = new FormData($("#branding_form")[0]);
            save_data.append('organization_id',_global_objects.currnt_org.orgnx_id);
            save_data.append('suborganization_id',_global_objects.currnt_org.sorgnx_id);
            if($('#branding_form').attr('data-id')) {
                save_data.append('id', $('#branding_form').attr('data-id'));
            }
            if(branding.image_changed === 1){
                save_data.append('image_changed',branding.image_changed);
                save_data.append('logo',branding.logo_image);
                branding.image_changed = 0;
            }
            $.ajax({
                url: base_url + 'settings/save_branding', type: "POST",
                processData: false,
                contentType: false,
                data: save_data,
                success: function (result) {
                    if (result.status) {
                        $('#branding_form').find('.alert-validation').first().empty().hide();
                        if(result.data){
                            $('#branding_form').attr('data-id',result.data.id)
                        }
                        notify({title: 'Notification', 'message': result.message });
                        localStorage.setItem('preview_style',JSON.stringify({current_org: _global_objects.currnt_org , style: branding.current_style, logo: branding.data.logo}));
                    } else if (result.status == false) {
                        if(typeof result.exception !== "undefined")
                            $('#branding_form').find('.alert-validation').first().empty().append(result.errors).fadeIn("slow");
                        else
                            $('#branding_form').find('.alert-validation').first().empty().append(result.message).fadeIn("slow");
                        $('#branding_form').animate({scrollTop: 0}, 'fast'); //guide the user to see the error by scrolling to the top
                    }
                    loader('hide');
                    typeof result.new_token.name !== 'undefined' ? $('input[name="' + result.new_token.name + '"]').val(result.new_token.value) : '';
                },
                error: function (jqXHR, textStatus, errorJson) {
                    if (typeof e.responseJSON.csrf_token_error !== 'undefined' && e.responseJSON.csrf_token_error) {
                        alert(e.responseJSON.message);
                        window.location.reload();
                    }
                    loader('hide');
                }
            });
        },
        setLogo : function (url){
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
        },
        update_preview: function() {
            if (branding.data.logo) {
                $('.email_invoice .email_invoice_logo').attr('src', branding.data.logo);
            }
            let theme_color = branding.data.theme_color ? branding.data.theme_color : '#000000';
            let text_theme_color = helpers.getTextColor(theme_color);
            let style = `
                .theme_color{
                    background: ${theme_color} !important;
                }.theme_foreground_color{
                    color: ${theme_color} !important;
                }
                .text_theme_color{
                    color: ${text_theme_color} !important;
                }
                .email_background_color{
                    background: ${branding.data.button_text_color ? branding.data.button_text_color : '#F8F8F8'} !important;
                }
            `;
            $('#css_preview').html(style);
            branding.current_style = style;
        }
    };
}());

