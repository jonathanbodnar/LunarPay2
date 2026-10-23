/**
 * LunarPay Merchant API Authentication
 *
 * Authenticates requests using publishable (lp_pk_) or secret (lp_sk_) API keys.
 * Secret keys are required for charges, refunds, subscriptions.
 * Publishable keys are for client-side payment intention creation only.
 */

import { NextRequest } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface ApiAuthResult {
  userId: number;
  organizationId: number;
  fortisUserId: string;
  fortisApiKey: string;
  fortisLocationId: string | null;
  fortisCcProductTransactionId: string | null;
  fortisAchProductTransactionId: string | null;
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
  const userId = await findUserIdForKey(key, type);
  if (userId === null) {
    throw new ApiAuthError('API key not found.', 401);
  }

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
              productTransactionId: true,
              achProductTransactionId: true,
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
    fortisCcProductTransactionId: fortis?.productTransactionId ?? null,
    fortisAchProductTransactionId: (fortis as any)?.achProductTransactionId ?? null,
  };
}

/**
 * The active user a key belongs to, or null.
 *
 * A key replaced during a rotation keeps authenticating from the previous_*
 * columns until it is revoked by setting them back to NULL, so the platform
 * holding it can switch to the new key without an outage
 * (scripts/sql/005-api-key-rotation.sql).
 */
async function findUserIdForKey(key: string, type: 'secret' | 'publishable'): Promise<number | null> {
  // Raw queries because publishable_key/secret_key columns were added after Prisma client generation
  const col = type === 'secret' ? 'secret_key' : 'publishable_key';
  const current = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM users WHERE ${col} = $1 AND active = true LIMIT 1`,
    key
  );
  if (current.length) return current[0].id;

  let previous: { id: number }[];
  try {
    previous = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM users WHERE previous_${col} = $1 AND active = true LIMIT 1`,
      key
    );
  } catch (e) {
    // Never let the rotation path turn a plain "key not found" into a 500.
    console.error('[API_AUTH] previous-key lookup failed:', e);
    return null;
  }
  if (!previous.length) return null;
  await notePreviousKeyUse('users', previous[0].id, `user ${previous[0].id} (${type} key)`);
  return previous[0].id;
}

/**
 * Stamps previous_key_last_used_at, at most once a minute per row, so we can
 * see when a platform has stopped using its old key. Never throws.
 */
async function notePreviousKeyUse(table: 'users' | 'agencies', id: number, label: string): Promise<void> {
  try {
    const stamped = await prisma.$executeRawUnsafe(
      `UPDATE ${table} SET previous_key_last_used_at = now()
        WHERE id = $1
          AND (previous_key_last_used_at IS NULL OR previous_key_last_used_at < now() - interval '1 minute')`,
      id
    );
    if (stamped) console.log(`[API_AUTH] ${label} authenticated with its previous key`);
  } catch (e) {
    console.error('[API_AUTH] could not record use of a previous key:', e);
  }
}

export interface AgencyAuthResult {
  agencyId: number;
  agencyName: string;
  /** Agency-wide Fortis MPA template — used when the merchant's org has none. */
  fortisTemplate: string | null;
}

export async function requireAgencyKey(request: NextRequest): Promise<AgencyAuthResult> {
  const key = extractApiKey(request);
  if (!key || !key.startsWith('lp_agency_')) {
    throw new ApiAuthError('Invalid or missing agency API key. Use your lp_agency_... key.', 401);
  }

  const agency =
    (await prisma.agency.findFirst({
      where: { apiKey: key, isActive: true },
    })) ?? (await findAgencyByPreviousKey(key));

  if (!agency) {
    throw new ApiAuthError('Agency API key not found or inactive.', 401);
  }

  return {
    agencyId: agency.id,
    agencyName: agency.name,
    fortisTemplate: agency.fortisTemplate ?? null,
  };
}

/**
 * An agency's replaced key, which keeps working until agencies.previous_api_key
 * is set back to NULL (scripts/sql/005-api-key-rotation.sql). Raw SQL because
 * the column is not in the generated Prisma client. A failing lookup counts as
 * "not found".
 */
async function findAgencyByPreviousKey(
  key: string
): Promise<{ id: number; name: string; fortisTemplate: string | null } | null> {
  let rows: { id: number; name: string; fortisTemplate: string | null }[];
  try {
    rows = await prisma.$queryRawUnsafe<{ id: number; name: string; fortisTemplate: string | null }[]>(
      `SELECT id, name, fortis_template AS "fortisTemplate" FROM agencies
        WHERE previous_api_key = $1 AND is_active = true LIMIT 1`,
      key
    );
  } catch (e) {
    console.error('[API_AUTH] previous agency key lookup failed:', e);
    return null;
  }
  if (!rows.length) return null;
  await notePreviousKeyUse('agencies', rows[0].id, `agency ${rows[0].id}`);
  return rows[0];
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

/**
 * Generate a random API key with a given prefix: 48 characters from
 * [A-Za-z0-9], each drawn with crypto.randomInt (uniform, cryptographically
 * secure). Math.random is predictable and must never mint credentials.
 */
export function generateApiKey(prefix: 'lp_sk_' | 'lp_pk_' | 'lp_agency_'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(randomInt(chars.length));
  }
  return result;
}

/** Standard error response helper for v1 API routes */
export function apiError(message: string, status: number, details?: unknown) {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}
