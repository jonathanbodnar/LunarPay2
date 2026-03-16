<?php /*$this->load->view("appcues/script")*/ ?>
<?php /*$this->load->view("appcues/identity_client")*/ ?>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
 
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<link rel="icon" href="<?= BASE_ASSETS ?>images/brand/qiconmain.png?v=1.1" type="image/png">

<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700">


<link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/nucleo/css/nucleo.css" type="text/css">


<!--custom css for payment customer-->
<link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS . 'css/customer.css') ?>" type="text/css">

<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous"/>


<link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS_THEME . 'assets/css/argon.css') ?>" type="text/css">

<!-- font -->
<!-- <link rel="stylesheet" href="<?= BASE_ASSETS ?>css/fonts/baloobhaina2/style.css"> -->

<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<style>
    body {
        font-family: 'Nunito', sans-serif;
    }
</style>

<style type="text/css">
    
    body {
        font-weight: 600
    }
    
    .btn-inside-cell {
        font-weight: bold!important
    }

    table.dataTable th td, table.dataTable tr td {
        padding-left: 15px!important;
        padding-right: 7px!important
    }
    .bold-weight {
        font-weight: bold!important
    }

    span.select2-selection.select2-selection--multiple {
        padding: 0 !important;
    }

    ul.select2-selection__rendered {
        padding: .25rem !important;
        margin: 0 !important;
    }

    /*select 2 FIX BUG WHEN USING MULTPLE - THE SEARCH INPUT IS HIDDEN AND SHRINKED TO 0 WIDTH*/
    .select2-container .select2-search--inline {
        display: block!important
    }
    li.select2-search .select2-search__field { 
        width: 100% !important;                         
        margin-left: 5px!important;
        margin-top: 8px!important;
        font-size: 14px!important;
    }
    /*-----*/

    /*hint for helping the user to know what the input is for*/
    .hint-under-input {
        margin-top:7px; 
        font-size:13px; 
        font-style: italic;
    }

    /*boostrap tags input adjustments */
    .bootstrap-tagsinput {
        width: 100%;
        border: 1px solid hsl(210, 14%, 83%);
        border-radius: .25rem;
        min-height: 46px
    }

    .bootstrap-tagsinput input {
        margin-top: 8px;
    }

    .bootstrap-tagsinput input:not([size]) {
        width: 20px;
    }

    .badge-default {
        background-color: #172b4d !important; /*theme color*/
        font-weight:normal!important
    }

    .badge-secondary {
        border: solid 1px lightgray;
    }
   
    .select2-container .select2-selection--single{
        font-size: inherit !important;
    }
    
    /*from-group required class will add an * the left of the label*/
    .form-group.required label:after {
        content:" *";
        color:#172b4d;
        font-weight: bold;
    }

</style>


<link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS . 'css/cilte.css') ?>">
<link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS . 'customer-portal/portal.css') ?>" type="text/css">

 
<script>
    var global_data_helper = {};
    var is_dev = true;
    var base_assets = "<?=BASE_ASSETS?>";
</script>

<?php if (HIDE_FUTURE_FEATURES): ?>
    <?php
    //is_dev (javascript variable) and HIDE_FUTURE_FEATURES (PHP Variable) have 
    ///the exact same and unique purpose: Future features must not show up on production environments 
    //but on development environments only
    ?>
    <style>
        .just-dev{
            display: none !important;
        }
    </style>
    <script>
        is_dev = false;
    </script>
<?php endif; ?>
 
