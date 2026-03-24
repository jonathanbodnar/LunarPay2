/**
 * GET /api/v1/checkout/sessions/:id — Get checkout session status
 *
 * Uses your SECRET key (lp_sk_...).
 * Returns session details including payment status.
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

    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return apiError('Invalid session ID', 400);
    }

    const sessions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, token, organization_id, amount, currency, description,
              customer_email, customer_name, customer_id, metadata,
              success_url, cancel_url, status, transaction_id,
              fortis_transaction_id, paid_at, expires_at, created_at
       FROM checkout_sessions
       WHERE id = $1 AND organization_id = $2
       LIMIT 1`,
      sessionId,
      auth.organizationId
    );

    if (!sessions.length) {
      return apiError('Checkout session not found', 404);
    }

    const s = sessions[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lunarpay.com';

    return Response.json({
      id: s.id,
      token: s.token,
      url: `${baseUrl}/pay/${s.token}`,
      amount: Number(s.amount),
      currency: s.currency,
      description: s.description,
      customer_email: s.customer_email,
      customer_name: s.customer_name,
      customer_id: s.customer_id,
      status: s.status,
      transaction_id: s.transaction_id ? s.transaction_id.toString() : null,
      fortis_transaction_id: s.fortis_transaction_id,
      paid_at: s.paid_at,
      expires_at: s.expires_at,
      created_at: s.created_at,
      metadata: s.metadata ? JSON.parse(s.metadata) : null,
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/checkout/sessions/:id GET]', e);
    return apiError('Internal server error', 500);
  }
}
