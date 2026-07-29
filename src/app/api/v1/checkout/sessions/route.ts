/**
 * POST /api/v1/checkout/sessions — Create a hosted checkout session
 * GET  /api/v1/checkout/sessions — List checkout sessions
 *
 * Uses your SECRET key (lp_sk_...).
 * Returns a URL hosted on app.lunarpay.com where the customer completes payment.
 * This solves Fortis domain whitelisting — the payment form always runs on LunarPay's domain.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const RECURRING_FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;

const recurringConfigSchema = z.object({
  frequency: z.enum(RECURRING_FREQUENCIES),
  // Per-period amount in dollars. Defaults to the session `amount` (i.e. the
  // first charge equals every recurring charge). Override when the first
  // payment is a setup fee or partial period that differs from the recurring
  // amount.
  amount: z.number().positive().optional(),
  // Same value in integer cents. See the note on `amount_cents` below.
  amount_cents: z.number().int().positive().optional(),
  // ISO date for the FIRST recurring charge after the initial one. Defaults
  // to (today + 1 frequency interval).
  start_on: z.string().datetime({ offset: true }).optional(),
  // Trial mode: save the card at checkout without charging. The session
  // `amount` becomes the recurring amount and no money is collected until the
  // first billing cycle. `start_on` determines when the first charge occurs.
  trial: z.boolean().optional(),
});

const installmentsConfigSchema = z.object({
  // Total number of payments in the plan, INCLUDING the one paid at checkout.
  // count=3 means the customer pays one now and two more on schedule.
  count: z.number().int().min(2).max(60),
  frequency: z.enum(RECURRING_FREQUENCIES),
  // Per-installment amount in dollars. Defaults to the session `amount` (i.e.
  // every installment is the same as the first).
  amount: z.number().positive().optional(),
  // Same value in integer cents. See the note on `amount_cents` below.
  amount_cents: z.number().int().positive().optional(),
  // ISO date for installment #2. Defaults to (today + 1 frequency interval).
  start_on: z.string().datetime({ offset: true }).optional(),
});

const createSessionSchema = z.object({
  // DOLLARS — 25.00 means $25.00. This endpoint has always taken dollars while
  // /v1/charges, /v1/subscriptions and /v1/payment-schedules take integer
  // cents, and nothing validates the difference: a caller sending 2500 here
  // meaning $25.00 creates a $2,500.00 session and only finds out when the
  // customer is asked to pay it. Kept as-is for existing integrations.
  amount: z.number().positive('Amount must be positive').optional(),
  // CENTS — the unambiguous way in, matching every other money field in the
  // API. Send this instead of `amount` and the unit is stated by the name.
  amount_cents: z.number().int().positive('amount_cents must be a positive integer').optional(),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(500).optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().max(200).optional(),
  customer_id: z.number().int().optional(),
  // Zod 4 requires both key and value schemas for z.record. Calling
  // z.record(z.any()) silently leaves the value schema undefined, which
  // crashes with "Cannot read properties of undefined (reading '_zod')"
  // the moment the metadata object contains at least one key.
  metadata: z.record(z.string(), z.any()).optional(),
  success_url: z.string().url().max(2000).optional(),
  cancel_url: z.string().url().max(2000).optional(),
  expires_in: z.number().int().min(300).max(86400).default(3600), // seconds, default 1hr
  /**
   * Payment methods to allow on the hosted page.
   * - ['cc']       — credit card only
   * - ['ach']      — bank account (eCheck) only
   * - ['cc','ach'] — both (default)
   */
  payment_methods: z.array(z.enum(['cc', 'ach'])).min(1).max(2).optional().default(['cc', 'ach']),

  /**
   * What happens after the customer completes the first charge.
   * - "payment"      — one-off (default)
   * - "subscription" — auto-create a recurring Subscription against the saved card
   * - "installments" — auto-create a fixed-count PaymentSchedule for the remaining payments
   */
  mode: z.enum(['payment', 'subscription', 'installments']).optional().default('payment'),
  recurring: recurringConfigSchema.optional(),
  installments: installmentsConfigSchema.optional(),
}).superRefine((val, ctx) => {
  // Exactly one unit per amount. Accepting both invites them to disagree, and
  // silently picking a winner is how the wrong one ships.
  const amountPairs: Array<{
    path: (string | number)[];
    dollars: number | undefined;
    cents: number | undefined;
    label: string;
  }> = [
    { path: ['amount_cents'], dollars: val.amount, cents: val.amount_cents, label: 'amount' },
    {
      path: ['recurring', 'amount_cents'],
      dollars: val.recurring?.amount,
      cents: val.recurring?.amount_cents,
      label: 'recurring.amount',
    },
    {
      path: ['installments', 'amount_cents'],
      dollars: val.installments?.amount,
      cents: val.installments?.amount_cents,
      label: 'installments.amount',
    },
  ];

  for (const p of amountPairs) {
    if (p.dollars !== undefined && p.cents !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: p.path,
        message: `Send either ${p.label} (dollars) or ${p.label}_cents (integer cents), not both`,
      });
    }
  }

  if (val.amount === undefined && val.amount_cents === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['amount'],
      message: 'Either amount (dollars) or amount_cents (integer cents) is required',
    });
  }

  if (val.mode === 'subscription' && !val.recurring) {
    ctx.addIssue({
      code: 'custom',
      path: ['recurring'],
      message: 'recurring is required when mode is "subscription"',
    });
  }
  if (val.mode === 'installments' && !val.installments) {
    ctx.addIssue({
      code: 'custom',
      path: ['installments'],
      message: 'installments is required when mode is "installments"',
    });
  }
});

