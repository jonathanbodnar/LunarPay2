<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title><?= $page_name ? $page_name : ''?></title>
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap/dist/css/bootstrap.min.css">
        <?php if ($title_font_family_type == 'google') {?>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=<?= $title_font_family ?>">
        <?php } ?>
        <?php if ($content_font_family_type == 'google') {?>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=<?= $content_font_family ?>">
        <?php } ?>
        <style>
            h1 {
                font-size: 3.5rem;
            }
            .box {
                padding: 3em 5em;
                border-radius: 5px;
                box-shadow: 0 7px 15px 2px hsla(210, 1%, 58%, .2);
            }
            iframe.widget_two_columns {
                height: 100%;
            }
            .title_style{
                font-size: <?= $title_font_size ?>rem;
                font-family: '<?= $title_font_family ?>';
            }
            .content_style{
                font-size: <?= $content_font_size ?>rem;
                font-family: '<?= $content_font_family ?>';
            }
            .two-column-container {
                min-height: 100%;
            }
            .container-fluid {
                height: 100vh;
            }
            @media (max-width: 1200px) {
                .widget_two_columns {
                    width: 450px;
                }
            }
            @media (max-width: 992px) {
                .container-fluid {
                    height: auto;
                }
                iframe.widget_two_columns {
                    height: 600px;
                }
            }

            @media (max-width: 768px) {
                iframe.widget_two_columns {
                    width: 400px;
                    height: 600px;
                }
                .box {
                    padding: 3em 3em;
                }
            }

            @media (max-width: 550px) {
                iframe.widget_two_columns {
                    width: 380px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container-fluid">
            <div class="container h-100 py-5">
                <div class="row box two-column-container">
                    <div class="col-lg-6 col-xs-12" style="max-height: 100%; overflow-y: auto;">
                        <div class="header-content">
                            <h1 class="mb-5 title_style"><?= $title ? $title : ''?></h1>
                            <h2 class="content_style"><?= $content ? $content : ''?></h2>
                        </div>
                    </div>
                    <div class="col-lg-6 col-xs-12" style="text-align: center;">
                        <?php if($widget): ?>
                            <iframe class="widget_two_columns" src="<?= $widget ?>" width="500px" height="600px" frameborder="0"></iframe>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>