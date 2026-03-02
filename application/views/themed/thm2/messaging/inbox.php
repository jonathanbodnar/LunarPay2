<style>
    .bot-image img {
        width: 3em;
    }

    .bot-message {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        margin-top: 1rem;
        margin-right: 0;
        align-content: flex-end;
        flex-flow: row nowrap;
    }

    .bot-message-text {
        margin-left: 3rem;
        margin-right: 1rem;
        background-color: hsl(220deg 65% 92%);
        padding: 0.85rem;
        border-radius: 5px;
        font-weight: 600;
    }

    .bot-image {
        background: url(http://192.168.2.188/chatgive/assets/widget/chat-icon.svg) no-repeat;
        height: 2.3rem;
        width: 36px;
        /* align-content: flex-end; */
    }

    .donor-message {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        margin-top: 1rem;
        align-content: flex-end;
        flex-flow: row nowrap;
    }

    .donor-message-text {
        margin-left: 1rem;
        margin-right: 3rem;
        background-color: hsl(0deg 0% 95%);
        padding: 0.85rem;
        border-radius: 5px;
        font-weight: 600;
    }
    .bot-sm-image{
        height: 16px;
        width: 16px;
        position: relative;
        top: -2px;
        margin-right: 5px;
    }
    .list-group-item-action.selected {
        z-index: 1;
        text-decoration: none;
        color: hsl(223deg 22% 41%);
        background-color: hsl(210deg 50% 98%);
    }
    .no_logged {
        font-style: italic;
    }
    .sms_status {
        text-align: right;
        color: lightgray;
        position: relative;
        top: 5px;
        font-style: italic;
    }

    .archive_label {
        position: relative;
        top: -7px;
    }

    .sm_archive_label {
        font-size: 0.7rem;
        position: absolute;
        bottom: -1px;
        left: 0;
        color: hsl(0deg 0% 51%);
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
                <!--<div class="col-lg-2"></div>-->
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col-8">
                                    <h3 class="mb-0"><b><i class="far fa-comments icon-xs"></i> Inbox</b></h3>
                                </div>
                                <div class="col-4 text-right">
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="alert alert-default alert-dismissible alert-validation"
                                         style="display: none">
                                    </div>
                                </div>
                            </div>
                            <div class="pl-lg-4 pr-lg-4">
                                <div class="row">
                                    <div class="col-md-3 pl-0">
                                        <div class="form-group">
                                            <?= langx('company:', 'organization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="organization_id" placeholder="">
                                                <?php foreach ($organizations as $organization) : ?>
                                                    <option value="<?= $organization['ch_id'] ?>">
                                                        <?= $organization['church_name'] ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-3 pr-0">
                                        <div class="form-group">
                                            <?= langx('sub_organization:', 'suborganization_id', ["class" => "form-control-label"]); ?>
                                            <br/>
                                            <select class="form-control" name="suborganization_id" placeholder="">
                                                <option value="">Select a Sub Organization</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="card col-12 ">
                                        <div class="card-header py-0 px-2 border-0">
                                            <div class="row pt-2">
                                                <div class="col-md-4" style=" min-height: 4.5em;
                                                                                display: flex;
                                                                                align-items: center;">
                                                    <h2 id="organization_name"></h2>
                                                 </div>
                                                <div class="col-md-8" style="border: solid 1px hsl(0deg 0% 83%);
                                                                                border-bottom: none;
                                                                                border-top: none;
                                                                                min-height: 4.5em;
                                                                                display: flex;
                                                                                align-items: center;">
                                                    <h2 id="donor_name"></h2>
                                                    <?= form_open('',['id'=>'archive_form']);?><?= form_close(); ?>
                                                    <button class="btn btn-primary btn-archive" style="display: none; margin: auto; margin-right: 0;">Archive</button>
                                                    <button class="btn btn-primary btn-recover" style="display: none; margin: auto; margin-right: 0;">Recover<span class="sm_archive_label">Archived</span></button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-0 px-2">
                                            <div class="row pb-2">
                                                <div class="col-md-4">
                                                    <div class="list-group list-group-flush">
                                                        <div class="list-group-item">
                                                            <div class="row align-items-center">
                                                                <div class="col-12 d-flex align-items-center px-0">
                                                                    <select id="status_chat" class="form-control form-control-sm">
                                                                        <option value="O" selected>Open</option>
                                                                        <option value="C">Complete</option>
                                                                        <option value="I">Abandoned</option>
                                                                        <option value="F">Failed</option>
                                                                        <option value="A">Archived</option>
                                                                        <option value="all">All</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div class="list-group-chats" style="overflow-y: auto;
                                                                     height: calc(100vh - 22rem);">
                                                        </div>

                                                    </div>
                                                </div>
                                                <div class="col-md-8" style="border: solid 1px hsl(0deg 0% 83%);
                                                                                border-bottom: none;
                                                                                border-top: solid 1px hsl(210deg 16% 93%);">
                                                    <div id="chat_messages" class="col-12" style="
                                                                        overflow-y: auto;
                                                                        height: calc(100vh - 22rem);">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>