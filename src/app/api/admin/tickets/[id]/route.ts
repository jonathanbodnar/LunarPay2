import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

// GET /api/admin/tickets/[id] - Get ticket with messages (super admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        closedAt: ticket.closedAt,
        user: {
          id: ticket.user.id,
          name: `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email,
          email: ticket.user.email,
        },
        organization: ticket.organization ? {
          id: ticket.organization.id,
          name: ticket.organization.name,
        } : null,
        messages: ticket.messages.map(m => ({
          id: m.id,
          message: m.message,
          isAdminReply: m.isAdminReply,
          createdAt: m.createdAt,
          user: {
            id: m.user.id,
            name: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim() || m.user.email,
            email: m.user.email,
          },
        })),
      },
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get admin ticket error:', error);
    return NextResponse.json({ error: 'Failed to get ticket' }, { status: 500 });
  }
}

// PATCH /api/admin/tickets/[id] - Update ticket status (super admin)
export async function PATCH(
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

    const validation = updateTicketSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = {
      ...validation.data,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (validation.data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    } else if (validation.data.status === 'closed') {
      updateData.closedAt = new Date();
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: updatedTicket.id,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        updatedAt: updatedTicket.updatedAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update admin ticket error:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}

