<?php

if (!class_exists('EmailProvider')) {
    require_once 'application/libraries/email/EmailProvider.php';
}

function sendDonationEmail($transactionData, $subscription = false, $fund_data) {

    $CI = & get_instance();

    $CI->load->model('user_model');
    $CI->load->model('organization_model');

    $churchId = $transactionData["church_id"];
    $fee      = $transactionData["fee"]; //>>> total
    $total    = $transactionData["total_amount"]; //>>> total
    $net      = $transactionData["sub_total_amount"]; //>>> net
    $to       = $transactionData["email"];

    $fundsHtml          = '';
    $fundsAndValuesHtml = '';
    if (is_array($fund_data)) { //multi fund paysafe
        $CI->load->model('fund_model');

        foreach ($fund_data as $fund) {
            //we can provide church_id and campus_id for forcing protection getting the fund
            $fundDb             = $CI->fund_model->get($fund['fund_id'], $transactionData['church_id'], $transactionData['campus_id']);
            $fundsHtml          .= $fundDb->name . ', ';
            $fundsAndValuesHtml .= '<p>' . $fundDb->name . ' $' . round($fund['_fund_sub_total_amount'], 2) . '</p>';
        }

        $fundsHtml = $fundsHtml ? substr($fundsHtml, 0, -2) : ''; //remove last two chars (coma and space)
    } else {  //an int expected, this is the old mono fund fow (for epicpay)
        $fund               = $CI->db->select('name')->where('id', $fund_data)->get('funds')->row();
        $fundsHtml          = $fund && $fund->name ? ucfirst(strtolower($fund->name)) : '-';
        $fundsAndValuesHtml = $fundsHtml;
    }


    $isAnonymous = $transactionData["account_donor_id"] === null ? true : false;
    $trxId       = $transactionData["trxId"];
    $church      = $CI->organization_model->get($churchId);
    $churchAdmin = $CI->user_model->get($church->client_id);
    $from        = $churchAdmin->email;

    if ($transactionData["giving_source"] == "events") {
        $tpl = file_get_contents("application/emails/eventEmailEpicPay.html");

        $event_data = json_decode($transactionData["event_data"]);

        $tpl = str_replace("mailamount", $net, $tpl);
        $tpl = str_replace("eventName", $event_data->event->name, $tpl);
        $tpl = str_replace("ChurchName", $church->church_name, $tpl);
        $tpl = str_replace("ChurchPhone", $church->phone_no, $tpl);
        $tpl = str_replace("ChurchWeb", $church->website, $tpl);
        $tpl = str_replace("idTheChurch", $churchId, $tpl);
        $tpl = str_replace("dateEvent", $event_data->event->start_date, $tpl);
        $tpl = str_replace("timeEvent", $event_data->event->start_time, $tpl);
        $tpl = str_replace("logoChurch", $church->logo, $tpl);
        $tpl = str_replace("dateTransaction", date('m/d/y'), $tpl);
        $tpl = str_replace("paymentReference", $trxId, $tpl);
        if ($isAnonymous) {
            $tpl = str_replace("btnText", 'Register Now', $tpl);
        } else {
            $tpl = str_replace("btnText", 'Manage My Donor Account', $tpl);
        }
        $subject = $church->church_name . " | Successful registration!";
    } else {
        $tpl = file_get_contents("application/views/themed/" . THEME . "/email/donation.html");
        $tpl = str_replace("mailamount", $net, $tpl);
        $tpl = str_replace("mailfee", $fee, $tpl);
        $tpl = str_replace("mailtotal", number_format($total, 2, '.', ',') , $tpl);
        $tpl = str_replace("_funds", $fundsHtml, $tpl);
        $tpl = str_replace("_xfunds&values", $fundsAndValuesHtml, $tpl); // using _x otherwise _funds would replace the funds & values in advance
        $tpl = str_replace("ChurchName", $church->church_name, $tpl);
        $tpl = str_replace("ChurchPhone", $church->phone_no, $tpl);
        $tpl = str_replace("ChurchTaxID", $church->tax_id, $tpl);
        $tpl = str_replace("ChurchWeb", $church->website, $tpl);
        $tpl = str_replace("idTheChurch", $churchId, $tpl);
        $tpl = str_replace("logoChurch", $church->logo, $tpl);
        $tpl = str_replace("dateTransaction", date('m/d/y'), $tpl);
        $tpl = str_replace("paymentReference", $trxId, $tpl);
        $tpl = str_replace("baseUrl", BASE_URL, $tpl);

        if ($subscription) {
            $tpl = str_replace("One Time Payment", "Recurrent Payment Since: " . $subscription["created_at"] . "<br>Frequency: $subscription[frequency]", $tpl);
        }

        if ($isAnonymous) {
            $tpl = str_replace("btnText", 'Register Now', $tpl);
        } else {
            $tpl = str_replace("btnText", 'Manage My Donor Account', $tpl);
        }
        $subject = $church->church_name . " | Thanks for your Donation!";
    }
    
    EmailProvider::getInstance()->sendEmail($from, $church->church_name, $to, $subject, $tpl);
}

