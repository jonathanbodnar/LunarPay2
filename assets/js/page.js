(function () {

    $(document).ready(function () {
        pages.setpages_dt();
        pages.setpages_modal();
        pages.is_editing              = false;
        pages.image_changed           = 0;
        pages.image_deleted           = 0;
        pages.background_image        = null;
    });
    var pages = {
        setpages_dt: function () {
            pages.tableId = "#pages_datatable";
            this.pages_dt = $(pages.tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "pages/get_pages_dt", type: "POST"
                },
                "fnPreDrawCallback": function () {
                    $(pages.tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(pages.tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", visible: false},
                    {data: "page_name", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "organization", className: "", "render": function (data,type,full) {
                            return full.suborganization ? full.suborganization + ' / Suborg' : data;
                        }},
                    {data: "title", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "type_page", className: "", "render": $.fn.dataTable.render.text() },
                    {data: "created_at", className: "", "render": function (data,type,full) {
                            return full.created_at_formatted;
                        }},
                    {data: "slug", className: "", searchable: false
                        , mRender: function (data, type, full) {

                            return `<a class="text-underline" target="_blank" href="`+short_base_url+`pwa/`+full.slug+`">
                                            `+short_base_url+`pwa/`+full.slug+`
                                        </a>`;
                        }
                    },
                    {data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {
                                return `<li class="nav-item dropdown" style="position: static">
                                      <a class="nav-link nav-link-icon" href="#" id="navbar-success_dropdown_1" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbar-success_dropdown_1">
                                        <a class="btn-edit-page dropdown-item" data-id="` + data + `" href="#">
                                            <i class="fas fa-pen"></i>
                                            <span>Edit</span>
                                        </a>
                                        <a class="dropdown-item" target="_blank" href="`+short_base_url+`pwa/`+full.slug+`">
                                            <i class="far fa-eye"></i></i>
                                            <span>View</span>
                                        </a>
                                        <a class="btn-remove-page dropdown-item" data-id="` + data + `" href="#">
                                            <i class="fas fa-trash"></i> Remove
                                        </a>
                                      </div>
                                    </li>`;
                        }
                    }
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                }
            });
        },
        setpages_modal: function () {

            //Disable Auto Upload Dropzone - Background
            var background_dropzone = Dropzone.forElement('#background_dropzone');
            background_dropzone.options.autoProcessQueue = false;
            background_dropzone.options.autoDiscover = false;

            background_dropzone.on('removedfile',function(file){
                pages.image_deleted = 1;
            });
            background_dropzone.on('addedfile',function(file){
                loader('show');
                var reader = new FileReader();
                reader.onload = function(){
                    pages.background_image = file;
                    pages.image_changed = 1;
                    pages.image_deleted = 0;
                    $('.dz-preview-img-first').remove();
                };
                reader.readAsDataURL(file);
            });

            background_dropzone.on('thumbnail',function(file){
                loader('hide');
            });

            //Show Image on dropzone
            function setbackground (url){
                var background_element = $('#background_dropzone');
                var preview = background_element.find('.dz-preview');
                if(url !== null){
                    var content_preview = `<div class="dz-preview-cover dz-image-preview dz-preview-img-first">
                    <img class="dz-preview-img" src="" data-dz-thumbnail="" 
                    style="max-width: 400px;margin: 0 auto; display: flex;">
                        <span class="remove_file_dropzone" alt="Click me to remove the file." data-dz-remove ><i class="fas fa-times-circle"></i><span>
                    </div>`;
                    preview.append(content_preview);
                    $('.remove_file_dropzone').click(function () {
                        preview.empty();
                        background_element.removeClass('dz-max-files-reached');
                        pages.image_deleted = 1;
                    });
                    background_element.addClass('dz-max-files-reached');
                    background_element.find('img').prop('src',url);
                } else {
                    preview.empty();
                    background_element.removeClass('dz-max-files-reached');
                }
            }

            //===== open modal create mode
            $('.btn-add-page').on('click', function () {
                $('#add_page_modal').attr('data-id', 0).modal('show');
                $('#add_page_modal .overlay').attr("style", "display: none!important");
            });
            //===== open modal edit mode
            $(document).on('click', '.btn-edit-page', function () {
                $('#add_page_modal').attr('data-id', $(this).attr('data-id')).modal('show');
            });

            //==== setup form fields on modal open
            $('#add_page_modal').on('show.bs.modal', function (e) {
                $('#add_page_form')[0].reset();
                $('#add_page_form').find('.alert-validation').first().empty().hide();
                pages.is_editing = false;
                setbackground(null);
                background_dropzone.removeAllFiles(true);
                $('#add_page_form #pwa_style_two').prop('checked',true);
                $('#add_page_form select[name="font_family_title"]').val('Segoe UI');
                $('#add_page_form input[name="font_size_title"]').val(3.5);
                $('#add_page_form select[name="font_family_content"]').val('Segoe UI');
                $('#add_page_form input[name="font_size_content"]').val(2);
                if ($(this).attr('data-id') != '0') {//edit mode load data
                    pages.is_editing = true;
                    $('#add_page_modal .overlay').show();
                    $('#add_suborganization_modal .overlay').show();
                    $.post(base_url + 'pages/get_page', {id: $(this).attr('data-id')}, async function (result) {
                        $('#add_page_form input[name="page_name"]').val(result.page.page_name);
                        $('#add_page_form input[name="title"]').val(result.page.title);
                        $('#add_page_form select[name="font_family_title"]').val(result.page.title_font_family);
                        $('#add_page_form input[name="font_size_title"]').val(result.page.title_font_size);
                        $('#add_page_form textarea[name="content"]').val(result.page.content);
                        $('#add_page_form select[name="font_family_content"]').val(result.page.content_font_family);
                        $('#add_page_form input[name="font_size_content"]').val(result.page.content_font_size);
                        $('#add_page_form input[name="slug"]').val(result.page.slug);
                        $('#add_page_form select[name="organization_id"]').val(result.page.church_id);
                        await loadSubOrganizations();
                        $('#add_page_form select[name="suborganization_id"]').val(result.page.campus_id);
                        await loadConduitFunds();
                        $('#add_page_form select[name="type_page"]').val(result.page.type_page).trigger('change');
                        $('#add_page_form select[name="conduit_funds[]"]').val(JSON.parse(result.page.conduit_funds)).trigger('change');
                        $('#add_page_form input[name="pwa_style"][value="'+result.page.style+'"]').prop('checked',true);
                        if(result.page.background_image) {
                            setbackground(base_url+'files/get/'+result.page.background_image);
                        }
                        $('#add_page_modal .overlay').attr("style", "display: none!important");
                        changePWAStyleFunction();
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_page_modal .overlay').attr("style", "display: none!important");
                    });
                } else {
                    changePWAStyleFunction();
                }

                $('select[name="type_page"]').trigger('change');
            });

            //==== focus first field on modal opened
            $('#add_page_modal').on('shown.bs.modal', function () {
                $('#add_page_modal').find(".focus-first").first().focus();
            });

            //==== save page
            $('#add_page_modal .btn-save').on('click', function () {
                var btn = helpers.btn_disable(this);
                var save_data = new FormData($('#add_page_form')[0]);
                save_data.append('id', $('#add_page_modal').attr('data-id'));
                let title_family_type = $('#add_page_form select[name="font_family_title"] :selected').data('type');
                let content_family_type = $('#add_page_form select[name="font_family_content"] :selected').data('type');
                save_data.append('title_family_type', title_family_type);
                save_data.append('content_family_type', content_family_type);
                if(pages.image_deleted === 1){
                    save_data.append('image_deleted',pages.image_deleted);
                }
                if(pages.image_changed === 1){
                    save_data.append('image_changed',pages.image_changed);
                    save_data.append('background',pages.background_image);
                    pages.image_changed = 0;
                }
                $.ajax({
                    url: base_url + 'pages/save_page', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            $("#add_page_modal").modal("hide");
                            pages.pages_dt.draw(false);
                            success_message(data.message)
                        } else {
                            //error_message(data.message)
                            $('#add_page_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
                        }
                        typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        helpers.btn_enable(btn);
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        helpers.btn_enable(btn);
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            //location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                });
            });

            $(pages.tableId).on('click', '.btn-remove-page', function (e) {
                var id = $(this).data('id');
                question_modal('Remove Page', 'Are you sure?')
                    .then(function (result) {
                        if (result.value) {
                            var data = $("#remove_page_form").serializeArray();
                            var remove_data = {};
                            $.each(data, function () {
                                remove_data[this.name] = this.value;
                            });
                            remove_data['id'] = id;
                            loader('show');
                            $.ajax({
                                url: base_url + 'pages/remove', type: "POST",
                                dataType: "json",
                                data: remove_data,
                                success: function (data) {
                                    if (data.status) {
                                        success_message(data.message)
                                    } else {
                                        error_message(data.message)
                                    }
                                    pages.pages_dt.draw(false);
                                    typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                    loader('hide');
                                },
                                error: function (jqXHR, textStatus, errorJson) {
                                    loader('hide');
                                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                        alert(jqXHR.responseJSON.message);
                                        location.reload();
                                    } else {
                                        alert("error: " + jqXHR.responseText);
                                    }
                                }
                            });
                        }
                    });
                e.preventDefault();
                return false;
            });

            $('#slug').keydown(function (e) {
                if(!pages.is_editing){
                    pages.is_editing = true;
                }
            });

            $('#page_name').change(function () {
                if( pages.is_editing !== true ){
                    $('#slug').val(helpers.slugify($('#page_name').val()));
                }
            });

            $('#slug').change(function () {
                $('#slug').val(helpers.slugify($('#slug').val()));
            });

            $('#add_page_form input[name="pwa_style"]').change(changePWAStyleFunction);

            function changePWAStyleFunction(){
                let style_page = $('#add_page_form input[name="pwa_style"]:checked').val();
                if(style_page === 'T'){ // If Two columns design is selected
                    $('.background_row').hide();
                } else {
                    $('.background_row').show();
                }
            }

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
            }
            $('select[name="organization_id"]').change( function(){
                loadSubOrganizations();
                loadConduitFunds();
            });

            $('select[name="suborganization_id"]').change( function(){
                loadConduitFunds();
            });

            //Type Page
            $('select[name="type_page"]').change( function(){
                var type_page = $(this).val();
                if(type_page === 'standard')
                    $('.conduit_container').hide();
                else if(type_page === 'conduit')
                    $('.conduit_container').show();
            });

            //Loading conduit funds
            $('#conduit_funds').select2({
                multiple: true,
                placeholder: "Select Fund",
                data: []
            });
            async function loadConduitFunds() {
                var organization_id = $('select[name="organization_id"]').val();
                var suborganization_id = $('select[name="suborganization_id"]').val();
                if(organization_id){
                    await $.post(base_url + 'funds/get_tag_list', {organization_id:organization_id, suborganization_id:suborganization_id} , function (result) {
                        $('#conduit_funds').empty();
                        $('#conduit_funds').select2({data: result.data});
                        $('#conduit_funds').val(result.values).trigger('change');
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            }
        }
    };
}());

