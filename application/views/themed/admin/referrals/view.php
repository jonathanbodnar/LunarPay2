<style>
    .card-stats .card-body {
        min-height: 120px;
    }
    .d-block{
        font-size: .9rem !important; /*improvex*/
        font-weight: 500; /*improvex*/
    }

    /*custom style for invoice status*/
    .invoiceStatus span.badge {font-size: .84em; width: auto!important; padding: 6px 14px; margin-left: -4px; font-weight: 600}

</style>


<!-- Page content -->
<div class="row justify-content-center">
    <div class="col-lg-11">
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-6">
                        <h3 class="mb-0">Referrals List</h3>
                    </div>
                </div>
            </div>
            <div class="card-body px-5" >
                <div class="row mb-3">
                    <div class="col h6 surtitle text-light text-muted">Full Name</div>
                    <div class="col h6 surtitle text-light text-muted">Email</div>
                    <div class="col h6 surtitle text-light text-muted text-center">Date Invite</div>
                    <div class="col h6 surtitle text-light text-muted text-center">Date Register</div>
                </div>

                <?php foreach ($view_data['referrals'] as $referral) { ?>
                    <div class="row  pt-1">
                        <div class="col-3">
                            <?= $referral['full_name'] ?>  
                        </div>
                        <div class="col-3">
                            <?= $referral['email'] ?>    
                        </div> 
                        <div class="col-3 text-center">
                            <?= $referral['date_sent'] ?>    
                        </div>
                        <div class="col-3 text-center">
                            <?= $referral['date_register'] ?>    
                        </div>
                    </div>
                <?php }; ?>
            </div>
        </div>
    </div>

    <div class="col-lg-11">
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-6">
                        <h3 class="mb-0">Affiliate Payments</h3>
                    </div>
                </div>
            </div>
            <div class="card-body px-5" >
                <div class="row mb-3">                    
                    <div class="col-4 h6 surtitle text-light text-muted">Comments</div>
                    <div class="col-2 h6 surtitle text-light text-muted text-center">Payment Covered Month/Year</div>
                    <div class="col-2 h6 surtitle text-light text-muted text-center">Created</div>
                    <div class="col-2 h6 surtitle text-light text-muted text-right">Amount</div>
                </div>
                <?php
                $sum = 0;
                foreach ($view_data['payments'] as $referral) {
                    $sum += $referral['amount']
                    ?>

                    <div class="row pt-1">                                                                    
                        <div class="col-4">
                            <?= !empty($referral['message']) ? $referral['message'] : '-' ?>    

                        </div>                         
                        <div class="col-2 text-center">
                            <?= $referral['date_month_covered'] ?>  
                        </div>
                        <div class="col-2 text-center">
                            <?= $referral['date_created'] ?>  
                        </div>
                        <div class="col-2 text-right">
                            <?= "$" . $referral['amount'] ?>   
                        </div>
                    </div>
                <?php }; ?>
                <div class="row">&nbsp;</div>
                <div class="card-footer" style="padding-top:10px;padding-left:0px;padding-right:0px">
                    <div class="row pt-10">                        
                        <div class="col-4"></div>
                        <div class="col-2"></div>
                        <div class="col-2 h6  surtitle text-light text-muted"> Total</div>
                        <div class="col-2 text-right"><?= "$" . $sum ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div> 
