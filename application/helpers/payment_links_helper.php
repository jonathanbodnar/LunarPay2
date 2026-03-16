<?php

// --- We need to ensure the client sends products that belongs to the created payment link, and to quantities are available
// --- It will just throw an exception if it found some malicious or not well formed request
function PL_checkProductsIntegrity($paymentLink, $reqProducts) {
 $datenow = date('Y-m-d');
     foreach ($reqProducts as $reqProd) {
        $found              = false;
        $quantityCheck      = false;
        $datecustomCheck    = false;
        $daterecurrentCheck = false;
        foreach ($paymentLink->products as $linkProdOrigin) {
            if ($reqProd->link_product_id == $linkProdOrigin->id) { // --- product belongs
                $found = true;
                if ($reqProd->qty <= $linkProdOrigin->qty) { // --- we need to check the customer is not passing the max limit for that product on that payment link
                    $quantityCheck = true;
                }
                if ($linkProdOrigin->recurrence == Product_model::RECURRENCE_PERIODICALLY && $linkProdOrigin->start_subscription == 'E') {
                    if (isset($reqProd->start_date_input) && date("Y-m-d", strtotime($reqProd->start_date_input)) >= $datenow) {
                        $daterecurrentCheck = true;
                    } else if($paymentLink->trial_days && $paymentLink->trial_days > 0) {
                        $daterecurrentCheck = true;
                    }                   
                } else {
                    $daterecurrentCheck = true;
                }

                if ($linkProdOrigin->recurrence == Product_model::RECURRENCE_CUSTOM) { // It is checked that the first date of the custom product is not expired
                    $custom_date_arr = json_decode($linkProdOrigin->custom_date);
                    $datefirstcustom = date("Y-m-d", strtotime($custom_date_arr[0]->date));
                    if ($datefirstcustom >= $datenow) {
                        $datecustomCheck = true;
                    }
                } else {
                    $datecustomCheck = true;
                }
                break;
            }
        }
        if (!$found) {
            throw new Exception(langx('Products integrity checks not passed'));
        }

        if (!$quantityCheck) {
            throw new Exception(langx('Products quantity checks not passed'));
        }

        if (!$datecustomCheck) {
            throw new Exception(langx('This payment link has expired'));
        }

        if (!$daterecurrentCheck) {
            throw new Exception(langx('Invalid start date for product: '.$linkProdOrigin->product_name));
        }
    }
}

// --- Calculate the total amount using quantities send by the customer and include the origninal product data base
// --- $convertOneTime, to force convert subscriptions products on one time (this is done when finally generatin a payment from a subscription product)
function PL_recalcProductsWithRequest($reqProducts, $convertOneTime = false, $feeObject) {
    $CI                 = & get_instance();
    $CI->load->helper('fortis');
        
    $CI->load->model('payment_link_product_model');
    $totalAmount        = 0;
    $totalAmountOneTime = 0;

    $productsWithRequest = [];

    $countProductsOneTime = 0;
    
    foreach ($reqProducts as $reqProd) {
        $linkProdOrigin           = $CI->payment_link_product_model->get($reqProd->link_product_id);
        $linkProdOrigin->_qty_req = $reqProd->qty;

        $itemSubtotal = $linkProdOrigin->product_price * $reqProd->qty;

        if (isset($reqProd->start_date_input)) {
            $linkProdOrigin->start_date_input = $reqProd->start_date_input;
        }

        $productsWithRequest [] = $linkProdOrigin; //it asign the object as reference that's why if you update $linkProdOrigin later it will be updated in the array, if you don't like this use "clone"

        if ($linkProdOrigin->recurrence == Product_model::RECURRENCE_ONE_TIME) { //payment_link_product_model->get loads product_model we don't need to reload it here            
            $totalAmountOneTime += $itemSubtotal;
            $countProductsOneTime ++;
        } else { // preparing subscription product into a one time product just for performing the payment process.            
            if ($convertOneTime) {
                $linkProdOrigin->recurrence     = Product_model::RECURRENCE_ONE_TIME;
                $linkProdOrigin->billing_period = null;
            }
            
            if($feeObject->coverFee) {
                $linkProdOrigin->_sub_total = adjustAmountUpwardWithFees($feeObject, $itemSubtotal);
            } else {
                $linkProdOrigin->_sub_total = $itemSubtotal;
            }
            
        }

        $totalAmount += $itemSubtotal;
    }

    if($feeObject->coverFee) {
        $totalAmountOneTime = adjustAmountUpwardWithFees($feeObject, $totalAmountOneTime);
    }

    $data = ['totalAmount' => $totalAmount, 'totalAmountOneTime' => $totalAmountOneTime, '_products' => $productsWithRequest, 'countProductsOneTime' => $countProductsOneTime];
  
    return $data;
}


function PL_checkSubscriptionExists($products) {
    foreach ($products as $_product) {                                        
        if ($_product->recurrence == Product_model::RECURRENCE_PERIODICALLY ||$_product->recurrence == Product_model::RECURRENCE_CUSTOM ) {   
            return true;
        }
    }
    return false;
}
