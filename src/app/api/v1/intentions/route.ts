/**
 * POST /api/v1/intentions — Create a Fortis payment intention (client-side use)
 *
 * Use your PUBLISHABLE key (lp_pk_...) for this endpoint.
 * Returns a clientToken to initialize the Fortis Elements iframe.
 *
 * Body:
 *   amount      number   — Amount in cents (required for one-time)
 *   hasRecurring boolean — If true, returns ticket intention for card saving
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createFortisClient } from '@/lib/fortis/client';
import { requirePublishableKey, ApiAuthError, apiError } from '@/lib/api-auth';

const intentionSchema = z.object({
  amount: z.number().int().min(0).optional(),
  hasRecurring: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePublishableKey(request);
    const body = await request.json();
    const parsed = intentionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
    }

    const { amount, hasRecurring } = parsed.data;

    const fortisEnv = process.env.fortis_environment || 'dev';
    const env = fortisEnv === 'prd' ? 'production' : 'sandbox';
    const fortisClient = createFortisClient(env as 'sandbox' | 'production', auth.fortisUserId, auth.fortisApiKey);

    let locationId = auth.fortisLocationId;

    // Fetch location if not stored
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

    if (hasRecurring) {
      const result = await fortisClient.createTicketIntention({ location_id: locationId });
      if (!result.status || !result.clientToken) {
        return apiError(result.message || 'Failed to create payment intention', 400);
      }
      return Response.json({
        clientToken: result.clientToken,
        intentionType: 'ticket',
        locationId,
        environment: env,
        amount: amount ?? 0,
      });
    }

    const intentionData = {
      location_id: locationId,
      action: 'sale' as const,
      ...(amount && amount > 0 ? { amount } : {}),
    };

    const result = await fortisClient.createTransactionIntention(intentionData);
    if (!result.status || !result.clientToken) {
      return apiError(result.message || 'Failed to create payment intention', 400);
    }

    return Response.json({
      clientToken: result.clientToken,
      intentionType: 'transaction',
      locationId,
      environment: env,
    });
  } catch (e) {
    if (e instanceof ApiAuthError) return apiError(e.message, e.statusCode);
    console.error('[v1/intentions POST]', e);
    return apiError('Internal server error', 500);
  }
}
