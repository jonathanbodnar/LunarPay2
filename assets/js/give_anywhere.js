(function () {

    $(document).ready(function () {
        give_anywhere.setgive_anywhere_dt();
        give_anywhere.setgive_anywhere_modal();
        give_anywhere.is_editing = false;
    });
    var give_anywhere = {
        setgive_anywhere_dt: function () {
            var tableId = "#give_anywhere_datatable";
            this.give_anywhere_dt = $(tableId).DataTable({
                "dom": '<"row"<"col-sm-9 filter-1"><"col-sm-3 search"f>>rt<"row"<"col-sm-4"l><"col-sm-4"i><"col-sm-4"p>>',
                language: dt_language,
                processing: true, serverSide: true, aLengthMenu: [[10, 50], [10, 50]], order: [[0, "desc"]],
                ajax: {
                    url: base_url + "give_anywhere/get_give_anywhere_dt", type: "POST"
                },
                "fnPreDrawCallback": function () {
                    $(tableId).fadeOut("fast");
                },
                "fnDrawCallback": function () {
                    $(tableId).fadeIn("fast");
                },
                columns: [
                    {data: "id", visible: false},
                    {data: "organization", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "button_text", className: "", "render": $.fn.dataTable.render.text()},
                    {data: "created_at", className: "", "render": function (data,type,full) {
                            return full.created_at_formatted;
                        }},
                    {data: "id", className: "text-center", searchable: false
                        , mRender: function (data, type, full) {

                            return ` <a class="nav-link nav-link-icon btn-edit-give_anywhere" href="#" data-id="`+data+`">
                                        <i class="fas fa-cog"></i>
                                      </a>
                                   `;
                        }
                    },
                ],
                fnInitComplete: function () {
                    helpers.table_filter_on_enter(this);
                }
            });
        },
        setgive_anywhere_modal: function () {

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

            //===== open modal create mode
            $('.btn-add-give_anywhere').on('click', function () {
                give_anywhere.is_editing = false;
                $('#add_give_anywhere_modal').attr('data-id', 0).modal('show');
                $('#add_give_anywhere_modal .overlay').attr("style", "display: none!important");
                $('.installation_code').hide();
                $('#add_give_anywhere_modal .modal-title').text('Setup Give Anywhere');
                $('#add_give_anywhere_modal .btn-save').show();
                $('#btn_preview').attr('data-token',null);
                $('#btn_preview').attr('data-connection',0);
            });
            //===== open modal edit mode
            $(document).on('click', '.btn-edit-give_anywhere', function () {
                give_anywhere.is_editing = true;
                $('#add_give_anywhere_modal').attr('data-id', $(this).attr('data-id')).modal('show');
                $('#add_give_anywhere_modal .modal-title').text('Save Give Anywhere');
                $('#add_give_anywhere_modal .btn-save').hide();
            });

            //==== setup form fields on modal open
            $('#add_give_anywhere_modal').on('show.bs.modal', function (e) {
                $('#add_give_anywhere_form')[0].reset();
                $('#add_give_anywhere_form').find('.alert-validation').first().empty().hide();
                $('#add_give_anywhere_form input[name="button_color"]').val('#000000');
                $('#add_give_anywhere_form input[name="text_color"]').val('#FFFFFF');
                $('#add_give_anywhere_form input[name="button_text"]').val('Give Now');
                load_btn_preview();
                if ($(this).attr('data-id') != '0') {//edit mode load data
                    $('#add_give_anywhere_modal .overlay').show();
                    $('#add_suborganization_modal .overlay').show();
                    $.post(base_url + 'give_anywhere/get_give_anywhere', {id: $(this).attr('data-id')}, async function (result) {
                        $('#add_give_anywhere_form input[name="button_color"]').val(result.give_anywhere.button_color);
                        $('#add_give_anywhere_form input[name="text_color"]').val(result.give_anywhere.text_color);
                        $('#add_give_anywhere_form input[name="button_text"]').val(result.give_anywhere.button_text);
                        $('#add_give_anywhere_form select[name="organization_id"]').val(result.give_anywhere.church_id);
                        await loadSubOrganizations();
                        $('#add_give_anywhere_form select[name="suborganization_id"]').val(result.give_anywhere.campus_id);

                        $('#add_give_anywhere_modal .overlay').attr("style", "display: none!important");
                        load_btn_preview();
                        $('.installation_code').show();
                        update_installation_code();
                    }).fail(function (e) {
                        console.log(e);
                        $('#add_give_anywhere_modal .overlay').attr("style", "display: none!important");
                    });
                }
            });

            //==== focus first field on modal opened
            $('#add_give_anywhere_modal').on('shown.bs.modal', function () {
                $('#add_give_anywhere_modal').find(".focus-first").first().focus();
            });

            $('#add_give_anywhere_form select[name="organization_id"]').on('change', function () {
                load_btn_preview();
                if(give_anywhere.is_editing === true) {
                    save_give_anywhere();
                }
            });$('#add_give_anywhere_form select[name="suborganization_id"]').on('change', function ()              {
                load_btn_preview();
                if(give_anywhere.is_editing === true) {
                    save_give_anywhere();
                }
            });
            $('#add_give_anywhere_form input[name="button_color"]').on('change', function () {
                load_btn_preview();
                if(give_anywhere.is_editing === true) {
                    save_give_anywhere();
                }
            });
            $('#add_give_anywhere_form input[name="text_color"]').on('change', function () {
                load_btn_preview();
                if(give_anywhere.is_editing === true) {
                    save_give_anywhere();
                }
            });
            $('#add_give_anywhere_form input[name="button_text"]').on('change', function () {
                load_btn_preview();
                if(give_anywhere.is_editing === true) {
                    save_give_anywhere();
                }
            });

            //==== save give anywhere
            $('#add_give_anywhere_modal .btn-save').on('click', async function () {
                var btn = helpers.btn_disable(this);
                var data_id = await save_give_anywhere();
                if(data_id){
                    if ($('#add_give_anywhere_modal').attr('data-id') == '0'){
                        $('#add_give_anywhere_modal').attr('data-id',data_id);
                        $('.installation_code').show();
                        update_installation_code();
                        give_anywhere.is_editing = true;
                        $('#add_give_anywhere_modal .btn-save').hide();
                    }
                }
                helpers.btn_enable(btn);
            });

            async function save_give_anywhere(){
                var save_data = new FormData($('#add_give_anywhere_form')[0]);
                save_data.append('id', $('#add_give_anywhere_modal').attr('data-id'));
                let value_returned = false;
                await $.ajax({
                    url: base_url + 'give_anywhere/save_give_anywhere', type: "POST",
                    processData: false,
                    contentType: false,
                    data: save_data,
                    success: function (data) {
                        if (data.status) {
                            give_anywhere.give_anywhere_dt.draw(false);
                            update_installation_code();
                            typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                            value_returned = data.id;
                        } else {
                            //error_message(data.message)
                            $('#add_give_anywhere_form').find('.alert-validation').first().empty().append(data.message).fadeIn("slow");
                            typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                            value_returned = false;
                        }

                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                            //location.reload();
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                        value_returned = false;
                    }
                });
                return value_returned;
            }

            function update_installation_code(){
                let suborganization_id = $('select[name="suborganization_id"]').val();
                let button_color = $('input[name="button_color"]').val();
                let text_color = $('input[name="text_color"]').val();
                let button_text = $('input[name="button_text"]').val();

                if(!suborganization_id){
                    let token = $('select[name="organization_id"] option:selected').data('token');
                    $('#btn_preview').attr('data-token',token);
                    $('#btn_preview').attr('data-connection',1);
                    $('.installation_code pre').text(`<button type="button" class="chatgive-anywhere-btn" style="background-color: `+button_color+`; color: `+text_color+`;" data-token="`+token+`" data-connection="1">`+button_text+`</button>
<script src="`+short_base_url+`assets/widget/chat-widget-anywhere.js"></script>`);
                } else {
                    let token = $('select[name="suborganization_id"] option:selected').data('token');
                    $('#btn_preview').attr('data-token',token);
                    $('#btn_preview').attr('data-connection',2);
                    $('.installation_code pre').text(`<button type="button" class="chatgive-anywhere-btn" style="background-color: `+button_color+`; color: `+text_color+`;" data-token="`+token+`" data-connection="2">`+button_text+`</button>
<script src="`+short_base_url+`assets/widget/chat-widget-anywhere.js"></script>`);
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
            $('select[name="organization_id"]').change(loadSubOrganizations);

            function load_btn_preview (){
                let button_color = $('#add_give_anywhere_form input[name="button_color"]').val();
                let text_color = $('#add_give_anywhere_form input[name="text_color"]').val();
                let button_text = $('#add_give_anywhere_form input[name="button_text"]').val();
                $('#btn_preview').text(button_text);
                $('#btn_preview').css('background-color',button_color);
                $('#btn_preview').css('color',text_color);
            }

            //Copy Buttton
            $('.copy_code').click(function (e) {
                e.preventDefault();
                var pre_item_text = $(this).prev().text();
                ClipboardHelper.copyText(pre_item_text);
            });

        }
    };
}());

