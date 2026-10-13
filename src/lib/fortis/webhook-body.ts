/**
 * Fortis transaction postbacks.
 *
 * Postbacks configured through POST /v1/webhooks/transaction are not JSON:
 * per Fortis's Post Backs documentation
 * (https://docs.fortispay.com/developers/api/post-backs, "Postback Data
 * Format") the body is www-form-urlencoded with fields
 *   type                CREATE | UPDATE | DELETE
 *   resource            e.g. "transaction"
 *   number_of_attempts  delivery attempt
 *   data                the record, as a JSON string (same fields as the API)
 *
 * The webhook routes always try JSON first, exactly as before; only a body
 * that is NOT JSON is offered to this parser, and only what it returns — a
 * transaction record — goes anywhere, and then only to the ACH re-read path.
 * Pure: no I/O.
 */

/** The transaction record from a form-encoded Fortis postback, or null. */
export function parseTransactionPostback(raw: string): Record<string, unknown> | null {
  if (!raw || !raw.includes('=')) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return null;
  }
  const resource = (params.get('resource') || '').trim().toLowerCase();
  if (resource !== 'transaction' && resource !== 'transactions') return null;
  const dataText = params.get('data');
  if (!dataText) return null;
  let data: unknown;
  try {
    data = JSON.parse(dataText);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  return record.id !== undefined && record.id !== null && String(record.id).trim() ? record : null;
}