//we send two kind email to customers: amount to pay and confirmation paid $type: pay/paid
function sendInvoiceEmail($invoiceFullData, $type = 'pay') {
    
    if (!$invoiceFullData) {
        throw new Exception('Invoice not found');
    }
    if (!$type) {
        throw new Exception('Type not found');
    }

    if (in_array($invoiceFullData->status, [Invoice_model::INVOICE_UNPAID_STATUS, Invoice_model::INVOICE_DUE_STATUS])) {
        //Go ahead perform the email send process
    } else {
        return ['status' => false, 'message' => langx('We can\'t send the invoice at this moment as its current state is: ' . $invoiceFullData->_status)];
    }

    $CI = & get_instance();

    $CI->load->model('chat_setting_model');

    $orgnxId      = $invoiceFullData->church_id;
    $coverFee     = $invoiceFullData->cover_fee;
    
    $total         = number_format($invoiceFullData->total_amount, 2, '.', ',');
    $fee           = number_format($invoiceFullData->fee, 2, '.', ',');
    $fee_when_amex = number_format($invoiceFullData->fee_when_amex, 2, '.', ',');
    $fee_when_ach  = number_format($invoiceFullData->fee_when_ach, 2, '.', ',');

    $totalWithFee = number_format($invoiceFullData->total_amount + $invoiceFullData->fee, 2, '.', ',');
    $totalAmexWithFee = number_format($invoiceFullData->total_amount + $invoiceFullData->fee_when_amex, 2, '.', ',');
    $totalAchWithFee = number_format($invoiceFullData->total_amount + $invoiceFullData->fee_when_ach, 2, '.', ',');

    $invoiceReference    = $invoiceFullData->reference;
    $invoiceDueDate    = date('F j, Y',strtotime($invoiceFullData->due_date));

    $memo         = $invoiceFullData->memo;
    $customerName = $invoiceFullData->customer->first_name . ' ' . $invoiceFullData->customer->last_name;
    $businessName = $invoiceFullData->customer->business_name;
    $to           = $invoiceFullData->customer->email;
    $paymentLink  = CUSTOMER_APP_BASE_URL . 'c/invoice/' . $invoiceFullData->hash;
    $products = $invoiceFullData->products;
    $products = json_decode(json_encode($products), true);
    $output='';
    foreach($products as $product) {
        $product_digital_content = '';
        if($type=='paid') {
            if ($product['digital_content']) {
                $product_digital_content = '<br><span><a style="color: #999999 !important;line-height: 14px" href="' . $product['digital_content_url'] . '">Download Deliverable</a></span>';
            }
        }
        $output .= '<tr style="padding-bottom: 5px;">
                <td style="padding:2px; border-bottom: #ededed solid 0.5px; border-collapse: collapse; margin: 0;width: 50%; ">
                    <span style="color: #1A1A1A;line-height: 16px; word-break: break-word;" >
                        '.$product['product_inv_name'].'
                    </span><br>
                    <span style="color: #999999;line-height: 30px;">
                        <small>
                            &nbsp;Qty '.$product['quantity'].'
                        </small>
                    </span>' . $product_digital_content . '
                </td>
                <td style="padding:8px; border-bottom: #ededed solid 0.5px;   border-collapse: collapse; margin: 0; text-align: right; vertical-align: top; width: 50%;">
                    <span style="color: #1A1A1A;line-height: 16px;">$'.$product['product_inv_price'].'</span>
                </td>
            </tr>';
    }
    $orgnx = $CI->organization_model->get($orgnxId);
    $orgnx_settings = $CI->chat_setting_model->getChatSettingByChurch($orgnxId,$invoiceFullData->campus_id);

    if($invoiceFullData->cover_fee){
        //SUBTOTAL
        $output .= '
            <tr style="padding-bottom: 5px;">
                <td style="padding:16px 2px; border-bottom: #ededed solid 0.5px; border-collapse: collapse; margin: 0; width: 50%;">
                    <span style="color: #1A1A1A;line-height: 16px;word-break: break-word;" >
                        Subtotal
                    </span>
                </td>
                    <td style="padding:16px 8px; border-bottom: #ededed solid 0.5px; border-collapse: collapse; margin: 0; text-align: right; vertical-align: top; width: 50%;">
                    <span style="color: #1A1A1A;line-height: 16px;">
                        <b>$'.$total.'</b>
                    </span>
                </td>
            </tr>';

        //PROCESSING FEE
        $output .= '
        <tr style="border-bottom: #ededed solid 0.5px;padding-bottom: 5px;">
            <td style="padding:8px; border-bottom: #ededed solid 0.5px; border-collapse: collapse; margin: 0;padding: 0;width: 50%;">
                <span style="color: #1A1A1A;line-height: 16px;word-break: break-word;" >
                    Processing Fee
                </span>
            </td>
            <td style="border-bottom: #ededed solid 0.5px; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top;padding:8px; width: 50%;">
                <span style="color: #1A1A1A; line-height:25px">
                    Regular card: $' . $fee . '<br>
                    Amex: $' . $fee_when_amex . '<br>
                    Ach: $' . $fee_when_ach . '<br>
                </span>
            </td>
        </tr>';
    }
    //We may still need use this in the future, (the dashboard user email)
    /*$CI->load->model('user_model');
    $churchAdmin = $CI->user_model->get($orgnx->client_id);
    $from        = $churchAdmin->email;
    */
        
    $org = $orgnx->church_name;
    
    $autoTextColor = getContrastColor($orgnx_settings->theme_color);
    $tpl = file_get_contents("application/views/themed/" . THEME . "/email/". ($type=='paid' ? "payment_done.html" : "invoice.html") );
    $tpl = str_replace("[OrgName]", $org, $tpl);
    $tpl = str_replace("[CustomerName]", $customerName, $tpl);
    $tpl = str_replace("[BusinessName]", $businessName ? $businessName : '-', $tpl);
    $tpl = str_replace("[CustomerEmail]", $to, $tpl);
    $tpl = str_replace("[ReferenceType]", 'Invoice', $tpl);
    $tpl = str_replace("[Reference]", $invoiceReference, $tpl);
    $tpl = str_replace("[coverFee]", $coverFee ? '' : 'display:none;', $tpl);
    $tpl = str_replace("[noCoverFee]", $coverFee ? 'display:none;' : '', $tpl);
    $tpl = str_replace("[Total]", $total, $tpl);
    $tpl = str_replace("[TotalRegular]", $totalWithFee, $tpl);
    $tpl = str_replace("[TotalAmex]", $totalAmexWithFee, $tpl);
    $tpl = str_replace("[TotalAch]", $totalAchWithFee, $tpl);
    $tpl = str_replace("[DueDate]", $invoiceDueDate, $tpl);
    $tpl = str_replace("[logoUrl]", BASE_URL . 'files/get/' . $orgnx_settings->logo , $tpl);
    $tpl = str_replace("[hasLogo]", $orgnx_settings->logo ? 'block' : 'none' , $tpl);
    $tpl = str_replace("[Memo]", $memo ? $memo : '-', $tpl);
    $tpl = str_replace("[CompanyName]", $orgnx->church_name, $tpl);
    $tpl = str_replace("[CompanySite]", COMPANY_SITE, $tpl);
    $tpl = str_replace("[PaymentLink]", $paymentLink, $tpl);
    $tpl = str_replace("ChurchPhone", $orgnx->phone_no, $tpl);
    $tpl = str_replace("ChurchTaxID", $orgnx->tax_id, $tpl);
    $tpl = str_replace("ChurchWeb", $orgnx->website, $tpl);
    $tpl = str_replace("idTheChurch", $orgnxId, $tpl);
    $tpl = str_replace("logoChurch", $orgnx->logo, $tpl);
    $tpl = str_replace("[products]", $output, $tpl);
    $tpl = str_replace("[ForeColor]", ' color: '.$orgnx_settings->theme_color.'; ', $tpl);
    $tpl = str_replace("[BackColor]", ' background-color: '.$orgnx_settings->button_text_color.'; ', $tpl);
    $tpl = str_replace("[ThemeColor]", ' background-color: '.$orgnx_settings->theme_color.'; ', $tpl);
    $tpl = str_replace("[AutoTextColor]", ' color: '.$autoTextColor.'; ', $tpl);

    $tpl = str_replace("[link_pdf]", $invoiceFullData->pdf_url, $tpl);

    $subject = '';
    
    if($type=='paid'){
        $tpl = str_replace("[DatePaid]", $invoiceFullData->datePaid, $tpl);
        $tpl = str_replace("[TransactionId]", $invoiceFullData->TransactionId, $tpl);        
        $tpl = str_replace("[ReceiptPdf]", $invoiceFullData->payments[0]->_receipt_file_url, $tpl);
        
        $subject = $orgnx->church_name . " | Invoice $invoiceReference Payment";
        
    } else {
        $subject = $orgnx->church_name . " | Invoice $invoiceReference";
    }

    $tpl = str_replace("[baseUrl]", CUSTOMER_APP_BASE_URL, $tpl);
    $tpl = str_replace("[baseAssets]", BASE_ASSETS, $tpl);

    $result = EmailProvider::getInstance()->sendEmail(null, $orgnx->church_name,$to, $subject, $tpl);

    if(isset($invoiceFullData->_cc) && $invoiceFullData->_cc){ //_cc isset when creating the invoice as optional, it is not set when performing the payment
        EmailProvider::getInstance()->sendEmail(null, $orgnx->church_name,$invoiceFullData->_cc, $subject, $tpl);
    }

    return $result['status'] === true ? ['status' => true, 'message' => langx('Invoice email sent')] : $result;
}


