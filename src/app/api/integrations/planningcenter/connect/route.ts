import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const connectPlanningCenterSchema = z.object({
  appId: z.string(),
  secret: z.string(),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const { appId, secret } = connectPlanningCenterSchema.parse(body);

    // Verify credentials with Planning Center API
    const testResponse = await fetch('https://api.planningcenteronline.com/giving/v2/people', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${appId}:${secret}`).toString('base64'),
      },
    });

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid Planning Center credentials' },
        { status: 400 }
      );
    }

    // Save integration
    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId: currentUser.userId,
          provider: 'planning_center',
        },
      },
      create: {
        userId: currentUser.userId,
        provider: 'planning_center',
        status: 'connected',
        appId,
        secret,
      },
      update: {
        status: 'connected',
        appId,
        secret,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Planning Center connected successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      );
    }

    console.error('Planning Center connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


