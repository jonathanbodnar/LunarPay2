import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FortisWebhookPayload } from '@/types/fortis';

/**
 * Fortis Webhook Handler
 * Receives merchant account status updates from Fortis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as FortisWebhookPayload;
    const { client_app_id, stage, users } = body;

    // Log webhook to database
    await prisma.fortisWebhook.create({
      data: {
        eventJson: JSON.stringify(body),
        system: 'lunarpay',
        mode: stage,
      },
    });

    // Find organization by client_app_id
    const organizationId = parseInt(client_app_id);
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        fortisOnboarding: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { status: false, message: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!organization.fortisOnboarding) {
      return NextResponse.json(
        { status: false, message: 'Onboarding record not found' },
        { status: 404 }
      );
    }

    // Extract user credentials from webhook
    if (users && users.length > 0) {
      const merchantUser = users[0];
      
      // Update onboarding record with merchant credentials
      await prisma.fortisOnboarding.update({
        where: { id: organization.fortisOnboarding.id },
        data: {
          authUserId: merchantUser.user_id,
          authUserApiKey: merchantUser.user_api_key,
          appStatus: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      // TODO: Send email notification to merchant
      // "Your account is ready for receiving payments!"

      return NextResponse.json({
        status: true,
        message: 'Webhook processed successfully',
      });
    }

    return NextResponse.json(
      { status: false, message: 'No user credentials provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Fortis webhook error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

