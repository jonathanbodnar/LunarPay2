<?php $profile = $view_data['profile']; ?>
<!-- Header -->
<!-- Header -->
<div class="header pb-6 d-flex align-items-center" style="min-height: 190px; background-size: cover; background-position: center top;">
    <!-- Mask -->
    <span class="mask bg-gradient-default opacity-8" style="background-color: inherit!important; background: inherit!important"></span>
    <!-- Header container -->
    <div class="container-fluid align-items-center">
        <div class="row">
            <div class="col-lg-7 col-md-10">
                <h1 class="display-2 text-white"><?= $profile->first_name ?></h1>
                <!--<p class="text-white mt-0 mb-5" style="margin:0!important">Profile</p>-->

            </div>
        </div>
    </div>
</div>
<!-- Page content -->
<div class="container-fluid mt--6">
    <div class="row">
        <div class="col-xl-12 order-xl-1">
            <div class="row">
                <!--<div class="col-lg-2"></div>-->
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-8">
                                    <h3 class="mb-0"><b>My Profile</b></h3>
                                </div>
                                <div class="col-4 text-right">
                                </div>
                            </div>
                        </div>
                        <div class="card-body" style="padding-left: 30px">
                            <?php echo form_open("dashboard/save_profile", ['role' => 'form', 'id' => 'add_myprofile_form', 'data-id' => $profile->id]); ?>
                            <h6 class="heading-small text-muted mb-4">Account information</h6>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="pl-lg-4">
                                <div class="row">
                                    <!--<div class="col-lg-1"></div>-->
                                    <div class="col-lg-10">
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <label class="form-control-label" for="input-first-name">First Name</label>
                                                    <input type="text" name="first_name" value="<?= $profile->first_name ?>" id="input-first-name" class="form-control" placeholder="" value="">
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <label class="form-control-label" for="input-last-name">Last Name</label>
                                                    <input type="text" name="last_name" value="<?= $profile->last_name ?>" id="input-last-name" class="form-control" placeholder="" value="">
                                                </div>                                    
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <div class="form-group">
                                                        <label class="form-control-label" for="input-email">Email address</label>
                                                        <input type="email" name="email" value="<?= $profile->email ?>" id="input-email" class="form-control" placeholder="" disabled>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-4">
                                                <div class="form-group">
                                                    <label class="form-control-label" for="input-phone">Phone</label>
                                                    <input type="text" name="phone" id="input-phone" value="<?= $profile->phone ?>" class="form-control" placeholder="">
                                                </div>
                                            </div>
                                            <div class="col-lg-8">
                                                <hr>
                                            </div>
                                            <div class="col-lg-8">
                                                <a href="javascript:void(0)" class="btn btn-change-password">Change Password</a>
                                                <button type="button" class="btn btn-primary btn-save float-right">Save changes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php echo form_close(); ?>
                        </div>
                    </div>
                </div>        
            </div>
        </div>        
    </div>
</div>

<div class="modal fade" id="change_password_modal">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="overlay d-flex justify-content-center align-items-center">
                <i class="fas fa-2x fa-sync fa-spin"></i>
            </div>
            <div class="modal-header">
                <h4 class="modal-title"><?= langx('Change Password') ?></h4>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <?php echo form_open("dashboard/change_password", ['role' => 'form', 'id' => 'change_password_form']); ?>
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('Current Password', 'current_password',['id'=>'label_current_password']); ?> <br />
                            <input type="password" class="form-control" name="current_password" id="current_password" autocomplete="off">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="form-group">
                            <?php echo langx('New Password', 'new_password',['id'=>'label_new_password']); ?> <br />
                            <input type="password" class="form-control" name="new_password" id="new_password" autocomplete="off">
                        </div>
                    </div>
                </div>
                <?php echo form_close(); ?>

            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary btn-save-password">Change</button>
            </div>
        </div>
        <!-- /.modal-content -->
    </div>
    <!-- /.modal-dialog -->
</div>