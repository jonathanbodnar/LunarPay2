import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendNewTicketNotification } from '@/lib/email';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  message: z.string().min(1, 'Message is required'),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
});

// GET /api/tickets - List user's tickets
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const tickets = await prisma.ticket.findMany({
      where: { userId: currentUser.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      tickets: tickets.map(t => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: t._count.messages,
        lastMessage: t.messages[0] ? {
          message: t.messages[0].message.substring(0, 100) + (t.messages[0].message.length > 100 ? '...' : ''),
          isAdminReply: t.messages[0].isAdminReply,
          createdAt: t.messages[0].createdAt,
        } : null,
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List tickets error:', error);
    return NextResponse.json({ error: 'Failed to list tickets' }, { status: 500 });
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = createTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { subject, message, category, priority } = validation.data;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Get user's organization if any
    const organization = await prisma.organization.findFirst({
      where: { userId: currentUser.userId },
      select: { id: true, name: true },
    });

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        userId: currentUser.userId,
        organizationId: organization?.id || null,
        subject,
        category,
        priority,
      },
    });

    // Generate ticket number
    const ticketNumber = `TKT-${String(ticket.id).padStart(6, '0')}`;
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { ticketNumber },
    });

    // Create initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: currentUser.userId,
        message,
        isAdminReply: false,
      },
    });

    // Send email notification to admin
    try {
      await sendNewTicketNotification({
        ticketNumber,
        subject,
        message,
        category: category || 'General',
        priority,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Unknown User',
        userEmail: user?.email || currentUser.email,
        organizationName: organization?.name || 'No organization',
      });
    } catch (emailError) {
      console.error('Failed to send ticket notification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber,
        subject,
        status: 'open',
        priority,
        category,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

