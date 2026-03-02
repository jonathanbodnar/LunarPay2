<div class="container-fluid">
    <div class="header-body">
        <div class="row align-items-center py-4">
            <div class="col-lg-6 col-7">
                <h6 class="h2 text-white d-inline-block mb-0"></h6>
                <nav aria-label="breadcrumb" class="d-none d-md-inline-block ml-md-4">
                    <ol class="breadcrumb breadcrumb-links breadcrumb-dark">
                    </ol>
                </nav>
            </div>                
        </div>        
    </div>
</div>

<!-- Page content -->
<div class="container-fluid mt--6">
    <!-- Table -->
    <div class="row">
        <div class="col">
            <div class="card">                                
                <div class="table-responsive py-4">
                    <?php if (isset($view_data['title'])): ?>
                        <div class="card-header">
                            <h3 class="mb-0"><i class="fas fa-dollar-sign"></i> <?= $view_data['title'] ?></h3>
                        </div>
                    <?php endif; ?>
                    <br>
                    <?php if ($view_data['email']): ?>
                        <div class="pl-lg-4 pr-lg-4 text-center">
                            <div class="row">
                                <div class="col-md-12">
                                    <h4>
                                        For accessing your payouts reports please login to Netbanx here:
                                    </h4>
                                </div>
                                <div class="col-md-12">
                                    <br>
                                    <a target="_blank" href="<?= $view_data['backoffice_url'] ?>"><?= $view_data['backoffice_url'] ?></a>
                                </div>
                            </div>
                        </div>
                        <div class="pl-lg-4 pr-lg-4 text-center">
                            <div class="row">
                                <div class="col-md-12">
                                    <hr>
                                </div>
                                <div class="col-md-12">
                                    If you don't remember your Netbanx credentials we can email them to <strong><?= $view_data['email'] ?></strong>
                                </div>
                                <div class="col-md-12">
                                    <br>
                                    <br>
                                    <button id="send_credentials_psf" type="button" class="btn btn-primary">Send me the credentials</button>
                                    <br>
                                    <br>
                                </div>
                            </div>
                        </div>
                    <?php else: ?>
                        <div class="pl-lg-4 pr-lg-4 text-center">
                            <div class="row">
                                <div class="col-md-12">
                                    <hr>
                                </div>
                                <div class="col-md-12">
                                    <h4>Your Company hasn't been setup yet</h4>                                    
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>