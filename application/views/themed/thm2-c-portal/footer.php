<!-- jQuery and Bootstrap -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-fQybjgWLrvvRgtW6bFlB7jaZrFsaBXjsOMm/tB9LTS58ONXgqbR9W8oWht/amnpF" crossorigin="anonymous"></script>

<script>        
    var APP_BASE_URL = '<?= CUSTOMER_APP_BASE_URL ?>';
    var view_config = <?= $view_data ?>;
    var auth_obj_var = '<?= WIDGET_AUTH_OBJ_VAR_NAME ?>';
    var auth_access_tk_var = '<?= WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME ?>';
    var auth_refresh_tk_var = '<?= WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME ?>';
</script>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@9"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap-notify/bootstrap-notify.min.js"></script>
<script> var base_url = '<?= CUSTOMER_APP_BASE_URL ?>'; // base_url variable is used in cilte.js </script>
<script src="<?= getFileVersion(BASE_ASSETS . 'js/cilte.js') ?>"></script>
<!-- <script src="https://hosted.paysafe.com/js/v1/latest/paysafe.min.js"></script> -->
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/moment.min.js"></script>

<?php if ($this->config->item('fortis_environment') === 'prd'): ?>
    <script src="https://js.fortis.tech/commercejs-v1.0.0.min.js?v=2"></script>
<?php else: ?>
    <script src="https://js.sandbox.fortis.tech/commercejs-v1.0.0.min.js?v=1"></script>
<?php endif; ?>

<script src="<?= getFileVersion(BASE_ASSETS . 'customer-portal/main.js') ?>"></script>

