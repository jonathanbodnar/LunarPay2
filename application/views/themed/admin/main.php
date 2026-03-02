<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="Start your development with a Dashboard for Bootstrap 4.">
        <meta name="author" content="Creative Tim">
        <title><?= COMPANY_NAME ?></title>
        <?php $this->load->view('header', ['view_index' => $view_index]) ?>
    </head>
    <body> 
        <?php $this->load->view('ui_loader') ?>

        <?php $this->load->view('leftmenu', ['view_index' => $view_index]) ?>
        <!-- Main content -->
        <div class="main-content" id="panel">
            <!-- Topnav -->
            <nav class="navbar navbar-top navbar-expand navbar-dark bg-primary border-bottom">
                <div class="container-fluid">
                    <div class="collapse navbar-collapse" id="navbarSupportedContent">
                        
                        <ul class="navbar-nav align-items-center  ml-md-auto ">
                            <li class="nav-item d-xl-none">
                                <!-- Sidenav toggler -->
                                <div class="pr-3 sidenav-toggler sidenav-toggler-dark" data-action="sidenav-pin" data-target="#sidenav-main">
                                    <div class="sidenav-toggler-inner">
                                        <i class="sidenav-toggler-line"></i>
                                        <i class="sidenav-toggler-line"></i>
                                        <i class="sidenav-toggler-line"></i>
                                    </div>
                                </div>
                            </li>                            
                        </ul>
                        <ul class="navbar-nav align-items-center  ml-auto ml-md-0 ">
                            <li class="nav-item dropdown">
                                <a class="nav-link pr-0" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <div class="media align-items-center">
                                        <div class="media-body  ml-2  d-none d-block">
                                            <span class="mb-0 text-sm  font-weight-bold"><?= $this->session->userdata('user_name') ?> <i class="ni ni-bold-down"></i></span>
                                        </div>
                                    </div>
                                </a>
                                <div class="dropdown-menu  dropdown-menu-right ">
                                    <div class="dropdown-header noti-title">
                                        <h6 class="text-overflow m-0"><?= $this->session->userdata('email') ?></h6>
                                    </div>
                                    <a href="<?= BASE_URL ?>dashboard/myprofile" class="dropdown-item">
                                        <i class="ni ni-single-02"></i>
                                        <span>My profile</span>
                                    </a>
                                    <div class="dropdown-divider"></div>
                                    <a href="<?= BASE_URL ?>auth/logout" class="dropdown-item">
                                        <i class="ni ni-user-run"></i>
                                        <span>Logout</span>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <?php
            echo form_open('/', ["id" => "general_token_form"]);
            echo form_close();
            ?>
            <?= $content ?>

            <div class="container-fluid mt--6" style="margin-top: 5px!important">
                <!-- Footer -->
                <footer class="footer pt-0">
                    <div class="row align-items-center justify-content-lg-between">
                        <div class="col-lg-6">
                            <div class="copyright text-center  text-lg-left  text-muted">
                                <?= FOOTER_TEXT ?>
                            </div>
                        </div>
                        <div class="col-lg-6">

                        </div>
                    </div>
                </footer>
            </div>
        </div>
        <?php $this->load->view('footer', ['view_index' => $view_index]) ?>        
    </body>
</html>
