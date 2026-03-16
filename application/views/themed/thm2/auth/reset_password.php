<!--
=========================================================
* Argon Dashboard PRO - v1.2.0
=========================================================
* Product Page: https://www.creative-tim.com/product/argon-dashboard-pro
* Copyright  Creative Tim (http://www.creative-tim.com)
* Coded by www.creative-tim.com
=========================================================
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
-->
<!DOCTYPE html>
<html>

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="<?= COMPANY_NAME ?> uses a smooth chat interface to guide your donors through a seamless giving experience.">
        <meta name="author" content="<?= COMPANY_NAME ?>">
        <!-- Favicon -->
        <link rel="icon" href="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_FAVICON_FILE_NAME ?>" type="image/png">
        <title><?= COMPANY_NAME ?></title>
        <!-- Favicon -->
        <link rel="icon" href="<?= BASE_ASSETS ?>images/brand/qiconmain.png?v=1.3" type="image/png">
        <!-- Fonts -->
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700">
        <!-- Icons -->
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/nucleo/css/nucleo.css" type="text/css">
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/vendor/@fortawesome/fontawesome-free/css/all.min.css" type="text/css">
        <!-- Argon CSS -->
        <link rel="stylesheet" href="<?= BASE_ASSETS_THEME ?>assets/css/argon.css?v=1.2.0.7" type="text/css">

        <link rel="stylesheet" href="<?= getFileVersion(BASE_ASSETS . "css/cilte.css") ?>">

        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Nunito', sans-serif;
            }
        </style>
        
    </head>

    <body class="bg-default">
        <div class="main-content">
            <!-- Header -->
            <!--            <div class="text-center" style="padding:42px">
                            <img src="<?= BASE_ASSETS ?>images/brand/withtext.png" class="navbar-brand-img" alt="..." style="width: 300px; margin:auto">
                        </div>-->
            <div class="header bg-gradient-primaryx py-7 py-lg-8 pt-lg-9" style="padding-top: 100px!important">
                <div class="container">
                    <div class="header-body text-center mb-7" style="margin-bottom: 10px!important">
                        <div class="row justify-content-center">
                            <div class="col-xl-5 col-lg-6 col-md-8 px-5">
                                <img src="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_LOGO_FILE_NAME ?>" class="navbar-brand-img" alt="..." style="width: 150px; margin:auto">
                                <div style="padding:20px">
                                    <!--<h1 class="text-white">Welcome!</h1>-->
                                    <p class="text-lead text-white">Use this form to reset your password.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="separator separator-bottom separator-skew zindex-100">
                    <svg x="0" y="0" viewBox="0 0 2560 100" preserveAspectRatio="none" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
                    </svg>
                </div>
            </div>
            <!-- Page content -->
            <div class="container mt--8 pb-5">
                <div class="row justify-content-center">
                    <div class="col-lg-5 col-md-7">
                        <div class="card bg-secondary border-0 mb-0">
                            <div class="card-body px-lg-5 py-lg-5">
                                <div class="text-center text-muted mb-4">
                                    Change your password
                                </div>
                                <?php if ($this->session->flashdata('message')): ?>
                                    <div class="alert alert-warning"><?= $this->session->flashdata('message') ?></div>
                                <?php endif; ?>
                                <?php echo form_open('auth/reset_password', ['role' => 'role', 'id' => "reset_form"]); ?>

                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="alert alert-default alert-validation" style="display: none">
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <div class="input-group input-group-merge input-group-alternative">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text"><i class="ni ni-lock-circle-open"></i></span>
                                        </div>
                                        <input class="form-control" placeholder="New Password" type="password" name="new" required>
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <div class="input-group input-group-merge input-group-alternative">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text"><i class="ni ni-lock-circle-open"></i></span>
                                        </div>
                                        <input class="form-control" placeholder="Confirm New Password" type="password" name="new_confirm" required>
                                    </div>
                                </div>

                                <div class="alert alert-default fade show" role="alert" id="reset_message" style="display: none; margin-top: 32px">
                                    <span class="alert-icon"><i class="ni ni-like-2"></i></span>
                                    <span class="alert-text message"></span>
                                </div>

                                <div class="text-center">
                                    <button id="btn_reset" type="button" class="btn btn-primary my-4" style="min-width: 150px">Reset Password</button>
                                </div>
                                <input type="hidden" name="code" value="<?= $code ?>">
                                <?php echo form_close(); ?>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-6">
                                <a href="<?= base_url() ?>auth/login" class="text-light">Sign in</a>
                            </div>
                            <div class="col-6 text-right">
                                <a href="<?= base_url() ?>auth/register" class="text-light">Create new account</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Footer -->
        <footer class="py-5" id="footer-main">
            <div class="container">
                <div class="row align-items-center justify-content-xl-between">
                    <div class="col-xl-12 text-center">
                        <div class="copyright text-muted">
                            <?= FOOTER_TEXT ?>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
        <!-- Argon Scripts -->
        <!-- Core -->
        <script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery/dist/jquery.min.js"></script>
        <script src="<?= BASE_ASSETS_THEME ?>assets/vendor/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
        <!--<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/js-cookie/js.cookie.js"></script>-->
        <!--<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery.scrollbar/jquery.scrollbar.min.js"></script>-->
        <!--<script src="<?= BASE_ASSETS_THEME ?>assets/vendor/jquery-scroll-lock/dist/jquery-scrollLock.min.js"></script>-->
        <!-- Argon JS -->
        <!--<script src="<?= BASE_ASSETS_THEME ?>assets/js/argon.js?v=1.2.0"></script>-->
        <!-- Demo JS - remove this in your project -->
        <!--<script src="<?= BASE_ASSETS_THEME ?>assets/js/demo.min.js"></script>-->
        <script>
            $(document).ready(function () {
                $('input[name="identity"]').focus();
            });
            var base_url = '<?= base_url() ?>';
        </script>
        <script src="<?= getFileVersion(BASE_ASSETS . 'js/cilte.js') ?>"></script>
        <script src="<?= BASE_ASSETS ?>js/reset_password.js?v=1"></script>
        
        <?php if (FORCE_HIDE_INTERCOM === FALSE): ?>            
            <?php $this->load->view("general/intercom_no_session") ?>            
        <?php endif; ?>
        
    </body>

</html>