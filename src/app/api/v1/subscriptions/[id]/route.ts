/**
 * GET    /api/v1/subscriptions/:id   — Get a subscription
 * PATCH  /api/v1/subscriptions/:id  — Update amount, frequency, next payment date, or payment method
 * DELETE /api/v1/subscriptions/:id  — Cancel a subscription
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const updateSchema = z.object({
  amount: z.number().int().min(50).optional(),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  nextPaymentOn: z.string().datetime({ offset: true }).optional(),
  // Swap the subscription onto a newly-vaulted card/bank source. Used by the
  // dunning card-fix flow: after a decline, vault a new source and PATCH it
  // here so the daily billing cron charges the good card going forward.
  paymentMethodId: z.number().int().positive().optional(),
});

function formatSub(s: {
  id: number; donorId: number; sourceId: number; amount: unknown;
  frequency: string; status: string; startOn: Date; nextPaymentOn: Date;
  lastPaymentOn: Date | null; successTrxns: number | null; failTrxns: number | null;
  createdAt: Date;
}) {
  return {
    id: s.id,
    customerId: s.donorId,
    paymentMethodId: s.sourceId,
    amount: Math.round(Number(s.amount) * 100),
    frequency: s.frequency,
    status: s.status === 'A' ? 'active' : 'cancelled',
    startOn: s.startOn.toISOString(),
    nextPaymentOn: s.nextPaymentOn.toISOString(),
    lastPaymentOn: s.lastPaymentOn?.toISOString() ?? null,
    successTrxns: s.successTrxns ?? 0,
    failTrxns: s.failTrxns ?? 0,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const subId = parseInt(id);
    if (isNaN(subId)) return apiError('Invalid subscription ID', 400);

    const sub = await prisma.subscription.findFirst({
      where: { id: subId, organizationId: auth.organizationId },
    });
    if (!sub) return apiError('Subscription not found', 404);

    return Response.json({ data: formatSub(sub) });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/subscriptions/:id GET]', e);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const subId = parseInt(id);
    if (isNaN(subId)) return apiError('Invalid subscription ID', 400);

    const existing = await prisma.subscription.findFirst({
      where: { id: subId, organizationId: auth.organizationId },
    });
    if (!existing) return apiError('Subscription not found', 404);
    if (existing.status === 'D') return apiError('Cannot update a cancelled subscription', 400);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount / 100;
    if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
    if (parsed.data.nextPaymentOn !== undefined) updateData.nextPaymentOn = new Date(parsed.data.nextPaymentOn);

    if (parsed.data.paymentMethodId !== undefined) {
      // The new source must belong to this subscription's customer and org, and
      // be active — same ownership check POST /subscriptions enforces.
      const source = await prisma.source.findFirst({
        where: {
          id: parsed.data.paymentMethodId,
          donorId: existing.donorId,
          organizationId: auth.organizationId,
          isActive: true,
        },
      });
      if (!source) return apiError('Payment method not found', 404);

      // Keep the denormalized fields the billing cron reads in sync with the
      // new source: the cron picks CC vs ACH off `subscription.source` and
      // charges `source.fortisWalletId`, so all of these must move together.
      updateData.sourceId = source.id;
      updateData.source = source.sourceType === 'ach' ? 'BNK' : 'CC';
      updateData.fortisWalletId = source.fortisWalletId;
      updateData.fortisCustomerId = source.fortisCustomerId;
    }

    const sub = await prisma.subscription.update({
      where: { id: subId },
      data: updateData,
    });

    return Response.json({ data: formatSub(sub) });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/subscriptions/:id PATCH]', e);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const subId = parseInt(id);
    if (isNaN(subId)) return apiError('Invalid subscription ID', 400);

    const existing = await prisma.subscription.findFirst({
      where: { id: subId, organizationId: auth.organizationId },
    });
    if (!existing) return apiError('Subscription not found', 404);
    if (existing.status === 'D') return apiError('Subscription is already cancelled', 400);

    await prisma.subscription.update({
      where: { id: subId },
      data: { status: 'D' },
    });

    return Response.json({ success: true, status: 'cancelled' });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/subscriptions/:id DELETE]', e);
    return apiError('Internal server error', 500);
  }
}
