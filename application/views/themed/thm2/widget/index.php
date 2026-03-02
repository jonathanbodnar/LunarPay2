<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat Give</title>
        <script>var base_url = "<?= base_url() ?>"</script>
        <script>var baseUrlLogo = "<?= BASE_URL_FILES ?>"</script>
        <link rel="stylesheet" href="<?= BASE_ASSETS ?>widget/chat-widget.css">
        <script>var _chatgive_link = {"token": '<?= $token ?>', "connection": '<?= $connection ?>', "page": '<?= $page ?>', "type": '<?= $type ?>'
                , "standalone": <?= $standalone ?>};</script>
        <script src="<?= BASE_ASSETS ?>widget/chat-widget.js"></script>
    </head>
    <body class="chatgive_main_body <?= $standalone > 0 ? 'sc-body-standalone' : '' ?> <?= $standalone === 2 ? 'sc-square-standalone' : '' ?>">
    </body>

</html>