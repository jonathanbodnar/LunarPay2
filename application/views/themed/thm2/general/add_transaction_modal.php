<div class="modal fade" id="add_transaction_modal">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    <?= langx('Create Transaction') ?>
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="header-label show-when-fund-id-provided">
                        <br>
                        <?= langx('to') ?> 
                        <span class="organization_name" style="font-weight: bold"></span> <span class="sub-separator suborg-separator" style="display:none">/ </span>
                        <span class="suborganization_name" style="font-weight: bold"></span><span class="sub-separator" style="display:none"> / </span>
                        <span style="display: none" class="show-when-fund-id-provided"><?= langx('fund') ?>: <span class="fund_name" style="font-weight: bold"></span></span>
                    </span>
                </h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <?php echo form_open("donations/transaction", ['role' => 'form', 'id' => 'add_transaction_form', 'autocomplete' => 'off']); ?>
                <div class="row">
                    <div class="col-md-4 hide-when-fund-id-provided organization_container">
                        <div class="form-group">
                            <?php echo langx('company:', 'organization_id'); ?> <br />
                            <select class="form-control" name="organization_id" placeholder="">                                
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 hide-when-fund-id-provided suborganization_container">
                        <div class="form-group">
                            <?php echo langx('sub_organization:', 'suborganization_id'); ?> <br />
                            <select class="form-control" name="suborganization_id" placeholder="">                                
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('operation:', 'operation'); ?> <br />
                            <select class="form-control" name="operation" placeholder="" >
                                <optgroup label="Increase Fund">
                                    <option value="DE">Deposit</option>
                                    <option value="DN">Payment</option>
                                </optgroup>
                                <optgroup label="Decrease Fund">
                                    <option value="WD">Withdraw</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8 donation_fields flex-column" style="display: none;">
                        <div class="form-group">
                            <strong><?php echo langx('from_customer:', 'account_donor_id'); ?> <br /></strong>
                            <select class="form-control select2 donor" name="account_donor_id" >
                            </select>
                        </div>
                    </div>
                    <div class="col-md-4 flex-column align-items-center justify-content-around donation_fields" style="display: none;">
                        <div class="form-group d-flex flex-column align-items-center">
                            <strong><?php echo langx('send_receipt_email:', 'send_email'); ?> <br /></strong>
                            <label class="custom-toggle">
                                <input type="checkbox"
                                       name="send_email">
                                <span class="custom-toggle-slider rounded-circle"></span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4 hide-when-fund-id-provided" hidden>
                        <div class="form-group">
                            <strong><?php echo langx('to_fund:', 'fund_id'); ?> <br /></strong>
                            <select class="form-control" name="fund_id" placeholder="">
                                <option value="">Select A Fund</option>                                
                            </select>                            
                        </div>                        
                    </div>                    
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('amount:', 'amount'); ?>
                            <input class="form-control  focus-first" id="amount" name="amount" placeholder="0.00" type="number" value="" min="0">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('date_(mm/dd/yyyy):', 'transaction_date'); ?>
                            <input class="form-control" id="add_transaction_modal.transaction_date" name="date" placeholder="mm/dd/yyyy" type="text" value="" autocomplete="off">
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <?php echo langx('method:', 'method'); ?> <br />
                            <select class="form-control" name="method" placeholder="">
                                <option value="Cash">Cash</option>
                                <option value="Check">Check</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <?php echo langx('transaction_detail:', 'transaction_detail'); ?>
                            <input type="text" class="form-control" name="transaction_detail" placeholder="Add a description here">
                        </div>
                    </div>                    
                </div>
                <?php echo form_close(); ?>                
            </div>
            <div class="modal-footer justify-content-between">
                <button data-dismiss="modal" aria-label="Close" type="button" class="btn btn-default">Close</button>
                <button type="button" class="btn btn-primary btn-save" style="width: 200px">Add</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>