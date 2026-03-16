(function () {

    var anywhere_install = {};
    anywhere_install.base_url    = typeof base_url === 'undefined' ? 'https://chatgive.me/' : base_url;

    anywhere_install.loadjQuery = function (url, callback) {
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

    anywhere_install.loadjQuery('https://code.jquery.com/jquery-3.5.0.min.js', function () {
        var widgetjQuery = $.noConflict(true); //it keeps $ with the old version
        //console.log('wdget jquery loded after no conflict ', new Date().getMilliseconds());
        anywhere_install.load(widgetjQuery);
    });

    anywhere_install.load = function ($w) {
            window.addEventListener('load',function () {

                if($w('#bg_anywhere_chatgive_widget').length == 0) {

                    var styleElement = document.createElement('style');
                    styleElement.innerHTML = `
                        .chatgive-anywhere-btn{
                            border-radius: 5px;
                            padding: 0 16px;
                            border: none;
                            font-size: 14px;
                            height: 40px;
                            font-family: 'Roboto','Helvetica','Arial','sans-serif';
                            cursor: pointer;
                            width: auto;
                        }
                        
                        #bg_anywhere_chatgive_widget {
                            position: fixed;
                            height: 100%;
                            width: 100%;
                            top: 0;
                            left: 0;
                            align-items: center;
                            justify-content: center;
                            display: none;
                            z-index: 100000;
                            background-color: #00000085;
                        }
                        
                        #anywhere_chatgive_widget {
                            width: 420px;
                            max-height: 600px;
                            height: 100%;
                        }
                        
                `;

                document.querySelector('head').appendChild(styleElement);

                var div_anywhere_background = document.createElement('div');
                div_anywhere_background.id = 'bg_anywhere_chatgive_widget';
                var iframeElement = document.createElement('iframe');
                iframeElement.id = "anywhere_chatgive_widget";
                iframeElement.frameBorder = 0;
                div_anywhere_background.appendChild(iframeElement);
                document.querySelector('body').appendChild(div_anywhere_background);

                $w('#bg_anywhere_chatgive_widget').click(function () {
                    $w('#bg_anywhere_chatgive_widget').hide();
                })
            }

            $w.each($w('.chatgive-anywhere-btn'),function (key,value) {
                value.onclick = function () {
                    var connecion = $w(value).attr('data-connection');
                    var token = $w(value).attr('data-token');
                    var url = anywhere_install.base_url + "widget_load/index/" + connecion + "/" + token + "/1";
                    var current_src = $w('#anywhere_chatgive_widget').attr('src');
                    if(current_src !== url){
                        $w('#anywhere_chatgive_widget').attr('src',url);
                    }
                    $w('#bg_anywhere_chatgive_widget').css('display','flex');
                }
            })

        })
    }
})();