function sendPaymentLinkEmail($pLinkFullData) {

    $CI = & get_instance();

    $CI->load->model('chat_setting_model');

    $orgnxId          = $pLinkFullData->church_id;    
    $productsPaid         = $pLinkFullData->products_paid['data'];    
    $customerName     = $pLinkFullData->_customer->first_name . ' ' . $pLinkFullData->_customer->last_name;
    $to               = $pLinkFullData->_customer->email;    
    $total            = number_format($pLinkFullData->_total_amount, 2, '.', ',');
    $fee            = number_format($pLinkFullData->_fee, 2, '.', ',');
    $coverFee        = $pLinkFullData->_is_fee_covered;
    $productOutput           = '';
    
    foreach ($productsPaid as $row) {
        $product_digital_content = '';
        
        if ($row->digital_content) {
            $product_digital_content = '<br><span><a style="color: #999999 !important;font-size: 12px;line-height: 14px" href="' . $row->digital_content_url . '">Download Deliverable</a></span>';
        }

        // --- verifyx, refactor | do not use styling from here, just add classes and put the css on the view
        // --- we should send a clean table from here, and using classes only, 
        $productOutput .= '<tr style="border-bottom: #ededed solid 0.5px;padding-bottom: 5px;">
                <td style="border: 0;border-collapse: collapse; margin: 0;padding: 0;width: 50%; ">
                    <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;word-break: break-word;" >
                    ' . $row->product_name . '</span><br><span style="color: #999999;font-size: 12px;line-height: 14px;">
                    Qty ' . $row->qty_req . '</span>' . $product_digital_content . '</td>
                    <td style=" border: 0; border-collapse: collapse; margin: 0; padding: 0; text-align: right; vertical-align: top; ">
                    <span style="color: #1A1A1A;font-size: 14px;line-height: 16px;font-weight: 500;">$' . number_format($row->_sub_total, 2, '.', ',') . '</span>
                </td>
            </tr>';
    }
    $orgnx          = $CI->organization_model->get($orgnxId);
    $orgnx_settings = $CI->chat_setting_model->getChatSettingByChurch($orgnxId, $pLinkFullData->campus_id);
    
    $autoTextColor = getContrastColor($orgnx_settings->theme_color);
    $tpl           = file_get_contents("application/views/themed/" . THEME . "/email/" . "payment_done.html");
    $tpl           = str_replace("[OrgName]", $orgnx->church_name, $tpl);
    $tpl           = str_replace("[CustomerName]", $customerName, $tpl);
    $tpl           = str_replace("[CustomerEmail]", $to, $tpl);
    $tpl           = str_replace("[ReferenceType]", 'Payment', $tpl);
    $tpl           = str_replace("[Reference]", '#' . $pLinkFullData->_transaction_id, $tpl);
    $tpl           = str_replace("[Total]", $total, $tpl);    
    $tpl           = str_replace("[coverFee]", $coverFee ? '' : 'display:none;', $tpl);
    $tpl           = str_replace("[Fee]", $fee, $tpl);
    $tpl           = str_replace("[logoUrl]", BASE_URL . 'files/get/' . $orgnx_settings->logo, $tpl);
    $tpl           = str_replace("[hasLogo]", $orgnx_settings->logo ? 'block' : 'none', $tpl);    
    $tpl           = str_replace("[CompanyName]", $orgnx->church_name, $tpl);
    $tpl           = str_replace("[CompanySite]", COMPANY_SITE, $tpl);    
    $tpl           = str_replace("ChurchPhone", $orgnx->phone_no, $tpl);
    $tpl           = str_replace("ChurchTaxID", $orgnx->tax_id, $tpl);
    $tpl           = str_replace("ChurchWeb", $orgnx->website, $tpl);
    $tpl           = str_replace("idTheChurch", $orgnxId, $tpl);
    $tpl           = str_replace("logoChurch", $orgnx->logo, $tpl);
    $tpl           = str_replace("[products]", $productOutput, $tpl);
    $tpl           = str_replace("[ForeColor]", ' color: ' . $orgnx_settings->theme_color . '; ', $tpl);
    $tpl           = str_replace("[BackColor]", ' background-color: ' . $orgnx_settings->button_text_color . '; ', $tpl);
    $tpl           = str_replace("[ThemeColor]", ' background-color: ' . $orgnx_settings->theme_color . '; ', $tpl);
    $tpl           = str_replace("[AutoTextColor]", ' color: ' . $autoTextColor . '; ', $tpl);

    $tpl = str_replace("[DatePaid]", $pLinkFullData->_date_paid, $tpl);
    $tpl = str_replace("[TransactionId]", $pLinkFullData->_transaction_id, $tpl);
    
    $tpl = str_replace("[ReceiptPdf]", $pLinkFullData->payments[0]->_receipt_file_url, $tpl);
    
    $subject = $orgnx->church_name . " | Your payment was received (Ref. 000$pLinkFullData->_transaction_id)";

    $tpl = str_replace("[baseUrl]", CUSTOMER_APP_BASE_URL, $tpl);
    $tpl = str_replace("[baseAssets]", BASE_ASSETS, $tpl);

    $result = EmailProvider::getInstance()->sendEmail(null, $orgnx->church_name, $to, $subject, $tpl);

    return $result['status'] === true ? ['status' => true, 'message' => langx('Invoice email sent')] : $result;
}

