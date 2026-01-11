import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tickets - List all tickets (super admin only)
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Open tickets first
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // Count by status
    const statusCounts = await prisma.ticket.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const counts = {
      all: tickets.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      archived: 0,
    };

    statusCounts.forEach(sc => {
      counts[sc.status as keyof typeof counts] = sc._count.id;
    });
    counts.all = Object.values(counts).reduce((a, b) => a + b, 0) - counts.all;

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
        user: {
          id: t.user.id,
          name: `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email,
          email: t.user.email,
        },
        organization: t.organization ? {
          id: t.organization.id,
          name: t.organization.name,
        } : null,
        messageCount: t._count.messages,
        lastMessage: t.messages[0] ? {
          message: t.messages[0].message.substring(0, 100) + (t.messages[0].message.length > 100 ? '...' : ''),
          isAdminReply: t.messages[0].isAdminReply,
          createdAt: t.messages[0].createdAt,
        } : null,
      })),
      counts,
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List admin tickets error:', error);
    return NextResponse.json({ error: 'Failed to list tickets' }, { status: 500 });
  }
}

