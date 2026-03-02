<?php

function getEpicPayFee($trx) {
    $fee = null;

    if ($trx->template === "ActiveBase4") {
        if ($trx->src === "CC") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE4_CC_P + EPICPAY_TPL_CHURCHBASE4_CC_K;
        } elseif ($trx->src === "BNK") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE4_BNK_P + EPICPAY_TPL_CHURCHBASE4_BNK_K;
        }
    } elseif ($trx->template === "ActiveBase3") {
        if ($trx->src === "CC") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE3_CC_P + EPICPAY_TPL_CHURCHBASE3_CC_K;
        } elseif ($trx->src === "BNK") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE3_BNK_P + EPICPAY_TPL_CHURCHBASE3_BNK_K;
        }
    } elseif ($trx->template === "ActiveBase2") {
        if ($trx->src === "CC") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE2_CC_P + EPICPAY_TPL_CHURCHBASE2_CC_K;
        } elseif ($trx->src === "BNK") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE2_BNK_P + EPICPAY_TPL_CHURCHBASE2_BNK_K;
        }
    } elseif ($trx->template === "AB29030") {
        if ($trx->src === "CC") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE_CC_P + EPICPAY_TPL_CHURCHBASE_CC_K;
        } elseif ($trx->src === "BNK") {
            $fee = $trx->total_amount * EPICPAY_TPL_CHURCHBASE_BNK_P + EPICPAY_TPL_CHURCHBASE_BNK_K;
        }
    }
    $fee = (round($fee, 2));
    return $fee;
}

function getEpicPayTplParams($template) {
    $result = [];

    if ($template === "ActiveBase4") {
        $result = ["var_cc" => EPICPAY_TPL_CHURCHBASE4_CC_P, "kte_cc" => EPICPAY_TPL_CHURCHBASE4_CC_K, "var_bnk" => EPICPAY_TPL_CHURCHBASE4_BNK_P, "kte_bnk" => EPICPAY_TPL_CHURCHBASE4_BNK_K];
    } elseif ($template === "ActiveBase3") {
        $result = ["var_cc" => EPICPAY_TPL_CHURCHBASE3_CC_P, "kte_cc" => EPICPAY_TPL_CHURCHBASE3_CC_K, "var_bnk" => EPICPAY_TPL_CHURCHBASE3_BNK_P, "kte_bnk" => EPICPAY_TPL_CHURCHBASE3_BNK_K];
    } elseif ($template === "ActiveBase2") {
        $result = ["var_cc" => EPICPAY_TPL_CHURCHBASE2_CC_P, "kte_cc" => EPICPAY_TPL_CHURCHBASE2_CC_K, "var_bnk" => EPICPAY_TPL_CHURCHBASE2_BNK_P, "kte_bnk" => EPICPAY_TPL_CHURCHBASE2_BNK_K];
    } elseif ($template === "AB29030") {
        $result = ["var_cc" => EPICPAY_TPL_CHURCHBASE_CC_P, "kte_cc" => EPICPAY_TPL_CHURCHBASE_CC_K, "var_bnk" => EPICPAY_TPL_CHURCHBASE_BNK_P, "kte_bnk" => EPICPAY_TPL_CHURCHBASE_BNK_K];
    }
    if ($result) {
        $result["name"] = $template;
    }
    return $result;
}

function getEpicpayFreqLabel($value) {
    $options = getAllEpicpayFreqLabels();
    return isset($options[$value]) ? $options[$value] : $value;
}

function getAllEpicpayFreqLabels() {
    $options = [
        'week'      => 'Weekly',
        'month'     => 'Monthly',
        'quarterly' => 'Quarterly',
        'year'      => 'Yearly',
    ];
    return $options;
}
