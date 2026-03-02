<?php $this->load->view("general/link_payment_component_modal") ?>
<?php $this->load->view("general/product_component_modal") ?>
<style>
    
    #payment_links_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
    
</style>
<div id="links-container">
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
                            <div class="row align-items-center">
                                <div class="col-12 col-md-4 text-md-left text-center">
                                    <h3 class="mb-0"><i class="fas fa-link"></i> <?= $view_data['title'] ?></h3>
                                </div>
                                <div class="col-12 col-md-8 d-flex flex-column flex-md-row justify-content-md-end align-items-center">
                                    <div class="d-flex flex-row flex-wrap justify-content-center justify-content-md-end w-100">
                                        <button class="btn btn-primary btn-sm m-2 top-table-bottom btn-add-payment-link-component" data-context="payment_link_context"> 
                                            <i class="fas fa-link"></i> <?= langx('create_payment_link') ?>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                    <div class="row py-2" id="filters">
                    
                    </div>

                    <div class="table-responsive pb-4 p-0">
                        <table id="payment_links_datatable" class="table table-flush table-hover" width="100%">
                            <thead class="thead-light">
                                <tr>
                                    <th>id[hidden]</th>
                                    <th class="text-left" style="width:200px;padding-left:60px;">Link url</th>
                                    <th>Status</th>
                                    <th>Products</th>
                                    <th>Cover Fee</th>
                                    <th>Created By</th>
                                    <th>Date</th>
                                    <th>&nbsp;</th>                           
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
</div>