<style>

    .setting_section{
        display: none;
    }

    .setting_section .custom-control-label::before {
        top: 0;
    }

    span.customize_text_purpose {
        font-size: 0.9rem;
        font-style: italic;
        color: hsl(0deg 0% 50%);
    }

    .form-row{
        width: 100%;
    }


</style>

<?php
$organizations = $view_data['organizations'];
?>
<!-- Header -->
<!-- Header -->
<div class="header pb-6 d-flex align-items-center" style="background-size: cover; background-position: center top;">
    <!-- Mask -->
    <span class="mask bg-gradient-default opacity-8"
          style="background-color: inherit!important; background: inherit!important"></span>
    <!-- Header container -->
    <div class="container-fluid align-items-center">
        <div class="row">
            <div class="col-lg-7 col-md-10">
                <h1 class="display-2 text-white"></h1>
                <p class="text-white mt-0 mb-5" style="margin:0!important"></p>

            </div>
        </div>
    </div>
</div>

<!-- Page content -->
<div class="container-fluid mt--6">
    <div class="row">
        <div class="col-xl-12 order-xl-1">
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-8">
                                    <h3 class="mb-0"><b><i class="fas fa-comments"></i> Customize Text</b></h3>
                                </div>
                                <div class="col-4 text-right">
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <?php echo form_open("", ['role' => 'form', 'id' => 'customize_text_tokens_form']); ?>
                            <?php echo form_close() ?>
                            <?php echo form_open("customize_text/save", ['role' => 'form', 'id' => 'customize_text_form']); ?>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation"
                                         style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="pl-lg-4 pr-lg-4">
                                <div class="row">                                    
                                    <div class="col-md-12">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <?= langx('company:', 'organization_id', ["class" => "form-control-label"]); ?>
                                                    <br/>
                                                    <select class="form-control" name="organization_id" placeholder="">
                                                        <?php foreach ($organizations as $organization) : ?>
                                                            <option value="<?= $organization['ch_id'] ?>" data-token="<?= $organization['token'] ?>">
                                                                <?= $organization['church_name'] ?></option>
                                                        <?php endforeach; ?>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="form-group">
                                                    <?= langx('sub_organization:', 'suborganization_id', ["class" => "form-control-label"]); ?>
                                                    <br/>
                                                    <select class="form-control" name="suborganization_id" placeholder="">
                                                        <option value="">Select a Sub Organization</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row setting_section" style="margin-top: 20px">
                                            <div class="col-md-12 customize_text_container">
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