//$type can hold 'invoice' or 'product' | $object can be $invoice or $product
function sendPaymentNotificationToAdmin($type, $object) {
    
   // die(print_r($object));
    if (!$object) {
        throw new Exception('Object not found');
    }
    if (!$type) {
        throw new Exception('Type not found');
    }

    if($type == 'invoice'){
            $invoiceFullData = $object;
            $CI = & get_instance();
            $CI->load->model('chat_setting_model');

            $orgnxId      = $invoiceFullData->church_id;
            $invoiceReference    = $invoiceFullData->reference;
            $datePaid    = date('F j, Y',strtotime($invoiceFullData->datePaid));
            $total       = number_format($invoiceFullData->total_amount + $invoiceFullData->fee, 2, '.', ',');
            $fee         = number_format($invoiceFullData->fee, 2, '.', ',');
            $coverFee    = $invoiceFullData->cover_fee ? 'Yes' : 'No';
            //$memo         = $invoiceFullData->memo;
            $customerName = $invoiceFullData->customer->first_name . ' ' . $invoiceFullData->customer->last_name;
            $businessName = $invoiceFullData->customer->business_name;
            $to           = $invoiceFullData->customer->email;
            $paymentLink  = CUSTOMER_APP_BASE_URL . 'c/invoice/' . $invoiceFullData->hash;
            $products = $invoiceFullData->products;
            
            $products = json_decode(json_encode($products), true);
            $_productsTable = '<table class="product-table"><tbody><tr><td>Name</td><td class="text-center">Qty</td><td class="text-right">Price</td>';
        foreach ($products as $product) {
            $_productsTable .= ""
                    . "<tr>"
                    . "<td>$product[product_name]</td><td class='text-center'>$product[quantity]</td><td class='text-right'>$" . number_format($product['product_inv_price'], 2, '.', ',') . "</td>"
                    . "</tr>";
        }
        
        if($invoiceFullData->cover_fee) {
            $_productsTable .= ""
                    . "<tr>"
                    . "<td>Subtotal</td><td class='text-center'></td><td class='text-right'>$" . number_format($invoiceFullData->total_amount, 2, '.', ',') . "</td>"
                    . "</tr>"
                    . "<tr>"
                    . "<td>Processing Fee</td><td class='text-center'></td><td class='text-right'>$" . number_format($invoiceFullData->fee, 2, '.', ',') . "</td>"
                    . "</tr>";
        }

        $_productsTable .= '</tbody></table>';

        $orgnx = $CI->organization_model->get($orgnxId);

        $tpl = file_get_contents("application/views/themed/" . THEME . "/email/invoice_admin.html");
        $tpl = str_replace("[BusinessName]", $businessName ? $businessName : '-', $tpl);
        $tpl = str_replace("[CustomerName]", $customerName, $tpl);
        $tpl = str_replace("[CustomerEmail]", $to, $tpl);
        $tpl = str_replace("[Reference]", $invoiceReference, $tpl);
        $tpl = str_replace("[Total]", $total, $tpl);                
        $tpl = str_replace("[CompanyName]", $orgnx->church_name, $tpl);
        $tpl = str_replace("[CompanySite]", COMPANY_SITE, $tpl);
        $tpl = str_replace("[PaymentLink]", $paymentLink, $tpl);
        $tpl = str_replace("[products]", $_productsTable, $tpl);
        $tpl = str_replace("[link_pdf]", $invoiceFullData->pdf_url, $tpl);
        $tpl = str_replace("[DatePaid]", $datePaid, $tpl);
        $tpl = str_replace("[coverFee]", $coverFee, $tpl);
        $tpl = str_replace("[fee]", $fee, $tpl);
        $tpl = str_replace("[TransactionId]", $invoiceFullData->TransactionId, $tpl);

        $subject = "Invoice $invoiceReference has been paid";

        $tpl = str_replace("[baseUrl]", CUSTOMER_APP_BASE_URL, $tpl);
        $tpl = str_replace("[baseAssets]", BASE_ASSETS, $tpl);
    }else if ($type == 'products'){
        //set products
    }

    $result = EmailProvider::getInstance()->sendEmail(null, $orgnx->church_name,$object->user_to, $subject, $tpl);    
    
    return $result['status'] === true ? ['status' => true, 'message' => langx('Invoice email sent')] : $result;

}

function shareReferalCode($data) {

        $CI = & get_instance();
        $CI->load->model('User_model');
        $code = $CI->User_model->get($data['user_id'],'referral_code');
        $referral_code = $code->referral_code;
        $tpl = file_get_contents("application/views/themed/" . THEME . "/email/share_referral_code.html");
        $tpl = str_replace("[full_name]", ucwords(trimLR_Duplicates($data['full_name'])), $tpl);
        $tpl = str_replace("[message]", $data['referal_message'], $tpl);
        $tpl = str_replace("[referal_link]", BASE_URL.'auth/register?ref='.$referral_code, $tpl);
        $tpl = str_replace("[CompanySite]", COMPANY_SITE, $tpl);
        
        $subject = $data['orgName']." Referral code";        
        
        $result = EmailProvider::getInstance()->sendEmail(null,$data['orgName'], $data['email'], $subject, $tpl);    
        return $result['status'] === true ? ['status' => true, 'message' => langx('share email sent')] : $result;
 
 }
 
