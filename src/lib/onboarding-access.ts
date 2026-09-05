/**
 * Who may act on which Fortis onboarding record.
 *
 * Shared by the public onboarding endpoints (/api/onboarding/mark-submitted,
 * /api/onboarding/sync-status) and the agency API. Two ways in:
 *
 *   1. The organization's public `token` (the same one that opens
 *      /onboarding/[token]) sent in the JSON body — the merchant is on the
 *      standalone onboarding page and has no session.
 *   2. A dashboard session (`lunarpay_token` cookie) plus `organizationId`;
 *      the organization must belong to the signed-in user.
 *
 * The agency variant resolves a merchant User id under the calling agency to
 * that merchant's organization, like the sibling /api/v1/agency/merchants/:id
 * routes do.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import type { SyncResult } from '@/lib/fortis/onboarding-sync';

export type OnboardingAccess =
  | { ok: true; organizationId: number }
  | { ok: false; error: string; status: 400 | 401 | 404 };

/**
 * Resolve the organization a public onboarding request may act on.
 * Body: `{ token?: string, organizationId?: number }`.
 */
export async function resolveOnboardingOrganization(request: Request): Promise<OnboardingAccess> {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (!body || typeof body !== 'object') body = {};

  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (token) {
    const organization = await prisma.organization.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!organization) {
      return { ok: false, error: 'Organization not found', status: 404 };
    }
    return { ok: true, organizationId: organization.id };
  }

  const organizationId = Number(body.organizationId);
  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    return { ok: false, error: 'token or organizationId is required', status: 400 };
  }

  const cookieStore = await cookies();
  const session = cookieStore.get('lunarpay_token');
  if (!session) {
    return { ok: false, error: 'Unauthorized', status: 401 };
  }
  const payload = verifyToken(session.value);
  if (!payload) {
    return { ok: false, error: 'Invalid token', status: 401 };
  }

  const organization = await prisma.organization.findFirst({
    where: { id: organizationId, userId: payload.userId },
    select: { id: true },
  });
  if (!organization) {
    return { ok: false, error: 'Organization not found', status: 404 };
  }

  return { ok: true, organizationId: organization.id };
}

/**
 * JSON response for the public onboarding endpoints:
 * `{ status, appStatus, previousStatus, changed, message, mpaLink }`.
 */
export async function onboardingStatusResponse(result: SyncResult): Promise<NextResponse> {
  if (result.source === 'no_onboarding') {
    return NextResponse.json({ error: 'Onboarding has not been started' }, { status: 404 });
  }

  const onboarding = await prisma.fortisOnboarding.findUnique({
    where: { organizationId: result.organizationId },
    select: { mpaLink: true },
  });

  return NextResponse.json({
    status: true,
    appStatus: result.status,
    previousStatus: result.previousStatus,
    changed: result.changed,
    message: result.message,
    mpaLink: onboarding?.mpaLink ?? null,
    source: result.source,
  });
}

// ─── agency API ─────────────────────────────────────────────────────────────

export interface AgencyMerchantOrganization {
  merchantId: number;
  organizationId: number;
  token: string;
  mpaLink: string | null;
}

export type AgencyMerchantAccess =
  | { ok: true; org: AgencyMerchantOrganization }
  | { ok: false; error: string; status: 400 | 404 };

/**
 * Resolve an agency's merchant (User id) to its organization's onboarding
 * record. Mirrors the lookup in /api/v1/agency/merchants/:id/onboard.
 */
export async function resolveAgencyMerchantOrganization(
  agencyId: number,
  merchantId: number
): Promise<AgencyMerchantAccess> {
  const user = await prisma.user.findFirst({
    where: { id: merchantId, agencyId },
    select: {
      id: true,
      organizations: {
        take: 1,
        select: {
          id: true,
          token: true,
          fortisOnboarding: { select: { mpaLink: true } },
        },
      },
    },
  });

  if (!user) return { ok: false, error: 'Merchant not found', status: 404 };

  const org = user.organizations[0];
  if (!org) return { ok: false, error: 'Merchant has no organization', status: 400 };
  if (!org.fortisOnboarding) {
    return { ok: false, error: 'Merchant onboarding has not been started', status: 404 };
  }

  return {
    ok: true,
    org: {
      merchantId: user.id,
      organizationId: org.id,
      token: org.token,
      mpaLink: org.fortisOnboarding.mpaLink,
    },
  };
}

/** `{ data: { merchantId, organizationId, status, isActive, ... } }` for the agency API. */
export function agencyOnboardingResponse(org: AgencyMerchantOrganization, result: SyncResult): Response {
  return Response.json({
    data: {
      merchantId: org.merchantId,
      organizationId: org.organizationId,
      status: result.status,
      isActive: result.status === 'ACTIVE',
      previousStatus: result.previousStatus,
      changed: result.changed,
      message: result.message,
      mpaLink: org.mpaLink,
      mpaEmbedUrl: org.mpaLink ? `https://app.lunarpay.com/onboarding/${org.token}` : null,
    },
  });
}
