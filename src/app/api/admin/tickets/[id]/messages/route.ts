import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// POST /api/admin/tickets/[id]/messages - Add a message as admin
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ticketId = parseInt(id);
    const body = await request.json();

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const validation = createMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { message } = validation.data;

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get or create a system admin user for admin replies
    // Using the ticket owner's user_id for now, but marking as admin reply
    // In production, you'd have a dedicated admin user
    const adminUserId = ticket.userId;

    // Create message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: adminUserId, // Using ticket owner's ID, but isAdminReply=true
        message,
        isAdminReply: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Update ticket status to in_progress if it was open
    if (ticket.status === 'open') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
          status: 'in_progress',
          updatedAt: new Date(),
        },
      });
    }

    // Update ticket's updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: ticketMessage.id,
        message: ticketMessage.message,
        isAdminReply: ticketMessage.isAdminReply,
        createdAt: ticketMessage.createdAt,
        user: {
          id: ticketMessage.user.id,
          name: 'LunarPay Support',
          email: 'support@lunarpay.com',
        },
      },
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create admin message error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

