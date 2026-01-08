import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

// Email template types
export const EMAIL_TEMPLATE_TYPES = [
  { id: 'portal_login', name: 'Portal Login Code', description: 'Verification code for customer portal login' },
  { id: 'invoice', name: 'Invoice', description: 'Invoice sent to customers' },
  { id: 'payment_confirmation', name: 'Payment Confirmation', description: 'Receipt sent to customers after payment' },
  { id: 'payment_notification', name: 'Payment Notification', description: 'Notification sent to you when you receive a payment' },
  { id: 'subscription_confirmation', name: 'Subscription Confirmation', description: 'Confirmation when a customer subscribes' },
  { id: 'subscription_cancelled', name: 'Subscription Cancelled', description: 'Confirmation when a subscription is cancelled' },
  { id: 'payment_failed', name: 'Payment Failed', description: 'Notification when a payment fails' },
] as const;

// GET - List all email templates for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();

    const { id } = await params;
    const organizationId = parseInt(id);
    
    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all templates for this organization
    const templates = await prisma.emailTemplate.findMany({
      where: { organizationId },
      orderBy: { templateType: 'asc' },
    });

    // Map to include default values for templates that don't exist
    const templatesWithDefaults = EMAIL_TEMPLATE_TYPES.map((type) => {
      const existing = templates.find((t) => t.templateType === type.id);
      return {
        templateType: type.id,
        name: type.name,
        description: type.description,
        subject: existing?.subject || getDefaultSubject(type.id),
        heading: existing?.heading || getDefaultHeading(type.id),
        bodyText: existing?.bodyText || getDefaultBodyText(type.id),
        buttonText: existing?.buttonText || getDefaultButtonText(type.id),
        footerText: existing?.footerText || '',
        isActive: existing?.isActive ?? true,
        isCustomized: !!existing,
      };
    });

    return NextResponse.json(templatesWithDefaults);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
  }
}

// PUT - Update an email template
const updateTemplateSchema = z.object({
  templateType: z.string(),
  subject: z.string().optional(),
  heading: z.string().optional(),
  bodyText: z.string().optional(),
  buttonText: z.string().optional(),
  footerText: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();

    const { id } = await params;
    const organizationId = parseInt(id);
    
    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateTemplateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request', details: validation.error.issues }, { status: 400 });
    }

    const { templateType, ...data } = validation.data;

    // Upsert the template
    const template = await prisma.emailTemplate.upsert({
      where: {
        organizationId_templateType: {
          organizationId,
          templateType,
        },
      },
      create: {
        organizationId,
        templateType,
        ...data,
      },
      update: data,
    });

    return NextResponse.json(template);
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 });
  }
}

// DELETE - Reset a template to defaults
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();

    const { id } = await params;
    const organizationId = parseInt(id);
    
    // Verify user has access to this organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        userId: currentUser.userId,
      },
      select: {
        id: true,
        // Note: primaryColor, backgroundColor, buttonTextColor columns don't exist in database
      },
    });
    
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('templateType');

    if (!templateType) {
      return NextResponse.json({ error: 'templateType is required' }, { status: 400 });
    }

    // Delete the template (will revert to defaults)
    await prisma.emailTemplate.deleteMany({
      where: {
        organizationId,
        templateType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error resetting email template:', error);
    return NextResponse.json({ error: 'Failed to reset email template' }, { status: 500 });
  }
}

// Default values for each template type
function getDefaultSubject(type: string): string {
  const defaults: Record<string, string> = {
    portal_login: 'Your {{organization}} verification code: {{code}}',
    invoice: 'Invoice {{invoice_number}} from {{organization}} - {{amount}}',
    payment_confirmation: 'Payment receipt from {{organization}} - {{amount}}',
    payment_notification: '💰 Payment received: {{amount}} from {{customer_name}}',
    subscription_confirmation: 'Subscription confirmed with {{organization}}',
    subscription_cancelled: 'Subscription cancelled - {{organization}}',
    payment_failed: 'Action required: Payment failed - {{organization}}',
  };
  return defaults[type] || '';
}

function getDefaultHeading(type: string): string {
  const defaults: Record<string, string> = {
    portal_login: 'Your Verification Code',
    invoice: 'Invoice {{invoice_number}}',
    payment_confirmation: 'Payment Successful',
    payment_notification: 'New Payment Received',
    subscription_confirmation: 'Subscription Confirmed',
    subscription_cancelled: 'Subscription Cancelled',
    payment_failed: 'Payment Failed',
  };
  return defaults[type] || '';
}

function getDefaultBodyText(type: string): string {
  const defaults: Record<string, string> = {
    portal_login: 'Use this code to sign in to your customer portal. This code expires in 10 minutes.',
    invoice: 'You have a new invoice from {{organization}}.',
    payment_confirmation: 'Your payment to {{organization}} has been processed successfully.',
    payment_notification: "You've received a new payment for {{organization}}.",
    subscription_confirmation: 'Your subscription with {{organization}} is now active.',
    subscription_cancelled: 'Your subscription with {{organization}} has been cancelled as requested.',
    payment_failed: 'We were unable to process your payment of {{amount}} to {{organization}}.',
  };
  return defaults[type] || '';
}

function getDefaultButtonText(type: string): string {
  const defaults: Record<string, string> = {
    portal_login: '',
    invoice: 'View & Pay Invoice',
    payment_confirmation: '',
    payment_notification: 'View in Dashboard',
    subscription_confirmation: '',
    subscription_cancelled: '',
    payment_failed: 'Update Payment Method',
  };
  return defaults[type] || '';
}

