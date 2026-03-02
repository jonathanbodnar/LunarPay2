<script>
     var message_share_referral = <?= '"'.$view_data['message_referral'].'"' ?>;
</script>
<style>    
    #payment_links_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
    .nav-link {
        color: #525f7f!important;
    }
    .referral_button{
        z-index:90;
        position: absolute;
        top: 300px;
        left: 10px;
    }
    
</style>


 
<div id="referals-container">
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
                                    <h3 class="mb-0"><i class="fas accusoft"></i> <?= $view_data['title'] ?></h3>
                                </div>
                                <div class="col-sm-6">
                                    <button class="btn btn-outline-neutral float-right top-table-bottom btn-add-referal-component" data-context="referal_component_context"> 
                                        <i class="fas accusoft"></i>
                                        <?= langx('send_referrals_link') ?>
                                    </button>
                                </div>
                            </div>
                            </button>
                        </div>
                    <?php endif; ?>
                    <div class="row m-0 xjustify-content-center" id="sub_totals_container" style="padding: 21px 25px 0px 25px">
                        <div class="col-md-4" style="display: block">
                            <div class="card card-stats">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col">
                                            <h5 class="card-title text-uppercase text-muted mb-0">EARNINGS</h5>
                                            <span class="h2 font-weight-bold mb-0" ><?= isset($view_data['earnings']) ? '$'.number_format($view_data['earnings'], 2, '.', ','): '$0.00' ?></span>
                                        </div>
                                        <div class="col-auto">
                                            <div class="icon icon-shape bg-gradient-black text-white rounded-circle shadow">
                                                <i class="fas fas fa-chart-line "></i>
                                            </div>
                                        </div>
                                    </div> 
                                    <p class="mt-3 mb-0 text-sm">
                                        <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                        <span class="text-nowrap"  ></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4" style="display: block">
                            <div class="card card-stats">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col">
                                            <h5 class="card-title text-uppercase text-muted mb-0">PAYMENTS</h5>
                                            <span class="h2 font-weight-bold mb-0"><?= $view_data['payments'] != 0 ? '$'. number_format($view_data['payments'], 2, '.', ',')  : '$0.00' ?></span>
                                        </div>
                                        <div class="col-auto">
                                            <div class="icon icon-shape bg-gradient-black text-white rounded-circle shadow">
                                                <i class="fas fa-money-bill"></i>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="mt-3 mb-0 text-sm">
                                        <span class="text-success mr-2"><i class="fa fa-arrow-up"></i></span>
                                        <span class="text-nowrap"  >Your zelle account: <?= $view_data['zelle_account']?> </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="referral_button">
                        <button  title="Copy link" onclick="navigator.clipboard.writeText('<?=$view_data['referral_link']?>');notify({title: 'Notification', 'message': 'Link copied on your clipboard'})" type="button" class="avoidTrClick btn px-2 py-1">
                                                <i class="fas fa-copy avoidTrClick"></i>
                        </button>Referral Link: <?=$view_data['referral_link']?>
                    </div>
                    <div class="table-responsive py-4">
                        <table id="referals_datatable" class="table table-flush table-hover" width="100%">
                            <thead class="thead-light">
                                
                                <tr>
                                    <th>ID [Hidden]</th>
                                    <th class="text-left" style="width:200px;padding-left:60px;">Email</th>
                                    <th>Name
                                    </th>
                                    <th>Date Sent</th>
                                    <th>Date Registered</th>
                                    <th>Earnings</th>
                                </tr>
                            </thead>
                        </table>
                        <?php echo form_open("", ['role' => 'form', 'id' => 'token_form']); ?>
                        <?php echo form_close(); ?>
                    </div>
                </div>
            </div>
        </div>
</div> 

<div class="modal fade" tabindex="-1" role="dialog" id="newReferal">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Referral</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation"
                                         style="display: none">
                                    </div>
                                </div>
                        </div>
                        <p>Share my referral code with</p>
                        <p>
                        <div class="form-group d-flex flex-column align-items-left">
                            <label>
                                <b>Full Name:<br /></b>    
                            </label>       
                            <input  type="text" id="referal-name" class="form-control focus-first" placeholder="Add a name">
                            
                        </div>
                        <div class="form-group d-flex flex-column align-items-left">
                            <label>
                                    <b>Email<br /></b>    
                            </label>       
                            <input  type="text" id="referal-email"  class="form-control" placeholder="Add an email">
                        </div>
                        <div class="form-group d-flex flex-column">
                            <label>
                                    <b>Message<br /></b>    
                            </label>       
                            <textarea rows="5" id="referal-message"  class="form-control  align-items-left" placeholder="Enter an invitation message"></textarea>
                        </div>
                        </p>
                        <div id="error-share-referrals"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary btn-send" id="referal-send">Send</button>
                    </div>
                </div>
            </div>
    </div>
</div>
<style>
    #error-share-referrals p {
        margin: 0px !important;
        color: red;
        font-size:12px;
    }
</style>
