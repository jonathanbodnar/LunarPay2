/**
 * POST /api/v1/payment-schedules — Create a payment schedule
 * GET  /api/v1/payment-schedules — List payment schedules
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireSecretKey, ApiAuthError, apiError } from '@/lib/api-auth';

const paymentItemSchema = z.object({
  amount: z.number().int().min(50, 'Minimum payment is $0.50 (50 cents)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

const createSchema = z.object({
  customerId: z.number().int().positive('customerId is required'),
  paymentMethodId: z.number().int().positive('paymentMethodId is required'),
  payments: z.array(paymentItemSchema).min(1, 'At least one payment is required').max(100),
  description: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { customerId, paymentMethodId, payments, description } = parsed.data;

    const customer = await prisma.donor.findFirst({
      where: { id: customerId, organizationId: auth.organizationId },
    });
    if (!customer) return apiError('Customer not found', 404);

    const source = await prisma.source.findFirst({
      where: { id: paymentMethodId, donorId: customerId, organizationId: auth.organizationId, isActive: true },
    });
    if (!source) return apiError('Payment method not found', 404);

    const totalAmountCents = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalAmountDollars = totalAmountCents / 100;

    const schedule = await prisma.paymentSchedule.create({
      data: {
        organizationId: auth.organizationId,
        customerId,
        sourceId: paymentMethodId,
        description: description || null,
        status: 'active',
        totalAmount: totalAmountDollars,
        paidAmount: 0,
        paymentsTotal: payments.length,
        paymentsCompleted: 0,
        paymentsFailed: 0,
        payments: {
          create: payments.map(p => ({
            amount: p.amount / 100,
            dueDate: new Date(p.date + 'T00:00:00Z'),
            status: 'pending',
          })),
        },
      },
      include: {
        payments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    return Response.json({
      data: formatSchedule(schedule),
    }, { status: 201 });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-schedules POST]', e);
    return apiError('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSecretKey(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

    const where: any = { organizationId: auth.organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = parseInt(customerId);

    const [schedules, total] = await Promise.all([
      prisma.paymentSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: {
            orderBy: { dueDate: 'asc' },
          },
        },
      }),
      prisma.paymentSchedule.count({ where }),
    ]);

    return Response.json({
      data: schedules.map(formatSchedule),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/payment-schedules GET]', e);
    return apiError('Internal server error', 500);
  }
}

function formatSchedule(schedule: any) {
  return {
    id: schedule.id,
    customerId: schedule.customerId,
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
      processedAt: p.processedAt,
      errorMessage: p.errorMessage,
    })),
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}
