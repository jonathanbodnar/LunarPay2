<?php

if (!defined('BASEPATH')) exit('No direct script access allowed');


function getFortisFee($trx)
{
    
    $templates = FORTIS_TEMPLATE_LIST; 

    $src = null;
    if(isset($trx->is_amex) && $trx->is_amex) {
        $src = 'CC_AMEX';
        if(!isset($templates[$trx->template][$src])) {
            throw new Exception("No template for Amex");
        }
    } else {
        $src = $trx->src;        
    }

    if (isset($templates[$trx->template][$src])) {
        $template = $templates[$trx->template][$src];
        $fee = $trx->total_amount * $template['percentage'] + $template['constant'];
        return round($fee, 2);
    }

    return null;
}


function getFortisTplParams($template)
{
    $templates = FORTIS_TEMPLATE_LIST; 

    if (isset($templates[$template])) {
        return [
            "var_cc" => $templates[$template]['CC']['percentage'],
            "kte_cc" => $templates[$template]['CC']['constant'],
            "var_bnk" => $templates[$template]['BNK']['percentage'],
            "kte_bnk" => $templates[$template]['BNK']['constant'],
            "var_cc_amex" => $templates[$template]['CC_AMEX']['percentage'],
            "kte_cc_amex" => $templates[$template]['CC_AMEX']['constant'],
            "name" => $template 
        ];
    }

    return [];
}

function getFortisFreqLabel($value)
{
    $CI = &get_instance();  
    $CI->load->model('product_model'); // Load the model

    $options = Product_model::PERIODICALLY_STRINGS;
    
    return isset($options[$value]) ? $options[$value] : $value;
}

/**
 * Adjusts the amount to include the payment method fee.
 * 
 * This function increases the original amount by applying a fixed and 
 * percentage-based fee based on the payment method (e.g., credit card, ACH).
 * The result is rounded to two decimal places to ensure proper currency format.
 * 
 * @param object $feeObject The fee object containing payment method, processor, 
 *                           and organization ID. Example:
 *                           $feeObject = (object) [
 *                               'coverFee' => $input->cover_fee, 
 *                               'paymentMethod' => 'cc', 
 *                               'orgId' => $paymentLink->church_id, 
 *                               'processorShort' => PROVIDER_PAYMENT_FORTIS_SHORT
 *                           ]
 * 
 * @param float $amount The original amount to be adjusted.
 * 
 * @return float The adjusted amount including fees, rounded to two decimal places.
 * 
 * Example usage:
 * $adjustedAmount = adjustAmountUpwardWithFees($feeObject, $amount);
 */
function adjustAmountUpwardWithFees($feeObject, $amount) {
    require_once 'application/controllers/extensions/Payments.php';

    $env = Payments::getEnvironment($feeObject->processorShort, $feeObject->orgId);
    $pricing_tpl = $env['pricing_tpl'];

    $kte = 0;
    $percent = 0;

    if ($feeObject->paymentMethod === 'cc') {
        $kte = $pricing_tpl['kte_cc'];
        $percent = $pricing_tpl['var_cc'];
    } else if ($feeObject->paymentMethod === 'ach') {
        $kte = $pricing_tpl['kte_bnk'];
        $percent = $pricing_tpl['var_bnk'];
    } else if ($feeObject->paymentMethod === 'cc_amex') {
        $kte = $pricing_tpl['kte_cc_amex'];
        $percent = $pricing_tpl['var_cc_amex'];
    }

    $newAmount = ($amount + $kte) / (1 - $percent); //this is the key!
    $newAmount = round($newAmount * 100) / 100;

    return $newAmount;
}
