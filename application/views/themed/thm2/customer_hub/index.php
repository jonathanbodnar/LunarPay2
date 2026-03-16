<div class="header pb-6 d-flex align-items-center">
    <!-- Mask -->
    <span class="mask bg-gradient-default opacity-8" style="background-color: inherit!important; background: inherit!important"></span>
    <!-- Header container -->
    <div class="container-fluid align-items-center">
        <div class="row">
            <div class="col-lg-7 col-md-10">
                <h1 class="display-2"></h1>
                <p class="mt-0 mb-5" style="margin:0!important; margin-top: -10px!important"></p>
            </div>
        </div>
    </div>
</div>
<div class="container-fluid mt--6">
    <div class="row">
        <div class="col-xl-12 order-xl-1 align-items-center">
            <div class="row justify-content-center">
                <div class="col-lg-12">
                    <div class="card">
                        <?php if (isset($view_data['title'])): ?>
                            <div class="card-header">
                                <div class="row">
                                    <div class="col-sm-6">
                                        <h3 class="mb-0"><?= $view_data['title'] ?></h3>
                                    </div>
                                </div>
                                </button>
                            </div>
                        <?php endif; ?>
                        <div class="card-body">
                            <div class="">
                                <div class="row">
                                    <!-- Left Side: Text + Link -->
                                    <div class="col-md-5 px-md-5 py-md-6">
                                        <h2 class="pr-md-5 pt-0 mt-0">
                                            Let your customers manage subscriptions and billing through an easy to use online portal.
                                        </h2>

                                        <ul class="pl-3 mt-3" style="list-style-type: none; line-height: 2.3">
                                            <li><i class="far fa-check-circle text-success"></i> Manage subscriptions</li>
                                            <li><i class="far fa-check-circle text-success"></i> Access purchased products</li>
                                            <li><i class="far fa-check-circle text-success"></i> Manage payment methods</li>
                                            <li><i class="far fa-check-circle text-success"></i> View invoices</li>
                                            <li><i class="far fa-check-circle text-success"></i> View payment history</li>
                                            <li><i class="far fa-check-circle text-success"></i> Customize and pay for plan packages</li>

                                        </ul>

                                        <hr class="my-4">

                                        <h5>Customer Portal Link</h5>
                                        <p>
                                            Share this link with your customers for easy access.
                                        </p>

                                        <div class="input-group">
                                            <input type="text" class="form-control" id="customer-hub-link" value="<?= BASE_URL ?>customer-hub/<?= $view_data['slug'] ?>" readonly>
                                            <div class="input-group-append">
                                                <button class="btn btn-primary btn-sm" id="customer-hub-btn-copy" type="button">
                                                    Copy Link
                                                </button>
                                            </div>
                                            <script>
                                                document.querySelector('#customer-hub-btn-copy').addEventListener('click', function() {
                                                    let link = document.querySelector('#customer-hub-link').value;
                                                    navigator.clipboard.writeText(link);
                                                    notify({
                                                        title: 'Notification',
                                                        'message': 'Link copied to your clipboard'
                                                    });
                                                });
                                            </script>
                                        </div>
                                        <small class="text-muted mt-2 d-block font-italic">
                                            Let your customers manage everything with ease.
                                        </small>
                                    </div>
                                    <div class="col-md-7 px-md-7 py-md-2 py-4 border-left border-gray">
                                        <h4 class="mb-3">Preview</h4>
                                        <div style="overflow-x: auto;">
                                            <img src="<?= BASE_ASSETS ?>thm2/images/brand/chapp.png"
                                                alt="Customer Hub Preview"
                                                class="img-fluid"
                                                style="min-width: 700px; height: auto;">
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