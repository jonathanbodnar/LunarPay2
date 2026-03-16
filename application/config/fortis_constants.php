<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Fortis Constants
 * 
 * This file contains the constants used in the Fortis application
 * 
 * @package     Fortis
 * @category    Configurations
 * @version     1.0
 * @since       1.0
 */

define("FORTIS_TEMPLATE_LIST", [
    "TESTING1234" => [
        "CC" => ["percentage" => 0.0275, "constant" => 0.27],
        "BNK" => ["percentage" => 0.0125, "constant" => 0.12],
        "CC_AMEX" => ["percentage" => 0.035, "constant" => 0.35],
    ],
    //2.75% + 27c a trxand 1.25% + 12c for ACH
    //instead we will set it at 2.9% + 30C on credit cards, 3.5% and 35C on amex, and 1.25% and 25C for bank
    "lunarpayfr" => [
        "CC" => ["percentage" => 0.029, "constant" => 0.3],
        "BNK" => ["percentage" => 0.0125, "constant" => 0.25],
        "CC_AMEX" => ["percentage" => 0.035, "constant" => 0.35],
    ],
]);

define("FORTIS_TPL_DEFAULT", "TESTING1234");
////////////////////////////////////////////////

////////////////////////////////////////////////
//https://docs.fortis.tech/v/1_0_0#/rest/models/structures/data-25
define("FORTIS_STATUS_APPROVED", 101);
define("FORTIS_STATUS_AUTH_ONLY", 102);
define("FORTIS_STATUS_REFUNDED", 111);
define("FORTIS_STATUS_REFUNDED_AVS_ONLY", 121);
define("FORTIS_STATUS_PENDING_ORIGINATION", 131);
define("FORTIS_STATUS_ORIGINATING", 132);
define("FORTIS_STATUS_ORIGINATED", 133);
define("FORTIS_STATUS_SETTLED", 134);
define("FORTIS_STATUS_SETTLED_DEPRECATED", 191);
define("FORTIS_STATUS_VOIDED", 201);
define("FORTIS_STATUS_DECLINED", 301);
define("FORTIS_STATUS_CHARGED_BACK", 331);

define("FORTIS_STATUS_LABELS", [
    FORTIS_STATUS_APPROVED => 'Succeded',
    FORTIS_STATUS_AUTH_ONLY => 'AuthOnly',
    FORTIS_STATUS_REFUNDED => 'Refunded',
    FORTIS_STATUS_REFUNDED_AVS_ONLY => 'Refunded',
    FORTIS_STATUS_PENDING_ORIGINATION => 'Pending Origination', //Bank Payment Status flow
    FORTIS_STATUS_ORIGINATING => 'Originating', //Bank Payment Status flow 
    FORTIS_STATUS_ORIGINATED => 'Originated', //Bank Payment Status flow
    FORTIS_STATUS_SETTLED => 'Settled', //Bank Payment Status flow
    FORTIS_STATUS_SETTLED_DEPRECATED => 'Settled (deprecated - batches are now settled on the /v2/transactionbatches endpoint)',
    FORTIS_STATUS_VOIDED => 'Voided', //Bank Payment Status flow
    FORTIS_STATUS_DECLINED => 'Declined', //Bank Payment Status flow
    FORTIS_STATUS_CHARGED_BACK => 'Charged Back', //Bank Payment Status flow
]);
////////////////////////////////////////////////


