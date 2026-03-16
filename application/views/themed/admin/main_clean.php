<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="Start your development with a Dashboard for Bootstrap 4.">
    <meta name="author" content="Creative Tim">
    <title>Chat Give</title>

    <link rel="icon" href="<?= BASE_ASSETS ?>images/brand/icon.png?v=1.1?v=1.1" type="image/png">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700">
    <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/nucleo/css/nucleo.css" type="text/css">
    <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/@fortawesome/fontawesome-free/css/all.min.css" type="text/css">
    <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/css/argon.css?v=1.2.0.1" type="text/css">

    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Nunito', sans-serif;
        }
    </style>
    <link rel="stylesheet" href="<?= BASE_ASSETS ?>css/cilte.css?v=<?= date('YmdHis') ?>">
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