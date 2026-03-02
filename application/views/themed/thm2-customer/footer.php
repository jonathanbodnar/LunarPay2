
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery/dist/jquery.min.js"></script>
<script>
    var APP_BASE_URL = '<?= CUSTOMER_APP_BASE_URL ?>';
    var invoice =  '<?= json_encode($view_data) ?>'
    
    function loader (option) {
        if (option === "show") {
            $("#cover_spin").show(0);
        } else if (option === "hide") {
            $("#cover_spin").hide(0);
        }
    }
    loader('show');
</script>
<!-- Argon JS -->

<script>  var base_url = '<?= CUSTOMER_APP_BASE_URL ?>'; // base_url variable is used in cilte.js </script>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@9"></script>

<script src="<?= getFileVersion(BASE_ASSETS . 'js/cilte.js') ?>"></script>

<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/js-cookie/js.cookie.js"></script>
<!-- not getFileVersion needed -->
<!-- <script src="<?= BASE_ASSETS_THEME ?>assets/js/argon.js?v=1.2.0"></script> -->

<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/moment.min.js"></script>
<!-- <script src="https://hosted.paysafe.com/js/v1/latest/paysafe.min.js"></script> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.15.0/jquery.validate.min.js"></script>

<?php if ($this->config->item('fortis_environment') === 'prd'): ?>
    <script src="https://js.fortis.tech/commercejs-v1.0.0.min.js"></script>
<?php else: ?>
    <script src="https://js.sandbox.fortis.tech/commercejs-v1.0.0.min.js"></script>
<?php endif; ?>

<script type='text/javascript' src='<?= getFileVersion(BASE_ASSETS . 'customer/main.js') ?>'></script>
