/**
 * Fortis ACH transaction lifecycle → LunarPay ledger state.
 *
 * Pure: no I/O, no imports with side effects. Shared by the ACH reconcile cron
 * (src/app/api/cron/reconcile-ach) and the Fortis transaction webhook
 * (src/lib/fortis/webhook-handler.ts) so the two can never classify the same
 * Fortis record differently.
 *
 * SOURCES (fetched 2026-10-13):
 *  - status_code values: Fortis transaction "Status ID Details" table,
 *    https://docs.fortispay.com/developers/api/endpoints/transactions
 *    and the identical `status_code` enum in Fortis's v1 spec as published in
 *    the APIMatic-generated SDK `fortispay-typescript-sdk@1.0.16`
 *    (src/models/statusCode17Enum.ts, doc comment on Data29.statusCode):
 *      131 ach Pending Origination · 132 ach Originating · 133 ach Originated
 *      134 ach Settled · 201 cc/ach Voided · 301 cc/ach Declined
 *      331 ach Charged Back   (101/102/111/121 are card-only statuses)
 *  - reason_code_id values: "Response Reason Codes" → "ACH Reject Reason Codes",
 *    https://docs.fortispay.com/developers/api/response-reason-codes
 *      1000 ACH - Accepted · 2101–2183 Rejected-R01…R83 · 2200 Voided (Processor
 *      Void: voided by the processor before being sent to the bank)
 *      2201–2269 C01…C69 (notifications of change) · 2301–2373 X01…X73
 *      (Check 21 / RCK returns)
 *  - Verified against a real production ACH debit read with
 *    GET /v1/transactions/{id}: status_code 134, reason_code_id 1000,
 *    type_id 50 (Debit), payment_method 'ach', settle_date set, return_date
 *    null; settled ~3 business days after creation. Fortis's `verbiage` stays
 *    "Transaction Received" even once settled — never classify on verbiage
 *    (Fortis's docs say the same).
 */

export const FORTIS_ACH_STATUS = {
  PENDING_ORIGINATION: 131,
  ORIGINATING: 132,
  ORIGINATED: 133,
  SETTLED: 134,
  VOIDED: 201,
  DECLINED: 301,
  CHARGED_BACK: 331,
} as const;

/** reason_code_id 2200 — "Voided: Processor Void". */
export const FORTIS_REASON_PROCESSOR_VOID = 2200;

/** Short descriptions from Fortis's ACH Reject Reason Codes table. */
const ACH_RETURN_DESCRIPTIONS: Record<string, string> = {
  R01: 'Insufficient funds',
  R02: 'Bank account closed',
  R03: 'No bank account/unable to locate account',
  R04: 'Invalid bank account number',
  R05: 'Reserved',
  R06: 'Returned per ODFI request',
  R07: 'Authorization revoked by customer',
  R08: 'Payment stopped',
  R09: 'Uncollected funds',
  R10: 'Customer advises originator is not known to receiver and/or is not authorized by receiver to debit receiver’s account',
  R11: 'Customer advises entry not in accordance with the terms of the authorization',
  R12: 'Branch sold to another RDFI',
  R13: 'RDFI not qualified to participate',
  R14: 'Representative payee deceased or unable to continue in that capacity',
  R15: 'Beneficiary or bank account holder deceased',
  R16: 'Bank account frozen',
  R17: 'File record edit criteria',
  R18: 'Improper effective entry date',
  R19: 'Amount field error',
  R20: 'Non-payment bank account',
  R21: 'Invalid company identification',
  R22: 'Invalid individual ID number',
  R23: 'Credit entry refused by receiver',
  R24: 'Duplicate entry',
  R25: 'Addenda error',
  R26: 'Mandatory field error',
  R27: 'Trace number error',
  R28: 'Transit routing number check digit error',
  R29: 'Corporate customer advises not authorized',
  R30: 'RDFI not participant in check truncation program',
  R31: 'Permissible return entry (CCD and CTX only)',
  R32: 'RDFI non-settlement',
  R33: 'Return of XCK entry',
  R34: 'Limited participation RDFI',
  R35: 'Return of improper debit entry',
  R36: 'Return of improper credit entry',
  R37: 'Source document presented for payment',
  R38: 'Stop payment on source document',
  R39: 'Improper source document',
  R40: 'Return of ENR entry by federal government agency',
  R41: 'Invalid transaction code',
  R42: 'Routing number/check digit error',
  R43: 'Invalid DFI account number',
  R44: 'Invalid individual ID number/identification',
  R45: 'Invalid individual name/company name',
  R46: 'Invalid representative payee indicator',
  R47: 'Duplicate enrollment',
  R50: 'State law affecting RCK acceptance',
  R51: 'Item is ineligible, notice not provided, etc.',
  R52: 'Stop payment on item (adjustment entries)',
  R53: 'Item and ACH entry presented for payment',
  R61: 'Misrouted return',
  R62: 'Incorrect trace number',
  R63: 'Incorrect dollar amount',
  R64: 'Incorrect individual identification',
  R65: 'Incorrect transaction code',
  R66: 'Incorrect company identification',
  R67: 'Duplicate return',
  R68: 'Untimely return',
  R69: 'Multiple errors',
  R70: 'Permissible return entry not accepted',
  R71: 'Misrouted dishonored return',
  R72: 'Untimely dishonored return',
  R73: 'Timely original return',
  R74: 'Corrected return',
  R80: 'Cross-border payment coding error',
  R81: 'Non-participant in cross-border program',
  R82: 'Invalid foreign receiving DFI identification',
  R83: 'Foreign receiving DFI unable to settle',
  X01: 'Misc Check 21 return',
  X04: 'Invalid image',
  X05: 'Breach of warranty',
  X06: 'Counterfeit / forgery',
  X07: 'Refer to maker',
  X08: 'Maximum payment attempts',
  X09: 'Item cannot be re-presented',
  X10: 'Not our item',
  X21: 'Pay none',
  X22: 'Pay all',
  X23: 'Non-negotiable',
  X29: 'Stale dated',
  X45: 'Misc return',
  X71: 'RCK - 2nd time',
  X72: 'RCK reject - ACH',
  X73: 'RCK reject - payer',
};

