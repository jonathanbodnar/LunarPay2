/**
 * GET  /api/settings/api-keys            — Return current API keys (masked)
 * POST /api/settings/api-keys            — Generate keys if not yet created
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-auth';

function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 8) + '...';
  return key.slice(0, 12) + '...' + key.slice(-4);
}

export async function GET() {
  try {
    const currentUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { publishableKey: true, secretKey: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      publishableKey: user.publishableKey ? maskKey(user.publishableKey) : null,
      secretKey: user.secretKey ? maskKey(user.secretKey) : null,
      hasKeys: !!(user.publishableKey && user.secretKey),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const currentUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { publishableKey: true, secretKey: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Only generate if not already set
    const updates: { publishableKey?: string; secretKey?: string } = {};
    if (!user.publishableKey) updates.publishableKey = generateApiKey('lp_pk_');
    if (!user.secretKey) updates.secretKey = generateApiKey('lp_sk_');

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: currentUser.userId }, data: updates });
    }

    const updated = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { publishableKey: true, secretKey: true },
    });

    return NextResponse.json({
      publishableKey: updated!.publishableKey!,
      secretKey: maskKey(updated!.secretKey!),
      generated: Object.keys(updates).length > 0,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate API keys' }, { status: 500 });
  }
}
