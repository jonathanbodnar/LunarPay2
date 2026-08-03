/**
 * GET  /api/admin/webhook-deliveries — Inspect outbound webhook delivery history
 * POST /api/admin/webhook-deliveries — Replay one delivery, or every failure
 *
 * Outbound delivery used to be three attempts and a console.error. When a
 * `merchant.approved` was lost the agency never learned the merchant was live
 * — and that event carries the merchant's publishable/secret keys, so losing it
 * strands the merchant with no self-service way back. There was also no record
 * that we had ever tried.
 *
 * Replays re-send the stored body byte-for-byte. Both agency signature schemes
 * derive from the timestamp carried inside the payload, so a replay reproduces
 * the original headers exactly and the receiver's verification still passes.
 *
 * Auth: admin cookie, or CRON_SECRET / CRON_ADMIN_KEY for out-of-band use.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminOrOpsAuthorized } from '@/lib/admin-auth';
import { deliverToAgency } from '@/lib/agency-webhook';

const REPLAY_BATCH_CAP = 50;

export async function GET(request: Request) {
  if (!(await isAdminOrOpsAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const event = searchParams.get('event');
    const agencyId = searchParams.get('agency_id');
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));

    const where = {
      ...(status ? { status } : {}),
      ...(event ? { event } : {}),
      ...(agencyId ? { agencyId: parseInt(agencyId) } : {}),
    };

    const [rows, total, failing] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true, target: true, agencyId: true, organizationId: true,
          event: true, url: true, status: true, attempts: true,
          lastError: true, deliveredAt: true, replayedAt: true, createdAt: true,
        },
      }),
      prisma.webhookDelivery.count({ where }),
      prisma.webhookDelivery.count({ where: { status: { in: ['failed', 'pending'] } } }),
    ]);

    return NextResponse.json({
      total,
      undelivered: failing,
      deliveries: rows.map((r) => ({ ...r, id: r.id.toString() })),
    });
  } catch (error) {
    console.error('[Admin Webhook Deliveries] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminOrOpsAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, replayFailed, event, agencyId } = body as {
      id?: string | number;
      replayFailed?: boolean;
      event?: string;
      agencyId?: number;
    };

    if (!id && !replayFailed) {
      return NextResponse.json(
        { error: 'Provide either { id } to replay one delivery, or { replayFailed: true }' },
        { status: 400 }
      );
    }

    const targets = id
      ? await prisma.webhookDelivery.findMany({ where: { id: BigInt(id) } })
      : await prisma.webhookDelivery.findMany({
          where: {
            status: { in: ['failed', 'pending'] },
            ...(event ? { event } : {}),
            ...(agencyId ? { agencyId } : {}),
          },
          orderBy: { createdAt: 'asc' },
          take: REPLAY_BATCH_CAP,
        });

    if (!targets.length) {
      return NextResponse.json({ error: 'No matching deliveries to replay' }, { status: 404 });
    }

    const results: Array<{ id: string; event: string; delivered: boolean; detail?: string }> = [];

    for (const d of targets) {
      if (d.target !== 'agency' || d.agencyId === null) {
        results.push({
          id: d.id.toString(),
          event: d.event,
          delivered: false,
          detail: 'Only agency deliveries can be replayed today',
        });
        continue;
      }

      const agency = await prisma.agency.findUnique({
        where: { id: d.agencyId },
        select: { webhookUrl: true, webhookSecret: true, isActive: true },
      });

      if (!agency?.isActive || !agency.webhookUrl) {
        results.push({
          id: d.id.toString(),
          event: d.event,
          delivered: false,
          detail: 'Agency is inactive or has no webhook URL configured',
        });
        continue;
      }

      // Timestamp comes from the stored payload so the replay is signed
      // identically to the original attempt.
      let timestamp: string;
      try {
        timestamp = JSON.parse(d.payload).timestamp;
      } catch {
        results.push({
          id: d.id.toString(),
          event: d.event,
          delivered: false,
          detail: 'Stored payload is not valid JSON',
        });
        continue;
      }

      // Deliberately the agency's CURRENT url and secret, not the ones captured
      // at the time — a replay is usually happening precisely because the
      // original endpoint or secret was wrong.
      const delivered = await deliverToAgency(
        agency.webhookUrl,
        agency.webhookSecret,
        d.event,
        timestamp,
        d.payload
      );

      await prisma.webhookDelivery.update({
        where: { id: d.id },
        data: {
          status: delivered ? 'delivered' : 'failed',
          attempts: { increment: 1 },
          replayedAt: new Date(),
          deliveredAt: delivered ? new Date() : null,
          lastError: delivered ? null : 'Replay failed after retries',
          url: agency.webhookUrl,
        },
      });

      results.push({ id: d.id.toString(), event: d.event, delivered });
    }

    const succeeded = results.filter((r) => r.delivered).length;

    return NextResponse.json({
      attempted: results.length,
      delivered: succeeded,
      failed: results.length - succeeded,
      ...(targets.length === REPLAY_BATCH_CAP
        ? { note: `Capped at ${REPLAY_BATCH_CAP} per call — run again for the rest` }
        : {}),
      results,
    });
  } catch (error) {
    console.error('[Admin Webhook Deliveries] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
