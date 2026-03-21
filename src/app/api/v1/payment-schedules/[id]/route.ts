/**
 * GET    /api/v1/payment-schedules/:id — Get schedule details
 * DELETE /api/v1/payment-schedules/:id — Cancel a schedule
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSecretKey(request);
    const { id } = await params;
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) return apiError('Invalid schedule ID', 400);

    const schedule = await prisma.paymentSchedule.findFirst({
      where: { id: scheduleId, organizationId: auth.organizationId },
      include: {
        payments: { orderBy: { dueDate: 'asc' } },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!schedule) return apiError('Payment schedule not found', 404);

    return Response.json({ data: formatScheduleDetail(schedule) });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-schedules/:id GET]', e);
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
    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) return apiError('Invalid schedule ID', 400);

    const schedule = await prisma.paymentSchedule.findFirst({
      where: { id: scheduleId, organizationId: auth.organizationId },
    });

    if (!schedule) return apiError('Payment schedule not found', 404);
    if (schedule.status === 'cancelled') return apiError('Schedule is already cancelled', 400);

    await prisma.$transaction([
      prisma.paymentSchedule.update({
        where: { id: scheduleId },
        data: { status: 'cancelled' },
      }),
      prisma.scheduledPayment.updateMany({
        where: { scheduleId, status: 'pending' },
        data: { status: 'cancelled' },
      }),
    ]);

    const updated = await prisma.paymentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        payments: { orderBy: { dueDate: 'asc' } },
      },
    });

    return Response.json({ data: formatScheduleDetail(updated!) });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-schedules/:id DELETE]', e);
    return apiError('Internal server error', 500);
  }
}

function formatScheduleDetail(schedule: any) {
  return {
    id: schedule.id,
    customerId: schedule.customerId,
    customer: schedule.customer || undefined,
    paymentMethodId: schedule.sourceId,
    description: schedule.description,
    status: schedule.status,
    totalAmount: Math.round(Number(schedule.totalAmount) * 100),
    paidAmount: Math.round(Number(schedule.paidAmount) * 100),
    paymentsTotal: schedule.paymentsTotal,
    paymentsCompleted: schedule.paymentsCompleted,
    paymentsFailed: schedule.paymentsFailed,
    payments: schedule.payments?.map((p: any) => ({
      id: p.id,
      amount: Math.round(Number(p.amount) * 100),
      date: p.dueDate.toISOString().split('T')[0],
      status: p.status,
      transactionId: p.transactionId ? String(p.transactionId) : null,
      fortisTransactionId: p.fortisTransactionId,
      processedAt: p.processedAt,
      errorMessage: p.errorMessage,
    })),
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}
