/**
 * Reading what Fortis POSTs to our webhook URLs.
 *
 * Onboarding callbacks arrive as JSON. Postbacks configured through
 * POST /v1/webhooks/transaction do not: per Fortis's Post Backs documentation
 * (https://docs.fortispay.com/developers/api/post-backs, "Postback Data
 * Format") the body is www-form-urlencoded with fields
 *   type                CREATE | UPDATE | DELETE
 *   resource            e.g. "transaction"
 *   number_of_attempts  delivery attempt
 *   data                the record, as a JSON string (same fields as the API)
 * Pure — no I/O — so both webhook routes share it and it is testable.
 */

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Parse a webhook body: JSON when it is JSON (exactly as before), otherwise a
 * form body, with a JSON-string `data` field decoded into an object. Returns
 * null when neither reading yields an object.
 */
export function parseFortisWebhookBody(raw: string, contentType?: string | null): Record<string, unknown> | null {
  const text = raw ?? '';
  const isForm = /application\/x-www-form-urlencoded/i.test(contentType ?? '');

  if (!isForm) {
    const json = tryJson(text);
    if (json && typeof json === 'object' && !Array.isArray(json)) return json as Record<string, unknown>;
    if (json !== undefined) return null; // valid JSON, but not an object
  }

  if (!text.includes('=')) return null;
  const params = new URLSearchParams(text);
  const out: Record<string, unknown> = {};
  for (const [key, value] of params) out[key] = value;
  if (Object.keys(out).length === 0) return null;
  if (typeof out.data === 'string') {
    const data = tryJson(out.data);
    if (data && typeof data === 'object' && !Array.isArray(data)) out.data = data;
  }
  return out;
}

/**
 * The transaction record carried by a Fortis transaction postback
 * ({ resource: 'transaction', data: { id, status_code, … } }), or null when the
 * body is anything else.
 */
export function transactionPostbackRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const resource = typeof b.resource === 'string' ? b.resource.trim().toLowerCase() : '';
  if (resource !== 'transaction' && resource !== 'transactions') return null;
  const data = b.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const record = data as Record<string, unknown>;
  return record.id !== undefined && record.id !== null && String(record.id) ? record : null;
}
