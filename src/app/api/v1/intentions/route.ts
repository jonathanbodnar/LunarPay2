/**
 * POST /api/v1/intentions — Create a Fortis payment intention (client-side use)
 *
 * Use your PUBLISHABLE key (lp_pk_...) for this endpoint.
 * Returns a clientToken to initialize the Fortis Elements iframe.
 *
 * Body:
 *   action          'tokenization' | 'sale'  — Intention type:
 *                     'tokenization' — vault card with NO charge (preferred for saving cards)
 *                     'sale'         — one-time transaction (requires amount)
 *                     omit           — defaults based on other fields (legacy)
 *
 *   amount          number                — Amount in cents (required for sale/one-time)
 *   hasRecurring    boolean               — Legacy: if true, ticket intention ($0.01 charge). Use action:'tokenization' instead.
 *
 *   // Preferred: declare which payment methods Elements should expose
 *   paymentMethods  ['cc'] | ['ach'] | ['cc','ach']
 *     - ['cc']        — credit card tab only (suppresses ACH/eCheck)
 *     - ['ach']       — bank account / eCheck tab only (suppresses card)
 *     - ['cc','ach']  — both tabs (default if omitted)
 *
 *   // Legacy / shorthand (still supported for backward compatibility)
 *   paymentMethod   'cc' | 'ach' | 'any'   — equivalent to the array form above
 *
 * If both are provided, paymentMethods (plural array) wins.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requirePublishableKey, ApiAuthError, apiError } from '@/lib/api-auth';

const intentionSchema = z.object({
  action: z.enum(['tokenization', 'sale']).optional(),
  amount: z.number().int().min(0).optional(),
  hasRecurring: z.boolean().optional().default(false),
  paymentMethod: z.enum(['cc', 'ach', 'any']).optional(),
  paymentMethods: z.array(z.enum(['cc', 'ach'])).min(1).max(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePublishableKey(request);
    const body = await request.json();
    const parsed = intentionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { action, amount, hasRecurring } = parsed.data;

    // Resolve the effective payment-method scope.
    // Precedence: paymentMethods (plural array) > paymentMethod (singular legacy) > 'any'.
    let paymentMethod: 'cc' | 'ach' | 'any';
    if (parsed.data.paymentMethods && parsed.data.paymentMethods.length > 0) {
      const set = new Set(parsed.data.paymentMethods);
      if (set.has('cc') && set.has('ach')) {
        paymentMethod = 'any';
      } else if (set.has('cc')) {
        paymentMethod = 'cc';
      } else {
        paymentMethod = 'ach';
      }
    } else {
      paymentMethod = parsed.data.paymentMethod ?? 'any';
    }

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    let locationId = auth.fortisLocationId;

    if (!locationId) {
      const locResult = await fortisClient.getLocations();
      if (locResult.status && locResult.locations?.length) {
        locationId = locResult.locations[0].id;
        await prisma.fortisOnboarding.updateMany({
          where: { organizationId: auth.organizationId },
          data: { locationId },
        });
      } else {
        return apiError('Payment location not configured for this merchant', 503);
      }
    }

    // Resolve the product_transaction_id for the requested payment method.
    // When paymentMethod is 'any' we don't pass one, letting Fortis Elements
    // render the tabs for every product enabled on the merchant's location.
    let productTransactionId: string | null = null;
    if (paymentMethod === 'cc') {
      productTransactionId = auth.fortisCcProductTransactionId;
      if (!productTransactionId) {
        return apiError(
          'Credit card processing is not enabled for this merchant. Contact support to enable a CC product.',
          400
        );
      }
    } else if (paymentMethod === 'ach') {
      productTransactionId = auth.fortisAchProductTransactionId;
      if (!productTransactionId) {
        return apiError(
          'ACH (eCheck) processing is not enabled for this merchant. Contact support to enable an ACH product.',
          400
        );
      }
    }

    // ── TOKENIZATION intention (preferred card-save path — no charge) ──────
    if (action === 'tokenization') {
      const intentionData: {
        location_id: string;
        action: 'tokenization';
        product_transaction_id?: string;
      } = { location_id: locationId, action: 'tokenization' };
      if (productTransactionId) intentionData.product_transaction_id = productTransactionId;
      const result = await fortisClient.createTransactionIntention(intentionData);
      if (!result.status || !result.clientToken) {
        return apiError(result.message || 'Failed to create tokenization intention', 400);
      }
      return Response.json({
        clientToken: result.clientToken,
        intentionType: 'tokenization',
        paymentMethod,
        locationId,
        productTransactionId: productTransactionId || null,
        environment: env,
      });
    }

    // ── TICKET intention (legacy — $0.01 charge + refund) ────────────────
    if (hasRecurring) {
      const ticketData: { location_id: string; product_transaction_id?: string } = { location_id: locationId };
      if (productTransactionId) ticketData.product_transaction_id = productTransactionId;
      const result = await fortisClient.createTicketIntention(ticketData);
      if (!result.status || !result.clientToken) {
        return apiError(result.message || 'Failed to create payment intention', 400);
      }
      return Response.json({
        clientToken: result.clientToken,
        intentionType: 'ticket',
        paymentMethod,
        locationId,
        productTransactionId: productTransactionId || null,
        environment: env,
        amount: amount ?? 0,
      });
    }

    // ── TRANSACTION (sale) intention ──────────────────────────────────────
    const intentionData: {
      location_id: string;
      action: 'sale';
      amount?: number;
      product_transaction_id?: string;
    } = {
      location_id: locationId,
      action: 'sale',
      ...(amount && amount > 0 ? { amount } : {}),
    };
    if (productTransactionId) intentionData.product_transaction_id = productTransactionId;

    const result = await fortisClient.createTransactionIntention(intentionData);
    if (!result.status || !result.clientToken) {
      return apiError(result.message || 'Failed to create payment intention', 400);
    }

    return Response.json({
      clientToken: result.clientToken,
      intentionType: 'transaction',
      paymentMethod,
      locationId,
      productTransactionId: productTransactionId || null,
      environment: env,
    });
  } catch (e: any) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/intentions POST]', e);
    // Surface transient database connectivity issues as retryable 503s
    // instead of opaque 500s. Prisma error codes:
    //   P1001 – can't reach database server
    //   P1002 – database server timed out
    //   P1008 – operations timed out
    //   P2024 – timed out fetching a connection from the pool
    const code = e?.code;
    if (code === 'P1001' || code === 'P1002' || code === 'P1008' || code === 'P2024') {
      return apiError('Service temporarily unavailable. Please retry.', 503);
    }
    return apiError('Internal server error', 500);
  }
}
