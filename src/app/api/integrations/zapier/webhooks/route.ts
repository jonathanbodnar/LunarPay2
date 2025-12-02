import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - For Zapier polling
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required' },
        { status: 401 }
      );
    }

    // Verify API key
    const user = await prisma.user.findFirst({
      where: { apiKey },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get recent transactions for Zapier polling
    const transactions = await prisma.transaction.findMany({
      where: {
        organization: {
          userId: user.id,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        donor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Zapier webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to send webhook notifications
export async function sendWebhookNotification(
  userId: number,
  eventType: string,
  data: any
) {
  try {
    // Get all webhook URLs for this user
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        active: true,
        events: {
          contains: eventType,
        },
      },
    });

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to all configured webhooks
    await Promise.all(
      webhooks.map(webhook =>
        fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': 'TODO: Add signature',
          },
          body: JSON.stringify(payload),
        }).catch(error => {
          console.error(`Webhook error for ${webhook.url}:`, error);
        })
      )
    );
  } catch (error) {
    console.error('Send webhook notification error:', error);
  }
}

