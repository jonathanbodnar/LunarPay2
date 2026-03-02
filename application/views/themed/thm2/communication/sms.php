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
        background: url(<?=BASE_ASSETS?>widget/chat-icon.svg) no-repeat;
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
    a.list-group-item.selected{
        background-color: hsl(210deg 50% 98%);
    }

    #send_user{
        padding: 15px;
        outline: none;
    }

    #send_user:empty:before{
        content: attr(placeholder);
        display: block ;
        color: rgba(86, 88, 103, .3) ;
        outline: none ;
    }

    form#send_text_form {
        box-shadow: 0 1px 3px rgba(50, 50, 93, .15), 0 1px 0 rgba(0, 0, 0, .02);
    }

    div#send_user {
        width: calc(100% - 3.5em);
        display: inline-block;
    }

    .send-icon {
        align-items: center;
        justify-content: center;
        width: 3em;
        height: 100%;
        padding: 15px;
        color: lightgray;
        border-left: hsl(0deg 0% 96%) 1px solid;
    }

    .sms_status {
        text-align: right;
        color: lightgray;
        position: relative;
        top: 5px;
        font-style: italic;
    }

    div#chat_messages > div:last-child {
        margin-bottom: 1.5em;
    }

    .label_header {
        margin-left: 0.7rem;
        margin-bottom: 0;
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
                                    <h3 class="mb-0"><b><i class="far fa-comments icon-xs"></i> SMS</b></h3>
                                </div>
                                <div class="col-4 text-right">
                                </div>
                            </div>
                        </div>
                        <div class="card-body">

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
                                        <div class="col-md-4" style=" min-height: 4.5em;
                                                                        display: flex;
                                                                        align-items: center;">
                                            <h2>Messages</h2>
                                            <div class="input-group input-group-alternative input-group-merge" style="width: 14em; margin: auto; margin-right: 0;">
                                                <div class="input-group-prepend">
                                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                                </div>
                                                <input name="search_messages" id="search_messages" class="form-control" placeholder="Search" type="text">
                                            </div>
                                        </div>
                                        <div class="col-md-8" style="border: solid 1px hsl(0deg 0% 83%);
                                                                        border-bottom: none;
                                                                        border-top: none;
                                                                        min-height: 4.5em;
                                                                        display: flex;
                                                                        align-items: center;">
                                            <div class="row" style="width: 100%;">
                                                <div class="col-md-9">
                                                    <h2 id="client_name"></h2>
                                                </div>
                                                <div class="col-md-3 status_chat_container" style="visibility: collapse;">
                                                    <?= form_open('',['id'=>'status_chat_item_form']);?>
                                                    <?php echo langx('type:', 'status_chat_item', ['class' => 'label_header']); ?> <br />
                                                    <select id="status_chat_item" name="status_chat" class="form-control form-control-sm"
                                                            style="border: none;
                                                                    font-size: 0.875rem;
                                                                    box-shadow: none !important;
                                                                    width: 100%;
                                                                    margin: auto;
                                                                    margin-right: 0;
                                                                    ">
                                                        <option value="O" selected>Open</option>
                                                        <option value="A">Archive</option>
                                                        <option value="C">Close</option>
                                                    </select>
                                                    <?=form_close();?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                <div class="row pb-2">
                                        <div id="chats_content" class="col-md-4 pr-0">
                                            <div class="list-group list-group-flush">
                                                <div class="list-group-item">
                                                    <div class="row align-items-center">
                                                        <div class="col-6 d-flex align-items-center row">
                                                            <select id="status_chat" class="form-control form-control-sm"
                                                                style="border: none;
                                                                    font-size: 0.875rem;
                                                                    box-shadow: none !important;
                                                                    width: 10rem;">
                                                                <option value="inbox" selected>My Inbox</option>
                                                                <option value="all">All Conversations</option>
                                                                <option value="archived">Archived</option>
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
                                            <?= form_open('',["id"=>"send_text_form"]) ?>
                                                <div style="visibility: collapse; display: inline-block;" role="button" tabindex="0" id="send_user" class="col-12" contenteditable="true" placeholder="Send a Text..."></div>
                                                <div class="send-icon d-inline-flex"><i class="far fa-paper-plane" style="cursor: pointer"></i></div>
                                            <?= form_close() ?>
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