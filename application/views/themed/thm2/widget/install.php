<style>
    .dropzone-single.dz-max-files-reached .dz-message {
        background-color: hsla(0, 0%, 0%, 0.32);
    }

    #sc-launcher {
        margin: 0 15px;
        height: 100%;
        width: 100%;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end;
        justify-content: flex-end;
    }

    #sc-launcher .sc-launcher {
        margin: 25px !important;
        position: relative !important;
    }

    #sc-launcher .sc-chat-window {
        position: relative !important;
        right: 0;
        bottom: 0;
        margin: 0 30px;
        margin-top: 20px;
    }

    #sc-launcher .sc-launcher .sc-open-icon {
        position: absolute !important;
        right: 0px !important;
        bottom: 0px !important;
    }

    #sc-launcher .sc-message-list {
        height: 450px !important;
    }

    #sc-launcher .sc-user-input--buttons {
        width: 70px !important;
        align-items: flex-end !important;
    }

    #sc-launcher .sc-header--img {
        width: 54px !important;
        height: 54px !important;
    }

    #sc-launcher .sc-message--text {
        white-space: initial !important;
    }

    .setting_section {
        display: none;
    }

    .setting_section .custom-control-label::before {
        top: 0;
    }

    .install_status {
        text-align: center;
    }

    .install_status_icon {
        font-size: 3rem;
        color: green;
    }

    .install_status_icon .fa-check-circle {
        color: green;
    }

    .install_status_icon .fa-times-circle {
        color: red;
    }

    .qr_url_container {
        display: flex;
    }

    span.customize_text_purpose {
        font-size: 0.9rem;
        font-style: italic;
        color: hsl(0deg 0% 50%);
    }

    .customize_text_container .form-row {
        width: 100%;
    }

    .customize_text_container .fa-save {
        font-size: 1.2rem;
    }

    @media (max-width: 768px) {
        .qr_url_container {
            display: flex;
            justify-content: center;
        }
    }

    .setting_section.customize .btn {
        width: 223px;
    }

</style>

