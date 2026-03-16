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
                let search = $('#search_messages').val();
                let church_id = $('select[name="organization_id"]').val();
                let campus_id = $('select[name="suborganization_id"]').val();
                await $.ajax({
                    url: base_url + 'communication/get_sms_chats', type: "POST",
                    data:{offset:offset,status_chat:status_chat,search: search,refresh: refresh, church_id: church_id, campus_id: campus_id},
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
                                let text = value.text.length > maxLength ? (value.text.substring(0, maxLength) + '...') : value.text;
                                $('.list-group-chats').append(`
                                    <a href="#!" class="list-group-item list-group-item-action" data-id="`+value.client_id+`"
                                        data-name="`+value.name+`" data-status="`+value.status_chat+`" data-user="`+value.user_id+`" >
                                        <div class="row align-items-center">
                                            <div class="col ml--2">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h4 class="mb-0 text-sm">`+value.name+`</h4>
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
                let name = item_selected.data('name');
                let status_chat = item_selected.data('status');
                let user = item_selected.data('user');
                $('#client_name').text(name);
                $('#chat_messages').empty();
                $('#status_chat_item').val(status_chat);
                $('.status_chat_container').css('visibility','visible');
                $('#send_user').css('visibility','visible');

                await $.ajax({
                    url: base_url + 'communication/get_sms_chat_messages', type: "POST",
                    data: {client_id: id},
                    dataType: "json",
                    success: function (data) {
                        if (data.status === true) {
                            $.each(data.data, function (key,value) {
                                if(value.direction === 'S'){
                                    let created_at = moment(value.created_at+' '+data.timezone).format('MM/DD/YY hh:mm a');
                                    value.sms_status = value.sms_status ? '<div class="sms_status">' + created_at + ' - '+value.sms_status+'</div>' : '';
                                    $('#chat_messages').prepend(`
                                        <div class="bot-message">
                                            <div class="bot-message-text">
                                                `+value.text+value.sms_status+`
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
                        $('#send_user').text('');
                        $('#chat_messages').get(0).scrollTop = $('#chat_messages').get(0).scrollHeight;
                    });
                } else {
                    $('#client_name').text('');
                    $('#chat_messages').empty();
                    $('.status_chat_container').css('visibility','collapse');
                    $('#send_user').css('visibility','collapse');
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

            function sendText(){
                let selected_chat = $('.list-group-chats .selected');
                let message = $('#send_user').html();

                let data = $("#send_text_form").serializeArray();
                let send_data = {};
                $.each(data, function () {
                    send_data[this.name] = this.value;
                });

                send_data['donor_id'] = selected_chat.data('id');
                send_data['text_message'] = message;

                $.ajax({
                    url: base_url + 'communication/send_sms_text', type: "POST",
                    data: send_data,
                    dataType: "json",
                    success: function (data) {
                        if(data.status === true) {
                            data.sms_status = data.sms_status ? '<div class="sms_status">'+data.sms_status+'</div>' : '';
                            $('#chat_messages').append(`
                                        <div class="bot-message">
                                            <div class="bot-message-text">
                                                ` + message + data.sms_status +`
                                            </div>  
                                            <div class="bot-image">
                                                <img src="` + base_url + `assets/widget/chat-icon.svg" alt="">
                                            </div>
                                        </div>
                                    `);
                            $('#chat_messages')[0].scrollTop = $('#chat_messages')[0].scrollHeight;
                            refreshChats();
                            typeof data.new_token.name !== 'undefined' ? $('input[name="' + data.new_token.name + '"]').val(data.new_token.value) : '';
                        }
                    },
                    error: function (jqXHR, textStatus, errorJson) {
                        if (typeof jqXHR.responseJSON.status !== 'undefined' && jqXHR.responseJSON.status == false) {
                            alert(jqXHR.responseJSON.message);
                        } else {
                            alert("error: " + jqXHR.responseText);
                        }
                    }
                });

                $('#send_user').text('');
            }

            $('.list-group-chats').empty();
            loadChats(0).then(function () {
                selectFirstChat();
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

            $('.list-group-chats').on('click','.list-group-item', async function(){
                $('a.list-group-item').removeClass('selected');
                $(this).addClass('selected');
                selectChat().then(function () {
                    $('#send_user').text('');
                    $('#chat_messages').get(0).scrollTop = $('#chat_messages').get(0).scrollHeight;
                });
            });

            $('#status_chat_item').change(function () {
                let selected_chat = $('.list-group-chats .selected');
                if(selected_chat) {
                    let status_chat_item_text = $("#status_chat_item option:selected").text();

                    question_modal(status_chat_item_text,'Are you sure to change the status to '+status_chat_item_text+'?').then(function (result) {
                        if(result.value){
                            let data = $("#status_chat_item_form").serializeArray();
                            let send_data = {};
                            $.each(data, function () {
                                send_data[this.name] = this.value;
                            });
                            send_data['donor_id'] = selected_chat.data('id');
                            $.ajax({
                                url: base_url + 'communication/change_sms_status_chat', type: "POST",
                                data: send_data,
                                dataType: "json",
                                success: function (data) {
                                    if (data.status === true) {
                                        $('.list-group-chats .selected').remove();
                                        $('#client_name').text('');
                                        $('#chat_messages').empty();
                                        $('.status_chat_container').css('visibility','collapse');
                                        $('#send_user').css('visibility','collapse');
                                    } else {
                                        error_message(data.message)
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
                        } else {
                            $("#status_chat_item").val(selected_chat.data('status'));
                        }
                    });
                }
            });

            $('.list-group-chats').on("scroll", function() {
                if(messaging.infinite_scroll) {
                    if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                        let offset = $('.list-group-chats a.list-group-item').length;
                        loadChats(offset);
                    }
                }
            });

            $('#send_user').keydown(function (e) {
                if (e.keyCode == 13) {
                    if($('#send_user').text().trim() !== "") {
                        sendText();
                    }
                    e.preventDefault();
                    return false;
                }
            });

            $('.send-icon').click(function () {
                if($('#send_user').text().trim() !== "") {
                    sendText()
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

