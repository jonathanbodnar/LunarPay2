(function () {

    var chatgive_install = {};
    chatgive_install.base_url    = typeof base_url === 'undefined' ? 'https://chatgive.me/' : base_url;

    chatgive_install.loadjQuery = function (url, callback) {
        //===== doing this as we need HEAD must be present | no grade A Browsers

        var attempts = 30;

        var addLib = function () {
            var head = document.getElementsByTagName("head");

            if (head.length == 0) {
                if (attempts-- > 0) {
                    setTimeout(addLib, 100);
                }
                return;
            }

            var script = document.createElement("script");
            script.src = url;

            script.onload = function () {
                //console.log('wdget jquery loded', new Date().getMilliseconds());
                callback();
            };

            head[0].appendChild(script);
        };

        addLib();
    };

    chatgive_install.loadjQuery('https://code.jquery.com/jquery-3.5.0.min.js', function () {
        var widgetjQuery = $.noConflict(true); //it keeps $ with the old version
        //console.log('wdget jquery loded after no conflict ', new Date().getMilliseconds());
        chatgive_install.load(widgetjQuery);
    });

    var bodyAttempts = 30;

    chatgive_install.load = function ($w) {
        
        var styleElement = document.createElement('style');
        styleElement.innerHTML = `
                                #chatgive_widget{
                                    position: fixed;
                                    bottom: 0px;
                                    right: 0px;
                                    height: 120px;
                                    width: 120px;
                                    z-index: 999999;
                                }
                                @media (max-width:400px) {
                                    #chatgive_widget.opened {
                                        width: 100% !important;
                                        height: 100% !important;
                                    }
                                }
                        `;

        document.querySelector('head').appendChild(styleElement);
    
        var prependIframe = function () {
            
            var body = document.getElementsByTagName("body");
            
            if (body.length == 0) { //wait till body is created
                if (bodyAttempts-- > 0) {
                    setTimeout(prependIframe, 100);
                }
                return;
            }

            var iframeElement = document.createElement('iframe');
            iframeElement.id = "chatgive_widget";
            iframeElement.frameBorder = 0;
            iframeElement.src = chatgive_install.base_url + "widget_load/index/" + _chatgive_link.connection + "/" + _chatgive_link.token;

            document.querySelector('body').prepend(iframeElement);

            window.addEventListener('message', function (event) {
                if (event.data === "opened") {
                    document.getElementById('chatgive_widget').style.width = "440px";
                    document.getElementById('chatgive_widget').style.height = "95vh";
                    document.getElementById('chatgive_widget').classList.add('opened');
                } else if (event.data === "closed") {
                    document.getElementById('chatgive_widget').style.width = "120px";
                    document.getElementById('chatgive_widget').style.height = "120px";
                    document.getElementById('chatgive_widget').classList.remove('opened');
                } else if (event.data === "trigger_message") {
                    document.getElementById('chatgive_widget').style.width = "440px";
                }
            });

            $w.ajax({
                type: "POST",
                url: chatgive_install.base_url + 'widget/get_settings',
                data: {'tokens': _chatgive_link},
                dataType: 'json',
                crossDomain: true,
                xhrFields: {
                    withCredentials: true
                }
            }).done(
                    function (data, status) {
                        if (data.status) {

                            var theme_color = '#000000';
                            var button_text_color = '#FFFFFF';

                            if (data.chat_settings) {
                                theme_color = data.chat_settings.theme_color;
                                button_text_color = data.chat_settings.button_text_color;
                            }

                            var widget_position_css = '';
                            if(data.chat_settings.widget_position === 'bottom_right'){
                                if(data.chat_settings.widget_x_adjust !== 0){
                                    widget_position_css = ` #chatgive_widget {
                                        right: `+data.chat_settings.widget_x_adjust+`px !important;
                                    }`;
                                }
                            } else if (data.chat_settings.widget_position === 'bottom_left'){
                                if(data.chat_settings.widget_x_adjust !== 0){
                                    widget_position_css += ` #chatgive_widget {
                                        left: `+data.chat_settings.widget_x_adjust+`px !important;
                                    }`;
                                }
                            }

                            if(data.chat_settings.widget_y_adjust !== 0){
                                widget_position_css += ` #chatgive_widget {
                                    bottom: `+data.chat_settings.widget_y_adjust+`px !important;
                                }`;
                            }

                            var styleElementBtn = document.createElement('style');
                            styleElementBtn.innerHTML = `
                                .sc-open-chatgive{
                                    background-color: ` + theme_color + ` !important;
                                    color: ` + button_text_color + ` !important;
                                }
                                `+widget_position_css+`
                            `;
                            
                            document.querySelector('head').appendChild(styleElementBtn);

                            $w('.sc-open-chatgive:empty').text('Chat Give');

                            $w('.sc-open-chatgive').show();

                            $w('body').on('click', '.sc-open-chatgive', function () {
                                var ifrm = document.querySelector('#chatgive_widget');
                                ifrm.contentWindow.postMessage('toggleChat', '*');
                            });

                        }
                    });
        };
        
        prependIframe();

    };
})();
