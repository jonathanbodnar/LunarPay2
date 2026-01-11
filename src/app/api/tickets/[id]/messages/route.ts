import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// POST /api/tickets/[id]/messages - Add a message to ticket
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
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

    // Determine if this is an admin reply
    let isAdminReply = false;
    if (ticket.userId !== currentUser.userId) {
      // Check if user is admin
      const isAdmin = await prisma.organization.findFirst({
        where: { userId: currentUser.userId },
      });
      
      if (!isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      isAdminReply = true;
    }

    // Create message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: currentUser.userId,
        message,
        isAdminReply,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Update ticket status to in_progress if it was open and admin replied
    if (isAdminReply && ticket.status === 'open') {
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
          name: `${ticketMessage.user.firstName || ''} ${ticketMessage.user.lastName || ''}`.trim() || ticketMessage.user.email,
          email: ticketMessage.user.email,
        },
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

