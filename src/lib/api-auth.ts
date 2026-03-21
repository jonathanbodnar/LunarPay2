/**
 * LunarPay Merchant API Authentication
 *
 * Authenticates requests using publishable (lp_pk_) or secret (lp_sk_) API keys.
 * Secret keys are required for charges, refunds, subscriptions.
 * Publishable keys are for client-side payment intention creation only.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ApiAuthResult {
  userId: number;
  organizationId: number;
  fortisUserId: string;
  fortisApiKey: string;
  fortisLocationId: string | null;
}

function extractApiKey(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth) {
    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    return auth.trim();
  }
  // Also allow x-api-key header
  return request.headers.get('x-api-key');
}

export async function requireSecretKey(request: NextRequest, opts?: { requireActive?: boolean }): Promise<ApiAuthResult> {
  const key = extractApiKey(request);
  if (!key || !key.startsWith('lp_sk_')) {
    throw new ApiAuthError('Invalid or missing secret API key. Use your lp_sk_... key.', 401);
  }
  return resolveKey(key, 'secret', opts);
}

export async function requirePublishableKey(request: NextRequest): Promise<ApiAuthResult> {
  const key = extractApiKey(request);
  if (!key || !key.startsWith('lp_pk_')) {
    throw new ApiAuthError('Invalid or missing publishable API key. Use your lp_pk_... key.', 401);
  }
  return resolveKey(key, 'publishable');
}

async function resolveKey(key: string, type: 'secret' | 'publishable', opts?: { requireActive?: boolean }): Promise<ApiAuthResult> {
  const requireActive = opts?.requireActive ?? true;
  // Use raw query because publishable_key/secret_key columns were added after Prisma client generation
  const col = type === 'secret' ? 'secret_key' : 'publishable_key';
  const userRows = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM users WHERE ${col} = $1 AND active = true LIMIT 1`,
    key
  );
  if (!userRows.length) {
    throw new ApiAuthError('API key not found.', 401);
  }
  const userId = userRows[0].id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        include: {
          fortisOnboarding: {
            select: {
              appStatus: true,
              authUserId: true,
              authUserApiKey: true,
              locationId: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) {
    throw new ApiAuthError('API key not found.', 401);
  }

  const org = user.organizations[0];
  if (!org) {
    throw new ApiAuthError('No organization associated with this API key.', 403);
  }

  const fortis = org.fortisOnboarding;

  if (requireActive) {
    if (!fortis || fortis.appStatus !== 'ACTIVE') {
      throw new ApiAuthError(
        'Your account is not yet approved for payment processing. Complete onboarding first.',
        403
      );
    }

    if (!fortis.authUserId || !fortis.authUserApiKey) {
      throw new ApiAuthError('Payment processor credentials not configured.', 503);
    }
  }

  return {
    userId: user.id,
    organizationId: org.id,
    fortisUserId: fortis?.authUserId ?? '',
    fortisApiKey: fortis?.authUserApiKey ?? '',
    fortisLocationId: fortis?.locationId ?? null,
  };
}

export interface AgencyAuthResult {
  agencyId: number;
  agencyName: string;
}

export async function requireAgencyKey(request: NextRequest): Promise<AgencyAuthResult> {
  const key = extractApiKey(request);
  if (!key || !key.startsWith('lp_agency_')) {
    throw new ApiAuthError('Invalid or missing agency API key. Use your lp_agency_... key.', 401);
  }

  const agency = await prisma.agency.findFirst({
    where: { apiKey: key, isActive: true },
  });

  if (!agency) {
    throw new ApiAuthError('Agency API key not found or inactive.', 401);
  }

  return {
    agencyId: agency.id,
    agencyName: agency.name,
  };
}

export class ApiAuthError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'ApiAuthError';
  }
}

/** Generate a random API key with a given prefix */
export function generateApiKey(prefix: 'lp_sk_' | 'lp_pk_' | 'lp_agency_'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** Standard error response helper for v1 API routes */
export function apiError(message: string, status: number, details?: unknown) {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}
