import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const replySchema = z.object({
  content: z.string().min(1).max(2000),
});

// GET /api/admin/chat/[id] - Fetch conversation + messages, mark read
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const conversationId = parseInt(id);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, createdOn: true },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Mark all unread user/system messages as read by admin
    const hasUnreadUserMsgs = conversation.messages.some(
      (m) => (m.senderType === 'user' || m.senderType === 'system') && !m.readAt
    );

    if (conversation.unreadByAdmin > 0 || hasUnreadUserMsgs) {
      await prisma.$transaction([
        ...(conversation.unreadByAdmin > 0
          ? [prisma.chatConversation.update({
              where: { id: conversationId },
              data: { unreadByAdmin: 0 },
            })]
          : []),
        ...(hasUnreadUserMsgs
          ? [prisma.chatMessage.updateMany({
              where: {
                conversationId,
                senderType: { in: ['user', 'system'] },
                readAt: null,
              },
              data: { readAt: new Date() },
            })]
          : []),
      ]);
    }

    // Re-fetch messages if any were updated
    const freshMessages = hasUnreadUserMsgs
      ? (await prisma.chatMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'asc' },
        }))
      : conversation.messages;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        user: conversation.user,
      },
      messages: freshMessages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin chat detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// POST /api/admin/chat/[id] - Send admin reply
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const conversationId = parseInt(id);
    if (isNaN(conversationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = replySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderType: 'admin',
        content: validation.data.content,
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadByUser: { increment: 1 },
        unreadByAdmin: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'AdminUnauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Admin chat reply error:', error);
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 });
  }
}
