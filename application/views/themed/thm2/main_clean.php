<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="<?= COMPANY_NAME ?> uses a smooth chat interface to guide your donors through a seamless giving experience">
        <meta name="author" content="<?= COMPANY_NAME ?>">
        <!-- Favicon -->
        <link rel="icon" href="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_FAVICON_FILE_NAME ?>" type="image/png">
        <title><?= COMPANY_NAME ?></title>       

        <link rel="icon" href="<?= BASE_ASSETS ?>images/brand/qiconmain.png?v=1.3" type="image/png">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700">
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/nucleo/css/nucleo.css" type="text/css">
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/@fortawesome/fontawesome-free/css/all.min.css" type="text/css">
        <link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS_THEME . 'assets/css/argon.css') ?>" type="text/css">

        
        <!--<link rel="stylesheet" href="<?= BASE_ASSETS ?>css/fonts/baloobhaina2/style.css">-->
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">

        <style type="text/css">
            body{
                /*font-family: 'baloo_bhaina_2bold';*/
                /*font-family: 'baloo_bhaina_2extrabold';*/
                /*font-family: 'baloo_bhaina_2medium';*/
                /*font-family: 'baloo_bhaina_2regular';*/
                /*font-family: 'baloo_bhaina_2semibold';*/ 

                /*font-size: 14px!important;*/
                font-family: 'Nunito', sans-serif;
            }
        </style>
        <link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS . "css/cilte.css") ?>">
    </head>

    <body>        
        <!-- Main content -->
        <div class="main-content" id="panel">
            <!-- Topnav -->

            <?= $content ?>

            <div class="container-fluid mt--6" style="margin-top: 5px!important">
                <!-- Footer -->
                <footer class="footer pt-0">
                    <div class="row align-items-center justify-content-lg-between">
                        <div class="col-lg-12">
                            <div class="copyright text-center  text-lg-center  text-muted">
                                <?= FOOTER_TEXT ?>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>        
    </body>
</html>
