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
    <div class="row">
        <div class="col">
            <div class="card">
                <?php if (isset($view_data['title'])): ?>
                    <div class="card-header">
                        <div class="row">
                            <div class="col-sm-6">
                                <h3 class="mb-0"><i class="fas fa-building"></i> <?= $view_data['title'] ?></h3>
                            </div>                            
                        </div>
                        </button>
                    </div>
                <?php endif; ?>
                <br>
                <br>
                <div style="margin: auto; width: 90%; /*margin-top: -70px*/">
                    <iframe height="2500px" style="border: none; width: 100%;" src="<?= $view_data['processor_response']->result->app_link ?>"></iframe>
                </div>

            </div>                        
        </div>
    </div>                
</div>