////////////////////////////////////////////////
const FORTIS_REASON_CODES = [ //https://docs.fortis.tech/v/1_0_0#/rest/models/enumerations/reason-code-id-1
    "0" => "N/A",
    "1000" => "CC - Approved / ACH - Accepted",
    "1001" => "AuthCompleted",
    "1002" => "Forced",
    "1003" => "AuthOnly Declined",
    "1004" => "Validation Failure (System Run Trx)",
    "1005" => "Processor Response Invalid",
    "1200" => "Voided",
    "1201" => "Partial Approval",
    "1240" => "Approved, optional fields are missing (Paya ACH only)",
    "1301" => "Account Deactivated for Fraud",
    "1302" => "Reserved for Future Fraud Reason Codes",
    "1399" => "Reserved for Future Fraud Reason Codes",
    "1500" => "Generic Decline",
    "1510" => "Call",
    "1518" => "Transaction Not Permitted - Terminal",
    "1520" => "Pickup Card",
    "1530" => "Retry Trx",
    "1531" => "Communication Error",
    "1540" => "Setup Issue, contact Support",
    "1541" => "Device is not signature capable",
    "1588" => "Data could not be de-tokenized",
    "1599" => "Other Reason",
    "1601" => "Generic Decline",
    "1602" => "Call",
    "1603" => "No Reply",
    "1604" => "Pickup Card - No Fraud",
    "1605" => "Pickup Card - Fraud",
    "1606" => "Pickup Card - Lost",
    "1607" => "Pickup Card - Stolen",
    "1608" => "Account Error",
    "1609" => "Already Reversed",
    "1610" => "Bad PIN",
    "1611" => "Cashback Exceeded",
    "1612" => "Cashback Not Available",
    "1613" => "CID Error",
    "1614" => "Date Error",
    "1615" => "Do Not Honor",
    "1616" => "NSF",
    "1618" => "Invalid Service Code",
    "1619" => "Exceeded activity limit",
    "1620" => "Violation",
    "1621" => "Encryption Error",
    "1622" => "Card Expired",
    "1623" => "Renter",
    "1624" => "Security Violation",
    "1625" => "Card Not Permitted",
    "1626" => "Trans Not Permitted",
    "1627" => "System Error",
    "1628" => "Bad Merchant ID",
    "1629" => "Duplicate Batch (Already Closed)",
    "1630" => "Batch Rejected",
    "1631" => "Account Closed",
    "1632" => "PIN tries exceeded",
    "1640" => "Required fields are missing (ACH only)",
    "1641" => "Previously declined transaction (1640)",
    "1650" => "Contact Support",
    "1651" => "Max Sending - Throttle Limit Hit (ACH only)",
    "1652" => "Max Attempts Exceeded",
    "1653" => "Contact Support",
    "1654" => "Voided - Online Reversal Failed",
    "1655" => "Decline (AVS Auto Reversal)",
    "1656" => "Decline (CVV Auto Reversal)",
    "1657" => "Decline (Partial Auth Auto Reversal)",
    "1658" => "Expired Authorization",
    "1659" => "Declined - Partial Approval not Supported",
    "1660" => "Bank Account Error, please delete and re-add Token",
    "1661" => "Declined AuthIncrement",
    "1662" => "Auto Reversal - Processor can't settle",
    "1663" => "Manager Needed (Needs override transaction)",
    "1664" => "Token Not Found: Sharing Group Unavailable",
    "1665" => "Contact Not Found: Sharing Group Unavailable",
    "1666" => "Amount Error",
    "1667" => "Action Not Allowed in Current State",
    "1668" => "Original Authorization Not Valid",
    "1701" => "Chip Reject",
    "1800" => "Incorrect CVV",
    "1801" => "Duplicate Transaction",
    "1802" => "MID/TID Not Registered",
    "1803" => "Stop Recurring",
    "1804" => "No Transactions in Batch",
    "1805" => "Batch Does Not Exist",
    //ACH Reject Reason Codes
    "2101" => "Insufficient funds - Available balance is not sufficient to cover the amount of the debit entry",
    "2102" => "Bank account closed - Previously active amount has been closed by the customer of RDFI",
    "2103" => "No bank account/unable to locate account - Account number does not correspond to the individual identified in the entry, or the account number designated is not an open account",
    "2104" => "Invalid bank account number - Account number structure is not valid",
    "2105" => "Reserved - Currently not in use",
    "2106" => "Returned per ODFI request - ODFI requested the RDFI to return the entry",
    "2107" => "Authorization revoked by customer - Receiver has revoked authorization",
    "2108" => "Payment stopped - Receiver of a recurring debit has stopped payment of an entry",
    "2109" => "Uncollected funds - Collected funds are not sufficient for payment of the debit entry",
    "2110" => "Customer Advises Originator is Not Known to Receiver and/or Is Not Authorized by Receiver to Debit Receiver’s Account - Receiver has advised RDFI that originator is not authorized to debit his bank account",
    "2111" => "Customer Advises Entry Not In Accordance with the Terms of the Authorization - To be used when there is an error in the authorization",
    "2112" => "Branch sold to another RDFI - RDFI unable to post entry destined for a bank account maintained at a branch sold to another financial institution",
    "2113" => "RDFI not qualified to participate - Financial institution does not receive commercial ACH entries",
    "2114" => "Representative payee deceased or unable to continue in that capacity - The representative payee authorized to accept entries on behalf of a beneficiary is either deceased or unable to continue in that capacity",
    "2115" => "Beneficiary or bank account holder deceased - (Other than representative payee) deceased* - (1) the beneficiary entitled to payments is deceased or (2) the bank account holder other than a representative payee is deceased",
    "2116" => "Bank account frozen - Funds in bank account are unavailable due to action by RDFI or legal order",
    "2117" => "File record edit criteria - Entry with Invalid Account Number Initiated Under Questionable Circumstances",
    "2118" => "Improper effective entry date - Entries have been presented prior to the first available processing window for the effective date.",
    "2119" => "Amount field error - Improper formatting of the amount field",
    "2120" => "Non-payment bank account - Entry destined for non-payment bank account defined by reg.",
    "2121" => "Invalid company Identification - The company ID information not valid (normally CIE entries)",
    "2122" => "Invalid individual ID number - Individual id used by receiver is incorrect (CIE entries)",
    "2123" => "Credit entry refused by receiver - Receiver returned entry because minimum or exact amount not remitted, bank account is subject to litigation, or payment represents an overpayment, originator is not known to receiver or receiver has not authorized this credit entry to this bank account",
    "2124" => "Duplicate entry - RDFI has received a duplicate entry",
    "2125" => "Addenda error - Improper formatting of the addenda record information",
    "2126" => "Mandatory field error - Improper information in one of the mandatory fields",
    "2127" => "Trace number error - Original entry trace number is not valid for return entry; or addenda trace numbers do not correspond with entry detail record",
    "2128" => "Transit routing number check digit error - Check digit for the transit routing number is incorrect",
    "2129" => "Corporate customer advises not authorized - RDFI has been notified by corporate receiver that debit entry of originator is not authorized",
    "2130" => "RDFI not participant in check truncation program - Financial institution not participating in automated check safekeeping application",
    "2131" => "Permissible return entry (CCD and CTX only) - RDFI has been notified by the ODFI that it agrees to accept a CCD or CTX return entry",
    "2132" => "RDFI non-settlement - RDFI is not able to settle the entry",
    "2133" => "Return of XCK entry - RDFI determines at its sole discretion to return an XCK entry; an XCK return entry may be initiated by midnight of the sixtieth day following the settlement date if the XCK entry",
    "2134" => "Limited participation RDFI - RDFI participation has been limited by a federal or state supervisor",
    "2135" => "Return of improper debit entry - ACH debit not permitted for use with the CIE standard entry class code (except for reversals)",
    "2136" => "Return of Improper Credit Entry",
    "2137" => "Source Document Presented for Payment",
    "2138" => "Stop Payment on Source Document",
    "2139" => "Improper Source Document",
    "2140" => "Return of ENR Entry by Federal Government Agency",
    "2141" => "Invalid Transaction Code",
    "2142" => "Routing Number/Check Digit Error",
    "2143" => "Invalid DFI Account Number",
    "2144" => "Invalid Individual ID Number/Identification",
    "2145" => "Invalid Individual Name/Company Name",
    "2146" => "Invalid Representative Payee Indicator",
    "2147" => "Duplicate Enrollment",
    "2150" => "State Law Affecting RCK Acceptance",
    "2151" => "Item is Ineligible, Notice Not Provided, etc.",
    "2152" => "Stop Payment on Item (adjustment entries)",
    "2153" => "Item and ACH Entry Presented for Payment",
    "2161" => "Misrouted Return",
    "2162" => "Incorrect Trace Number",
    "2163" => "Incorrect Dollar Amount",
    "2164" => "Incorrect Individual Identification",
    "2165" => "Incorrect Transaction Code",
    "2166" => "Incorrect Company Identification",
    "2167" => "Duplicate Return",
    "2168" => "Untimely Return",
    "2169" => "Multiple Errors",
    "2170" => "Permissible Return Entry Not Accepted",
    "2171" => "Misrouted Dishonored Return",
    "2172" => "Untimely Dishonored Return",
    "2173" => "Timely Original Return",
    "2174" => "Corrected Return",
    "2180" => "Cross-Border Payment Coding Error",
    "2181" => "Non-Participant in Cross-Border Program",
    "2182" => "Invalid Foreign Receiving DFI Identification",
    "2183" => "Foreign Receiving DFI Unable to Settle",
    "2200" => "Processor Void - The transaction was voided by the processor before being sent to the bank",
    "2201" => "Rejected-C01",
    "2202" => "Rejected-C02",
    "2203" => "Rejected-C03",
    "2204" => "Rejected-C04",
    "2205" => "Rejected-C05",
    "2206" => "Rejected-C06",
    "2207" => "Rejected-C07",
    "2208" => "Rejected-C08",
    "2209" => "Rejected-C09",
    "2210" => "Rejected-C10",
    "2211" => "Rejected-C11",
    "2212" => "Rejected-C12",
    "2213" => "Rejected-C13",
    "2261" => "Rejected-C61",
    "2262" => "Rejected-C62",
    "2263" => "Rejected-C63",
    "2264" => "Rejected-C64",
    "2265" => "Rejected-C65",
    "2266" => "Rejected-C66",
    "2267" => "Rejected-C67",
    "2268" => "Rejected-C68",
    "2269" => "Rejected-C69",
    "2301" => "Misc Check 21 Return",
    "2304" => "Invalid Image",
    "2305" => "Breach of Warranty - E95",
    "2306" => "Counterfeit / Forgery - E96",
    "2307" => "Refer to Maker - E97",
    "2308" => "Maximum Payment Attempts",
    "2309" => "Item Cannot be Re-presented",
    "2310" => "Not Our Item",
    "2321" => "Pay None",
    "2322" => "Pay All",
    "2323" => "Non-Negotiable - E93",
    "2329" => "Stale Dated",
    "2345" => "Misc Return",
    "2371" => "RCK - 2nd Time",
    "2372" => "RCK Reject - ACH",
    "2373" => "RCK Reject - Payer",
];
////////////////////////////////////////////////

////////////////////////////////////////////////
//FORTIS BATCH STATUS
define('FORTIS_BATCH_TO_SETTLE', 1);
define('FORTIS_BATCH_SETTLED', 2);
define('FORTIS_BATCH_ERROR', 3);
define('FORTIS_BATCH_REPROCESS', 4);
define('FORTIS_BATCH_PROCESSING', 5);

define('FORTIS_BATCH_STATUS_LABELS', [
    FORTIS_BATCH_TO_SETTLE => 'To Settle',
    FORTIS_BATCH_SETTLED => 'Settled',
    FORTIS_BATCH_ERROR => 'Error',
    FORTIS_BATCH_REPROCESS => 'Reprocess',
    FORTIS_BATCH_PROCESSING => 'Processing',
]);
////////////////////////////////////////////////