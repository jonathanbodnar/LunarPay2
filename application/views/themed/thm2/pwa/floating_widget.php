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
            .widget_floating {
                height: 650px;
                position: relative;
            }
            <?php if($background): ?>
            .container-fluid{
                background: url('<?=$background?>') no-repeat;
                background-size: cover;
            }
            <?php endif; ?>
            h1 {
                font-size: 3.5rem;
            }
            .title_style{
                font-size: <?= $title_font_size ?>rem;
                font-family: '<?= $title_font_family ?>';
            }
            .content_style{
                font-size: <?= $content_font_size ?>rem;
                font-family: '<?= $content_font_family ?>';
            }
            @media (max-width: 1200px) {
                .widget_floating {
                    width: 450px;
                }
            }
            @media (max-width: 1080px) {
                .container-fluid {
                    height: auto;
                }
                iframe.widget_floating {
                    width: 400px;
                    height: 600px;
                }
            }

            @media (max-width: 768px) {
                iframe.widget_floating {
                    width: 400px;
                    height: 600px;
                }
                .box {
                    padding: 3em 3em;
                }
            }

            @media (max-width: 550px) {
                iframe.widget_floating {
                    width: 380px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container-fluid" style="height: 100vh;">
            <div class="container h-100">
                <div class="row h-100">
                    <div class="col-lg-7 col-xs-12 my-auto">
                        <div class="header-content mx-auto">
                            <h1 class="mb-5 title_style"><?= $title ? $title : ''?></h1>
                            <h2 class="content_style"><?= $content ? $content : ''?></h2>
                        </div>
                    </div>
                    <div class="col-lg-5 col-xs-12 text-center my-auto">
                        <?php if($widget): ?>
                            <iframe class="widget_floating" src="<?= $widget ?>" width="500px" height="650px" frameborder="0"></iframe>
                        <?php endif; ?>
                    </div>

                </div>
            </div>
        </div>
    </body>
</html>