<style id="preview_css">
    #sc-launcher .sc-btn.theme_color {
        background-color: #000000 !important;
        border-color: #000000 !important;
    }

    #sc-launcher .theme_text_color {
        color: #000000 !important;
    }

    #sc-launcher .theme_color {
        background-color: #000000 !important;
    }

    #sc-launcher .sc-message--content.sent .sc-message--text.theme_color {
        background-color: #000000 !important;
    }

    #sc-launcher .button_text_color {
        color: #ffffff !important;
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
    <div class="alert alert-default alert-dismissible fade show" role="alert" id="set_domain_message"
         style="display: none">
        <span class="alert-icon"><i class="ni ni-like-2"></i></span>
        <span class="alert-text">The domain name is required before installing your widget script</span>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">×</span>
        </button>
    </div>
    <div class="row">
        <div class="col-xl-12 order-xl-1">
            <div class="row">
                <!--<div class="col-lg-2"></div>-->
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-8">
                                    <h3 class="mb-0"><b><i class="fas fa-download icon-xs"></i>Setup</b></h3>
                                </div>
                                <div class="col-4 text-right">
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <?php echo form_open_multipart("install/save", ['role' => 'form', 'id' => 'install_form']); ?>

                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation"
                                         style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="pl-lg-4 pr-lg-4">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?= langx('company:', 'organization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="organization_id" placeholder="">
                                                <?php foreach ($organizations as $organization) : ?>
                                                    <option value="<?= $organization['ch_id'] ?>"
                                                            data-token="<?= $organization['token'] ?>"
                                                            data-phone="<?= $organization['twilio_phoneno'] ? $organization['twilio_phoneno'] : '' ?>">
                                                        <?= $organization['church_name'] ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <?= langx('sub_organization:', 'suborganization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="suborganization_id" placeholder="">
                                                <option value="">Select a Sub Organization</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <ul class="nav nav-tabs-code" id="nav-pills-tabs-tab" role="tablist">
                                    <li class="nav-item">
                                        <a class="nav-link active" id="nav-pills-tabs-customize-tab" data-toggle="tab"
                                           href="#nav-pills-tabs-customize" role="tab"
                                           aria-controls="nav-pills-tabs-customize" aria-selected="true">
                                            Customize
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" id="nav-pills-tabs-install-tab" data-toggle="tab"
                                           href="#nav-pills-tabs-install" role="tab"
                                           aria-controls="nav-pills-tabs-install" aria-selected="false">
                                            Install
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" id="nav-pills-tabs-access-tab" data-toggle="tab"
                                           href="#nav-pills-tabs-access" role="tab"
                                           aria-controls="nav-pills-tabs-access" aria-selected="false">
                                            Access
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" id="nav-pills-tabs-custom-text-tab" data-toggle="tab"
                                           href="#nav-pills-tabs-custom-text" role="tab"
                                           aria-controls="nav-pills-tabs-custom-text" aria-selected="false">
                                            Custom Text
                                        </a>
                                    </li>
                                </ul>

                                <div class="tab-content">
                                    <div id="nav-pills-tabs-customize" class="tab-pane fade show active" role="tabpanel"
                                         aria-labelledby="nav-pills-tabs-customize-tab">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="col-md-12">
                                                    <label class="form-control-label">Logo</label>
                                                </div>
                                                <div class="row setting_section customize" style="margin-top: 20px">
                                                    <div class="col-md-12">
                                                        <div id="logo_dropzone" class="dropzone dropzone-single"
                                                             data-toggle="dropzone"
                                                             data-dropzone-url="http://" id="logo">
                                                            <div class="fallback">
                                                                <div class="custom-file">
                                                                    <input type="file" name="logo"
                                                                           class="custom-file-input"
                                                                           id="dropzoneBasicUpload"
                                                                           style="display: none;">
                                                                </div>
                                                            </div>

                                                            <div class="dz-preview dz-preview-single">
                                                                <div class="dz-preview-cover">
                                                                    <img class="dz-preview-img" src="" alt=""
                                                                         data-dz-thumbnail
                                                                         style="max-width: 200px;margin: 0 auto; display: flex;">
                                                                </div>
                                                            </div>

                                                            <div class="dz-message"><span>Drop or Click here to upload Logo</span>
                                                            </div>

                                                        </div>
                                                        <br><br>
                                                        <div class="row">
                                                            <div class="col-md-6">
                                                                <div class="form-group">
                                                                    <label class="form-control-label" for="theme_color">Theme
                                                                        color</label>
                                                                    <input type="color" name="theme_color"
                                                                           id="theme_color"
                                                                           value="#000000" class="form-control"
                                                                           placeholder="">
                                                                    <div class="hint-under-input">Pick one</div>
                                                                </div>
                                                            </div>
                                                            <div class="col-md-6">
                                                                <div class="form-group">
                                                                    <label class="form-control-label"
                                                                           for="button_text_color">Button Text
                                                                        Color</label>
                                                                    <input type="color" name="button_text_color"
                                                                           id="button_text_color"
                                                                           value="#ffffff" class="form-control"
                                                                           placeholder="">
                                                                    <div class="hint-under-input">Pick one</div>
                                                                </div>
                                                            </div>
                                                            <div class="col-md-12">                                                                
                                                                <hr style="margin-top: 1rem">                                                                
                                                            </div>
                                                            <div class="col-md-12">
                                                                <div class="form-group">
                                                                    <label class="form-control-label" for="funds_flow">Fund Dynamics</label>
                                                                    <select class="form-control col-md-4" name="funds_flow">
                                                                        <option selected value="standard">One Fund</option>
                                                                        <option value="conduit">Multifunds</option>
                                                                    </select>
                                                                </div>
                                                                <div class="form-group conduit_container">
                                                                    <?php echo langx('Select Funds', 'Conduit Funds'); ?> <br />
                                                                    <select class="form-control select2" id="conduit_funds" name="conduit_funds[]">
                                                                    </select>
                                                                </div>
                                                                <div class="row">
                                                                    <div class="col-md-12">
                                                                        <div>By selecting "Multifunds" the donor will be able to give to several funds in one chat session</div>
                                                                        <br>
                                                                    </div>
                                                                </div>
                                                                <div class="row">
                                                                    <div class="col-md-12">
                                                                        <button type="button"
                                                                                class="btn btn-primary float-right btn-funds-flow">
                                                                                    Save Fund Settings
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="col-md-12">
                                                                <hr>
                                                            </div>

                                                            <div class="col-md-12">
                                                                <div class="form-group">
                                                                    <div class="form-row suggested_amounts">
                                                                        <div class="col-12">
                                                                            <label class="form-control-label"
                                                                                   for="suggested_amounts">Suggested Amounts</label>
                                                                        </div>
                                                                        <div class="col-md-12">
                                                                            <input name="suggested_amounts" type="text"
                                                                                   class="form-control"
                                                                                   data-toggle="tags"/>
                                                                            <div class="hint-under-input">Type a number followed by enter</div>
                                                                        </div>
                                                                        <div class="col-md-12">
                                                                            <br>
                                                                            <div>Suggested amounts are buttons with a preset amount the user can click for setting a donation amount in a quick way.</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="row">
                                                                    <div class="col-md-12">
                                                                        <button type="button"
                                                                                class="btn btn-primary float-right btn-update-amounts">
                                                                            Save Suggested Amounts
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="col-md-12">
                                                                <hr>
                                                            </div>

                                                            <div class="col-md-12">
                                                                <div class="form-group">
                                                                    <?php echo langx('button_message:', 'button_message', ['class' => 'form-control-label']); ?>
                                                                    <br/>
                                                                    <div class="form-row">
                                                                        <div class="col-md-9 d-flex align-items-center">
                                                                            <input type="text" class="form-control"
                                                                                   name="trigger_message"
                                                                                   placeholder="Button Message"
                                                                                   maxlength="56">
                                                                        </div>
                                                                        <div class="col-md-3 d-flex align-items-center flex-column">
                                                                            <label class="form-control-label"
                                                                                   for="debug_message"><?= langx('run_always') ?></label>
                                                                            <label class="custom-toggle">
                                                                                <input type="checkbox"
                                                                                       id="debug_message"
                                                                                       name="debug_message" value="1">
                                                                                <span class="custom-toggle-slider rounded-circle"></span>
                                                                            </label>
                                                                        </div>
                                                                        <div class="col-12 mt-3">
                                                                            <div>This welcome message shows to your
                                                                                users once to introduce the widget
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="row">
                                                                    <div class="col-md-12">
                                                                        <button type="button"
                                                                                class="btn btn-primary float-right btn-update-message">
                                                                            Save Message Settings
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-md-6 setting_section">
                                                <div class="row">
                                                    <div class="col-md-12">
                                                        <div class="form-group">
                                                            <div class="form-row">
                                                                <div class="col-md-5">
                                                                    <label for="widget_position" class="form-control-label ">Button & Chat Window Position</label>
                                                                    <select class="form-control" name="widget_position" id="widget_position">
                                                                        <option value="bottom_right" selected>Bottom Right</option>
                                                                        <option value="bottom_left">Bottom Left</option>
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-1"></div>
                                                                <div class="col-md-6 form-row align-content-end">
                                                                    <label for="widget_x_adjust" class="form-control-label col-md-1 col-form-label text-center" style="padding-right: 0;">X</label>
                                                                    <div class="col-md-5">
                                                                        <div class="input-group">
                                                                            <input type="number" name="widget_x_adjust" id="widget_x_adjust" class="form-control" value="0">
                                                                            <div class="input-group-append">
                                                                                <span class="input-group-text px-1">px</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <label for="widget_y_adjust" class="form-control-label col-md-1 col-form-label text-center" style="padding-right: 0;">Y</label>
                                                                    <div class="col-md-5">
                                                                        <div class="input-group">
                                                                            <input type="number" name="widget_y_adjust" id="widget_y_adjust" class="form-control" value="0">
                                                                            <div class="input-group-append">
                                                                                <span class="input-group-text px-1">px</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-12" style="background-color: #e1e1e1; border-radius: 15px">
                                                    <div class="col-md-12 py-2">
                                                        <label class="form-control-label d-block text-center">Screen Preview</label>
                                                    </div>
                                                    <div id="sc-launcher">
                                                        <div class="sc-chat-window opened">
                                                            <div class="sc-header">
                                                                <div class="sc-left-menu">
                                                                    <img class="sc-left-menu-img"
                                                                         src="<?= base_url() ?>assets/widget/leftmenuicon.png"
                                                                         alt="">
                                                                </div>
                                                                <div class="sc-header-title">
                                                                    <img class="sc-header--img" src="" alt="">
                                                                    <div class="sc-header--team-name theme_text_color">
                                                                    </div>
                                                                </div>
                                                                <div class="sc-right-menu">
                                                                    <div id="profile_name_header" class="sc-header--button"
                                                                         style="display: none">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="sc-message-list">
                                                                <div class="sc-message received sc-message-received theme-text-color"
                                                                     data-bot="2" data-tg="money_or_quickgive">
                                                                    <div class="sc-message--content received">
                                                                        <div class="sc-message--text theme_text_color"><span
                                                                                    class="Linkify">Hey, how much would you like to give</span>
                                                                        </div>
                                                                        <div class="sc-options-buttons-container"
                                                                             style="visibility: visible;">
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="100">$100
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="50">$50
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color"
                                                                                    data-value="10">$10
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="sc-message received sc-message-received theme-text-color"
                                                                     data-bot="11" data-tg="buttons">
                                                                    <div class="sc-message--content received">
                                                                        <div class="sc-message--text theme_text_color"><span
                                                                                    class="Linkify">Thank you for your generosity! Which fund would you like to give to?</span>
                                                                        </div>
                                                                        <div class="sc-options-buttons-container"
                                                                             style="visibility: visible;">
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="0">General
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="1">Fund 1
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="2">Fund 2
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="sc-message received sc-message-received theme-text-color"
                                                                     data-bot="12" data-tg="buttons">
                                                                    <div class="sc-message--content received">
                                                                        <div class="sc-message--text theme_text_color"><span
                                                                                    class="Linkify">Great! Would you like to make this gift recurring?</span>
                                                                        </div>
                                                                        <div class="sc-options-buttons-container"
                                                                             style="visibility: visible;">
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="one_time">Just Once
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="weekly">Weekly
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="monthly">Monthly
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="quarterly">Quarterly
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color "
                                                                                    data-value="yearly">Yearly
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="sc-message received sc-message-received theme-text-color"
                                                                     data-bot="14" data-tg="buttons_methods">
                                                                    <div class="sc-message--content received">
                                                                        <div class="sc-message--avatar"
                                                                             style="background-image: url(&quot;chat-icon.svg&quot;);"></div>
                                                                        <div class="sc-message--text theme_text_color"><span
                                                                                    class="Linkify">Which payment method would you like to use today?</span>
                                                                            <div class="sc-buttons-container">
                                                                            </div>
                                                                        </div>
                                                                        <div class="sc-options-buttons-container"
                                                                             style="visibility: visible;">
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long "
                                                                                    data-chat-code="1" data-value="1">1.
                                                                                Card •••• •••• •••• 1111
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long "
                                                                                    data-chat-code="1" data-value="2">2.
                                                                                Card •••• •••• •••• 2222
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long "
                                                                                    data-value="new_credit_card">New Credit
                                                                                Card
                                                                            </button>
                                                                            <button type="button"
                                                                                    class="sc-btn sc-btn-primary sc-btn-select theme_color button_text_color sc-button-long "
                                                                                    data-value="new_bank_account">New Bank
                                                                                Account
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div class="sc-user-input" action="" method="post">
                                                                <div class="sc-powered">
                                                                    <a class="sc-link sc-powered-link"
                                                                       href="https://chatgive.com/" target="_blank">Powered
                                                                        by ChatGive</a>
                                                                </div>
                                                                <div role="button" tabindex="0" contenteditable="true"
                                                                     placeholder="Write a reply..."
                                                                     class="sc-user-input--text"></div>
                                                                <div class="sc-user-input--buttons">
                                                                    <div class="sc-user-input--button">
                                                                        <button type="button"
                                                                                class="sc-user-input--send-icon-wrapper">
                                                                            <svg version="1.1"
                                                                                 class="sc-user-input--send-icon"
                                                                                 xmlns="http://www.w3.org/2000/svg" x="0px"
                                                                                 y="0px"
                                                                                 width="37.393px" height="37.393px"
                                                                                 viewBox="0 0 37.393 37.393"
                                                                                 enable-background="new 0 0 37.393 37.393">
                                                                                <g id="Layer_2">
                                                                                    <path d="M36.511,17.594L2.371,2.932c-0.374-0.161-0.81-0.079-1.1,0.21C0.982,3.43,0.896,3.865,1.055,4.241l5.613,13.263 L2.082,32.295c-0.115,0.372-0.004,0.777,0.285,1.038c0.188,0.169,0.427,0.258,0.67,0.258c0.132,0,0.266-0.026,0.392-0.08 l33.079-14.078c0.368-0.157,0.607-0.519,0.608-0.919S36.879,17.752,36.511,17.594z M4.632,30.825L8.469,18.45h8.061 c0.552,0,1-0.448,1-1s-0.448-1-1-1H8.395L3.866,5.751l29.706,12.757L4.632,30.825z"></path>
                                                                                </g>
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="sc-launcher theme_color opened">
                                                            <!-- react-empty: 25 -->
                                                            <img class="sc-open-icon"
                                                                 src="<?= base_url(); ?>assets/widget/close-icon.png">
                                                            <img class="sc-closed-icon"
                                                                 src="<?= base_url(); ?>assets/widget/logo-no-bg.svg">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    <div id="nav-pills-tabs-install" class="tab-pane fade" role="tabpanel"
                                         aria-labelledby="nav-pills-tabs-install-tab">
                                        <div class="row setting_section">
                                            <div class="col-md-12">
                                                <div class="form-group ">
                                                    <?php echo langx('domain_where_your_widget_is_going_to_be_installed:', 'domain', ['class' => 'form-control-label']); ?>
                                                    <br/>
                                                    <div class="form-row">
                                                        <div class="col-md-11 d-flex align-items-center">
                                                            <input type="text" class="form-control" name="domain"
                                                                   placeholder="Domain Name">
                                                        </div>
                                                        <div class="col-md-1">
                                                            <button type="button"
                                                                    class="btn btn-primary btn-update-domain">Update
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="row setting_section">
                                            <div class="col-md-12">
                                                <hr>
                                            </div>

                                            <div class="col-12">
                                                <label class="form-control-label">Instructions</label> <br>
                                                <label class="form-control-label">Copy the code below and place it on
                                                    your website:</label><br>
                                                <div class="row">
                                                    <div class="col-md-9">
                                                        <label class="form-control-label">Chat Widget</label> <br>
                                                        <pre id="code_to_copy" class="p-3"
                                                             style="border: 1px solid #dddddd">
                                                        </pre>
                                                        <a href="#" class="copy_code float-right position-relative"
                                                                 style="top: -10px">Copy</a>

                                                    </div>
                                                    <div class="col-md-3 install_status">
                                                        <div class="install_status_icon"></div>
                                                        <div class="install_status_text"></div>
                                                    </div>
                                                </div>
                                                <br>
                                                <label class="form-control-label">SSL Required</label> <br>
                                                <div>ChatGive requires a page that is protected with SSL encryption.
                                                </div>
                                                <br>
                                                <label class="form-control-label">Trigger Button</label> <br>
                                                <pre id="trigger_button" class="p-3" style="border: 1px solid #dddddd">
                                                </pre>
                                                <a href="#" class="copy_code float-right position-relative"
                                                   style="top: -10px">Copy</a>
                                            </div>
                                            <div class="col-md-12">
                                                <hr>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-control-label">Embedded Chat Form</label> <br>
                                                <pre id="embedded_to_copy" class="p-3"
                                                     style="border: 1px solid #dddddd">
                                                </pre>
                                                <a href="#" class="copy_code float-right position-relative"
                                                   style="top: -10px">Copy</a>
                                            </div>
                                            <div class="col-md-12 just-dev">
                                                <hr>
                                            </div>
                                            <div class="col-12 just-dev">
                                                <label class="form-control-label">QuickGive Widget</label> <br>
                                                <pre id="quickgive_to_copy" class="p-3"
                                                     style="border: 1px solid #dddddd">
                                                </pre>
                                                <a href="#" class="copy_code float-right position-relative"
                                                   style="top: -10px">Copy</a>
                                            </div>
                                        </div>

                                        <div class="row setting_section">
                                            <div class="col-md-12">
                                                <hr>
                                            </div>

                                            <div class="col-12">
                                                <label class="form-control-label">Wordpress Plugin</label> <br>
                                                <div>For easy installation on a wordpress website, download this plugin,
                                                    install on your wordpress site and activate.
                                                </div>
                                                <br>
                                                <a id="download_wordpress_plugin" href="#">Download Link</a>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="nav-pills-tabs-access" class="tab-pane fade" role="tabpanel"
                                         aria-labelledby="nav-pills-tabs-access-tab">
                                        <div class="row setting_section">
                                            <div class="col-12">
                                                <div class="row">
                                                    <div class="col-md-8">
                                                        <label class="form-control-label">This is your dedicated giving
                                                            link you can share</label> <br>
                                                        <pre id="short_link_to_copy" class="p-3"
                                                             style="border: 1px solid #dddddd">
                                                        </pre>
                                                        <a href="#" class="copy_code float-right position-relative"
                                                           style="top: -10px">Copy</a>
                                                    </div>
                                                    <div class="col-md-4 qr_url_container">
                                                    </div>
                                                    <div class="col-md-12 text-left">
                                                        <hr>
                                                    </div>
                                                    <div class="col-md-12 text-left">
                                                        <label class="form-control-label">Text to Give Number</label>
                                                        <br>
                                                        <p id="text_to_give_number"></p>
                                                        <?php $this->load->view('helpers/text_to_give_instructions') ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="nav-pills-tabs-custom-text" class="tab-pane fade" role="tabpanel"
                                         aria-labelledby="nav-pills-tabs-custom-text-tab">
                                        <div class="row setting_section" style="margin-top: 20px">
                                            <div class="col-md-12 customize_text_container">
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                            <?php echo form_close(); ?>
                            <?php echo form_open("", ['role' => 'form', 'id' => 'customize_text_tokens_form']); ?>
                            <?php echo form_close() ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>