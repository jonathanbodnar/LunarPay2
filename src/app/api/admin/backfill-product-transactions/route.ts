import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisClient, createFortisClient } from '@/lib/fortis/client';

/**
 * POST /api/admin/backfill-product-transactions
 *
 * Backfill productTransactionId / achProductTransactionId on FortisOnboarding
 * rows by querying Fortis for each merchant's location and reading the active
 * product_transactions list.
 *
 * Used for merchants who were boarded directly inside Fortis's portal (instead
 * of through our /v1/onboarding API) and therefore never had a webhook populate
 * these IDs. The /v1/intentions endpoint requires them when paymentMethod is
 * explicitly 'cc' or 'ach'.
 *
 * SAFETY GUARANTEES — this endpoint is intentionally narrow:
 *  - Only writes a field if it is currently NULL on the row. Never overwrites.
 *  - Never touches appStatus, location_id, auth_user_id, auth_user_api_key,
 *    processor_response, or any other field.
 *  - Defaults to dryRun=true. Writes only happen when the request body
 *    explicitly sets dryRun:false.
 *  - Bulk mode (no organizationId, or organizationId:"all") additionally
 *    requires confirmAll:true to actually write.
 *  - Auth-gated via CRON_ADMIN_KEY query param or CRON_SECRET bearer token,
 *    same pattern as /api/admin/recover-status.
 *
 * Request body:
 *   { organizationId: number, dryRun?: boolean }
 *   { organizationId: "all", dryRun?: boolean, confirmAll?: boolean }
 *   { dryRun?: boolean, confirmAll?: boolean }   // same as "all"
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');
  const cronAdminKey = process.env.CRON_ADMIN_KEY;

  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronAdminKey && adminKey === cronAdminKey) ||
    false;

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // dryRun defaults to true for safety. Writes only happen when caller explicitly
  // sets dryRun:false.
  const dryRun = body.dryRun !== false;
  const confirmAll = body.confirmAll === true;

  // Decide single vs bulk mode.
  const isAllMode =
    body.organizationId === undefined ||
    body.organizationId === null ||
    body.organizationId === 'all' ||
    body.organizationId === '*';

  // Determine environment once.
  const fortisEnv = process.env.fortis_environment || process.env.FORTIS_ENVIRONMENT || 'dev';
  const env: 'sandbox' | 'production' =
    fortisEnv === 'prd' || fortisEnv === 'prod' || fortisEnv === 'production'
      ? 'production'
      : 'sandbox';

  // Per-org worker. Returns a summary; only writes when dryRun=false AND we're
  // either in single mode or in all-mode with confirmAll=true.
  async function processOrg(orgId: number, allowWrite: boolean) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { fortisOnboarding: true },
    });

    if (!org || !org.fortisOnboarding) {
      return {
        organizationId: orgId,
        skipped: true,
        reason: 'Organization or fortisOnboarding row not found',
      };
    }

    const fo = org.fortisOnboarding;
    const locationId = fo.locationId;

    if (!locationId) {
      return {
        organizationId: orgId,
        organizationName: org.name,
        skipped: true,
        reason: 'No locationId on row — merchant has no Fortis location linked yet.',
        currentRow: {
          appStatus: fo.appStatus,
          productTransactionId: fo.productTransactionId,
          achProductTransactionId: fo.achProductTransactionId,
        },
      };
    }

    // Prefer merchant-scoped credentials; fall back to platform-level onboarding
    // credentials if the merchant ones aren't on the row.
    let client: FortisClient | null = null;
    let credentialsUsed: 'merchant' | 'platform' = 'platform';

    if (fo.authUserId && fo.authUserApiKey) {
      try {
        client = createFortisClient(env, fo.authUserId, fo.authUserApiKey);
        credentialsUsed = 'merchant';
      } catch {
        // fall through to platform
      }
    }
    if (!client) {
      try {
        client = createFortisClient(env);
        credentialsUsed = 'platform';
      } catch (e: any) {
        return {
          organizationId: orgId,
          organizationName: org.name,
          locationId,
          error: 'Could not construct Fortis client',
          detail: e?.message,
        };
      }
    }

    const result = await client.getLocation(locationId, {
      expand: ['product_transactions'],
    });

    if (!result.status || !result.location) {
      return {
        organizationId: orgId,
        organizationName: org.name,
        locationId,
        credentialsUsed,
        error: 'Failed to fetch location from Fortis',
        fortisMessage: result.message,
      };
    }

    const allPts = (result.location.product_transactions || []).filter(
      (pt) => pt && typeof pt === 'object' && pt.id
    );

    const isActive = (pt: any) =>
      pt.active === undefined || pt.active === 1 || pt.active === true;

    const ccPt = allPts.find((pt) => pt.payment_method === 'cc' && isActive(pt));
    const achPt = allPts.find((pt) => pt.payment_method === 'ach' && isActive(pt));

    const updates: { productTransactionId?: string; achProductTransactionId?: string } = {};
    const skipped: Record<string, string> = {};

    if (ccPt?.id) {
      if (!fo.productTransactionId) {
        updates.productTransactionId = ccPt.id;
      } else if (fo.productTransactionId !== ccPt.id) {
        skipped.productTransactionId = `Already set to ${fo.productTransactionId}; Fortis reports ${ccPt.id}. Not overwriting.`;
      } else {
        skipped.productTransactionId = `Already set; matches Fortis.`;
      }
    } else {
      skipped.productTransactionId = 'No active cc product_transaction on this location.';
    }

    if (achPt?.id) {
      if (!fo.achProductTransactionId) {
        updates.achProductTransactionId = achPt.id;
      } else if (fo.achProductTransactionId !== achPt.id) {
        skipped.achProductTransactionId = `Already set to ${fo.achProductTransactionId}; Fortis reports ${achPt.id}. Not overwriting.`;
      } else {
        skipped.achProductTransactionId = `Already set; matches Fortis.`;
      }
    } else {
      skipped.achProductTransactionId = 'No active ach product_transaction on this location.';
    }

    const summary: any = {
      organizationId: orgId,
      organizationName: org.name,
      appStatus: fo.appStatus,
      locationId,
      credentialsUsed,
      productTransactionsFound: allPts.map((pt) => ({
        id: pt.id,
        payment_method: pt.payment_method,
        active: pt.active,
        title: pt.title,
        sub_processor: pt.sub_processor,
        mcc: pt.mcc,
      })),
      currentRow: {
        productTransactionId: fo.productTransactionId,
        achProductTransactionId: fo.achProductTransactionId,
      },
      proposedUpdates: updates,
      skipped,
    };

    const willWrite = allowWrite && Object.keys(updates).length > 0;

    if (!willWrite) {
      summary.writtenFields = [];
      summary.message = allowWrite
        ? 'Nothing to update — fields already populated.'
        : 'Dry run — no changes written.';
      return summary;
    }

    await prisma.fortisOnboarding.update({
      where: { id: fo.id },
      data: {
        ...(updates.productTransactionId && !fo.productTransactionId
          ? { productTransactionId: updates.productTransactionId }
          : {}),
        ...(updates.achProductTransactionId && !fo.achProductTransactionId
          ? { achProductTransactionId: updates.achProductTransactionId }
          : {}),
        updatedAt: new Date(),
      },
    });

    summary.writtenFields = Object.keys(updates);
    summary.message = 'Backfill complete.';
    return summary;
  }

  try {
    if (!isAllMode) {
      // Single-org mode.
      const organizationId = Number(body.organizationId);
      if (!organizationId || Number.isNaN(organizationId)) {
        return NextResponse.json(
          { error: 'organizationId must be a number, "all", or omitted' },
          { status: 400 }
        );
      }
      const result = await processOrg(organizationId, !dryRun);
      return NextResponse.json({ mode: 'single', dryRun, ...result });
    }

    // Bulk / all-merchants mode. Writes require confirmAll:true even if dryRun
    // is false, as a second guardrail against accidental mass updates.
    const allowWrite = !dryRun && confirmAll;

    const onboardings = await prisma.fortisOnboarding.findMany({
      where: { locationId: { not: null } },
      select: { organizationId: true },
      orderBy: { organizationId: 'asc' },
    });

    const results: any[] = [];
    for (const row of onboardings) {
      try {
        const r = await processOrg(row.organizationId, allowWrite);
        results.push(r);
      } catch (e: any) {
        results.push({
          organizationId: row.organizationId,
          error: 'Unhandled error',
          detail: e?.message,
        });
      }
    }

    return NextResponse.json({
      mode: 'all',
      dryRun,
      confirmAll,
      allowedToWrite: allowWrite,
      writeNote: allowWrite
        ? 'Writes were applied where fields were null.'
        : 'No writes performed. To apply across all merchants, send {"dryRun": false, "confirmAll": true}.',
      totalChecked: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[Admin Backfill PT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error?.message },
      { status: 500 }
    );
  }
}
