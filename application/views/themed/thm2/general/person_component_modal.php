<div class="modal fade" id="person_component_modal" >
    <div class="modal-dialog modal-dialog-centered modal-lg" style="max-width: 800px">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title">
                    <?= langx('Customer') ?>
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="header-label show-when-fund-id-provided">
                        <br>
                        <?= langx('to') ?> 
                        <span class="organization_name" style="font-weight: bold"></span> <span class="sub-separator suborg-separator" style="display:none">/ </span>
                        <span class="suborganization_name" style="font-weight: bold"></span><span class="sub-separator" style="display:none"> / </span>
                        <span style="display: none" class="show-when-fund-id-provided"><?= langx('fund') ?>: <span class="fund_name" style="font-weight: bold"></span></span>
                    </span>                    
                    <span style="font-size: 12.7px; padding-top: 20px; line-height: 24px; font-weight: normal; font-style: italic; display: none" class="subtitle">
                        <br>
                <!--         <span class="organization_name" style="font-weight: bold"></span>-->
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
                <?php echo form_open("donors/save", ['role' => 'form', 'id' => 'person_component_form', 'autocomplete' => 'false']); ?>
                <div class="row">
                    
                    <!--<div id="organization_field" class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('company:', 'organization_id'); ?> <br />
                            <select class="form-control" name="organization_id" placeholder="">                                
                            </select>
                        </div>
                    </div>
                    <div id="suborganization_field" class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('sub_organization:', 'suborganization_id'); ?> <br />
                            <select class="form-control" name="suborganization_id" placeholder="">                                
                            </select>
                        </div>
                    </div>-->
                    
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('first_name:', 'first_name'); ?> <br />
                            <input type="text" class="form-control focus-first" name="first_name" placeholder="First Name" autocomplete="nope">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('last_name:', 'last_name'); ?> <br />
                            <input type="text" class="form-control" name="last_name" placeholder="Last Name" autocomplete="nope">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('email:', 'email'); ?> <br />
                            <input type="text" class="form-control" name="email" placeholder="Email" autocomplete="nope">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('phone:', 'phone'); ?> <br />
                            <div class="form-row">
                                <div class="col-6">
                                    <div class="form-row">
                                        <div class="col-3 d-flex justify-content-center align-items-center ">
                                            <img id="img_country" width="100%" style="border-radius: 0.25rem" src="" alt="">
                                        </div>
                                        <div class="col-9">
                                            <select name="country_code" class="form-control">
                                            </select>
                                            <input type="hidden" name="phone_country_code" value="" autocomplete="nope">
                                        </div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <input type="text" name="phone"  class="form-control" placeholder="" autocomplete="nope">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('business_name:', 'business_name'); ?>
                            <input type="text" name="business_name" class="form-control" placeholder="" autocomplete="nope">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <?php echo langx('address:', 'address'); ?>
                            <input type="text" name="address" class="form-control" placeholder="" autocomplete="nope">
                        </div>
                    </div>
                </div>
                <?php echo form_close(); ?>
            </div>
            <div class="modal-footer justify-content-between">
                <button data-dismiss="modal" aria-label="Close" type="button" class="btn btn-default">Close</button>
                <button type="button" class="btn btn-primary btn-save" style="width: 200px">Create</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>