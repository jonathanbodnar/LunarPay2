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

const createSessionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(500).optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().max(200).optional(),
  customer_id: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
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

    // Use the typed Prisma client rather than $queryRawUnsafe so the parameter
    // binding is driver-managed (the raw path was failing on JSON-string values
    // for the metadata column — Prisma's unsafe-raw binder mishandles strings
    // that look like array/json literals over the transaction-mode pooler).
    // Bonus: any future schema additions (new columns) flow through automatically
    // — no more "raw INSERT forgot a column" 500s.
    const session = await prisma.checkoutSession.create({
      data: {
        token,
        organizationId: auth.organizationId,
        userId: auth.userId,
        amount: data.amount,
        currency: data.currency,
        description: data.description ?? null,
        customerEmail: data.customer_email ?? null,
        customerName: data.customer_name ?? null,
        customerId: data.customer_id ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        paymentMethods: paymentMethodsStr,
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
      amount: data.amount,
      currency: data.currency,
      description: data.description || null,
      payment_methods: data.payment_methods,
      expires_at: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/checkout/sessions POST]', e);
    // TEMP: include error detail in body when ?debug=<CRON_ADMIN_KEY> is passed,
    // so we can root-cause the metadata 500 without Railway log access. Remove
    // once the underlying bug is fixed.
    const debugKey = new URL(request.url).searchParams.get('debug');
    if (debugKey && process.env.CRON_ADMIN_KEY && debugKey === process.env.CRON_ADMIN_KEY) {
      return Response.json({
        error: 'Internal server error',
        debug: {
          name: e?.name ?? null,
          message: e?.message ?? String(e),
          code: e?.code ?? null,
          meta: e?.meta ?? null,
          stack: typeof e?.stack === 'string' ? e.stack.split('\n').slice(0, 8) : null,
        },
      }, { status: 500 });
    }
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
          paidAt: true,
          expiresAt: true,
          createdAt: true,
          metadata: true,
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
        paid_at: s.paidAt,
        expires_at: s.expiresAt,
        created_at: s.createdAt,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
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