/** Decline reasons Fortis documents as ACH-specific (plus the generic ones). */
const ACH_DECLINE_DESCRIPTIONS: Record<number, string> = {
  1500: 'Generic decline',
  1599: 'Other reason',
  1601: 'Generic decline',
  1608: 'Account error',
  1631: 'Account closed',
  1640: 'Required fields are missing (ACH only)',
  1641: 'Previously declined transaction (1640)',
  1650: 'Contact support',
  1651: 'Max sending - throttle limit hit (ACH only)',
  1652: 'Max attempts exceeded',
  1660: 'Bank account error, please delete and re-add the account',
  1801: 'Duplicate transaction',
};

/** The parts of a Fortis transaction record the classification reads. */
export interface FortisAchRecord {
  status_code?: unknown;
  status_id?: unknown; // legacy (v2) name for the same field
  reason_code_id?: unknown;
  return_date?: unknown;
  charge_back_date?: unknown;
}

export type AchFailureReason = 'returned' | 'voided' | 'declined';

export type AchOutcome =
  | { kind: 'pending'; statusCode: number }
  | { kind: 'settled'; statusCode: number }
  | {
      kind: 'failed';
      reason: AchFailureReason;
      statusCode: number | null;
      reasonCodeId: number | null;
      /** NACHA return code (R01…, or X01… for Check 21/RCK), when Fortis gave one. */
      returnCode: string | null;
      /** Human-readable cause, suitable for a charge.failed `error`. */
      message: string;
    }
  | { kind: 'unknown'; statusCode: number | null; reasonCodeId: number | null };

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return parseInt(value.trim(), 10);
  return null;
}

/**
 * A real calendar date — what Fortis puts in return_date / charge_back_date
 * once a debit comes back ("YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"). Empty
 * values, 0, "0" and zero dates ("0000-00-00") are not dates.
 */
export function isRealDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(value.trim());
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

/**
 * NACHA return code for a Fortis ACH reason_code_id: 2101–2183 → R01…R83,
 * 2301–2399 → X01…X99. Notifications of change (2201–2299, C-codes) and the
 * processor void (2200) are not returns and yield null.
 */
export function achReturnCode(reasonCodeId: unknown): string | null {
  const code = toInt(reasonCodeId);
  if (code === null) return null;
  if (code >= 2101 && code <= 2199) return `R${String(code - 2100).padStart(2, '0')}`;
  if (code >= 2301 && code <= 2399) return `X${String(code - 2300).padStart(2, '0')}`;
  return null;
}

export function achReturnDescription(returnCode: string | null): string | null {
  return returnCode ? ACH_RETURN_DESCRIPTIONS[returnCode] ?? null : null;
}

/**
 * Classify a Fortis ACH transaction.
 *
 *   131/132/133             → pending  (still in the ACH network; nothing to report)
 *   134                     → settled
 *   331, a return reason
 *   (21xx/23xx), or a real
 *   return/charge-back date → failed: returned   (wins over 134 — a debit with a
 *                                                return on it is never "settled";
 *                                                0 / "" / "0000-00-00" are not dates)
 *   201 or reason 2200      → failed: voided
 *   301                     → failed: declined
 *   anything else           → unknown (callers leave the row alone and retry)
 */
export function classifyAchTransaction(record: FortisAchRecord): AchOutcome {
  const statusCode = toInt(record.status_code ?? record.status_id);
  const reasonCodeId = toInt(record.reason_code_id);
  const returnCode = achReturnCode(reasonCodeId);

  const returned =
    statusCode === FORTIS_ACH_STATUS.CHARGED_BACK ||
    returnCode !== null ||
    isRealDate(record.return_date) ||
    isRealDate(record.charge_back_date);

  if (returned) {
    const description = achReturnDescription(returnCode);
    const message = returnCode
      ? `ACH return ${returnCode}${description ? `: ${description}` : ''}`
      : 'ACH debit was returned by the bank';
    return { kind: 'failed', reason: 'returned', statusCode, reasonCodeId, returnCode, message };
  }

  if (statusCode === FORTIS_ACH_STATUS.VOIDED || reasonCodeId === FORTIS_REASON_PROCESSOR_VOID) {
    return {
      kind: 'failed',
      reason: 'voided',
      statusCode,
      reasonCodeId,
      returnCode: null,
      message: 'ACH debit was voided before it reached the bank',
    };
  }

  if (statusCode === FORTIS_ACH_STATUS.DECLINED) {
    const description = reasonCodeId !== null ? ACH_DECLINE_DESCRIPTIONS[reasonCodeId] : undefined;
    return {
      kind: 'failed',
      reason: 'declined',
      statusCode,
      reasonCodeId,
      returnCode: null,
      message: `ACH debit was declined${description ? `: ${description}` : reasonCodeId !== null ? ` (reason ${reasonCodeId})` : ''}`,
    };
  }

  if (statusCode === FORTIS_ACH_STATUS.SETTLED) return { kind: 'settled', statusCode };

  if (
    statusCode === FORTIS_ACH_STATUS.PENDING_ORIGINATION ||
    statusCode === FORTIS_ACH_STATUS.ORIGINATING ||
    statusCode === FORTIS_ACH_STATUS.ORIGINATED
  ) {
    return { kind: 'pending', statusCode };
  }

  return { kind: 'unknown', statusCode, reasonCodeId };
}
