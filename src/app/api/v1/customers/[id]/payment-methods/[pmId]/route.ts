/**
 * DELETE /api/v1/customers/:id/payment-methods/:pmId — Deactivate a saved payment method
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pmId: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id, pmId } = await params;
    const customerId = parseInt(id);
    const paymentMethodId = parseInt(pmId);

    if (isNaN(customerId) || isNaN(paymentMethodId)) {
      return apiError('Invalid ID', 400);
    }

    const source = await prisma.source.findFirst({
      where: {
        id: paymentMethodId,
        donorId: customerId,
        organizationId: auth.organizationId,
        isActive: true,
      },
    });

    if (!source) return apiError('Payment method not found', 404);

    await prisma.source.update({
      where: { id: paymentMethodId },
      data: { isActive: false, isDefault: false },
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-methods DELETE]', e);
    return apiError('Internal server error', 500);
  }
}
