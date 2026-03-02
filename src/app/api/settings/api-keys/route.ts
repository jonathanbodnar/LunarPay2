/**
 * GET  /api/settings/api-keys  — Return current API keys (masked)
 * POST /api/settings/api-keys  — Generate keys if not yet created
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

    const rows = await prisma.$queryRaw<{ publishable_key: string | null; secret_key: string | null }[]>`
      SELECT publishable_key, secret_key FROM users WHERE id = ${currentUser.userId}
    `;
    const user = rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      publishableKey: user.publishable_key ? maskKey(user.publishable_key) : null,
      secretKey: user.secret_key ? maskKey(user.secret_key) : null,
      hasKeys: !!(user.publishable_key && user.secret_key),
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

    const rows = await prisma.$queryRaw<{ publishable_key: string | null; secret_key: string | null }[]>`
      SELECT publishable_key, secret_key FROM users WHERE id = ${currentUser.userId}
    `;
    const user = rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const newPk = user.publishable_key ?? generateApiKey('lp_pk_');
    const newSk = user.secret_key ?? generateApiKey('lp_sk_');

    if (!user.publishable_key || !user.secret_key) {
      await prisma.$executeRaw`
        UPDATE users SET publishable_key = ${newPk}, secret_key = ${newSk} WHERE id = ${currentUser.userId}
      `;
    }

    return NextResponse.json({
      publishableKey: newPk,
      secretKey: maskKey(newSk),
      generated: !user.publishable_key || !user.secret_key,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate API keys' }, { status: 500 });
  }
}
