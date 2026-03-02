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
                <?php if (isset($view_data['title'])): ?>
                    <div class="card-header">
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><i class="fas fa-user-ninja"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6">

                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">BANK AMOUNT CONFIRMATION FAILED ATTEMPTS: <strong><?= ($view_data['bank_validation_attempts']) ?></strong> | MAX ALLOWED: 3</div>
                        <br><br>
                        <div class="col-md-12"><pre><?= var_dump($view_data['merchant_responses']) ?></pre></div>
                    </div>

                </div>
            </div>                        
        </div>
    </div>                
</div>