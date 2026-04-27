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

    const session = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `INSERT INTO checkout_sessions 
        (token, organization_id, user_id, amount, currency, description, 
         customer_email, customer_name, customer_id, metadata, payment_methods,
         success_url, cancel_url, status, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'open', $14, NOW(), NOW())
       RETURNING id`,
      token,
      auth.organizationId,
      auth.userId,
      data.amount,
      data.currency,
      data.description || null,
      data.customer_email || null,
      data.customer_name || null,
      data.customer_id || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      paymentMethodsStr,
      data.success_url || null,
      data.cancel_url || null,
      expiresAt
    );

    const sessionId = session[0].id;

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

    let whereClause = 'WHERE organization_id = $1';
    const params: any[] = [auth.organizationId];

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, token, amount, currency, description, customer_email, customer_name,
              status, fortis_transaction_id, paid_at, expires_at, created_at, metadata
       FROM checkout_sessions ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params, limit, offset
    );

    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint as count FROM checkout_sessions ${whereClause}`,
      ...params
    );

    return Response.json({
      data: sessions.map((s: any) => ({
        id: s.id,
        token: s.token,
        amount: Number(s.amount),
        currency: s.currency,
        description: s.description,
        customer_email: s.customer_email,
        customer_name: s.customer_name,
        status: s.status,
        fortis_transaction_id: s.fortis_transaction_id,
        paid_at: s.paid_at,
        expires_at: s.expires_at,
        created_at: s.created_at,
        metadata: s.metadata ? JSON.parse(s.metadata) : null,
      })),
      total: Number(countResult[0].count),
      limit,
      offset,
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/checkout/sessions GET]', e);
    return apiError('Internal server error', 500);
  }
}
