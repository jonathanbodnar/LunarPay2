/**
 * POST /api/v1/charges — Charge a saved payment method
 *
 * Body:
 *   customerId      number   — LunarPay customer (donor) ID
 *   paymentMethodId number   — LunarPay source ID (saved card)
 *   amount          number   — Amount in cents (e.g. 5000 = $50.00)
 *   description     string?  — Optional description
 *   capture         boolean? — Default true. Set false to place an authorization
 *                              hold without settling. Capture later with
 *                              POST /api/v1/charges/:id/capture, or release the
 *                              hold with POST /api/v1/charges/:id/void.
 *                              ACH does not support auth-only — capture=false
 *                              returns 400 for ACH payment methods.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';
import { fireWebhook } from '@/lib/webhook';

const chargeSchema = z.object({
  customerId: z.number().int().positive('customerId is required'),
  paymentMethodId: z.number().int().positive('paymentMethodId is required'),
  amount: z.number().int().min(50, 'Minimum charge is $0.50 (50 cents)'),
  description: z.string().max(255).optional(),
  capture: z.boolean().optional().default(true),
  // Replay guard. Send a stable key derived from the thing being paid for
  // (checkout session + card + amount + day) and a retried request returns the
  // original charge instead of taking the money twice.
  idempotencyKey: z.string().min(8).max(64).optional(),
});

// Map the single-char DB status codes to the API vocabulary.
function chargeStatusLabel(status: string): string {
  switch (status) {
    case 'P': return 'paid';
    case 'N': return 'failed';
    case 'R': return 'refunded';
    case 'U': return 'pending';
    case 'A': return 'authorized';
    case 'V': return 'voided';
    // Dashboard-written legacy string statuses pass through as-is.
    default: return status;
  }
}

/**
 * GET /api/v1/charges — list charges for the merchant, filterable by
 * customer_id, status, and created_after/created_before (ISO dates).
 * Gives merchants a way to reconcile their mirrors charge-by-charge —
 * previously there was no read access to charges at all.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');
    const createdAfter = searchParams.get('created_after');
    const createdBefore = searchParams.get('created_before');

    const statusCode =
      status === 'paid' ? 'P'
      : status === 'failed' ? 'N'
      : status === 'refunded' ? 'R'
      : status === 'pending' ? 'U'
      : status === 'authorized' ? 'A'
      : status === 'voided' ? 'V'
      : null;

    const where = {
      organizationId: auth.organizationId,
      ...(customerId ? { donorId: parseInt(customerId) } : {}),
      ...(statusCode ? { status: statusCode } : {}),
      ...(createdAfter || createdBefore
        ? {
            createdAt: {
              ...(createdAfter ? { gte: new Date(createdAfter) } : {}),
              ...(createdBefore ? { lte: new Date(createdBefore) } : {}),
            },
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, donorId: true, totalAmount: true, subTotalAmount: true,
          status: true, source: true, subscriptionId: true,
          fortisTransactionId: true, createdAt: true, refundedAt: true,
          refundedAmount: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return Response.json({
      data: transactions.map((t) => {
        const amountCents = Math.round(Number(t.totalAmount) * 100);
        const refundedCents = Math.round(Number(t.refundedAmount ?? 0) * 100);
        return {
          id: t.id.toString(),
          customerId: t.donorId,
          amount: amountCents,
          subTotalAmount: Math.round(Number(t.subTotalAmount) * 100),
          status: chargeStatusLabel(t.status),
          paymentMethod: t.source === 'BNK' ? 'ach' : 'cc',
          subscriptionId: t.subscriptionId,
          fortisTransactionId: t.fortisTransactionId,
          createdAt: t.createdAt,
          refundedAt: t.refundedAt,
          refundedAmount: refundedCents,
          remainingRefundable: Math.max(0, amountCents - refundedCents),
        };
      }),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = chargeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { customerId, paymentMethodId, amount, description, capture, idempotencyKey } =
      parsed.data;

    // Replay check, before any money moves. An operator who re-submits — or a
    // client retrying a request that timed out after we'd already charged —
    // gets the original transaction back rather than a second charge.
    if (idempotencyKey) {
      const prior = await prisma.transaction.findFirst({
        where: { organizationId: auth.organizationId, idempotencyKey },
      });
      if (prior) {
        return Response.json(
          {
            data: {
              id: prior.id.toString(),
              amount: Math.round(Number(prior.totalAmount) * 100),
              status: chargeStatusLabel(prior.status),
              captured: prior.status === 'P',
              paymentMethod: prior.source === 'BNK' ? 'ach' : 'cc',
              customerId: prior.donorId,
              paymentMethodId,
              fortisTransactionId: prior.fortisTransactionId,
              description: description || null,
              createdAt: prior.createdAt,
              replayed: true,
            },
          },
          { status: 200 },
        );
      }
    }

    // Verify customer belongs to this org
    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

    // Fetch org webhook config for event delivery
    const org = await prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { webhookUrl: true, webhookSecret: true },
    });

    // Verify payment method belongs to this customer
    const source = await prisma.source.findFirst({
      where: { id: paymentMethodId, donorId: customerId, organizationId: auth.organizationId, isActive: true },
    });
    if (!source) return apiError('Payment method not found', 404);

    const isAch = source.sourceType === 'ach';

    // Auth-only is a credit-card concept — ACH debits clear asynchronously and
    // cannot be "held" the same way. Reject early so the caller doesn't get a
    // confusing Fortis error.
    if (!capture && isAch) {
      return apiError('Auth-only (capture: false) is not supported for ACH payment methods. Use a credit card.', 400);
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    // Route to the correct Fortis endpoint.
    //   ACH                     → debit/token (sale)
    //   CC + capture: true      → sale/token  (authorize + capture)
    //   CC + capture: false     → auth-only/token (hold only)
    const result = isAch
      ? await fortisClient.processACHDebit({
          transaction_amount: amount,
          token_id: source.fortisWalletId,
          location_id: auth.fortisLocationId || undefined,
          transaction_c1: description || undefined,
          transaction_c2: String(customerId),
        })
      : capture
        ? await fortisClient.processCreditCardSale({
            transaction_amount: amount,
            token_id: source.fortisWalletId,
            location_id: auth.fortisLocationId || undefined,
            transaction_c1: description || undefined,
            transaction_c2: String(customerId),
          })
        : await fortisClient.processCreditCardAuthOnly({
            transaction_amount: amount,
            token_id: source.fortisWalletId,
            location_id: auth.fortisLocationId || undefined,
            transaction_c1: description || undefined,
            transaction_c2: String(customerId),
          });

    if (!result.status) {
      // Persist the decline as a transaction row (status N) — declined API
      // charges used to leave no record at all, so neither the dashboard nor
      // merchant reconciliation could see them, and the charge.failed webhook
      // had no id merchants could dedupe on.
      let declinedTxId: string | null = null;
      try {
        const declined = await prisma.transaction.create({
          data: {
            userId: auth.userId,
            donorId: customerId,
            organizationId: auth.organizationId,
            totalAmount: amount / 100,
            subTotalAmount: amount / 100,
            fee: 0,
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phone: customer.phone || null,
            source: isAch ? 'BNK' : 'CC',
            status: 'N',
            givingSource: 'api',
            requestResponse: JSON.stringify(result),
          },
        });
        declinedTxId = declined.id.toString();
      } catch (err) {
        console.error('[v1/charges] Failed to record declined transaction:', err);
      }
      fireWebhook(
        org?.webhookUrl,
        org?.webhookSecret,
        'charge.failed',
        auth.organizationId,
        {
          transaction_id: declinedTxId,
          customer_id: customerId,
          payment_method_id: paymentMethodId,
          amount_cents: amount,
          currency: 'USD',
          payment_method: isAch ? 'ach' : 'cc',
          error: result.message || 'Charge declined',
          description: description || null,
        },
      );
      return apiError(result.message || 'Charge failed', 402);
    }

    const fortisTransactionId = result.transaction?.id || null;
    const amountInDollars = amount / 100;

    // Status convention in epicpay_customer_transactions.status:
    //   P = Paid (sale captured)
    //   N = Failed
    //   R = Refunded
    //   U = Pending (ACH waiting for clearance)
    //   A = Authorized (auth-only hold — awaiting capture or void)
    //   V = Voided
    const status = isAch
      ? 'U'
      : capture
        ? 'P'
        : 'A';

    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        donorId: customerId,
        organizationId: auth.organizationId,
        totalAmount: amountInDollars,
        subTotalAmount: amountInDollars,
        fee: 0,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || null,
        source: isAch ? 'BNK' : 'CC',
        status,
        givingSource: 'api',
        transactionType: !capture ? 'authonly' : undefined,
        fortisTransactionId,
        requestResponse: JSON.stringify(result.transaction),
        idempotencyKey: idempotencyKey ?? null,
      },
    });

    // Only count toward customer totals when the money actually moves.
    // Auth-only holds don't settle until capture, so skip the increment until
    // capture happens.
    if (capture) {
      await prisma.donor.update({
        where: { id: customerId },
        data: {
          amountAcum: { increment: amountInDollars },
          firstDate: customer.firstDate ?? new Date(),
        },
      });
    }

    // Outbound webhook for charge success — best-effort
    fireWebhook(
      org?.webhookUrl,
      org?.webhookSecret,
      'charge.succeeded',
      auth.organizationId,
      {
        transaction_id: transaction.id.toString(),
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        amount_cents: amount,
        currency: 'USD',
        payment_method: isAch ? 'ach' : 'cc',
        status: isAch ? 'pending' : capture ? 'paid' : 'authorized',
        captured: !!capture && !isAch,
        fortis_transaction_id: fortisTransactionId,
        description: description || null,
      },
    );

    const responseStatus = isAch ? 'pending' : capture ? 'paid' : 'authorized';

    return Response.json({
      data: {
        id: transaction.id.toString(),
        amount,
        status: responseStatus,
        captured: !!capture && !isAch,
        paymentMethod: isAch ? 'ach' : 'cc',
        customerId,
        paymentMethodId,
        fortisTransactionId,
        description: description || null,
        createdAt: transaction.createdAt,
        ...(isAch
          ? { note: 'ACH transactions take 3–5 business days to clear. Final status is delivered via webhook.' }
          : !capture
            ? { note: 'Hold placed. Capture within your authorization window (typically 7 days) via POST /api/v1/charges/:id/capture, or release the hold via POST /api/v1/charges/:id/void.' }
            : {}),
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges POST]', e);
    return apiError('Internal server error', 500);
  }
}
