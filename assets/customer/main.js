(function () {
    $(document).ready(async function () {
        await customer.load_invoice();
        await customer.load_events();
        await customer.get_branding_data();
        customer.payment_processor_init();
        loader('hide')
    });
}());

var customer = {
    apiKey: null,
    is_submited: false, //will be loaded within the invoice resource
    payButton: '#pay-button',
    payForm: '#payment-form',
    invoice: JSON.parse(invoice),
    invoice_total: null,
    base_api: APP_BASE_URL + 'customer/apiv1/',
    region: null,
    payment_type: null,
    currentInvoiceObj: null, //it is populated when the ajax call is performed, we keep it global for general use,    
    formatter: null, //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
    payment_processor: null,
    orgnx_id: null,
    total_amount: '0.00',
    total_amount_float: 0,
    fee: '0.00',
    theme: {background_color: null, text_color: null},
    payment_form_selected: 'cc',
    customer_hub_url: null,
    options: {
        environment: null, //TEST / LIVE //will be loaded within the invoice resource
        style: {
            input: {
                "font-size": "13px",
                "color": "#1A1A1A!important",
                "font-family": "Open Sans, sans-serif;",
                "font-weight": "300"

            },
            "::placeholder": {
                "color": "#bbbbc2!important",
                "font-family": "Open Sans, sans-serif;",
                "font-weight": "300"
            }
        },
        fields: {
            cardNumber: {
                selector: "#cardNumber",
                placeholder: "Card Number",
            },
            expiryDate: {
                selector: "#cardExpiry",
                placeholder: "MM / YY"
            },
            cvv: {
                selector: "#cardCvc",
                placeholder: "CVV"
            }
        }
    },
    _get_payments_tab(methods) {
        methods = JSON.parse(methods);
        tab = {};
        if (methods.includes('CC') && methods.includes('BANK')) {
            tab.tabs = `<div role=\"tablist\" aria-orientation=\"horizontal\" aria-label=\"Métodos de pago\" class=\"Tabs-TabList\"><div role=\"presentation\" class=\"Tabs-TabListItemContainer\"><button class=\"Tabs-TabListItem\"    id=\"card-tab\"  type=\"button\" tabindex=\"0\"><div class=\"Tabs-TabListItemContent\"><div class=\"Tabs-TabListPaymentMethod text-center\">
                        <div><i class="ni ni-credit-card fa-2x theme_foreground_color"></i></div>  
                        <div class=\"Tabs-TabListPaymentLabel\">Card</div> </div></div></button></div> <div role=\"presentation\" class=\"Tabs-TabListItemContainer\"> <button class=\"Tabs-TabListItem\" id=\"ach-tab\"  role=\"tab\" type=\"button\"   >  <div class=\"Tabs-TabListItemContent\"><div class=\"Tabs-TabListPaymentMethod text-center\"><div>
                        <i class="fa fa-bank fa-2x theme_foreground_color"></i>&nbsp;</div><div class=\"Tabs-TabListPaymentLabel\">Bank Transfer</div></div></div></button></div></div>`;
        }
        if (methods.includes('CC')) {
            tab.cc = customer._get_cc_form();
        }
        if (methods.includes('BANK')) {
            tab.bank = customer._get_bank_form();
        }
        if (methods.length > 1) {
            $("#payment-form-title").css("display", "block");
        }
        return tab;
    },
    _get_cc_form() {
        return `<div class=\"PaymentForm-paymentMethodForm flex-container spacing-16 direction-column wrap-wrap\"><div class=\"flex-item width-12\"><div class=\"FormFieldGroup\"><div class=\"FormFieldGroup-labelContainer flex-container justify-content-space-between\"><label for=\"cardNumber-fieldset\"><span class=\"Text customer_name\">Card information</span></label></div><fieldset class=\"FormFieldGroup-Fieldset\" id=\"cardNumber-fieldset\"><div class=\"FormFieldGroup-container\" id=\"cardNumber-fieldset\"><div class=\"FormFieldGroup-child FormFieldGroup-child--width-12 FormFieldGroup-childLeft FormFieldGroup-childRight FormFieldGroup-childTop\"><div class=\"FormFieldInput\"><div class=\"CheckoutInputContainer\"><span class=\"InputContainer\" data-max=\"\"><div class=\"CheckoutInput CheckoutInput--tabularnums Input\" id=\"cardNumber\"/></span></div><div class=\"FormFieldInput-Icons\"><span class=\"input-group-addon\"><i class=\"fa fa-credit-card theme_foreground_color cc_can_change\" id=\"cc_icon\"/></span></div></div></div><div class=\"FormFieldGroup-child FormFieldGroup-child--width-6 FormFieldGroup-childLeft FormFieldGroup-childBottom\"><div class=\"FormFieldInput\"><div class=\"CheckoutInputContainer\"><span class=\"InputContainer\" data-max=\"\"><div class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" autocomplete=\"cc-exp\" autocorrect=\"off\" spellcheck=\"false\" id=\"cardExpiry\" name=\"cardExpiry\" type=\"tel\" aria-label=\"Fecha de vencimiento\" placeholder=\"MM/AA\" aria-invalid=\"false\" value=\"\"/></span></div></div></div><div class=\"FormFieldGroup-child FormFieldGroup-child--width-6 FormFieldGroup-childRight FormFieldGroup-childBottom\"><div class=\"FormFieldInput has-icon\"><div class=\"CheckoutInputContainer\"><span class=\"InputContainer\" data-max=\"\"><div class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" autocomplete=\"cc-csc\" autocorrect=\"off\" spellcheck=\"false\" id=\"cardCvc\" name=\"cardCvc\" type=\"tel\" aria-label=\"CVC\" placeholder=\"CVC\" aria-invalid=\"false\" value=\"\"/></span></div><div class=\"FormFieldInput-Icon is-loaded\"><svg class=\"Icon Icon--md\" focusable=\"false\" viewBox=\"0 0 32 21\"><g fill=\"none\" fill-rule=\"evenodd\"><g class=\"Icon-fill\"><g transform=\"translate(0 2)\"><path d=\"M21.68 0H2c-.92 0-2 1.06-2 2v15c0 .94 1.08 2 2 2h25c.92 0 2-1.06 2-2V9.47a5.98 5.98 0 0 1-3 1.45V11c0 .66-.36 1-1 1H3c-.64 0-1-.34-1-1v-1c0-.66.36-1 1-1h17.53a5.98 5.98 0 0 1 1.15-9z\" opacity=\".2\"/><path d=\"M19.34 3H0v3h19.08a6.04 6.04 0 0 1 .26-3z\" opacity=\".3\"/></g><g transform=\"translate(18)\"><path d=\"M7 14A7 7 0 1 1 7 0a7 7 0 0 1 0 14zM4.22 4.1h-.79l-1.93.98v1l1.53-.8V9.9h1.2V4.1zm2.3.8c.57 0 .97.32.97.78 0 .5-.47.85-1.15.85h-.3v.85h.36c.72 0 1.21.36 1.21.88 0 .5-.48.84-1.16.84-.5 0-1-.16-1.52-.47v1c.56.24 1.12.37 1.67.37 1.31 0 2.21-.67 2.21-1.64 0-.68-.42-1.23-1.12-1.45.6-.2.99-.73.99-1.33C8.68 4.64 7.85 4 6.65 4a4 4 0 0 0-1.57.34v.98c.48-.27.97-.42 1.44-.42zm4.32 2.18c.73 0 1.24.43 1.24.99 0 .59-.51 1-1.24 1-.44 0-.9-.14-1.37-.43v1.03c.49.22.99.33 1.48.33.26 0 .5-.04.73-.1.52-.85.82-1.83.82-2.88l-.02-.42a2.3 2.3 0 0 0-1.23-.32c-.18 0-.37.01-.57.04v-1.3h1.44a5.62 5.62 0 0 0-.46-.92H9.64v3.15c.4-.1.8-.17 1.2-.17z\"/></g></g></g></svg></div></div></div><div class=\"FormFieldGroup-child FormFieldGroup-child--width-12 FormFieldGroup-childLeft FormFieldGroup-childBottom\"><div class=\"FormFieldInput\"><div class=\"CheckoutInputContainer\"><span class=\"InputContainer\" data-max=\"\"><input class=\"CheckoutInput CheckoutInput--tabularnums Input\" autocorrect=\"off\" id=\"zip_code_card\" name=\"zip_code_card\" type=\"tel\" placeholder=\"Zip Code\"/></span></div></div></div><div style=\"opacity: 0; height: 0px;\"><span class=\"FieldError Text Text-color--red Text-fontSize--13\"><span aria-hidden=\"true\"/></span></div></div></fieldset></div></div></div>`;
    },
    _get_bank_form() {
        let showAchAccountType = customer.currentInvoiceObj.organization.region == 'US' ? true : false;
        return `<select class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"ACH account number\" id=\"bank_type\" > 
                    <option value=\"eft\">BANK (EFT)</option> 
                    <option value=\"ach\">BANK (ACH)</option> 
                </select>
                <select class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" id=\"ach_account_type\" style="${!showAchAccountType ? 'display: none' : ''}" >
                    <option value=\"\">Select an account type</option>
                    <option value=\"SAVINGS\">Savings</option>
                    <option value=\"CHECKING\">Checking</option> 
                    <option value=\"LOAN\">Loan</option> 
                </select>
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"First Name\" id=\"first_name\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Last Name\" id=\"last_name\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Account Number\" id=\"account_number\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Transit Number\" id=\"transit_number\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Routing Number\" id=\"routing_number\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Institution ID\" id=\"institution_id\"></input>
                                
                <select class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\"  id=\"ach_state\" style="${!showAchAccountType ? 'display: none' : ''}" >
                    <option value="">- Select State -</option>
                </select>
                
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"City\" id=\"city\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Street\" id=\"street\"></input> 
                <input class=\"CheckoutInput CheckoutInput--tabularnums Input Input--empty\" placeholder=\"Postal Code\" id=\"postal_code\"></input>`;
    },  
    roundToTwoDecimals: (value) => Math.round(parseFloat(value) * 100) / 100,  
    calculateTotal: function () {

        if (customer.currentInvoiceObj) {

            customer.formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            if(customer.currentInvoiceObj.status === 'P') {
                const total = customer.roundToTwoDecimals(customer.currentInvoiceObj.payments[0].total_amount);
                const totalFormat = customer.formatter.format(total);
                const fee = customer.roundToTwoDecimals(customer.currentInvoiceObj.payments[0].fee);
                const feeFormat = customer.formatter.format(fee);
                $("#invoice-amount-post-payment, #total_invoice").text(totalFormat);
                $(".calculated-fee").text(feeFormat);
                return;
            }
            
            const { total_amount } = customer.currentInvoiceObj;
            let finalTotal = 0;
            let fee = 0;

            
            if (customer.currentInvoiceObj.cover_fee == '1') {

                const tpl = customer.payment_processor.pricing_tpl;
                const paymentMethod = customer.payment_form_selected;

                let kte = 0;
                let percent = 0;

                if (paymentMethod === 'cc') {
                    kte = tpl.kte_cc;
                    percent = tpl.var_cc;
                } else if (paymentMethod === 'ach') {
                    kte = tpl.kte_bnk;
                    percent = tpl.var_bnk;
                } else if (paymentMethod === 'cc_amex') {
                    kte = tpl.kte_cc_amex;
                    percent = tpl.var_cc_amex;
                }

                const baseTotal = customer.roundToTwoDecimals(total_amount);
                finalTotal = (baseTotal + kte) / (1 - percent);
                fee = finalTotal - baseTotal;

            } else {
                finalTotal = total_amount;
                fee = 0;
            }

            finalTotal = customer.roundToTwoDecimals(finalTotal);

            customer.total_amount = customer.formatter.format(finalTotal);
            customer.total_amount_float = finalTotal;

            customer.fee = customer.formatter.format(fee);
        }

        $("#invoice_total, #total_invoice, #invoice-amount-post-payment").text(customer.total_amount);
        $(".calculated-fee").text(customer.fee);
        $(customer.payButton).text(`Pay ${customer.total_amount}`);
    },
    load_invoice: async function () {
        try {
            var invoice = await fetch(customer.base_api + 'invoice/' + customer.invoice.hash);
            var data = await invoice.json();

            customer.payment_processor = data.response.payment_processor;
            customer.orgnx_id = data.response.invoice.church_id;
            customer.customer_hub_url = data.response.customer_hub_url;

            $('#customer_hub_link').attr('href', data.response.customer_hub_url);
            
            if (data.response.invoice == null) {
                $('#panel').hide();
                $('#general_error_msg').text('Invoice not found');
                $('#general_error').fadeIn();
                return false;
            }

            if (data.response.invoice.status === 'C') { //verifyx use constants here
                $('#panel').hide();
                $('#general_error_msg').text('Invoice canceled');
                $('#general_error').fadeIn();
                return false;
            }

            customer.currentInvoiceObj = data.response.invoice;
            customer.options.environment = data.response.payment_processor.env;
            
            customer.calculateTotal(customer.currentInvoiceObj.total_amount);

            customer.apiKey = data.response.payment_processor.encoded_keys;
            if (data.response.invoice.status === 'P') { //verifyx use constants here
                $("#form_payment").hide();
                customer.load_paid({...data.response.invoice, element: '#form_details'});
                return false;
            }

            if (data.response) {
                //const sum = data.response.invoice.products.map((s)=> parseFloat(s.price*s.quantity).toFixed(2)).reduce((a,e)=>parseInt(a)+parseInt(e), 0) ;
                // $("#form_details, #form_payment").css({"display":"block",'margin:':' 0 auto;!important'})

                if (customer.payment_processor.code === 'PSF') {
                    tabs = customer._get_payments_tab(data.response.invoice.payment_options);

                    if (tabs) {
                        $("#payment-options").html(tabs.tabs);
                    }
                    if (tabs.cc && tabs.bank) {
                        $("#ach-tab-panel").hide();
                    } else if (!tabs.cc && tabs.bank) {
                        $("#ach-tab-panel").show();
                        setTimeout(() => {

                        })
                    }

                    if (tabs.cc) {
                        $("#card-tab-panel").html(tabs.cc);
                    }
                    if (tabs.bank) {
                        $("#ach-tab-panel").html(tabs.bank);
                    }
                } else if (customer.payment_processor.code === 'FTS') {
                    //create  a spinner on innerHTML
                    document.getElementById('fts-payment-options').innerHTML = '<span id="spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="display: none;"></span>';
                    //display container
                    document.getElementById('fts-payment-options').style.display = 'block';
                    //document.getElementById('payment-options').innerHTML = '';
                }

                $("#invoice_due_date").html(data.response.invoice.due_date ? "Due " + moment(data.response.invoice.due_date).format('LL') : '&nbsp;');
                $("#Invoice-downloadButton").on("click", function () {
                    window.location = data.response.invoice.pdf_url;
                });

                const businessName = data.response.invoice.customer.business_name ? data.response.invoice.customer.business_name + ' ' : '';
                const customerName = `${data.response.invoice.customer.first_name} ${data.response.invoice.customer.last_name}`;
                
                if(businessName) {
                    $("#business_name").text(businessName);
                    $("#business_name_cont").show();
                } else {
                    $("#business_name_cont").hide();
                }  
                $("#customer_name").text(customerName);

                $(".customer_memo").text(data.response.invoice.memo ? data.response.invoice.memo : '-');
                $("#orgSub_name").html((data.response.invoice.suborganization) ? data.response.invoice.organization.name + '<br>' + data.response.invoice.suborganization.name : data.response.invoice.organization.name);
                $("#invoice_").html(data.response.invoice.reference);
                if (data.response.invoice.products.length !== 0) {
                    if (customer.currentInvoiceObj.cover_fee) {
                        $("#detail").after(`                        
                            <tr>
                                <td></td>
                            </tr>
                            <tr>                            
                                <td  style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; ">
                                    <span class="product-name">
                                    Subtotal
                                    </span>
                                </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;">
                                    <span class="span-amount">                                    
                                    ${customer.formatter.format(customer.currentInvoiceObj.total_amount)} 
                                    </span>
                                </td>                               
                            </tr>                            
                            <tr>
                                <td  style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; ">
                                    <span class="product-name">
                                    Processing Fee
                                    </span>
                                </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;">
                                    <span class="span-amount calculated-fee">                                    
                                    $0.00
                                    </span>
                                </td>                               
                            </tr>
                        `)
                    }

                    data.response.invoice.products.forEach(element => {
                        $("#detail").after(`
                            <tr>
                                <td  style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; ">
                                    <span class="product-name">
                                    ${element.product_inv_name}
                                    </span><br>
                                    <span class="product-qty">
                                    Qty ${element.quantity}
                                    </span>
                                </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; ">
                                    <span class="span-amount">
                                        ${customer.formatter.format(element.product_inv_price)} 
                                    </span>
                                </td>                               
                            </tr>
                        `)
                    });
                }

                customer.region = data.response.invoice.organization.region;//='EU'
                if (data.response.invoice.organization.region === 'CA') {
                    $('#bank_type option[value="eft"]').attr("selected", true);
                    $('#bank_type').attr('disabled', 'disabled');
                    $("#routing_number").css("display", "none");
                    $("#institution_id").css("display", "block");
                    $("#transit_number").css("display", "block");
                } else {
                    $('#bank_type option[value="ach"]').attr("selected", true);
                    $('#bank_type').attr('disabled', 'disabled');
                    $('#institution_id').css("display", "none");
                    $('#transit_number').css("display", "none");
                    $('#routing_number').css("display", "block");

                    $.each(states_us, function (value, text) {
                        $('#ach_state').append($('<option>', {value: value, text: text}));
                    });
                }
            }
        } catch (e) {
            loader('hide')
            throw e;
        }
    },
    load_paid(obj = {}) {
        $(obj.element).html(`
        <div class="App-contents flex-container spacing-16 direction-column width-12 mt-4 mx-2">
        <div class="flex-item width-auto">
        <div class="row">
        <div class="col-lg-4"></div>
        <div class="col-lg-4">
        <div class="ContentCard">
            <div class="InvoiceSummary pt-3 pb-3">
                <div class="InvoiceSummaryPostPayment flex-container direction-column align-items-center" data-testid="invoice-summary-post-payment">
                    <div class="text-center mb-2">
                        <img src="${base_assets + 'images/tick.png'}" width=\"100\"  class=\"Icon Icon--md\">
                    </div>
                    <span class="Text-fontSize--16">Invoice Paid</span>
                    
                    <span class="mt-3" style="${!customer.currentInvoiceObj.payments[0].receipt_file_uri_hash ? 'display:none' : ''}">
                        <a href="${customer.currentInvoiceObj.payments[0]._receipt_file_url}" class="due_date italic"> 
                            Download Receipt 
                            <i class="fas fa-arrow-down due_date ml-1" style="font-weight: 500"></i>
                        </a>                                                    
                    </span>                    

                    <div class="flex-container align-items-center gray_label mt-3"> 
                        <svg class="InlineSVG Icon Button-Icon Button-Icon--right Icon--sm Icon--square" focusable="false" fill-opacity="1" fill="currentColor" width="12" height="12" viewBox="0 0 5 8">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M0.146582 1.20432C-0.0488607 1.00888 -0.0488607 0.692001 0.146582 0.496558C0.342025 0.301115 0.6589 0.301115 0.854343 0.496558L4.00421 3.64642C4.19947 3.84168 4.19947 4.15827 4.00421 4.35353L0.854343 7.50339C0.6589 7.69884 0.342025 7.69884 0.146582 7.50339C-0.0488607 7.30795 -0.0488607 6.99108 0.146582 6.79563L2.94224 3.99998L0.146582 1.20432Z"></path>
                        </svg>                               
                        <a href="${customer.customer_hub_url}" class="due_date italic">                                     
                            Manage billing
                        </a>
                    </div>

                    <strong class="InvoiceSummaryPostPaymentAmount font-bold mt-4" id="invoice-amount-post-payment">[$0.00]</strong>                                        
                    <div   id="collapsibleDetails" style="width:100%">
                        <table cellpadding="0" cellspacing="0" style="width: 100%;" id="product_details">
                        <tbody>
                            <tr>
                                <td height="26" style="border: 0; margin: 0; padding: 0; font-size: 1px; line-height: 1px; max-height: 1px; mso-line-height-rule: exactly;">
                                    <div class="st-Spacer st-Spacer--filler">&nbsp;</div>
                                </td>
                            </tr>
                            ${obj.products.reduce((updated, latest) => updated.concat(`<tr>
                                    <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp;</td>
                                    <td style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; "> 
                                        <span class="product-name">
                                            ${latest.product_inv_name}
                                        </span><br>
                                        <span class="product-qty">
                                            Qty ${latest.quantity}
                                        </span>
                                        <span><br>
                                            ${latest.digital_content ? '<a class="product_file"  href="' + latest.digital_content_url + '">Download Deliverable</a>' : ''}
                                        </span>
                                    </td>
                                    <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; min-width: 16px; width: 16px; font-size: 1px; "></td>
                                    <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; "> 
                                        <span style=" font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; text-decoration: none; color: #1A1A1A; font-size: 14px; line-height: 16px; font-weight: 500; white-space: nowrap; ">
                                            ${customer.formatter.format(latest.product_inv_price)}
                                        </span> 
                                    </td>
                                    <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp;</td></tr>
                            `), '')}
                            <tr style="${customer.currentInvoiceObj.cover_fee ? '' : 'display:none'}">
                                <td>&nbsp;</td>
                            </tr>
                            <tr style="${customer.currentInvoiceObj.cover_fee ? '' : 'display:none'}">
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">
                                &nbsp;
                                </td>
                                <td style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; "> 
                                    <span class="product-name">
                                        Subtotal
                                    </span>
                                </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; min-width: 16px; width: 16px; font-size: 1px; "></td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; "> 
                                    <span style=" font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; text-decoration: none; color: #1A1A1A; font-size: 14px; line-height: 16px; font-weight: 500; white-space: nowrap; ">
                                        ${customer.formatter.format(customer.currentInvoiceObj.total_amount)}
                                    </span> 
                                </td>
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp;</td>
                            </tr>
                            <tr style="${customer.currentInvoiceObj.cover_fee ? '' : 'display:none'}">
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp;</td>
                                <td style=" border: 0;border-collapse: collapse; margin: 0;padding: 0px 0px 10px 0px;width: 100%; "> 
                                    <span class="product-name">
                                        Processing Fee
                                    </span>
                                </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; min-width: 16px; width: 16px; font-size: 1px; "></td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; "> 
                                    <span class="calculated-fee" style=" font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; text-decoration: none; color: #1A1A1A; font-size: 14px; line-height: 16px; font-weight: 500; white-space: nowrap; ">
                                        $0.00
                                    </span> 
                                </td>
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp;</td>
                            </tr>                            
                            <tr>
                                <td height="26" style="border: 0; margin: 0; padding: 0; font-size: 1px; line-height: 1px; max-height: 1px; mso-line-height-rule: exactly;">
                                    <div class="st-Spacer st-Spacer--filler">&nbsp;</div>
                                </td>
                            </tr>
                            <tr>
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;min-width: 32px; width: 32px; font-size: 1px;">&nbsp; </td>
                                <td colspan="3" height="1" style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; height: 1px; font-size: 1px; background-color: #ebebeb; line-height: 1px;"></td>
                            </tr>
                            <tr>
                                <td colspan="3" height="16" style="border: 0;border-collapse: collapse;margin: 0;padding: 0;height: 16px;font-size: 1px;line-height: 1px;mso-line-height-rule: exactly; ">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; min-width: 32px; width: 32px; font-size: 1px; "></td>
                                <td colspan="2" style="border: 0;border-collapse: collapse;margin: 0;padding: 0;width: 100%;"> <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;text-decoration: none;color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500; word-break: break-word; ">
                                        Total
                                </span> </td>
                                <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; "> <span id="total_invoice" style=" font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; text-decoration: none; color: #1A1A1A; font-size: 14px; line-height: 16px; font-weight: 500; white-space: nowrap; ">
                                ${customer.total_amount}</span> </td>
                            </tr>
                            <tr ${!customer.currentInvoiceObj.show_post_purchase_link ? 'style="display:none;"' : ''}>
                                <td colspan="5">
                                <span class="text-center toFrom mt-1 Text-fontSize--12 mt-2" style="display: block">
                                    <u>
                                       <a href="${customer.currentInvoiceObj.post_purchase_link}" target="_blank" class="button"> Post Purchase Link <i class="fa fa-external-link"></i></a>                            
                                    </u>
                                </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="border: 0;border-collapse: collapse;margin: 0;padding: 0;height: 1px;font-size: 1px;line-height: 1px;mso-line-height-rule: exactly; "></td>
                                
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="App-InvoiceDetails flex-item width-grow flex-container direction-column">
                <table class="InvoiceDetails-table">
                    <tbody>
                    <tr class="LabeledTableRow LabeledTableRow--wide">
                        <td style="vertical-align: top; width: 1px; white-space: nowrap;"><span class="Text-fontSize--16">Invoice Reference</span></td>
                        <td style="vertical-align: top; text-align: right;"><span class="Text Text-color--default Text-fontSize--16">${obj.reference}</span></td>
                    </tr>
                    <tr class="LabeledTableRow LabeledTableRow--wide">
                       <!-- <td style="vertical-align: top; width: 1px; white-space: nowrap;"><span class="Text Text-color--gray400 Text-fontSize--16">Due Date</span></td>
                        <td style="vertical-align: top; text-align: right;"><span class="Text Text-color--default Text-fontSize--16">${moment(obj.paid_date).format('L')}</span></td> -->
                    </tr>
                    </tbody>
                </table>
            </div>
            </div>
            </div>
         </div>  
         </div>                                    
        </div>
        `);
        
        customer.calculateTotal();
    },
    adjustPaymentMethodAndNotify : (newMethod, message) => {
        const oldTotalAmount = $('#invoice_total').html();            
        
        $(`.payment-selector .option-container[type="${newMethod}"]`).click(); //it calls to customer.payment_processor_init();
        customer.calculateTotal();
        const newTotalAmount = $('#invoice_total').html();
        
        info_message_custom_html(`
            <div style="text-align:justify" style="font-size: .875rem">
                ${message}
                <br><br>
                The previous amount was <strong>${oldTotalAmount}</strong>, the new amount is <strong>${newTotalAmount}</strong>.
                <br><br>
                Please re-enter your payment information.
            </div>
        `);
    },
    elementsEventsSet: false,
    ftsElements:null,
    payment_processor_init: async function () {
        if (customer.payment_processor.code === 'FTS') {

            if(customer.currentInvoiceObj.status === 'P') {
                return;
            }

            const ftsWrapper = document.getElementById('fts-wrapper')
            const ftsAfterPaymentLoader = document.getElementById('fts-after-payment-loader')
            const manageBillingLinkSection = document.getElementById('manage_billing_section')
            const payButton = document.getElementById('pay-button');
            payButton.disabled = true;

            document.getElementById('fts-payment-options').innerHTML = 'Loading <i class="fas fa-circle-notch fa-spin"></i>'

            customer.calculateTotal();

            const paymentMethod = customer.payment_form_selected;

            let intentionData = null;
            if (paymentMethod === 'cc' || paymentMethod === 'cc_amex') {
                //we use the ticket intention flow to determine the bin of the card
                const ticketIntention = await fetch(customer.base_api + 'pay/create_fortis_ticket_intention/' + customer.orgnx_id, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                intentionData = await ticketIntention.json()
            } else {
                const transactionData = {
                    amount: customer.total_amount_float,
                    action: "sale",
                    save_source: false,
                    payment_method: paymentMethod
                };

                const transactionIntention = await fetch(customer.base_api + 'pay/create_fortis_transaction_intention/' + customer.orgnx_id, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transactionData)
                });

                intentionData = await transactionIntention.json()
            }

            if (intentionData.error === 1) {
                document.getElementById('fts-payment-options').innerHTML = 'Payment gateway not ready';
                alert('Payment gateway not ready: ' + intentionData.response.message);
                throw new Error(intentionData.response.message);
            }

            const token = intentionData.response.result.client_token;
            
            try {

                customer.ftsElements = new Commerce.elements(token); //important it must be var, to reinitialize the elements completely

                payButton.disabled = false;

            
                if (!customer.elementsEventsSet) {
                    customer.elementsEventsSet = true;
                    
                    customer.ftsElements.on('validationError', function (event) {
                        console.log('validationError')
                        ftsWrapper.style.height = 'auto';
                        payButton.disabled = false;
                        payButton.innerHTML = 'Pay ' + (customer.total_amount);
                    });

                    customer.ftsElements.on('error', function (event) {
                        console.log('error')
                        ftsWrapper.style.height = 'auto';
                        payButton.disabled = false;
                        payButton.innerHTML = 'Pay ' + (customer.total_amount);
                    });

                    const submitHandler = function (e) {
                        e.preventDefault();

                        payButton.disabled = true;
                        payButton.innerHTML = 'Processing <i class="fa fa-spinner fa-pulse text-light"></i>';
                        customer.ftsElements.submit();
                    };

                    customer.ftsElements.on('ready', function () {

                        payButton.removeEventListener('click', submitHandler);
                        payButton.addEventListener('click', submitHandler);
                    });

                    customer.ftsElements.on('submitted', function (event) {
                        console.log('fts-submitted')
                    });

                    customer.ftsElements.on('done', async function (e) {

                        const action = e?.data?.['@action'] ?? null;
                        
                        if (!action) {
                            alert('An error ocurred after processing the payment | done event');
                            return false;
                        } 

                        const payment_method = e?.data?.payment_method ?? null;
                        
                        let bin = null
                        if (action === 'ticket' || (action === 'tokenization' && payment_method === 'cc')) { //when tokenization the payment_method param will be there cc
                            bin = e.data.first_six;
                            const paymentMethod = customer.payment_form_selected;
                            const isAmex = bin.startsWith('34') || bin.startsWith('37');
                            
                            if (isAmex && paymentMethod !== 'cc_amex') {
                                customer.adjustPaymentMethodAndNotify('cc_amex',  //switch to amex
                                    'An American Express card number has been provided, but a different payment method was selected. The total amount has been adjusted automatically to reflect the correct fees.');
                                return;
                            } else if (!isAmex && paymentMethod === 'cc_amex') {
                                customer.adjustPaymentMethodAndNotify('cc', //switch to a standard card
                                    'An American Express payment method was selected, but a different card brand was used. The total amount has been adjusted automatically to reflect the correct fees.');
                                return;
                            }
                        }
                        
                        payButton.disabled = true;
                        payButton.innerHTML = 'Payment successful <i class="fa fa-check"></i>'; //verifyx when ticket the payment is done on backend                                        
                        ftsAfterPaymentLoader.style.display = 'block'; //show loader
                        manageBillingLinkSection.style.display = 'none';

                        $("#form_payment").hide();

                        const data = {
                            fts_event: e,
                            payment_processor: customer.payment_processor.code,
                            payment_method_selected: customer.payment_form_selected
                        }
                        try {
                            const rawResponse = await fetch(customer.base_api + 'pay/invoice/' + customer.invoice.hash, {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(data)
                            });
                            
                            ftsAfterPaymentLoader.style.display = 'none'; 
                            
                            const content = await rawResponse.json();                        
                            if (rawResponse.status == 200) {                            
                                if (content.error === 1) {                                   
                                    $("#fts-wrapper").hide();
                                    $('#fts-errors').text(content.response.errors.join("\n")).show();
                                    //$(customer.payButton).html('Pay ' + customer.total_amount)
                                    
                                } else {                                                     
                                    customer.currentInvoiceObj = content.response.invoice;
                                    customer.load_paid({...customer.currentInvoiceObj, element: '#form_details'});
                                }
                            } else {                         
                                $("#fts-wrapper").hide();
                                $('#fts-errors').text("Error try it again later...").show();                               
                                
                            }
                        } catch (e) {
                            throw e;
                        }
                    });
                }
                customer.ftsElements.create({
                    container: '#fts-payment-options',
                    environment: customer.options.environment === 'LIVE' ? 'production' : 'sandbox',
                    theme: 'default',
                    hideTotal: true,
                    showReceipt: false,
                    showSubmitButton: false,
                    //floatingLabels: false,
                    appearance: {
                        colorButtonSelectedBackground: customer.theme.background_color,
                        colorButtonText: customer.theme.text_color,
                        colorButtonBackground: '#9b9b9b',
                        fontSize: '0.82em',
                    },

                });
               
            } catch (error) {
                alert(error.message);
            }

        } else if (customer.payment_processor.code === 'PSF') {
            paysafe.fields.setup(customer.apiKey, customer.options, function (instance, error) {
                if (error) {
                    return false;
                }
                var $form = $(customer.payForm);
                var payButton = $(customer.payButton);

                instance.fields("cvv cardNumber expiryDate").valid(function (eventInstance, event) {
                    $(event.target.containerElement).closest('.form-control').removeClass('error').addClass('success');
                });
                instance.fields("cvv cardNumber expiryDate").invalid(function (eventInstance, event) {
                    $(event.target.containerElement).closest('.form-control').removeClass('success').addClass('error');
                });
                instance.fields.cardNumber.on("FieldValueChange", function (instance, event) {
                    if (!event.data.isEmpty) { //completar
                        var cardBrand = event.data.cardBrand.replace(/\s+/g, '');
                        cardBrand = null; //disabling it, we need better icons
                        switch (cardBrand) {
                            case "AmericanExpress":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-amex');
                                break;
                            case "MasterCard":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-mastercard');
                                break;
                            case "Visa":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-visa');
                                break;
                            case "Diners":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-diners-club');
                                break;
                            case "JCB":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-jcb');
                                break;
                            case "Maestro":
                                $(this).parents('form').find(".cc_can_change").removeClass('fa-credit-card').addClass('fa-cc-discover');
                                break;
                        }
                    } else {
                        $(this).parents('form').find(".cc_can_change").removeClass().addClass('fa fa-credit-card');
                    }
                });
                payButton.bind("click", async function (event) {
                    event.preventDefault();
                    if (customer.is_submited) {
                        return false;
                    }
                    customer.is_submited = true;
                    if (customer.payment_type === 'cc') {
                        instance.tokenize(null, async function (instance, error, result) {
                            if (error || $("#zip_code_card").val() == '') {
                                customer.is_submited = false;
                                console.log(error)
                                if ($("#zip_code_card").val() == '') {
                                    $('.payment-errors').text("Enter a valid ZipCode");
                                    $('.payment-errors').closest('.row').show();
                                    return;
                                }
                                $(customer.payButton).html('Try again').prop('disabled', false);
                                $('.payment-errors').text(error.displayMessage);
                                $('.payment-errors').closest('.row').show();
                            } else {
                                $(customer.payButton).html('Processing <i class="fa fa-spinner fa-pulse text-light"></i>');
                                $('.payment-errors').closest('.row').hide();
                                $('.payment-errors').text("");
                                try {
                                    const rawResponse = await fetch(customer.base_api + 'pay/invoice/' + customer.invoice.hash, {
                                        method: 'POST',
                                        headers: {
                                            'Accept': 'application/json',
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(
                                            {
                                                "payment_method": "credit_card",
                                                "data_payment": {
                                                    "postal_code": $("#zip_code_card").val(),
                                                    "single_use_token": result.token
                                                },
                                                csrf_token: $("[name='csrf_token']").val()
                                            }
                                        )
                                    });
                                    const content = await rawResponse.json();
                                    if (content.error === 1) {
                                        $('.payment-errors').text(content.response.errors.join("\n"));
                                        $('.payment-errors').closest('.row').show();
                                        customer.is_submited = false;
                                        setTimeout(function () {
                                            $(customer.payButton).html('Pay ' + (customer.total_amount));
                                            $(customer.payButton).prop('disabled', false);
                                        }, 2000)
                                    } else {
                                        $(customer.payButton).html('Payment successful <i class="fa fa-check"></i>');
                                        $(customer.payButton).prop('disabled', true);
                                        $("#form_payment").hide();
                                        customer.currentInvoiceObj = content.response.invoice;
                                        customer.load_paid({...customer.currentInvoiceObj, element: '#form_details'});
                                    }

                                } catch (e) {
                                    $(customer.payButton).html('Error... Try it again later...');
                                    customer.is_submited = false;
                                    setTimeout(function () {
                                        $(customer.payButton).html('Pay ' + customer.total_amount)
                                    }, 2000);
                                    $(customer.payButton).prop('disabled', false);
                                    throw e;
                                }
                            }
                        });
                    } else {
                        var data = {
                            "payment_method": "bank_account"
                        };
                        if (customer.region === 'CA') {
                            data.data_payment = {
                                "bank_type": "eft",
                                "first_name": $("#first_name").val(),
                                "last_name": $("#last_name").val(),
                                "account_number": $("#account_number").val(),
                                "transit_number": $("#transit_number").val(),
                                "institution_id": $("#institution_id").val(),
                                "country": "CA",
                                "city": $("#city").val(),
                                "street": $("#street").val(),
                                "postal_code": $("#postal_code").val()
                            }
                        } else {
                            data.data_payment = {
                                "bank_type": "ach",
                                "account_type": $("#ach_account_type").val(),
                                "first_name": $("#first_name").val(),
                                "last_name": $("#last_name").val(),
                                "account_number": $("#account_number").val(),
                                "routing_number": $("#routing_number").val(),
                                "country": "US",
                                "state": $("#ach_state").val(),
                                "city": $("#city").val(),
                                "street": $("#street").val(),
                                "postal_code": $("#postal_code").val()
                            }
                        }
                        /*for (var key in data.data_payment) {
                            if(data.data_payment[key] == ''){
                                $('.payment-errors').text("There are missing fields, try again");
                                $('.payment-errors').closest('.row').show();
                                return;
                            }
                        }*/

                        $('.payment-errors').closest('.row').hide();
                        $('.payment-errors').text("");
                        // data.csrf_token = $("[name='csrf_token']").val();
                        try {
                            $(customer.payButton).html('Processing <i class="fa fa-spinner fa-pulse text-light"></i>');
                            const rawResponse = await fetch(customer.base_api + 'pay/invoice/' + customer.invoice.hash, {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(data)
                            });
                            const content = await rawResponse.json();
                            if (rawResponse.status == 200) {
                                // console.log(content);
                                if (content.error === 1) {
                                    customer.is_submited = false;
                                    $('.payment-errors').text(content.response.errors.join("\n"));
                                    $('.payment-errors').closest('.row').show();

                                    $(customer.payButton).html('Pay ' + customer.total_amount)
                                    return;
                                } else {

                                    $(customer.payButton).html('Payment successful <i class="fa fa-check"></i>');
                                    $(customer.payButton).prop('disabled', true);

                                    $("#form_payment").hide();
                                    customer.currentInvoiceObj = content.response.invoice;
                                    customer.load_paid({...customer.currentInvoiceObj, element: '#form_details'});
                                }
                            } else {
                                customer.is_submited = false;
                                $('.payment-errors').text("Error try it again later...");
                                $(customer.payButton).html('Pay ' + customer.total_amount)
                                $('.payment-errors').closest('.row').show();
                                throw rawResponse.status
                            }
                        } catch (e) {
                            throw e;
                            customer.is_submited = false;
                        }
                    }
                });
            });
        }
    },
    load_events: async function () {
        $(document).on('click', '.payment-selector .option-container',  function (event, customData) {
            
            $('.payment-selector .option-container').removeClass('is-selected');
            $(this).hide().fadeIn('slow').addClass('is-selected');
            let type = $(this).attr('type');
            customer.payment_form_selected = type;

            if (customData === 'dont_init_payment_processor') {
                //do nothing, the first time the processor is initialized from the ready function
            } else {
                customer.payment_processor_init(); 
            }
        });

        $('.payment-selector .option-container[type="cc"]').trigger('click', ['dont_init_payment_processor']);

        $('#card-tab').addClass('Tabs-TabListItem--is-selected');
        $('#card-tab-panel').css('display', 'block');

        let tpl = customer.currentInvoiceObj.organization.fees_template;
        let total_amount = customer.currentInvoiceObj.total_amount + customer.currentInvoiceObj.fee;
        customer.payment_type = 'cc';
        $("#card-tab").on('click', function () {
            customer.payment_type = 'cc';
            $(this).addClass('Tabs-TabListItem--is-selected');
            $('#ach-tab').removeClass('Tabs-TabListItem--is-selected');
            $('#eft-tab').removeClass('Tabs-TabListItem--is-selected');
            $('#card-tab-panel').css('display', 'block');
            $('#ach-tab-panel').css('display', 'none');
            $('#eft-tab-panel').css('display', 'none');

        });
        $("#ach-tab").on('click', function () {
            customer.payment_type = 'ach';
            $(this).addClass('Tabs-TabListItem--is-selected');
            $('#card-tab').removeClass('Tabs-TabListItem--is-selected');
            $('#eft-tab').removeClass('Tabs-TabListItem--is-selected');
            $('#card-tab-panel').css('display', 'none');
            $('#ach-tab-panel').css('display', 'block');
            $('#eft-tab-panel').css('display', 'none');

        });
    },
    paymentFormReady: function () {
        if ($('#cardNumber').hasClass("success") &&
            $('#cardExpiry').hasClass("success") &&
            $('#cardCVC').hasClass("success")) {
            return true;
        } else {
            return false;
        }
    },
    loader: null,
    get_branding_data: async function () {
        await $.get(customer.base_api + 'organization/get_brand_settings/' + customer.currentInvoiceObj.church_id +
            (customer.currentInvoiceObj.campus_id ? '/' + customer.currentInvoiceObj.campus_id : ''), function (result) {
                if (result.response.data) {
                    if (result.response.data.logo) {
                        $('#invoice_logo').show();
                        $('#invoice_logo').attr('src', result.response.data.entire_logo_url);
                    } else {
                        $('#invoice_logo').hide();
                    }
                    
                    let theme_color = result.response.data.theme_color ? result.response.data.theme_color : '#000000';
                        let text_theme_color = helpers.getTextColor(theme_color);
                        customer.theme = { theme_color, text_theme_color };

                        let style = `
                    .theme_color{
                        background: ${theme_color} !important;
                    }.theme_foreground_color{
                        color: ${theme_color} !important;
                    }
                    .text_theme_color{
                        color: ${text_theme_color} !important;
                    }
                    .theme_background_color{
                        background: ${result.response.data.button_text_color ? result.response.data.button_text_color : '#F8F8F8'} !important;
                    }
                `;
                    $('#css_branding').html(style);
                }
            });
    },

};

let states_us = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AS": "American Samoa",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "AA": "Armed Forces Americas",
    "AE": "Armed Forces Europe",
    "AP": "Armed Forces Pacific",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "DC": "District of Columbia",
    "FL": "Florida",
    "GA": "Georgia",
    "GU": "Guam",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "MP": "Northern Mariana Is.",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PW": "Palau",
    "PA": "Pennsylvania",
    "PR": "Puerto Rico",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "VI": "U.S. Virgin Islands",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
};


