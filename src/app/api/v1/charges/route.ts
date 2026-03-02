/**
 * POST /api/v1/charges — Charge a saved payment method
 *
 * Body:
 *   customerId      number   — LunarPay customer (donor) ID
 *   paymentMethodId number   — LunarPay source ID (saved card)
 *   amount          number   — Amount in cents (e.g. 5000 = $50.00)
 *   description     string?  — Optional description
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
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = chargeSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { customerId, paymentMethodId, amount, description } = parsed.data;

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

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    // Charge the saved card using the wallet token
    const result = await fortisClient.processCreditCardSale({
      transaction_amount: amount, // already in cents
      token_id: source.fortisWalletId,
      location_id: auth.fortisLocationId || undefined,
      client_customer_id: String(customerId),
      transaction_c1: description || 'API charge',
    });

    if (!result.status) {
      return apiError(result.message || 'Charge failed', 402);
    }

    const fortisTransactionId = result.transaction?.id || null;
    const amountInDollars = amount / 100;

    // Record the transaction
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
        source: source.sourceType === 'ach' ? 'BNK' : 'CC',
        status: 'P',
        givingSource: 'api',
        fortisTransactionId,
        requestResponse: JSON.stringify(result.transaction),
      },
    });

    // Update customer totals
    await prisma.donor.update({
      where: { id: customerId },
      data: {
        amountAcum: { increment: amountInDollars },
        firstDate: customer.firstDate ?? new Date(),
      },
    });

    return Response.json({
      data: {
        id: transaction.id.toString(),
        amount,
        status: 'paid',
        customerId,
        paymentMethodId,
        fortisTransactionId,
        description: description || null,
        createdAt: transaction.createdAt,
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/charges POST]', e);
    return apiError('Internal server error', 500);
  }
}
