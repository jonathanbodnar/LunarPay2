<?php
function amountToCurrency($amount) {
    return number_format($amount, 2, '.', ','); 

}