function generateSessionToken(): string {
  return 'cs_' + crypto.randomBytes(32).toString('base64url');
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const paymentMethodsStr = [...new Set(data.payment_methods)].join(',');

    // Collapse both accepted units down to dollars at the edge. Everything
    // past this point — the stored row, modeConfig, and the completion handler
    // that reads it back — keeps working in dollars exactly as before.
    const amountDollars = data.amount_cents !== undefined
      ? data.amount_cents / 100
      : data.amount!;

    const recurringConfig = data.recurring
      ? {
          ...data.recurring,
          amount: data.recurring.amount_cents !== undefined
            ? data.recurring.amount_cents / 100
            : data.recurring.amount,
          amount_cents: undefined,
        }
      : undefined;

    const installmentsConfig = data.installments
      ? {
          ...data.installments,
          amount: data.installments.amount_cents !== undefined
            ? data.installments.amount_cents / 100
            : data.installments.amount,
          amount_cents: undefined,
        }
      : undefined;

    // Use the typed Prisma client rather than $queryRawUnsafe so the parameter
    // binding is driver-managed (the raw path was failing on JSON-string values
    // for the metadata column — Prisma's unsafe-raw binder mishandles strings
    // that look like array/json literals over the transaction-mode pooler).
    // Bonus: any future schema additions (new columns) flow through automatically
    // — no more "raw INSERT forgot a column" 500s.
    // Persist the mode-specific config alongside the row so the completion
    // handler can read it back without hitting another store.
    const modeConfig =
      data.mode === 'subscription' && recurringConfig
        ? { recurring: recurringConfig }
        : data.mode === 'installments' && installmentsConfig
        ? { installments: installmentsConfig }
        : null;

    const session = await prisma.checkoutSession.create({
      data: {
        token,
        organizationId: auth.organizationId,
        userId: auth.userId,
        amount: amountDollars,
        currency: data.currency,
        description: data.description ?? null,
        customerEmail: data.customer_email ?? null,
        customerName: data.customer_name ?? null,
        customerId: data.customer_id ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        paymentMethods: paymentMethodsStr,
        mode: data.mode,
        modeConfig: modeConfig ?? undefined,
        successUrl: data.success_url ?? null,
        cancelUrl: data.cancel_url ?? null,
        status: 'open',
        expiresAt,
      },
      select: { id: true },
    });

    const sessionId = session.id;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com';
    const checkoutUrl = `${baseUrl}/pay/${token}`;

    return Response.json({
      id: sessionId,
      token,
      url: checkoutUrl,
      status: 'open',
      amount: amountDollars,
      // Echoed back so the caller can assert the unit landed the way they meant
      // it to, without inferring anything from a decimal that happens to be round.
      amount_cents: Math.round(amountDollars * 100),
      currency: data.currency,
      description: data.description || null,
      payment_methods: data.payment_methods,
      mode: data.mode,
      ...(data.mode === 'subscription' ? { recurring: recurringConfig } : {}),
      ...(data.mode === 'installments' ? { installments: installmentsConfig } : {}),
      expires_at: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/checkout/sessions POST]', e);
    return apiError('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = {
      organizationId: auth.organizationId,
      ...(status ? { status } : {}),
    };

    const [sessions, total] = await Promise.all([
      prisma.checkoutSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          token: true,
          amount: true,
          currency: true,
          description: true,
          customerEmail: true,
          customerName: true,
          status: true,
          fortisTransactionId: true,
          transactionId: true,
          paidAt: true,
          expiresAt: true,
          createdAt: true,
          metadata: true,
          mode: true,
          modeConfig: true,
          subscriptionId: true,
          paymentScheduleId: true,
          donorId: true,
        },
      }),
      prisma.checkoutSession.count({ where }),
    ]);

    return Response.json({
      data: sessions.map((s) => ({
        id: s.id,
        token: s.token,
        amount: Number(s.amount),
        currency: s.currency,
        description: s.description,
        customer_email: s.customerEmail,
        customer_name: s.customerName,
        status: s.status,
        fortis_transaction_id: s.fortisTransactionId,
        transaction_id: s.transactionId ? String(s.transactionId) : null,
        paid_at: s.paidAt,
        expires_at: s.expiresAt,
        created_at: s.createdAt,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
        mode: s.mode,
        mode_config: s.modeConfig ?? null,
        // Resources auto-created on completion based on mode (null until paid).
        customer_id: s.donorId,
        subscription_id: s.subscriptionId,
        payment_schedule_id: s.paymentScheduleId,
      })),
      total,
      limit,
      offset,
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/checkout/sessions GET]', e);
    return apiError('Internal server error', 500);
  }
}
