/**
 * Production wiring for lib/fortis/ach-settlement.ts: the real database, the
 * merchant's own Fortis credentials, the durable webhook outbox and the same
 * signed sender POST /api/v1/charges uses. Only call from inside a route
 * handler — deliveries are deferred with after().
 *
 * Environment:
 *   ACH_CHARGE_EVENTS_SINCE  ISO timestamp (set to the deploy time). Debits
 *                            created at or after it through POST /v1/charges or
 *                            a subscription renewal are announced; unset, the
 *                            reconcile updates statuses and announces nothing.
 *   fortis_environment       'prd' → production, anything else sandbox — read
 *                            exactly as POST /api/v1/charges reads it, so the
 *                            debit and its reconcile always hit the same Fortis.
 */

import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { deliverWebhook } from '@/lib/webhook';
import { logPaymentStatusUpdated } from '@/lib/payment-logger';
import { sendEmail } from '@/lib/email';
import { deliverOutboxEntries, type OutboxDeps, type OutboxGiveUp } from '@/lib/webhook-outbox';
import { parseChargeEventsSince, type AchReconcileDeps } from '@/lib/fortis/ach-settlement';

function fortisEnvironment(): 'sandbox' | 'production' {
  const fortisEnv = process.env.fortis_environment || 'dev';
  return fortisEnv === 'prd' ? 'production' : 'sandbox';
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Same channel as the onboarding reconciliation's ops alerts. */
async function alertOpsOfGiveUp(entry: OutboxGiveUp): Promise<void> {
  const to = process.env.ADMIN_EMAIL || process.env.ONBOARDING_ALERT_EMAIL;
  if (!to) return;
  const lines = [
    `LunarPay could not deliver ${entry.event} to organization ${entry.organizationId}'s webhook after ${entry.attempts} attempts and has stopped trying.`,
    ...(entry.transactionId != null ? [`Transaction: ${entry.transactionId}`] : []),
    `Last error: ${(entry.lastError ?? 'unknown').slice(0, 500)}`,
    '',
    'The merchant does not know about this event. Every attempt is in webhook_deliveries. Once their endpoint is fixed, re-queue it with:',
    `update webhook_outbox set status = 'pending', attempts = 0, next_attempt_at = now() where id = ${entry.id};`,
  ];
  await sendEmail({
    to,
    subject: `[LunarPay] ${entry.event} undelivered to organization ${entry.organizationId} after ${entry.attempts} attempts`,
    category: 'transactional',
    text: lines.join('\n'),
    html: lines.filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join(''),
  });
}

export function outboxDeps(): OutboxDeps {
  return {
    db: prisma,
    send: (webhookUrl, webhookSecret, event, organizationId, data) =>
      deliverWebhook(webhookUrl, webhookSecret, event, organizationId, data),
    onGiveUp: alertOpsOfGiveUp,
  };
}

export function achSettlementDeps(): AchReconcileDeps {
  return {
    db: prisma,

    async fetchTransaction(org, fortisTransactionId) {
      try {
        const client = createFortisClient(fortisEnvironment(), org.fortisUserId, org.fortisApiKey);
        const res = await client.getTransaction(fortisTransactionId, { timeout: 15000 });
        if (res.status && res.transaction) return { ok: true, transaction: res.transaction };
        return { ok: false, httpStatus: res.httpStatus, message: res.message || 'Fortis transaction read failed' };
      } catch (err) {
        return { ok: false, message: (err as Error).message || 'Fortis client unavailable' };
      }
    },

    dispatch(outboxIds) {
      // Deferred: the signed sender retries with backoff (up to ~36s), which
      // must not eat the cron's time budget or hold a Fortis postback open.
      // Anything that fails here stays pending in webhook_outbox and is re-sent
      // by the next reconcile run.
      after(() => deliverOutboxEntries(outboxDeps(), outboxIds));
    },

    chargeEventsSince: parseChargeEventsSince(process.env.ACH_CHARGE_EVENTS_SINCE),

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
