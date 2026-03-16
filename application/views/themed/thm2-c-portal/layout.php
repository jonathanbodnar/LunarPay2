<!doctype html>
<html lang="en">
    <head>
        <?php $this->load->view('header') ?>
        <?php $this->load->view('ui_loader'); ?>

        <script>
            function loader(option) {
                option === 'show' ? $('#cover_spin').show(0) : $('#cover_spin').hide(0);
            }
            loader('show');
        </script>
        <style id="css_branding"></style>
    </head>
    <body class="background_color">
        <div id="portal-container" style="overflow: hidden; display: none;">
            <div class="container-fluid-lg">
                <div class="text-center">
                    <!--<h5>Customer's Portal</h5>-->
                </div>
                <div class="row py-0">
                    <div class="col-lg-2"></div>
                    <div class="col-lg-4 pt-6" style="background-color: #fff; border-radius: 0.375rem 0 0 0.375rem !important;">
                        <div class="brand justify-content-between">
                            <img id="logo" style="width: 50%; max-width: 250px; display: none;" src="<?= BASE_ASSETS ?>thm2/images/brand/<?= APP_LOGO_FILE_NAME ?>" class="navbar-brand-img" alt="...">
                            <div style="clear: both"></div>
                            <span class="h3 font-weight-bold">Pay to <span class="company_name">[Company]</span></span>
                            <div class="my-2 total_amount" style="font-size: 36px !important; font-weight: 600; color: black;">$0</div>
                            <div class="my-2 font-weight-bold due_today_message" style="mutted-text; color: #999999; display:none">Due today</div>
                        </div>
                        <hr class="mb-0 mx-5">
                        <div class="left-container text-left">
                            <?= $this->load->view('/html-components/product-detail', ['component_data' => []], true); ?> 
                        </div>
                        <div class="mb-4 d-none d-lg-block text-center" style="position: absolute; bottom: 20px; font-size: 14px; left: 50px;">
                           Powered by <a target="_BLANK" href="https://lunarpay.com"> Lunar <img alt="LunarPay" width="40"  src="https://app.lunarpay.com/assets/thm2/images/brand/logo.png?ver=1.0"></a>
                        </div>
                    </div>
                    <div class="col-lg-4" style="background-color: #fff; border-radius: 0 0.375rem 0.375rem 0 !important;">
                        <div class="right-container">
                            <?= $this->load->view('/html-components/login-form', ['component_data' => []], true); ?> 
                            <?= $this->load->view('/html-components/payment-form', ['component_data' => []], true); ?>
                            <div class="mb-4"></div>
                            <div class="mt-4 text-center text-muted">
                                Securely encrypted by SSL <br>
                                <a style="font-size: inherit!important" class="text-muted" target="_BLANK" href="https://<?= COMPANY_SITE ?>"><?= COMPANY_SITE ?></a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>        
            <?php $this->load->view('footer') ?>        
        </div>
    </body>
</html>