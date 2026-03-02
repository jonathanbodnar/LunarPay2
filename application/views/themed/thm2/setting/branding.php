<style>
    .dropzone-single.dz-max-files-reached .dz-message {
        background-color: hsla(0, 0%, 0%, 0.32);
    }

    img.dz-preview-img[src=""] { /* FIX DROPZONE.JS PREVIEW IMAGE ERROR */
        display: none !important;
    }
</style>

<style id="css_preview">

</style>

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
                                <h3 class="mb-0"><i class="fas fa-link"></i> <?= $view_data['title'] ?></h3>
                            </div>
                            <div class="col-sm-6 text-right">
                                <button type="button" class="btn btn-primary btn-save" style="width: 200px">Save</button>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-5">
                            <?php echo form_open_multipart("setting/save_branding", ['role' => 'form', 'id' => 'branding_form']); ?>
                            <div class="row">
                                <div class="col-12">
                                    <div class="alert alert-default alert-dismissible alert-validation" style="display: none">
                                    </div>
                                </div>
                                <div class="col-12 mb-3 text-center">                                    
                                    
                                        Customize your brand across the products your customers use.
                                    
                                </div>
                                <div class="col-12 mb-3 text-center">
                                    <label><strong>Logo</strong></label><br>
                                    <small class="font-italic">(Maximum Size <?= BRAND_MAX_LOGO_SIZE ?> Kb)</small>
                                </div>
                                <div class="col-12 px-4 mb-3">
                                    <div id="logo_dropzone" class="dropzone dropzone-single"
                                         data-toggle="dropzone"
                                         data-dropzone-url="http://">
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
                                </div>
                                <div class="col-md-12">
                                    <div class="row justify-content-center">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-control-label" for="theme_color">Theme
                                                    Color</label>
                                                <input type="color" name="theme_color"
                                                       id="theme_color"
                                                       value="#000000" class="form-control"
                                                       placeholder="">
                                                <div class="hint-under-input">Pick one</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row justify-content-center">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="form-control-label"
                                                       for="button_text_color">Background
                                                    Color</label>
                                                <input type="color" name="button_text_color"
                                                       id="button_text_color"
                                                       value="#ffffff" class="form-control"
                                                       placeholder="">
                                                <div class="hint-under-input">Pick one</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php echo form_close(); ?>
                        </div>
                        <div id="branding_preview" class="col-md-7" style="display: none; /*box-shadow: -6px 3px 13px -6px #cbcbcb;*/">
                            <div class="mt-4 mb text-center">
                                <strong><label for="memo">Invoice Email preview</label></strong>
                            </div>
                            <?php
                            $invoice_html = $this->load->view("email/invoice.html",'',true);
                            $invoice_html = str_replace("[baseUrl]", CUSTOMER_APP_BASE_URL, $invoice_html);
                            $invoice_html = str_replace("[baseAssets]", BASE_ASSETS, $invoice_html);
                            $invoice_html = str_replace("[PaymentLink]", '#', $invoice_html);
                            $invoice_html = str_replace("[hasLogo]", 'block', $invoice_html);
                            $invoice_html = str_replace("[link_pdf]", '#', $invoice_html);
                            $invoice_html = str_replace("[DueDate]", date('F j, Y'), $invoice_html);
                            $invoice_html = str_replace("[Memo]", 'Memo Text' , $invoice_html);

                            $products = '
                            <tbody>
                                <tr><td style="padding:8px; border: 0;border-collapse: collapse; margin: 0;padding: 0;width: 100%; ">
                                <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;word-break: break-word;" >Product 1
                                </span><br><span style="color: #999999;font-size: 12px;line-height: 14px;">Qty 5</span>
                                </td><td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;padding:8px; ">
                                <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;">$10.00</span></td></tr>
    
                                <tr><td style="padding:8px; border: 0;border-collapse: collapse; margin: 0;padding: 0;width: 100%; ">
                                <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;word-break: break-word;" >Product 2
                                </span><br><span style="color: #999999;font-size: 12px;line-height: 14px;">Qty 3</span>
                                </td><td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;padding:8px; ">
                                <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;">$5.00</span></td></tr>
                            </tbody>
                            ';

                            $invoice_html = str_replace("[products]", $products, $invoice_html);
                            $invoice_html = str_replace("[Total]", '65.00', $invoice_html);
                            $invoice_html = str_replace("[ForeColor]", '', $invoice_html);
                            $invoice_html = str_replace("[BackColor]", '', $invoice_html);
                            $invoice_html = str_replace("[ThemeColor]", '', $invoice_html);
                            $invoice_html = str_replace("[CustomerName]", 'Customer Name', $invoice_html);
                            $invoice_html = str_replace("[logoUrl]", '', $invoice_html);
                            $invoice_html = str_replace("[CompanyName]", 'Company Name', $invoice_html);
                            $invoice_html = str_replace("[CompanySite]", COMPANY_SITE, $invoice_html);
                            $invoice_html = str_replace("[Reference]", 'IN00000000-####', $invoice_html);
                            $invoice_html = str_replace("[OrgName]", 'Company name', $invoice_html);
                            echo $invoice_html;
                            ?>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-right">
                    <button type="button" class="btn btn-primary btn-save" style="width: 200px">Save</button>
                </div>
            </div>
        </div>
    </div>
</div>

