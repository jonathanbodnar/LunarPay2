import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// GET /api/user/api-key - Get current API key (masked)
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { apiKey: true },
    });

    if (!user?.apiKey) {
      return NextResponse.json({ apiKey: null });
    }

    // Return masked key (show first 8 and last 4 characters)
    const masked = user.apiKey.substring(0, 8) + '...' + user.apiKey.substring(user.apiKey.length - 4);
    
    return NextResponse.json({ 
      apiKey: masked,
      hasKey: true,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/api-key - Generate new API key
export async function POST() {
  try {
    const currentUser = await requireAuth();

    // Generate a secure API key
    const apiKey = 'lp_' + crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { apiKey },
    });

    return NextResponse.json({ 
      apiKey,
      message: 'API key generated. Save this key - it won\'t be shown again!',
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Generate API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/api-key - Revoke API key
export async function DELETE() {
  try {
    const currentUser = await requireAuth();

    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { apiKey: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Revoke API key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

