import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/chat - List all conversations
export async function GET() {
  try {
    await requireAdmin();

    const conversations = await prisma.chatConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, createdOn: true },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        status: c.status,
        unreadByAdmin: c.unreadByAdmin,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          firstName: c.user.firstName,
          lastName: c.user.lastName,
          email: c.user.email,
          createdOn: c.user.createdOn,
        },
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content.substring(0, 100) + (c.messages[0].content.length > 100 ? '...' : ''),
              senderType: c.messages[0].senderType,
              createdAt: c.messages[0].createdAt,
            }
          : null,
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin chat list error:', error);
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}
