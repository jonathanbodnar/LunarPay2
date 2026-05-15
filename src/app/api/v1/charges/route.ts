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

const chargeSchema = z.object({
  customerId: z.number().int().positive('customerId is required'),
  paymentMethodId: z.number().int().positive('paymentMethodId is required'),
  amount: z.number().int().min(50, 'Minimum charge is $0.50 (50 cents)'),
  description: z.string().max(255).optional(),
  capture: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = chargeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { customerId, paymentMethodId, amount, description, capture } = parsed.data;

    // Verify customer belongs to this org
    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

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
