import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/integrations/stripe - Get Stripe connection status
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const integration = await prisma.integration.findFirst({
      where: {
        userId: currentUser.userId,
        provider: 'stripe',
      },
      select: {
        id: true,
        status: true,
        lastSync: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      connected: integration?.status === 'connected',
      lastSync: integration?.lastSync,
      stats: integration?.metadata ? JSON.parse(integration.metadata) : null,
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get Stripe status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const connectSchema = z.object({
  apiKey: z.string().min(10, 'Invalid API key'),
});

// POST /api/integrations/stripe - Connect Stripe with API key
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = connectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { apiKey } = validation.data;

    // Validate the API key by making a test request
    const testResponse = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid Stripe API key. Please check and try again.' },
        { status: 400 }
      );
    }

    // Save or update the integration
    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: currentUser.userId,
          provider: 'stripe',
        },
      },
      update: {
        apiKey,
        status: 'connected',
        updatedAt: new Date(),
      },
      create: {
        userId: currentUser.userId,
        provider: 'stripe',
        apiKey,
        status: 'connected',
      },
    });

    return NextResponse.json({ success: true, message: 'Stripe connected successfully' });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Connect Stripe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/integrations/stripe - Disconnect Stripe
export async function DELETE() {
  try {
    const currentUser = await requireAuth();

    await prisma.integration.updateMany({
      where: {
        userId: currentUser.userId,
        provider: 'stripe',
      },
      data: {
        status: 'disconnected',
        apiKey: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Disconnect Stripe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

