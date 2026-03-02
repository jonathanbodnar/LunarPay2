<html>
    <head>
        <style>
            @media only screen and (max-width:600px) {.st-br { padding-left:10px; padding-right:10px } p, ul li, ol li, a { font-size:16px; line-height:150% } h1 { font-size:30px; text-align:center; line-height:120% } h2 { font-size:26px; text-align:center; line-height:120% } h3 { font-size:20px; text-align:center; line-height:120% } }
            a[x-apple-data-detectors] {
                color:inherit;
                text-decoration:none;
                font-size:inherit;
                font-family:inherit;
                font-weight:inherit;
                line-height:inherit;
            }

            body {
                width:100%;                
                font-family:roboto, "helvetica neue", helvetica, arial, sans-serif;				                
                margin:0;
            }

            .container {
                background-color: whitesmoke!important;                
                padding:20px;
            }

            .wrapper{
                margin: auto;
                margin-top: 20px;
                padding: 20px;
                max-width:400px;
                min-width:360px;
                background-color: white;
                border-radius: 10px;
            }

            .text-center {
                text-align: center!important;
            }
        </style>
    </head>
    <body> 
        <div class="container">
            <div class="wrapper"> 
                Hello!
                <p class="text-center">
                    Here is your security code:
                    <br><br>
                    <?= $code ?>
                </p>


                <div style="font-size: 90%; font-style: italic" class="text-center">
                    <?= $from_name ? 'Message sent from ' . $from_name . '<br><br>' : '' ?>
                    This email was generated because of a login/registration attempt from a web or mobile device located at <?= get_client_ip_from_trusted_proxy() ?>
                </div>
                <br>
                <br>
            </div>
            <br>
            <div class="text-center">
                Powered by <a target="_BLANK" href="https://<?= COMPANY_SITE ?>"><?= COMPANY_SITE ?></a>
            </div> 
        </div>        
    </body>
</html>