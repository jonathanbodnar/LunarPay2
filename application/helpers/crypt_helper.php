<?php
defined('BASEPATH') or exit('No direct script access allowed');

define('ENCRYPTED_FILE_EXTENSION', 'crypt');

use Defuse\Crypto\Key;
use Defuse\Crypto\Crypto;

function encryptContent($data, $key)
{    
    $keyObject = Key::loadFromAsciiSafeString($key);
    return Crypto::encrypt($data, $keyObject);
    $CI = &get_instance();
    $initializeData = ['cipher' => 'aes-256', 'mode' => 'ctr', 'key' => $key];
    $CI->load->library('encryption', $initializeData);
    return $CI->encryption->encrypt($data);
}

function decryptContent($data, $key)
{
    $keyObject = Key::loadFromAsciiSafeString($key);
    return Crypto::decrypt($data, $keyObject);
    $CI = &get_instance();
    $initializeData = ['cipher' => 'aes-256', 'mode' => 'ctr', 'key' => $key];
    $CI->load->library('encryption', $initializeData);
    return $CI->encryption->decrypt($data);
}

function encryptFile($filePath, $key)
{
    $keyObject = Key::loadFromAsciiSafeString($key);
    $fileContent = file_get_contents($filePath);
    $encryptedContent = Crypto::encrypt($fileContent, $keyObject);
    file_put_contents($filePath, $encryptedContent);    
}

function defuseGenerateKey()
{
    $key = Key::createNewRandomKey();
    die($key->saveToAsciiSafeString());
}

/*  Generate a shortened code from a Merchant ID (and back). Used on URLs. for the customer hub (portal)
 *  The main goal is to obfuscate the Merchant ID for use in URLs, In production.
 *  For development, we use the raw ID for simplicity. 
 * 
 
 *  ------------------------------------------------
 *  Quick demo:
 *      $id   = 100;
 *      $code = merchantSlugEncode($id);   // "30d3"
 *      $decodedId  = merchantSlugDecode($code); // 100
 *
 *  How it works (plain words):
 *    1. Combine the ID with a hidden number.
 *    2. Shift the bits a few places.
 *    3. Change the result to hex text for the URL.
 *
 *  Run the steps backwards to get the original ID again.
 */
const MERCHANT_SLUG_KEY   = 7245; // hidden number – keep private //LET'S NOT CHANGE THIS
const MERCHANT_SLUG_SHIFT = 7;     // how many bit places to shift //LET'S NOT CHANGE THIS

function merchantSlugEncode(int $id): string
{
    $mix = $id ^ MERCHANT_SLUG_KEY;                           // step 1
    $mix = (($mix << MERCHANT_SLUG_SHIFT) |                   // step 2
           ($mix >> (32 - MERCHANT_SLUG_SHIFT))) & 0xFFFFFFFF;
    return dechex($mix);                                      // step 3
}

function merchantSlugDecode(string $code): int
{
    $mix = hexdec($code);                                     // undo 3
    $mix = (($mix >> MERCHANT_SLUG_SHIFT) |                   // undo 2
           ($mix << (32 - MERCHANT_SLUG_SHIFT))) & 0xFFFFFFFF;
    return $mix ^ MERCHANT_SLUG_KEY;                          // undo 1
}