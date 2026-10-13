/**
 * Limiting a Fortis Elements intention to one payment rail.
 *
 * Elements' client-side `create()` has no payment-method option (its options
 * schema in commercejs-v1.0.0 accepts container/environment/theme/view/
 * fields/appearance/digitalWallets/… only). The rails come from the
 * intention: the iframe reads the token's `transaction.methods`, renders one
 * tab button per entry, and defaults to the card tab when both exist (and
 * suppresses Apple/Google Pay when the only method is ACH).
 *
 * Request shape, POST /v1/elements/transaction/intention:
 *   methods: [{ type: 'ach' | 'cc', product_transaction_id: '<that rail's product>' }]
 * Source: Fortis's v1 spec as published in its APIMatic SDKs —
 *   fortis-apimatic-sdk@1.0.5 V1ElementsTransactionIntentionRequest.methods:
 *     "By default the system will try to offer all the availables payment
 *      methods from your account. However, if you need to display only cc or
 *      ach only use the corresponding product transaction id."
 *   Method50.productTransactionId (required): "Use only the cc or ach id to
 *     display their respective elements form only. The Product's method
 *     (cc/ach) has to match the type."
 *   (fortispay-typescript-sdk@1.0.16 carries the same model.) The spec puts no
 *   action restriction on `methods`, unlike save_account/amount, and has NO
 *   top-level product_transaction_id — which is why Fortis 412s that field on
 *   transaction intentions ("product_transaction_id" is not allowed).
 *
 * Not an option: a ticket intention (/v1/elements/ticket/intention). Elements
 * renders a ticket token as card-only — it never binds the ACH form for one —
 * so it cannot collect a bank account at all.
 *
 * Unverified until the first live call: that Fortis accepts `methods` on
 * action 'tokenization' specifically (nothing in the spec says otherwise).
 * isMethodsRejection() lets the route fall back to an unscoped intention —
 * today's behavior — instead of failing, if it does not.
 */

import type { TransactionIntentionData } from '@/types/fortis';

export type IntentionRail = 'cc' | 'ach' | 'any';

export interface IntentionMethod {
  type: 'cc' | 'ach';
  product_transaction_id: string;
}

export type IntentionMethodsResult =
  | { ok: true; methods?: IntentionMethod[] }
  | { ok: false; error: string };

/**
 * The `methods` to send for a requested rail. 'any' sends nothing at all, so
 * a both-rails or unspecified request is byte-for-byte what it was before.
 */
export function intentionMethodsFor(
  rail: IntentionRail,
  products: { ccProductTransactionId: string | null; achProductTransactionId: string | null },
): IntentionMethodsResult {
  if (rail === 'any') return { ok: true };
  if (rail === 'cc') {
    if (!products.ccProductTransactionId) {
      return {
        ok: false,
        error: 'Credit card processing is not enabled for this merchant. Contact support to enable a CC product.',
      };
    }
    return { ok: true, methods: [{ type: 'cc', product_transaction_id: products.ccProductTransactionId }] };
  }
  if (!products.achProductTransactionId) {
    return {
      ok: false,
      error: 'ACH (eCheck) processing is not enabled for this merchant. Contact support to enable an ACH product.',
    };
  }
  return { ok: true, methods: [{ type: 'ach', product_transaction_id: products.achProductTransactionId }] };
}

/**
 * Did Fortis refuse the `methods` field itself (as opposed to anything else)?
 * Fortis validation errors name the offending key, e.g.
 * `"product_transaction_id" is not allowed`.
 */
export function isMethodsRejection(message: string | undefined | null): boolean {
  if (!message) return false;
  return /"?methods(\[\d+\])?(\.[a-z_]+)?"?\s+(is not allowed|is not permitted|not allowed)/i.test(message);
}

export interface IntentionClient {
  createTransactionIntention(
    data: TransactionIntentionData
  ): Promise<{ status: boolean; clientToken?: string; message?: string }>;
}

export type TokenizationIntentionResult =
  | {
      ok: true;
      clientToken: string;
      /** The product the form is limited to; null for an unscoped form. */
      productTransactionId: string | null;
      /** Single-rail requests only: is the form really limited to that rail? */
      methodsEnforced?: boolean;
    }
  | { ok: false; error: string };

/**
 * Create a tokenization (save-without-charging) intention for the requested
 * rail. A single rail goes to Fortis as `methods`; 'any' sends exactly the
 * body it always did. If Fortis refuses `methods` itself, this degrades to
 * the unscoped form (every rail, card tab first) with methodsEnforced: false
 * instead of failing the payer's page.
 */
export async function createTokenizationIntention(
  client: IntentionClient,
  args: {
    locationId: string;
    rail: IntentionRail;
    products: { ccProductTransactionId: string | null; achProductTransactionId: string | null };
    organizationId?: number;
  },
): Promise<TokenizationIntentionResult> {
  const scope = intentionMethodsFor(args.rail, args.products);
  if (!scope.ok) return { ok: false, error: scope.error };

  let result = await client.createTransactionIntention({
    location_id: args.locationId,
    action: 'tokenization',
    ...(scope.methods ? { methods: scope.methods } : {}),
  });
  let methodsEnforced = !!scope.methods;

  if (scope.methods && !result.status && isMethodsRejection(result.message)) {
    console.error(
      `[v1/intentions] Fortis rejected methods on a tokenization intention` +
        `${args.organizationId ? ` (org ${args.organizationId})` : ''}: ${result.message}`
    );
    result = await client.createTransactionIntention({ location_id: args.locationId, action: 'tokenization' });
    methodsEnforced = false;
  }

  if (!result.status || !result.clientToken) {
    return { ok: false, error: result.message || 'Failed to create tokenization intention' };
  }
  return {
    ok: true,
    clientToken: result.clientToken,
    productTransactionId: methodsEnforced && scope.methods ? scope.methods[0].product_transaction_id : null,
    ...(scope.methods ? { methodsEnforced } : {}),
  };
}
