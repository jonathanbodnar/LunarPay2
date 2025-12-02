import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const connectSlackSchema = z.object({
  webhookUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { webhookUrl } = connectSlackSchema.parse(body);

    // Verify the webhook works
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'LunarPay integration test - Connection successful! 🎉',
        }),
      });

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid webhook URL' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify webhook URL' },
        { status: 400 }
      );
    }

    // Save integration
    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: currentUser.userId,
          provider: 'slack',
        },
      },
      create: {
        userId: currentUser.userId,
        provider: 'slack',
        status: 'connected',
        webhookUrl,
      },
      update: {
        status: 'connected',
        webhookUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Slack connected successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      );
    }

    console.error('Slack connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send notification to Slack
export async function sendSlackNotification(userId: number, message: string) {
  try {
    const integration = await prisma.integration.findFirst({
      where: {
        userId,
        provider: 'slack',
        status: 'connected',
      },
    });

    if (!integration || !integration.webhookUrl) {
      return false;
    }

    await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    return true;
  } catch (error) {
    console.error('Slack notification error:', error);
    return false;
  }
}


