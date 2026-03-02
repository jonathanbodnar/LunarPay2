(function () {
    $(document).ready(function () {
        messaging.setmessaging_functions();
        messaging.infinite_scroll = true;
    });
    var messaging = {
        setmessaging_functions: function () {

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
                                ,{value: result[i].id})
                                .html(result[i].name));
                        }
                    }).fail(function (e) {
                        console.log(e);
                    });
                }
            }

            async function loadChats (offset,refresh = null){
                let status_chat = $('#status_chat').val();
                let church_id   = $('select[name="organization_id"]').val();
                let campus_id   = $('select[name="suborganization_id"]').val();
                await $.ajax({
                    url: base_url + 'messaging/get_chats', type: "POST",
                    data:{church_id:church_id,campus_id:campus_id,offset:offset,status_chat:status_chat,refresh: refresh},
                    dataType: "json",
                    success: function (data) {
                        if(data.status === true){
                            var maxLength = 50;
                            messaging.infinite_scroll = data.more_items;
                            $.each(data.data,function (key,value) {

                                let send_icon = '';
                                if(value.direction === "S"){
                                    send_icon = '<img class="bot-sm-image" src="'+base_url+'assets/widget/chat-icon.svg">';
                                }
                                let title_name = value.name;
                                if(value.name === ""){
                                    title_name = '<div class="no_logged">[No Donor Logged]</div>';
                                }
                                let text = value.text.length > maxLength ? (value.text.substring(0, maxLength) + '...') : value.text;

                                let status_chat_badge = '';
                                if(status_chat === 'all' || status_chat === 'A'){
                                    if(value.status === 'O') {
                                        status_chat_badge = `<div>
                                                                <span class="badge badge-pill badge-default">Open</span>
                                                            </div>`;
                                    } else if(value.status === 'C') {
                                        status_chat_badge = `<div>
                                                                <span class="badge badge-pill badge-success">Complete</span>
                                                            </div>`;
                                    } else if(value.status === 'I') {
                                        status_chat_badge = `<div>
                                                                <span class="badge badge-pill badge-warning">Abandoned</span>
                                                            </div>`;
                                    } else if(value.status === 'F') {
                                        status_chat_badge = `<div>
                                                                <span class="badge badge-pill badge-danger">Failed</span>
                                                            </div>`;
                                    }
                                }

                                $('.list-group-chats').append(`
                                    <a href="#!" class="list-group-item list-group-item-action" data-id="`+value.id+`"
                                        data-name="`+value.name+`" >
                                        <div class="row align-items-center">
                                            <div class="col ml--2">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <h4 class="mb-0 text-sm">`+title_name+`</h4>
                                                        <div style="clear:both"></div>
                                                        <div style="padding:3px 0px 10px 0px">`+status_chat_badge+`</div>                                                    
                                                    </div>
                                                    <div class="text-right text-muted">
                                                        <small>`+moment(value.created_at+' '+data.timezone).fromNow()+`</small>
                                                    </div>
                                                </div>
                                                <p class="text-sm mb-0">`+send_icon+text+`</p>
                                            </div>
                                        </div>
                                    </a>
                                `);
                            });
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                })
            }

            async function selectChat() {
                let item_selected = $('.list-group-item.selected');
                let id = item_selected.data('id');
                let name = item_selected.data('name') === "" ? '[No Donor Logged]' : item_selected.data('name');
                $('#donor_name').text(name);
                $('#chat_messages').empty();

                $('.btn-recover').hide();
                $('.btn-archive').hide();
                if($('#status_chat').val() === 'A'){
                    $('.btn-recover').show();
                } else {
                    $('.btn-archive').show();
                }

                if($('select[name="suborganization_id"]').val()) {
                    let suborganization_name = $('select[name="suborganization_id"] option:selected').text();
                    $('#organization_name').text(suborganization_name);
                } else {
                    let organization_name = $('select[name="organization_id"] option:selected').text();
                    $('#organization_name').text(organization_name);
                }

                await $.ajax({
                    url: base_url + 'messaging/get_chat_messages', type: "POST",
                    data: {chat_id: id},
                    dataType: "json",
                    success: function (data) {
                        if (data.status === true) {
                            $.each(data.data, function (key,value) {
                                if(value.direction === 'S'){
                                    let created_at = '<div class="sms_status">'+ moment(value.created_at+' '+data.timezone).format('MM/DD/YY hh:mm a')+'</div>';
                                    $('#chat_messages').prepend(`
                                        <div class="bot-message">
                                            <div class="bot-message-text">
                                                `+value.text+created_at+`
                                            </div>
                                            <div class="bot-image">
                                                <img src="`+base_url+`assets/widget/chat-icon.svg" alt="">
                                            </div>
                                        </div>
                                    `);
                                } else if(value.direction === 'R') {
                                    $('#chat_messages').prepend(`
                                        <div class="donor-message">
                                            <div class="donor-message-text">
                                                `+value.text+`
                                            </div>
                                        </div>
                                    `);
                                }
                            });
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                })
            }

            function selectFirstChat(){
                let first_selected = $('.list-group-chats .list-group-item:first');
                if(first_selected.length > 0){
                    first_selected.addClass('selected');
                    selectChat().then(function () {
                        $('#chat_messages').get(0).scrollTop = $('#chat_messages').get(0).scrollHeight;
                    });
                } else {
                    $('#donor_name').text('');
                    $('#chat_messages').empty();
                    $('.btn-archive').hide();
                    $('.btn-recover').hide();

                    if($('select[name="suborganization_id"]').val()) {
                        let suborganization_name = $('select[name="suborganization_id"] option:selected').text();
                        $('#organization_name').text(suborganization_name);
                    } else {
                        let organization_name = $('select[name="organization_id"] option:selected').text();
                        $('#organization_name').text(organization_name);
                    }
                }
            }

            async function refreshChats(){
                let chat_id = $('.list-group-chats .selected').data('id');
                let scroll_position = $('.list-group-chats').get(0).scrollTop;
                $('.list-group-chats').empty();
                let count = $('.list-group-chats a.list-group-item').length;
                await loadChats(0,count).then(function() {
                    $('.list-group-chats a[data-id="' + chat_id + '"]').addClass('selected');
                    $('.list-group-chats').get(0).scrollTop = scroll_position;
                });
            }

            $('.list-group-chats').empty();
            loadChats(0).then(function () {
                selectFirstChat();
            });

            $('select[name="organization_id"]').change(function () {
                loadSubOrganizations();
                $('.list-group-chats').empty();
                loadChats(0).then(function () {
                    selectFirstChat();
                });
            });

            $('select[name="suborganization_id"]').change(function () {
                $('.list-group-chats').empty();
                loadChats(0).then(function () {
                    selectFirstChat();
                });
            });

            $('#status_chat').change(function () {
                $('.list-group-chats').empty();
                loadChats(0).then(function () {
                    selectFirstChat();
                });
            });

            $('#search_messages').change(function () {
                $('.list-group-chats').empty();
                loadChats(0).then(function () {
                    selectFirstChat();
                });
            });

            $('.btn-archive').click(function () {
                let selected_chat = $('.list-group-chats .selected');
                if(selected_chat) {
                    let archived = 1;
                    let archive_text = 'Archive';

                    question_modal(archive_text,'Are you sure to '+archive_text+' this chat?').then(function (result) {
                        if(result.value){
                            let data = $("#archive_form").serializeArray();
                            let send_data = {};
                            $.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data['id'] = selected_chat.data('id');
                            send_data['archive'] = archived;
                            $.ajax({
                                url: base_url + 'messaging/set_archive', type: "POST",
                                data: send_data,
                                dataType: "json",
                                success: function (data) {
                                    if (data.status === true) {
                                        $('.list-group-chats .selected').remove();
                                        $('#client_name').text('');
                                        $('#chat_messages').empty();
                                        $('.btn-archive').hide();
                                        $('.btn-recover').hide();
                                    } else {
                                        error_message(data.message);
                                    }
                                    typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                },
                                error: function (jqXHR, textStatus, errorJson) {
                                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                        alert(jqXHR.responseJSON.message);
                                    } else {
                                        alert("error: " + jqXHR.responseText);
                                    }
                                }
                            })
                        }
                    });
                }
            });

            $('.btn-recover').click(function () {
                let selected_chat = $('.list-group-chats .selected');
                if(selected_chat) {
                    let archived = 0;
                    let archive_text = 'Recover';

                    question_modal(archive_text,'Are you sure to '+archive_text+' this chat?').then(function (result) {
                        if(result.value){
                            let data = $("#archive_form").serializeArray();
                            let send_data = {};
                            $.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data['id'] = selected_chat.data('id');
                            send_data['archive'] = archived;
                            $.ajax({
                                url: base_url + 'messaging/set_archive', type: "POST",
                                data: send_data,
                                dataType: "json",
                                success: function (data) {
                                    if (data.status === true) {
                                        $('.list-group-chats .selected').remove();
                                        $('#client_name').text('');
                                        $('#chat_messages').empty();
                                        $('.btn-archive').hide();
                                        $('.btn-recover').hide();
                                    } else {
                                        error_message(data.message);
                                    }
                                    typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                                },
                                error: function (jqXHR, textStatus, errorJson) {
                                    if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                                        alert(jqXHR.responseJSON.message);
                                    } else {
                                        alert("error: " + jqXHR.responseText);
                                    }
                                }
                            })
                        }
                    });
                }
            });

            $('.list-group-chats').on('click','.list-group-item', async function(){
                $('a.list-group-item').removeClass('selected');
                $(this).addClass('selected');
                selectChat().then(function () {
                    $('#chat_messages').get(0).scrollTop = $('#chat_messages').get(0).scrollHeight;
                });
            });

            $('.list-group-chats').on("scroll", function() {
                if(messaging.infinite_scroll) {
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                        let offset = $('.list-group-chats a.list-group-item').length;
                        loadChats(offset);
                    }
                }
            });
            //refresh chats each 10 seconds
            setInterval(function () {
                refreshChats().then(function () {
                    if($('.list-group-item.selected')){
                        let scrollHeight = $('#chat_messages')[0].scrollHeight;
                        let innerHeight = $('#chat_messages').innerHeight();
                        let scrollTop = $('#chat_messages').scrollTop();
                        selectChat().then(function () {
                            if (scrollTop + innerHeight >= scrollHeight) {
                                $('#chat_messages').get(0).scrollTop = scrollHeight;
                            } else {
                                $('#chat_messages').get(0).scrollTop = scrollTop;
                            }
                        });
                    }
                });

            },30000);
        }
    };



}());

