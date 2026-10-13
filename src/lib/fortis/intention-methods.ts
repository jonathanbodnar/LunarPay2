/**
 * A bank-account-only (ACH) Fortis Elements form.
 *
 * ONLY paymentMethods ['ach'] comes here. Card and mixed requests (['cc'],
 * ['cc','ach'], none) keep exactly the request and response they always had —
 * live card forms depend on that form's layout.
 *
 * Elements' client-side `create()` has no payment-method option (its options
 * schema in commercejs-v1.0.0 accepts container/environment/theme/view/
 * fields/appearance/digitalWallets/… only). The rails come from the
 * intention: the iframe reads the token's `transaction.methods`, renders one
 * tab button per entry, and defaults to the card tab when both exist.
 *
 * Request shape, POST /v1/elements/transaction/intention:
 *   methods: [{ type: 'ach', product_transaction_id: '<the ACH product>' }]
 * Source: Fortis's v1 spec as published in its APIMatic SDKs —
 *   fortis-apimatic-sdk@1.0.5 V1ElementsTransactionIntentionRequest.methods:
 *     "By default the system will try to offer all the availables payment
 *      methods from your account. However, if you need to display only cc or
 *      ach only use the corresponding product transaction id."
 *   Method50.productTransactionId (required): "Use only the cc or ach id to
 *     display their respective elements form only. The Product's method
 *     (cc/ach) has to match the type."
 *   (fortispay-typescript-sdk@1.0.16 carries the same model.) The spec has NO
 *   top-level product_transaction_id — why Fortis 412s that field here.
 *
 * Never an unscoped form: a payer who asked to pay by bank must not be shown
 * card fields. Every way this can fail is a 4xx with a stable `code`:
 *   ACH_NOT_ENABLED         no ACH product on file, or the "ACH" id equals the
 *                           card id (older writers stored `cc || ach` as the
 *                           card id, so the two can be the same product — a
 *                           card id must never be sent as the ACH product)
 *   ACH_METHODS_UNSUPPORTED Fortis refused the `methods` restriction itself
 *   ACH_INTENTION_FAILED    any other Fortis refusal (its message in `error`)
 *
 * Not an option: a ticket intention — Elements renders ticket tokens card-only.
 * Unverified until the first live call: that Fortis accepts `methods` on
 * action 'tokenization' (nothing in the spec says otherwise).
 */

import type { TransactionIntentionData } from '@/types/fortis';

export interface IntentionClient {
  createTransactionIntention(
    data: TransactionIntentionData
  ): Promise<{ status: boolean; clientToken?: string; message?: string }>;
}

export type AchIntentionErrorCode = 'ACH_NOT_ENABLED' | 'ACH_METHODS_UNSUPPORTED' | 'ACH_INTENTION_FAILED';

export type AchTokenizationResult =
  | { ok: true; clientToken: string }
  | { ok: false; status: 400 | 422; code: AchIntentionErrorCode; error: string };

/**
 * Did Fortis refuse the `methods` field itself (as opposed to anything else)?
 * Fortis validation errors name the offending key, e.g.
 * `"product_transaction_id" is not allowed`.
 */
export function isMethodsRejection(message: string | undefined | null): boolean {
  if (!message) return false;
  return /"?methods(\[\d+\])?(\.[a-z_]+)?"?\s+(is not allowed|is not permitted|not allowed)/i.test(message);
}

/** The distinct ACH product to scope the form to, or null when there is none. */
export function distinctAchProduct(products: {
  ccProductTransactionId: string | null;
  achProductTransactionId: string | null;
}): string | null {
  const ach = products.achProductTransactionId?.trim();
  if (!ach) return null;
  if (ach === products.ccProductTransactionId?.trim()) return null;
  return ach;
}

export async function createAchTokenizationIntention(
  client: IntentionClient,
  args: {
    locationId: string;
    products: { ccProductTransactionId: string | null; achProductTransactionId: string | null };
    organizationId?: number;
  },
): Promise<AchTokenizationResult> {
  const achProduct = distinctAchProduct(args.products);
  if (!achProduct) {
    return {
      ok: false,
      status: 400,
      code: 'ACH_NOT_ENABLED',
      error: 'ACH (eCheck) processing is not enabled for this merchant. Contact support to enable an ACH product.',
    };
  }

  const result = await client.createTransactionIntention({
    location_id: args.locationId,
    action: 'tokenization',
    methods: [{ type: 'ach', product_transaction_id: achProduct }],
  });
  if (result.status && result.clientToken) return { ok: true, clientToken: result.clientToken };

  if (isMethodsRejection(result.message)) {
    console.error(
      `[v1/intentions] Fortis refused a bank-only form` +
        `${args.organizationId ? ` (org ${args.organizationId})` : ''}: ${result.message}`
    );
    return {
      ok: false,
      status: 422,
      code: 'ACH_METHODS_UNSUPPORTED',
      error: 'A bank-account-only payment form is not available for this merchant right now.',
    };
  }
  return {
    ok: false,
    status: 400,
    code: 'ACH_INTENTION_FAILED',
    error: result.message || 'Failed to create tokenization intention',
  };
}
