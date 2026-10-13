/**
 * Production wiring for lib/fortis/ach-settlement.ts: the real database, the
 * merchant's own Fortis credentials, and the same webhook sender POST
 * /api/v1/charges uses. Only call from inside a route handler — deliveries are
 * deferred with after().
 */

import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { deliverWebhook } from '@/lib/webhook';
import { logPaymentStatusUpdated } from '@/lib/payment-logger';
import type { AchReconcileDeps } from '@/lib/fortis/ach-settlement';

export function achSettlementDeps(): AchReconcileDeps {
  return {
    db: prisma,

    async fetchTransaction(org, fortisTransactionId) {
      try {
        // Environment comes from FORTIS_ENVIRONMENT / fortis_environment, as for
        // every other merchant-credential call.
        const client = createFortisClient(undefined, org.fortisUserId, org.fortisApiKey);
        const res = await client.getTransaction(fortisTransactionId, { timeout: 15000 });
        if (res.status && res.transaction) return { ok: true, transaction: res.transaction };
        return { ok: false, httpStatus: res.httpStatus, message: res.message || 'Fortis transaction read failed' };
      } catch (err) {
        return { ok: false, message: (err as Error).message || 'Fortis client unavailable' };
      }
    },

    deliver(org, event, data) {
      // Deferred, as for merchant.approved: delivery retries with backoff
      // (up to ~36s), which must not eat the cron's time budget or hold a
      // Fortis postback response open. The transition is already committed, and
      // GET /api/v1/charges/:id reflects it even if every attempt fails.
      after(() => deliverWebhook(org.webhookUrl, org.webhookSecret, event, org.organizationId, data));
    },

    async logTransition({ tx, transition, origin }) {
      const outcome = transition.outcome;
      await logPaymentStatusUpdated(
        tx.fortisTransactionId ?? '',
        tx.status,
        transition.to.status,
        tx.id,
        {
          origin,
          source: 'BNK',
          status_ach_from: tx.statusAch,
          status_ach_to: transition.to.statusAch,
          event: transition.event,
          fortis_status_code: outcome.statusCode,
          ...(outcome.kind === 'failed'
            ? { failure: outcome.reason, reason_code: outcome.reasonCodeId, return_code: outcome.returnCode }
            : {}),
        }
      );
    },
  };
}
