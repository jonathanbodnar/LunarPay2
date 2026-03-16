<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="<?= COMPANY_NAME ?> uses a smooth chat interface to guide your donors through a seamless giving experience.">
        <meta name="author" content="<?= COMPANY_NAME ?>">
        <title><?= COMPANY_NAME ?></title>
        <?php $this->load->view('header', ['view_index' => $view_index]) ?>
    </head>
    <body class="d-flex flex-column min-vh-100 theme_background_color">       
        <!-- Main content -->
        <div class="p-5 text-center" id="general_error" style="display: none!important">
            <p><strong id="general_error_msg">Invoice not found</strong></p>
        </div>
        <div class="main-content" id="panel">
            <?php
           /* echo form_open('/', ["id" => "general_token_form"]);
            echo form_close();*/
            ?>
            <?= $content ?>
            <div class="container-fluid">
                <!-- Footer -->
                <div class="pt-0" >
                    <div class="row align-items-center justify-content-lg-between">
                        <div class="col-lg-12">
                            <div class="copyright text-center text-muted  justify-content-center mt-4">
                                Securely encrypted by SSL <br>
                                <a target="_BLANK" href="https://<?= COMPANY_SITE ?>"><?= COMPANY_SITE ?></a>
                            </div>
                        </div>
                        <div class="col-lg-6">

                        </div>
                    </div>
                </div>
            </div>
        </div>
        
           
        <?php $this->load->view('footer', ['view_index' => $view_index]) ?>
            
    </body>
</html>
