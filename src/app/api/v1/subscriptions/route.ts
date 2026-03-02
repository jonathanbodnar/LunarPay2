/**
 * GET  /api/v1/subscriptions  — List subscriptions
 * POST /api/v1/subscriptions  — Create a subscription
 *
 * Frequencies: weekly | monthly | quarterly | yearly
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const VALID_FREQUENCIES = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;

const createSchema = z.object({
  customerId: z.number().int().positive('customerId is required'),
  paymentMethodId: z.number().int().positive('paymentMethodId is required'),
  amount: z.number().int().min(50, 'Minimum amount is 50 cents'),
  frequency: z.enum(VALID_FREQUENCIES),
  startOn: z.string().datetime({ offset: true }).optional(), // ISO date string; defaults to today
  description: z.string().max(255).optional(),
});

function addFrequency(date: Date, frequency: string): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active' | 'cancelled'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

    const where = {
      organizationId: auth.organizationId,
      ...(status === 'active' ? { status: 'A' } : status === 'cancelled' ? { status: 'D' } : {}),
    };

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, donorId: true, sourceId: true, amount: true, frequency: true,
          status: true, startOn: true, nextPaymentOn: true, lastPaymentOn: true,
          successTrxns: true, failTrxns: true, createdAt: true,
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return Response.json({
      data: subscriptions.map(s => ({
        ...s,
        amount: Number(s.amount) * 100, // return in cents
        status: s.status === 'A' ? 'active' : 'cancelled',
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/subscriptions GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { customerId, paymentMethodId, amount, frequency, startOn } = parsed.data;

    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

    const source = await prisma.source.findFirst({
      where: { id: paymentMethodId, donorId: customerId, organizationId: auth.organizationId, isActive: true },
    });
    if (!source) return apiError('Payment method not found', 404);

    const startDate = startOn ? new Date(startOn) : new Date();
    const nextPaymentDate = addFrequency(startDate, frequency);

    const subscription = await prisma.subscription.create({
      data: {
        donorId: customerId,
        organizationId: auth.organizationId,
        sourceId: paymentMethodId,
        amount: amount / 100, // store in dollars
        frequency,
        status: 'A',
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        givingSource: 'api',
        source: source.sourceType === 'ach' ? 'BNK' : 'CC',
        fortisWalletId: source.fortisWalletId,
        fortisCustomerId: source.fortisCustomerId,
        startOn: startDate,
        nextPaymentOn: nextPaymentDate,
      },
    });

    return Response.json({
      data: {
        id: subscription.id,
        customerId,
        paymentMethodId,
        amount, // return in cents
        frequency,
        status: 'active',
        startOn: startDate.toISOString(),
        nextPaymentOn: nextPaymentDate.toISOString(),
        createdAt: subscription.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/subscriptions POST]', e);
    return apiError('Internal server error', 500);
  }
}
