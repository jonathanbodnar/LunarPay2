/**
 * POST /api/settings/api-keys/regenerate — Regenerate a specific key
 * Body: { type: 'publishable' | 'secret' }
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const type: 'publishable' | 'secret' = body.type;

    if (type !== 'publishable' && type !== 'secret') {
      return NextResponse.json({ error: 'type must be "publishable" or "secret"' }, { status: 400 });
    }

    const newKey = generateApiKey(type === 'publishable' ? 'lp_pk_' : 'lp_sk_');

    if (type === 'publishable') {
      await prisma.$executeRaw`UPDATE users SET publishable_key = ${newKey} WHERE id = ${currentUser.userId}`;
    } else {
      await prisma.$executeRaw`UPDATE users SET secret_key = ${newKey} WHERE id = ${currentUser.userId}`;
    }

    return NextResponse.json({
      type,
      key: newKey,  // always return full key so it can be copied
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to regenerate key' }, { status: 500 });
  }
}
