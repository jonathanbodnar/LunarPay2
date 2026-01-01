import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ZAPIER_TRIGGERS, ZAPIER_ACTIONS } from '@/lib/zapier';
import { z } from 'zod';

// GET /api/integrations/zapier - Get Zapier integration info and active webhooks
export async function GET() {
  try {
    const currentUser = await requireAuth();

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get active webhooks
    const webhooks = await prisma.$queryRaw<Array<{
      id: number;
      trigger_type: string;
      webhook_url: string;
      is_active: boolean;
      created_at: Date;
    }>>`
      SELECT id, trigger_type, webhook_url, is_active, created_at 
      FROM zapier_webhooks 
      WHERE organization_id = ${organization.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      triggers: ZAPIER_TRIGGERS,
      actions: ZAPIER_ACTIONS,
      webhooks: webhooks.map(w => ({
        id: w.id,
        triggerType: w.trigger_type,
        webhookUrl: w.webhook_url.substring(0, 50) + '...', // Truncate for security
        isActive: w.is_active,
        createdAt: w.created_at,
      })),
      zapierInviteUrl: 'https://zapier.com/apps/lunarpay/integrations', // Update with your actual Zapier app URL
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get Zapier info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const subscribeSchema = z.object({
  triggerType: z.string(),
  webhookUrl: z.string().url(),
});

// POST /api/integrations/zapier - Subscribe to a trigger (called by Zapier)
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = subscribeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { triggerType, webhookUrl } = validation.data;

    // Verify trigger type is valid
    if (!ZAPIER_TRIGGERS.find(t => t.id === triggerType)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      );
    }

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    // Create webhook subscription
    await prisma.$executeRaw`
      INSERT INTO zapier_webhooks (organization_id, trigger_type, webhook_url, is_active, created_at)
      VALUES (${organization.id}, ${triggerType}, ${webhookUrl}, true, NOW())
      ON CONFLICT (organization_id, trigger_type, webhook_url) 
      DO UPDATE SET is_active = true
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Subscribe Zapier webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/zapier - Unsubscribe from a trigger (called by Zapier)
export async function DELETE(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('id');
    const webhookUrl = searchParams.get('webhookUrl');

    // Get user's organization
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    if (webhookId) {
      await prisma.$executeRaw`
        DELETE FROM zapier_webhooks 
        WHERE id = ${parseInt(webhookId)} AND organization_id = ${organization.id}
      `;
    } else if (webhookUrl) {
      await prisma.$executeRaw`
        DELETE FROM zapier_webhooks 
        WHERE webhook_url = ${webhookUrl} AND organization_id = ${organization.id}
      `;
    } else {
      return NextResponse.json(
        { error: 'Webhook ID or URL is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Unsubscribe Zapier webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

