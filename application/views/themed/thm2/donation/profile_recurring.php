<style>
    .card-stats .card-body {
        min-height: 120px;
    }
    
</style>

<?php $profile = $view_data['profile']; ?>

<div class="header pb-6 d-flex align-items-center top-separator-desktop">
    <!-- Mask -->
    <span class="mask bg-gradient-default opacity-8" style="background-color: inherit!important; background: inherit!important"></span>
    <!-- Header container -->
    <div class="container-fluid align-items-center">
        <div class="row">
            <div class="col-lg-7 col-md-10">
                <h1 class="display-2"></h1>
                <p class="mt-0 mb-5" style="margin:0!important; margin-top: -10px!important"></p>
            </div>
        </div>
    </div>
</div>

<div class="container-fluid mt--6">
    <div class="row">        
        <div class="col-xl-12 order-xl-1 align-items-center">
            <div class="row justify-content-center">
                <div class="col-lg-9">
                    <div class="card">
                        <div class="card-header">
                       <div class="row align-items-center"> 
                            <div class="col-6">
                                <h3 class="mb-0">Recurring </h3>
                            </div>
                            <div class="col-6 text-right">
                                  <?php if ($profile->status == 'A') : ?>    
                                <button   class="btn btn-primary btn-sm btn-stop-subscription" data-id="<?= $profile->id ?>"  type="button">                                                                         
                                    <i class="fas fa-ban"></i> <span class="btn-inner--text">Stop Subscription</span>                                    
                                    <?php endif ?>
                                </button>
                            </div>
                        </div>
                        </div> 
                        <div class="card-body" style="padding-left: 60px">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="row"> 
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Id Recurring</span>
                                                <span class="d-block h3"> <?= $profile->id ?></span>
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">AMOUNT</span>
                                                <span class="d-block h3"> $<?= number_format($profile->amount, 2, '.', ',') ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">TRX COUNT</span>
                                                <span class="d-block h3"> <?= $profile->trxs_count ?></span>  
                                            </div>
                                        </div>
                                         <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Total Fee</span>
                                                <span class="d-block h3">  $<?= number_format($profile->fee, 2, '.', ',') ?></span>  
                                            </div>
                                        </div>
                                         <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Net Given</span>
                                                <span class="d-block h3"> $<?= number_format($profile->given, 2, '.', ',') ?></span>  
                                            </div>
                                        </div>
                                         <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Frequency</span>
                                                <span class="d-block h3"> <?= ucfirst($profile->frequency) ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Customer</span>
                                                <span class="d-block h3">  <a style="text-decoration: underline; " href="  <?= BASE_URL_FILES.'donors/profile/'.$profile->account_donor_id  ?>"  class="link-primary">  <?= $profile->first_name . ' ' . $profile->last_name ?>  </a></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Email</span>
                                                <span class="d-block h3"> <?= $profile->email ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Method</span>
                                                <span class="d-block h3"> <?= $profile->method ?></span>  
                                            </div>
                                        </div>
                                         <div class="col-lg-4">
                                              <span class="h6 surtitle text-light text-muted">Status</span>
                                             <div class="form-group">
                                                <?php if ($profile->status_text == 'Active') : ?>                                                                                         
                                                <span class="badge badge-primary"> <?= $profile->status_text ?></span>
                                                <?php else: ?>
                                                <span class="badge badge-warning"> <?= $profile->status_text ?></span>                                                
                                                <?php endif ?>
                                                
                                            </div>
                                        </div>
                                         <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Starts on</span>
                                                <span class="d-block h3"> <?= date("F j, Y",strtotime($profile->start_on)) ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Next payment</span>
                                                <span class="d-block h3">  <?= date("F j, Y",strtotime( $profile->next_payment_on)) ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Trial Status</span>
                                                <span class="d-block h3"> <?= $profile->trial_days ? suGetTrialText($profile->trial_days, $profile->created_at) : 'N/A'  ?></span>  
                                            </div>
                                        </div>
                                        <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Trial Days</span>
                                                <span class="d-block h3"> <?= $profile->trial_days ? $profile->trial_days : 'N/A'  ?></span>  
                                            </div>
                                        </div>
                                          <div class="col-lg-4">
                                            <div class="form-group">
                                                <span class="h6 surtitle text-light text-muted">Created</span>
                                                <span class="d-block h3">  <?= date("F j, Y",strtotime( $profile->created_at)) ?></span>  
                                            </div>
                                        </div>                                        
                                    </div>   
                                </div>
                            </div>
                        </div>
                    </div>
                </div>  
            </div>                     
        </div>
    </div>    
</div>   
