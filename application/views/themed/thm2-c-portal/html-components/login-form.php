<style>
    /*adjust our modals*/
    .modal-content, .modal-header, .modal-footer {       
        border: none
    }

    @media (min-width: 576px){
        .modal-sm {
            max-width: 380px;
        } 
    }
    /*----*/
    #security-code-table {
        table-layout: fixed; /*same columns size*/
        margin: auto;
        max-width: 300px;
    }
    #security-code-table tbody tr td{
        padding: 2px 10px
    }
    #security-code-table tbody tr td input{        
        font-weight: 600;
        height:40px
    }
</style>
<!-- Modal -->
<div class="modal fade" id="sign-in-modal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm" modal-sm">
         <div class="modal-content">
            <div class="modal-header text-right">
                <i class="fas fa-lock"></i> <span class="pull-right"> <span class="is_registering">Sign in</span> as <strong><span class="sign_in_email"></span></strong>
            </div>
            <div class="modal-body text-center pt-0">
                Introduce the verification code we have sent to your email. <span class="is_registering">Sign in</span> for managing your subscriptions & payment methods
                <div class="row pt-4 pb-2">                    
                    <table id="security-code-table">
                        <tbody>
                            <tr>
                                <td>
                                    <input id="sc-1" type="text" class="form-control text-center" autocomplete="one-time-code" pattern="[0-9]*" maxlength="1" placeholder="">
                                </td>
                                <td>
                                    <input id="sc-2" type="text" class="form-control text-center" pattern="[0-9]*" maxlength="1" placeholder="">
                                </td>
                                <td>
                                    <input id="sc-3" type="text" class="form-control text-center" pattern="[0-9]*" maxlength="1" placeholder="">
                                </td>
                                <td>
                                    <input id="sc-4" type="text" class="form-control text-center" pattern="[0-9]*" maxlength="1" placeholder="">
                                </td>
                                <td>
                                    <input id="sc-5" type="text" class="form-control text-center" pattern="[0-9]*" maxlength="1" placeholder="">
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="row justify-content-center">
                    <div class="sc-status sc-status-info mb-0 font-weight-bolder py-3" role="alert" style="display: none;">
                        Code Sent to: <br>
                        <i class="far fa-envelope"></i>
                        <span class="sign_in_email"></span>
                    </div>
                    <div class="sc-status sc-status-verifying mb-0 font-weight-bolder py-3" role="alert" style="display: none;">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="sr-only">Loading...</span>
                        </div> Verifying
                    </div>
                    <div class="sc-status sc-status-success mb-0 font-weight-bolder py-3" role="alert" style="display: none;">
                        <i class="fas fa-check"></i> Success
                    </div>
                    <div class="sc-status sc-status-error mb-0 font-weight-bolder py-3" role="alert" style="display: none;">
                        <i class="fa-solid fa-circle-exclamation"></i> <span class="sc-error-message"></span>
                    </div>
                </div>

                <div class="mt-2">
                    <span class="text-dark">You won't need to authenticate<br> again unless you sign out</span>
                </div>

            </div>
            <div class="modal-footer">
                <button id="resend-code" type="button" class="btn btn-sm m-auto">Resend Code</button>
                <button type="button" class="btn btn-sm m-auto" data-dismiss="modal">Cancel</button>                
            </div>
        </div>
    </div>
</div>

<div class="login" style="display: none">
    <div class="row justify-content-md-center">                                
        <div class="col-lg-8">
            <form class="form-signin">
                <div class="row">
                    <div class="col-md-12">
                        <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                        </div>
                    </div>
                </div>
                <?php echo form_open('auth/login', ['role' => 'role', 'id' => "login_form"]); ?>
                <div class="form-group mb-2">
                    <div class="input-group input-group-alternative mb-0">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i class="fa fa-envelope"></i></span>
                        </div>
                        <input type="email" id="inputEmail" class="form-control" placeholder="Email address" required="" autofocus="">
                    </div>
                </div>

                <div class="form-group">
                    <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text"><i class="fa fa-key"></i></span>
                        </div>                                                
                        <input type="password" id="password" class="form-control" placeholder="Password" required="" autofocus="">
                    </div>
                </div>

                <div class="text-right mt-2">
                    <button id="btn_login" type="button" class="btn btn-primary btn-sm">Sign in</button>
                </div>
                <?php echo form_close(); ?>
            </form>
        </div>
    </div>                            
    <div class="text-center mt-3">
        Sign in for managing your subscriptions, invoices & payment methods
    </div>
    <hr>                            
</div>                        