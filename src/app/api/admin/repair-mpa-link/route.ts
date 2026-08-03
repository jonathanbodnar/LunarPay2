/**
 * POST /api/admin/repair-mpa-link — Restore a missing Fortis MPA link
 *
 * Exists because of a dead-end that had no recovery path: when a merchant's
 * application is submitted twice, Fortis answers "Duplicate Client App ID"
 * (E05). The old failure path recorded appStatus BANK_INFORMATION_SENT while
 * leaving mpa_link NULL, and nothing in the codebase could ever set it again —
 * Fortis's status endpoint was not being read for the link, and no admin route
 * wrote that column. The merchant sat on "Application Not Ready" forever and
 * only a direct database write could free them.
 *
 * Two modes:
 *   1. Recovery (default) — ask Fortis for the application and take its
 *      app_link. Preferred: the value is authoritative.
 *   2. Explicit — supply `mpaLink` to write a link retrieved by hand, for the
 *      case where Fortis's record predates app_link being returned.
 *
 * Auth: admin cookie, or CRON_SECRET / CRON_ADMIN_KEY for out-of-band repair
 * (matching /api/admin/recover-status, which is used the same way).
 *
 * Safety: refuses to touch an ACTIVE merchant. An approved merchant no longer
 * needs an application link, and their onboarding row carries the live
 * processing credentials — this endpoint must never be a way to disturb them.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { createFortisClient } from '@/lib/fortis/client';

async function isAuthorized(request: Request): Promise<boolean> {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const cronAdminKey = process.env.CRON_ADMIN_KEY;
  const adminKey = searchParams.get('admin_key');

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  if (cronAdminKey && adminKey === cronAdminKey) return true;

  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const organizationId = Number(body.organizationId);
    const explicitLink: string | undefined = body.mpaLink;

    if (!Number.isInteger(organizationId) || organizationId <= 0) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (explicitLink !== undefined) {
      if (typeof explicitLink !== 'string' || !/^https:\/\//.test(explicitLink)) {
        return NextResponse.json(
          { error: 'mpaLink must be an https:// URL' },
          { status: 400 }
        );
      }
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { fortisOnboarding: true },
    });

    if (!org?.fortisOnboarding) {
      return NextResponse.json(
        { error: 'Organization or onboarding record not found' },
        { status: 404 }
      );
    }

    if (org.fortisOnboarding.appStatus === 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'Merchant is already ACTIVE; refusing to modify a live onboarding record',
          status: 'ACTIVE',
        },
        { status: 409 }
      );
    }

    const existingLink = org.fortisOnboarding.mpaLink;

    // Nothing to repair — report and stop rather than churn the row.
    if (existingLink && !explicitLink) {
      return NextResponse.json({
        message: 'Merchant already has an MPA link; nothing to repair',
        organizationId,
        mpaLink: existingLink,
        mpaEmbedUrl: `https://app.lunarpay.com/onboarding/${org.token}`,
        repaired: false,
      });
    }

    let link = explicitLink ?? null;
    let source = explicitLink ? 'explicit' : 'fortis_api';

    if (!link) {
      const client = createFortisClient();
      const result = await client.getOnboardingStatus(organizationId.toString());

      if (!result.status || !result.data) {
        return NextResponse.json(
          {
            error: 'Fortis returned no application record for this organization',
            detail: result.message ?? null,
            currentStatus: org.fortisOnboarding.appStatus,
          },
          { status: 502 }
        );
      }

      link = result.data.app_link ?? null;

      if (!link) {
        return NextResponse.json(
          {
            error:
              'Fortis has an application but did not return an app_link. Retrieve the link from the Fortis dashboard and resubmit with { "mpaLink": "https://..." }.',
            fortisStatus: result.data.status,
            fortisStatusMessage: result.data.status_message ?? null,
            currentStatus: org.fortisOnboarding.appStatus,
          },
          { status: 422 }
        );
      }
    }

    // Only lift the status out of the error state. A record sitting in
    // PENDING_REVIEW or DENIED reflects a real Fortis decision and is left
    // alone — this endpoint repairs a missing link, it does not re-open
    // underwriting outcomes.
    const shouldClearError =
      org.fortisOnboarding.appStatus === 'FORM_ERROR' ||
      org.fortisOnboarding.appStatus === 'PENDING' ||
      !org.fortisOnboarding.appStatus;

    await prisma.fortisOnboarding.update({
      where: { id: org.fortisOnboarding.id },
      data: {
        mpaLink: link,
        ...(shouldClearError ? { appStatus: 'BANK_INFORMATION_SENT' } : {}),
        updatedAt: new Date(),
      },
    });

    console.log('[Admin Repair MPA Link] Repaired org', organizationId, 'source:', source);

    return NextResponse.json({
      message: 'MPA link restored',
      organizationId,
      mpaLink: link,
      mpaEmbedUrl: `https://app.lunarpay.com/onboarding/${org.token}`,
      source,
      previousStatus: org.fortisOnboarding.appStatus,
      appStatus: shouldClearError ? 'BANK_INFORMATION_SENT' : org.fortisOnboarding.appStatus,
      repaired: true,
    });
  } catch (error) {
    console.error('[Admin Repair MPA Link] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/repair-mpa-link — List merchants currently stuck without a link.
 * Read-only triage: who is affected, and how long have they been stranded.
 */
export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stranded = await prisma.fortisOnboarding.findMany({
      where: {
        mpaLink: null,
        appStatus: { in: ['BANK_INFORMATION_SENT', 'FORM_ERROR', 'PENDING_REVIEW'] },
      },
      select: {
        organizationId: true,
        appStatus: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { name: true, token: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      count: stranded.length,
      merchants: stranded.map((s) => ({
        organizationId: s.organizationId,
        businessName: s.organization?.name ?? null,
        email: s.email,
        appStatus: s.appStatus,
        strandedSince: s.updatedAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Admin Repair MPA Link] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
