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
<div class="container-fluid mt--6" id="product-view">
    <div class="row">
        <div class="col-xl-12 order-xl-1 align-items-center">
            <div class="row justify-content-center">
                <div class="col-lg-9">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center"> 
                                <div class="col-md-3">
                                    <h3 class="mb-0">Product</h3>
                                </div>
                            <div class="col-md-9 text-right">
                                 <?php if ($profile->count_invoices==0) : ?>                                 
                                 <button   class="btn btn-outline-neutral btn-sm btn-remove-product" data-id="<?= $profile->id ?>"  type="button">
                                    <i class="fas fa-ban"></i> <span class="btn-inner--text">Remove</span>
                                 </button>
                                <?php endif; ?>
                                
                            </div>
                           </div> 
                        </div>   
                                
                        <div class="card-body" style="padding-left: 60px">
                            <div class="col-md-12">
                                <div class="row">
                                    <div class="col-lg-4">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Id</span>
                                            <span class="d-block h3"> <?= $profile->reference ?></span>
                                        </div>
                                    </div>  
                                    <div class="col-lg-4">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Name</span>
                                            <span class="d-block h3"> <?= $profile->name ?></span>
                                        </div>
                                    </div>  

                                    <div class="col-lg-4">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Price</span>
                                            <span class="d-block h3"> $<?= number_format($profile->price, 2, '.', ',') ?></span>
                                        </div>
                                    </div> 
                                </div>   
                                <div class="row">
                                 <div class="col-lg-4">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Plan Type</span>
                                            <span class="d-block h3"> <?= $profile->plan_type ? $profile->plan_type : 'Not set' ?></span>
                                        </div>
                                    </div>
                                 <div class="col-lg-4">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Creation date</span>
                                            <span class="d-block h3"> <?= date("F j, Y",strtotime($profile->created_at)) ?></span>
                                            
                                        </div>
                                  </div>                                     
                                    <div class="col-lg-4">
                                        <div class="form-group">
                                            <?php $this->load->model('product_model') //for reading PERIODICALLY_STRINGS strings ?>
                                            <span class="h6 surtitle text-light text-muted">Recurrence</span>
                                            <span class="d-block h3">  
                                                <?php if ($profile->recurrence == Product_model::RECURRENCE_ONE_TIME) : ?>  
                                                    <?= prdRecurrenceAsString($profile->recurrence) ?>                                                        
                                                <?php endif; ?>                                                 
                                                  <?php if ($profile->recurrence == Product_model::RECURRENCE_PERIODICALLY) : ?>  
                                                    <?= prdRecurrenceAsString($profile->recurrence) ?>                                                        
                                                <?php endif; ?>
                                                 <?php if ($profile->recurrence == Product_model::RECURRENCE_CUSTOM) : ?>  
                                                    <?= prdRecurrenceAsString($profile->recurrence) ?>                                                        
                                                <?php endif; ?>
                                            </span>     
                                        </div>
                                  </div> 
                                  <div class="col-lg-4">
                                        <div class="form-group">
                                            <?= form_open('/products/update', ["id" => "update_form"]); ?>
                                            <span class="h6 surtitle text-light text-muted">Show in customer portal</span>
                                            <label class="tooltip-help text-center" data-toggle="tooltip" data-html="true" data-placement="left"
                                                title='<?php $this->load->view('helpers/product_show_customer_portal_help_text.php') ?>'>
                                                ?
                                            </label>
                                            <br>
                                            <label class="custom-toggle mt-2">
                                                <input type="checkbox" <?= $profile->show_customer_portal ? 'checked' : '' ?> class="form-control" name="show_customer_portal"  data-id="<?= $profile->id ?>">
                                                <span class="custom-toggle-slider rounded-circle" data-label-off="No" data-label-on="Yes"></span>
                                            </label>
                                            <?= form_close() ?>
                                        </div>
                                    </div>
                                    <?php if ($profile->recurrence == Product_model::RECURRENCE_PERIODICALLY) : ?>  
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">billing period</span>
                                            <span class="d-block h3">  
                                                <?= prdPeriodAsString($profile->billing_period) ?> 
                                            </span> 
                                        </div>
                                    <?php endif; ?>                    
                                </div>
                                <div class="row">
                                    
                                    <?php if ($profile->recurrence == Product_model::RECURRENCE_CUSTOM) : ?>  
                                        <div class="col-lg-4">
                                            <span class="h6 surtitle text-light text-muted">Payments</span>
                                            <?php $array_cus = json_decode( $profile->custom_date) ?>                                           
                                             <?php $datepayment = ''; ?> 
                                            <?php foreach ($array_cus as $key => $value) : ?>                                            
                                                 <?php $datepayment = ($value->date.' ($'. number_format($value->amount, 2, '.', ',')  .'), ' )   ?>
                                            <?php $datepayment = $datepayment . $datepayment  ?>
                                             <?php endforeach; ?>     
                                            <span class="d-block h3"> 
                                                <?php echo (substr($datepayment,0,-2)); ?>
                                            </span> 
                                        </div>
                                    <?php endif; ?>  
                                </div>
                                <div class="row">
                                    <div class="col-lg-6">
                                        <div class="form-group">
                                            <span class="h6 surtitle text-light text-muted">Description</span>
                                            <label class="tooltip-help text-center" data-toggle="tooltip" data-html="true" data-placement="left"
                                                title='<?php $this->load->view('helpers/product_description_help_text.php') ?>'>
                                                ?
                                            </label>
                                            <span class="d-block h3"><?= ($profile->description) ? $profile->description : ' - ' ?></span>
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
     <?php
         echo form_open('pages/remove', ["id" => "remove_product_form"]);
         echo form_close();
    ?>
</div>   
