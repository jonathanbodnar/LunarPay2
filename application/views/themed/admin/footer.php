<script>
    var base_url = '<?= BASE_URL_ADMIN ?>';
    var short_base_url = '<?= SHORT_BASE_URL ?>';
</script>
<!-- Argon Scripts -->
<!-- Core -->
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery/dist/jquery.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/js-cookie/js.cookie.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery.scrollbar/jquery.scrollbar.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery-scroll-lock/dist/jquery-scrollLock.min.js"></script>
<!-- Optional JS -->
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net/js/jquery.dataTables.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-bs4/js/dataTables.bootstrap4.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-buttons/js/dataTables.buttons.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-buttons-bs4/js/buttons.bootstrap4.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-buttons/js/buttons.html5.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-buttons/js/buttons.flash.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-buttons/js/buttons.print.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/datatables.net-select/js/dataTables.select.min.js"></script>
<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap-tagsinput/dist/bootstrap-tagsinput.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/select2@4.0.13/dist/js/select2.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@9"></script>

<!-- Argon JS -->
<script src="<?= BASE_ASSETS_THEME ?>assets/js/argon.js?v=1.2.1"></script>
<!-- Demo JS - remove this in your project -->
<script src="<?= BASE_ASSETS_THEME ?>assets/js/demo.min.js"></script>

<script src="<?= getFileVersion(BASE_ASSETS . "js/cilte.js") ?>"></script>

<?php if ($view_index == 'acl/index'): ?>
    <script src="<?= getFileVersion(BASE_ASSETS_ADMIN . "js/acl.js") ?>"></script>
<?php elseif ($view_index == 'accounts/index'): ?>
    <script src="<?= BASE_ASSETS_ADMIN ?>js/libs/imask.6.0.7.js"></script>
    <script src="<?= BASE_ASSETS_THEME ?>assets/vendor/moment.min.js"></script>
    <script src="<?= getFileVersion(BASE_ASSETS_ADMIN . "js/accounts.js") ?>"></script>
    <script src="<?= BASE_ASSETS_THEME ?>assets/vendor/chart.js/dist/Chart.min.js"></script>
    <script src="<?= BASE_ASSETS_THEME ?>assets/vendor/chart.js/dist/Chart.extension.js"></script>
<?php elseif ($view_index == 'referrals/index'): ?>
    <script src="<?= getFileVersion(BASE_ASSETS_ADMIN . "js/referrals.js") ?>"></script>    
<?php endif; ?>