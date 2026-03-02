
<style>
    .dataTables_empty{text-align:center!important}
    #payment_links_datatable tr:hover {
        background-color: #f3f3f3ad;
        cursor: pointer;
    }
    .nav-link {
        color: #525f7f!important;
    }
    .row {
        margin-right:0px !important;
        margin-left: 0px !important;
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
        <!-- Table -->
        <div class="row">
            <div class="col">
                <div class="card">
                    <?php if (isset($view_data['title'])): ?>
                        <div class="card-header">
                            <div class="row">
                                <div class="col-sm-6">
                                    <h3 class="mb-0"><i class="fas accusoft"></i> <?= $view_data['title'] ?></h3>
                                </div>
                                 
                            </div>
                            </button>
                        </div>
                    <?php endif; ?>
                    <div class="row py-2" id="filters">
                    </div>
                    <div class="table-responsive py-4">
                        <div id="date_div_status_filter" class="col-md-3 col-sm-12 d-inline-block p-1" style="display: none!important;">
                            <label for="date_status_filter"><?= langx('Date Filter:') ?></label>
                                <table>
                                    <td class="pr-3 pt-1">
                                        <label class="custom-toggle">
                                            <input id="date_filter_checkbox" type="checkbox" checked="">
                                            <span class="custom-toggle-slider rounded-circle" data-label-off="No" data-label-on="Yes"></span>
                                        </label>
                                    </td>
                                    <td><?php $current_year = date("Y"); $current_month = date('m');?>
                                        <select   style='min-width:105px' id="year_status_filter" class="custom-select custom-select-sm date-filter-select">
                                            <?php 
                                                for($i=date("Y")-2;$i<=$current_year;$i++) {
                                                    echo "<option value=".$i." ".($i == $current_year ? ' selected="selected"' : '').">".$i."</option>";
                                                }
                                            ?>
                                        </select>
                                    </td>
                                    <td>
                                        <select style='min-width:105px' id="month_status_filter" class="custom-select custom-select-sm ml-2 date-filter-select">
                                            <?php
                                                for ($i_month = 1; $i_month <= 12; $i_month++) { 
                                                    $selected = ($current_month == $i_month ? ' selected' : '');
                                                    echo '<option value="'.$i_month.'"'.$selected.'>'. date('F', mktime(0,0,0,$i_month)).'</option>'."\n";
                                                }
                                            ?>
                                        </select>
                                    </td>
                                </table>
                        </div>
                        <table id="referals_datatable" class="table table-flush table-hover datatable" width="100%">
                            <thead class="thead-light">
                                <tr>
                                    <th>&nbsp;</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Email</th>
                                    <th>Zelle Account</th>
                                    <th>Registered Referrals</th>
                                    <th>Action</th>
                                    <th>Earnings</th> 
                                    <th>Paid</th>
                                    <th>Amount due</th>
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
    <div class="modal fade" tabindex="-1" role="dialog" id="newPay">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add payment</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        
                        <div class="form-group d-flex flex-column align-items-left">
                            <label>
                                <b>Amount:<br /></b>    
                            </label>
                            <input  type="number" id="amount-pay" class="form-control focus-first" placeholder="Enter an amount...">
                            <input  type="hidden" id="user-id-pay" class="form-control">
                        </div>
                        <div class="form-group d-flex flex-column align-items-left">
                            <div class="row">
                                <div class="col-md-12">                                    
                                    <label>
                                        <b>Add payment for Year / Month:<br /></b>    
                                    </label>
                                </div>
                                <div class="col-md-6">                                    
                                    <select style='min-width:105px' id="year_payment" class="form-control">
                                        <?php
                                        for ($i = date("Y") - 2; $i <= $current_year; $i++) {
                                            echo "<option value=" . $i . " " . ">" . $i . "</option>";
                                        }
                                        ?>
                                    </select>                            
                                </div>
                                <div class="col-md-6">
                                    <select style='min-width:105px' id="month_payment" class="form-control">
                                        <?php
                                        for ($i_month = 1; $i_month <= 12; $i_month++) {                                            
                                            echo '<option value="' . $i_month . '">' . date('F', mktime(0, 0, 0, $i_month)) . '</option>';
                                        }
                                        ?>
                                    </select>                            
                                </div>
                            </div>                            
                        </div>
                        <div class="form-group d-flex flex-column">
                            <label>
                                    <b>Comment (optional)<br/></b>    
                            </label>       
                            <textarea rows="5" id="message-pay"  class="form-control  align-items-left"></textarea>
                        </div>
                        
                        <div id="error-share-referrals"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary btn-send" id="affiliate-send">Add</button>
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