<style>
    #products_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
    
</style><?php $this->load->view("general/product_component_modal") ?>

<div id="products-container">
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
                                    <h3 class="mb-0"><i class="fas f"></i> <?= $view_data['title'] ?></h3>
                                </div>
                                <div class="col-12 col-md-8 d-flex flex-column flex-md-row justify-content-md-end align-items-center">
                                    <div class="d-flex flex-row flex-wrap justify-content-center justify-content-md-end w-100">
                                        <button class="btn btn-primary btn-sm m-2 btn-GENERAL-product-component" data-context="products"> 
                                            <?= langx('create_product') ?>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                    <div class="row py-2" id="filters">
                    <!-- filter example
                        <div id="products_datatable_div_organization_filter" class="col-md-3 col-sm-12 ml-4" style="display: none">
                            <label for="statmnts_organization_filter"><?= langx('company:') ?></label>
                            <select id="products_datatable_organization_filter" class="custom-select custom-select-sm">
                                <option value="">All Companies</option>
                            </select>
                        </div>-->
                    </div>

                    <div class="table-responsive pb-4 pt-0">
                        <table id="products_datatable" class="table table-flush" width="100%">
                            <thead class="thead-light">
                                <tr>
                                    <th>Id[hidden]</th>
                                    <th>Reference</th>
                                    <th>Product name</th>
                                    <th>Price</th>
                                    <th>Plan Type</th>
                                    <th>Recurrence</th>
                                    <th>
                                        Show Customer Portal 
                                        <label class="tooltip-help text-center" data-toggle="tooltip" data-html="true" data-placement="left"
                                            title='<?php $this->load->view('helpers/product_show_customer_portal_help_text.php') ?>'>
                                            ?
                                        </label>
                                    </th>
                                    <th>Created At</th>
                                    <th>Action</th>                           
                                </tr>
                            </thead>
                        </table>
                        <?php
                            echo form_open('pages/remove', ["id" => "remove_product_form"]);
                            echo form_close();
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>